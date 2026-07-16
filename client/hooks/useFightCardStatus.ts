import { useCallback, useEffect, useState } from "react";

export interface FightCardStatus {
  statusText?: string;
  raw?: any;
}

export function useFightCardStatus(params: { event?: string; date?: string; location?: string } | null) {
  const [data, setData] = useState<FightCardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!params) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/fight-card-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.message) {
            msg = errBody.message;
          }
        } catch {}
        throw new Error(msg);
      }
      const json = await res.json();
      const statusText =
        (json && (json.status || json.card_status || json.message || json.statusText)) || undefined;
      setData({ statusText, raw: json });
    } catch (e: any) {
      setError(e.message || String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  return { data, loading, error, refetch: fetchStatus };
}
