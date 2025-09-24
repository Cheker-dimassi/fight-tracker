import { OctagonFighter, OctagonDivision, OctagonRankings, AppFighter } from '@shared/octagon-api';
import { fallbackFighters, getFightersByWeightClass, searchFighters } from '../data/fallbackFighters';

// In development, API runs on same port as Vite dev server (8080)
// In production, API_BASE_URL should be set via environment variable
const DEFAULT_API_URL = import.meta.env.DEV ? '' : 'https://octagon-api.vercel.app';
const API_BASE_URL = import.meta.env.VITE_OCTAGON_API_URL || DEFAULT_API_URL;
const FORCE_OFFLINE_MODE = import.meta.env.VITE_USE_OFFLINE_MODE === 'true';

class OctagonApiService {
  private usingFallback = false;

  private async fetchApi<T>(endpoint: string, retries = 1): Promise<T> {
    // Check if offline mode is forced via environment variable
    if (FORCE_OFFLINE_MODE) {
      console.log('🔄 Offline mode forced via VITE_USE_OFFLINE_MODE=true');
      this.usingFallback = true;
      throw new Error('Offline mode enabled');
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors' // Explicitly set CORS mode
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        this.usingFallback = false;
        console.log(`✅ Successfully fetched data from Octagon API: ${endpoint}`);
        return data;
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed for ${endpoint}:`, error);
        
        if (attempt === retries) {
          console.error(`❌ All attempts failed for ${endpoint}. Using fallback data.`);
          this.usingFallback = true;
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  async getAllFighters(): Promise<OctagonFighter[]> {
    try {
      const data = await this.fetchApi<OctagonFighter[] | { fighters: OctagonFighter[] }>('/api/fighters', 2);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && 'fighters' in data) {
        return data.fighters;
      }
      
      throw new Error('Unexpected API response format for fighters');
    } catch (error) {
      console.log('🔄 Using fallback fighter data due to API unavailability');
      this.usingFallback = true;
      // Convert fallback data to OctagonFighter format
      return fallbackFighters.map(fighter => ({
        id: fighter.id,
        name: fighter.name,
        nickname: fighter.nickname,
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
      }));
    }
  }

  async getFighter(fighterId: string): Promise<OctagonFighter> {
    try {
      return await this.fetchApi<OctagonFighter>(`/api/fighter/${fighterId}`, 2);
    } catch (error) {
      console.log(`🔄 Using fallback data for fighter ${fighterId}`);
      this.usingFallback = true;
      
      const fallbackFighter = fallbackFighters.find(f => f.id === fighterId);
      if (!fallbackFighter) {
        throw new Error(`Fighter with ID ${fighterId} not found in fallback data`);
      }
      
      return {
        id: fallbackFighter.id,
        name: fallbackFighter.name,
        nickname: fallbackFighter.nickname,
        weight_class: fallbackFighter.weightClass,
        wins: fallbackFighter.record.wins,
        losses: fallbackFighter.record.losses,
        draws: fallbackFighter.record.draws,
        nationality: fallbackFighter.nationality,
        age: fallbackFighter.age,
        height: fallbackFighter.height,
        reach: fallbackFighter.reach,
        stance: fallbackFighter.stance,
        rank: fallbackFighter.rank ? parseInt(fallbackFighter.rank.replace('#', '')) : undefined,
        image_url: fallbackFighter.imageUrl
      };
    }
  }

  async getDivision(divisionId: string): Promise<OctagonDivision> {
    try {
      return await this.fetchApi<OctagonDivision>(`/api/division/${divisionId}`, 2);
    } catch (error) {
      console.log(`🔄 Using fallback data for division ${divisionId}`);
      this.usingFallback = true;
      
      // Create mock division from fallback data
      const divisionFighters = getFightersByWeightClass(divisionId);
      return {
        id: divisionId,
        name: divisionId,
        fighters: divisionFighters.map(fighter => ({
          id: fighter.id,
          name: fighter.name,
          nickname: fighter.nickname,
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
        }))
      };
    }
  }

  async getRankings(): Promise<OctagonRankings> {
    try {
      return await this.fetchApi<OctagonRankings>('/api/rankings', 2);
    } catch (error) {
      console.log('🔄 Using fallback rankings data');
      this.usingFallback = true;
      
      // Create mock rankings from fallback data
      const rankings: OctagonRankings = {};
      const weightClasses = [...new Set(fallbackFighters.map(f => f.weightClass))];
      
      weightClasses.forEach(weightClass => {
        rankings[weightClass] = getFightersByWeightClass(weightClass).map(fighter => ({
          id: fighter.id,
          name: fighter.name,
          nickname: fighter.nickname,
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
        }));
      });
      
      return rankings;
    }
  }

  // Transform API data to our app format
  transformFighter(octagonFighter: OctagonFighter): AppFighter {
    // Use existing stats from fallback if available, otherwise generate
    const existingFighter = fallbackFighters.find(f => 
      f.name.toLowerCase() === octagonFighter.name.toLowerCase()
    );
    
    const stats = existingFighter ? existingFighter.stats : this.generateMockStats(octagonFighter);
    
    return {
      id: octagonFighter.id,
      name: octagonFighter.name.toUpperCase(),
      nickname: octagonFighter.nickname || '',
      record: {
        wins: octagonFighter.wins || octagonFighter.record?.wins || 0,
        losses: octagonFighter.losses || octagonFighter.record?.losses || 0,
        draws: octagonFighter.draws || octagonFighter.record?.draws || 0
      },
      weightClass: octagonFighter.weight_class,
      rank: octagonFighter.rank ? `#${octagonFighter.rank}` : undefined,
      age: octagonFighter.age,
      height: octagonFighter.height,
      reach: octagonFighter.reach,
      stance: octagonFighter.stance,
      nationality: octagonFighter.nationality,
      imageUrl: octagonFighter.image_url,
      stats: stats
    };
  }

  private generateMockStats(fighter: OctagonFighter): AppFighter['stats'] {
    // Generate realistic stats based on fighter's record and weight class
    const totalFights = (fighter.wins || 0) + (fighter.losses || 0) + (fighter.draws || 0);
    const winRate = totalFights > 0 ? (fighter.wins || 0) / totalFights : 0;
    
    // Base stats with some randomization for realism
    const baseStatBonus = Math.floor(winRate * 20); // 0-20 bonus based on win rate
    const randomVariation = () => Math.floor(Math.random() * 10) - 5; // -5 to +5 variation
    
    return {
      striking: Math.min(95, Math.max(60, 75 + baseStatBonus + randomVariation())),
      grappling: Math.min(95, Math.max(60, 70 + baseStatBonus + randomVariation())),
      stamina: Math.min(95, Math.max(65, 80 + baseStatBonus + randomVariation())),
      chin: Math.min(95, Math.max(70, 85 + baseStatBonus + randomVariation())),
      heart: Math.min(95, Math.max(75, 85 + baseStatBonus + randomVariation())),
      fightIQ: Math.min(95, Math.max(70, 80 + baseStatBonus + randomVariation()))
    };
  }

  // Get fighters by weight class
  async getFightersByWeightClass(weightClass: string): Promise<AppFighter[]> {
    try {
      const allFighters = await this.getAllFighters();
      return allFighters
        .filter(fighter => fighter.weight_class.toLowerCase().includes(weightClass.toLowerCase()))
        .map(fighter => this.transformFighter(fighter));
    } catch (error) {
      console.log(`🔄 Using fallback fighters for weight class: ${weightClass}`);
      return getFightersByWeightClass(weightClass);
    }
  }

  // Get top fighters (first 20 from rankings or all fighters)
  async getTopFighters(limit: number = 20): Promise<AppFighter[]> {
    try {
      const allFighters = await this.getAllFighters();
      return allFighters
        .slice(0, limit)
        .map(fighter => this.transformFighter(fighter));
    } catch (error) {
      console.log('🔄 Using fallback top fighters data');
      return fallbackFighters.slice(0, limit);
    }
  }

  // Search fighters by name
  async searchFighters(query: string): Promise<AppFighter[]> {
    try {
      const allFighters = await this.getAllFighters();
      const searchTerm = query.toLowerCase();
      
      return allFighters
        .filter(fighter => 
          fighter.name.toLowerCase().includes(searchTerm) ||
          (fighter.nickname && fighter.nickname.toLowerCase().includes(searchTerm))
        )
        .map(fighter => this.transformFighter(fighter));
    } catch (error) {
      console.log(`🔄 Using fallback search for: ${query}`);
      return searchFighters(query);
    }
  }

  // Check if currently using fallback data
  isUsingFallback(): boolean {
    return this.usingFallback;
  }

  // Get status message
  getStatusMessage(): string {
    if (FORCE_OFFLINE_MODE) {
      return "Offline mode enabled (VITE_USE_OFFLINE_MODE=true)";
    }
    return this.usingFallback
      ? "Using offline fighter database (API unavailable)"
      : "Connected to live Octagon API";
  }
}

export const octagonApi = new OctagonApiService();
export default octagonApi;
