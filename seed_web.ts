import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Resilient Local JSON File Database Fallback
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function setLocalTable(table: string, data: any[]) {
  const filePath = path.join(DATA_DIR, `${table}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`[Local DB Seed] Seeded table "${table}" locally with ${data.length} items.`);
  } catch (err) {
    console.error(`[Local DB Seed] failed to write table ${table}:`, err);
  }
}

async function seed() {
  console.log("=== SEEDING DATABASE WITH INITIAL DATA ===");

  const users = [
    { id: "moataz", username: "moataz", nameAr: "م. معتز يونس", password: "123", role: "admin" },
    { id: "ahmed", username: "ahmed", nameAr: "أحمد سيد", password: "123", role: "user" },
    { id: "omar", username: "omar", nameAr: "عمر فاروق", password: "123", role: "user" }
  ];

  const sites = [
    { id: "site-101", nameAr: "مشروع محور صلاح سالم", location: "القاهرة - مصر الجديدة", description: "إنشاء كوبري وتوسعة مسارات" },
    { id: "site-102", nameAr: "طريق المحيط الإقليمي", location: "الجيزة - الواحات", description: "رصف الطريق الدائري الإقليمي بطول ٥٠ كم" }
  ];

  const siteProjects = [
    {
      id: "site-101",
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
    },
    {
      id: "site-102",
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
    }
  ];

  // Seed local database files
  setLocalTable("users", users);
  setLocalTable("sites", sites);
  setLocalTable("projects", siteProjects);

  // Sync with Supabase if active
  if (supabaseUrl && supabaseKey) {
    try {
      console.log("Initializing Supabase client...");
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log("Seeding Users to Supabase...");
      for (const u of users) {
        const { error } = await supabase.from("users").upsert(u);
        if (error) console.error(`[Supabase Seed User] error:`, error);
      }

      console.log("Seeding Sites to Supabase...");
      for (const s of sites) {
        const { error } = await supabase.from("sites").upsert(s);
        if (error) console.error(`[Supabase Seed Site] error:`, error);
      }

      console.log("Seeding Projects to Supabase...");
      for (const p of siteProjects) {
        const { error } = await supabase.from("projects").upsert(p);
        if (error) console.error(`[Supabase Seed Project] error:`, error);
      }

      console.log("Supabase seeding complete!");
    } catch (err) {
      console.error("Supabase seeding failed, falling back safely to offline files:", err);
    }
  }

  console.log("Seeding complete successfully!");
}

seed();
