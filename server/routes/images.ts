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

/** Convert ALL CAPS names like "JON JONES" → "Jon Jones" */
function toProperCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    // Fix common two-letter names that shouldn't be titlecased fully
    .replace(/\bO'(\w)/g, (_, c) => `O'${c.toUpperCase()}`);
}

async function fetchWikiSummary(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: WIKI_HEADERS }
    );
    if (!res.ok) return null;
    const sum: any = await res.json();
    return sum?.originalimage?.source || sum?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function searchWikipediaQuery(query: string): Promise<{ title: string; url: string | null } | null> {
  const url = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=3`;
  const res = await fetch(url, { headers: WIKI_HEADERS });
  if (!res.ok) return null;
  const json: any = await res.json();
  const pages: any[] = json?.pages ?? [];
  if (!pages.length) return null;

  // Prefer an exact (case-insensitive) title match when available
  const qLower = query.toLowerCase();
  const best = pages.find((p) => p.title.toLowerCase() === qLower) ?? pages[0];

  const thumb = best?.thumbnail?.url || best?.image?.urls?.[0] || null;
  const summaryImg = await fetchWikiSummary(best.title);
  return { title: best.title, url: summaryImg || thumb || null };
}

async function searchFighterImage(rawName: string): Promise<{ title: string; url: string | null } | null> {
  const name = toProperCase(rawName);

  // Strategy 1: exact proper-case name (best hit for most fighters)
  const r1 = await searchWikipediaQuery(name);
  if (r1?.url) return r1;

  // Strategy 2: "UFC <name>" — helps for fighters whose article title starts with UFC
  const r2 = await searchWikipediaQuery(`UFC ${name}`);
  if (r2?.url) return r2;

  // Strategy 3: "<name> MMA fighter" — catches ambiguous names
  const r3 = await searchWikipediaQuery(`${name} MMA fighter`);
  if (r3?.url) return r3;

  // Strategy 4: "<name> mixed martial arts" — last resort
  const r4 = await searchWikipediaQuery(`${name} mixed martial arts`);
  return r4?.url ? r4 : (r1 ?? null);
}

export async function getFighterImage(req: Request, res: Response) {
  try {
    const name = String(req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing name" });
    const result = await searchFighterImage(name);
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
    const result = await searchWikipediaQuery(`${q} poster`);
    if (!result?.url) {
      // Fallback: search without poster suffix
      const alt = await searchWikipediaQuery(q);
      if (!alt?.url) return res.json({ url: null, title: null });
      return res.json({ url: alt.url, title: alt.title });
    }
    res.json({ url: result.url, title: result.title });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch event poster" });
  }
}
