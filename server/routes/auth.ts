import type { RequestHandler } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoredUser = { id: string; email: string; passwordHash: string; createdAt: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../.data");
const AUTH_FILE = path.join(DATA_DIR, "auth.json");

// Ensure directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.error("Failed to create data directory:", e);
}

// Dev-only store, loaded from disk
const emailToUser: Map<string, StoredUser> = new Map();
const tokenToEmail: Map<string, string> = new Map();

function loadUsers() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        for (const user of parsed) {
          if (user && user.email) {
            emailToUser.set(user.email.toLowerCase(), user);
          }
        }
      }
      console.log(`🔑 Loaded ${emailToUser.size} users from disk.`);
    }
  } catch (e) {
    console.error("Failed to load users from disk:", e);
  }
}

// Initialize on startup
loadUsers();

function saveUsers() {
  try {
    const list = Array.from(emailToUser.values());
    const tempFile = `${AUTH_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), "utf8");
    fs.renameSync(tempFile, AUTH_FILE);
  } catch (e) {
    console.error("Failed to save users to disk:", e);
  }
}

function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, actualSalt, 64).toString("hex");
  return `${actualSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

function createToken(email: string): string {
  const token = crypto.randomBytes(24).toString("hex");
  tokenToEmail.set(token, email);
  return token;
}

export const postSignUp: RequestHandler = (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const normalized = email.trim().toLowerCase();
  if (emailToUser.has(normalized)) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  emailToUser.set(normalized, user);
  saveUsers();
  const token = createToken(normalized);
  return res.json({ token, user: { id: user.id, email: user.email } });
};

export const postSignIn: RequestHandler = (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const normalized = email.trim().toLowerCase();
  const stored = emailToUser.get(normalized);
  if (!stored || !verifyPassword(password, stored.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = createToken(normalized);
  return res.json({ token, user: { id: stored.id, email: stored.email } });
};

export const getMe: RequestHandler = (req, res) => {
  const auth = (req.headers["authorization"] as string | undefined) ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  const email = tokenToEmail.get(token);
  if (!email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = emailToUser.get(email)!;
  return res.json({ id: user.id, email: user.email });
};


