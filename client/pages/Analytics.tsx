import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  Globe,
  Swords,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getAnalyticsData, CountItem } from "../services/analyticsData";

// Palette pulled straight from the design tokens so charts match the rest of the app
const OXBLOOD = "#7A1F1F";
const OXBLOOD_LIGHT = "#A32B2B";
const GOLD = "#B8912F";
const BONE = "#EDE6D6";
const BONE_MUTED = "#A69C88";
const FENCE = "#3A3530";
const SLICE_COLORS = [OXBLOOD, GOLD, BONE_MUTED, OXBLOOD_LIGHT, "#4A7A3A", "#6B6355"];

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="ticket-card p-6">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-4 h-4 text-ufc-red" />
        <span className="font-display-alt text-xs uppercase tracking-[0.3em] text-ufc-metallic">{label}</span>
      </div>
      <div className="font-stat text-3xl text-white">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ticket-card p-6">
      <h2 className="font-display-alt text-sm uppercase tracking-[0.3em] text-ufc-metallic mb-4">{title}</h2>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: "#1F1B17",
  border: `1px solid ${FENCE}`,
  borderRadius: 4,
  color: BONE,
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 12,
};

export default function Analytics() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAnalyticsData>> | null>(null);

  useEffect(() => {
    getAnalyticsData().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-display-alt text-ufc-metallic tracking-widest">LOADING ANALYTICS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 border-b border-border cage-overlay">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div>
              <p className="font-display-alt text-xs uppercase tracking-[0.35em] text-ufc-red mb-2">Analytics</p>
              <h1 className="font-display text-4xl lg:text-5xl tracking-wider text-white">
                Real Fight Data, <span className="text-ufc-red">Not Guesses</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-ufc-metallic">
                Every number below is computed directly from the {data.totals.fights.toLocaleString()} fights and{" "}
                {data.totals.fighters.toLocaleString()} fighters in the live dataset — nothing here is hardcoded.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 self-start px-5 py-3 border border-border text-sm text-white hover:border-ufc-red hover:text-ufc-red transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back home
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Fighters" value={data.totals.fighters.toLocaleString()} />
            <StatCard icon={Swords} label="Fights" value={data.totals.fights.toLocaleString()} />
            <StatCard icon={Calendar} label="Events" value={data.totals.events.toLocaleString()} />
            <StatCard icon={Globe} label="Years Covered" value={data.totals.yearRange} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 grid gap-6 lg:grid-cols-2">
          <ChartCard title="How Fights End">
            <div className="flex flex-col gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={data.methodBreakdown}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    paddingAngle={1}
                    labelLine={false}
                    label={false}
                  >
                    {data.methodBreakdown.map((_, i) => (
                      <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [val.toLocaleString(), "Fights"]} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-2.5 px-2">
                {data.methodBreakdown.map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
                      />
                      <span className="font-display-alt text-xs uppercase tracking-wider text-ufc-metallic">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-stat text-sm text-white font-semibold">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>



          <ChartCard title="Fights By Weight Class">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.weightClassBreakdown} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={FENCE} horizontal={false} />
                <XAxis type="number" tick={{ fill: BONE_MUTED, fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fill: BONE_MUTED, fontSize: 11 }} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={OXBLOOD} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Fights Per Year">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.fightsPerYear}>
                <CartesianGrid strokeDasharray="3 3" stroke={FENCE} />
                <XAxis dataKey="label" tick={{ fill: BONE_MUTED, fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: BONE_MUTED, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Which Round Fights End In">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.finishRoundBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={FENCE} />
                <XAxis dataKey="label" tick={{ fill: BONE_MUTED, fontSize: 11 }} />
                <YAxis tick={{ fill: BONE_MUTED, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={OXBLOOD_LIGHT} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Fighter Stance Distribution">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.stanceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={FENCE} />
                <XAxis dataKey="label" tick={{ fill: BONE_MUTED, fontSize: 11 }} />
                <YAxis tick={{ fill: BONE_MUTED, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={GOLD} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Most Wins (Top 10)">
            <div className="space-y-2">
              {data.topByWins.map((f, i) => (
                <div key={f.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="font-stat text-xs text-ufc-metallic w-5">{i + 1}</span>
                    <span className="font-display-alt text-sm text-white tracking-wide">{f.name}</span>
                  </div>
                  <span className="font-stat text-sm">
                    <span className="text-green-600">{f.wins}</span>
                    <span className="text-ufc-metallic">-{f.losses}-{f.draws}</span>
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
