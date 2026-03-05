import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAW0PbcufDW1qcG4RkFOC1lezThYSl3_pI',
  authDomain: 'cs2-tactics-d229a.firebaseapp.com',
  projectId: 'cs2-tactics-d229a',
  storageBucket: 'cs2-tactics-d229a.firebasestorage.app',
  messagingSenderId: '563685919534',
  appId: '1:563685919534:web:b6102ba41164d0460908bf',
  measurementId: 'G-JZP3TKLR67',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
