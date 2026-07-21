import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search, Save, Plus, ShieldAlert, Award, User, Sparkles,
  Trash2, RotateCcw, X, AlertTriangle, LogIn,
  Users, Database, Weight, Globe,
  RefreshCw, Crown, Swords, ArrowLeft, ChevronRight,
  Shield, Zap, BarChart2, Edit3, CheckCircle, Circle,
} from "lucide-react";
import { useAllFighters } from "../hooks/useOctagonApi";
import { AppFighter } from "@shared/octagon-api";
import { getMe, readToken } from "@/services/auth";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminSection = "dashboard" | "fighters" | "divisions" | "users";
type FilterType   = "all" | "custom" | "base";

interface AdminStats {
  totalFighters: number; baseFighters: number; customFighters: number;
  overrideCount: number; totalUsers: number; totalDivisions: number;
  divisions: { name: string; count: number }[];
  topNationalities: { name: string; count: number }[];
  serverTime: string;
}
interface AdminUser {
  id: string; email: string; isAdmin: boolean; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isCustomFighter = (f: AppFighter) => f.id.startsWith("custom_");
function authHeaders(): HeadersInit {
  const t = readToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
           : { "Content-Type": "application/json" };
}
const WC = [
  "Flyweight","Bantamweight","Featherweight","Lightweight","Welterweight",
  "Middleweight","Light Heavyweight","Heavyweight",
  "Women's Strawweight","Women's Flyweight","Women's Bantamweight",
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV: { id: AdminSection; label: string; icon: any }[] = [
  { id:"dashboard", label:"Dashboard",       icon:BarChart2 },
  { id:"fighters",  label:"Fighter Dat...",  icon:Database  },
  { id:"divisions", label:"Divisions",       icon:Weight    },
  { id:"users",     label:"Users",           icon:Users     },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardSection({ stats, loading, onRefresh }: {
  stats: AdminStats | null; loading: boolean; onRefresh: () => void;
}) {
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#e5091400] border-t-[#e50914] rounded-full animate-spin" />
    </div>
  );
  if (!stats) return null;

  const STAT_CARDS = [
    { label:"TOTAL FIGHTERS",   value:stats.totalFighters, sub:`${stats.baseFighters} base`,      icon:Swords,    accent:"#e50914" },
    { label:"CUSTOM FIGHTERS",  value:stats.customFighters, sub:"admin-created",                  icon:Plus,      accent:"#7c5cfc" },
    { label:"OVERRIDES ACTIVE", value:stats.overrideCount, sub:"manual edits",                    icon:Zap,       accent:"#f59e0b" },
    { label:"REGISTERED USERS", value:stats.totalUsers,    sub:"all accounts",                    icon:Users,     accent:"#10b981" },
    { label:"DIVISIONS",        value:stats.totalDivisions, sub:"weight classes",                 icon:Weight,    accent:"#06b6d4" },
  ];

  const maxDiv = Math.max(...stats.divisions.map(d => d.count), 1);
  const maxNat = Math.max(...stats.topNationalities.map(n => n.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[32px] border border-[#1b1b1b] bg-[#0f0f0f] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
          <div className="flex flex-col gap-4 lg:gap-6">
            <div>
              <p className="font-oswald text-[10px] uppercase tracking-[0.35em] text-[#777] mb-3">Executive summary</p>
              <h2 className="font-anton text-5xl tracking-[0.03em] text-white">Welcome back, Commander</h2>
              <p className="mt-3 max-w-2xl text-sm text-[#aaa] leading-7">This is your control room. Track roster health, manage custom fighters, and keep your championship pipeline locked in.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[#1b1b1b] bg-[#111] p-6">
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#666]">Total roster</p>
                <p className="font-anton text-4xl text-white mt-4">{stats.totalFighters}</p>
                <p className="mt-2 text-sm text-[#777]">{stats.baseFighters} base + {stats.customFighters} custom fighters</p>
              </div>
              <div className="rounded-3xl border border-[#1b1b1b] bg-[#111] p-6">
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#666]">Live status</p>
                <p className="font-anton text-4xl text-[#e50914] mt-4">{stats.overrideCount}</p>
                <p className="mt-2 text-sm text-[#777]">manual overrides currently active</p>
              </div>
              <div className="rounded-3xl border border-[#1b1b1b] bg-[#111] p-6">
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#666]">Divisions</p>
                <p className="font-anton text-4xl text-white mt-4">{stats.totalDivisions}</p>
                <p className="mt-2 text-sm text-[#777]">weight classes in the tracker</p>
              </div>
              <div className="rounded-3xl border border-[#1b1b1b] bg-[#111] p-6">
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#666]">Admins</p>
                <p className="font-anton text-4xl text-[#10b981] mt-4">{stats.totalUsers}</p>
                <p className="mt-2 text-sm text-[#777]">registered accounts including admins</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-[#1b1b1b] bg-[#111] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#777]">Quick view</p>
                <h3 className="mt-3 font-anton text-3xl text-white tracking-[0.03em]">Ready for dispatch</h3>
              </div>
              <div className="rounded-full border border-[#333] bg-[#080808] px-3 py-1 text-xs uppercase tracking-[0.3em] text-[#e50914]">Live</div>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="rounded-3xl border border-[#1b1b1b] bg-[#0b0b0b] p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#666]">Most active division</p>
                <p className="mt-3 font-oswald text-2xl text-white">{stats.divisions[0]?.name || "—"}</p>
                <p className="mt-1 text-sm text-[#777]">{stats.divisions[0]?.count || 0} fighters</p>
              </div>
              <div className="rounded-3xl border border-[#1b1b1b] bg-[#0b0b0b] p-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#666]">Top nation</p>
                <p className="mt-3 font-oswald text-2xl text-white">{stats.topNationalities[0]?.name || "—"}</p>
                <p className="mt-1 text-sm text-[#777]">{stats.topNationalities[0]?.count || 0} fighters</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#1b1b1b] bg-[#111] p-6">
            <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#777]">Last update</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-anton text-3xl text-white">{stats.serverTime ? new Date(stats.serverTime).toLocaleTimeString() : "—"}</p>
                <p className="mt-1 text-sm text-[#777]">Server time</p>
              </div>
              <button onClick={onRefresh} className="rounded-3xl border border-[#222] bg-[#080808] px-4 py-3 text-sm text-[#fff] hover:border-[#444] hover:bg-[#111] transition">
                Refresh now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-[#181818] rounded-[32px] overflow-hidden">
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className="bg-[#0f0f0f] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-0.5 h-full opacity-60" style={{ background: accent }} />
            <div className="mb-4">
              <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
            <p className="font-oswald text-[10px] text-[#555] uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="font-anton text-5xl leading-none mb-2" style={{ color: accent }}>{value}</p>
            <p className="font-oswald text-[11px] text-[#444]">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-[32px] border border-[#1c1c1c] bg-[#0f0f0f] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#1c1c1c]">
            <Weight className="w-4 h-4 text-[#e50914]" />
            <span className="font-oswald font-bold text-xs tracking-[0.15em] text-white uppercase">Division Breakdown</span>
          </div>
          <div className="px-6 py-4 space-y-3">
            {stats.divisions.map(d => (
              <div key={d.name} className="flex items-center gap-4">
                <span className="font-oswald text-sm text-[#ccc] w-40 flex-shrink-0">{d.name}</span>
                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#e50914] rounded-full transition-all duration-700" style={{ width: `${(d.count / maxDiv) * 100}%` }} />
                </div>
                <span className="font-oswald text-sm text-white w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-[#1c1c1c] bg-[#0f0f0f] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#1c1c1c]">
            <Globe className="w-4 h-4 text-[#e50914]" />
            <span className="font-oswald font-bold text-xs tracking-[0.15em] text-white uppercase">Top Nationalities</span>
          </div>
          <div className="px-6 py-4 space-y-3">
            {stats.topNationalities.map((n, i) => (
              <div key={n.name} className="flex items-center gap-3">
                <span className="font-oswald text-xs text-[#444] w-4 text-right">{i + 1}</span>
                <span className="font-oswald text-sm text-[#ccc] w-28 flex-shrink-0">{n.name}</span>
                <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#e50914] rounded-full" style={{ width: `${(n.count / maxNat) * 100}%` }} />
                </div>
                <span className="font-oswald text-sm text-white w-8 text-right">{n.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIGHTER EDITOR DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function FighterEditor({
  fighter, isNew, onSave, onCancel, onDeleteRequest,
}: {
  fighter: Partial<AppFighter> & { id?: string };
  isNew: boolean;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onDeleteRequest: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name,        setName]        = useState(fighter.name        || "");
  const [nickname,    setNickname]    = useState(fighter.nickname     || "");
  const [weightClass, setWeightClass] = useState(fighter.weightClass  || "Lightweight");
  const [rank,        setRank]        = useState(fighter.rank         || "Unranked");
  const [age,         setAge]         = useState(String(fighter.age   || 25));
  const [height,      setHeight]      = useState(fighter.height       || "");
  const [reach,       setReach]       = useState(fighter.reach        || "");
  const [stance,      setStance]      = useState(fighter.stance       || "Orthodox");
  const [nationality, setNationality] = useState(fighter.nationality  || "");
  const [imageUrl,    setImageUrl]    = useState(fighter.imageUrl     || "");
  const [wins,        setWins]        = useState(fighter.record?.wins   ?? 0);
  const [losses,      setLosses]      = useState(fighter.record?.losses ?? 0);
  const [draws,       setDraws]       = useState(fighter.record?.draws  ?? 0);
  const [striking,    setStriking]    = useState(fighter.stats?.striking ?? 75);
  const [grappling,   setGrappling]   = useState(fighter.stats?.grappling ?? 75);
  const [stamina,     setStamina]     = useState(fighter.stats?.stamina  ?? 75);
  const [chin,        setChin]        = useState(fighter.stats?.chin     ?? 75);
  const [heart,       setHeart]       = useState(fighter.stats?.heart    ?? 75);
  const [fightIQ,     setFightIQ]     = useState(fighter.stats?.fightIQ  ?? 75);

  const isCustom = fighter.id ? isCustomFighter(fighter as AppFighter) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Fighter name is required"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.toUpperCase(), nickname, weightClass, rank,
        age: parseInt(age,10)||25, height, reach, stance, nationality,
        imageUrl: imageUrl || undefined,
        record:{ wins, losses, draws },
        stats:{ striking, grappling, stamina, chin, heart, fightIQ } });
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-[#0a0a0a] text-white border border-[#222] px-3 py-2.5 font-oswald text-sm focus:outline-none focus:border-[#e50914] transition-colors placeholder-[#333]";
  const labelCls = "block font-oswald text-[10px] text-[#555] uppercase tracking-[0.15em] mb-1.5";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c1c1c] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onCancel} className="text-[#444] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="font-oswald font-bold text-sm text-white tracking-wide truncate">
            {isNew ? "NEW FIGHTER" : name || "EDIT FIGHTER"}
            {isCustom && <span className="ml-2 text-[10px] text-[#e50914] border border-[#e50914]/30 px-1.5 py-0.5 tracking-widest">CUSTOM</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isNew && (
            <button type="button" onClick={onDeleteRequest}
              className={`px-3 py-1.5 font-oswald text-xs tracking-wider border transition-colors ${isCustom ? "border-red-800 text-red-500 hover:bg-red-950" : "border-yellow-800 text-yellow-600 hover:bg-yellow-950/30"}`}>
              {isCustom ? "DELETE" : "RESET"}
            </button>
          )}
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 font-oswald text-xs tracking-wider border border-[#2a2a2a] text-[#666] hover:text-white transition-colors">
            CANCEL
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-1.5 bg-[#e50914] hover:bg-[#c00711] disabled:opacity-50 text-white font-oswald text-xs font-bold tracking-wider transition-colors flex items-center gap-2">
            {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "SAVING" : "SAVE"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className={labelCls}>Athlete Name *</label>
            <input type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="DUSTIN POIRIER" className={inputCls} /></div>
          <div><label className={labelCls}>Nickname</label>
            <input type="text" value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="The Diamond" className={inputCls} /></div>
          <div><label className={labelCls}>Nationality</label>
            <input type="text" value={nationality} onChange={e=>setNationality(e.target.value)} placeholder="USA" className={inputCls} /></div>
          <div><label className={labelCls}>Weight Class</label>
            <select value={weightClass} onChange={e=>setWeightClass(e.target.value)} className={inputCls + " appearance-none"}>
              {WC.map(w => <option key={w} value={w}>{w}</option>)}
            </select></div>
          <div><label className={labelCls}>Rank</label>
            <input type="text" value={rank} onChange={e=>setRank(e.target.value)} placeholder="Champion / #1 / Unranked" className={inputCls} /></div>
          <div><label className={labelCls}>Height</label>
            <input type="text" value={height} onChange={e=>setHeight(e.target.value)} placeholder={"5'9\""} className={inputCls} /></div>
          <div><label className={labelCls}>Reach</label>
            <input type="text" value={reach} onChange={e=>setReach(e.target.value)} placeholder='72"' className={inputCls} /></div>
          <div><label className={labelCls}>Age</label>
            <input type="number" value={age} onChange={e=>setAge(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Stance</label>
            <select value={stance} onChange={e=>setStance(e.target.value)} className={inputCls + " appearance-none"}>
              {["Orthodox","Southpaw","Switch","Karate"].map(s=><option key={s} value={s}>{s}</option>)}
            </select></div>
          <div className="col-span-2"><label className={labelCls}>Image URL</label>
            <input type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://…" className={inputCls} /></div>
        </div>

        {imageUrl && (
          <div className="border border-[#1c1c1c] p-3 flex gap-3">
            <img src={imageUrl} alt="preview" className="h-16 w-14 object-cover border border-[#2a2a2a]"
              onError={e=>(e.target as HTMLImageElement).style.display="none"} />
            <div><p className={labelCls}>Preview</p><p className="font-oswald text-[10px] text-[#333] break-all">{imageUrl}</p></div>
          </div>
        )}

        {/* Record */}
        <div className="border border-[#1c1c1c] p-5">
          <p className={labelCls + " mb-4"}>Fight Record</p>
          <div className="grid grid-cols-3 gap-4">
            {[{l:"Wins",v:wins,s:setWins,c:"#22c55e"},{l:"Losses",v:losses,s:setLosses,c:"#e50914"},{l:"Draws",v:draws,s:setDraws,c:"#888"}].map(({l,v,s,c})=>(
              <div key={l} className="text-center">
                <p className="font-oswald text-[10px] text-[#555] uppercase tracking-[0.15em] mb-2">{l}</p>
                <p className="font-anton text-4xl mb-3" style={{color:c}}>{v}</p>
                <div className="flex items-center justify-center gap-2">
                  <button type="button" onClick={()=>s(Math.max(0,v-1))} className="w-7 h-7 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white font-bold text-sm transition-colors">−</button>
                  <input type="number" min={0} value={v} onChange={e=>s(Math.max(0,parseInt(e.target.value,10)||0))}
                    className="w-12 bg-[#0a0a0a] text-white border border-[#222] text-center font-oswald text-sm focus:outline-none focus:border-[#e50914]" />
                  <button type="button" onClick={()=>s(v+1)} className="w-7 h-7 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-white font-bold text-sm transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="border border-[#1c1c1c] p-5">
          <p className={labelCls + " mb-4"}>Skill Ratings</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[{l:"Striking",v:striking,s:setStriking},{l:"Grappling",v:grappling,s:setGrappling},{l:"Stamina",v:stamina,s:setStamina},{l:"Chin",v:chin,s:setChin},{l:"Heart",v:heart,s:setHeart},{l:"Fight IQ",v:fightIQ,s:setFightIQ}].map(({l,v,s})=>(
              <div key={l}>
                <div className="flex justify-between font-oswald text-xs mb-1.5">
                  <span className="text-[#888]">{l}</span>
                  <span className={v>=90?"text-yellow-400":v>=80?"text-green-400":"text-[#e50914]"}>{v}</span>
                </div>
                <input type="range" min={50} max={100} value={v} onChange={e=>s(parseInt(e.target.value,10))} className="w-full accent-[#e50914] cursor-pointer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIGHTERS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function FightersSection({ fighters, loading, refetch }: {
  fighters: AppFighter[]; loading: boolean; refetch: () => void;
}) {
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState<FilterType>("all");
  const [sortBy,       setSortBy]       = useState<"name"|"wins"|"rank">("name");
  const [selected,     setSelected]     = useState<AppFighter | null>(null);
  const [isNew,        setIsNew]        = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppFighter | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [panelOpen,    setPanelOpen]    = useState(false);

  const filtered = fighters.filter(f => {
    const ms = f.name.toLowerCase().includes(search.toLowerCase()) || (f.nickname && f.nickname.toLowerCase().includes(search.toLowerCase()));
    const mf = filter==="all" || (filter==="custom"&&isCustomFighter(f)) || (filter==="base"&&!isCustomFighter(f));
    return ms && mf;
  }).sort((a,b) => {
    if (sortBy==="wins")  return b.record.wins - a.record.wins;
    if (sortBy==="rank") {
      const ar = a.rank==="Champion"?-1:parseInt(a.rank?.replace(/\D/g,"")||"999");
      const br = b.rank==="Champion"?-1:parseInt(b.rank?.replace(/\D/g,"")||"999");
      return ar - br;
    }
    return a.name.localeCompare(b.name);
  });

  const openFighter = (f: AppFighter) => { setSelected(f); setIsNew(false); setPanelOpen(true); };
  const openNew     = ()             => { setSelected(null); setIsNew(true); setPanelOpen(true); };
  const closePanel  = ()             => { setPanelOpen(false); setSelected(null); setIsNew(false); };

  const handleSave = async (data: any) => {
    const url = isNew ? "/api/fighter/custom" : `/api/fighter/${selected?.id}/override`;
    const res = await fetch(url, { method:"POST", headers:authHeaders(), body:JSON.stringify(data) });
    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error||"Save failed"); }
    toast.success(isNew?"✓ Fighter created":"✓ Changes saved");
    closePanel(); refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const isC = isCustomFighter(deleteTarget);
      const url = isC ? `/api/fighter/custom/${deleteTarget.id}` : `/api/fighter/${deleteTarget.id}/override`;
      const res = await fetch(url, { method:"DELETE", headers:authHeaders() });
      if (!res.ok && res.status!==404) throw new Error("Failed");
      toast.success(isC ? `Deleted "${deleteTarget.name}"` : `Reset overrides for "${deleteTarget.name}"`);
      setDeleteTarget(null); closePanel(); refetch();
    } catch(e:any) { toast.error(e?.message||"Error"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="flex h-full" style={{ minHeight: 600 }}>
      {/* ── List pane ── */}
      <div className={`flex flex-col ${panelOpen ? "hidden lg:flex lg:w-80 xl:w-96 flex-shrink-0 border-r border-[#1c1c1c]" : "flex-1"}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <span className="font-oswald text-sm text-[#555]">{filtered.length} fighters</span>
          <button onClick={openNew} className="flex items-center gap-2 bg-[#e50914] hover:bg-[#c00711] text-white px-4 py-2 font-oswald text-xs font-bold tracking-wider transition-colors">
            + ADD NEW
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input type="text" placeholder="Search fighters..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full bg-[#0f0f0f] text-white border border-[#1c1c1c] px-4 py-3 pl-10 font-oswald text-sm focus:outline-none focus:border-[#e50914] transition-colors placeholder-[#333]" />
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#333]" />
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-3.5 text-[#333] hover:text-white"><X className="w-4 h-4" /></button>}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex border border-[#1c1c1c]">
            {(["all","base","custom"] as FilterType[]).map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className={`px-4 py-2 font-oswald text-xs tracking-wider transition-colors ${filter===f?"bg-[#e50914] text-white":"text-[#555] hover:text-white"}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}
            className="ml-auto bg-[#0f0f0f] border border-[#1c1c1c] text-[#888] font-oswald text-xs px-3 py-2 focus:outline-none focus:border-[#e50914]">
            <option value="name">A–Z</option>
            <option value="wins">Wins</option>
            <option value="rank">Rank</option>
          </select>
        </div>

        {/* Fighter rows */}
        <div className="flex-1 overflow-y-auto border border-[#1c1c1c] custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length===0 ? (
            <div className="text-center text-[#333] py-16 font-oswald text-sm">No fighters found</div>
          ) : filtered.map(f => (
            <button key={f.id} onClick={()=>openFighter(f)}
              className={`w-full text-left px-5 py-4 border-b border-[#111] transition-colors group flex items-center justify-between ${selected?.id===f.id&&panelOpen?"bg-[#1a0608] border-l-2 border-l-[#e50914]":"hover:bg-[#0f0f0f]"}`}>
              <div className="min-w-0">
                <div className="font-oswald font-bold text-sm text-white flex items-center gap-2">
                  {isCustomFighter(f) && <span className="text-[9px] border border-[#e50914]/40 text-[#e50914] px-1 leading-relaxed">C</span>}
                  {f.rank==="Champion" && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                  {f.name}
                </div>
                <div className="font-oswald text-xs text-[#444] mt-0.5">
                  {f.weightClass}
                  {f.record && <> · <span className="text-[#22c55e]">{f.record.wins}W</span>-<span className="text-[#e50914]">{f.record.losses}L</span></>}
                  {f.nationality && <> · {f.nationality}</>}
                </div>
              </div>
              <Edit3 className="w-3.5 h-3.5 text-[#222] group-hover:text-[#555] flex-shrink-0 ml-2 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor pane ── */}
      {panelOpen && (
        <div className="flex-1 min-w-0 border border-[#1c1c1c] lg:border-0 lg:border-l lg:border-[#1c1c1c] flex flex-col overflow-hidden">
          <FighterEditor
            fighter={isNew ? {} : (selected as AppFighter)}
            isNew={isNew}
            onSave={handleSave}
            onCancel={closePanel}
            onDeleteRequest={() => setDeleteTarget(selected)}
          />
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] p-8 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <span className="font-oswald font-bold text-sm text-white tracking-wider">
                {isCustomFighter(deleteTarget)?"DELETE FIGHTER":"RESET OVERRIDES"}
              </span>
            </div>
            <p className="font-oswald text-xs text-[#666] mb-6 leading-relaxed">
              {isCustomFighter(deleteTarget)
                ? `Permanently delete "${deleteTarget.name}"? This cannot be undone.`
                : `Reset all manual overrides for "${deleteTarget.name}"?`}
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteTarget(null)} className="flex-1 py-2.5 border border-[#2a2a2a] text-[#666] hover:text-white font-oswald text-xs tracking-wider transition-colors">CANCEL</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white font-oswald text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors">
                {deleting?<div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />:(isCustomFighter(deleteTarget)?"DELETE":"RESET")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIVISIONS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function DivisionsSection({ fighters }: { fighters: AppFighter[] }) {
  const [selected, setSelected] = useState<string|null>(null);

  const divMap: Record<string,AppFighter[]> = {};
  for (const f of fighters) { const wc=f.weightClass||"Unknown"; if(!divMap[wc]) divMap[wc]=[]; divMap[wc].push(f); }
  const divs = Object.entries(divMap).sort((a,b)=>b[1].length-a[1].length);
  const divFighters = selected ? (divMap[selected]||[]) : [];

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Left: division list */}
      <div className="border border-[#1c1c1c]">
        {divs.map(([name, list]) => (
          <button key={name} onClick={()=>setSelected(name===selected?null:name)}
            className={`w-full flex items-center justify-between px-5 py-4 border-b border-[#111] transition-colors text-left ${selected===name?"bg-[#1a0608] border-l-2 border-l-[#e50914]":"hover:bg-[#0f0f0f]"}`}>
            <div>
              <div className="font-oswald font-bold text-sm text-white">{name}</div>
              <div className="font-oswald text-xs text-[#444] mt-0.5">{list.length} fighters</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-anton text-2xl text-[#333]">{list.length}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${selected===name?"rotate-90 text-[#e50914]":"text-[#2a2a2a]"}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Right: fighter table */}
      <div className="border border-[#1c1c1c] min-h-80">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-80 text-[#2a2a2a]">
            <Weight className="w-10 h-10 mb-3" />
            <p className="font-oswald text-sm">Select a division to view its fighters</p>
            <p className="font-oswald text-xs text-[#222] mt-1">Choose a weight class from the list on the left</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
              <span className="font-oswald font-bold text-sm text-white">{selected}</span>
              <span className="font-oswald text-xs text-[#444]">{divFighters.length} fighters</span>
            </div>
            <div className="overflow-y-auto custom-scrollbar" style={{maxHeight:520}}>
              {divFighters.sort((a,b)=>{
                const ar=a.rank==="Champion"?-1:parseInt(a.rank?.replace(/\D/g,"")||"999");
                const br=b.rank==="Champion"?-1:parseInt(b.rank?.replace(/\D/g,"")||"999");
                return ar-br;
              }).map(f => {
                const avg = f.stats ? Math.round(Object.values(f.stats).reduce((s,v)=>s+v,0)/6) : null;
                return (
                  <div key={f.id} className="flex items-center px-5 py-3.5 border-b border-[#0d0d0d] hover:bg-[#0a0a0a] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-oswald font-bold text-sm text-white flex items-center gap-1.5">
                        {f.rank==="Champion"&&<Crown className="w-3 h-3 text-yellow-500"/>}
                        {f.name}
                      </div>
                      <div className="font-oswald text-xs text-[#444] mt-0.5">{f.rank||"Unranked"}</div>
                    </div>
                    <div className="text-right mr-6">
                      <div className="font-oswald text-xs"><span className="text-[#22c55e]">{f.record.wins}W</span> - <span className="text-[#e50914]">{f.record.losses}L</span></div>
                    </div>
                    {avg !== null && (
                      <div className={`font-oswald font-bold text-sm w-10 text-right ${avg>=85?"text-yellow-400":avg>=75?"text-[#888]":"text-[#555]"}`}>{avg}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function UsersSection({ users, loading }: { users: AdminUser[]; loading: boolean }) {
  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <div className="border border-[#1c1c1c]">
      <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
        <span className="font-oswald font-bold text-sm text-white">REGISTERED USERS</span>
        <span className="font-oswald text-xs text-[#444]">{users.length} accounts</span>
      </div>
      {users.length===0 ? (
        <div className="py-16 text-center font-oswald text-sm text-[#333]">No registered users yet</div>
      ) : users.map((u, i) => (
        <div key={u.id} className={`flex items-center px-5 py-4 border-b border-[#111] ${i%2===0?"":"bg-[#0a0a0a]"}`}>
          <div className={`w-7 h-7 flex items-center justify-center font-oswald font-bold text-xs mr-4 border ${u.isAdmin?"border-[#e50914]/50 text-[#e50914] bg-[#e50914]/5":"border-[#222] text-[#555]"}`}>
            {u.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald text-sm text-white">{u.email}</div>
            <div className="font-oswald text-[11px] text-[#444] mt-0.5">
              Joined {new Date(u.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
            </div>
          </div>
          {u.isAdmin ? (
            <span className="flex items-center gap-1.5 text-[10px] font-oswald font-bold text-[#e50914] border border-[#e50914]/30 px-2 py-1 tracking-widest">
              <Shield className="w-2.5 h-2.5" /> ADMIN
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-oswald font-bold text-[#444] border border-[#222] px-2 py-1 tracking-widest">
              USER
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT ADMIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Admin() {
  const [checking,    setChecking]    = useState(true);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [adminEmail,  setAdminEmail]  = useState("");
  const [section,     setSection]     = useState<AdminSection>("dashboard");
  const [stats,       setStats]       = useState<AdminStats|null>(null);
  const [loadingStats,setLoadingStats]= useState(true);
  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [loadingUsers,setLoadingUsers]= useState(false);

  const { data: allFighters, loading: loadingFighters, refetch } = useAllFighters();

  useEffect(() => {
    const token = readToken();
    if (!token) { setChecking(false); return; }
    getMe(token).then(u => { setIsAdmin(u.isAdmin); setAdminEmail(u.email); })
      .catch(()=>setIsAdmin(false)).finally(()=>setChecking(false));
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try { const r = await fetch("/api/admin/stats",{headers:authHeaders()}); if(r.ok) setStats(await r.json()); }
    catch {}
    finally { setLoadingStats(false); }
  }, []);

  useEffect(() => { if(isAdmin) loadStats(); }, [isAdmin, loadStats]);

  useEffect(() => {
    if (section==="users" && isAdmin && users.length===0) {
      setLoadingUsers(true);
      fetch("/api/admin/users",{headers:authHeaders()}).then(r=>r.ok?r.json():[]).then(setUsers).catch(()=>{}).finally(()=>setLoadingUsers(false));
    }
  }, [section, isAdmin]);

  const fighters = allFighters ?? [];
  const customCount = fighters.filter(isCustomFighter).length;

  const SECTION_META: Record<AdminSection,{title:string;sub:string}> = {
    dashboard:{ title:"Dashboard",        sub:"Overview of your fight tracker database" },
    fighters: { title:"Fighter Database", sub:"Browse, edit, and create custom fighters" },
    divisions:{ title:"Division Manager", sub:"Fighter breakdown by weight class" },
    users:    { title:"User Management",  sub:"Registered accounts" },
  };

  // ── Loading ──
  if (checking) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Access denied ──
  if (!isAdmin) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="max-w-sm w-full p-8 border border-[#1c1c1c] bg-[#0f0f0f]">
        <ShieldAlert className="w-10 h-10 text-[#e50914] mb-5" />
        <h1 className="font-anton text-3xl text-white mb-3 tracking-wider">ACCESS DENIED</h1>
        <p className="font-oswald text-sm text-[#555] leading-relaxed mb-7">
          This area is restricted to administrators.
        </p>
        <Link to="/signin" state={{ from:"/admin" }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e50914] hover:bg-[#c00711] text-white font-oswald text-sm font-bold tracking-wider transition-colors">
          <LogIn className="w-4 h-4" /> SIGN IN AS ADMIN
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white flex" style={{fontFamily:"inherit"}}>

      {/* ══ SIDEBAR ══ */}
      <aside className="w-44 flex-shrink-0 bg-[#0a0a0a] border-r border-[#141414] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#e50914] flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-xs tracking-[0.1em] text-white leading-tight">FIGHT TRACKER</div>
              <div className="font-oswald text-[9px] text-[#333] tracking-[0.12em] mt-0.5">ADMIN CONSOLE</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV.map(({id,label,icon:Icon}) => (
            <button key={id} onClick={()=>setSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 font-oswald text-xs tracking-wider transition-colors text-left ${section===id?"bg-[#e50914] text-white":"text-[#555] hover:text-[#aaa] hover:bg-[#0f0f0f]"}`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {id==="fighters" && fighters.length>0 && (
                <span className={`text-[9px] px-1.5 py-0.5 font-bold ${section===id?"bg-white/20 text-white":"bg-[#1c1c1c] text-[#666]"}`}>
                  {fighters.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom stats */}
        <div className="px-4 py-4 border-t border-[#141414] space-y-2">
          {[{l:"Custom fighters",v:customCount},{l:"Overrides",v:stats?.overrideCount??"-"},{l:"Users",v:stats?.totalUsers??"-"}].map(({l,v})=>(
            <div key={l} className="flex justify-between">
              <span className="font-oswald text-[10px] text-[#333]">{l}</span>
              <span className="font-oswald text-[10px] text-[#555]">{v}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 border-b border-[#141414] bg-[#0a0a0a] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 font-oswald text-xs text-[#333] tracking-widest">
            <span>ADMIN</span>
            <span>/</span>
            <span className="text-[#888] font-bold">{SECTION_META[section].title.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 border border-[#e50914]/40 bg-[#e50914]/5 px-2.5 py-1">
              <Circle className="w-2 h-2 text-[#e50914] fill-[#e50914]" />
              <span className="font-oswald text-[10px] text-[#e50914] font-bold tracking-widest">ADMIN</span>
            </div>
            <span className="font-oswald text-[11px] text-[#444]">{adminEmail}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Page title */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-anton text-4xl text-white tracking-wider mb-1">{SECTION_META[section].title.toUpperCase()}</h1>
              <p className="font-oswald text-sm text-[#e50914]">{SECTION_META[section].sub}</p>
            </div>
            {section==="dashboard" && (
              <button onClick={loadStats} className="flex items-center gap-2 font-oswald text-xs text-[#555] hover:text-white transition-colors mt-1">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStats?"animate-spin":""}`} /> REFRESH
              </button>
            )}
            {section==="fighters" && (
              <div className="flex items-center gap-1.5 font-oswald text-xs text-[#22c55e] mt-1">
                <CheckCircle className="w-3.5 h-3.5" /> {fighters.length} fighters loaded
              </div>
            )}
          </div>

          {section==="dashboard" && <DashboardSection stats={stats} loading={loadingStats} onRefresh={loadStats} />}
          {section==="fighters"  && <FightersSection fighters={fighters} loading={loadingFighters} refetch={refetch} />}
          {section==="divisions" && <DivisionsSection fighters={fighters} />}
          {section==="users"     && <UsersSection users={users} loading={loadingUsers} />}
        </main>
      </div>
    </div>
  );
}
