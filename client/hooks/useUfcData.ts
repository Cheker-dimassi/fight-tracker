import { useEffect, useState } from "react";
import { getEvents, getEventById, getFightsForEvent, getFighterCount, UfcEvent, invalidateUfcDataCache } from "../services/ufcData";
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
  const [fights, setFights] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        setLoading(true);
        const event = await getEventById(eventId);
        if (!event) throw new Error("Event not found");
        setData(event);
        const fights = await getFightsForEvent(event.EVENT);
        setFights(fights);
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
