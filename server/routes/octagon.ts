import { Request, Response } from 'express';
import { fallbackFighters, getFightersByWeightClass, searchFighters } from '../../client/data/fallbackFighters';
import { OctagonFighter, OctagonDivision, OctagonRankings } from '../../shared/octagon-api';

// Transform AppFighter to OctagonFighter format
function transformToOctagonFighter(fighter: any): OctagonFighter {
  return {
    id: fighter.id,
    name: fighter.name,
    nickname: fighter.nickname || '',
    weight_class: fighter.weightClass,
    wins: fighter.record.wins,
    losses: fighter.record.losses,
    draws: fighter.record.draws,
    nationality: fighter.nationality,
    age: fighter.age,
    height: fighter.height,
    reach: fighter.reach,
    stance: fighter.stance,
    rank: fighter.rank ? parseInt(fighter.rank.replace('#', '')) : undefined,
    image_url: fighter.imageUrl
  };
}

// GET /fighters - Return all fighters
export function getAllFighters(_req: Request, res: Response) {
  try {
    const octagonFighters = fallbackFighters.map(transformToOctagonFighter);
    console.log(`✅ API: Served ${octagonFighters.length} fighters`);
    res.json(octagonFighters);
  } catch (error) {
    console.error('❌ API Error in getAllFighters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /fighter/:fighterId - Return specific fighter
export function getFighter(req: Request, res: Response) {
  try {
    const { fighterId } = req.params;
    const fighter = fallbackFighters.find(f => f.id === fighterId);
    
    if (!fighter) {
      return res.status(404).json({ error: `Fighter with ID ${fighterId} not found` });
    }
    
    const octagonFighter = transformToOctagonFighter(fighter);
    console.log(`✅ API: Served fighter ${fighter.name}`);
    res.json(octagonFighter);
  } catch (error) {
    console.error('❌ API Error in getFighter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /rankings - Return rankings by weight class
export function getRankings(_req: Request, res: Response) {
  try {
    const rankings: OctagonRankings = {};
    
    // Get unique weight classes
    const weightClasses = [...new Set(fallbackFighters.map(f => f.weightClass))];
    
    weightClasses.forEach(weightClass => {
      const classificationFighters = getFightersByWeightClass(weightClass);
      rankings[weightClass] = classificationFighters.map(transformToOctagonFighter);
    });
    
    console.log(`✅ API: Served rankings for ${weightClasses.length} weight classes`);
    res.json(rankings);
  } catch (error) {
    console.error('❌ API Error in getRankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /division/:divisionId - Return division info
export function getDivision(req: Request, res: Response) {
  try {
    const { divisionId } = req.params;
    const divisionFighters = getFightersByWeightClass(divisionId);
    
    if (divisionFighters.length === 0) {
      return res.status(404).json({ error: `Division ${divisionId} not found` });
    }
    
    const division: OctagonDivision = {
      id: divisionId,
      name: divisionId,
      fighters: divisionFighters.map(transformToOctagonFighter)
    };
    
    console.log(`✅ API: Served division ${divisionId} with ${divisionFighters.length} fighters`);
    res.json(division);
  } catch (error) {
    console.error('❌ API Error in getDivision:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /search?q=query - Search fighters
export function searchFightersEndpoint(req: Request, res: Response) {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const searchResults = searchFighters(q);
    const octagonFighters = searchResults.map(transformToOctagonFighter);
    
    console.log(`✅ API: Search for "${q}" returned ${octagonFighters.length} results`);
    res.json(octagonFighters);
  } catch (error) {
    console.error('❌ API Error in searchFightersEndpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
