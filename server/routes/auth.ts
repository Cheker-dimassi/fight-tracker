import type { RequestHandler, Request } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadJsonFile, saveJsonFile } from "../lib/persistence";

type StoredUser = { id: string; email: string; passwordHash: string; createdAt: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_FILE = 'auth.json';

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
  : [];

const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || "dev-local-auth-secret";
if (!process.env.AUTH_TOKEN_SECRET) {
  console.warn(
    "⚠️ WARNING: AUTH_TOKEN_SECRET is not configured. Authentication tokens will be signed with a weak development secret. " +
      "Set AUTH_TOKEN_SECRET in production to prevent token forgery."
  );
}

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function signToken(email: string): string {
  const payload = JSON.stringify({ email, exp: Date.now() + 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

function verifyToken(token: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const separatorIndex = decoded.lastIndexOf(".");
    if (separatorIndex <= 0) return null;
    const payload = decoded.slice(0, separatorIndex);
    const signature = decoded.slice(separatorIndex + 1);
    const expectedSignature = crypto.createHmac("sha256", AUTH_TOKEN_SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
      return null;
    }
    const data = JSON.parse(payload);
    if (typeof data.email !== "string" || typeof data.exp !== "number") {
      return null;
    }
    if (Date.now() > data.exp) {
      return null;
    }
    return { email: data.email };
  } catch {
    return null;
  }
}

function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, actualSalt, 64).toString("hex");
  return `${actualSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

function getBearerToken(req: Request): string {
  const rawAuth = req.headers.authorization;
  const auth = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (typeof auth !== "string") {
    return "";
  }
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return auth;
}

export const emailToUser: Map<string, StoredUser> = new Map();
export type { StoredUser };
export { isAdminEmail };

function loadUsers() {
  const users = loadJsonFile<StoredUser[]>(AUTH_FILE, []);
  for (const user of users) {
    if (user?.email) {
      emailToUser.set(user.email.toLowerCase(), user);
    }
  }
  console.log(`🔑 Loaded ${emailToUser.size} users from disk.`);
}

function saveUsers() {
  saveJsonFile(AUTH_FILE, Array.from(emailToUser.values()));
}

loadUsers();

export const requireAdmin: RequestHandler = (req, res, next) => {
  const token = getBearerToken(req);
  const verified = verifyToken(token);

  if (!verified) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const normalized = verified.email.trim().toLowerCase();
  if (!isAdminEmail(normalized)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = emailToUser.get(normalized);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
};

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

  const token = signToken(normalized);
  const isAdmin = isAdminEmail(normalized);

  return res.json({ token, user: { id: user.id, email: user.email, isAdmin } });
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

  const token = signToken(normalized);
  const isAdmin = isAdminEmail(normalized);

  return res.json({ token, user: { id: stored.id, email: stored.email, isAdmin } });
};

export const getMe: RequestHandler = (req, res) => {
  const token = getBearerToken(req);
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = emailToUser.get(verified.email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ id: user.id, email: user.email, isAdmin: isAdminEmail(user.email) });
};


