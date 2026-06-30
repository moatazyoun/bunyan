/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

declare global {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
    readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
    readonly VITE_FIREBASE_DATABASE_ID?: string;
    readonly VITE_FIREBASE_CONFIG?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

try {
  setLogLevel('silent');
} catch (err) {
  console.warn("Could not set Firestore log level:", err);
}

// Support environments like Vercel with custom environment variable configurations
let envConfig: any = {};
try {
  let envVal: string | undefined;
  try {
    envVal = import.meta.env.VITE_FIREBASE_CONFIG;
  } catch (e) {
    const metaEnv = (import.meta as any).env || {};
    envVal = metaEnv.VITE_FIREBASE_CONFIG;
  }
  if (envVal) {
    envConfig = JSON.parse(envVal);
  }
} catch (e) {
  console.warn("VITE_FIREBASE_CONFIG JSON parse error: fallback to properties", e);
}

const getEnvValue = (metaVal: any, envProp: any, configProp: any): any => {
  return metaVal || envProp || configProp;
};

// Literal references are mandatory for Vite bundling replacement
let metaApiKey: string | undefined;
let metaAuthDomain: string | undefined;
let metaProjectId: string | undefined;
let metaStorageBucket: string | undefined;
let metaMessagingSenderId: string | undefined;
let metaAppId: string | undefined;
let metaMeasurementId: string | undefined;
let metaDatabaseId: string | undefined;

try {
  metaApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  metaAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  metaProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  metaStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  metaMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  metaAppId = import.meta.env.VITE_FIREBASE_APP_ID;
  metaMeasurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
  metaDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
} catch (e) {
  const metaEnv = (import.meta as any).env || {};
  metaApiKey = metaEnv.VITE_FIREBASE_API_KEY;
  metaAuthDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN;
  metaProjectId = metaEnv.VITE_FIREBASE_PROJECT_ID;
  metaStorageBucket = metaEnv.VITE_FIREBASE_STORAGE_BUCKET;
  metaMessagingSenderId = metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID;
  metaAppId = metaEnv.VITE_FIREBASE_APP_ID;
  metaMeasurementId = metaEnv.VITE_FIREBASE_MEASUREMENT_ID;
  metaDatabaseId = metaEnv.VITE_FIREBASE_DATABASE_ID;
}

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
  measurementId: appletConfig.measurementId,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId
};

console.log('Firebase config updated from appletConfig:', firebaseConfig.projectId);
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app.name);

const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' && firebaseConfig.firestoreDatabaseId !== '') 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

 // Initialize firestore with force long polling to prevent GrpcConnection stream cancellations in proxied environments
 let secureDb: any;
 try {
   secureDb = initializeFirestore(app, {
     experimentalForceLongPolling: true,
   }, dbId);
 } catch (e: any) {
   console.log('[Firestore] Applet already initialized or configured, using existing instance:', e.message || e);
   if (dbId) {
     secureDb = getFirestore(app, dbId);
   } else {
     secureDb = getFirestore(app);
   }
 }

export const db = secureDb;
export const auth = getAuth(app);

// Satisfies standard/required isSignedIn() checks in firestore.rules

onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch((err) => {
        if (err.code !== 'auth/admin-restricted-operation') {
            console.warn("Firestore implicit auth connection notice:", err.message || err);
        }
    });
  }
});

// Helper for implicit auth state if anonymous login is taking time
export const ensureAuthenticated = async () => {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        if (user) {
            resolve(user);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                // If no user, just resolve with null, 
                // don't force anonymous sign-in if it's restricted.
                resolve(null);
            }
        });
    });
};

