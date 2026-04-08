import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = import.meta.env as Record<string, string | undefined>;
const readViteEnv = (key: string, fallback: string) => {
  const value = env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const firebaseConfig = {
  apiKey: readViteEnv('VITE_FIREBASE_API_KEY', 'AIzaSyAW0PbcufDW1qcG4RkFOC1lezThYSl3_pI'),
  authDomain: readViteEnv('VITE_FIREBASE_AUTH_DOMAIN', 'cs2-tactics-d229a.firebaseapp.com'),
  projectId: readViteEnv('VITE_FIREBASE_PROJECT_ID', 'cs2-tactics-d229a'),
  storageBucket: readViteEnv('VITE_FIREBASE_STORAGE_BUCKET', 'cs2-tactics-d229a.firebasestorage.app'),
  messagingSenderId: readViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '563685919534'),
  appId: readViteEnv('VITE_FIREBASE_APP_ID', '1:563685919534:web:b6102ba41164d0460908bf'),
  measurementId: readViteEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-JZP3TKLR67'),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
