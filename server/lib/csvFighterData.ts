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

async function loadCsvData() {
  if (_fightHistory && _fighterStats && _fighterStatsByName) return;

  const dir = await getCsvDir();
  // Prefer the gold dataset if present (single-file export with fight rows)
  const goldPath = join(dir, 'ufc_gold_dataset_final.csv');
  const hasGold = await (async () => { try { await fs.access(goldPath); return true; } catch { return false; } })();

  if (hasGold) {
    const goldText = await fs.readFile(goldPath, 'utf8');
    const fights = parseCsv(goldText) as unknown as UfcFightRecord[];
    _fightHistory = fights;

    // build aggregated fighter records from fight rows (wins/losses/draws)
    const map = new Map<string, Partial<UfcFighterRecord>>();
    for (const r of fights) {
      const f1 = String(r.Fighter_1 || '').trim();
      const f2 = String(r.Fighter_2 || '').trim();
      if (!f1 || !f2) continue;

      if (!map.has(f1)) map.set(f1, { Fighter_Name: f1, Wins: '0', Losses: '0', Draws: '0', Height: '', Weight: '', Reach: '', Stance: '', DOB: '', SLpM: '', Str_Acc: '', SApM: '', Str_Def: '', TD_Avg: '', TD_Acc: '', TD_Def: '', Sub_Avg: '', Fighter_URL: '' });
      if (!map.has(f2)) map.set(f2, { Fighter_Name: f2, Wins: '0', Losses: '0', Draws: '0', Height: '', Weight: '', Reach: '', Stance: '', DOB: '', SLpM: '', Str_Acc: '', SApM: '', Str_Def: '', TD_Avg: '', TD_Acc: '', TD_Def: '', Sub_Avg: '', Fighter_URL: '' });

      const winner = String(r.Winner || '').trim();
      const key1 = f1;
      const key2 = f2;

      if (winner && (winner.toLowerCase() === f1.toLowerCase())) {
        map.get(key1)!.Wins = String(parseInt(map.get(key1)!.Wins || '0') + 1);
        map.get(key2)!.Losses = String(parseInt(map.get(key2)!.Losses || '0') + 1);
      } else if (winner && (winner.toLowerCase() === f2.toLowerCase())) {
        map.get(key2)!.Wins = String(parseInt(map.get(key2)!.Wins || '0') + 1);
        map.get(key1)!.Losses = String(parseInt(map.get(key1)!.Losses || '0') + 1);
      } else {
        // Draw / NC / unknown
        map.get(key1)!.Draws = String(parseInt(map.get(key1)!.Draws || '0') + 1);
        map.get(key2)!.Draws = String(parseInt(map.get(key2)!.Draws || '0') + 1);
      }
    }

    _fighterStats = Array.from(map.values()) as UfcFighterRecord[];
  } else {
    const statsText = await fs.readFile(join(dir, 'ufc_fighter_stats.csv'), 'utf8');
    _fighterStats = parseCsv(statsText) as unknown as UfcFighterRecord[];

    const historyText = await fs.readFile(join(dir, 'ufc_fight_history.csv'), 'utf8');
    _fightHistory = parseCsv(historyText) as unknown as UfcFightRecord[];
  }

  _fighterStatsByName = new Map();
  for (const r of _fighterStats) {
    _fighterStatsByName.set(r.Fighter_Name.trim().toLowerCase(), r);
  }

  calculateDistributions();
}

function parseIntSafe(v: string | undefined): number {
  const n = parseInt(String(v ?? "").trim(), 10);
  return isNaN(n) ? 0 : n;
}

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

// Return the raw fighter stats derived from CSV (if loaded). Useful for admin summaries.
export async function listCsvFighters(): Promise<UfcFighterRecord[]> {
  await loadCsvData();
  return _fighterStats ? _fighterStats.slice() : [];
}
