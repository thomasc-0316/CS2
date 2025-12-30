// Firebase initialization shared by native + web.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth: web needs getAuth (for popup/redirect), native uses initializeAuth + AsyncStorage persistence.
let authInstance;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  // Lazy import to avoid bundling react-native auth persistence on web.
  // eslint-disable-next-line global-require
  const { getReactNativePersistence } = require('firebase/auth/react-native');
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Storage
export const storage = getStorage(app);

// Initialize Auth
export const auth = authInstance;

// Firestore
export const db = getFirestore(app);

export default app;
