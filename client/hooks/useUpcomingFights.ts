import { useCallback, useEffect, useMemo, useState } from "react";
import { findNextEventTimestamp, getEventTimestamp, type ScheduledEvent } from "@/lib/eventTime";

export interface UpcomingFight {
  id: string;
  EVENT: string;
  DATE: string;
  LOCATION: string;
  mainCardStart?: string;
}

const LOCAL_BASE = `${(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/data`;

function coerceArray(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    for (const key of ["data", "result", "results", "events", "fights"]) {
      if (Array.isArray((input as any)[key])) return (input as any)[key];
    }
  }
  return [];
}

function getStr(obj: any, keys: string[], def = "") {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return def;
}

function normalize(items: any[]): UpcomingFight[] {
  return items
    .map((it, idx) => {
      const title = getStr(it, ["event", "EVENT", "title", "event_name", "eventName", "name"]);
      const mainCardStart = getStr(it, ["mainCardStart", "main_card_start", "startTime", "start_time"]);
      const date =
        mainCardStart ||
        getStr(it, ["date", "DATE", "event_date", "eventDate", "datetime", "time", "scheduled_at"]);
      const loc = getStr(it, ["location", "LOCATION", "venue", "place", "arena", "city"], "");
      const id = getStr(it, ["id", "event_id", "eventId", "code"], `${title || "event"}-${idx}`);
      return { id, EVENT: title || id, DATE: date, LOCATION: loc, mainCardStart: mainCardStart || undefined };
    })
    .filter((e) => e.DATE || e.mainCardStart);
}

async function fetchLocalSchedule(): Promise<UpcomingFight[]> {
  const res = await fetch(`${LOCAL_BASE}/upcoming_events.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load local schedule (${res.status})`);
  const json = (await res.json()) as ScheduledEvent[];
  return normalize(json);
}

export function useUpcomingFights() {
  const [data, setData] = useState<UpcomingFight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/upcoming-fights", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const items = coerceArray(json);
          const normalized = normalize(items);
          if (normalized.length > 0) {
            setData(normalized);
            return;
          }
        }
      } catch {
        // fall through to local schedule
      }

      setData(await fetchLocalSchedule());
    } catch (e: any) {
      setError(e.message || String(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const nearestTs = useMemo(() => findNextEventTimestamp(data), [data]);

  const nextEvent = useMemo(() => {
    if (!nearestTs) return null;
    return (
      data.find((event) => getEventTimestamp(event) === nearestTs) ??
      data.find((event) => {
        const ts = getEventTimestamp(event);
        return ts !== null && ts >= Date.now();
      }) ??
      null
    );
  }, [data, nearestTs]);

  return { data, loading, error, refetch: fetchUpcoming, nearestTs, nextEvent };
}
