import { useState, useEffect } from "react";
import { ArrowLeft, Trophy, Target, Clock, MapPin, Users, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useFighter, useAllFighters } from "../hooks/useOctagonApi";
import { AppFighter } from "@shared/octagon-api";
import { transformRankDisplay, isChampion } from "../lib/rankUtils";
import { useFighterImage } from "../hooks/useImage";

export default function FighterProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'highlights'>('stats');
  
  // Fetch specific fighter or use first fighter if no ID
  const { data: allFighters, loading: allLoading } = useAllFighters();
  const { data: specificFighter, loading: fighterLoading, error } = useFighter(id || null);
  
  // Use specific fighter if available, otherwise use first from all fighters
  const fighter = specificFighter || (allFighters && allFighters.length > 0 ? allFighters[0] : null);
  const isLoading = id ? fighterLoading : allLoading;
  const imgUrl = fighter ? (fighter.imageUrl || useFighterImage(fighter.name).url) : null;

  // Generate mock timeline based on fighter's record
  const generateTimeline = (fighter: AppFighter) => {
    const timeline = [];
    const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    // Generate last 5 fights
    for (let i = 0; i < Math.min(5, totalFights); i++) {
      const isWin = Math.random() < (fighter.record.wins / totalFights);
      const date = new Date();
      date.setMonth(date.getMonth() - (i * 3));
      
      const methods = isWin 
        ? ['Decision (Unanimous)', 'Submission (RNC)', 'KO/TKO', 'Decision (Split)', 'Submission (Armbar)']
        : ['Decision (Unanimous)', 'Decision (Split)', 'Submission (RNC)', 'KO/TKO'];
      
      timeline.push({
        date: `${months[date.getMonth()]} ${date.getFullYear()}`,
        event: `UFC ${250 + i}`,
        opponent: `Fighter ${String.fromCharCode(65 + i)}`,
        result: isWin ? 'WIN' : 'LOSS',
        method: methods[Math.floor(Math.random() * methods.length)],
        round: Math.floor(Math.random() * 5) + 1,
        time: `${Math.floor(Math.random() * 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
      });
    }
    
    return timeline;
  };

  const StatBar = ({ stat, value }: { stat: string; value: number }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="font-oswald text-white tracking-wide">{stat}</span>
        <span className="font-anton text-ufc-red text-xl">{value}%</span>
      </div>
      <div className="h-3 bg-ufc-dark-gray rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-ufc-red to-ufc-red-light rounded-full transition-all duration-1000"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'stats' as const, label: 'STATS', icon: TrendingUp },
    { id: 'timeline' as const, label: 'CAREER', icon: Clock },
    { id: 'highlights' as const, label: 'HIGHLIGHTS', icon: Award }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ufc-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-ufc-red border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="font-anton text-3xl text-white mb-4 tracking-wider">
            LOADING <span className="text-ufc-red">FIGHTER</span>
          </h2>
          <p className="font-oswald text-ufc-metallic tracking-wide">
            Fetching fighter data from the octagon...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ufc-black flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-ufc-metallic shadow-xl shadow-ufc-red/20">
            <AlertTriangle className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="font-anton text-4xl text-white mb-4 tracking-wider">
            FIGHTER NOT FOUND
          </h1>
          <p className="font-oswald text-xl text-ufc-metallic-light mb-8 leading-relaxed tracking-wide">
            The fighter you're looking for couldn't be found in our database.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/fighters" 
              className="inline-flex items-center gap-3 bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold tracking-widest transition-all duration-300 hover:shadow-xl hover:shadow-ufc-red/30 border border-ufc-red hover:border-white"
            >
              <ArrowLeft className="w-5 h-5" />
              BROWSE FIGHTERS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!fighter) {
    return (
      <div className="min-h-screen bg-ufc-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-anton text-3xl text-white mb-4 tracking-wider">
            NO <span className="text-ufc-red">FIGHTERS</span> AVAILABLE
          </h2>
          <p className="font-oswald text-ufc-metallic tracking-wide">
            Unable to load fighter data at this time.
          </p>
        </div>
      </div>
    );
  }

  const timeline = generateTimeline(fighter);

  return (
    <div className="min-h-screen bg-ufc-black">
      {/* Background Pattern */}
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
        {/* Back Button */}
        <Link 
          to="/fighters"
          className="inline-flex items-center gap-3 text-ufc-metallic hover:text-white mb-8 font-oswald tracking-wide transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          BACK TO FIGHTERS
        </Link>

        {/* Fighter Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Fighter Image */}
          <div className="lg:col-span-1">
            <div className="relative">
              <div className="w-full h-96 lg:h-[500px] bg-gradient-to-br from-ufc-red/20 to-ufc-dark-gray rounded-lg overflow-hidden fight-card">
                {/* Use fighter image if available, otherwise show initials */}
                {imgUrl ? (
                  <img
                    src={imgUrl as string}
                    alt={fighter.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center text-6xl font-anton text-white ${imgUrl ? 'hidden' : ''}`}>
                  {fighter.nickname ? fighter.nickname.charAt(0) : fighter.name.charAt(0)}
                </div>
              </div>
              {fighter.rank && isChampion(fighter.rank) && (
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black p-3 rounded-full shadow-xl">
                  <Trophy className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          {/* Fighter Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              {fighter.rank && isChampion(fighter.rank) && (
                <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 font-oswald font-bold tracking-widest mb-4">
                  {fighter.weightClass.toUpperCase()} CHAMPION
                </div>
              )}
              <h1 className="font-anton text-5xl lg:text-7xl text-white mb-2 tracking-wider">
                {fighter.name}
              </h1>
              {fighter.nickname && (
                <p className="font-oswald text-2xl lg:text-3xl text-ufc-red mb-4 tracking-wide">
                  "{fighter.nickname}"
                </p>
              )}
              <p className="font-oswald text-xl text-ufc-metallic tracking-wide">
                {fighter.rank && `${transformRankDisplay(fighter.rank)} `}{fighter.weightClass}
              </p>
            </div>

            {/* Record */}
            <div className="fight-card p-6 mb-8">
              <h3 className="font-oswald text-xl text-white mb-4 tracking-widest">RECORD</h3>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="font-anton text-4xl text-green-500 mb-1">{fighter.record.wins}</div>
                  <div className="font-oswald text-ufc-metallic tracking-wide">WINS</div>
                </div>
                <div className="text-center">
                  <div className="font-anton text-4xl text-ufc-red mb-1">{fighter.record.losses}</div>
                  <div className="font-oswald text-ufc-metallic tracking-wide">LOSSES</div>
                </div>
                <div className="text-center">
                  <div className="font-anton text-4xl text-ufc-metallic mb-1">{fighter.record.draws}</div>
                  <div className="font-oswald text-ufc-metallic tracking-wide">DRAWS</div>
                </div>
              </div>
            </div>

            {/* Bio Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "AGE", value: fighter.age || "N/A" },
                { label: "HEIGHT", value: fighter.height || "N/A" },
                { label: "REACH", value: fighter.reach || "N/A" },
                { label: "NATIONALITY", value: fighter.nationality || "N/A" }
              ].map((stat) => (
                <div key={stat.label} className="bg-ufc-dark-gray p-4 rounded border border-ufc-metallic-dark">
                  <div className="font-anton text-2xl text-ufc-red mb-1">{stat.value}</div>
                  <div className="font-oswald text-ufc-metallic text-sm tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-ufc-metallic-dark mb-8">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-oswald font-bold tracking-wider transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-ufc-red text-white border-b-2 border-white"
                      : "text-ufc-metallic hover:text-white hover:bg-ufc-red/20"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {activeTab === 'stats' && (
            <>
              <div className="fight-card p-6">
                <h3 className="font-oswald text-xl text-white mb-6 tracking-widest">FIGHTING STATS</h3>
                <StatBar stat="Striking Accuracy" value={fighter.stats.striking} />
                <StatBar stat="Grappling" value={fighter.stats.grappling} />
                <StatBar stat="Stamina" value={fighter.stats.stamina} />
                <StatBar stat="Chin" value={fighter.stats.chin} />
                <StatBar stat="Heart" value={fighter.stats.heart} />
                <StatBar stat="Fight IQ" value={fighter.stats.fightIQ} />
              </div>
              <div className="fight-card p-6">
                <h3 className="font-oswald text-xl text-white mb-6 tracking-widest">FIGHTER INFO</h3>
                <div className="space-y-4">
                  {fighter.stance && (
                    <div className="flex justify-between">
                      <span className="text-ufc-metallic font-oswald tracking-wide">Stance:</span>
                      <span className="text-white font-oswald">{fighter.stance}</span>
                    </div>
                  )}
                  {fighter.nationality && (
                    <div className="flex justify-between">
                      <span className="text-ufc-metallic font-oswald tracking-wide">Nationality:</span>
                      <span className="text-white font-oswald">{fighter.nationality}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ufc-metallic font-oswald tracking-wide">Weight Class:</span>
                    <span className="text-white font-oswald">{fighter.weightClass}</span>
                  </div>
                  <div className="border-t border-ufc-metallic-dark pt-4 mt-6">
                    <h4 className="text-ufc-red font-oswald font-bold tracking-wide mb-3">ACHIEVEMENTS</h4>
                    <ul className="space-y-2 text-ufc-metallic font-oswald tracking-wide">
                      {fighter.rank && isChampion(fighter.rank) && (
                        <li>• {fighter.weightClass} Champion</li>
                      )}
                      <li>• Professional MMA Fighter</li>
                      <li>• {fighter.record.wins} Career Victories</li>
                      {fighter.record.wins > 10 && <li>• Veteran Fighter (10+ Wins)</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'timeline' && (
            <div className="lg:col-span-2">
              <div className="fight-card p-6">
                <h3 className="font-oswald text-xl text-white mb-6 tracking-widest">FIGHT HISTORY</h3>
                <div className="space-y-6">
                  {timeline.map((fight, index) => (
                    <div key={index} className="border-l-4 border-ufc-red pl-6 pb-6 last:pb-0">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2">
                        <div>
                          <h4 className="font-oswald text-lg text-white tracking-wide">
                            vs {fight.opponent}
                          </h4>
                          <p className="text-ufc-metallic font-oswald tracking-wide">
                            {fight.event} • {fight.date}
                          </p>
                        </div>
                        <div className={`inline-block px-3 py-1 font-oswald font-bold text-sm tracking-widest ${
                          fight.result === 'WIN' ? 'bg-green-600 text-white' : 'bg-ufc-red text-white'
                        }`}>
                          {fight.result}
                        </div>
                      </div>
                      <p className="text-ufc-metallic font-oswald tracking-wide">
                        {fight.method} • Round {fight.round} • {fight.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'highlights' && (
            <div className="lg:col-span-2">
              <div className="fight-card p-6 text-center">
                <Award className="w-16 h-16 text-ufc-red mx-auto mb-4" />
                <h3 className="font-oswald text-xl text-white mb-4 tracking-widest">HIGHLIGHTS COMING SOON</h3>
                <p className="text-ufc-metallic font-oswald tracking-wide">
                  Video highlights and performance reels will be available in future updates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
