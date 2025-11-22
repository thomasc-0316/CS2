// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAW0PbcufDW1qcG4RkFOC1lezThYSl3_pI",
  authDomain: "cs2-tactics-d229a.firebaseapp.com",
  projectId: "cs2-tactics-d229a",
  storageBucket: "cs2-tactics-d229a.firebasestorage.app",
  messagingSenderId: "563685919534",
  appId: "1:563685919534:web:b6102ba41164d0460908bf",
  measurementId: "G-JZP3TKLR67"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
