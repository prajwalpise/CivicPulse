/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

console.log("Firebase config loaded. API Key length:", firebaseConfig.apiKey.length, "Prefix:", firebaseConfig.apiKey.substring(0, 10), "Auth Domain:", firebaseConfig.authDomain);

// Check if all essential keys are provided
export let isFirebaseConfigured = 
  firebaseConfig.apiKey !== "" && 
  firebaseConfig.projectId !== "" && 
  firebaseConfig.authDomain !== "";

export function disableFirebase() {
  isFirebaseConfigured = false;
  console.warn("Firebase features disabled dynamically. Operating in local demo fallback mode.");
}

let app;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase environment variables are missing. CivicPulse will run in Demo/Local-Storage Mode.");
}

export { db, auth, googleProvider };
