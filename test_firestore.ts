import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function testAdminSdk() {
  console.log("=== FIRESTORE ADMIN SDK AFTER PROVISIONING ===");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found!");
    return;
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  try {
    if (!getApps().length) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    console.log("Admin SDK initializeApp succeeded.");

    const databaseId = firebaseConfig.firestoreDatabaseId;
    let db;
    if (databaseId && databaseId !== "(default)") {
      db = getFirestore(getApp(), databaseId);
    } else {
      db = getFirestore();
    }
    console.log("Admin SDK getFirestore succeeded for database:", databaseId);

    console.log("Attempting to write a document to users/moataz...");
    const ref = db.collection('users').doc('moataz');
    await ref.set({ nameAr: "متاز يونس", role: "admin", username: "moataz", password: "123" });
    console.log("Write succeeded!");

    console.log("Attempting to read the document back...");
    const snap = await ref.get();
    if (snap.exists) {
      console.log("Read succeeded! Data:", snap.data());
    } else {
      console.warn("Read returned non-existent document.");
    }
  } catch (err: any) {
    console.error("FAILURE:", err);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

testAdminSdk();
