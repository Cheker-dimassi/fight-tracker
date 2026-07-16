import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { parseCsv } from '../../client/lib/csv';
import { UfcFightRecord, UfcFighterRecord, RealFighterStats } from '../../shared/ufc-gold';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const candidates = [
  join(__dirname, '../../public/data'),
  join(__dirname, '../../../public/data'),
  join(process.cwd(), 'public/data'),
  join(process.cwd(), 'fight-tracker/public/data'),
];

async function getCsvDir(): Promise<string> {
  for (const c of candidates) {
    try {
      await fs.access(join(c, 'ufc_fighter_stats.csv'));
      return c;
    } catch {}
  }
  throw new Error("Could not find public/data directory containing UFC CSV files");
}

let _fightHistory: UfcFightRecord[] | null = null;
let _fighterStats: UfcFighterRecord[] | null = null;
let _fighterStatsByName: Map<string, UfcFighterRecord> | null = null;

async function loadCsvData() {
  if (_fightHistory && _fighterStats && _fighterStatsByName) return;

  const dir = await getCsvDir();
  
  const statsText = await fs.readFile(join(dir, 'ufc_fighter_stats.csv'), 'utf8');
  _fighterStats = parseCsv(statsText) as unknown as UfcFighterRecord[];
  
  const historyText = await fs.readFile(join(dir, 'ufc_fight_history.csv'), 'utf8');
  _fightHistory = parseCsv(historyText) as unknown as UfcFightRecord[];

  _fighterStatsByName = new Map();
  for (const r of _fighterStats) {
    _fighterStatsByName.set(r.Fighter_Name.trim().toLowerCase(), r);
  }
}

function parseIntSafe(v: string | undefined): number {
  const n = parseInt(String(v ?? "").trim(), 10);
  return isNaN(n) ? 0 : n;
}

function pctToNumber(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace("%", ""));
  return isNaN(n) ? null : n;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
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

  const strAcc = pctToNumber(stats.Str_Acc) ?? 45;
  const strDef = pctToNumber(stats.Str_Def) ?? 50;
  const tdAcc = pctToNumber(stats.TD_Acc) ?? 35;
  const tdDef = pctToNumber(stats.TD_Def) ?? 50;

  return {
    striking: clamp(65 + (strAcc - 42) * 1.5),
    grappling: clamp(65 + (((tdAcc * 1.2) + tdDef) / 2 - 45) * 1.3),
    stamina: clamp(75 + Math.min(totalFights, 18)),
    chin: clamp(70 + (strDef - 55) * 1.6),
    heart: clamp(65 + winRate * 25 + Math.min(totalFights, 10)),
    fightIQ: clamp(70 + winRate * 15 + Math.min(totalFights, 10)),
  };
}

export function formatHeightFromCsv(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const m = raw.match(/(\d+)'\s*(\d+)/);
  if (!m) return raw.trim();
  return `${m[1]}'${m[2]}"`;
}

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
  await loadCsvData();
  if (!_fightHistory) return undefined;
  const key = name.trim().toLowerCase();
  const relevant = _fightHistory
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

export async function getCsvFighterMerge(name: string): Promise<CsvFighterMerge | null> {
  await loadCsvData();
  if (!_fighterStatsByName) return null;
  const row = _fighterStatsByName.get(name.trim().toLowerCase());
  if (!row) return null;

  const wins = parseIntSafe(row.Wins);
  const losses = parseIntSafe(row.Losses);
  const draws = parseIntSafe(row.Draws);

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
