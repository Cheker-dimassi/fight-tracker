import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowLeft, DollarSign, Ticket, Users, Trophy } from "lucide-react";
import { useUfcEvent } from "../hooks/useUfcData";
import { useFightCardStatus } from "../hooks/useFightCardStatus";
import { useEventPoster } from "../hooks/useImage";

export default function EventPage() {
  const { id } = useParams();
  const { data: event, fights, loading, error } = useUfcEvent(id || null);
  const { data: cardStatus, loading: statusLoading, error: statusError } = useFightCardStatus(event ? { event: event.EVENT, date: event.DATE, location: event.LOCATION } : null);

  return (
    <div className="min-h-screen bg-ufc-black">
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(229,9,20,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(229,9,20,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <Link to="/events" className="inline-flex items-center gap-3 text-ufc-metallic hover:text-white mb-8 font-oswald tracking-wide transition-colors">
          <ArrowLeft className="w-5 h-5" />
          BACK TO EVENTS
        </Link>

        {loading && <div className="text-center text-ufc-metallic font-oswald">Loading event…</div>}
        {error && <div className="text-center text-ufc-red font-oswald">{error}</div>}
        {!loading && !event && !error && (
          <div className="text-center text-white font-oswald">Event not found.</div>
        )}

        {event && (
          <>
            {/* Poster */}
            <EventPoster title={event.EVENT} />

            <div className="text-center mb-16">
              <h1 className="font-anton text-5xl lg:text-7xl text-white mb-6 tracking-wider">{event.EVENT}</h1>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 text-ufc-metallic font-oswald tracking-wide">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-ufc-red" /><span className="text-lg">{event.DATE}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-ufc-red" /><span className="text-lg">{event.LOCATION}</span></div>
              </div>
            </div>

            {/* Fight card status */}
            <div className="fight-card p-4 mb-8 text-center">
              {statusLoading ? (
                <div className="font-oswald text-ufc-metallic">Checking card status…</div>
              ) : statusError ? (
                <div className="font-oswald text-ufc-red">{statusError}</div>
              ) : (
                <div className="font-oswald text-ufc-metallic">Card status: <span className="text-white">{cardStatus?.statusText || 'Unknown'}</span></div>
              )}
            </div>

            <div className="space-y-6">
              {fights.map((f, idx) => (
                <div key={`${f.BOUT}-${idx}`} className="fight-card ufc-glow p-6">
                  <div className="text-center mb-4">
                    <h3 className="font-anton text-2xl text-white tracking-wider">{f.BOUT}</h3>
                    {f.result && (
                      <p className="font-oswald text-ufc-metallic mt-2">
                        {f.result.WEIGHTCLASS} • {f.result.METHOD} • R{f.result.ROUND} {f.result.TIME}
                      </p>
                    )}
                  </div>
                  {f.result && (
                    <div className="grid sm:grid-cols-2 gap-4 font-oswald text-sm text-ufc-metallic">
                      <div>Outcome: <span className="text-white">{f.result.OUTCOME}</span></div>
                      <div>Referee: <span className="text-white">{f.result.REFEREE}</span></div>
                      <div className="sm:col-span-2">Details: <span className="text-white">{f.result.DETAILS}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Users, value: String(fights.length || 0), label: "FIGHTS ON CARD" },
                { icon: Trophy, value: `${Math.max(0, fights.filter(f => (f.result?.WEIGHTCLASS || '').toLowerCase().includes('title')).length)}`, label: "TITLE FIGHTS" },
                { icon: Clock, value: "—", label: "DURATION" }
              ].map((stat, index) => {
                const Icon = stat.icon as any;
                return (
                  <div key={index} className="text-center p-6 bg-ufc-dark-gray rounded border border-ufc-metallic-dark">
                    <div className="w-16 h-16 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="font-anton text-3xl text-white mb-2">{stat.value}</div>
                    <div className="font-oswald text-ufc-metallic tracking-wide text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="fight-card p-8 mb-12 mt-12 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="font-anton text-3xl lg:text-4xl text-white mb-4 tracking-wider">WATCH <span className="text-ufc-red">LIVE</span></h2>
                <p className="text-ufc-metallic font-oswald text-lg mb-6 tracking-wide">Stream live events via your preferred provider.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex items-center gap-2 text-2xl font-anton text-ufc-red"><DollarSign className="w-6 h-6" /> PPV</div>
                  <button className="bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold text-lg tracking-widest transition-all duration-300 border border-ufc-red hover:border-white ufc-glow">ORDER NOW</button>
                  <button className="flex items-center gap-2 border-2 border-ufc-metallic text-ufc-metallic hover:border-white hover:text-white px-6 py-4 font-oswald font-bold tracking-wider transition-all duration-300"><Ticket className="w-5 h-5" />LIVE TICKETS</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EventPoster({ title }: { title: string }) {
  const { url } = useEventPoster(title);
  if (!url) return null;
  return (
    <div className="max-w-xl mx-auto mb-10">
      <img src={url} alt={`${title} poster`} className="w-full h-auto rounded shadow border border-ufc-metallic-dark" />
    </div>
  );
}
