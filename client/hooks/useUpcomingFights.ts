import { useCallback, useEffect, useMemo, useState } from "react";

export interface UpcomingFight {
  id: string;
  EVENT: string;
  DATE: string;
  LOCATION: string;
}

function coerceArray(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    // Some providers wrap arrays: { data: [...] } or { result: [...] }
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
  return items.map((it, idx) => {
    const title = getStr(it, ["event", "title", "event_name", "eventName", "name"]);
    const date = getStr(it, ["date", "event_date", "eventDate", "datetime", "time", "scheduled_at"]);
    const loc = getStr(it, ["location", "venue", "place", "arena", "city"], "");
    const id = getStr(it, ["id", "event_id", "eventId", "code"], `${title || "event"}-${idx}`);
    return { id, EVENT: title || id, DATE: date, LOCATION: loc };
  }).filter(e => e.DATE);
}

export function useUpcomingFights() {
  const [data, setData] = useState<UpcomingFight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/upcoming-fights", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = coerceArray(json);
      setData(normalize(items));
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

  const nearestTs = useMemo(() => {
    const now = Date.now();
    const times = data
      .map(e => Date.parse(e.DATE))
      .filter(ts => !Number.isNaN(ts) && ts >= now)
      .sort((a, b) => a - b);
    return times[0];
  }, [data]);

  return { data, loading, error, refetch: fetchUpcoming, nearestTs };
}
