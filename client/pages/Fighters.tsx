import { useState, useMemo } from "react";
import { Search, Filter, Users, Trophy, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useFighterImage } from "../hooks/useImage";
import { useAllFighters } from "../hooks/useOctagonApi";
import { AppFighter } from "@shared/octagon-api";
import { transformRankDisplay, isChampion } from "../lib/rankUtils";

export default function Fighters() {
  const {
    data: allFighters,
    loading,
    error,
    refetch,
    isUsingFallback,
    statusMessage
  } = useAllFighters();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeightClass, setSelectedWeightClass] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Get unique weight classes
  const weightClasses = useMemo(() => {
    if (!allFighters) return [];
    const classes = [...new Set(allFighters.map(f => f.weightClass))];
    return classes.sort();
  }, [allFighters]);

  // Filter and sort fighters
  const filteredFighters = useMemo(() => {
    if (!allFighters) return [];

    let filtered = allFighters.filter(fighter => {
      const matchesSearch = 
        fighter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fighter.nickname && fighter.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesWeightClass = 
        selectedWeightClass === "all" || 
        fighter.weightClass.toLowerCase() === selectedWeightClass.toLowerCase();

      return matchesSearch && matchesWeightClass;
    });

    // Sort fighters
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "wins":
          return b.record.wins - a.record.wins;
        case "winRate":
          const aRate = a.record.wins / Math.max(1, a.record.wins + a.record.losses + a.record.draws);
          const bRate = b.record.wins / Math.max(1, b.record.wins + b.record.losses + b.record.draws);
          return bRate - aRate;
        case "weightClass":
          return a.weightClass.localeCompare(b.weightClass);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allFighters, searchTerm, selectedWeightClass, sortBy]);

  const FighterCard = ({ fighter }: { fighter: AppFighter }) => {
    const totalFights = fighter.record.wins + fighter.record.losses + fighter.record.draws;
    const winRate = totalFights > 0 ? Math.round((fighter.record.wins / totalFights) * 100) : 0;
    const { url } = useFighterImage(fighter.name);
    const img = fighter.imageUrl || url;

    return (
      <Link to={`/fighter/${fighter.id}`} className="block">
        <div className="fight-card ufc-glow p-6 h-full hover:scale-105 transition-all duration-300">
          <div className="text-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-ufc-red/30 to-ufc-dark-gray rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-ufc-metallic-dark overflow-hidden">
              {img ? (
                <img
                  src={img}
                  alt={fighter.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`font-anton text-2xl text-white ${img ? 'hidden' : ''}`}>
                {fighter.nickname ? fighter.nickname.charAt(0) : fighter.name.charAt(0)}
              </span>
            </div>

            {fighter.rank && (
              <div className="mb-2">
                <span className={`px-2 py-1 font-oswald font-bold text-xs tracking-widest ${
                  isChampion(fighter.rank)
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                    : 'bg-ufc-red text-white'
                }`}>
                  {transformRankDisplay(fighter.rank)}
                </span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h3 className="font-anton text-xl text-white mb-1 tracking-wider">
              {fighter.name}
            </h3>
            {fighter.nickname && (
              <p className="font-oswald text-ufc-red text-sm mb-3 tracking-wide">
                "{fighter.nickname}"
              </p>
            )}
            
            <p className="font-oswald text-ufc-metallic text-sm mb-3 tracking-wide">
              {fighter.weightClass}
            </p>

            {/* Record */}
            <div className="flex justify-center gap-3 mb-3">
              <div className="text-center">
                <div className="font-anton text-lg text-green-500">{fighter.record.wins}</div>
                <div className="font-oswald text-ufc-metallic text-xs">W</div>
              </div>
              <div className="text-center">
                <div className="font-anton text-lg text-ufc-red">{fighter.record.losses}</div>
                <div className="font-oswald text-ufc-metallic text-xs">L</div>
              </div>
              <div className="text-center">
                <div className="font-anton text-lg text-ufc-metallic">{fighter.record.draws}</div>
                <div className="font-oswald text-ufc-metallic text-xs">D</div>
              </div>
            </div>

            <div className="text-center">
              <span className="font-oswald text-white text-sm">
                {winRate}% Win Rate
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ufc-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="font-anton text-5xl lg:text-7xl text-white mb-6 tracking-wider">
              LOADING <span className="text-ufc-red">FIGHTERS</span>
            </h1>
            <div className="w-32 h-32 border-4 border-ufc-red border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ufc-black flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-ufc-metallic shadow-xl shadow-ufc-red/20">
            <Target className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="font-anton text-4xl text-white mb-4 tracking-wider">
            UNABLE TO LOAD FIGHTERS
          </h1>
          <p className="font-oswald text-xl text-ufc-metallic-light mb-8 leading-relaxed tracking-wide">
            {error}
          </p>
          
          <button 
            onClick={refetch}
            className="bg-ufc-red hover:bg-ufc-red-dark text-white px-8 py-4 font-oswald font-bold tracking-widest transition-all duration-300 hover:shadow-xl hover:shadow-ufc-red/30 border border-ufc-red hover:border-white"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-anton text-5xl lg:text-7xl text-white mb-6 tracking-wider">
            ALL <span className="text-ufc-red">FIGHTERS</span>
          </h1>
          <p className="font-oswald text-xl text-ufc-metallic tracking-wide">
            EXPLORE THE COMPLETE ROSTER OF MMA ATHLETES
          </p>
          {allFighters && (
            <p className="font-oswald text-sm text-ufc-metallic mt-2 tracking-wide">
              {filteredFighters.length} of {allFighters.length} fighters shown
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="fight-card p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-3 pl-10 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
              />
              <Search className="absolute left-3 top-3 w-5 h-5 text-ufc-metallic" />
            </div>

            {/* Weight Class Filter */}
            <div className="relative">
              <select
                value={selectedWeightClass}
                onChange={(e) => setSelectedWeightClass(e.target.value)}
                className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-3 font-oswald tracking-wide focus:outline-none focus:border-ufc-red appearance-none"
              >
                <option value="all">All Weight Classes</option>
                {weightClasses.map(weightClass => (
                  <option key={weightClass} value={weightClass}>
                    {weightClass}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-3 w-5 h-5 text-ufc-metallic pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-3 font-oswald tracking-wide focus:outline-none focus:border-ufc-red appearance-none"
              >
                <option value="name">Sort by Name</option>
                <option value="wins">Sort by Wins</option>
                <option value="winRate">Sort by Win Rate</option>
                <option value="weightClass">Sort by Weight Class</option>
              </select>
              <Users className="absolute right-3 top-3 w-5 h-5 text-ufc-metallic pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Fighters Grid */}
        {filteredFighters.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFighters.map((fighter) => (
              <FighterCard key={fighter.id} fighter={fighter} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="fight-card p-8 max-w-md mx-auto">
              <Users className="w-16 h-16 text-ufc-red mx-auto mb-4" />
              <h3 className="font-oswald text-xl text-white mb-4 tracking-widest">
                NO FIGHTERS FOUND
              </h3>
              <p className="text-ufc-metallic font-oswald tracking-wide">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {allFighters && allFighters.length > 0 && (
          <div className="mt-16 fight-card p-8">
            <h2 className="font-anton text-3xl text-white mb-6 text-center tracking-wider">
              FIGHTER <span className="text-ufc-red">STATISTICS</span>
            </h2>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="font-anton text-3xl text-ufc-red mb-2">{allFighters.length}</div>
                <div className="font-oswald text-ufc-metallic tracking-wide">TOTAL FIGHTERS</div>
              </div>
              <div>
                <div className="font-anton text-3xl text-ufc-red mb-2">{weightClasses.length}</div>
                <div className="font-oswald text-ufc-metallic tracking-wide">WEIGHT CLASSES</div>
              </div>
              <div>
                <div className="font-anton text-3xl text-ufc-red mb-2">
                  {allFighters.filter(f => isChampion(f.rank)).length}
                </div>
                <div className="font-oswald text-ufc-metallic tracking-wide">CHAMPIONS</div>
              </div>
              <div>
                <div className="font-anton text-3xl text-ufc-red mb-2">
                  {Math.round(allFighters.reduce((sum, f) => sum + f.record.wins, 0) / allFighters.length)}
                </div>
                <div className="font-oswald text-ufc-metallic tracking-wide">AVG WINS</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
