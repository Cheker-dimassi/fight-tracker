import { getFightHistory, getFighterStatsList, normalizeWeightClass } from "./ufcData";

export interface CountItem {
  label: string;
  count: number;
}

function normalizeMethod(raw: string): string {
  if (!raw) return "Unknown";
  const m = raw.toUpperCase();
  if (m.includes("KO/TKO") || m.includes("TKO") || m === "KO") return "KO/TKO";
  if (m.includes("SUBMISSION")) return "Submission";
  if (m.includes("DECISION")) return "Decision";
  if (m.includes("DQ")) return "Disqualification";
  if (m.includes("OVERTURNED") || m.includes("NO CONTEST") || m.includes("NC")) return "No Contest";
  return "Other";
}

let _cache: {
  methodBreakdown: CountItem[];
  weightClassBreakdown: CountItem[];
  fightsPerYear: CountItem[];
  finishRoundBreakdown: CountItem[];
  stanceBreakdown: CountItem[];
  totals: { fighters: number; fights: number; events: number; yearRange: string };
  topByWins: { name: string; wins: number; losses: number; draws: number }[];
} | null = null;

/**
 * Computes every chart/summary the Analytics page needs from the real,
 * bundled datasets in one pass. Cached in memory for the session since the
 * underlying files don't change between page loads.
 */
export async function getAnalyticsData() {
  if (_cache) return _cache;

  const [history, fighters] = await Promise.all([getFightHistory(), getFighterStatsList()]);

  const methodBuckets: Record<string, number> = {};
  const weightClassBuckets: Record<string, number> = {};
  const yearBuckets: Record<string, number> = {};
  const roundBuckets: Record<string, number> = {};
  const eventNames = new Set<string>();
  let minYear = "";
  let maxYear = "";

  for (const row of history) {
    const method = normalizeMethod(row.Method);
    methodBuckets[method] = (methodBuckets[method] || 0) + 1;

    const wc = normalizeWeightClass(row.Weight_Class || "");
    if (wc) weightClassBuckets[wc] = (weightClassBuckets[wc] || 0) + 1;

    const year = (row.Event_Date || "").slice(0, 4);
    if (year) {
      yearBuckets[year] = (yearBuckets[year] || 0) + 1;
      if (!minYear || year < minYear) minYear = year;
      if (!maxYear || year > maxYear) maxYear = year;
    }

    const round = row.End_Round?.trim();
    if (round) roundBuckets[`Round ${round}`] = (roundBuckets[`Round ${round}`] || 0) + 1;

    if (row.Fight_URL) eventNames.add(row.Fight_URL.split("/").slice(0, -1).join("/"));
  }

  const stanceBuckets: Record<string, number> = {};
  const winsByName: Record<string, { wins: number; losses: number; draws: number }> = {};
  for (const f of fighters) {
    const stance = f.Stance?.trim();
    if (stance) stanceBuckets[stance] = (stanceBuckets[stance] || 0) + 1;
    const wins = parseInt(f.Wins, 10) || 0;
    const losses = parseInt(f.Losses, 10) || 0;
    const draws = parseInt(f.Draws, 10) || 0;
    winsByName[f.Fighter_Name] = { wins, losses, draws };
  }

  const toSorted = (buckets: Record<string, number>): CountItem[] =>
    Object.entries(buckets)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

  const fightsPerYear: CountItem[] = Object.entries(yearBuckets)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const roundOrder = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"];
  const finishRoundBreakdown: CountItem[] = roundOrder
    .filter((r) => roundBuckets[r])
    .map((label) => ({ label, count: roundBuckets[label] }));

  const topByWins = Object.entries(winsByName)
    .map(([name, rec]) => ({ name, ...rec }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  _cache = {
    methodBreakdown: toSorted(methodBuckets),
    weightClassBreakdown: toSorted(weightClassBuckets).slice(0, 12),
    fightsPerYear,
    finishRoundBreakdown,
    stanceBreakdown: toSorted(stanceBuckets),
    totals: {
      fighters: fighters.length,
      fights: history.length,
      events: fightsPerYear.length ? new Set(history.map((r) => r.Event_Date)).size : 0,
      yearRange: minYear && maxYear ? `${minYear}\u2013${maxYear}` : "",
    },
    topByWins,
  };
  return _cache;
}
