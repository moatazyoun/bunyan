/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize firestore with force long polling to prevent GrpcConnection stream cancellations in proxied environments
let secureDb: any;
try {
  secureDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, (firebaseConfig as any).firestoreDatabaseId || '(default)');
} catch (e: any) {
  console.log('[Firestore] Applet already initialized or configured, using existing instance:', e.message || e);
  secureDb = getFirestore(app);
}

export const db = secureDb;
export const auth = getAuth(app);

// Satisfies standard/required isSignedIn() checks in firestore.rules
signInAnonymously(auth).catch((err) => {
  console.warn("Firestore implicit auth connection notice:", err.message || err);
});

