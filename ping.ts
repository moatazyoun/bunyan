import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

async function test() {
  try {
    await setDoc(doc(db, "sites", "test-ping-site"), { test: "site-is-writable" });
    console.log("Success!");
    process.exit(0);
  } catch(e) {
    console.error("Fail:", e);
    process.exit(1);
  }
}
test();
