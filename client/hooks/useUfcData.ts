import { useEffect, useState } from "react";
import {
  getEvents,
  getEventById,
  getFightsForEventByDate,
  getFighterCount,
  getFightHistoryForFighter,
  getFighterStatsByFighterName,
  deriveRealStats,
  UfcEvent,
  invalidateUfcDataCache,
} from "../services/ufcData";
import { UfcFightRecord, FightTimelineEntry, RealFighterStats } from "@shared/ufc-gold";
import { octagonApi } from "../services/octagonApi";

export function useUfcEvents() {
  const [data, setData] = useState<UfcEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const events = await getEvents();
        const parsed = events.slice().sort((a, b) => {
          const da = Date.parse(a.DATE);
          const db = Date.parse(b.DATE);
          const aInvalid = Number(isNaN(da));
          const bInvalid = Number(isNaN(db));
          return bInvalid - aInvalid || (db - da);
        });
        if (mounted) setData(parsed);
      } catch (e: any) {
        if (mounted) setError(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(() => { invalidateUfcDataCache(); load(); }, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return { data, loading, error };
}

export function useUfcEvent(eventId: string | null) {
  const [data, setData] = useState<UfcEvent | null>(null);
  const [loading, setLoading] = useState(!!eventId);
  const [error, setError] = useState<string | null>(null);
  const [fights, setFights] = useState<UfcFightRecord[]>([]);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        setLoading(true);
        const event = await getEventById(eventId);
        if (!event) throw new Error("Event not found");
        setData(event);
        // The gold dataset has no event-name column, so fights are joined to
        // this event by calendar date rather than by name.
        const fightsForDate = await getFightsForEventByDate(event.DATE);
        setFights(fightsForDate);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  return { data, fights, loading, error };
}

export function useUfcCounts() {
  const [fighters, setFighters] = useState<number | null>(null);
  const [events, setEvents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [csvFighterCount, eventsList] = await Promise.all([
          getFighterCount().catch(() => null),
          getEvents().catch(() => [] as UfcEvent[]),
        ]);
        let fighterCount = csvFighterCount ?? null;
        if (!fighterCount || fighterCount <= 0) {
          try {
            const fighters = await octagonApi.getAllFighters();
            fighterCount = fighters.length;
          } catch {
            fighterCount = 0;
          }
        }
        if (mounted) {
          setFighters(fighterCount);
          setEvents(eventsList.length);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(() => { invalidateUfcDataCache(); load(); }, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return { fighters, events, loading, error };
}

// Real per-fighter career fight history, replacing the old random generateTimeline().
export function useFighterFightHistory(fighterName: string | null) {
  const [data, setData] = useState<FightTimelineEntry[]>([]);
  const [loading, setLoading] = useState(!!fighterName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fighterName) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await getFightHistoryForFighter(fighterName);
        if (mounted) setData(history);
      } catch (e: any) {
        if (mounted) {
          setError(e.message || String(e));
          setData([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fighterName]);

  return { data, loading, error };
}

// Real per-fighter stat-bar values, replacing the old random generateMockStats().
export function useRealFighterStats(
  fighterName: string | null,
  record: { wins: number; losses: number; draws: number } | null,
) {
  const [data, setData] = useState<RealFighterStats | null>(null);
  const [loading, setLoading] = useState(!!fighterName);

  useEffect(() => {
    if (!fighterName || !record) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const statsRow = await getFighterStatsByFighterName(fighterName).catch(() => null);
        const derived = deriveRealStats(statsRow, record);
        if (mounted) setData(derived);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fighterName, record?.wins, record?.losses, record?.draws]);

  return { data, loading };
}
