// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAW0PbcufDW1qcG4RkFOC1lezThYSl3_pI",
  authDomain: "cs2-tactics-d229a.firebaseapp.com",
  projectId: "cs2-tactics-d229a",
  storageBucket: "cs2-tactics-d229a.firebasestorage.app",
  messagingSenderId: "563685919534",
  appId: "1:563685919534:web:b6102ba41164d0460908bf",
  measurementId: "G-JZP3TKLR67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = getAuth(app);

// Firestore
export const db = getFirestore(app);

export default app;