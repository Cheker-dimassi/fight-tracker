import type { RequestHandler } from "express";
import crypto from "node:crypto";

type StoredUser = { id: string; email: string; passwordHash: string; createdAt: string };

// Dev-only in-memory store
const emailToUser: Map<string, StoredUser> = new Map();
const tokenToEmail: Map<string, string> = new Map();

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


