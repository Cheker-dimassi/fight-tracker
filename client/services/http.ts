import { clearToken } from "@/services/auth";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    // Clear token and notify app to redirect
    try { clearToken(); } catch {}
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }
  return res;
}


