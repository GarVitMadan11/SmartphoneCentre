/**
 * Firebase Client SDK Initialization (Web)
 * Reads configuration strictly from Vite environment variables (VITE_FIREBASE_*)
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBmhYvC0BrBU6hXVVFu4GwUigZsM0NEMD0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rephonix-f2cfa.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rephonix-f2cfa',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rephonix-f2cfa.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '730993464038',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:730993464038:web:b31db03a76e5355c7a6127',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-FGXD69F6MB',
};

// Check if valid configuration is provided
export const isFirebaseClientConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your_')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseClientConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.info('[Firebase] Client SDK not initialized. Set VITE_FIREBASE_* env variables to enable.');
}

export { app, auth, db };

