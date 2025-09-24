import type { Request, Response } from "express";

export async function postFightCardStatusProxy(req: Request, res: Response) {
  try {
    const url = process.env.ZYLA_CARD_STATUS_API_URL || "https://zylalabs.com/api/5480/ufc+fight+schedule+tracker+api/7104/get+fight+card+status";
    const apiKey = process.env.ZYLA_API_KEY || process.env.ZYLA_CARD_STATUS_API_KEY || "";
    const keyHeader = process.env.ZYLA_API_KEY_HEADER || process.env.ZYLA_CARD_STATUS_API_KEY_HEADER || "Authorization";

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers[keyHeader] = keyHeader.toLowerCase() === "authorization" ? `Bearer ${apiKey}` : apiKey;
      if (!headers["Authorization"]) headers["Authorization"] = `Bearer ${apiKey}`;
      headers["apikey"] = apiKey;
      headers["x-api-key"] = apiKey;
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body || {}),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream ${upstream.status} ${upstream.statusText}`, body: text });
    }

    if (contentType.includes("application/json")) {
      const data = JSON.parse(text);
      return res.json(data);
    }

    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      return res.json({ raw: text });
    }
  } catch (err) {
    console.error("❌ Error proxying fight card status:", err);
    return res.status(500).json({ error: "Failed to fetch fight card status" });
  }
}
