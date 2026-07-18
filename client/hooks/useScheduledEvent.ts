import { useCallback, useEffect, useState } from "react";
import { formatMainCardTime } from "@/lib/eventTime";

const LOCAL_BASE = `${(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/data`;

export interface ScheduledBout {
  segment: string;
  fighter1: string;
  fighter2: string;
  weightClass: string;
  mainEvent?: boolean;
  titleFight?: boolean;
}

export interface ScheduledEventDetail {
  id: string;
  EVENT: string;
  DATE: string;
  LOCATION: string;
  mainCardStart: string;
  status: string;
  bouts: ScheduledBout[];
}

interface UpcomingEventRow {
  id: string;
  event: string;
  location: string;
  mainCardStart: string;
}

type FightCardsById = Record<
  string,
  {
    status: string;
    bouts: ScheduledBout[];
  }
>;

export async function fetchAllScheduledEvents(): Promise<ScheduledEventDetail[]> {
  const [eventsRes, cardsRes] = await Promise.all([
    fetch(`${LOCAL_BASE}/upcoming_events.json`, { cache: "no-store" }),
    fetch(`${LOCAL_BASE}/upcoming_fight_cards.json`, { cache: "no-store" }),
  ]);

  if (!eventsRes.ok) throw new Error("Failed to load upcoming events");
  const events = (await eventsRes.json()) as UpcomingEventRow[];
  const cards: FightCardsById = cardsRes.ok ? await cardsRes.json() : {};

  return events.map((event) => {
    const card = cards[event.id];
    return {
      id: event.id,
      EVENT: event.event,
      DATE: formatMainCardTime(event.mainCardStart),
      LOCATION: event.location,
      mainCardStart: event.mainCardStart,
      status: card?.status ?? "Scheduled",
      bouts: card?.bouts ?? [],
    };
  });
}

export function useScheduledEvent(eventId: string | null) {
  const [data, setData] = useState<ScheduledEventDetail | null>(null);
  const [loading, setLoading] = useState(!!eventId);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const events = await fetchAllScheduledEvents();
      setData(events.find((event) => event.id === eventId) ?? null);
    } catch (e: any) {
      setError(e.message || String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

export function useScheduledEvents() {
  const [data, setData] = useState<ScheduledEventDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await fetchAllScheduledEvents());
    } catch (e: any) {
      setError(e.message || String(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
