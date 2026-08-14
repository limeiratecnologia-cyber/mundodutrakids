import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, getDocFromServer } from "firebase/firestore";
import { compressBase64Image } from "../utils/imageCompressor";

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
  if (typeof val === "string" && val.length > 15000 && !val.startsWith("http://") && !val.startsWith("https://")) {
    try {
      return await compressBase64Image(val, targetMaxDim, targetMaxDim, quality);
    } catch (e) {
      return val;
    }
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

          mainImg = await shrinkBase64IfNeeded(mainImg, 300, 0.45);

          const processedImgs = await Promise.all(
            imgs.map(async (img: any) => {
              return await shrinkBase64IfNeeded(img, 280, 0.4);
            })
          );

          // Avoid duplicating identical images in gallery
          const uniqueImgs = Array.from(new Set([mainImg, ...processedImgs])).filter(Boolean);

          return {
            ...p,
            image: mainImg,
            images: uniqueImgs.slice(0, 8)
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
    let jsonString = JSON.stringify(cleanedState);
    if (jsonString.length > 550000) {
      console.warn("Payload size nearing Firestore limit, applying maximum compression...");
      if (cleanedState.products && Array.isArray(cleanedState.products)) {
        cleanedState.products = await Promise.all(
          cleanedState.products.map(async (p: any) => {
            const smallImg = await shrinkBase64IfNeeded(p.image || "", 200, 0.35);
            return {
              ...p,
              image: smallImg,
              images: [smallImg]
            };
          })
        );
      }
      // Trim audit logs if array is huge
      if (Array.isArray(cleanedState.auditLogs) && cleanedState.auditLogs.length > 50) {
        cleanedState.auditLogs = cleanedState.auditLogs.slice(0, 50);
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

