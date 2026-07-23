import type { AppFighter } from "@shared/octagon-api";

export interface FightPrediction {
  winner: AppFighter;
  loser: AppFighter;
  confidence: number;
  method: string;
  reason: string;
}

const normalizeText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parseMatchupTitle = (title: string) => {
  if (!title) return null;
  const trimmed = title.trim();
  const battleText = trimmed.includes(":") ? trimmed.substring(trimmed.lastIndexOf(":") + 1).trim() : trimmed;
  const parts = battleText.split(/\s+vs\.?\s+|\s+v\s+|\s+versus\s+/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  return { fighter1: parts[0], fighter2: parts[1] };
};

const findCandidate = (search: string, fighters: AppFighter[]) => {
  const normalizedSearch = normalizeText(search);
  if (!normalizedSearch) return null;

  const exact = fighters.find((fighter) => {
    const name = normalizeText(fighter.name);
    const nickname = normalizeText(fighter.nickname || "");
    return name === normalizedSearch || nickname === normalizedSearch;
  });
  if (exact) return exact;

  const shortSearch = normalizedSearch.split(" ").slice(-2).join(" ");
  const contains = fighters.find((fighter) => {
    const name = normalizeText(fighter.name);
    const nickname = normalizeText(fighter.nickname || "");
    return name.includes(normalizedSearch) || nickname.includes(normalizedSearch) || name.includes(shortSearch) || nickname.includes(shortSearch);
  });
  if (contains) return contains;

  const lastName = normalizedSearch.split(" ").slice(-1)[0];
  if (!lastName || lastName.length < 3) return null;

  const matches = fighters.filter((fighter) => {
    const nameParts = normalizeText(fighter.name).split(" ");
    return nameParts[nameParts.length - 1] === lastName;
  });

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    // Prefer champion or ranked fighter if multiple share a surname
    const ranked = matches.find((f) => f.rank && f.rank !== "Unranked");
    if (ranked) return ranked;
  }

  return null;
};

const safeRecord = (fighter: AppFighter) => {
  const wins = fighter.record.wins ?? 0;
  const losses = fighter.record.losses ?? 0;
  const draws = fighter.record.draws ?? 0;
  const total = Math.max(1, wins + losses + draws);
  return { wins, losses, draws, total, winRate: wins / total };
};

const computeAggregateScore = (fighter: AppFighter) => {
  const weights = {
    striking: 2.2,
    grappling: 2.0,
    fightIQ: 1.8,
    stamina: 1.4,
    chin: 1.2,
    heart: 1.0,
  };

  const stats = fighter.stats;
  const statSum =
    stats.striking * weights.striking +
    stats.grappling * weights.grappling +
    stats.fightIQ * weights.fightIQ +
    stats.stamina * weights.stamina +
    stats.chin * weights.chin +
    stats.heart * weights.heart;
  const statMax = 100 * Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const statScore = (statSum / statMax) * 100;

  const record = safeRecord(fighter);
  const recordBonus = record.winRate * 24 + Math.min(16, record.total * 0.4);

  return statScore * 0.66 + recordBonus * 0.34;
};

const getLikelyMethod = (winner: AppFighter, loser: AppFighter) => {
  const strikeDelta = winner.stats.striking - loser.stats.striking;
  const grapDelta = winner.stats.grappling - loser.stats.grappling;
  const iqDelta = winner.stats.fightIQ - loser.stats.fightIQ;

  if (strikeDelta >= 8 && strikeDelta > grapDelta) {
    return "KO/TKO";
  }
  if (grapDelta >= 8 && grapDelta > strikeDelta) {
    return "Submission";
  }
  if (iqDelta >= 10 && Math.abs(strikeDelta) < 6 && Math.abs(grapDelta) < 6) {
    return "Decision";
  }
  if (strikeDelta >= 5) {
    return "KO/TKO";
  }
  if (grapDelta >= 5) {
    return "Submission";
  }
  return "Decision";
};

export function predictFightOutcome(fighterA: AppFighter, fighterB: AppFighter): FightPrediction {
  const aScore = computeAggregateScore(fighterA);
  const bScore = computeAggregateScore(fighterB);
  const aRecord = safeRecord(fighterA);
  const bRecord = safeRecord(fighterB);
  const scoreDelta = aScore - bScore;
  const winRateDelta = aRecord.winRate - bRecord.winRate;
  const confidence = clamp(Math.round(50 + scoreDelta * 1.3 + winRateDelta * 24), 53, 92);

  const winner = scoreDelta >= 0 ? fighterA : fighterB;
  const loser = scoreDelta >= 0 ? fighterB : fighterA;
  const winnerRecord = scoreDelta >= 0 ? aRecord : bRecord;
  const loserRecord = scoreDelta >= 0 ? bRecord : aRecord;
  const method = getLikelyMethod(winner, loser);

  const strikeEdge = winner.stats.striking - loser.stats.striking;
  const grapEdge = winner.stats.grappling - loser.stats.grappling;
  const iqEdge = winner.stats.fightIQ - loser.stats.fightIQ;

  let secondaryReason = "";
  if (winnerRecord.winRate > loserRecord.winRate + 0.05) {
    secondaryReason = "a superior win percentage";
  } else if (strikeEdge >= 5) {
    secondaryReason = "a significant striking advantage";
  } else if (grapEdge >= 5) {
    secondaryReason = "a dominant grappling advantage";
  } else if (iqEdge >= 5) {
    secondaryReason = "higher fight IQ and tactical awareness";
  } else {
    secondaryReason = "better overall skill metrics";
  }

  const primaryEdge = Math.abs(scoreDelta) >= 4 ? "overall performance" : "narrow margins";
  const reason = `${winner.name} shows stronger ${primaryEdge} with a ${Math.round(Math.abs(scoreDelta))} point edge and ${secondaryReason}.`;

  return {
    winner,
    loser,
    confidence,
    method,
    reason,
  };
}


export function predictMatchupFromTitle(eventTitle: string, fighters: AppFighter[]): FightPrediction | null {
  const parsed = parseMatchupTitle(eventTitle);
  if (!parsed) return null;
  if (/tbd/i.test(parsed.fighter1) || /tbd/i.test(parsed.fighter2)) return null;

  const fighter1 = findCandidate(parsed.fighter1, fighters);
  const fighter2 = findCandidate(parsed.fighter2, fighters);
  if (!fighter1 || !fighter2) return null;

  return predictFightOutcome(fighter1, fighter2);
}

export function predictBoutOutcome(fighter1: string, fighter2: string, fighters: AppFighter[]): FightPrediction | null {
  if (/tbd/i.test(fighter1) || /tbd/i.test(fighter2)) return null;
  const found1 = findCandidate(fighter1, fighters);
  const found2 = findCandidate(fighter2, fighters);
  if (!found1 || !found2 || found1.id === found2.id) return null;
  return predictFightOutcome(found1, found2);
}
