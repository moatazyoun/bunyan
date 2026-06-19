import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function seed() {
  console.log("=== SEEDING FIRESTORE WITH INITIAL DATA ===");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found!");
    return;
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  try {
    const app = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
    console.log("Web SDK initializeApp succeeded.");

    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    
    // Seed Users
    const users = [
      { username: "moataz", nameAr: "م. معتز يونس", password: "123", role: "admin" },
      { username: "ahmed", nameAr: "أحمد سيد", password: "123", role: "user" },
      { username: "omar", nameAr: "عمر فاروق", password: "123", role: "user" }
    ];
    for (const u of users) {
      await setDoc(doc(db, "users", u.username), u);
      console.log(`Seeded user: ${u.username}`);
    }

    // Seed Sites
    const sites = [
      { id: "site-101", nameAr: "مشروع محور صلاح سالم", location: "القاهرة - مصر الجديدة", description: "إنشاء كوبري وتوسعة مسارات" },
      { id: "site-102", nameAr: "طريق المحيط الإقليمي", location: "الجيزة - الواحات", description: "رصف الطريق الدائري الإقليمي بطول ٥٠ كم" }
    ];
    for (const s of sites) {
      await setDoc(doc(db, "sites", s.id), s);
      console.log(`Seeded site: ${s.id}`);
      
      // Also init empty data for them
      await setDoc(doc(db, "siteData", s.id), {
        transactions: [],
        custodies: [],
        contractors: [],
        equipment: [],
        maintenanceOrders: [],
        srsDocuments: [],
        srsItems: [],
        weatherLogs: [],
        attendanceLogs: [],
        materials: []
      });
      console.log(`Seeded site data for: ${s.id}`);
    }

    console.log("Seeding complete!");
  } catch (err: any) {
    console.error("SEED FAILURE:", err);
  }
}

seed();
