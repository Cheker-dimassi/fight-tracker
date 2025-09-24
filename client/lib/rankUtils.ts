/**
 * Transforms fighter rank display:
 * - #1 becomes "CHAMPION"  
 * - #2 becomes "RANK #1"
 * - #3 becomes "RANK #2"
 * - etc.
 */
export function transformRankDisplay(rank: string | undefined): string | null {
  if (!rank) return null;
  
  // Extract the number from rank (e.g., "#1", "#2", etc.)
  const rankNumber = parseInt(rank.replace('#', ''));
  
  if (isNaN(rankNumber)) return `RANK ${rank}`;
  
  if (rankNumber === 1) {
    return "CHAMPION";
  } else {
    return `RANK #${rankNumber - 1}`;
  }
}

/**
 * Check if a fighter is the champion (rank #1)
 */
export function isChampion(rank: string | undefined): boolean {
  return rank === "#1";
}

/**
 * Get display rank for sorting and comparison
 * Returns the actual numeric rank for calculations
 */
export function getRankNumber(rank: string | undefined): number | null {
  if (!rank) return null;
  const rankNumber = parseInt(rank.replace('#', ''));
  return isNaN(rankNumber) ? null : rankNumber;
}
