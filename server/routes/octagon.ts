import { Request, Response } from 'express';
import { fallbackFighters, getFightersByWeightClass, searchFighters } from '../../client/data/fallbackFighters';
import { OctagonFighter, OctagonDivision, OctagonRankings, AppFighter } from '../../shared/octagon-api';
import { transformToOctagonFighter } from '../../shared/octagon-transform';
import { getCsvFighterMerge } from '../lib/csvFighterData';

// Helper to overlay CSV data onto AppFighter structure
async function applyCsvOverride(base: AppFighter): Promise<AppFighter> {
  try {
    const merge = await getCsvFighterMerge(base.name);
    if (!merge) return base;
    return {
      ...base,
      record: { ...base.record, wins: merge.wins, losses: merge.losses, draws: merge.draws },
      weightClass: merge.weightClass || base.weightClass,
      height: merge.height || base.height,
      reach: merge.reach || base.reach,
      stance: merge.stance || base.stance,
      age: merge.age ?? base.age,
      stats: merge.stats,
    };
  } catch {
    return base;
  }
}

// GET /fighters - Return all fighters
export async function getAllFighters(_req: Request, res: Response) {
  try {
    const appFighters = await Promise.all(fallbackFighters.map(applyCsvOverride));
    const octagonFighters = appFighters.map(transformToOctagonFighter);
    console.log(`✅ API: Served ${octagonFighters.length} fighters with CSV stats`);
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
    const fighter = fallbackFighters.find(f => f.id === fighterId);
    
    if (!fighter) {
      return res.status(404).json({ error: `Fighter with ID ${fighterId} not found` });
    }
    
    const overridden = await applyCsvOverride(fighter);
    const octagonFighter = transformToOctagonFighter(overridden);
    console.log(`✅ API: Served fighter ${fighter.name} with CSV stats`);
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
    
    // Get unique weight classes
    const weightClasses = [...new Set(fallbackFighters.map(f => f.weightClass))];
    
    await Promise.all(weightClasses.map(async (weightClass) => {
      const classificationFighters = getFightersByWeightClass(weightClass);
      const overridden = await Promise.all(classificationFighters.map(applyCsvOverride));
      rankings[weightClass] = overridden.map(transformToOctagonFighter);
    }));
    
    console.log(`✅ API: Served rankings for ${weightClasses.length} weight classes with CSV stats`);
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
    const divisionFighters = getFightersByWeightClass(divisionId);
    
    if (divisionFighters.length === 0) {
      return res.status(404).json({ error: `Division ${divisionId} not found` });
    }
    
    const overridden = await Promise.all(divisionFighters.map(applyCsvOverride));
    const division: OctagonDivision = {
      id: divisionId,
      name: divisionId,
      fighters: overridden.map(transformToOctagonFighter)
    };
    
    console.log(`✅ API: Served division ${divisionId} with ${divisionFighters.length} fighters (CSV stats)`);
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
    
    const searchResults = searchFighters(q);
    const overridden = await Promise.all(searchResults.map(applyCsvOverride));
    const octagonFighters = overridden.map(transformToOctagonFighter);
    
    console.log(`✅ API: Search for "${q}" returned ${octagonFighters.length} results (CSV stats)`);
    res.json(octagonFighters);
  } catch (error) {
    console.error('❌ API Error in searchFightersEndpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
