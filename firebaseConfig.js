// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Initialize Auth with React Native persistence
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // If Auth was already initialized (hot reload), fall back to the existing instance
  authInstance = getAuth(app);
}

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = authInstance;

// Firestore
export const db = getFirestore(app);

export default app;
