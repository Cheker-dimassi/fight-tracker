import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_DIR = path.join(__dirname, "../../.data");

const isRunningOnNetlify = process.env.NETLIFY === "true" || process.env.NETLIFY === "1";
const isProduction = process.env.NODE_ENV === "production";

function shouldWarn() {
  return isRunningOnNetlify || isProduction;
}

if (shouldWarn()) {
  console.warn(
    "⚠️ WARNING: Local JSON persistence under .data/ is not durable in serverless deployments. " +
      "Netlify functions have an ephemeral filesystem and data written to disk may disappear after deploys or cold starts. " +
      "Replace this with a hosted store such as Netlify Blobs, Supabase, or Turso for production."
  );
}

export function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to create persistence directory:", error);
  }
}

export function loadJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) {
      return defaultValue;
    }
    const value = fs.readFileSync(filepath, "utf8");
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to load ${filename}:`, error);
    return defaultValue;
  }
}

export function saveJsonFile<T>(filename: string, data: T) {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  const tempFile = `${filepath}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempFile, filepath);
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error);
  }
}
