import type { Request, Response } from "express";

export async function getUpcomingFightsProxy(_req: Request, res: Response) {
  try {
    const provided = process.env.ZYLA_UPCOMING_API_URL;
    const candidates = [
      provided,
      "https://zylalabs.com/api/5488/fight+night+api/7119/get+upcoming+fights",
      "https://zylalabs.com/api/5480/ufc+fight+schedule+tracker+api/7103/get+upcoming+fights",
    ].filter(Boolean) as string[];

    const method = (process.env.ZYLA_UPCOMING_HTTP_METHOD || "POST").toUpperCase();
    const apiKey = process.env.ZYLA_API_KEY || process.env.ZYLA_UPCOMING_API_KEY || "";
    const keyHeader = process.env.ZYLA_API_KEY_HEADER || process.env.ZYLA_UPCOMING_API_KEY_HEADER || "Authorization";

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (apiKey) {
      // Primary header (env overrides)
      headers[keyHeader] = keyHeader.toLowerCase() === "authorization" ? `Bearer ${apiKey}` : apiKey;
      // Also set common alternatives for compatibility with Zyla providers
      if (!headers["Authorization"]) headers["Authorization"] = `Bearer ${apiKey}`;
      headers["apikey"] = apiKey;
      headers["x-api-key"] = apiKey;
    }

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const upstream = await fetch(url, {
          method,
          headers,
          body: method === "POST" ? JSON.stringify({}) : undefined,
        });
        const text = await upstream.text();
        const contentType = upstream.headers.get("content-type") || "application/json";
        if (!upstream.ok) {
          lastErr = { status: upstream.status, text };
          continue;
        }
        if (contentType.includes("application/json")) {
          const data = JSON.parse(text);
          return res.json(data);
        }
        try { return res.json(JSON.parse(text)); } catch { return res.json({ raw: text }); }
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    return res.status(502).json({ error: "All upstreams failed", detail: lastErr?.message || lastErr });
  } catch (err) {
    console.error("❌ Error proxying upcoming fights:", err);
    return res.status(500).json({ error: "Failed to fetch upcoming fights" });
  }
}
