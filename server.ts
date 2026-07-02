/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const app = express();
const PORT = 3000;

dotenv.config();

// Initialize Postgres connection pool
let pgPool: pg.Pool | null = null;
let isPgPoolHealthy = true;
let databaseUrl = process.env.DATABASE_URL || "";

// Log database and Supabase keys status on startup
console.log("[Database Config Info] Loaded keys status:");
console.log(" - SUPABASE_URL:", process.env.SUPABASE_URL ? "Present" : "Missing");
console.log(" - SUPABASE_PUBLISHABLE_KEY:", process.env.SUPABASE_PUBLISHABLE_KEY ? "Present" : "Missing");
console.log(" - SUPABASE_SECRET_KEY:", process.env.SUPABASE_SECRET_KEY ? "Present" : "Missing");
console.log(" - SUPABASE_JWKS_URL:", process.env.SUPABASE_JWKS_URL ? "Present" : "Missing");

if (!databaseUrl) {
  const hostUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const match = hostUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    const projectRef = match[1];
    // Default to reconstructed database URL with robust fallback, but prioritize process.env.DATABASE_URL if provided
    databaseUrl = `postgresql://postgres:MoatY%40%40010100@db.${projectRef}.supabase.co:5432/postgres`;
    console.log("[Postgres Server] DATABASE_URL reconstructed from Supabase host URL:", hostUrl);
  }
}

if (databaseUrl) {
  try {
    pgPool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 3000, // Fail fast if blocked (3 seconds)
      query_timeout: 3000 // Fail fast if query blocked (3 seconds)
    });
    
    // Catch pool background connection errors to prevent unhandled node errors or loud crashes
    pgPool.on("error", (err) => {
      console.warn("[Postgres Server Pool Error] Caught pool client connection error:", err.message);
      isPgPoolHealthy = false;
    });

    console.log("[Postgres Server] Initialized successfully with URL (SSL active).");
  } catch (err) {
    console.warn("[Postgres Server] Connection pool creation failed:", err);
    isPgPoolHealthy = false;
  }
} else {
  console.log("[Postgres Server] DATABASE_URL missing. Checking for Supabase fallback.");
  isPgPoolHealthy = false;
}

// Initialize Supabase if keys are available in process.env
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[Supabase Server] Initialized successfully with URL:", supabaseUrl);
  } catch (err) {
    console.error("[Supabase Server] Initialization failed:", err);
  }
} else {
  console.log("[Supabase Server] Environment keys missing. Using resilient Local File Database fallback if Postgres is also inactive.");
}

// Resilient Local JSON File Database Fallback
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getLocalTable(table: string): any[] {
  const filePath = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function setLocalTable(table: string, data: any[]) {
  const filePath = path.join(DATA_DIR, `${table}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`[Local DB Server] failed to write table ${table}:`, err);
  }
}

const db = { name: "ServerSupabaseLocalStorageUnified" };

class ServerDocRef {
  constructor(public collectionName: string, public docId: string) {}
}

class ServerCollectionRef {
  constructor(public collectionName: string) {}
}

// Compatibility wrappers for existing code
function doc(dbInstance: any, collectionName: string, docId?: string) {
  return new ServerDocRef(collectionName, docId || "");
}

function collection(dbInstance: any, collectionName: string) {
  return new ServerCollectionRef(collectionName);
}

const checkedTables = new Set<string>();

function handlePgError(err: any) {
  const errMsg = String(err).toLowerCase();
  if (
    errMsg.includes("timeout") || 
    errMsg.includes("etimedout") || 
    errMsg.includes("econnrefused") || 
    errMsg.includes("enotfound") || 
    errMsg.includes("connection") ||
    errMsg.includes("handshake") ||
    errMsg.includes("terminate") ||
    errMsg.includes("aggregateerror")
  ) {
    if (isPgPoolHealthy) {
      console.warn("[Postgres Server] Connection or timeout error detected:", err);
      console.warn("[Postgres Server] Disabling Postgres pool permanently and falling back to Resilient Local JSON File Database.");
      isPgPoolHealthy = false;
    }
  }
}

async function ensurePgTable(col: string) {
  if (!pgPool || !isPgPoolHealthy) return;
  const safeName = col.replace(/[^a-zA-Z0-9_]/g, "");
  if (checkedTables.has(safeName)) return;

  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS "${safeName}" (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    checkedTables.add(safeName);
    console.log(`[Postgres Server] Table "${safeName}" ensured/created successfully.`);
  } catch (err) {
    console.warn(`[Postgres Server] Failed to ensure table "${safeName}":`, err instanceof Error ? err.message : err);
    handlePgError(err);
  }
}

async function getDoc(docRef: ServerDocRef) {
  const col = docRef.collectionName;
  const id = docRef.docId;

  if (pgPool && isPgPoolHealthy) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      await ensurePgTable(safeCol);
      
      // Secondary health check guard in case ensurePgTable turned it off
      if (isPgPoolHealthy) {
        const res = await pgPool.query(`SELECT data FROM "${safeCol}" WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
          return {
            exists: () => true,
            data: () => res.rows[0].data,
            id: id
          };
        }
        return {
          exists: () => false,
          data: () => null,
          id: id
        };
      }
    } catch (err) {
      console.warn(`[Postgres Server getDoc] failed for "${col}", trying Supabase SDK fallback:`, err instanceof Error ? err.message : err);
      handlePgError(err);
    }
  }

  // Supabase SDK API Fallback
  if (supabase) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      const { data: row, error } = await supabase
        .from(safeCol)
        .select("data")
        .eq("id", id)
        .maybeSingle();
      if (!error && row) {
        return {
          exists: () => true,
          data: () => row.data,
          id: id
        };
      } else if (!error) {
        return {
          exists: () => false,
          data: () => null,
          id: id
        };
      }
      console.warn(`[Supabase SDK getDoc fallback] query error for "${safeCol}":`, error.message);
    } catch (err) {
      console.warn(`[Supabase SDK getDoc exception] failed for "${col}":`, err);
    }
  }

  // Local JSON Fallback
  try {
    const table = getLocalTable(col);
    const item = table.find((item: any) => item.id === id);
    if (item) {
      return {
        exists: () => true,
        data: () => item,
        id: id
      };
    }
  } catch (err) {
    console.error(`[Local DB Server getDoc] failed for "${col}":`, err);
  }

  return {
    exists: () => false,
    data: () => null,
    id: id
  };
}

async function getDocs(collectionRef: ServerCollectionRef) {
  const col = collectionRef.collectionName;

  if (pgPool && isPgPoolHealthy) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      await ensurePgTable(safeCol);
      
      if (isPgPoolHealthy) {
        const res = await pgPool.query(`SELECT id, data FROM "${safeCol}"`);
        return {
          docs: res.rows.map((row: any) => ({
            id: row.id || "",
            data: () => row.data,
            ref: new ServerDocRef(col, row.id || "")
          }))
        };
      }
    } catch (err) {
      console.warn(`[Postgres Server getDocs] failed for "${col}", trying Supabase SDK fallback:`, err instanceof Error ? err.message : err);
      handlePgError(err);
    }
  }

  // Supabase SDK API Fallback
  if (supabase) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      const { data: rows, error } = await supabase
        .from(safeCol)
        .select("id, data");
      if (!error && rows) {
        return {
          docs: rows.map((row: any) => ({
            id: row.id || "",
            data: () => row.data,
            ref: new ServerDocRef(col, row.id || "")
          }))
        };
      }
      console.warn(`[Supabase SDK getDocs fallback] query error for "${safeCol}":`, error?.message);
    } catch (err) {
      console.warn(`[Supabase SDK getDocs exception] failed for "${col}":`, err);
    }
  }

  // Local JSON Fallback
  try {
    const table = getLocalTable(col);
    return {
      docs: table.map((item: any) => ({
        id: item.id || "",
        data: () => item,
        ref: new ServerDocRef(col, item.id || "")
      }))
    };
  } catch (err) {
    console.error(`[Local DB Server getDocs] failed for "${col}":`, err);
    return { docs: [] };
  }
}

async function setDoc(docRef: ServerDocRef, data: any, options?: { merge?: boolean }) {
  const col = docRef.collectionName;
  const id = docRef.docId;

  if (pgPool && isPgPoolHealthy) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      await ensurePgTable(safeCol);
      
      if (isPgPoolHealthy) {
        let finalData = { id, ...data };
        if (options?.merge) {
          const checkRes = await pgPool.query(`SELECT data FROM "${safeCol}" WHERE id = $1`, [id]);
          if (checkRes.rows.length > 0) {
            finalData = { ...checkRes.rows[0].data, ...data, id };
          }
        }

        await pgPool.query(`
          INSERT INTO "${safeCol}" (id, data, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
        `, [id, JSON.stringify(finalData)]);
        return;
      }
    } catch (err) {
      console.warn(`[Postgres Server setDoc] failed for "${col}", trying Supabase SDK fallback:`, err instanceof Error ? err.message : err);
      handlePgError(err);
    }
  }

  // Supabase SDK API Fallback
  if (supabase) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      let finalData = { id, ...data };
      if (options?.merge) {
        const { data: row } = await supabase
          .from(safeCol)
          .select("data")
          .eq("id", id)
          .maybeSingle();
        if (row && row.data) {
          finalData = { ...row.data, ...data, id };
        }
      }

      const { error } = await supabase
        .from(safeCol)
        .upsert({ id, data: finalData, updated_at: new Date().toISOString() });
      if (!error) {
        return;
      }
      console.warn(`[Supabase SDK setDoc fallback] query error for "${safeCol}":`, error.message);
    } catch (err) {
      console.warn(`[Supabase SDK setDoc exception] failed for "${col}":`, err);
    }
  }

  // Local JSON Fallback
  try {
    const table = getLocalTable(col);
    const existingIdx = table.findIndex((item: any) => item.id === id);
    let finalData = { id, ...data };
    if (options?.merge && existingIdx !== -1) {
      finalData = { ...table[existingIdx], ...data, id };
    }

    if (existingIdx !== -1) {
      table[existingIdx] = finalData;
    } else {
      table.push(finalData);
    }
    setLocalTable(col, table);
  } catch (err) {
    console.error(`[Local DB Server setDoc] failed for "${col}":`, err);
    throw err;
  }
}

async function updateDoc(docRef: ServerDocRef, data: any) {
  await setDoc(docRef, data, { merge: true });
}

async function deleteDoc(docRef: ServerDocRef) {
  const col = docRef.collectionName;
  const id = docRef.docId;

  if (pgPool && isPgPoolHealthy) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      await ensurePgTable(safeCol);
      
      if (isPgPoolHealthy) {
        await pgPool.query(`DELETE FROM "${safeCol}" WHERE id = $1`, [id]);
        return;
      }
    } catch (err) {
      console.warn(`[Postgres Server deleteDoc] failed for "${col}", trying Supabase SDK fallback:`, err instanceof Error ? err.message : err);
      handlePgError(err);
    }
  }

  // Supabase SDK API Fallback
  if (supabase) {
    try {
      const safeCol = col.replace(/[^a-zA-Z0-9_]/g, "");
      const { error } = await supabase
        .from(safeCol)
        .delete()
        .eq("id", id);
      if (!error) {
        return;
      }
      console.warn(`[Supabase SDK deleteDoc fallback] query error for "${safeCol}":`, error.message);
    } catch (err) {
      console.warn(`[Supabase SDK deleteDoc exception] failed for "${col}":`, err);
    }
  }

  // Local JSON Fallback
  try {
    const table = getLocalTable(col);
    const filtered = table.filter((item: any) => item.id !== id);
    setLocalTable(col, filtered);
  } catch (err) {
    console.error(`[Local DB Server deleteDoc] failed for "${col}":`, err);
    throw err;
  }
}

function writeBatch(dbInstance: any) {
  const operations: Array<{ docRef: ServerDocRef; data: any; options?: { merge?: boolean } }> = [];
  return {
    set: (docRef: ServerDocRef, data: any, options?: { merge?: boolean }) => {
      operations.push({ docRef, data, options });
    },
    commit: async () => {
      for (const op of operations) {
        await setDoc(op.docRef, op.data, op.options);
      }
    }
  };
}

dotenv.config();

console.log("DEBUG: API Key length:", (process.env.GEMINI_API_KEY || "").length);
console.log("DEBUG: GOOGLE_API_KEY length:", (process.env.GOOGLE_API_KEY || "").length);
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is not set.");
}

// NEW ENDPOINT: Manual price fetcher
app.get("/api/debug-keys", (req, res) => {
    res.json({
        gemini: (process.env.GEMINI_API_KEY || "").length,
        google: (process.env.GOOGLE_API_KEY || "").length,
        apiKey: apiKey.length
    });
});
app.get("/api/fetch-prices-manual", async (req, res) => {
    try {
        if (!apiKey) {
            return res.status(500).json({ error: "API Key not configured on server. Please add GEMINI_API_KEY in the environment variables." });
        }
        
        const prompt = `Get the latest prices in EGP for the following construction materials in the Egyptian market. Format as a JSON array of objects with: materialName (string), minPrice (number), maxPrice (number), unit (string). Materials:
        حديد التسليح, أسمنت بورتلاندي, طوب أسمنتي مصمت (25×12×6 سم), طوب أسمنتي مفرغ (40×20×20 سم), طوب أسمنتي مفرغ (40×20×12 سم), طوب وردي (25×12×6 سم), طوب أحمر (20×10×6 سم), طوب أحمر (24×11×6 سم), طوب أحمر (25×12×6 سم), رمل حرش, رمل ناعم, زلط عادة, زلط مخصوص, زلط فينو, زلط سن, سيراميك حوائط (25×50 سم), سيراميك حوائط (31×63 سم), سيراميك حوائط (20×63 سم), سيراميك أرضيات (60×60 سم), سيراميك أرضيات (50×50 سم), سيراميك أرضيات (40×40 سم), رخام جلالة لايت, رخام جلالة عادة, رخام تريستا, رخام جلالة بفص, جرانيت أحمر أسوان, جرانيت فردي غزال, جرانيت حلايب, باركيه سمك 8 مم ألماني, باركيه سمك 8 مم تركي كلاس 21, باركيه سمك 8 مم تركي كلاس 31, باركيه سمك 8 مم تركي كلاس 32, خشب سويد موسكي (فنلندي), خشب زان مبخر (روماني), خشب كونتر مضغوط 18 مم, أبلاكاج أسيوي 3 مم.
        Do not include any extra text.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json"
            }
        });
        const text = response.text || "";
        
        const data = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
        res.json({ prices: data });
    } catch (err: any) {
        console.error("Manual fetch failed:", err);
        res.status(500).json({ error: "Failed to fetch prices: " + (err.message || String(err)) });
    }
});


// Initial update and hourly thereafter
// Moved to after secureDb initialization
async function startMarketDataJob() {
}

// Start the job now that db is ready
startMarketDataJob();

export { db };

// Initialize Admin User
async function initializeAdminUser() {
  try {
    const adminRef = doc(db, 'users', 'moataz');
    const docSnap = await getDoc(adminRef);
    if (!docSnap.exists()) {
      await setDoc(adminRef, {
        password: 'moat_010100',
        nameAr: 'م. معتز يونس',
        role: 'admin'
      });
      console.log("[Auth] Loaded administrative profile.");
    }
  } catch (err) {
    // Silent recovery
  }
}
initializeAdminUser();


// Helper functions for Excel parsing
function isExcelMimeType(mimeType: string): boolean {
  if (!mimeType) return false;
  const mimeLower = mimeType.toLowerCase();
  return (
    mimeLower.includes("spreadsheetml") ||
    mimeLower.includes("excel") ||
    mimeLower.includes("ms-excel") ||
    mimeLower.includes("xlsx") ||
    mimeLower.includes("xls")
  );
}

function parseExcelBase64(base64: string): string {
  try {
    const buffer = Buffer.from(base64, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let resultText = "";

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      resultText += `Sheet: ${sheetName}\n${csv}\n\n`;
    }
    return resultText;
  } catch (error) {
    console.error("Error parsing Excel base64:", error);
    return "";
  }
}


// Set request limits for handling larger uploaded base64 mock files / report screenshots
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

async function fetchAndStorePrices(force = false) {
  try {
    const prompt = `Get the latest prices in EGP for the following construction materials in the Egyptian market. Format as a JSON array of objects with: materialName (string), minPrice (number), maxPrice (number), unit (string). Materials:
    حديد التسليح, أسمنت بورتلاندي, طوب أسمنتي مصمت (25×12×6 سم), طوب أسمنتي مفرغ (40×20×20 سم), طوب أسمنتي مفرغ (40×20×12 سم), طوب وردي (25×12×6 سم), طوب أحمر (20×10×6 سم), طوب أحمر (24×11×6 سم), طوب أحمر (25×12×6 سم), رمل حرش, رمل ناعم, زلط عادة, زلط مخصوص, زلط فينو, زلط سن, سيراميك حوائط (25×50 سم), سيراميك حوائط (31×63 سم), سيراميك حوائط (20×63 سم), سيراميك أرضيات (60×600 سم), سيراميك أرضيات (50×50 سم), سيراميك أرضيات (40×40 سم), رخام جلالة لايت, رخام جلالة عادة, رخام تريستا, رخام جلالة بفص, جرانيت أحمر أسوان, جرانيت فردي غزال, جرانيت حلايب, باركيه سمك 8 مم ألماني, باركيه سمك 8 مم تركي كلاس 21, باركيه سمك 8 مم تركي كلاس 31, باركيه سمك 8 مم تركي كلاس 32, خشب سويد موسكي (فنلندي), خشب زان مبخر (روماني), خشب كونتر مضغوط 18 مم, أبلاكاج أسيوي 3 مم.
    Do not include any extra text.`;
    
    if (!apiKey) {
      return { success: false, error: "API Key not configured" };
    }
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
            responseMimeType: "application/json"
        }
    });
    const text = response.text || "";
    const items = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.materialName) {
          await setDoc(doc(db, 'market_prices', item.materialName), item);
        }
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error("fetchAndStorePrices failed:", err);
    return { success: false, error: err.message || String(err) };
  }
}

// --- TEST ENDPOINT ---
app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is alive" });
});

app.get("/api/test-db-write", async (req, res) => {
  try {
    const testRef = doc(db, 'test_collection', 'test_doc');
    await setDoc(testRef, { timestamp: new Date().toISOString(), status: "success" });
    const snap = await getDoc(testRef);
    res.json({ 
      success: true, 
      writtenData: snap.data(),
      dbId: "(default)"
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message || String(err), 
      stack: err.stack 
    });
  }
});

// --- MANUAL TRIGGER FOR MARKET DATA UPDATE ---
app.post("/api/refresh-prices", async (req, res) => {
    console.log("DEBUG: /api/refresh-prices hit");
    try {
        const result = await fetchAndStorePrices(true);
        if (result.success) {
            res.json({ message: "Update triggered and successful" });
        } else if (result.error === "RATE_LIMIT") {
            res.status(429).json({ error: "تم تجاوز حد الاستخدام اليومي (Rate Limit). يرجى المحاولة لاحقاً." });
        } else {
            res.status(500).json({ error: "Failed to update prices: " + result.error });
        }
    } catch (err) {
        console.error("Manual trigger failed:", err);
        res.status(500).json({ error: "Failed to trigger update", details: err instanceof Error ? err.message : String(err) });
    }
});

// --- MARKET DATA ENDPOINT ---
app.get("/api/market-data", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, 'market_prices'));
    const data = snapshot.docs.map(doc => doc.data());
    res.json({ data });
  } catch (err) {
    console.error("Error fetching market data:", err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// --- FIREBASE LAYER (FIRESTORE) DISABLED ---

// --- RUN SECURE ONCE-MIGRATION FROM LOCAL DB TO FIRESTORE IS REMOVED ---

// Spark migration asynchronously
// migrateDbToFirestore();


// --- AUTHENTICATION & SECURITY ENDPOINTS ---
app.post("/api/auth/login", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم. يرجى تفعيل الاتصال أو استخدام نظام التخزين المحلي." });
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "يرجى تعبئة اسم المستخدم وكلمة المرور بالكامل." });
  }

  const searchUser = username.toString().trim().toLowerCase();

  try {
    const userDoc = await getDoc(doc(db, 'users', searchUser));
    const user = userDoc.data();

    if (!user || user.password !== password.toString().trim()) {
      return res.status(401).json({ error: "عذراً! اسم المستخدم أو كلمة المرور غير صحيحة لتلك الصلاحية." });
    }

    const userSafe = {
      username: searchUser,
      nameAr: user.nameAr,
      role: user.role,
      permissions: user.permissions || { projects: false, supplies: false, equipment: false, contractors: false, finance: false, usersManagement: false },
      assignedProjects: user.assignedProjects || []
    };
    res.json({ success: true, user: userSafe });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New: Assign users to a project (updates user records)
app.post("/api/projects/:projectId/assign-users", async (req, res) => {
  const { projectId } = req.params;
  const { usernames } = req.body; // Array of usernames to have access

  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }

  try {
    const usersBatch = writeBatch(db);
    const allUsers = await getDocs(collection(db, 'users'));
    
    allUsers.docs.forEach(d => {
      const userData = d.data();
      let assignedProjects = userData.assignedProjects || [];
      const username = d.id;
      
      const shouldHaveAccess = usernames.includes(username);
      const currentlyHasAccess = assignedProjects.includes(projectId);
      
      if (shouldHaveAccess && !currentlyHasAccess) {
        assignedProjects.push(projectId);
        usersBatch.set(d.ref, { assignedProjects }, { merge: true });
      } else if (!shouldHaveAccess && currentlyHasAccess) {
        assignedProjects = assignedProjects.filter((id: string) => id !== projectId);
        usersBatch.set(d.ref, { assignedProjects }, { merge: true });
      }
    });

    await usersBatch.commit();
    res.json({ success: true });
  } catch (err) {
    console.error("Error assigning users to project:", err);
    res.status(500).json({ error: "فشل تحديث صلاحيات المستخدمين." });
  }
});

// Existing routes...
app.get("/api/users", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => ({
        username: doc.id,
        nameAr: doc.data().nameAr,
        role: doc.data().role,
        email: doc.data().email || '',
        phone: doc.data().phone || '',
        permissions: doc.data().permissions || { projects: false, supplies: false, equipment: false, contractors: false, finance: false, usersManagement: false },
        assignedProjects: doc.data().assignedProjects || []
    }));
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/users", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { username, password, nameAr, role, permissions, email, phone, assignedProjects } = req.body;
  if (!username) {
    return res.status(400).json({ error: "اسم المستخدم مطلوب." });
  }

  const normalizedUsername = username.toString().trim().toLowerCase();

  const updateData: any = {};
  if (password) updateData.password = password.toString().trim();
  if (nameAr) updateData.nameAr = nameAr.toString().trim();
  if (role) updateData.role = role;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (permissions) updateData.permissions = permissions;
  if (assignedProjects !== undefined) updateData.assignedProjects = assignedProjects;

  try {
    await setDoc(doc(db, 'users', normalizedUsername), updateData, { merge: true });
    res.json({ success: true, user: { username: normalizedUsername, ...updateData } });
  } catch (err) {
    console.error("Save user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/users/:username", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const usernameToDelete = req.params.username.toLowerCase();
  if (usernameToDelete === "moataz") {
    return res.status(400).json({ error: "محمى وممنوع: لا يمكن حذف حساب المدير والمطور الرئيسي للنظام (Moataz)." });
  }

  try {
    await deleteDoc(doc(db, 'users', usernameToDelete));
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- AUDIT LOGS / USER ACTIVITY LOGGING ENDPOINTS ---
app.post("/api/users/logs", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  const { username, actionAr, type, detailsAr, referenceNo } = req.body;
  
  try {
    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    const newLog = {
      id: logId,
      username: username || "system",
      actionAr: actionAr || "",
      type: type || "other",
      detailsAr: detailsAr || "",
      referenceNo: referenceNo || "",
      timestamp: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'activitylog', logId), newLog);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Log error:", err);
    res.status(500).json({ error: "Failed to log activity: " + err.message });
  }
});

app.get("/api/users/logs", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  try {
    const username = req.query.username;
    const snapshot = await getDocs(collection(db, 'activitylog'));
    let logsList = snapshot.docs.map(d => d.data() as any);
    
    // Sort logs by timestamp descending (newest first)
    logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (username) {
      const lowerUser = username.toString().trim().toLowerCase();
      logsList = logsList.filter(l => (l.username || "").toLowerCase().trim() === lowerUser);
    }
    
    res.json(logsList);
  } catch (err: any) {
    console.error("Get logs error:", err);
    res.status(500).json({ error: "Failed to get logs: " + err.message });
  }
});

// --- MULTI-TENANT SITES & DATABASES ENDPOINTS ---
app.get("/api/sites", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  try {
    const snapshot = await getDocs(collection(db, 'sites'));
    const sites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    res.json(sites);
  } catch (err) {
    console.error("Get sites error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/sites", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { id, nameAr, location, description } = req.body;
  if (!id || !nameAr || !location) {
    return res.status(400).json({ error: "الرجاء كود الموقع واسمه والموقع الجغرافي كاملاً." });
  }

  const formattedId = id.toString().trim().toLowerCase().replace(/\s+/g, "-");

  try {
    const docSnap = await getDoc(doc(db, 'sites', formattedId));
    if (docSnap.exists()) {
      return res.status(400).json({ error: "رمز موقع العمل مكرر وتام التسجيل مسبقاً لموقع إنشائي آخر." });
    }

    await setDoc(doc(db, 'sites', formattedId), {
        nameAr: nameAr.toString().trim(),
        location: location.toString().trim(),
        description: description ? description.toString().trim() : ""
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Create site error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/sites/:id", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { id } = req.params;
  const { nameAr, location, description } = req.body;
  if (!nameAr || !location) {
    return res.status(400).json({ error: "الرجاء كتابة اسم الموقع والموقع الجغرافي بالكامل للتحديث." });
  }

  try {
    await updateDoc(doc(db, 'sites', id), {
        nameAr: nameAr.toString().trim(),
        location: location.toString().trim(),
        description: description ? description.toString().trim() : ""
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Update site error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/sites/:id", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { id } = req.params;
  const adminUsername = (req.body.adminUsername || req.headers['x-admin-username'] || req.query.adminUsername || '').toString().trim().toLowerCase();
  const adminPassword = (req.body.adminPassword || req.headers['x-admin-password'] || req.query.adminPassword || '').toString().trim();

  if (!adminUsername || !adminPassword) {
    return res.status(401).json({ error: "صلاحية مرفوضة! يرجى تقديم اسم مستخدم وكلمة مرور مدير النظام للتحقق والتأكيد الحاسم." });
  }

  try {
    // Look up the admin user
    const userDoc = await getDoc(doc(db, 'users', adminUsername));
    const adminUser = userDoc.data();

    if (!adminUser) {
      return res.status(401).json({ error: "اسم مستخدم غير صحيح لمدير النظام." });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: "خطأ في الصلاحيات! إجراء الحذف متاح فقط لحسابات مدراء النظام المعتمدين." });
    }

    if (adminUser.password !== adminPassword) {
      return res.status(401).json({ error: "رمز المرور الخاص بمدير النظام غير صحيح. يرجى إعادة المحاولة بدقة." });
    }

    // Perform secure site deletion
    await deleteDoc(doc(db, 'sites', id));
    await deleteDoc(doc(db, 'projects', id));
    res.json({ success: true });
  } catch (err) {
    console.error("Delete site error:", err);
    res.status(500).json({ error: "فشل حذف موقع العمل نتيجة خطأ تقني داخلي في السيرفر." });
  }
});

app.get("/api/site/:siteId/data", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { siteId } = req.params;

  try {
    console.log("DEBUG: Fetching projects data for site:", siteId);
    const docRef = doc(db, 'projects', siteId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log("DEBUG: No document found for site in projects:", siteId);
      return res.json({});
    }
    const data = docSnap.data();
    console.log("DEBUG: Document size for", siteId, ":", JSON.stringify(data).length, "bytes");
    res.json(data || {});
  } catch (err) {
    console.error("Get site data error for site", siteId, ":", err);
    res.status(500).json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/site/:siteId/save", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { siteId } = req.params;
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: "لم يتم استلام أي بيانات صالحة لحفظ تمايز الموقع." });
  }

  try {
    await setDoc(doc(db, 'projects', siteId), data, { merge: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Save site data error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/site/:siteId/auto-backup", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { siteId } = req.params;
  const { siteName, payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: "لا توجد بيانات صالحة للنسخ الاحتياطي التلقائي." });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const backupId = `${siteId}_backup_${today}`;
    
    await setDoc(doc(db, 'backups', backupId), {
      siteId,
      siteName: siteName || "موقع افتراضي",
      backupDate: today,
      createdAt: new Date().toISOString(),
      payload: payload
    });
    
    console.log(`[Server] Daily auto-backup saved for site ${siteId} as ${backupId}`);
    res.json({ success: true, backupId });
  } catch (err: any) {
    console.error("Auto-backup save error:", err);
    res.status(500).json({ error: err.message || "Failed to save daily auto-backup" });
  }
});

// GET list of backups for site from Firestore
app.get("/api/site/:siteId/server-backups", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { siteId } = req.params;
  try {
    const snapshot = await getDocs(collection(db, 'backups'));
    const backupsList = snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.siteName || "موقع افتراضي",
          createdTime: data.createdAt || data.backupDate || new Date().toISOString(),
          backupDate: data.backupDate || "",
          siteId: data.siteId
        };
      })
      .filter((b: any) => b.siteId === siteId);
    
    // sort by createdTime descending
    backupsList.sort((a: any, b: any) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
    res.json({ success: true, files: backupsList });
  } catch (err: any) {
    console.error("Fetch server backups failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch backups" });
  }
});

// POST manual backup for site to Firestore
app.post("/api/site/:siteId/manual-backup", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { siteId } = req.params;
  const { siteName, payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: "لا توجد بيانات صالحة للنسخ الاحتياطي." });
  }
  try {
    const timestamp = new Date().toISOString();
    const backupId = `${siteId}_manual_backup_${Date.now()}`;
    await setDoc(doc(db, 'backups', backupId), {
      siteId,
      siteName: siteName || "موقع افتراضي",
      backupDate: timestamp.split('T')[0],
      createdAt: timestamp,
      payload: payload
    });
    res.json({ success: true, backupId });
  } catch (err: any) {
    console.error("Manual backup save error:", err);
    res.status(500).json({ error: err.message || "Failed to save backup" });
  }
});

// GET specific backup details to restore
app.get("/api/site/:siteId/restore-backup/:backupId", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { backupId } = req.params;
  try {
    const docRef = doc(db, 'backups', backupId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ error: "ملف النسخ الاحتياطي المذكور غير موجود." });
    }
    const data = docSnap.data();
    res.json({ success: true, backup: data });
  } catch (err: any) {
    console.error("Retrieve backup error:", err);
    res.status(500).json({ error: err.message || "Failed to retrieve backup data" });
  }
});

// DELETE a specific backup
app.delete("/api/site/:siteId/backup/:backupId", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  const { backupId } = req.params;
  try {
    await deleteDoc(doc(db, 'backups', backupId));
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete backup error:", err);
    res.status(500).json({ error: err.message || "Failed to delete backup" });
  }
});

// Generic database endpoints for frontend clients to talk directly to PostgreSQL/Supabase securely
app.get("/api/db/:collection/:id", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  const { collection, id } = req.params;
  try {
    const docRef = doc(db, collection, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      res.json({ exists: true, data: docSnap.data() });
    } else {
      res.json({ exists: false, data: null });
    }
  } catch (err: any) {
    console.error(`Generic getDoc error for ${collection}/${id}:`, err);
    res.status(500).json({ error: err.message || "Internal Database Error" });
  }
});

app.post("/api/db/:collection/:id", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  const { collection, id } = req.params;
  const { data, merge } = req.body;
  try {
    const docRef = doc(db, collection, id);
    await setDoc(docRef, data, { merge: !!merge });
    res.json({ success: true });
  } catch (err: any) {
    console.error(`Generic setDoc error for ${collection}/${id}:`, err);
    res.status(500).json({ error: err.message || "Internal Database Error" });
  }
});

app.delete("/api/db/:collection/:id", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  const { collection, id } = req.params;
  try {
    const docRef = doc(db, collection, id);
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`Generic deleteDoc error for ${collection}/${id}:`, err);
    res.status(500).json({ error: err.message || "Internal Database Error" });
  }
});

app.get("/api/db/:collection", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة." });
  }
  const { collection: collectionParam } = req.params;
  try {
    const colRef = collection(db, collectionParam);
    const snapshot = await getDocs(colRef);
    const docs = snapshot.docs.map(d => ({
      id: d.id,
      data: d.data()
    }));
    res.json(docs);
  } catch (err: any) {
    console.error(`Generic getDocs error for ${collectionParam}:`, err);
    res.status(500).json({ error: err.message || "Internal Database Error" });
  }
});

app.get("/api/db-status", async (req, res) => {
    if (pgPool && isPgPoolHealthy) {
      res.json({ 
        connected: true, 
        cloud: true, 
        mode: "سحابي نشط (Supabase Postgres)", 
        info: "متصل بقاعدة البيانات السحابية Supabase عبر PostgreSQL بنجاح" 
      });
    } else if (supabase) {
      res.json({ 
        connected: true, 
        cloud: true, 
        mode: "سحابي نشط (Supabase SDK)", 
        info: "متصل بقاعدة البيانات السحابية Supabase عبر API بنجاح" 
      });
    } else if (db) {
      res.json({ 
        connected: true, 
        cloud: false, 
        mode: "التخزين المحلي المستمر", 
        info: "يعمل التطبيق حالياً في الوضع المحلي (ملفات البيانات)" 
      });
    } else {
      res.json({ 
        connected: false, 
        cloud: false, 
        mode: "غير متصل", 
        info: "قاعدة البيانات غير متصلة" 
      });
    }
});

// Helper for Gemini content generation with retry and model fallback using streaming to eliminate Vercel 504 timeouts
async function generateStreamWithRetryAndFallback(ai: any, contents: any, config: any, res: express.Response) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxAttempts = 2; // Shortened for edge compatibility
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini Stream Request] Attempting model ${model} (Attempt ${attempt}/${maxAttempts})...`);
        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config,
        });

        // Set streaming headers immediately when stream is established
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Transfer-Encoding', 'chunked');
        }

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(chunk.text);
          }
        }
        res.end();
        console.log(`[Gemini Stream Success] Successfully streamed content with model ${model}`);
        return;
      } catch (error: any) {
        lastError = error;
        
        // If stream already started, we can't retry or send JSON error. Just end stream.
        if (res.headersSent) {
          console.error(`[Gemini Stream] Error generated mid-stream for ${model}`, error);
          res.end();
          return;
        }

        const errMessage = error instanceof Error ? error.message : String(error);
        const errStatus = error?.status || (error?.error?.status) || "";
        const errCode = error?.code || (error?.error?.code) || 0;
        
        const isTransient = 
          errStatus === "UNAVAILABLE" || 
          errStatus === "RESOURCE_EXHAUSTED" ||
          errCode === 503 || 
          errCode === 429 || 
          errMessage.includes("503") || 
          errMessage.includes("429") || 
          errMessage.includes("temporary") || 
          errMessage.includes("high demand") || 
          errMessage.includes("overloaded");

        if (isTransient && attempt < maxAttempts) {
          const jitter = Math.random() * 800;
          const totalDelay = delay + jitter;
          console.warn(`[Gemini API] Temporary overload error on model ${model} (Attempt ${attempt}/${maxAttempts}): ${errMessage}. Retrying in ${Math.round(totalDelay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          delay *= 1.8;
        } else {
          console.warn(`[Gemini API] Error on model ${model}: ${errMessage}. Falling back to next options...`);
          break; // Break and try next model
        }
      }
    }
  }

  if (!res.headersSent) {
    let errorMessage = lastError?.message || "فشلت جميع محاولات الاتصال بنماذج الذكاء الاصطناعي.";
    if (String(errorMessage).includes("403") || String(errorMessage).includes("PERMISSION_DENIED")) {
        errorMessage = "تم رفض الوصول لخدمات الذكاء الاصطناعي (403 Forbidden). يرجى التأكد من صلاحية مفتاح الـ API الخاص بك وأن المشروع مفعل في Google Cloud.";
    }
    res.status(500).json({ error: errorMessage });
  } else {
    res.end();
  }
}

// Serve AI analysis backend endpoint
app.post("/api/gemini/analyze-report", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات التطبيق (Settings > Secrets) باسم 'GEMINI_API_KEY' لتفعيل موديول المراجع الذكي."
      });
    }

    const { textContent, fileBase64, mimeType } = req.body;

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    const prompt = `أنت محاسب تكاليق هندسي خبير ومراجع مالي لمشاريع إنشاءات واشغالات الطرق والمقاولات في مصر.
مهمتك هي قراءة وتحليل لقطات الشاشات أو الصور أو النصوص المستخرجة لتقارير المصاريف الأسبوعية أو الشهرية للمواقع الإنشائية (مثل تقرير "المنصرف الأسبوعي" المرفق).

استخرج جميع الحركات المالية الفردية للمصروفات (spent) أو الأعمال المنفذة المعتمدة (executed_work) وسجلها بدقة كشجرة حركات.
قم بتوزيع الحركات المستخرجة على الأبواب/الفئات التالية بدقة:
1. 'supplies' (التوريدات والمواد: مثل مستلزمات مكتب، أدوات نظافة، روتر، تشوينات مواد، إسمنت، رمل، بلدورات، أعمال تشوين).
2. 'equipment' (إيجار وتشغيل المعدات والصيانة: مثل رواتب سائقي المعدات، إيجار لودر، صيانة السيارات، صيانة أدوات كهربائية، إيجار مقاطف).
3. 'contractors' (مقاولي الباطن والأشغال: مستخلصات أعمال معتمدة لمقاولين أو دفعات وصرفيات لمقاولي الباطن).
4. 'fuel' (المحروقات والسولار: كوبونات الوقود، سولار للمعدات، بنزين لسيارات الخدمة).
5. 'custody' (العهد المالية بالموقع: استلام عهود نقدية للمشرفين والمهندسين، رواتب الموظفين والعمال والغلابة المصروفة من العهدة النقدية، أو الإكراميات والمصاريف اليومية الصغيرة التي تتم تصفيتها من العهد ومصاريف الضيافة والتحويل).

قواعد هامة للاستخراج والتحليل:
- رواتب العمال والموظفين (صدام، فارس، مروان، حماده، إلخ) أو الإكراميات والضيافة ومصاريف التحويل في هذه الاستمارات تتبع تصفية العهد النقدية بالموقع، لذا يجب تصنيفها تحت الفئة 'custody'.
- أعمال صيانة المعدات أو سيارات الموقع ("سيارة دول"، إلخ) وأدوات الكهرباء تتبع باب المعدات 'equipment'.
- انتقالات العمال والموظفين صنفها كـ 'custody' أو 'supplies'.
- حدد تاريخ كل معاملة بدقة بتنسيق YYYY-MM-DD. إذا كانت الاستمارة تبدأ من تاريخ معين وتنتهي بتاريخ معين (مثلاً من 2026/01/21 إلى 2026/01/27) وتحدد الأيام (الأربعاء، الخميس، الجمعة، السبت، الأحد، الإثنين، الثلاثاء)، قم بمطابقة كل حركة باليوم والتاريخ الصحيح لها في هذا الإطار الزمني. على سبيل المثال، إذا تزامنت مع يوم السبت، فالتاريخ هو 2026-01-24.
- إذا لم تكن هناك تواريخ محددة تماماً للحركات الفردية، استنبط التاريخ التقريبي ضمن أسبوع التقرير (مثلاً تاريخ البداية أو منتصف الأسبوع).
- القيمة يجب أن تكون رقماً عشرياً أو صحيحاً موجباً بالجنيه المصري (EGP).
- استخرج اسم المستلم (recipient) بدقة (مثل الموظف، السائق، المقاول، أو العمال).
- اكتب بياناً واضحاً (description) باللغة العربية يشمل كافة التفاصيل التي ظهرت في التقرير (مثلاً: "رواتب صدام (مساعد مساح) لمنصرف الأسبوع").

أخرج النتيجة بتنسيق JSON مطابق تماماً للمخطط (Schema) المعطى.`;

    parts.push({ text: prompt });

    if (textContent) {
      parts.push({ text: `النص المستخرج أو المدخل للتقرير:\n${textContent}` });
    }

    if (fileBase64 && mimeType) {
      if (isExcelMimeType(mimeType)) {
        const xlText = parseExcelBase64(fileBase64);
        if (xlText) {
          parts.push({ text: `محتوى مستند إكسيل الذي تم رفعه وتحليله:\n${xlText}` });
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        });
      }
    }

    await generateStreamWithRetryAndFallback(ai, { parts }, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "تاريخ الحركة بصيغة YYYY-MM-DD" },
                  category: { 
                    type: Type.STRING, 
                    enum: ["supplies", "equipment", "contractors", "fuel", "custody"],
                    description: "فئة المعاملة المالية" 
                  },
                  amount: { type: Type.NUMBER, description: "المبلغ المالي ج.م" },
                  type: { type: Type.STRING, enum: ["spent", "executed_work"], description: "نوع الحركة: مصروف أو عمل منفذ معتمد" },
                  description: { type: Type.STRING, description: "وصف واضح ومفصل للحركة باللغة العربية" },
                  recipient: { type: Type.STRING, description: "اسم المستلم أو المشرف أو المقاول" },
                  paymentMethod: { type: Type.STRING, description: "طريقة الدفع إن وجدت" }
                },
                required: ["date", "category", "amount", "type", "description", "recipient"]
              }
            },
            reportMetadata: {
              type: Type.OBJECT,
              properties: {
                fromDate: { type: Type.STRING, description: "تاريخ بداية التقرير" },
                toDate: { type: Type.STRING, description: "تاريخ نهاية التقرير" },
                responsibleName: { type: Type.STRING, description: "اسم المسؤول أو المشرف الرئيسي للعهدة" },
                totalSpent: { type: Type.NUMBER, description: "إجمالي المصاريف المستخرجة بالجنيه المصري" }
              }
            }
          },
          required: ["transactions"]
        }
    }, res);

  } catch (error: any) {
    console.error("Gemini API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل التقرير بالذكاء الاصطناعي." });
    } else {
      res.end();
    }
  }
});

app.post("/api/gemini/analyze-voucher", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات التطبيق (Settings > Secrets) باسم 'GEMINI_API_KEY' لتفعيل موديول المراجع الذكي للبونات."
      });
    }

    const { textContent, fileBase64, mimeType } = req.body;

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    const prompt = `أنت مراجع حسابات ومهندس تكاليف ذكي لشركات الطرق والمقاولات في مصر.
مهمتك هي استخراج بونات توريد المواد (مثل السن، الرمل، البردورات، الخرسانة، الأسمنت) من الصور أو النص المستخرج أو ملفات PDF/Excel لمشروع إنشائي.
قم بتحليل الملف أو النص بدقة شديدة واستخراج كافة تفاصيل البونات في مصفوفة JSON.

المواد ورموزها:
- 'SANN_02': سن ميكانيكي / سن 65 / سن 1 / سن 2 / كسر حجر / توريد سن
- 'SAND_01': رمل / رملة ناعمة / رمل حرش / ركام رملي
- 'BARD_04': بردورة / بلدورات رصيف / بلدورات عجالي
- 'CONC_03': خرسانة جاهزة / خرسانه / صب كوبري
- 'CEMT_05': أسمنت / اسمنت بورتلاندي / توريد شكاير اسمنت

تأتي التفاصيل بالشكل التالي:
1. رقم البون / الإيصال (ticketNo): ابحث عن أي رقم متسلسل للبون (مثلاً: بون رقم 29402 أو إيصال 1010).
2. تاريخ البون (date): بصيغة YYYY-MM-DD. إذا لم يذكر تاريخ صريح للعملية، استخدم تاريخ اليوم الحالي.
3. اسم المقاول أو المورد (supplierName): الجهة الموردة (مثلاً: صلاح العجاري، حكيم، مرتاح، حمدان، شركة الصفوة).
4. رمز المادة (itemCode): اختر بدقة أحد هذه الرموز فقط ['SANN_02', 'SAND_01', 'BARD_04', 'CONC_03', 'CEMT_05'] لتوافقها مع بنود الـ ERP.
5. الكمية / التكعيب م3 (rawQuantity): الحجم المورد بالمتر المكعب أو الحمولة (رقم عشري، مثلاً: 24، 32، 11.5).
6. سعر الوحدة / المتر (unitPrice): سعر المتر المكعب للمورد (مثلاً: 295, 300). إذا لم يكن مكتوباً، خمن سعراً وسطياً معقولاً (مثلاً: سن=295، رمل=140، بردورة=175، خرسانة=1100، أسمنت=145).
7. رقم السيارة (truckPlate): حروف وأرقام اللوحة المعدنية للسيارة العربية الموردة (إن وجدت، مثل: د ب أ 5920).
8. اسم السائق (driverName): اسم سائق النقل المورد للبون.
9. ملاحظات (notes): أي ملاحظات إضافية مذكورة.

أخرج النتيجة كـ JSON مطابق تماماً للمخطط (Schema) المعطى.`;

    parts.push({ text: prompt });

    if (textContent) {
      parts.push({ text: `النص المدخل للبون أو محتوى الشيت:\n${textContent}` });
    }

    if (fileBase64 && mimeType) {
      if (isExcelMimeType(mimeType)) {
        const xlText = parseExcelBase64(fileBase64);
        if (xlText) {
          parts.push({ text: `محتوى مستند إكسيل الذي تم رفعه وتحليله:\n${xlText}` });
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        });
      }
    }

    await generateStreamWithRetryAndFallback(ai, { parts }, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vouchers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ticketNo: { type: Type.STRING, description: "رقم البون / الإيصال الورقي أو المتسلسل" },
                  date: { type: Type.STRING, description: "تاريخ التوريد بصيغة YYYY-MM-DD" },
                  supplierName: { type: Type.STRING, description: "اسم المقاول أو المورد الفعلي" },
                  itemCode: { 
                    type: Type.STRING, 
                    enum: ["SANN_02", "SAND_01", "BARD_04", "CONC_03", "CEMT_05"],
                    description: "رمز المادة أو الخامة المطابق" 
                  },
                  rawQuantity: { type: Type.NUMBER, description: "الكمية أو التكعيب الفعلي المورد" },
                  unitPrice: { type: Type.NUMBER, description: "سعر المتر أو وحدة القياس المعتمدة للمورد" },
                  truckPlate: { type: Type.STRING, description: "رقم لوحة السيارة العربية المعدنية" },
                  driverName: { type: Type.STRING, description: "اسم السائق إن وجد" },
                  notes: { type: Type.STRING, description: "وصف أو تفاصيل إضافية مستنبطة" }
                },
                required: ["ticketNo", "date", "supplierName", "itemCode", "rawQuantity", "unitPrice"]
              }
            }
          },
          required: ["vouchers"]
        }
    }, res);

  } catch (error: any) {
    console.error("Voucher analysis error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل ملف بونات التوريد." });
    } else {
      res.end();
    }
  }
});

// Serve AI-powered Sarki (Equipment Daily Sheet) extraction
app.post("/api/gemini/analyze-sarki", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات التطبيق (Settings > Secrets) باسم 'GEMINI_API_KEY'."
      });
    }

    const { textContent, fileBase64, mimeType } = req.body;

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    const prompt = `أنت مهندس حركة ومعدات ذكي لشركات المقاولات.
مهمتك هي استخراج بيانات "سركي المعدة" أو "يومية عمل المعدة" من الصور أو النصوص أو ملفات PDF/Excel لمشروع إنشائي.
قم بتحليل الملف أو النص بدقة شديدة واستخراج أيام وساعات العمل لمعدة واحدة في مصفوفة JSON.

تأتي التفاصيل بالشكل التالي لكل يوم عمل:
1. اليوم (day): اسم اليوم بالعربية (مثل: السبت، الأحد، الاثنين، ...).
2. التاريخ (date): تاريخ اليوم بصيغة YYYY-MM-DD.
3. من الساعة (from): وقت بدء العمل (مثل: 8:00 ص، 08:00، 7:30 ص).
4. إلى الساعة (to): وقت انتهاء العمل (مثل: 4:00 م، 16:00، 5:00 م).
5. عدد الساعات الفعلي للعمل (durationValue): إجمالي ساعات العمل كرقم (مثلاً 8، 9.5).
6. ساعات الخصم/التوقف (deductedHours): عدد الساعات المستقطعة كأعطال أو خصومات (مثلاً 0، 1، 1.5).
7. ملاحظات (notes): أي ملاحظات مذكورة في السركي لهذا اليوم.

أخرج النتيجة كـ JSON مطابق تماماً للمخطط (Schema) المعطى. لا تضف أي بيانات غير موجودة، حاول الاستنتاج من السياق قدر الإمكان.`;

    parts.push({ text: prompt });

    if (textContent) {
      parts.push({ text: `النص المدخل للسركي أو محتواه:\n${textContent}` });
    }

    if (fileBase64 && mimeType) {
      if (isExcelMimeType(mimeType)) {
        const xlText = parseExcelBase64(fileBase64);
        if (xlText) {
          parts.push({ text: `محتوى مستند إكسيل الذي تم رفعه وتحليله:\n${xlText}` });
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        });
      }
    }

    await generateStreamWithRetryAndFallback(ai, { parts }, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            records: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "اسم اليوم (السبت، الأحد...)" },
                  date: { type: Type.STRING, description: "التاريخ YYYY-MM-DD" },
                  from: { type: Type.STRING, description: "وقت البدء" },
                  to: { type: Type.STRING, description: "وقت الانتهاء" },
                  durationValue: { type: Type.NUMBER, description: "عدد الساعات الفعلي" },
                  deductedHours: { type: Type.NUMBER, description: "ساعات الخصم/التوقف" },
                  notes: { type: Type.STRING, description: "ملاحظات" }
                },
                required: ["day", "date", "from", "to", "durationValue", "deductedHours"]
              }
            }
          },
          required: ["records"]
        }
    }, res);

  } catch (error: any) {
    console.error("Sarki analysis error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل ملف السركي." });
    } else {
      res.end();
    }
  }
});

// Serve AI-powered BOQ extraction from PDF
app.post("/api/gemini/analyze-boq", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات التطبيق (Settings > Secrets) باسم 'GEMINI_API_KEY' لتفعيل موديول الذكاء الاصطناعي لرفع المقايسة."
      });
    }

    const { fileBase64, mimeType } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: "لم يتم تسليم ملف المقايسة بنجاح." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    const prompt = `أنت مهندس حساب تكاليف وعقود خبير ومتخصص في مراجعة مقايسات الأعمال وجداول الكميات (BOQ) ومشاريع البنية التحتية والمقاولات في مصر والدول العربية.
مهمتك هي قراءة وتحليل ملف المقايسة المسعرة المرفق (جداول بنود المقايسة بنظام PDF أو صور أو غيرها) واستخراج بنود الأعمال وجدول الكميات والفئات بدقة متناهية.

قم بتحليل الملف بدقة شديدة واستخراج:
1. كود البند (code): الرقم أو الرمز الدال على البند (مثل: 1/1، 1-أ، 2/ب، أو 3). إذا لم يكن هناك كود صريح، قم بصياغة تسلسل مناسب بناءً على موقعه في المستند (مثل: "1"، "2"، "3").
2. بيان الأعمال / التوصيف (description): توصيف البند الفني بالكامل باللغة العربية كما هو وارد في المستند بدون اختصار مخل، لضمان جودة مواصفات البند.
3. الوحدة (unit): وحدة القياس المعتمدة للبند، ويجب تحويلها إلى الصيغ المتعارف عليها هندسياً في مصر (مثلاً: "م٣" لأعمال الحفر والردم والخرسانات، "م٢" للأسطح والطبقات الرابطة والدهانات، "م.ط" للبردورات أو الأنابيب، "طن" للحديد، "عدد" للمطابق أو الغرف، "مقطوعية" للأشغال العامة).
4. الكمية (quantity): الكمية التعاقدية لبيان الأعمال (رقم عشري أو صحيح موجب).
5. فئة السعر / ثمن الوحدة (price): فئة السعر أو سعر الوحدة المكتوب بالجنيه المصري (رقم عشري أو صحيح موجب). إذا لم يكن مسعراً أو فارغاً، ضع القيمة 0.

قاعدة هامة: يرجى استرجاع كافة بنود المقايسة المدرجة في المستند بالكامل دون تخطي أو إغفال للبنود.

يرجى إخراج النتيجة بتنسيق JSON مطابق تماماً للمخطط (Schema) المرفق.`;

    parts.push({ text: prompt });

    parts.push({
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: fileBase64
      }
    });

    await generateStreamWithRetryAndFallback(ai, { parts }, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "كود البند، مثل 1/1 أو 2-أ أو 3" },
                  description: { type: Type.STRING, description: "بيان الأعمال أو توصيف البند باللغة العربية" },
                  unit: { type: Type.STRING, description: "وحدة القياس للمقايسة، مثل م٣، م٢، م.ط، عدد، طن، مقطوعية" },
                  quantity: { type: Type.NUMBER, description: "الكمية التعاقدية للبند" },
                  price: { type: Type.NUMBER, description: "الفئة أو سعر الوحدة بالجنيه المصري" }
                },
                required: ["code", "description", "unit", "quantity", "price"]
              }
            }
          },
          required: ["items"]
        }
    }, res);

  } catch (error: any) {
    console.error("BOQ analysis error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل ملف المقايسة بالذكاء الاصطناعي." });
    } else {
      res.end();
    }
  }
});

// Serve AI-powered Schedule Generation from BOQ
app.post("/api/gemini/generate-schedule", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات التطبيق (Settings > Secrets) باسم 'GEMINI_API_KEY' لتفعيل موديول التوليد الذكي للجدول الزمني."
      });
    }

    const { boqItems } = req.body;
    if (!boqItems || !Array.isArray(boqItems) || boqItems.length === 0) {
      return res.status(400).json({ error: "لم يتم تسليم بنود مقايسة صالحة لتوليد الجدول الزمني." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    const prompt = `أنت مهندس تخطيط ومتابعة محترف (Planning Engineer) وخبير في إدارة مشاريع التشييد والبنية التحتية والطرق وجداول الكميات (BOQ).
مهمتك هي صياغة وتوليد جدول زمني رقمي كامل ومنظم (WBS Tasks / Gantt Chart Schedule) بناءً على بنود المقايسة المعتمدة المرفقة أدناه.

قائمة بنود المقايسة (BOQ Items):
${JSON.stringify(boqItems, null, 2)}

التعليمات الهندسية لإنشاء الجدول الزمني:
1. قم بإنشاء نشاط لكل بند من بنود المقايسة المرفقة. يجب أن يتطابق 'wbsCode' للنشاط تماماً مع 'code' الخاص بالبند المقابل في المقايسة لربطهما معاً.
2. حدد تاريخ البداية (startDate) وتاريخ النهاية (endDate) لكل نشاط بشكل واقعي ومتتابع منطقياً. افترض أن تاريخ بدء المشروع هو 2026-06-01.
3. قم بتوزيع الأنشطة على المراحل الإنشائية المناسبة (phase) والاسم العربي المناسب للمرحلة (phaseNameAr) وفقاً للخيارات التالية:
   - 'preparatory' ➔ 'أعمال تحضيرية وتجهيز الموقع' (لأعمال الحفر الأولية، الإخلاء وتجهيز المكاتب واللافتات)
   - 'excavation' ➔ 'أعمال الحفر والردم والتسويات' (لأعمال القطع والحفر والردم وتسوية المناسيب)
   - 'subbase' ➔ 'أعمال طبقة الأساس والفرش' (لأعمال توريد وفرش ودك سن الأساس وطبقة التشريب)
   - 'asphalt' ➔ 'أعمال الرصف والطبقة الأسفلتية' (للطبقات الرابطة والسطحية الأسفلتية)
   - 'curbstone' ➔ 'أعمال البردورات والبلدورات والإنترلوك' (للبلدورات والبلدورات الخرسانية وبلاطات الإنترلوك)
   - 'lighting' ➔ 'أعمال الإنارة وكابلات الكهرباء' (لأعمدة الإنارة، غرف التفتيش، الكابلات وتغذية الكهرباء)
   - 'signage' ➔ 'أعمال الدهانات واللوحات الإرشادية والتحكم المروري' (لتخطيط الطرق واللوحات والشاخصات)
4. احسب المدد الزمنية بشكل منطقي يتناسب مع كمية البند ووحدة قياسه (الكميات الكبيرة تستغرق زمناً أطول).
5. حدد نسبة إنجاز واقعية للأنشطة بناءً على التسلسل الزمني المفترض (الأنشطة الأولى قد تكون مكتملة أو متقدمة، والأنشطة الأخيرة 0% وهكذا).
6. عيّن المسار الحرج (criticalPath) بشكل هندسي صحيح لبعض الأنشطة الأساسية المتتابعة التي يؤدي تأخرها لتأخر المشروع.
7. حدد حالة منطقية لكل نشاط (status): 'completed' (للأنشطة المنتهية)، 'on_track' (للأنشطة الجارية المنتظمة)، 'behind' (للأنشطة الجارية المتأخرة زمنيًا).

يرجى إخراج النتيجة بتنسيق JSON مطابق تماماً للمخطط (Schema) المرفق لضمان سلامة دمج البيانات وسرعة العرض.`;

    parts.push({ text: prompt });

    await generateStreamWithRetryAndFallback(ai, { parts }, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  wbsCode: { type: Type.STRING, description: "رمز البند المقابل للـ BOQItem" },
                  name: { type: Type.STRING, description: "اسم النشاط / عنوان البند باللغة العربية" },
                  phase: { type: Type.STRING, description: "كود المرحلة الإنشائية: 'preparatory' | 'excavation' | 'subbase' | 'asphalt' | 'curbstone' | 'lighting' | 'signage'" },
                  phaseNameAr: { type: Type.STRING, description: "الاسم العربي للمرحلة المقابلة لكود المرحلة" },
                  plannedProgress: { type: Type.NUMBER, description: "النسبة المخططة للإنجاز (رقم من 0 إلى 100)" },
                  actualProgress: { type: Type.NUMBER, description: "النسبة الفعلية للإنجاز (رقم من 0 إلى 100)" },
                  startDate: { type: Type.STRING, description: "تاريخ بداية النشاط بصيغة YYYY-MM-DD" },
                  endDate: { type: Type.STRING, description: "تاريخ نهاية النشاط بصيغة YYYY-MM-DD" },
                  criticalPath: { type: Type.BOOLEAN, description: "هل يقع النشاط على المسار الحرج؟" },
                  status: { type: Type.STRING, description: "حالة النشاط: 'on_track' | 'behind' | 'completed' | 'ahead'" }
                },
                required: ["wbsCode", "name", "phase", "phaseNameAr", "plannedProgress", "actualProgress", "startDate", "endDate", "criticalPath", "status"]
              }
            }
          },
          required: ["tasks"]
        }
    }, res);

  } catch (error: any) {
    console.error("Schedule generation error:", error);
    if (!res.headersSent) {
      let errorMessage = error.message || "حدث خطأ غير متوقع أثناء توليد الجدول الزمني بالذكاء الاصطناعي.";
      if (String(errorMessage).includes("403") || String(errorMessage).includes("PERMISSION_DENIED")) {
          errorMessage = "تم رفض الوصول لخدمات الذكاء الاصطناعي (403). يرجى التأكد من صلاحية مفتاح الـ API الخاص بك.";
      }
      res.status(500).json({ error: errorMessage });
    } else {
      res.end();
    }
  }
});

// Serve AI Supplies Analyzer and Supplier/Item extractor
app.post("/api/gemini/analyze-supplies", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته في إعدادات التطبيق (Settings > Secrets) باسم 'GEMINI_API_KEY' لتفعيل موديول تحليل التوريدات المتقدم بالذكاء الاصطناعي."
      });
    }

    const { textContent, fileBase64, mimeType } = req.body;

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts: any[] = [];

    const prompt = `أنت مهندس تكاليف مالي متخصص ومراجع دقيق جداً للمشاريع الهندسية وأعمال رصف الطرق والمقاولات العامة في مصر.
مهمتك هي تحليل وقراءة بيان أو كشف توريدات سابق (سواء كان مرفوعاً كصورة أو ملف PDF أو نص أو مستند إكسيل).

★ قاعدة ذهبية صارمة جداً (الأهمية القصوى للاكتمال والدقة):
- يجب عليك استخراج *كل بون أو إيصال أو حركة توريد فردية* مذكورة في المستند بالكامل دون استثناء أو إغفال أو تجميع أو تلخيص لأي صفوف أو بونات مهما كثر عددها (حتى لو كان هناك 50 أو 100 أو أكثر من البونات).
- يمنع تماماً دمج الحركات المتشابهة في حركة واحدة؛ كل بون/إيصال مستقل يجب أن يظهر كعنصر مستقل في مصفوفة 'supplyRecords' ليكون البيان دقيقاً ومطابقاً للواقع بنسبة 100%.
- إذا كان المستند طويلاً جداً، استمر في سرد كافة السجلات الفردية حتى آخر بون في الملف بالتفصيل الممل.

استخرج التفاصيل التالية بدقة متناهية:
1. سجلات التوريد الفردية الكاملة (Supply Records) التي تم توريدها للموقع (مثل بونات الرمل، السن، الإسمنت، الخرسانة، إلخ).
2. قائمة بجميع الموردين أو المقاولين المذكورين في المستند (Suppliers) لكي نتمكن من تسجيلهم تلقائياً في قاعدة البيانات إذا لم يكونوا موجودين.
3. قائمة بجميع المواد والخامات والمعدات والمخزونات المذكورة في المستند (Items/Materials) لكي نتمكن من إضافتها تلقائياً.

يرجى مراعاة القواعد الهندسية والمالية التالية:
- قم بتحويل التواريخ الواردة في المستند إلى الصيغة القياسية YYYY-MM-DD. إذا ذكرت تواريخ جزئية أو غير واضحة، حاول استنباطها أو توحيدها حسب سياق التقرير.
- رقم البون (ticketNo) يجب استخراجه بدقة، وإذا لم يوجد رقم بون صريح، قم بتوليد رقم تسلسلي فريد متتابع يبدأ بـ 'AUTO-' متبوعاً برقم فريد (مثلاً AUTO-1001, AUTO-1002...).
- الكمية الواردة بالبون (rawQuantity) يجب استخراجها بدقة عالية كرقم عشري أو صحيح.
- سعر الوحدة (unitPrice) يجب استخراجه كرقم بالجنيه المصري (EGP).
- التكلفة الإجمالية (totalCost) يجب أن تساوي الكمية مضروبة في سعر الوحدة بدقة حسابية كاملة.
- استخرج اسم المورد (supplierName) بدقة كما هو وارد في التقرير.
- حدد اسم المادة (itemName) بدقة، واقترح كوداً مميزاً للمادة (itemCode) باللغة العربية (مثلاً: رمل-حرش، سن-١، إسمنت-بورتلاند).
- إذا كان هناك لوحة سيارة أو قلاب، استخرجها في حقل truckPlate. إذا لم تكن موجودة، اتركها كـ "عامة" أو "لوحة غير معروفة".
- بالنسبة للموردين المستخرجين (extractedSuppliers)، يجب أن تحدد اسم المورد (name) وكود الخامة المرتبط بها (materialCode) الذي يتطابق مع كود الخامة المستخرجة.
- بالنسبة للخامات المستخرجة (extractedItems)، حدد كود مقترح للخامة (code)، اسم الخامة (name)، الوحدة (unit - مثلاً م٣ أو طن أو قطعة)، والسعر الافتراضي للوحدة (defaultPrice).

يرجى صياغة وتنسيق المخرجات ككائن JSON متوافق مع المخطط (Schema) التالي تماماً لضمان المعالجة الدقيقة والأداء العالي.`;

    parts.push({ text: prompt });

    if (textContent) {
      parts.push({ text: `النص المكتوب أو المدخل لبيان التوريدات:\n${textContent}` });
    }

    if (fileBase64 && mimeType) {
      if (isExcelMimeType(mimeType)) {
        const xlText = parseExcelBase64(fileBase64);
        if (xlText) {
          parts.push({ text: `محتوى جدول إكسيل المرفوع:\n${xlText}` });
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64
          }
        });
      }
    }

    await generateStreamWithRetryAndFallback(ai, { parts }, {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplyRecords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "تاريخ التوريد بصيغة YYYY-MM-DD" },
                  ticketNo: { type: Type.STRING, description: "رقم البون أو الإيصال الورقي" },
                  truckPlate: { type: Type.STRING, description: "رقم لوحة القلاب/السيارة" },
                  supplierName: { type: Type.STRING, description: "اسم مورد المادة" },
                  itemName: { type: Type.STRING, description: "اسم المادة الموردة (رمل، سن، إسمنت، إلخ)" },
                  itemCode: { type: Type.STRING, description: "كود مقترح للمادة باللغة العربية (مثلاً: رمل-حرش، سن-١)" },
                  rawQuantity: { type: Type.NUMBER, description: "الكمية الواردة بالبون" },
                  unitPrice: { type: Type.NUMBER, description: "سعر الوحدة ج.م" },
                  totalCost: { type: Type.NUMBER, description: "الإجمالي ج.م" },
                  unit: { type: Type.STRING, description: "الوحدة (م٣، طن، إلخ)" },
                  driverName: { type: Type.STRING, description: "اسم السائق إن وجد" },
                  supplyLocation: { type: Type.STRING, description: "مكان التوريد أو قطاع الطرق إن وجد" },
                  notes: { type: Type.STRING, description: "ملاحظات إضافية" }
                },
                required: ["date", "ticketNo", "truckPlate", "supplierName", "itemName", "itemCode", "rawQuantity", "unitPrice", "totalCost"]
              }
            },
            extractedSuppliers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "اسم المورد" },
                  materialCode: { type: Type.STRING, description: "كود الخامة الموردة المرتبط بها" },
                  phone: { type: Type.STRING, description: "رقم الهاتف إن وجد" },
                  notes: { type: Type.STRING, description: "ملاحظات عن المورد" }
                },
                required: ["name", "materialCode"]
              }
            },
            extractedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING, description: "كود الخامة المقترح" },
                  name: { type: Type.STRING, description: "اسم الخامة باللغة العربية" },
                  unit: { type: Type.STRING, description: "الوحدة (م٣، طن، إلخ)" },
                  defaultPrice: { type: Type.NUMBER, description: "السعر الافتراضي للوحدة إن وجد" }
                },
                required: ["code", "name", "unit", "defaultPrice"]
              }
            }
          },
          required: ["supplyRecords", "extractedSuppliers", "extractedItems"]
        }
    }, res);

  } catch (error: any) {
    console.error("Supplies analysis error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل بيان التوريدات بالذكاء الاصطناعي." });
    } else {
      res.end();
    }
  }
});

// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(/* @vite-ignore */ viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production (like on Vercel), express.static and the wildcard route are needed
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Not Found");
        }
      });
    }
  }

  // Only listen on a port if we're not in a serverless environment (detected by common vars)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

export default app;
