import { useState, useEffect } from "react";
import { Search, Users, Trophy, Target, TrendingUp, Zap } from "lucide-react";
import { useAllFighters, useFighterSearch } from "../hooks/useOctagonApi";
import { AppFighter } from "@shared/octagon-api";
import { transformRankDisplay, isChampion } from "../lib/rankUtils";

export default function CompareFighters() {
  const [selectedFighter1, setSelectedFighter1] = useState<AppFighter | null>(null);
  const [selectedFighter2, setSelectedFighter2] = useState<AppFighter | null>(null);
  const [searchTerm1, setSearchTerm1] = useState("");
  const [searchTerm2, setSearchTerm2] = useState("");
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  // Fetch all fighters for initial selection
  const {
    data: allFighters,
    loading: fightersLoading,
    isUsingFallback,
    statusMessage
  } = useAllFighters();
  const { data: searchResults1, search: search1 } = useFighterSearch();
  const { data: searchResults2, search: search2 } = useFighterSearch();

  // Set initial fighters when data loads
  useEffect(() => {
    if (allFighters && allFighters.length >= 2 && !selectedFighter1 && !selectedFighter2) {
      setSelectedFighter1(allFighters[0]);
      setSelectedFighter2(allFighters[1]);
      setSearchTerm1(allFighters[0].name);
      setSearchTerm2(allFighters[1].name);
    }
  }, [allFighters, selectedFighter1, selectedFighter2]);

  // Handle search for fighter 1
  useEffect(() => {
    if (searchTerm1.length > 2) {
      search1(searchTerm1);
    }
  }, [searchTerm1, search1]);

  // Handle search for fighter 2
  useEffect(() => {
    if (searchTerm2.length > 2) {
      search2(searchTerm2);
    }
  }, [searchTerm2, search2]);

  const getFilteredFighters = (searchTerm: string, excludeFighter: AppFighter | null) => {
    const fighters = searchTerm.length > 2 
      ? (searchTerm === searchTerm1 ? searchResults1 : searchResults2)
      : allFighters || [];
    
    return fighters.filter(f => f.id !== excludeFighter?.id);
  };

  const FighterCard = ({ fighter, position }: { fighter: AppFighter | null; position: 'left' | 'right' }) => {
    if (!fighter) return null;

    return (
      <div className="fight-card p-6">
        <div className="text-center mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-ufc-red/30 to-ufc-dark-gray rounded-lg mx-auto mb-4 flex items-center justify-center border-2 border-ufc-metallic-dark">
            <span className="font-anton text-3xl text-white">
              {fighter.nickname ? fighter.nickname.charAt(0) : fighter.name.charAt(0)}
            </span>
          </div>
          <h3 className="font-anton text-2xl text-white mb-2 tracking-wider">
            {fighter.name}
          </h3>
          {fighter.nickname && (
            <p className="font-oswald text-ufc-red text-lg mb-3 tracking-wide">
              "{fighter.nickname}"
            </p>
          )}
          {fighter.rank && (
            <span className={`px-3 py-1 font-oswald font-bold text-sm tracking-widest ${
              isChampion(fighter.rank)
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                : 'bg-ufc-red text-white'
            }`}>
              {transformRankDisplay(fighter.rank)}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-oswald text-white mb-2 tracking-widest">RECORD</h4>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="font-anton text-2xl text-green-500">{fighter.record.wins}</div>
                <div className="font-oswald text-ufc-metallic text-xs">W</div>
              </div>
              <div className="text-center">
                <div className="font-anton text-2xl text-ufc-red">{fighter.record.losses}</div>
                <div className="font-oswald text-ufc-metallic text-xs">L</div>
              </div>
              <div className="text-center">
                <div className="font-anton text-2xl text-ufc-metallic">{fighter.record.draws}</div>
                <div className="font-oswald text-ufc-metallic text-xs">D</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-ufc-metallic font-oswald">Weight Class:</span>
              <span className="text-white font-oswald">{fighter.weightClass}</span>
            </div>
            {fighter.age && (
              <div className="flex justify-between">
                <span className="text-ufc-metallic font-oswald">Age:</span>
                <span className="text-white font-oswald">{fighter.age}</span>
              </div>
            )}
            {fighter.height && (
              <div className="flex justify-between">
                <span className="text-ufc-metallic font-oswald">Height:</span>
                <span className="text-white font-oswald">{fighter.height}</span>
              </div>
            )}
            {fighter.reach && (
              <div className="flex justify-between">
                <span className="text-ufc-metallic font-oswald">Reach:</span>
                <span className="text-white font-oswald">{fighter.reach}</span>
              </div>
            )}
            {fighter.nationality && (
              <div className="flex justify-between">
                <span className="text-ufc-metallic font-oswald">Nationality:</span>
                <span className="text-white font-oswald">{fighter.nationality}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RadarChart = () => {
    if (!selectedFighter1 || !selectedFighter2) return null;

    const stats = [
      { name: 'Striking', key: 'striking' as keyof AppFighter['stats'] },
      { name: 'Grappling', key: 'grappling' as keyof AppFighter['stats'] },
      { name: 'Stamina', key: 'stamina' as keyof AppFighter['stats'] },
      { name: 'Chin', key: 'chin' as keyof AppFighter['stats'] },
      { name: 'Heart', key: 'heart' as keyof AppFighter['stats'] },
      { name: 'Fight IQ', key: 'fightIQ' as keyof AppFighter['stats'] }
    ];

    return (
      <div className="fight-card p-6">
        <h3 className="font-oswald text-xl text-white mb-6 text-center tracking-widest">
          STATS COMPARISON
        </h3>
        <div className="space-y-4">
          {stats.map((stat) => {
            const value1 = selectedFighter1.stats[stat.key];
            const value2 = selectedFighter2.stats[stat.key];
            const winner = value1 > value2 ? 1 : value1 < value2 ? 2 : 0;

            return (
              <div key={stat.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-oswald text-sm tracking-wide ${
                    winner === 1 ? 'text-green-500' : 'text-ufc-metallic'
                  }`}>
                    {value1}%
                  </span>
                  <span className="font-oswald text-white text-sm tracking-wider">
                    {stat.name.toUpperCase()}
                  </span>
                  <span className={`font-oswald text-sm tracking-wide ${
                    winner === 2 ? 'text-green-500' : 'text-ufc-metallic'
                  }`}>
                    {value2}%
                  </span>
                </div>
                <div className="relative h-3 bg-ufc-dark-gray rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 h-full bg-gradient-to-r from-ufc-red to-ufc-red-light"
                    style={{ width: `${(value1 / 100) * 50}%` }}
                  ></div>
                  <div 
                    className="absolute right-0 h-full bg-gradient-to-l from-blue-500 to-blue-400"
                    style={{ width: `${(value2 / 100) * 50}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 text-center">
          <div className="flex justify-center items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-ufc-red to-ufc-red-light rounded"></div>
              <span className="font-oswald text-ufc-metallic text-sm tracking-wide">
                {selectedFighter1.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
              <span className="font-oswald text-ufc-metallic text-sm tracking-wide">
                {selectedFighter2.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FighterSelector = ({ 
    selectedFighter, 
    searchTerm, 
    setSearchTerm, 
    onSelect, 
    showDropdown, 
    setShowDropdown,
    position 
  }: {
    selectedFighter: AppFighter | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSelect: (fighter: AppFighter) => void;
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    position: 'left' | 'right';
  }) => {
    const filteredFighters = getFilteredFighters(searchTerm, position === 'left' ? selectedFighter2 : selectedFighter1);

    return (
      <div className="relative">
        <div className="fight-card p-4 mb-4">
          <h3 className="font-oswald text-lg text-white mb-3 text-center tracking-widest">
            SELECT FIGHTER {position === 'left' ? '1' : '2'}
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search fighters..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-3 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
            />
            <Search className="absolute right-3 top-3 w-5 h-5 text-ufc-metallic" />
          </div>
          
          {showDropdown && filteredFighters.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-ufc-dark-gray border border-ufc-metallic-dark rounded shadow-xl max-h-60 overflow-y-auto">
              {filteredFighters.slice(0, 10).map((fighter) => (
                <button
                  key={fighter.id}
                  onClick={() => {
                    onSelect(fighter);
                    setShowDropdown(false);
                    setSearchTerm(fighter.name);
                  }}
                  className="w-full text-left p-3 hover:bg-ufc-red/20 transition-colors"
                >
                  <div className="font-oswald text-white tracking-wide">
                    {fighter.name} {fighter.nickname && `"${fighter.nickname}"`}
                  </div>
                  <div className="font-oswald text-ufc-metallic text-sm tracking-wide">
                    {fighter.weightClass} • {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (fightersLoading) {
    return (
      <div className="min-h-screen bg-ufc-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 border-4 border-ufc-red border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="font-anton text-3xl text-white mb-4 tracking-wider">
            LOADING <span className="text-ufc-red">FIGHTERS</span>
          </h2>
          <p className="font-oswald text-ufc-metallic tracking-wide">
            Fetching the latest fighter data...
          </p>
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
            COMPARE <span className="text-ufc-red">FIGHTERS</span>
          </h1>
          <p className="font-oswald text-xl text-ufc-metallic tracking-wide">
            ANALYZE HEAD-TO-HEAD FIGHTER STATISTICS
          </p>
          {allFighters && (
            <p className="font-oswald text-sm text-ufc-metallic mt-2 tracking-wide">
              {allFighters.length} fighters available for comparison
            </p>
          )}
        </div>

        {/* Fighter Selectors */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <FighterSelector
            selectedFighter={selectedFighter1}
            searchTerm={searchTerm1}
            setSearchTerm={setSearchTerm1}
            onSelect={setSelectedFighter1}
            showDropdown={showDropdown1}
            setShowDropdown={setShowDropdown1}
            position="left"
          />
          <FighterSelector
            selectedFighter={selectedFighter2}
            searchTerm={searchTerm2}
            setSearchTerm={setSearchTerm2}
            onSelect={setSelectedFighter2}
            showDropdown={showDropdown2}
            setShowDropdown={setShowDropdown2}
            position="right"
          />
        </div>

        {/* Comparison Section */}
        {selectedFighter1 && selectedFighter2 && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Fighter 1 */}
            <FighterCard fighter={selectedFighter1} position="left" />

            {/* VS and Stats */}
            <div className="space-y-8">
              {/* Animated VS */}
              <div className="text-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-ufc-red to-ufc-red-dark rounded-full mx-auto flex items-center justify-center border-4 border-white vs-animation shadow-xl shadow-ufc-red/30">
                    <span className="font-anton text-4xl text-white tracking-widest">VS</span>
                  </div>
                  {/* Multiple glow layers */}
                  <div className="absolute inset-0 w-32 h-32 bg-ufc-red rounded-full mx-auto opacity-20 blur-xl animate-pulse"></div>
                  <div className="absolute inset-2 w-28 h-28 bg-ufc-red rounded-full mx-auto opacity-30 blur-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>

              {/* Radar Chart */}
              <RadarChart />
            </div>

            {/* Fighter 2 */}
            <FighterCard fighter={selectedFighter2} position="right" />
          </div>
        )}

        {/* Quick Stats */}
        {selectedFighter1 && selectedFighter2 && (
          <div className="mt-12 fight-card p-8">
            <h3 className="font-oswald text-xl text-white mb-6 text-center tracking-widest">
              QUICK COMPARISON
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-oswald text-ufc-red mb-3 tracking-widest">EXPERIENCE</h4>
                <div className="flex justify-between">
                  <span className="font-anton text-xl text-white">
                    {selectedFighter1.record.wins + selectedFighter1.record.losses + selectedFighter1.record.draws}
                  </span>
                  <span className="font-oswald text-ufc-metallic">fights</span>
                  <span className="font-anton text-xl text-white">
                    {selectedFighter2.record.wins + selectedFighter2.record.losses + selectedFighter2.record.draws}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-oswald text-ufc-red mb-3 tracking-widest">WIN RATE</h4>
                <div className="flex justify-between">
                  <span className="font-anton text-xl text-white">
                    {Math.round((selectedFighter1.record.wins / Math.max(1, selectedFighter1.record.wins + selectedFighter1.record.losses + selectedFighter1.record.draws)) * 100)}%
                  </span>
                  <span className="font-oswald text-ufc-metallic">wins</span>
                  <span className="font-anton text-xl text-white">
                    {Math.round((selectedFighter2.record.wins / Math.max(1, selectedFighter2.record.wins + selectedFighter2.record.losses + selectedFighter2.record.draws)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-oswald text-ufc-red mb-3 tracking-widest">WEIGHT CLASS</h4>
                <div className="flex justify-between text-center">
                  <span className="font-anton text-sm text-white">{selectedFighter1.weightClass}</span>
                  <span className="font-oswald text-ufc-metallic">vs</span>
                  <span className="font-anton text-sm text-white">{selectedFighter2.weightClass}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
