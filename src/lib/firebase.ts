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
  writeBatch,
  getDocFromServer
} from "firebase/firestore";
import { compressBase64Image } from "../utils/imageCompressor";
import { Product, SystemState, Order, Category } from "../types";

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

// Initialize Firestore with the custom database ID provisioned for this applet
export const db = getFirestore(app, "ai-studio-mundodutrakids-1f651df0-9fa5-42b8-abd2-f75b07a41ac3");

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "store_config", "general"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Client is offline or initializing connection.");
    }
  }
}
testConnection();

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

  // Preserve explicit gender / section choice, default to 'menino' rather than unissex if blank
  const sessionValue = product.gender || product.section || "menino";

  return cleanUndefined({
    ...product,
    image: mainImg,
    images: uniqueImgs.slice(0, 8),
    gender: sessionValue,
    section: sessionValue
  });
}

/**
 * Saves a single product directly into the 'products' collection in Firestore
 */
export async function syncSingleProductToFirebase(product: Product) {
  try {
    const sanitized = await sanitizeProductForCloud(product);
    const docRef = doc(db, PRODUCTS_COLLECTION, sanitized.id);
    await setDoc(docRef, sanitized, { merge: true });
    console.log(`[Firebase] Product ${product.id} synced directly (session: ${sanitized.gender}).`);
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
 * Saves categories directly into 'store_config/general' in Firestore immediately without delay
 */
export async function syncCategoriesToFirebase(categories: Category[]) {
  try {
    const sanitizedCategories = categories.map(c => {
      const sec = c.section || c.gender || "menino";
      return cleanUndefined({
        id: c.id,
        name: c.name,
        description: c.description || "",
        section: sec,
        gender: sec
      });
    });
    const docRef = doc(db, CONFIG_DOC_PATH);
    await setDoc(docRef, { categories: sanitizedCategories }, { merge: true });
    console.log(`[Firebase] Categories synced directly to cloud:`, sanitizedCategories);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, CONFIG_DOC_PATH);
  }
}

// Queue management for state synchronization to prevent write stream exhaustion
let saveTimeout: any = null;
let isSaving = false;
let pendingStateToSave: any = null;

/**
 * Internal worker that performs batched writes to Firestore
 */
async function performBatchedStateSave(state: any) {
  if (isSaving) {
    pendingStateToSave = state;
    return;
  }

  isSaving = true;

  try {
    const cleanedState = cleanUndefined(state);

    // 1. Write products using atomic writeBatch (up to 500 per batch, single write stream request)
    if (Array.isArray(cleanedState.products) && cleanedState.products.length > 0) {
      const batch = writeBatch(db);
      
      for (const p of cleanedState.products) {
        if (!p || !p.id) continue;
        const sanitized = await sanitizeProductForCloud(p);
        const prodDocRef = doc(db, PRODUCTS_COLLECTION, sanitized.id);
        batch.set(prodDocRef, sanitized, { merge: true });
      }

      await batch.commit();
    }

    // 2. Prepare store configurations
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

    // Save general config with single write
    await setDoc(doc(db, CONFIG_DOC_PATH), cleanUndefined(configData), { merge: true });

    console.log("[Firebase] Store state batched & synced successfully.");
  } catch (error) {
    console.error("Firestore Batched Save Error:", error);
    // Keep local storage updated
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("mundo_dutra_kids_state", JSON.stringify(state));
      }
    } catch (e) {
      console.error("LocalStorage fallback error:", e);
    }
  } finally {
    isSaving = false;
    if (pendingStateToSave) {
      const nextState = pendingStateToSave;
      pendingStateToSave = null;
      performBatchedStateSave(nextState);
    }
  }
}

/**
 * Debounced save to Firestore preventing write stream exhaustion
 */
export function saveStateToFirebase(state: any, immediate: boolean = false) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  if (immediate) {
    performBatchedStateSave(state);
    return;
  }

  saveTimeout = setTimeout(() => {
    performBatchedStateSave(state);
  }, 800);
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

    // If products collection is empty but config has products, use those products
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
 * Listens to real-time changes across both 'products' collection and 'store_config/general',
 * ensuring instant cross-device updates across iPhone, iPad, Android, and Desktop without write feedback loops.
 */
export function listenToFirebaseState(onUpdate: (state: any) => void) {
  let latestProducts: Product[] | null = null;
  let latestConfig: any = {};
  let initialConfigLoaded = false;
  let initialProductsLoaded = false;

  const emitCombinedState = () => {
    // Wait until both or at least one has delivered real data
    if (!initialConfigLoaded && !initialProductsLoaded) return;

    const combined: any = {
      ...latestConfig
    };

    // Strict Rule: Products come ONLY from the dedicated 'products' collection in Firestore
    if (latestProducts !== null && latestProducts.length > 0) {
      combined.products = latestProducts;
    } else {
      delete combined.products;
    }

    onUpdate(combined);
  };

  // 1. Listen to products collection
  const unsubscribeProducts = onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      initialProductsLoaded = true;
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        const raw = doc.data() as Product;
        const session = raw.gender || raw.section || "menino";
        prods.push({
          ...raw,
          gender: session,
          section: session
        });
      });
      latestProducts = prods;
      emitCombinedState();
    },
    (err) => {
      console.warn("Firestore products collection listener notice:", err);
    }
  );

  // 2. Listen to store_config/general
  const unsubscribeConfig = onSnapshot(
    doc(db, CONFIG_DOC_PATH),
    (docSnap) => {
      initialConfigLoaded = true;
      if (docSnap.exists()) {
        const data = { ...docSnap.data() };
        
        // CRITICAL: Delete any legacy products embedded in config doc so it never overwrites the actual products collection
        delete data.products;

        let cats = data.categories;
        if (Array.isArray(cats)) {
          cats = cats.map((c: any) => {
            const sec = c.section || c.gender || "menino";
            return {
              ...c,
              section: sec,
              gender: sec
            };
          });
        }
        latestConfig = { ...latestConfig, ...data, categories: cats || latestConfig.categories };
        emitCombinedState();
      }
    },
    (err) => {
      console.warn("Firestore config listener notice:", err);
    }
  );

  return () => {
    unsubscribeProducts();
    unsubscribeConfig();
  };
}
