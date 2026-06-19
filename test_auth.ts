import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

async function test() {
  const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
  const app = initializeApp({ projectId: config.projectId });
  try {
    const token = await getAuth(app).createCustomToken("test-uid");
    console.log("Custom Token:", token);
  } catch (e: any) {
    console.error("Auth Error:", e.message);
  }
}
test();
