import { parseCsv } from "../lib/csv";

const LOCAL_BASE = `${(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/data`;

const BASES = [
  // Local static files (served from /public/data)
  LOCAL_BASE,
  // root on main
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main",
  // data folder on main
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/main/data",
  // root on master
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/master",
  // data folder on master
  "https://raw.githubusercontent.com/Greco1899/scrape_ufc_stats/master/data",
];

async function fetchCsv(path: string): Promise<Record<string, string>[]> {
  let lastStatus = 0;
  for (const base of BASES) {
    const url = `${base}/${path}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      lastStatus = res.status;
      if (res.ok) {
        const text = await res.text();
        return parseCsv(text);
      }
    } catch (_) {
      // try next
    }
  }
  throw new Error(`Failed to fetch ${path}: ${lastStatus || 'network'}`);
}

export interface UfcEvent {
  EVENT: string;
  URL: string;
  DATE: string; // e.g. "August 16, 2025"
  LOCATION: string;
  id: string; // derived from URL last segment
}

export interface UfcFightDetail {
  EVENT: string;
  BOUT: string; // "Fighter A vs. Fighter B"
  URL: string; // fight details page
}

export interface UfcFightResult {
  EVENT: string;
  BOUT: string;
  OUTCOME: string; // e.g. "W/L" for A/B
  WEIGHTCLASS: string;
  METHOD: string;
  ROUND: string;
  TIME: string;
  TIMEFORMAT: string;
  REFEREE: string;
  DETAILS: string;
}

export interface UfcFighterDetail {
  FIRST: string;
  LAST: string;
  NICKNAME: string;
  URL: string;
}

let _events: UfcEvent[] | null = null;
let _fightDetails: UfcFightDetail[] | null = null;
let _fightResults: UfcFightResult[] | null = null;
let _fighterDetails: UfcFighterDetail[] | null = null;

export function invalidateUfcDataCache() {
  _events = null;
  _fightDetails = null;
  _fightResults = null;
  _fighterDetails = null;
}

export async function getEvents(): Promise<UfcEvent[]> {
  if (_events) return _events;
  const rows = await fetchCsv("ufc_events.csv");
  _events = rows.map(r => ({
    EVENT: r["EVENT"],
    URL: r["URL"],
    DATE: r["DATE"],
    LOCATION: r["LOCATION"],
    id: (r["URL"] || "").split("/").pop() || r["EVENT"],
  }));
  return _events;
}

export async function getFighterCount(): Promise<number> {
  try {
    if (_fighterDetails) return _fighterDetails.length;
    const rows = await fetchCsv("ufc_fighter_details.csv");
    _fighterDetails = rows as any;
    return rows.length;
  } catch {
    return 0;
  }
}

export async function getFightDetails(): Promise<UfcFightDetail[]> {
  if (_fightDetails) return _fightDetails;
  try {
    const rows = await fetchCsv("ufc_fight_details.csv");
    _fightDetails = rows.map(r => ({ EVENT: r["EVENT"], BOUT: r["BOUT"], URL: r["URL"] }));
  } catch {
    _fightDetails = [];
  }
  return _fightDetails;
}

export async function getFightResults(): Promise<UfcFightResult[]> {
  if (_fightResults) return _fightResults;
  try {
    const rows = await fetchCsv("ufc_fight_results.csv");
    _fightResults = rows.map(r => ({
      EVENT: r["EVENT"],
      BOUT: r["BOUT"],
      OUTCOME: r["OUTCOME"],
      WEIGHTCLASS: r["WEIGHTCLASS"],
      METHOD: r["METHOD"],
      ROUND: r["ROUND"],
      TIME: r["TIME"],
      TIMEFORMAT: r["TIMEFORMAT"],
      REFEREE: r["REFEREE"],
      DETAILS: r["DETAILS"],
    }));
  } catch {
    _fightResults = [];
  }
  return _fightResults;
}

export async function getEventById(eventId: string): Promise<UfcEvent | null> {
  const events = await getEvents();
  return events.find(e => e.id === eventId) || null;
}

export async function getFightsForEvent(eventName: string): Promise<(UfcFightDetail & { result?: UfcFightResult })[]> {
  const [details, results] = await Promise.all([getFightDetails(), getFightResults()]);
  const fights = details.filter(f => f.EVENT === eventName);
  const resultMap = new Map(results.filter(r => r.EVENT === eventName).map(r => [`${r.EVENT}__${r.BOUT}`, r] as const));
  return fights.map(f => ({ ...f, result: resultMap.get(`${f.EVENT}__${f.BOUT}`) }));
}
