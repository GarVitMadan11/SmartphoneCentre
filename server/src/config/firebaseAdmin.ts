/**
 * Firebase Admin SDK Initialization (Backend Server)
 * Reads credentials strictly from secure server-only environment variables.
 * NEVER exposed to the frontend client bundle.
 */
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let firebaseAdminApp: App | null = null;

function getServiceAccountCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle escaped newlines from environment variable strings
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  // Alternative: JSON service account payload in FIREBASE_SERVICE_ACCOUNT_JSON
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      return cert(parsed);
    } catch (err) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err);
    }
  }

  return null;
}

export function initFirebaseAdmin(): App | null {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAdminApp = existingApps[0]!;
    return firebaseAdminApp;
  }

  const credential = getServiceAccountCredentials();

  if (credential) {
    firebaseAdminApp = initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log(`🔥 [Firebase Admin] Initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);
    return firebaseAdminApp;
  }

  // Fallback to Application Default Credentials (if deployed in GCP environment)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      firebaseAdminApp = initializeApp();
      console.log('🔥 [Firebase Admin] Initialized with Application Default Credentials');
      return firebaseAdminApp;
    } catch (err) {
      console.warn('[Firebase Admin] Could not initialize with default credentials:', err);
    }
  }

  console.info('[Firebase Admin] Not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable.');
  return null;
}

// Lazy getters for Firestore & Auth
export const getAdminAuth = (): Auth | null => {
  const app = initFirebaseAdmin();
  return app ? getAuth(app) : null;
};

export const getAdminDb = (): Firestore | null => {
  const app = initFirebaseAdmin();
  return app ? getFirestore(app) : null;
};
