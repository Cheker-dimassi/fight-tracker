import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, MapPin, ArrowLeft, DollarSign, Ticket, Users, Trophy } from "lucide-react";
import { useUfcEvent } from "../hooks/useUfcData";
import { useFightCardStatus } from "../hooks/useFightCardStatus";
import { useEventPoster } from "../hooks/useImage";
import { useScheduledEvent, type ScheduledBout } from "../hooks/useScheduledEvent";
import { useAllFighters } from "../hooks/useOctagonApi";
import { AppFighter } from "@shared/octagon-api";
import { predictBoutOutcome } from "@/lib/fightPredictor";
import { LIVE_STREAM_URL } from "@/lib/streamLinks";

export default function EventPage() {
  const { id } = useParams();
  const { data: scheduled, loading: scheduledLoading } = useScheduledEvent(id || null);
  const { data: allFighters } = useAllFighters();
  const isScheduled = !!scheduled;
  const { data: csvEvent, fights: csvFights, loading: csvLoading, error: csvError } = useUfcEvent(
    isScheduled ? null : id || null,
  );
  const { data: cardStatus, loading: statusLoading, error: statusError } = useFightCardStatus(
    !isScheduled && csvEvent ? { event: csvEvent.EVENT, date: csvEvent.DATE, location: csvEvent.LOCATION } : null,
  );

  const event = scheduled
    ? { EVENT: scheduled.EVENT, DATE: scheduled.DATE, LOCATION: scheduled.LOCATION }
    : csvEvent;
  const loading = scheduledLoading || (!isScheduled && csvLoading);
  const error = !isScheduled ? csvError : null;
  const scheduledBouts = scheduled?.bouts ?? [];
  const boutSegments = groupBouts(scheduledBouts);

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
            <EventPoster title={event.EVENT} />

            <div className="text-center mb-16">
              <h1 className="font-anton text-5xl lg:text-7xl text-white mb-6 tracking-wider">{event.EVENT}</h1>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 text-ufc-metallic font-oswald tracking-wide">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-ufc-red" /><span className="text-lg">{event.DATE}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-ufc-red" /><span className="text-lg">{event.LOCATION}</span></div>
              </div>
            </div>

            <div className="fight-card p-4 mb-8 text-center bg-ufc-dark-gray/30 rounded border border-ufc-metallic-dark/40">
              {isScheduled ? (
                <div className="font-oswald text-ufc-metallic">
                  Card status: <span className="text-white font-bold">{scheduled?.status || "Scheduled"}</span>
                </div>
              ) : statusLoading ? (
                <div className="font-oswald text-ufc-metallic">Checking card status…</div>
              ) : statusError ? (
                <div className="font-oswald text-ufc-metallic text-sm">
                  Card status: <span className="text-white font-bold">Completed</span>
                </div>
              ) : (
                <div className="font-oswald text-ufc-metallic">
                  Card status: <span className="text-white font-bold">{cardStatus?.statusText || "Completed"}</span>
                </div>
              )}
            </div>

            {isScheduled ? (
              scheduledBouts.length > 0 ? (
                <div className="space-y-10">
                  {boutSegments.map((segment) => (
                    <section key={segment.name}>
                      <h2 className="font-anton text-3xl text-white mb-6 tracking-wider text-center">
                        {segment.name.toUpperCase()}
                      </h2>
                      <div className="space-y-4">
                        {segment.bouts.map((bout, idx) => (
                          <ScheduledBoutCard key={`${segment.name}-${idx}`} bout={bout} fighters={allFighters ?? []} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="fight-card p-8 text-center">
                  <p className="font-oswald text-ufc-metallic tracking-wide">Fight card to be announced.</p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {csvFights.map((f, idx) => (
                  <Link
                    key={`${f.Fight_URL || idx}`}
                    to={`/compare?f1=${encodeURIComponent(f.Fighter_1)}&f2=${encodeURIComponent(f.Fighter_2)}&winner=${encodeURIComponent(f.Winner)}&method=${encodeURIComponent(f.Method)}&round=${f.End_Round}&time=${encodeURIComponent(f.End_Time)}`}
                    className="fight-card ufc-glow p-6 block hover:scale-[1.01] transition-transform cursor-pointer"
                  >
                    <div className="text-center mb-4">
                      <h3 className="font-anton text-2xl text-white tracking-wider hover:text-ufc-red transition-colors">
                        {f.Fighter_1} vs. {f.Fighter_2}
                      </h3>
                      <p className="font-oswald text-ufc-metallic mt-2">
                        {f.Weight_Class} • {f.Method} • R{f.End_Round} {f.End_Time}
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 font-oswald text-sm text-ufc-metallic text-center sm:text-left">
                      <div>Winner: <span className="text-green-400 font-bold">{f.Winner || "N/A"}</span></div>
                      <div>Sig. Strikes: <span className="text-white">{f.F1_Sig_Landed}/{f.F1_Sig_Att} vs {f.F2_Sig_Landed}/{f.F2_Sig_Att}</span></div>
                    </div>
                    <div className="mt-4 text-center">
                      <span className="inline-block bg-ufc-red/10 border border-ufc-red/40 hover:bg-ufc-red hover:text-white text-ufc-red font-oswald text-xs font-bold px-4 py-2 tracking-widest transition-colors rounded">
                        COMPARE FIGHTERS & RESULT DETAILS →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Users, value: String(isScheduled ? scheduledBouts.length : csvFights.length || 0), label: "FIGHTS ON CARD" },
                { icon: Trophy, value: `${Math.max(0, (isScheduled ? scheduledBouts : csvFights).filter((f: any) => (f.titleFight || (f.Weight_Class || '').toLowerCase().includes('title'))).length)}`, label: "TITLE FIGHTS" },
                { icon: Clock, value: isScheduled ? "Upcoming" : "Completed", label: "STATUS" }
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
                  <a
                    href={LIVE_STREAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold text-lg tracking-widest transition-all duration-300 border border-ufc-red hover:border-white ufc-glow inline-block text-center"
                  >
                    WATCH LIVE
                  </a>
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

function ScheduledBoutCard({ bout, fighters }: { bout: ScheduledBout; fighters: AppFighter[] }) {
  const prediction = predictBoutOutcome(bout.fighter1, bout.fighter2, fighters);

  return (
    <Link
      to={`/compare?f1=${encodeURIComponent(bout.fighter1)}&f2=${encodeURIComponent(bout.fighter2)}`}
      className={`fight-card ufc-glow p-6 block hover:scale-[1.01] transition-transform cursor-pointer ${bout.mainEvent ? "border-ufc-red/60" : ""}`}
    >
      {bout.mainEvent && (
        <div className="text-center mb-4">
          <span className="px-4 py-1 bg-ufc-red text-white font-oswald font-bold text-xs tracking-widest">MAIN EVENT</span>
        </div>
      )}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center text-center">
        <div>
          <p className="font-anton text-2xl text-white tracking-wider">{bout.fighter1}</p>
        </div>
        <div className="font-oswald text-ufc-red font-bold text-xl tracking-widest">VS</div>
        <div>
          <p className="font-anton text-2xl text-white tracking-wider">{bout.fighter2}</p>
        </div>
      </div>
      <p className="font-oswald text-ufc-metallic text-center mt-4 tracking-wide">
        {bout.weightClass}
        {bout.titleFight ? " • Title Fight" : ""}
      </p>
      {prediction ? (
        <div className="mt-4 rounded-3xl border border-ufc-red/20 bg-[#090909] p-4 text-sm text-ufc-metallic">
          <p className="font-oswald text-[10px] uppercase tracking-[0.35em] text-ufc-red mb-2">Prediction</p>
          <p className="text-white font-semibold">{prediction.winner.name} by {prediction.method}</p>
          <p className="mt-1">Confidence: {prediction.confidence}%</p>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-ufc-metallic/20 bg-[#090909] p-4 text-sm text-ufc-metallic">
          <p className="font-oswald text-[10px] uppercase tracking-[0.35em] text-[#777]">Prediction</p>
          <p className="mt-1">Unable to predict this matchup from the current roster.</p>
        </div>
      )}
      <div className="mt-4 text-center">
        <span className="inline-block bg-ufc-red/10 border border-ufc-red/40 hover:bg-ufc-red hover:text-white text-ufc-red font-oswald text-xs font-bold px-4 py-2 tracking-widest transition-colors rounded">
          COMPARE FIGHTERS →
        </span>
      </div>
    </Link>
  );
}

function groupBouts(bouts: ScheduledBout[]) {
  const order = ["Main Card", "Prelims", "Early Prelims"];
  const grouped = new Map<string, ScheduledBout[]>();

  for (const bout of bouts) {
    const list = grouped.get(bout.segment) ?? [];
    list.push(bout);
    grouped.set(bout.segment, list);
  }

  return order
    .filter((name) => grouped.has(name))
    .map((name) => ({ name, bouts: grouped.get(name)! }));
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
