import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, Trophy, Zap, TrendingUp, Users, Target } from "lucide-react";
import { useAllFighters } from "../hooks/useOctagonApi";
import { Link } from "react-router-dom";
import { useUfcCounts, useUfcEvents } from "../hooks/useUfcData";
import { useUpcomingFights } from "../hooks/useUpcomingFights";
import { useFighterImage } from "../hooks/useImage";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function FighterAvatar({ name, url, nickname }: { name: string; url?: string | null; nickname?: string }) {
  const { url: fetched } = useFighterImage(name);
  const finalUrl = url || fetched || null;
  if (finalUrl) {
    return (
      <div className="w-20 h-20 rounded-lg mx-auto mb-4 overflow-hidden border-2 border-ufc-metallic-dark bg-black">
        <img src={finalUrl} alt={`${name} portrait`} className="w-full h-full object-cover" />
      </div>
    );
  }
  const letter = (nickname || name).trim().charAt(0).toUpperCase();
  return (
    <div className="w-20 h-20 bg-gradient-to-br from-ufc-red/30 to-ufc-dark-gray rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-ufc-metallic-dark">
      <span className="font-anton text-xl text-white">{letter}</span>
    </div>
  );
}

export default function Index() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Fetch events (fallback) and upstream upcoming fights (primary)
  const { data: events } = useUfcEvents();
  const { data: apiUpcoming, loading: fightsLoading, error: fightsError, nearestTs } = useUpcomingFights();

  const upcomingFights = useMemo(() => {
    const primary = apiUpcoming.length ? apiUpcoming.map((e, i) => ({
      id: e.id,
      fighters: e.EVENT,
      title: i === 0 ? 'MAIN EVENT' : 'UPCOMING EVENT',
      date: e.DATE,
      venue: e.LOCATION,
      mainEvent: i === 0,
    })) : [];

    if (primary.length) return primary;

    const fallback = (events || [])
      .filter(e => !Number.isNaN(Date.parse(e.DATE)) && Date.parse(e.DATE) >= Date.now())
      .sort((a, b) => Date.parse(a.DATE) - Date.parse(b.DATE))
      .slice(0, 3)
      .map((e, i) => ({ id: e.id, fighters: e.EVENT, title: i === 0 ? 'MAIN EVENT' : 'UPCOMING EVENT', date: e.DATE, venue: e.LOCATION, mainEvent: i === 0 }));

    return fallback;
  }, [apiUpcoming, events]);

  const {
    data: allFighters,
    loading: fightersLoading,
    isUsingFallback: fightersUsingFallback,
    statusMessage: fightersStatus
  } = useAllFighters();

  // Using events from above for countdown

  // Compute next upcoming event timestamp (ms). Prefer API, fallback to CSV
  const nextEventTs = useMemo(() => {
    if (nearestTs && !Number.isNaN(nearestTs)) return nearestTs;
    const now = Date.now();
    const candidates = (events || [])
      .map(e => Date.parse(e.DATE))
      .filter(ts => !Number.isNaN(ts) && ts >= now)
      .sort((a, b) => a - b);
    if (candidates.length > 0) return candidates[0];
    const fb = new Date();
    fb.setDate(fb.getDate() + 7);
    fb.setHours(22, 0, 0, 0);
    return fb.getTime();
  }, [nearestTs, events]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = nextEventTs - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [nextEventTs]);

  // Pull dynamic counts from CSV dataset
  const { fighters: fightersCount, events: eventsCount } = useUfcCounts();
  const fightersStat = Math.max(fightersCount ?? 0, allFighters?.length ?? 0).toString();
  const stats = [
    { icon: Users, value: fightersStat, label: "ACTIVE FIGHTERS" },
    { icon: Trophy, value: ((eventsCount ?? 0).toString()), label: "EVENTS TRACKED" },
    { icon: Zap, value: "1M+", label: "FIGHT FANS" },
    { icon: Target, value: "15", label: "YEARS OF DATA" }
  ];

  // Loading component
  const LoadingCard = () => (
    <div className="fight-card p-6 lg:p-8 animate-pulse">
      <div className="text-center mb-6">
        <div className="h-6 bg-ufc-red/30 rounded w-32 mx-auto mb-4"></div>
      </div>
      <div className="text-center">
        <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-4"></div>
        <div className="h-6 bg-ufc-red/50 rounded w-32 mx-auto mb-6"></div>
        <div className="space-y-2">
          <div className="h-4 bg-ufc-metallic/30 rounded w-28 mx-auto"></div>
          <div className="h-4 bg-ufc-metallic/30 rounded w-36 mx-auto"></div>
        </div>
      </div>
    </div>
  );

  // Error component
  const ErrorMessage = ({ error }: { error: string }) => (
    <div className="fight-card p-6 lg:p-8 text-center">
      <div className="text-ufc-red mb-4">⚠️</div>
      <h3 className="font-oswald text-lg text-white mb-2">Unable to load fight data</h3>
      <p className="text-ufc-metallic text-sm">{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 bg-ufc-red text-white px-4 py-2 font-oswald text-sm tracking-wider"
      >
        RETRY
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-ufc-black">
      {/* Hero Section with Cage Background */}
      <section className="relative h-screen bg-gradient-to-br from-ufc-black via-ufc-dark-gray to-ufc-black overflow-hidden">
        {/* Cage/Grid Background Pattern */}
        <div className="absolute inset-0 opacity-10">
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
        
        {/* Radial glow effects */}
        <div className="absolute inset-0 cage-overlay"></div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-6xl mx-auto text-center text-white">
            <h1 className="font-anton text-6xl lg:text-8xl xl:text-9xl mb-8 leading-none tracking-wider">
              TRACK EVERY
              <span className="block text-ufc-red drop-shadow-lg">FIGHT</span>
            </h1>
            <p className="font-oswald text-2xl lg:text-4xl mb-8 text-ufc-metallic-light font-light tracking-wide">
              KNOW EVERY FIGHTER
            </p>

            
            {/* Countdown Timer */}
            <div className="mb-12">
              <h3 className="font-oswald text-xl mb-6 text-ufc-metallic tracking-widest">NEXT MAIN EVENT</h3>
              <div className="flex justify-center gap-4 lg:gap-8">
                {Object.entries(timeLeft).map(([unit, value]) => (
                  <div key={unit} className="text-center">
                    <div className="countdown-digit w-16 h-16 lg:w-20 lg:h-20 rounded-lg flex items-center justify-center mb-2">
                      <span className="font-anton text-2xl lg:text-3xl text-white">
                        {value.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="font-oswald text-xs lg:text-sm text-ufc-metallic tracking-widest uppercase">
                      {unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="https://streameast.app" target="_blank" rel="noopener noreferrer" className="bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold text-lg tracking-widest transition-all duration-300 hover:shadow-xl hover:shadow-ufc-red/30 border border-ufc-red hover:border-white ufc-glow">
                STREAM NOW
              </a>
              <Link to="/events" className="border-2 border-white text-white hover:bg-white hover:text-ufc-black px-8 py-4 font-oswald font-bold text-lg tracking-widest transition-all duration-300">
                VIEW ALL EVENTS
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ufc-black to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-ufc-dark-gray">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-full mx-auto mb-4 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-ufc-red/30 transition-all duration-300">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="font-anton text-4xl lg:text-5xl text-white mb-2">{stat.value}</div>
                  <div className="font-oswald text-ufc-metallic tracking-widest text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Fights */}
      <section className="py-20 bg-ufc-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-anton text-5xl lg:text-6xl text-white mb-4 tracking-wider">
              UPCOMING <span className="text-ufc-red">FIGHTS</span>
            </h2>
            <p className="font-oswald text-xl text-ufc-metallic tracking-wide">
              THE BATTLES THAT WILL DEFINE CHAMPIONS
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {(() => {
              const hasUpcoming = upcomingFights && upcomingFights.length > 0;
              if (fightsLoading && !hasUpcoming) {
                return (
                  <>
                    <LoadingCard />
                    <LoadingCard />
                    <div className="lg:col-span-2">
                      <LoadingCard />
                    </div>
                  </>
                );
              }
              if (hasUpcoming) {
                return (
                  <>
                    {upcomingFights.map((fight, index) => (
                      <div key={index} className={`fight-card ufc-glow p-6 lg:p-8 rounded-lg ${fight.mainEvent ? 'lg:col-span-2' : ''}`}>
                        {fight.title && (
                          <div className="text-center mb-6">
                            <span className={`px-4 py-2 font-oswald font-bold text-sm tracking-widest ${
                              fight.mainEvent
                                ? 'bg-ufc-red text-white'
                                : 'bg-gradient-to-r from-ufc-metallic to-ufc-metallic-light text-black'
                            }`}>
                              {fight.title}
                            </span>
                          </div>
                        )}

                        <div className="text-center">
                          <h3 className="font-anton text-2xl lg:text-4xl text-white mb-2 tracking-wider">
                            {fight.fighters}
                          </h3>
                          <p className="font-oswald text-ufc-red text-lg mb-4 tracking-wide">
                            {fight.title}
                          </p>

                          <div className="space-y-2 text-ufc-metallic">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="font-oswald tracking-wide">{fight.date}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="font-oswald tracking-wide">{fight.venue}</span>
                            </div>
                          </div>

                          <Link to={`/event/${fight.id}`} className="mt-6 inline-block bg-transparent border-2 border-ufc-red text-ufc-red hover:bg-ufc-red hover:text-white px-6 py-3 font-oswald font-bold tracking-wider transition-all duration-300">
                            VIEW DETAILS
                          </Link>
                        </div>
                      </div>
                    ))}
                  </>
                );
              }
              if (fightsError) {
                return (
                  <div className="lg:col-span-2 text-center">
                    <div className="fight-card p-8">
                      <h3 className="font-oswald text-xl text-white mb-4 tracking-widest">
                        NO UPCOMING FIGHTS
                      </h3>
                      <p className="text-ufc-metallic font-oswald tracking-wide">
                        Check back soon for the latest fight announcements.
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="lg:col-span-2 text-center">
                  <div className="fight-card p-8">
                    <h3 className="font-oswald text-xl text-white mb-4 tracking-widest">
                      NO UPCOMING FIGHTS
                    </h3>
                    <p className="text-ufc-metallic font-oswald tracking-wide">
                      Check back soon for the latest fight announcements.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Featured Fighters Section */}
      {!fightersLoading && allFighters && allFighters.length > 0 && (
        <section className="py-20 bg-ufc-dark-gray">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-anton text-5xl lg:text-6xl text-white mb-4 tracking-wider">
                FEATURED <span className="text-ufc-red">FIGHTERS</span>
              </h2>
              <p className="font-oswald text-xl text-ufc-metallic tracking-wide">
                TOP PERFORMERS FROM THE OCTAGON
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {allFighters.slice(0, 8).map((fighter, index) => (
                <div key={fighter.id} className="fight-card p-4 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-ufc-red/30 to-ufc-dark-gray rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-ufc-metallic-dark">
                    <span className="font-anton text-xl text-white">
                      {fighter.nickname ? fighter.nickname.charAt(0) : fighter.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-anton text-lg text-white mb-1 tracking-wider">
                    {fighter.name}
                  </h3>
                  {fighter.nickname && (
                    <p className="font-oswald text-ufc-red text-sm mb-2 tracking-wide">
                      "{fighter.nickname}"
                    </p>
                  )}
                  <p className="font-oswald text-ufc-metallic text-xs tracking-wide mb-2">
                    {fighter.weightClass}
                  </p>
                  <p className="font-oswald text-white text-sm">
                    {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-ufc-red via-ufc-red-dark to-ufc-red">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-anton text-5xl lg:text-6xl text-white mb-6 tracking-wider">
              ENTER THE <span className="drop-shadow-lg">OCTAGON</span>
            </h2>
            <p className="font-oswald text-xl lg:text-2xl mb-8 text-white/90 tracking-wide">
              COMPREHENSIVE FIGHT TRACKING • REAL-TIME STATS • FIGHTER ANALYTICS
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-ufc-red hover:bg-ufc-metallic-light hover:text-white px-8 py-4 font-oswald font-bold text-lg tracking-widest transition-all duration-300 border-2 border-white hover:border-ufc-metallic-light">
                START TRACKING
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-ufc-red px-8 py-4 font-oswald font-bold text-lg tracking-widest transition-all duration-300">
                EXPLORE FIGHTERS
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
