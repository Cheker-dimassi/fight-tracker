import { Request, Response } from 'express';
import { emailToUser, isAdminEmail, StoredUser } from './auth';
import { fallbackFighters } from '../../client/data/fallbackFighters';
import { listCsvFighters } from '../lib/csvFighterData';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OVERRIDES_FILE = path.join(__dirname, '../../.data/fighter_overrides.json');

function readOverridesRaw(): { overrides: Record<string, any>; customFighters: any[] } {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const data = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
      return {
        overrides: data.overrides || {},
        customFighters: data.customFighters || []
      };
    }
  } catch {}
  return { overrides: {}, customFighters: [] };
}

// GET /api/admin/stats
export const getAdminStats = async (_req: Request, res: Response) => {
  const { overrides, customFighters } = readOverridesRaw();

  // Prefer CSV-derived fighters when available for accurate totals.
  let allFighters: any[] = [];
  let baseFightersCount = fallbackFighters.length;

  try {
    const csvFighters = await listCsvFighters();
    if (csvFighters && csvFighters.length) {
      baseFightersCount = csvFighters.length;
      allFighters = [...csvFighters, ...customFighters];
    } else {
      allFighters = [...fallbackFighters, ...customFighters];
    }
  } catch (e) {
    allFighters = [...fallbackFighters, ...customFighters];
  }

  // Per weight-class breakdown
  const divisionMap: Record<string, number> = {};
  for (const f of allFighters) {
    const wc = f.weightClass || 'Unknown';
    divisionMap[wc] = (divisionMap[wc] || 0) + 1;
  }

  const divisions = Object.entries(divisionMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Nationality breakdown (top 8)
  const nationalityMap: Record<string, number> = {};
  for (const f of allFighters) {
    const nat = f.nationality || 'Unknown';
    nationalityMap[nat] = (nationalityMap[nat] || 0) + 1;
  }
  const topNationalities = Object.entries(nationalityMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  res.json({
    totalFighters: allFighters.length,
    baseFighters: baseFightersCount,
    customFighters: customFighters.length,
    overrideCount: Object.keys(overrides).length,
    totalUsers: emailToUser.size,
    totalDivisions: divisions.length,
    divisions,
    topNationalities,
    serverTime: new Date().toISOString(),
  });
};

// GET /api/admin/users
export const getAdminUsers = (_req: Request, res: Response) => {
  const users = Array.from(emailToUser.values()).map((u: StoredUser) => ({
    id: u.id,
    email: u.email,
    isAdmin: isAdminEmail(u.email),
    createdAt: u.createdAt,
  }));
  res.json(users);
};
