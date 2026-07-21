import { Request, Response } from 'express';
import { fallbackFighters } from '../../client/data/fallbackFighters';
import { OctagonFighter, OctagonDivision, OctagonRankings, AppFighter } from '../../shared/octagon-api';
import { transformToOctagonFighter } from '../../shared/octagon-transform';
import { getCsvFighterMerge } from '../lib/csvFighterData';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../.data');
const OVERRIDES_FILE = path.join(DATA_DIR, 'fighter_overrides.json');

// Ensure directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.error('Failed to create data directory:', e);
}

interface OverridesData {
  overrides: Record<string, Partial<AppFighter>>;
  customFighters: AppFighter[];
}

let overridesData: OverridesData = {
  overrides: {},
  customFighters: []
};

function loadOverrides() {
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const data = fs.readFileSync(OVERRIDES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      overridesData = {
        overrides: parsed.overrides || {},
        customFighters: parsed.customFighters || []
      };
      console.log(`📦 Loaded overrides for ${Object.keys(overridesData.overrides).length} fighters and ${overridesData.customFighters.length} custom fighters.`);
    }
  } catch (e) {
    console.error('Failed to load overrides from disk:', e);
  }
}

// Initialize on startup
loadOverrides();

function saveOverrides() {
  try {
    const tempFile = `${OVERRIDES_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(overridesData, null, 2), 'utf8');
    fs.renameSync(tempFile, OVERRIDES_FILE);
  } catch (e) {
    console.error('Failed to save overrides to disk:', e);
  }
}

// Helper to get all fighters including custom ones
function getFullFighterList(): AppFighter[] {
  return [...fallbackFighters, ...overridesData.customFighters];
}

// Helper to overlay CSV and local JSON overrides onto AppFighter structure
async function applyCsvOverride(base: AppFighter): Promise<AppFighter> {
  let fighter = { ...base };
  try {
    const merge = await getCsvFighterMerge(base.name);
    if (merge) {
      fighter = {
        ...fighter,
        record: { ...fighter.record, wins: merge.wins, losses: merge.losses, draws: merge.draws },
        weightClass: merge.weightClass || fighter.weightClass,
        height: merge.height ?? fighter.height,
        reach: merge.reach ?? fighter.reach,
        stance: merge.stance ?? fighter.stance,
        age: merge.age ?? fighter.age,
        stats: merge.stats,
      };
    }
  } catch {}

  // Apply user-defined custom overrides
  const localOverride = overridesData.overrides[fighter.id];
  if (localOverride) {
    fighter = {
      ...fighter,
      ...localOverride,
      record: localOverride.record ? { ...fighter.record, ...localOverride.record } : fighter.record,
      stats: localOverride.stats ? { ...fighter.stats, ...localOverride.stats } : fighter.stats
    };
  }

  return fighter;
}

// GET /fighters - Return all fighters
export async function getAllFighters(_req: Request, res: Response) {
  try {
    const appFighters = await Promise.all(getFullFighterList().map(applyCsvOverride));
    const octagonFighters = appFighters.map(transformToOctagonFighter);
    res.json(octagonFighters);
  } catch (error) {
    console.error('❌ API Error in getAllFighters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /fighter/:fighterId - Return specific fighter
export async function getFighter(req: Request, res: Response) {
  try {
    const fighterId = req.params.fighterId as string;
    const fighter = getFullFighterList().find(f => f.id === fighterId);
    
    if (!fighter) {
      return res.status(404).json({ error: `Fighter with ID ${fighterId} not found` });
    }
    
    const overridden = await applyCsvOverride(fighter);
    const octagonFighter = transformToOctagonFighter(overridden);
    res.json(octagonFighter);
  } catch (error) {
    console.error('❌ API Error in getFighter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /rankings - Return rankings by weight class
export async function getRankings(_req: Request, res: Response) {
  try {
    const rankings: OctagonRankings = {};
    const fighters = getFullFighterList();
    
    // Get unique weight classes
    const weightClasses = [...new Set(fighters.map(f => f.weightClass))];
    
    await Promise.all(weightClasses.map(async (weightClass) => {
      const classificationFighters = fighters.filter(f => f.weightClass.toLowerCase() === weightClass.toLowerCase());
      const overridden = await Promise.all(classificationFighters.map(applyCsvOverride));
      rankings[weightClass] = overridden.map(transformToOctagonFighter);
    }));
    
    res.json(rankings);
  } catch (error) {
    console.error('❌ API Error in getRankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /division/:divisionId - Return division info
export async function getDivision(req: Request, res: Response) {
  try {
    const divisionId = req.params.divisionId as string;
    const divisionFighters = getFullFighterList().filter(f => f.weightClass.toLowerCase() === divisionId.toLowerCase());
    
    if (divisionFighters.length === 0) {
      return res.status(404).json({ error: `Division ${divisionId} not found` });
    }
    
    const overridden = await Promise.all(divisionFighters.map(applyCsvOverride));
    const division: OctagonDivision = {
      id: divisionId,
      name: divisionId,
      fighters: overridden.map(transformToOctagonFighter)
    };
    
    res.json(division);
  } catch (error) {
    console.error('❌ API Error in getDivision:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /search?q=query - Search fighters
export async function searchFightersEndpoint(req: Request, res: Response) {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const queryLower = q.toLowerCase();
    const searchResults = getFullFighterList().filter(f => 
      f.name.toLowerCase().includes(queryLower) ||
      (f.nickname && f.nickname.toLowerCase().includes(queryLower)) ||
      f.weightClass.toLowerCase().includes(queryLower) ||
      (f.nationality && f.nationality.toLowerCase().includes(queryLower))
    );
    const overridden = await Promise.all(searchResults.map(applyCsvOverride));
    const octagonFighters = overridden.map(transformToOctagonFighter);
    
    res.json(octagonFighters);
  } catch (error) {
    console.error('❌ API Error in searchFightersEndpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/fighter/:fighterId/override - Override fighter details
export async function updateFighterOverride(req: Request, res: Response) {
  try {
    const fighterId = req.params.fighterId as string;
    const updateData = req.body;

    const baseFighter = getFullFighterList().find(f => f.id === fighterId);
    if (!baseFighter) {
      return res.status(404).json({ error: `Fighter with ID ${fighterId} not found` });
    }

    overridesData.overrides[fighterId] = {
      ...overridesData.overrides[fighterId],
      ...updateData,
      record: updateData.record ? { ...overridesData.overrides[fighterId]?.record, ...updateData.record } : undefined,
      stats: updateData.stats ? { ...overridesData.overrides[fighterId]?.stats, ...updateData.stats } : undefined
    };

    saveOverrides();
    console.log(`✅ Saved override for fighter: ${baseFighter.name}`);
    res.json({ success: true, message: `Overrides saved for ${baseFighter.name}` });
  } catch (error) {
    console.error('❌ Error updating fighter override:', error);
    res.status(500).json({ error: 'Failed to update fighter' });
  }
}

// POST /api/fighter/custom - Create a custom fighter
export async function createCustomFighter(req: Request, res: Response) {
  try {
    const data = req.body;
    
    if (!data.name || !data.weightClass) {
      return res.status(400).json({ error: 'Fighter name and weight class are required' });
    }

    const newId = `custom_${Date.now()}`;
    const newFighter: AppFighter = {
      id: newId,
      name: data.name.toUpperCase(),
      nickname: data.nickname || '',
      record: {
        wins: parseInt(data.record?.wins || 0, 10),
        losses: parseInt(data.record?.losses || 0, 10),
        draws: parseInt(data.record?.draws || 0, 10)
      },
      weightClass: data.weightClass,
      rank: data.rank || 'Unranked',
      age: parseInt(data.age || 25, 10),
      height: data.height || "5'10\"",
      reach: data.reach || '70"',
      stance: data.stance || 'Orthodox',
      nationality: data.nationality || 'Unknown',
      imageUrl: data.imageUrl,
      stats: {
        striking: parseInt(data.stats?.striking || 75, 10),
        grappling: parseInt(data.stats?.grappling || 75, 10),
        stamina: parseInt(data.stats?.stamina || 75, 10),
        chin: parseInt(data.stats?.chin || 75, 10),
        heart: parseInt(data.stats?.heart || 75, 10),
        fightIQ: parseInt(data.stats?.fightIQ || 75, 10)
      }
    };

    overridesData.customFighters.push(newFighter);
    saveOverrides();
    
    console.log(`✅ Created custom fighter: ${newFighter.name}`);
    res.json({ success: true, fighter: newFighter });
  } catch (error) {
    console.error('❌ Error creating custom fighter:', error);
    res.status(500).json({ error: 'Failed to create custom fighter' });
  }
}

// DELETE /api/fighter/custom/:fighterId - Delete a custom fighter
export async function deleteCustomFighter(req: Request, res: Response) {
  try {
    const fighterId = req.params.fighterId as string;
    const before = overridesData.customFighters.length;
    overridesData.customFighters = overridesData.customFighters.filter(f => f.id !== fighterId);
    if (overridesData.customFighters.length === before) {
      return res.status(404).json({ error: `Custom fighter with ID ${fighterId} not found` });
    }
    saveOverrides();
    console.log(`✅ Deleted custom fighter: ${fighterId}`);
    res.json({ success: true, message: `Custom fighter deleted` });
  } catch (error) {
    console.error('❌ Error deleting custom fighter:', error);
    res.status(500).json({ error: 'Failed to delete custom fighter' });
  }
}

// DELETE /api/fighter/:fighterId/override - Remove override for a fighter
export async function deleteOverride(req: Request, res: Response) {
  try {
    const fighterId = req.params.fighterId as string;
    if (!overridesData.overrides[fighterId]) {
      return res.status(404).json({ error: `No override found for fighter ${fighterId}` });
    }
    delete overridesData.overrides[fighterId];
    saveOverrides();
    console.log(`✅ Deleted override for fighter: ${fighterId}`);
    res.json({ success: true, message: `Override deleted for fighter ${fighterId}` });
  } catch (error) {
    console.error('❌ Error deleting override:', error);
    res.status(500).json({ error: 'Failed to delete override' });
  }
}
