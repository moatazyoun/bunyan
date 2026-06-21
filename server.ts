/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import * as XLSX from "xlsx";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

const firebaseApp = initializeApp(firebaseConfig);

const dbId = (firebaseConfig.firestoreDatabaseId === "(default)" || firebaseConfig.firestoreDatabaseId === "") ? undefined : firebaseConfig.firestoreDatabaseId;

let secureDb: any;
try {
  secureDb = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
  }, dbId);
} catch (e: any) {
  secureDb = getFirestore(firebaseApp, dbId);
}

const db = secureDb;

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

const app = express();
const PORT = 3000;

// Set request limits for handling larger uploaded base64 mock files / report screenshots
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
    
    allUsers.docs.forEach(doc => {
      const userData = doc.data();
      let assignedProjects = userData.assignedProjects || [];
      const username = doc.id;
      
      const shouldHaveAccess = usernames.includes(username);
      const currentlyHasAccess = assignedProjects.includes(projectId);
      
      if (shouldHaveAccess && !currentlyHasAccess) {
        assignedProjects.push(projectId);
        usersBatch.set(doc.ref, { assignedProjects }, { merge: true });
      } else if (!shouldHaveAccess && currentlyHasAccess) {
        assignedProjects = assignedProjects.filter((id: string) => id !== projectId);
        usersBatch.set(doc.ref, { assignedProjects }, { merge: true });
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
  try {
    await deleteDoc(doc(db, 'sites', id));
    await deleteDoc(doc(db, 'siteData', id));
    res.json({ success: true });
  } catch (err) {
    console.error("Delete site error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/site/:siteId/data", async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: "قاعدة البيانات غير متصلة على الخادم." });
  }
  const { siteId } = req.params;

  try {
    const docSnap = await getDoc(doc(db, 'siteData', siteId));
    res.json(docSnap.data() || {});
  } catch (err) {
    console.error("Get site data error:", err);
    res.status(500).json({ error: "Internal server error" });
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
    await setDoc(doc(db, 'siteData', siteId), data, { merge: true });
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
    
    await setDoc(doc(db, 'siteBackups', backupId), {
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
    const snapshot = await getDocs(collection(db, 'siteBackups'));
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
    await setDoc(doc(db, 'siteBackups', backupId), {
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
    const docRef = doc(db, 'siteBackups', backupId);
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
    await deleteDoc(doc(db, 'siteBackups', backupId));
    res.json({ success: true });
  } catch (err: any) {
    console.error("Delete backup error:", err);
    res.status(500).json({ error: err.message || "Failed to delete backup" });
  }
});

app.get("/api/db-status", async (req, res) => {
    if (db) {
      res.json({ 
        connected: true, 
        cloud: true, 
        mode: "سحابي نشط (Firestore)", 
        info: "متصل بقاعدة البيانات السحابية بنجاح" 
      });
    } else {
      res.json({ 
        connected: false, 
        cloud: false, 
        mode: "التخزين المحلي", 
        info: "قاعدة البيانات السحابية غير مهيأة على خادم التطبيق" 
      });
    }
});

// Helper for Gemini content generation with retry and model fallback to eliminate 503 unavailability
async function generateWithRetryAndFallback(ai: any, contents: any, config: any) {
  const modelsToTry = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxAttempts = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini Request] Attempting model ${model} (Attempt ${attempt}/${maxAttempts})...`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        console.log(`[Gemini Success] Successfully generated content with model ${model}`);
        return response;
      } catch (error: any) {
        lastError = error;
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
          const jitter = Math.random() * 800; // adding random delay to avoid collision
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

  throw lastError || new Error("فشلت جميع محاولات الاتصال بنماذج الذكاء الاصطناعي بسبب الضغط العالي المؤقت. يرجى إعادة المحاولة بعد ثوانٍ قليلة.");
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

    const response = await generateWithRetryAndFallback(ai, { parts }, {
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
    });

    const resultText = response.text;
    res.json(JSON.parse(resultText || "{}"));
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل التقرير بالذكاء الاصطناعي." });
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

    const response = await generateWithRetryAndFallback(ai, { parts }, {
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
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Voucher analysis error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل ملف بونات التوريد." });
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

    const response = await generateWithRetryAndFallback(ai, { parts }, {
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
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("BOQ analysis error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء تحليل ملف المقايسة بالذكاء الاصطناعي." });
  }
});

// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
  if (!process.env.VERCEL && !process.env.NOW_REGION) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer();

export default app;
