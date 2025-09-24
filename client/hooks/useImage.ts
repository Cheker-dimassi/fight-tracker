import { useEffect, useState } from "react";

function cacheKey(kind: string, key: string) { return `img:${kind}:${key.toLowerCase()}`; }

export function useFighterImage(name: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!name) return;
    const k = cacheKey("fighter", name);
    const cached = localStorage.getItem(k);
    if (cached) { setUrl(cached); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/image/fighter?name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (json?.url) {
          setUrl(json.url);
          localStorage.setItem(k, json.url);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  return { url, loading };
}

export function useEventPoster(eventTitle: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventTitle) return;
    const k = cacheKey("event", eventTitle);
    const cached = localStorage.getItem(k);
    if (cached) { setUrl(cached); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/image/event?event=${encodeURIComponent(eventTitle)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (json?.url) {
          setUrl(json.url);
          localStorage.setItem(k, json.url);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [eventTitle]);

  return { url, loading };
}
