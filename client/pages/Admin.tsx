import { useState } from "react";
import { Search, Save, Plus, Edit2, ShieldAlert, Award, User, Sparkles } from "lucide-react";
import { useAllFighters } from "../hooks/useOctagonApi";
import { AppFighter } from "@shared/octagon-api";
import { toast } from "sonner";

export default function Admin() {
  const { data: allFighters, loading, refetch } = useAllFighters();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFighter, setSelectedFighter] = useState<AppFighter | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Edit fields
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [rank, setRank] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [reach, setReach] = useState("");
  const [stance, setStance] = useState("");
  const [nationality, setNationality] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);

  // Skills
  const [striking, setStriking] = useState(75);
  const [grappling, setGrappling] = useState(75);
  const [stamina, setStamina] = useState(75);
  const [chin, setChin] = useState(75);
  const [heart, setHeart] = useState(75);
  const [fightIQ, setFightIQ] = useState(75);

  const filteredFighters = allFighters
    ? allFighters.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.nickname && f.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleSelectFighter = (fighter: AppFighter) => {
    setSelectedFighter(fighter);
    setIsCreatingNew(false);
    
    setName(fighter.name);
    setNickname(fighter.nickname || "");
    setWeightClass(fighter.weightClass);
    setRank(fighter.rank || "Unranked");
    setAge(String(fighter.age || ""));
    setHeight(fighter.height || "");
    setReach(fighter.reach || "");
    setStance(fighter.stance || "Orthodox");
    setNationality(fighter.nationality || "");
    setImageUrl(fighter.imageUrl || "");
    setWins(fighter.record.wins);
    setLosses(fighter.record.losses);
    setDraws(fighter.record.draws);

    setStriking(fighter.stats?.striking ?? 75);
    setGrappling(fighter.stats?.grappling ?? 75);
    setStamina(fighter.stats?.stamina ?? 75);
    setChin(fighter.stats?.chin ?? 75);
    setHeart(fighter.stats?.heart ?? 75);
    setFightIQ(fighter.stats?.fightIQ ?? 75);
  };

  const handleStartNew = () => {
    setSelectedFighter(null);
    setIsCreatingNew(true);

    setName("");
    setNickname("");
    setWeightClass("Lightweight");
    setRank("Unranked");
    setAge("25");
    setHeight("5'10\"");
    setReach('70"');
    setStance("Orthodox");
    setNationality("");
    setImageUrl("");
    setWins(0);
    setLosses(0);
    setDraws(0);

    setStriking(75);
    setGrappling(75);
    setStamina(75);
    setChin(75);
    setHeart(75);
    setFightIQ(75);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Fighter name is required");
      return;
    }

    const payload = {
      name: name.toUpperCase(),
      nickname,
      weightClass,
      rank,
      age: parseInt(age, 10) || 25,
      height,
      reach,
      stance,
      nationality,
      imageUrl: imageUrl || undefined,
      record: { wins, losses, draws },
      stats: { striking, grappling, stamina, chin, heart, fightIQ }
    };

    try {
      const url = isCreatingNew 
        ? "/api/fighter/custom" 
        : `/api/fighter/${selectedFighter?.id}/override`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to save changes");
      
      toast.success(isCreatingNew ? "Custom fighter created!" : "Fighter overrides saved successfully!");
      
      // Clear selection and refresh list
      setSelectedFighter(null);
      setIsCreatingNew(false);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Error saving fighter data. Check server logs.");
    }
  };

  return (
    <div className="min-h-screen bg-ufc-black text-white relative">
      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 bg-repeat"
        style={{
          backgroundImage: `
            linear-gradient(rgba(229,9,20,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(229,9,20,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      ></div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-anton text-5xl lg:text-7xl text-white mb-4 tracking-wider flex items-center justify-center gap-3">
            DATABASE <span className="text-ufc-red">EDITOR</span>
          </h1>
          <p className="font-oswald text-lg text-ufc-metallic tracking-wide uppercase">
            Manage Weight Classes, Champions, Fight Records, and Skill Ratings in Real-Time
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Roster Selection Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="fight-card p-6 flex flex-col h-[650px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-anton text-2xl tracking-wider text-white">
                  ROSTER ({filteredFighters.length})
                </h2>
                <button
                  onClick={handleStartNew}
                  className="bg-ufc-red hover:bg-ufc-red-dark text-white px-3 py-1.5 rounded flex items-center gap-1 font-oswald text-sm font-bold tracking-wider transition-colors"
                >
                  <Plus className="w-4 h-4" /> ADD NEW
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search roster..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-3 pl-10 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                />
                <Search className="absolute left-3 top-3 w-5 h-5 text-ufc-metallic" />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-2 border-ufc-red border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredFighters.length === 0 ? (
                  <div className="text-center text-ufc-metallic py-10 font-oswald">
                    No fighters found
                  </div>
                ) : (
                  filteredFighters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSelectFighter(f)}
                      className={`w-full text-left p-3 rounded border transition-all flex items-center justify-between ${
                        selectedFighter?.id === f.id
                          ? "bg-ufc-red/25 border-ufc-red text-white"
                          : "bg-ufc-dark-gray/30 border-ufc-metallic-dark hover:border-ufc-metallic hover:bg-ufc-dark-gray/50"
                      }`}
                    >
                      <div>
                        <div className="font-anton text-sm tracking-wide">{f.name}</div>
                        <div className="font-oswald text-xs text-ufc-metallic">
                          {f.weightClass} • {f.rank}
                        </div>
                      </div>
                      <Edit2 className="w-4 h-4 text-ufc-metallic opacity-0 group-hover:opacity-100" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Edit Form Panel */}
          <div className="lg:col-span-8">
            {!selectedFighter && !isCreatingNew ? (
              <div className="fight-card p-12 text-center h-[650px] flex flex-col items-center justify-center border-dashed border-ufc-metallic-dark">
                <ShieldAlert className="w-16 h-16 text-ufc-metallic mb-6 animate-pulse" />
                <h3 className="font-anton text-3xl text-white mb-4 tracking-wider">
                  NO FIGHTER SELECTED
                </h3>
                <p className="font-oswald text-ufc-metallic max-w-md mx-auto leading-relaxed">
                  Select an existing fighter from the roster sidebar to adjust their rankings, divisions, or stats, or click the <strong>Add New</strong> button to register a custom athlete.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="fight-card p-6 space-y-6 overflow-y-auto max-h-[650px]">
                <div className="flex justify-between items-center border-b border-ufc-metallic-dark pb-4">
                  <h2 className="font-anton text-3xl tracking-wider text-white flex items-center gap-2">
                    <User className="w-6 h-6 text-ufc-red" />
                    {isCreatingNew ? "NEW CUSTOM FIGHTER" : `EDIT: ${name}`}
                  </h2>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded flex items-center gap-2 font-oswald font-bold tracking-wider transition-colors border border-green-500 hover:border-white shadow-lg shadow-green-600/20"
                  >
                    <Save className="w-5 h-5" /> SAVE CHANGES
                  </button>
                </div>

                {/* Grid Inputs */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Athlete Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. DUSTIN POIRIER"
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. The Diamond"
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Weight Class */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Weight Class (Division)
                    </label>
                    <select
                      value={weightClass}
                      onChange={(e) => setWeightClass(e.target.value)}
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    >
                      <option value="Flyweight">Flyweight</option>
                      <option value="Bantamweight">Bantamweight</option>
                      <option value="Featherweight">Featherweight</option>
                      <option value="Lightweight">Lightweight</option>
                      <option value="Welterweight">Welterweight</option>
                      <option value="Middleweight">Middleweight</option>
                      <option value="Light Heavyweight">Light Heavyweight</option>
                      <option value="Heavyweight">Heavyweight</option>
                      <option value="Women's Strawweight">Women's Strawweight</option>
                      <option value="Women's Flyweight">Women's Flyweight</option>
                      <option value="Women's Bantamweight">Women's Bantamweight</option>
                    </select>
                  </div>

                  {/* Rank */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Award className="w-4 h-4 text-ufc-red" /> UFC Rank / Status
                    </label>
                    <input
                      type="text"
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                      placeholder="e.g. #1 (Champion), #2, Legend, etc."
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Height
                    </label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 5ft 9in"
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Reach */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Reach
                    </label>
                    <input
                      type="text"
                      value={reach}
                      onChange={(e) => setReach(e.target.value)}
                      placeholder="e.g. 72 inches"
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Stance */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Stance
                    </label>
                    <select
                      value={stance}
                      onChange={(e) => setStance(e.target.value)}
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    >
                      <option value="Orthodox">Orthodox</option>
                      <option value="Southpaw">Southpaw</option>
                      <option value="Switch">Switch</option>
                      <option value="Karate">Karate</option>
                    </select>
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g. USA, Dagestan, Brazil"
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block font-oswald text-sm text-ufc-metallic mb-1.5 uppercase tracking-wide">
                      Custom Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="e.g. https://domain.com/pic.jpg"
                      className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2.5 font-oswald tracking-wide focus:outline-none focus:border-ufc-red"
                    />
                  </div>
                </div>

                {/* Record Fields */}
                <div className="bg-ufc-dark-gray/10 p-4 border border-ufc-metallic-dark rounded-lg">
                  <h3 className="font-anton text-lg mb-3 uppercase tracking-wider text-ufc-red">
                    FIGHT RECORD
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-oswald text-xs text-ufc-metallic mb-1 uppercase tracking-wide">
                        Wins
                      </label>
                      <input
                        type="number"
                        value={wins}
                        onChange={(e) => setWins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2 font-oswald text-center focus:outline-none focus:border-ufc-red"
                      />
                    </div>
                    <div>
                      <label className="block font-oswald text-xs text-ufc-metallic mb-1 uppercase tracking-wide">
                        Losses
                      </label>
                      <input
                        type="number"
                        value={losses}
                        onChange={(e) => setLosses(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2 font-oswald text-center focus:outline-none focus:border-ufc-red"
                      />
                    </div>
                    <div>
                      <label className="block font-oswald text-xs text-ufc-metallic mb-1 uppercase tracking-wide">
                        Draws
                      </label>
                      <input
                        type="number"
                        value={draws}
                        onChange={(e) => setDraws(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-ufc-black text-white border border-ufc-metallic-dark rounded p-2 font-oswald text-center focus:outline-none focus:border-ufc-red"
                      />
                    </div>
                  </div>
                </div>

                {/* Ratings section */}
                <div>
                  <h3 className="font-anton text-lg mb-4 uppercase tracking-wider text-ufc-red flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-spin-slow" /> SKILL RATINGS (0 - 100)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Striking */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-oswald text-sm">
                        <span className="text-white">Striking</span>
                        <span className="text-ufc-red font-bold">{striking}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={striking}
                        onChange={(e) => setStriking(parseInt(e.target.value, 10))}
                        className="w-full accent-ufc-red cursor-pointer"
                      />
                    </div>

                    {/* Grappling */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-oswald text-sm">
                        <span className="text-white">Grappling</span>
                        <span className="text-ufc-red font-bold">{grappling}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={grappling}
                        onChange={(e) => setGrappling(parseInt(e.target.value, 10))}
                        className="w-full accent-ufc-red cursor-pointer"
                      />
                    </div>

                    {/* Stamina */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-oswald text-sm">
                        <span className="text-white">Stamina</span>
                        <span className="text-ufc-red font-bold">{stamina}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={stamina}
                        onChange={(e) => setStamina(parseInt(e.target.value, 10))}
                        className="w-full accent-ufc-red cursor-pointer"
                      />
                    </div>

                    {/* Chin */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-oswald text-sm">
                        <span className="text-white">Chin</span>
                        <span className="text-ufc-red font-bold">{chin}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={chin}
                        onChange={(e) => setChin(parseInt(e.target.value, 10))}
                        className="w-full accent-ufc-red cursor-pointer"
                      />
                    </div>

                    {/* Heart */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-oswald text-sm">
                        <span className="text-white">Heart</span>
                        <span className="text-ufc-red font-bold">{heart}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={heart}
                        onChange={(e) => setHeart(parseInt(e.target.value, 10))}
                        className="w-full accent-ufc-red cursor-pointer"
                      />
                    </div>

                    {/* Fight IQ */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between font-oswald text-sm">
                        <span className="text-white">Fight IQ</span>
                        <span className="text-ufc-red font-bold">{fightIQ}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={fightIQ}
                        onChange={(e) => setFightIQ(parseInt(e.target.value, 10))}
                        className="w-full accent-ufc-red cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
