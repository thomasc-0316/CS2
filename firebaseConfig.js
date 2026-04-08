// Firebase initialization shared by native + web.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// All Firebase config now comes from EXPO_PUBLIC_* env variables.
// Tests inject defaults via jest.setup.js; production builds load from .env.
// Hardcoded fallbacks were removed so a missing config fails loudly instead
// of silently shipping the wrong project.
const readExpoEnv = (key) => {
  const value = process.env?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const requireEnv = (key) => {
  const value = readExpoEnv(key);
  if (!value) {
    // Defer hard failure to runtime so jest test harnesses can swap in shims,
    // but make the error obvious if we ever boot with a missing config.
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        `Missing required Firebase env var: ${key}. ` +
        `Set it in your .env (see .env.example) before running the app.`
      );
    }
    return `__MISSING_${key}__`;
  }
  return value;
};

const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: readExpoEnv('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID') || undefined,
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
