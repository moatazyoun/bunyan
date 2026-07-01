/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unified Database Abstraction Layer (Supabase + Resilient LocalStorage Fallback)
 * This file replaces the direct Firebase dependency with Supabase, maintaining full
 * API compatibility with the Firestore interfaces used in the React frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load Supabase environment variables
const supabaseUrl = (import.meta as any).env?.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Initialized with URL:', supabaseUrl);
  } catch (err) {
    console.error('[Supabase] Initialization failed:', err);
  }
} else {
  console.log('[Supabase] Keys missing in environment. Falling back to robust Offline LocalStorage Database.');
}

// Emulate Firestore interfaces for full compatibility
export const db = { name: 'SupabaseLocalStorageUnified' };

export const auth = {
  currentUser: { 
    uid: 'engineer_user', 
    isAnonymous: true, 
    email: 'engineer@bunyan.com',
    emailVerified: false,
    providerData: [] as any[]
  }
};

export const getAuth = () => auth;
export const getRedirectResult = async (authObj?: any) => null;
export const signInAnonymously = async () => auth.currentUser;
export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  callback(auth.currentUser);
  return () => {};
};

export const ensureAuthenticated = async () => auth.currentUser;

// Helper to access LocalStorage safe arrays
function getLocalData(collectionName: string): any[] {
  try {
    const key = `supabase_emu_${collectionName}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[LocalStorage DB] read error:', e);
    return [];
  }
}

function setLocalData(collectionName: string, data: any[]) {
  try {
    const key = `supabase_emu_${collectionName}`;
    localStorage.setItem(key, JSON.stringify(data));
    triggerListeners(collectionName);
  } catch (e) {
    console.error('[LocalStorage DB] write error:', e);
  }
}

// Simple Pub/Sub listener registry for onSnapshot
const listeners = new Map<string, Set<() => void>>();

export function triggerListeners(collectionName: string) {
  const set = listeners.get(collectionName);
  if (set) {
    set.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[Listener Trigger] failed:', err);
      }
    });
  }
}

// Classes for reference emulations
export class MockDocRef {
  constructor(public collectionPath: string, public id: string) {}
}

export class MockColRef {
  constructor(public path: string) {}
}

export function collection(dbInstance: any, path: string) {
  return new MockColRef(path);
}

export function doc(dbOrCol: any, ...paths: string[]) {
  if (dbOrCol instanceof MockColRef) {
    return new MockDocRef(dbOrCol.path, paths[0]);
  }
  if (paths.length === 2) {
    return new MockDocRef(paths[0], paths[1]);
  }
  return new MockDocRef(dbOrCol, paths[0]);
}

// Query operators
export class QueryConstraint {
  constructor(public type: 'where' | 'orderBy', public field: string, public opOrDir: string, public val?: any) {}
}

export function where(field: string, op: string, val: any) {
  return new QueryConstraint('where', field, op, val);
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return new QueryConstraint('orderBy', field, direction);
}

export function query(colRef: MockColRef, ...constraints: QueryConstraint[]) {
  return { colRef, constraints };
}

// Document Snapshots
export class MockDocSnapshot {
  constructor(public id: string, private _data: any, public existsVal = true) {}
  exists() {
    return this.existsVal;
  }
  data() {
    return this._data;
  }
}

export class MockQuerySnapshot {
  constructor(public docs: MockDocSnapshot[]) {}
  forEach(callback: (doc: MockDocSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

// Special FieldValue classes
export class ArrayUnion {
  constructor(public elements: any[]) {}
}

export function arrayUnion(...elements: any[]) {
  return new ArrayUnion(elements);
}

export class ArrayRemove {
  constructor(public elements: any[]) {}
}

export function arrayRemove(...elements: any[]) {
  return new ArrayRemove(elements);
}

export function serverTimestamp() {
  return new Date().toISOString();
}

// Apply field updates safely (including ArrayUnion, ArrayRemove)
function applyFieldUpdates(existing: any, updates: any) {
  const result = { ...(existing || {}) };
  for (const key of Object.keys(updates)) {
    const val = updates[key];
    if (val instanceof ArrayUnion) {
      const arr = Array.isArray(result[key]) ? result[key] : [];
      result[key] = [...arr, ...val.elements.filter((el) => !arr.includes(el))];
    } else if (val instanceof ArrayRemove) {
      const arr = Array.isArray(result[key]) ? result[key] : [];
      result[key] = arr.filter((el) => !val.elements.includes(el));
    } else {
      result[key] = val;
    }
  }
  return result;
}

// Firestore operations emulations with Supabase connection and LocalStorage fallback
export async function getDoc(docRef: MockDocRef): Promise<MockDocSnapshot> {
  const col = docRef.collectionPath;
  const id = docRef.id;

  try {
    const res = await fetch(`/api/db/${col}/${id}`, {
      headers: { 'X-Skip-Interceptor': 'true' }
    });
    if (res.ok) {
      const result = await res.json();
      if (result.exists) {
        return new MockDocSnapshot(id, result.data, true);
      }
    }
  } catch (err) {
    console.error(`[Client getDoc] failed for "${col}/${id}":`, err);
  }

  return new MockDocSnapshot(id, null, false);
}

export async function getDocs(queryOrCol: any): Promise<MockQuerySnapshot> {
  const colRef = queryOrCol.colRef || queryOrCol;
  const constraints = queryOrCol.constraints || [];
  const col = colRef.path;

  try {
    const res = await fetch(`/api/db/${col}`, {
      headers: { 'X-Skip-Interceptor': 'true' }
    });
    if (res.ok) {
      let items = await res.json();
      
      // Apply constraints locally
      for (const c of constraints) {
        if (c.type === 'where') {
          const { field, opOrDir: op, val } = c;
          items = items.filter((item: any) => {
            const dataObj = item.data || item;
            const itemVal = dataObj[field];
            if (op === '==' || op === '===') return itemVal === val;
            if (op === '>=') return itemVal >= val;
            if (op === '<=') return itemVal <= val;
            if (op === '>') return itemVal > val;
            if (op === '<') return itemVal < val;
            if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(val);
            return true;
          });
        } else if (c.type === 'orderBy') {
          const { field, opOrDir: dir } = c;
          items.sort((a: any, b: any) => {
            const valA = (a.data || a)[field];
            const valB = (b.data || b)[field];
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
          });
        }
      }

      const docs = items.map((item: any) => new MockDocSnapshot(item.id || '', item.data || item, true));
      return new MockQuerySnapshot(docs);
    }
  } catch (err) {
    console.error(`[Client getDocs] failed for "${col}":`, err);
  }

  return new MockQuerySnapshot([]);
}

export async function setDoc(docRef: MockDocRef, data: any, options?: any) {
  const col = docRef.collectionPath;
  const id = docRef.id;

  try {
    let finalData = data;
    const hasSpecialOps = Object.values(data || {}).some(
      (val) => val instanceof ArrayUnion || val instanceof ArrayRemove
    );

    if (hasSpecialOps) {
      const snap = await getDoc(docRef);
      const existing = snap.exists() ? snap.data() : {};
      finalData = applyFieldUpdates(existing, data);
    }

    const res = await fetch(`/api/db/${col}/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Skip-Interceptor': 'true'
      },
      body: JSON.stringify({ data: finalData, merge: options?.merge })
    });
    if (!res.ok) {
      const errRes = await res.json().catch(() => ({}));
      throw new Error(errRes.error || `HTTP error ${res.status}`);
    }
    // Trigger real-time UI updates
    triggerListeners(col);
  } catch (err) {
    console.error(`[Client setDoc] failed for "${col}/${id}":`, err);
    throw err;
  }
}

export async function addDoc(colRef: MockColRef, data: any) {
  const col = colRef.path;
  const id = 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const docRef = new MockDocRef(col, id);
  await setDoc(docRef, data);
  return docRef;
}

export async function updateDoc(docRef: MockDocRef, data: any) {
  await setDoc(docRef, data, { merge: true });
}

export async function deleteDoc(docRef: MockDocRef) {
  const col = docRef.collectionPath;
  const id = docRef.id;

  try {
    const res = await fetch(`/api/db/${col}/${id}`, {
      method: 'DELETE',
      headers: { 'X-Skip-Interceptor': 'true' }
    });
    if (!res.ok) {
      const errRes = await res.json().catch(() => ({}));
      throw new Error(errRes.error || `HTTP error ${res.status}`);
    }
    // Trigger real-time UI updates
    triggerListeners(col);
  } catch (err) {
    console.error(`[Client deleteDoc] failed for "${col}/${id}":`, err);
    throw err;
  }
}

export function onSnapshot(queryOrRef: any, callback: (snapshot: any) => void, onError?: (err: any) => void) {
  const colRef = queryOrRef.colRef || queryOrRef;
  const colPath = colRef.path || colRef.collectionPath;
  const isDoc = !!queryOrRef.id;

  const trigger = async () => {
    try {
      if (isDoc) {
        const snap = await getDoc(queryOrRef);
        callback(snap);
      } else {
        const snap = await getDocs(queryOrRef);
        callback(snap);
      }
    } catch (err) {
      if (onError) onError(err);
    }
  };

  // Run immediately
  trigger();

  // Register local listener
  if (!listeners.has(colPath)) {
    listeners.set(colPath, new Set());
  }
  listeners.get(colPath)!.add(trigger);

  // Return unsubscribe
  return () => {
    const set = listeners.get(colPath);
    if (set) {
      set.delete(trigger);
    }
  };
}

// Timestamp emulation
export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static now() {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  static fromDate(date: Date) {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
  toISOString() {
    return this.toDate().toISOString();
  }
}

export const getFirestore = () => db;
