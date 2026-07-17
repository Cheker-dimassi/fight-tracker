import { parseCsv } from "../lib/csv";
import {
  UfcFightRecord,
  UfcFighterRecord,
  FightTimelineEntry,
  RealFighterStats,
} from "@shared/ufc-gold";

const LOCAL_BASE = `${(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/data`;

// GitHub mirrors are only kept as a fallback for ufc_events.csv, which still comes
// from the original scrape_ufc_stats repo. The gold dataset (fight history + fighter
// stats) has no public mirror, so it's local-only.
const EVENTS_BASES = [
  LOCAL_BASE,
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main",
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main/data",
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/master",
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/master/data",
];

/**
 * Fetches and parses a CSV, throwing a clear error if the response has zero
 * data rows. This guards against the bug where a file gets accidentally
 * replaced with just a header row and silently "succeeds" with no data.
 */
async function fetchCsvStrict(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error(`${url} returned 0 data rows (header-only or empty file)`);
  }
  return rows;
}

async function fetchEventsCsv(path: string): Promise<Record<string, string>[]> {
  let lastErr: unknown = null;
  for (const base of EVENTS_BASES) {
    try {
      return await fetchCsvStrict(`${base}/${path}`);
    } catch (e) {
      lastErr = e;
      // try next base
    }
  }
  throw new Error(`Failed to fetch ${path} from any source: ${String(lastErr)}`);
}

async function fetchLocalCsv(path: string): Promise<Record<string, string>[]> {
  return fetchCsvStrict(`${LOCAL_BASE}/${path}`);
}

export interface UfcEvent {
  EVENT: string;
  URL: string;
  DATE: string; // e.g. "August 16, 2025"
  LOCATION: string;
  id: string; // derived from URL last segment
}

let _events: UfcEvent[] | null = null;
let _fightHistory: UfcFightRecord[] | null = null;
let _fighterStats: UfcFighterRecord[] | null = null;
let _fighterStatsByName: Map<string, UfcFighterRecord> | null = null;

export function invalidateUfcDataCache() {
  _events = null;
  _fightHistory = null;
  _fighterStats = null;
  _fighterStatsByName = null;
}

export async function getEvents(): Promise<UfcEvent[]> {
  if (_events) return _events;
  const rows = await fetchEventsCsv("ufc_events.csv");
  _events = rows.map((r) => ({
    EVENT: r["EVENT"],
    URL: r["URL"],
    DATE: r["DATE"],
    LOCATION: r["LOCATION"],
    id: (r["URL"] || "").split("/").pop() || r["EVENT"],
  }));
  return _events;
}

export async function getEventById(eventId: string): Promise<UfcEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.id === eventId) || null;
}

export async function getFightHistory(): Promise<UfcFightRecord[]> {
  if (_fightHistory) return _fightHistory;
  const rows = await fetchLocalCsv("ufc_fight_history.csv");
  _fightHistory = rows as unknown as UfcFightRecord[];
  return _fightHistory;
}

interface ColumnStats {
  mean: number;
  stdDev: number;
}

let _statsDistributions: Record<string, ColumnStats> = {};

function pctToNumber(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace("%", ""));
  return isNaN(n) ? null : n;
}

function calculateDistributions() {
  if (!_fighterStats) return;

  const columns = ['SLpM', 'Str_Acc', 'SApM', 'Str_Def', 'TD_Avg', 'TD_Acc', 'TD_Def', 'Sub_Avg'];
  const parsedValues: Record<string, number[]> = {};
  
  for (const col of columns) {
    parsedValues[col] = [];
  }

  for (const f of _fighterStats) {
    const wins = parseInt(f.Wins) || 0;
    const losses = parseInt(f.Losses) || 0;
    const total = wins + losses;
    if (total < 2) continue; // Skip debutants

    for (const col of columns) {
      let val = 0;
      if (col.endsWith('_Acc') || col.endsWith('_Def')) {
        val = pctToNumber(f[col as keyof UfcFighterRecord]) ?? 0;
      } else {
        val = parseFloat(f[col as keyof UfcFighterRecord] || '0') || 0;
      }
      parsedValues[col].push(val);
    }
  }

  for (const col of columns) {
    const vals = parsedValues[col];
    if (vals.length === 0) {
      _statsDistributions[col] = { mean: 0, stdDev: 1 };
      continue;
    }
    const mean = vals.reduce((sum, v) => sum + v, 0) / vals.length;
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    _statsDistributions[col] = { mean, stdDev: stdDev || 1 };
  }
}

export async function getFighterStatsList(): Promise<UfcFighterRecord[]> {
  if (_fighterStats) return _fighterStats;
  const rows = await fetchLocalCsv("ufc_fighter_stats.csv");
  _fighterStats = rows as unknown as UfcFighterRecord[];
  calculateDistributions();
  return _fighterStats;
}

export async function getFighterCount(): Promise<number> {
  try {
    const rows = await getFighterStatsList();
    return rows.length;
  } catch {
    return 0;
  }
}

async function getFighterStatsByName(): Promise<Map<string, UfcFighterRecord>> {
  if (_fighterStatsByName) return _fighterStatsByName;
  const rows = await getFighterStatsList();
  const map = new Map<string, UfcFighterRecord>();
  for (const r of rows) {
    map.set(r.Fighter_Name.trim().toLowerCase(), r);
  }
  _fighterStatsByName = map;
  return map;
}

export async function getFighterStatsByFighterName(
  name: string,
): Promise<UfcFighterRecord | null> {
  const map = await getFighterStatsByName();
  return map.get(name.trim().toLowerCase()) || null;
}

// -- Helpers for turning raw dataset numbers into display-friendly values --

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function getNormalizedScore(col: string, val: number, invert = false): number {
  const stats = _statsDistributions[col];
  if (!stats) return 75; // Default average
  
  let z = (val - stats.mean) / stats.stdDev;
  if (invert) z = -z;
  
  const clampedZ = Math.max(-2, Math.min(2.2, z));
  return Math.max(50, Math.min(100, Math.round(78 + clampedZ * 10)));
}

export function deriveRealStats(
  stats: UfcFighterRecord | null,
  record: { wins: number; losses: number; draws: number },
): RealFighterStats {
  const totalFights = Math.max(1, record.wins + record.losses + record.draws);
  const winRate = record.wins / totalFights;

  if (!stats) {
    return {
      striking: clamp(70 + winRate * 20),
      grappling: clamp(70 + winRate * 20),
      stamina: clamp(75 + Math.min(totalFights, 15)),
      chin: clamp(75 + winRate * 15),
      heart: clamp(70 + winRate * 25),
      fightIQ: clamp(70 + winRate * 20),
    };
  }

  const slpmVal = parseFloat(stats.SLpM || '0');
  const strAccVal = pctToNumber(stats.Str_Acc) ?? 45;
  const sapmVal = parseFloat(stats.SApM || '0');
  const strDefVal = pctToNumber(stats.Str_Def) ?? 50;
  const tdAvgVal = parseFloat(stats.TD_Avg || '0');
  const tdAccVal = pctToNumber(stats.TD_Acc) ?? 35;
  const tdDefVal = pctToNumber(stats.TD_Def) ?? 50;

  const slpmScore = getNormalizedScore('SLpM', slpmVal);
  const strAccScore = getNormalizedScore('Str_Acc', strAccVal);
  const sapmScore = getNormalizedScore('SApM', sapmVal, true);
  const strDefScore = getNormalizedScore('Str_Def', strDefVal);
  const tdAvgScore = getNormalizedScore('TD_Avg', tdAvgVal);
  const tdAccScore = getNormalizedScore('TD_Acc', tdAccVal);
  const tdDefScore = getNormalizedScore('TD_Def', tdDefVal);

  const striking = clamp((slpmScore * 0.4) + (strAccScore * 0.6));
  const grappling = clamp((tdAvgScore * 0.3) + (tdAccScore * 0.3) + (tdDefScore * 0.4));
  const stamina = clamp(75 + Math.min(totalFights, 15) * 1.0 + (winRate - 0.5) * 10);
  const chin = clamp((strDefScore * 0.6) + (sapmScore * 0.4));
  const heart = clamp(70 + (winRate * 20) + Math.min(totalFights, 15) * 0.8);
  const fightIQ = clamp(70 + (winRate * 15) + ((strDefScore + tdDefScore) / 2 - 75) * 0.4);

  return {
    striking,
    grappling,
    stamina,
    chin,
    heart,
    fightIQ,
  };
}

// -- Fight history / timeline for a given fighter --

function toISODate(dateStr: string): string | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function classifyResult(
  winner: string,
  fighterName: string,
): FightTimelineEntry["result"] {
  const w = (winner || "").trim().toLowerCase();
  const name = fighterName.trim().toLowerCase();
  if (!w || /^nc$|no contest/.test(w)) return "NC";
  if (/^draw/.test(w)) return "DRAW";
  return w === name ? "WIN" : "LOSS";
}

export async function getFightHistoryForFighter(
  fighterName: string,
): Promise<FightTimelineEntry[]> {
  const history = await getFightHistory();
  const name = fighterName.trim().toLowerCase();

  return history
    .filter(
      (r) =>
        r.Fighter_1.trim().toLowerCase() === name ||
        r.Fighter_2.trim().toLowerCase() === name,
    )
    .map((r) => {
      const isF1 = r.Fighter_1.trim().toLowerCase() === name;
      const opponent = isF1 ? r.Fighter_2 : r.Fighter_1;
      const iso = toISODate(r.Event_Date) || r.Event_Date;
      const d = new Date(r.Event_Date);
      const dateLabel = isNaN(d.getTime())
        ? r.Event_Date
        : d
            .toLocaleDateString("en-US", { month: "short", year: "numeric" })
            .toUpperCase();

      return {
        date: dateLabel,
        isoDate: iso,
        event: r.Weight_Class || "UFC Bout",
        opponent,
        result: classifyResult(r.Winner, fighterName),
        method: r.Method,
        round: parseInt(r.End_Round, 10) || 1,
        time: r.End_Time,
      };
    })
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));
}

// -- Fight history for a given event (joined by date, since the gold dataset
// has no event-name column) --

export async function getFightsForEventByDate(
  eventDate: string,
): Promise<UfcFightRecord[]> {
  const history = await getFightHistory();
  const iso = toISODate(eventDate);
  if (!iso) return [];
  return history.filter((r) => r.Event_Date === iso);
}

// -- CSV-as-primary-source merge for fighter records/stats/biometrics --
// This is what lets the real dataset (ufc_fighter_stats.csv / ufc_fight_history.csv)
// take priority over fallbackFighters.ts for records, stats, height, reach, stance,
// and weight class, while leaving fallbackFighters.ts as the source for fields the
// CSV doesn't have (nickname, nationality, image) or for fighters missing from the CSV entirely.

function parseIntSafe(v: string | undefined): number {
  const n = parseInt(String(v ?? "").trim(), 10);
  return isNaN(n) ? 0 : n;
}

/** "5' 11\"" -> "5'11\"" */
export function formatHeightFromCsv(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const m = raw.match(/(\d+)'\s*(\d+)/);
  if (!m) return raw.trim();
  return `${m[1]}'${m[2]}"`;
}

/** "66.0\"" -> "66\"" */
export function formatReachFromCsv(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const n = parseFloat(raw.replace(/["\s]/g, ""));
  if (isNaN(n)) return undefined;
  return `${Math.round(n)}"`;
}

export function ageFromDob(dob: string | undefined): number | undefined {
  if (!dob || !dob.trim()) return undefined;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return undefined;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

/**
 * Turns a raw fight-level Weight_Class string (e.g. "UFC Interim Heavyweight
 * Title Bout", "Women's Bantamweight Bout") into a plain division name
 * (e.g. "Heavyweight", "Women's Bantamweight") by stripping known filler words.
 */
export function normalizeWeightClass(raw: string): string {
  if (!raw) return "";
  const filler = new Set([
    "ufc", "interim", "title", "tournament", "championship", "bout",
    "2", "3", "4", "5", "6", "7",
  ]);
  const tokens = raw.trim().split(/\s+/);
  while (tokens.length && filler.has(tokens[tokens.length - 1].toLowerCase())) tokens.pop();
  while (tokens.length && filler.has(tokens[0].toLowerCase())) tokens.shift();
  return tokens.join(" ");
}

export async function getMostRecentWeightClassForFighter(
  name: string,
): Promise<string | undefined> {
  const history = await getFightHistory();
  const key = name.trim().toLowerCase();
  const relevant = history
    .filter(
      (r) =>
        (r.Fighter_1.trim().toLowerCase() === key ||
          r.Fighter_2.trim().toLowerCase() === key) &&
        r.Weight_Class,
    )
    .sort((a, b) => (a.Event_Date < b.Event_Date ? 1 : -1));
  if (!relevant.length) return undefined;
  return normalizeWeightClass(relevant[0].Weight_Class) || undefined;
}

export interface CsvFighterMerge {
  wins: number;
  losses: number;
  draws: number;
  height?: string;
  weight?: string;
  reach?: string;
  stance?: string;
  weightClass?: string;
  age?: number;
  stats: RealFighterStats;
}

// -- Live record freshness --
// Greco1899/scrape_ufc_stats runs a daily automated scrape of ufcstats.com and
// pushes refreshed CSVs to GitHub. We only rely on the two files whose schema
// we're certain of (they match your original stub files' columns exactly),
// to compute a fighter's CURRENT win/loss/draw record — the thing that goes
// stale the moment a fight happens. Height/reach/stance/striking stats still
// come from the bundled snapshot; going further would mean guessing at an
// unverified schema, which is exactly the kind of assumption that caused the
// earlier silent stat-corruption bug.
const LIVE_BASE = "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main";
const LIVE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

let _liveFightResults: { rows: Record<string, string>[]; fetchedAt: number } | null = null;

async function getLiveFightResults(): Promise<Record<string, string>[] | null> {
  if (_liveFightResults && Date.now() - _liveFightResults.fetchedAt < LIVE_TTL_MS) {
    return _liveFightResults.rows;
  }
  try {
    const res = await fetch(`${LIVE_BASE}/ufc_fight_results.csv`, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const rows = parseCsv(text);
    // Defensive schema check: if the columns we depend on aren't there, bail
    // out cleanly instead of silently misreading the data.
    const headers = rows.length ? Object.keys(rows[0]) : [];
    if (!headers.includes("BOUT") || !headers.includes("OUTCOME")) {
      console.warn(
        "Greco1899 ufc_fight_results.csv schema looks different than expected " +
          `(got columns: ${headers.join(", ")}). Skipping live record, using local snapshot instead.`,
      );
      return null;
    }
    _liveFightResults = { rows, fetchedAt: Date.now() };
    return rows;
  } catch {
    return null; // network error, CORS, offline, etc. — fall back silently
  }
}

/** "Fighter A vs. Fighter B" -> ["Fighter A", "Fighter B"], or null if the format doesn't match */
function parseBout(bout: string): [string, string] | null {
  const parts = bout.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  return [parts[0].trim(), parts[1].trim()];
}

/** "W/L" -> ["W","L"], or null if the format doesn't match */
function parseOutcome(outcome: string): [string, string] | null {
  const parts = outcome.trim().split("/");
  if (parts.length !== 2) return null;
  return [parts[0].trim().toUpperCase(), parts[1].trim().toUpperCase()];
}

export interface LiveRecord {
  wins: number;
  losses: number;
  draws: number;
  fightsCounted: number;
}

/**
 * Computes a fighter's current W/L/D by counting rows in the live,
 * daily-refreshed ufc_fight_results.csv. Returns null if live data is
 * unavailable or the fighter isn't found there (callers should fall back to
 * the local snapshot in either case).
 */
export async function getLiveRecordForFighter(name: string): Promise<LiveRecord | null> {
  const rows = await getLiveFightResults();
  if (!rows) return null;

  const key = name.trim().toLowerCase();
  let wins = 0, losses = 0, draws = 0, fightsCounted = 0;

  for (const row of rows) {
    const names = parseBout(row.BOUT || "");
    const codes = parseOutcome(row.OUTCOME || "");
    if (!names || !codes) continue; // unparseable row — skip rather than guess

    const idx = names.findIndex((n) => n.toLowerCase() === key);
    if (idx === -1) continue;

    const code = codes[idx];
    fightsCounted++;
    if (code === "W") wins++;
    else if (code === "L") losses++;
    else if (code === "D") draws++;
    // NC (no contest) and anything else: counted in fightsCounted but not W/L/D
  }

  if (fightsCounted === 0) return null; // fighter not found in the live file
  return { wins, losses, draws, fightsCounted };
}

/**
 * The single place that decides what "real" fighter data looks like for a
 * given name. Returns null if the fighter isn't in the CSV dataset at all,
 * in which case callers should keep using fallbackFighters/live-API data.
 */
export async function getCsvFighterMerge(name: string): Promise<CsvFighterMerge | null> {
  const row = await getFighterStatsByFighterName(name);
  if (!row) return null;

  const snapshotWins = parseIntSafe(row.Wins);
  const snapshotLosses = parseIntSafe(row.Losses);
  const snapshotDraws = parseIntSafe(row.Draws);

  // Prefer the live, daily-refreshed record when we can get one — this is
  // what keeps a fighter's record current within a day of their last fight,
  // instead of only as current as whenever this snapshot was last replaced.
  const live = await getLiveRecordForFighter(name);
  const wins = live ? live.wins : snapshotWins;
  const losses = live ? live.losses : snapshotLosses;
  const draws = live ? live.draws : snapshotDraws;

  const [stats, weightClass] = await Promise.all([
    Promise.resolve(deriveRealStats(row, { wins, losses, draws })),
    getMostRecentWeightClassForFighter(name),
  ]);

  return {
    wins,
    losses,
    draws,
    height: formatHeightFromCsv(row.Height),
    weight: row.Weight?.trim() || undefined,
    reach: formatReachFromCsv(row.Reach),
    stance: row.Stance?.trim() || undefined,
    weightClass,
    age: ageFromDob(row.DOB),
    stats,
  };
}
