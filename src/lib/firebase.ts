import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer
} from "firebase/firestore";
import { compressBase64Image } from "../utils/imageCompressor";
import { Product, SystemState, Order } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCJaMqFkHxfuUk7dLnBE2md9WyGkNZ94do",
  authDomain: "single-vertex-fj1d7.firebaseapp.com",
  projectId: "single-vertex-fj1d7",
  storageBucket: "single-vertex-fj1d7.firebasestorage.app",
  messagingSenderId: "1066850505670",
  appId: "1:1066850505670:web:d8a88c264d0f9f7191d8c7"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID provisioned for this applet
export const db = getFirestore(app, "ai-studio-mundodutrakids-1f651df0-9fa5-42b8-abd2-f75b07a41ac3");

const STATE_DOC_PATH = "store_data/state";
const CONFIG_DOC_PATH = "store_config/general";
const PRODUCTS_COLLECTION = "products";

// --- Firestore Error Handling conformant with Firebase Integration Skill ---
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

// Clean undefined values so Firestore does not reject writes
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        res[key] = cleanUndefined(val);
      }
    }
    return res;
  }
  return obj;
}

// Compress base64 strings safely to prevent exceeding Firestore limits
async function shrinkBase64IfNeeded(val: string, targetMaxDim: number = 400, quality: number = 0.5): Promise<string> {
  if (typeof val === "string" && val.length > 10000 && !val.startsWith("http://") && !val.startsWith("https://")) {
    try {
      return await compressBase64Image(val, targetMaxDim, targetMaxDim, quality);
    } catch (e) {
      return val;
    }
  }
  return val;
}

/**
 * Sanitizes and compresses a product before saving to Firestore
 */
export async function sanitizeProductForCloud(product: Product): Promise<Product> {
  let mainImg = product.image || "";
  let imgs = Array.isArray(product.images) ? product.images : [];

  mainImg = await shrinkBase64IfNeeded(mainImg, 400, 0.55);

  const processedImgs = await Promise.all(
    imgs.map(async (img) => {
      return await shrinkBase64IfNeeded(img, 360, 0.5);
    })
  );

  const uniqueImgs = Array.from(new Set([mainImg, ...processedImgs])).filter(Boolean);

  return cleanUndefined({
    ...product,
    image: mainImg,
    images: uniqueImgs.slice(0, 8)
  });
}

/**
 * Saves a single product directly into the 'products' collection in Firestore
 */
export async function syncSingleProductToFirebase(product: Product) {
  try {
    const sanitized = await sanitizeProductForCloud(product);
    const docRef = doc(db, PRODUCTS_COLLECTION, sanitized.id);
    await setDoc(docRef, sanitized);
    console.log(`[Firebase] Product ${product.id} synced directly.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${product.id}`);
  }
}

/**
 * Deletes a single product from the 'products' collection in Firestore
 */
export async function deleteSingleProductFromFirebase(productId: string) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
    console.log(`[Firebase] Product ${productId} deleted from cloud.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${productId}`);
  }
}

/**
 * Saves the entire SystemState to Firebase Firestore with multi-collection resilience:
 * - Each product is saved to 'products/{productId}'
 * - Store configuration, banners, landpage, PWA, live shop, and categories to 'store_config/general'
 * - Legacy backup to 'store_data/state'
 */
export async function saveStateToFirebase(state: any) {
  try {
    const cleanedState = cleanUndefined(state);

    // 1. Process and save each product individually in parallel
    if (Array.isArray(cleanedState.products) && cleanedState.products.length > 0) {
      const sanitizedProducts: Product[] = [];
      
      for (const p of cleanedState.products) {
        try {
          const sanitized = await sanitizeProductForCloud(p);
          sanitizedProducts.push(sanitized);
          // Write individual product document
          const prodDocRef = doc(db, PRODUCTS_COLLECTION, sanitized.id);
          await setDoc(prodDocRef, sanitized);
        } catch (prodErr) {
          console.error(`Error saving product ${p?.id} to Firestore:`, prodErr);
        }
      }

      // Check if any deleted products need to be removed from Firestore
      try {
        const cloudProductsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
        const currentIds = new Set(cleanedState.products.map((p: any) => p.id));
        
        for (const cloudDoc of cloudProductsSnap.docs) {
          if (!currentIds.has(cloudDoc.id)) {
            await deleteDoc(cloudDoc.ref);
            console.log(`[Firebase] Cleaned up deleted product ${cloudDoc.id}`);
          }
        }
      } catch (cleanupErr) {
        console.warn("Could not cleanup deleted products:", cleanupErr);
      }
    }

    // 2. Process store configurations (compress banners if base64)
    const configData: any = {
      adminPasscode: cleanedState.adminPasscode || "9310",
      categories: cleanedState.categories || [],
      orders: (cleanedState.orders || []).slice(0, 100),
      transactions: (cleanedState.transactions || []).slice(0, 100),
      shippingNeighborhoods: cleanedState.shippingNeighborhoods || [],
      shippingType: cleanedState.shippingType || "fixed",
      shippingFixedCost: cleanedState.shippingFixedCost ?? 0,
      promotions: cleanedState.promotions || [],
      avisos: cleanedState.avisos || [],
      printing: cleanedState.printing || {},
      live: cleanedState.live || {},
      pwa: cleanedState.pwa || {},
      auditLogs: (cleanedState.auditLogs || []).slice(0, 50),
      landpage: { ...cleanedState.landpage }
    };

    // Compress landpage banners if they are base64
    if (configData.landpage?.bannerImages && Array.isArray(configData.landpage.bannerImages)) {
      configData.landpage.bannerImages = await Promise.all(
        configData.landpage.bannerImages.map(async (b: string) => shrinkBase64IfNeeded(b, 800, 0.6))
      );
    }
    if (configData.landpage?.bannerImage) {
      configData.landpage.bannerImage = await shrinkBase64IfNeeded(configData.landpage.bannerImage, 800, 0.6);
    }
    if (configData.landpage?.logoImage) {
      configData.landpage.logoImage = await shrinkBase64IfNeeded(configData.landpage.logoImage, 300, 0.6);
    }
    if (configData.landpage?.faviconImage) {
      configData.landpage.faviconImage = await shrinkBase64IfNeeded(configData.landpage.faviconImage, 128, 0.6);
    }

    // Save general config
    await setDoc(doc(db, CONFIG_DOC_PATH), cleanUndefined(configData));

    // Also update legacy store_data/state with compact summary
    const legacyDoc = {
      ...configData,
      products: (cleanedState.products || []).map((p: Product) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        price: p.price,
        cost: p.cost,
        image: p.image,
        categoryId: p.categoryId,
        age: p.age,
        status: p.status,
        description: p.description,
        sizes: p.sizes,
        createdAt: p.createdAt
      }))
    };
    await setDoc(doc(db, STATE_DOC_PATH), cleanUndefined(legacyDoc));

    console.log("[Firebase] Entire store state synchronized successfully.");
  } catch (error) {
    console.error("Firestore Save Error:", error);
    // Fallback: keep local storage updated
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("mundo_dutra_kids_state", JSON.stringify(state));
      }
    } catch (e) {
      console.error("LocalStorage fallback error:", e);
    }
  }
}

/**
 * Fetches the current state from Firebase Firestore (products collection + config)
 */
export async function getStateFromFirebase(): Promise<any | null> {
  try {
    // 1. Try reading products collection
    const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products: Product[] = [];
    productsSnap.forEach((d) => {
      products.push(d.data() as Product);
    });

    // 2. Try reading store_config/general
    const configSnap = await getDoc(doc(db, CONFIG_DOC_PATH));
    let configData: any = {};
    if (configSnap.exists()) {
      configData = configSnap.data();
    } else {
      // Fallback to legacy state doc
      const legacySnap = await getDoc(doc(db, STATE_DOC_PATH));
      if (legacySnap.exists()) {
        configData = legacySnap.data();
      }
    }

    // If products collection is empty but legacy doc has products, use legacy products
    let finalProducts = products;
    if (finalProducts.length === 0 && Array.isArray(configData.products) && configData.products.length > 0) {
      finalProducts = configData.products;
    }

    if (finalProducts.length > 0 || Object.keys(configData).length > 0) {
      return {
        ...configData,
        products: finalProducts
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
  }
  return null;
}

/**
 * Listens to real-time changes across both 'products' collection and 'store_config/general'
 * (with automatic legacy fallback), ensuring that any change from iPad, iPhone, Android, or PC
 * is immediately propagated to all connected clients in real time!
 */
export function listenToFirebaseState(onUpdate: (state: any) => void) {
  let latestProducts: Product[] = [];
  let latestConfig: any = {};
  let isProductsLoaded = false;
  let isConfigLoaded = false;

  const emitCombinedState = () => {
    // Combine products and configuration
    const combined = {
      ...latestConfig,
      products: latestProducts.length > 0 ? latestProducts : (latestConfig.products || [])
    };
    onUpdate(combined);
  };

  // 1. Listen to products collection
  const unsubscribeProducts = onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push(doc.data() as Product);
      });
      latestProducts = prods;
      isProductsLoaded = true;
      emitCombinedState();
    },
    (err) => {
      console.warn("Firestore products collection listener error:", err);
      isProductsLoaded = true;
    }
  );

  // 2. Listen to store_config/general
  const unsubscribeConfig = onSnapshot(
    doc(db, CONFIG_DOC_PATH),
    (docSnap) => {
      if (docSnap.exists()) {
        latestConfig = { ...latestConfig, ...docSnap.data() };
        isConfigLoaded = true;
        emitCombinedState();
      } else {
        // Fallback to legacy state doc if store_config/general not yet created
        getDoc(doc(db, STATE_DOC_PATH)).then((legacySnap) => {
          if (legacySnap.exists()) {
            latestConfig = { ...latestConfig, ...legacySnap.data() };
            if (latestProducts.length === 0 && Array.isArray(legacySnap.data().products)) {
              latestProducts = legacySnap.data().products;
            }
            emitCombinedState();
          }
          isConfigLoaded = true;
        }).catch(() => {
          isConfigLoaded = true;
        });
      }
    },
    (err) => {
      console.warn("Firestore config listener error:", err);
      isConfigLoaded = true;
    }
  );

  // 3. Also listen to legacy store_data/state in case an older client writes to it
  const unsubscribeLegacy = onSnapshot(
    doc(db, STATE_DOC_PATH),
    (docSnap) => {
      if (docSnap.exists()) {
        const legacyData = docSnap.data();
        // If products collection is currently empty, sync from legacy
        if (latestProducts.length === 0 && Array.isArray(legacyData.products) && legacyData.products.length > 0) {
          latestProducts = legacyData.products;
          // Automatically seed products collection from legacy doc
          legacyData.products.forEach((p: Product) => {
            setDoc(doc(db, PRODUCTS_COLLECTION, p.id), p).catch(() => {});
          });
        }
        latestConfig = { ...legacyData, ...latestConfig };
        emitCombinedState();
      }
    },
    (err) => {
      console.warn("Firestore legacy state listener error:", err);
    }
  );

  return () => {
    unsubscribeProducts();
    unsubscribeConfig();
    unsubscribeLegacy();
  };
}


