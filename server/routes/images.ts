import type { Request, Response } from "express";

async function searchWikipedia(query: string) {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const json: any = await res.json();
  const page = json?.pages?.[0];
  if (!page) return null;
  const thumb = page?.thumbnail?.url || page?.image?.urls?.[0];
  // Try page summary for better image if needed
  let best = thumb;
  try {
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`);
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
    if (!result?.url) return res.status(404).json({ error: "Image not found" });
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
      if (!alt?.url) return res.status(404).json({ error: "Poster not found" });
      return res.json({ url: alt.url, title: alt.title });
    }
    res.json({ url: result.url, title: result.title });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch event poster" });
  }
}
