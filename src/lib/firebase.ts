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

/**
 * Saves the entire SystemState to Firebase Firestore
 */
export async function saveStateToFirebase(state: any) {
  try {
    const docRef = doc(db, STATE_DOC_PATH);
    await setDoc(docRef, state);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STATE_DOC_PATH);
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
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, STATE_DOC_PATH);
    }
  );
}

