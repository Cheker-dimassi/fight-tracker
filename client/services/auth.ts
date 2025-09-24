import { AuthRequest, AuthResponse, MeResponse } from "@shared/api";
import { apiFetch } from "./http";

const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json" };

export async function signIn(payload: AuthRequest): Promise<AuthResponse> {
  const res = await fetch(`/api/auth/signin`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Sign in failed");
  return res.json();
}

export async function signUp(payload: AuthRequest): Promise<AuthResponse> {
  const res = await fetch(`/api/auth/signup`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Sign up failed");
  return res.json();
}

export async function getMe(token: string): Promise<MeResponse> {
  const res = await apiFetch(`/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Unauthorized");
  return res.json();
}

export function saveToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function readToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}


