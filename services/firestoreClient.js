import * as firestore from 'firebase/firestore';
import {
  beginListener,
  endListener,
  trackNetworkCall,
} from './perfMonitor';

export * from 'firebase/firestore';

const getTargetPath = (value) => {
  if (!value) return 'unknown';
  if (typeof value.path === 'string') return value.path;
  if (typeof value.id === 'string') return value.id;
  return 'unknown';
};

export const getDoc = (...args) => {
  trackNetworkCall('firestore.getDoc', getTargetPath(args[0]));
  return firestore.getDoc(...args);
};

export const getDocs = (...args) => {
  trackNetworkCall('firestore.getDocs', getTargetPath(args[0]));
  return firestore.getDocs(...args);
};

export const addDoc = (...args) => {
  trackNetworkCall('firestore.addDoc', getTargetPath(args[0]));
  return firestore.addDoc(...args);
};

export const setDoc = (...args) => {
  trackNetworkCall('firestore.setDoc', getTargetPath(args[0]));
  return firestore.setDoc(...args);
};

export const updateDoc = (...args) => {
  trackNetworkCall('firestore.updateDoc', getTargetPath(args[0]));
  return firestore.updateDoc(...args);
};

export const deleteDoc = (...args) => {
  trackNetworkCall('firestore.deleteDoc', getTargetPath(args[0]));
  return firestore.deleteDoc(...args);
};

export const runTransaction = (...args) => {
  trackNetworkCall('firestore.runTransaction', 'db');
  return firestore.runTransaction(...args);
};

export const onSnapshot = (...args) => {
  const token = beginListener(getTargetPath(args[0]));
  let unsubscribed = false;
  const unsubscribe = firestore.onSnapshot(...args);
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;
    endListener(token);
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
};
