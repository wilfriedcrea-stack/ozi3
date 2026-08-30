import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_API_KEY || "AIzaSyDCab5xg3OmPDRRv_PZa7gLFfjH79IHFrA",
  authDomain: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_AUTH_DOMAIN || "4RAuuM96XwXNa4LchaSmR6OrXDz2.firebaseapp.com",
  projectId: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_PROJECT_ID || "4RAuuM96XwXNa4LchaSmR6OrXDz2",
  storageBucket: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_STORAGE_BUCKET || "4RAuuM96XwXNa4LchaSmR6OrXDz2.firebasestorage.app",
  messagingSenderId: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "402737712210",
  appId: (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_FIREBASE_APP_ID || "1:402737712210:web:797eca50aa3708aa6d638b"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const db = getFirestore(app);
export const storage = getStorage(app);

export default db;
