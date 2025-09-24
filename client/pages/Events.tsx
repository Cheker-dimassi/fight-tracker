import { useUfcEvents } from "../hooks/useUfcData";
import { Calendar, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useEventPoster } from "../hooks/useImage";

export default function Events() {
  const { data, loading, error } = useUfcEvents();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(e =>
      e.EVENT.toLowerCase().includes(s) ||
      e.LOCATION.toLowerCase().includes(s)
    );
  }, [q, data]);

  return (
    <div className="min-h-screen bg-ufc-black">
      <div className="relative container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-anton text-5xl lg:text-7xl text-white mb-6 tracking-wider">
            ALL <span className="text-ufc-red">EVENTS</span>
          </h1>
          <div className="max-w-xl mx-auto relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events or locations..."
              className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-3 pl-10 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
            />
            <Search className="absolute left-3 top-3 w-5 h-5 text-ufc-metallic" />
          </div>
        </div>

        {loading && (
          <div className="text-center text-ufc-metallic font-oswald">Loading events…</div>
        )}
        {error && (
          <div className="text-center text-ufc-red font-oswald">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((e) => (
              <EventCard key={e.id} id={e.id} title={e.EVENT} date={e.DATE} location={e.LOCATION} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ id, title, date, location }: { id: string; title: string; date: string; location: string }) {
  const { url } = useEventPoster(title);
  return (
    <Link to={`/event/${id}`} className="fight-card ufc-glow block hover:scale-[1.01] transition">
      {url && (
        <div className="w-full aspect-[16/9] overflow-hidden rounded-t border-b border-ufc-metallic-dark">
          <img src={url} alt={`${title} poster`} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <h3 className="font-anton text-xl text-white mb-2 tracking-wider">{title}</h3>
        <div className="text-ufc-metallic font-oswald space-y-2">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-ufc-red" />{date}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ufc-red" />{location}</div>
        </div>
      </div>
    </Link>
  );
}
