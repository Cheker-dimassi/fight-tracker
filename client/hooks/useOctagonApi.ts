import { useState, useEffect, useCallback } from 'react';
import { AppFighter } from '@shared/octagon-api';
import { octagonApi } from '../services/octagonApi';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isUsingFallback: boolean;
  statusMessage: string;
}

export function useAllFighters(): UseApiState<AppFighter[]> {
  const [data, setData] = useState<AppFighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchFighters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fighters = await octagonApi.getAllFighters(); // Raw fighters from API or fallback
      const appFighters = fighters.map(f => octagonApi.transformFighter(f));
      setData(appFighters);
      setIsUsingFallback(octagonApi.isUsingFallback());
      setStatusMessage(octagonApi.getStatusMessage());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fighters';
      setError(errorMessage);
      setData([]);
      setIsUsingFallback(true);
      setStatusMessage("Using offline fighter database");
      console.error('Error in useAllFighters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFighters();
  }, [fetchFighters]);

  return {
    data,
    loading,
    error,
    refetch: fetchFighters,
    isUsingFallback,
    statusMessage
  };
}

export function useFighter(fighterId: string | null): UseApiState<AppFighter> {
  const [data, setData] = useState<AppFighter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchFighter = useCallback(async () => {
    if (!fighterId) return;

    try {
      setLoading(true);
      setError(null);
      const rawFighter = await octagonApi.getFighter(fighterId);
      const fighter = octagonApi.transformFighter(rawFighter);
      setData(fighter);
      setIsUsingFallback(octagonApi.isUsingFallback());
      setStatusMessage(octagonApi.getStatusMessage());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fighter';
      setError(errorMessage);
      setData(null);
      setIsUsingFallback(true);
      setStatusMessage("Fighter not found in offline database");
      console.error('Error in useFighter:', err);
    } finally {
      setLoading(false);
    }
  }, [fighterId]);

  useEffect(() => {
    fetchFighter();
  }, [fetchFighter]);

  return {
    data,
    loading,
    error,
    refetch: fetchFighter,
    isUsingFallback,
    statusMessage
  };
}

export function useFighterSearch() {
  const [data, setData] = useState<AppFighter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setData([]);
      setIsUsingFallback(false);
      setStatusMessage('');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fighters = await octagonApi.searchFighters(query);
      setData(fighters);
      setIsUsingFallback(octagonApi.isUsingFallback());
      setStatusMessage(octagonApi.getStatusMessage());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search fighters';
      setError(errorMessage);
      setData([]);
      setIsUsingFallback(true);
      setStatusMessage("Using offline search results");
      console.error('Error in useFighterSearch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    search,
    isUsingFallback,
    statusMessage
  };
}

export function useTopFightersByWeight(weightClass: string): UseApiState<AppFighter[]> {
  const [data, setData] = useState<AppFighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchFighters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fighters = await octagonApi.getFightersByWeightClass(weightClass);
      setData(fighters.slice(0, 10)); // Top 10 per weight class
      setIsUsingFallback(octagonApi.isUsingFallback());
      setStatusMessage(octagonApi.getStatusMessage());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fighters';
      setError(errorMessage);
      setData([]);
      setIsUsingFallback(true);
      setStatusMessage("Using offline fighter database");
      console.error('Error in useTopFightersByWeight:', err);
    } finally {
      setLoading(false);
    }
  }, [weightClass]);

  useEffect(() => {
    fetchFighters();
  }, [fetchFighters]);

  return {
    data,
    loading,
    error,
    refetch: fetchFighters,
    isUsingFallback,
    statusMessage
  };
}

// Generate mock upcoming fights from real fighter data
export function useMockUpcomingFights(): UseApiState<any[]> {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const generateFights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get top fighters from different weight classes
      const heavyweights = await octagonApi.getFightersByWeightClass('heavyweight');
      const lightHeavyweights = await octagonApi.getFightersByWeightClass('light heavyweight');
      const middleweights = await octagonApi.getFightersByWeightClass('middleweight');
      
      const mockFights = [];
      
      // Create heavyweight title fight
      if (heavyweights.length >= 2) {
        mockFights.push({
          fighters: `${heavyweights[0].name} vs ${heavyweights[1].name}`,
          title: "HEAVYWEIGHT CHAMPIONSHIP",
          date: "DEC 28, 2024",
          venue: "T-Mobile Arena, Las Vegas",
          mainEvent: true,
          fighter1: heavyweights[0],
          fighter2: heavyweights[1]
        });
      }
      
      // Create light heavyweight co-main
      if (lightHeavyweights.length >= 2) {
        mockFights.push({
          fighters: `${lightHeavyweights[0].name} vs ${lightHeavyweights[1].name}`,
          title: "CO-MAIN EVENT",
          date: "DEC 28, 2024", 
          venue: "T-Mobile Arena, Las Vegas",
          mainEvent: false,
          fighter1: lightHeavyweights[0],
          fighter2: lightHeavyweights[1]
        });
      }
      
      // Create middleweight fight
      if (middleweights.length >= 2) {
        mockFights.push({
          fighters: `${middleweights[0].name} vs ${middleweights[1].name}`,
          title: "MIDDLEWEIGHT BOUT",
          date: "JAN 15, 2025",
          venue: "Phoenix Arena, AZ", 
          mainEvent: false,
          fighter1: middleweights[0],
          fighter2: middleweights[1]
        });
      }
      
      setData(mockFights);
      setIsUsingFallback(octagonApi.isUsingFallback());
      setStatusMessage(octagonApi.getStatusMessage());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate fights';
      setError(errorMessage);
      setData([]);
      setIsUsingFallback(true);
      setStatusMessage("Using offline fight data");
      console.error('Error in useMockUpcomingFights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generateFights();
  }, [generateFights]);

  return {
    data,
    loading,
    error,
    refetch: generateFights,
    isUsingFallback,
    statusMessage
  };
}
