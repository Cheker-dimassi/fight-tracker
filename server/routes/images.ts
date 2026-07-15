import type { Request, Response } from "express";

// Wikimedia requires a descriptive User-Agent on all requests — requests
// without one (or with a generic default) can be silently throttled or
// blocked, which is why some lookups were failing even for well-known
// fighters. Replace the contact info below with your own (an email or a
// URL both work) per https://foundation.wikimedia.org/wiki/Policy:User-Agent_Policy
const WIKI_HEADERS = {
  Accept: "application/json",
  "User-Agent": "FightTracker/1.0 (https://github.com/cheker123/fight-tracker; chekerallahd@gmail.com)",
};

async function searchWikipedia(query: string) {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: WIKI_HEADERS });
  if (!res.ok) return null;
  const json: any = await res.json();
  const page = json?.pages?.[0];
  if (!page) return null;
  const thumb = page?.thumbnail?.url || page?.image?.urls?.[0];
  // Try page summary for better image if needed
  let best = thumb;
  try {
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`, { headers: WIKI_HEADERS });
    if (summaryRes.ok) {
      const sum: any = await summaryRes.json();
      best = sum?.originalimage?.source || sum?.thumbnail?.source || best;
    }
  } catch {}
  return { title: page.title, url: best || null };
}

export async function getFighterImage(req: Request, res: Response) {
  try {
    const name = String(req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing name" });
    const result = await searchWikipedia(name);
    // "Not found" is a normal outcome here, not a server error — respond 200
    // with url: null instead of 404 so the browser doesn't log it as a
    // failed network request.
    if (!result?.url) return res.json({ url: null, title: null });
    res.json({ url: result.url, title: result.title });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch fighter image" });
  }
}

export async function getEventPoster(req: Request, res: Response) {
  try {
    const event = String(req.query.event || "").trim();
    if (!event) return res.status(400).json({ error: "Missing event" });
    // Improve hit rate by prefixing UFC if not present
    const q = /UFC/i.test(event) ? event : `UFC ${event}`;
    const result = await searchWikipedia(`${q} poster`);
    if (!result?.url) {
      // Fallback: search without poster suffix
      const alt = await searchWikipedia(q);
      if (!alt?.url) return res.json({ url: null, title: null });
      return res.json({ url: alt.url, title: alt.title });
    }
    res.json({ url: result.url, title: result.title });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch event poster" });
  }
}
