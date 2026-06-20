/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Support environments like Vercel with custom environment variable configurations
let envConfig: any = {};
const metaEnv = (import.meta as any).env || {};
try {
  const envVal = metaEnv.VITE_FIREBASE_CONFIG;
  if (envVal) {
    envConfig = JSON.parse(envVal);
  }
} catch (e) {
  console.warn("VITE_FIREBASE_CONFIG JSON parse error: fallback to properties", e);
}

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || envConfig.apiKey || appletConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || envConfig.authDomain || appletConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || envConfig.projectId || appletConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || envConfig.storageBucket || appletConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || envConfig.messagingSenderId || appletConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || envConfig.appId || appletConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || envConfig.measurementId || appletConfig.measurementId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || envConfig.firestoreDatabaseId || (appletConfig as any).firestoreDatabaseId || '(default)'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize firestore with force long polling to prevent GrpcConnection stream cancellations in proxied environments
let secureDb: any;
try {
  secureDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e: any) {
  console.log('[Firestore] Applet already initialized or configured, using existing instance:', e.message || e);
  secureDb = getFirestore(app);
}

export const db = secureDb;
export const auth = getAuth(app);

// Satisfies standard/required isSignedIn() checks in firestore.rules

onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch((err) => {
      console.warn("Firestore implicit auth connection notice:", err.message || err);
    });
  }
});

