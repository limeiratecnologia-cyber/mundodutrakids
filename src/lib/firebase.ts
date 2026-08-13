import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, getDocFromServer } from "firebase/firestore";

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
  throw new Error(JSON.stringify(errInfo));
}

// --- Validate Connection to Firestore at Boot (CRITICAL CONSTRAINT) ---
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. Client is offline.");
    }
  }
}
testConnection();

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

async function shrinkBase64IfNeeded(val: string, targetMaxDim: number = 300, quality: number = 0.45): Promise<string> {
  if (typeof val === "string" && val.startsWith("data:image/") && val.length > 20000) {
    return new Promise((resolve) => {
      let isSettled = false;
      const done = (result: string) => {
        if (!isSettled) {
          isSettled = true;
          resolve(result);
        }
      };

      // Strict 1 second timeout to prevent blocking Firestore writes
      const timeoutId = setTimeout(() => {
        done(val);
      }, 1000);

      if (typeof window === "undefined") {
        clearTimeout(timeoutId);
        done(val);
        return;
      }

      try {
        const img = new Image();
        img.onload = () => {
          clearTimeout(timeoutId);
          try {
            let width = img.width || targetMaxDim;
            let height = img.height || targetMaxDim;
            const maxDim = targetMaxDim;
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              done(canvas.toDataURL("image/jpeg", quality));
              return;
            }
          } catch (err) {
            console.error("Canvas shrink error:", err);
          }
          done(val);
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
          done(val);
        };
        img.src = val;
      } catch (e) {
        clearTimeout(timeoutId);
        done(val);
      }
    });
  }
  return val;
}

/**
 * Saves the entire SystemState to Firebase Firestore safely with payload size guards
 */
export async function saveStateToFirebase(state: any) {
  try {
    let cleanedState = cleanUndefined(state);

    // Compress base64 images inside products to keep payload ultra light (~100-200KB total)
    if (cleanedState.products && Array.isArray(cleanedState.products)) {
      cleanedState.products = await Promise.all(
        cleanedState.products.map(async (p: any) => {
          let mainImg = p.image || "";
          let imgs = Array.isArray(p.images) ? p.images : [];

          if (typeof mainImg === "string" && mainImg.startsWith("data:image/")) {
            mainImg = await shrinkBase64IfNeeded(mainImg, 300, 0.45);
          }

          const processedImgs = await Promise.all(
            imgs.map(async (img: any) => {
              if (typeof img === "string" && img.startsWith("data:image/")) {
                return await shrinkBase64IfNeeded(img, 280, 0.4);
              }
              return img;
            })
          );

          // Avoid duplicating identical images in gallery
          const uniqueImgs = Array.from(new Set([mainImg, ...processedImgs])).filter(Boolean);

          return {
            ...p,
            image: mainImg,
            images: uniqueImgs.slice(0, 10)
          };
        })
      );
    }

    // Safety check: Never overwrite an existing populated product catalog with an empty list
    if (!cleanedState.products || (Array.isArray(cleanedState.products) && cleanedState.products.length === 0)) {
      try {
        const existingDoc = await getStateFromFirebase();
        if (existingDoc && Array.isArray(existingDoc.products) && existingDoc.products.length > 0) {
          console.warn("Prevented overwriting populated products with an empty array!");
          cleanedState.products = existingDoc.products;
        }
      } catch (e) {
        console.error("Error during empty state guard check:", e);
      }
    }

    // Safety check: ensure stringified document size is well under 1MB (1,048,576 bytes)
    const jsonString = JSON.stringify(cleanedState);
    if (jsonString.length > 700000) {
      console.warn("Payload size nearing 1MB Firestore limit, applying extra compression...");
      if (cleanedState.products && Array.isArray(cleanedState.products)) {
        cleanedState.products = await Promise.all(
          cleanedState.products.map(async (p: any) => ({
            ...p,
            image: await shrinkBase64IfNeeded(p.image || "", 200, 0.35),
            images: [await shrinkBase64IfNeeded(p.image || "", 200, 0.35)]
          }))
        );
      }
    }

    const docRef = doc(db, STATE_DOC_PATH);
    await setDoc(docRef, cleanedState);
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
 * Fetches the current state from Firebase Firestore
 */
export async function getStateFromFirebase(): Promise<any | null> {
  try {
    const docRef = doc(db, STATE_DOC_PATH);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, STATE_DOC_PATH);
  }
  return null;
}

/**
 * Listens to real-time changes in the Firebase state
 */
export function listenToFirebaseState(onUpdate: (state: any) => void) {
  const docRef = doc(db, STATE_DOC_PATH);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error("Firestore error listening to state:", error);
    }
  );
}

