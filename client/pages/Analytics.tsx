import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, Database, FileText, Globe, Users } from "lucide-react";
import { useUfcCounts } from "../hooks/useUfcData";

export default function Analytics() {
  const { fighters, events, loading } = useUfcCounts();

  return (
    <div className="min-h-screen bg-ufc-black text-white">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(229,9,20,0.35),_transparent_35%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto rounded-[32px] border border-[#1b1b1b] bg-[#0f0f0f]/95 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-oswald text-xs uppercase tracking-[0.35em] text-ufc-red mb-3">Analytics Hub</p>
                <h1 className="font-anton text-4xl lg:text-5xl tracking-[0.03em] text-white">UFC Fight Data & Prediction Notebook</h1>
                <p className="mt-4 max-w-3xl text-sm lg:text-base text-ufc-metallic leading-7">Browse the analysis notebook that powers dataset insights, fight outcome prediction experiments, physical advantage studies, and real dataset summaries from the UFC gold CSV.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/" className="inline-flex items-center gap-2 rounded-3xl border border-[#333] bg-[#111] px-5 py-3 text-sm text-white transition hover:border-ufc-red hover:text-ufc-red">
                  <ArrowLeft className="w-4 h-4" /> Back home
                </Link>
                <a href="/analytics/ufc-fight-analytics-prediction-1993-2026.ipynb" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-3xl bg-ufc-red px-5 py-3 text-sm font-bold text-white transition hover:bg-ufc-red-dark">
                  <FileText className="w-4 h-4" /> Open notebook
                </a>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                { icon: Users, label: "Fighters in dataset", value: loading ? "Loading..." : fighters?.toLocaleString() ?? "N/A" },
                { icon: Calendar, label: "Events tracked", value: loading ? "Loading..." : events?.toLocaleString() ?? "N/A" },
                { icon: Globe, label: "Years covered", value: "1993–2026" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-[#1b1b1b] bg-[#111] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <stat.icon className="w-5 h-5 text-ufc-red" />
                    <span className="font-oswald text-xs uppercase tracking-[0.35em] text-[#777]">{stat.label}</span>
                  </div>
                  <div className="font-anton text-4xl text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[32px] border border-[#1b1b1b] bg-[#111] p-7">
                <div className="flex items-center gap-3 mb-5">
                  <BarChart3 className="w-5 h-5 text-ufc-red" />
                  <h2 className="font-oswald text-sm uppercase tracking-[0.35em] text-[#777]">What’s inside</h2>
                </div>
                <ul className="space-y-4 text-sm text-ufc-metallic leading-7">
                  <li>• Fight outcome distributions by finish method, duration, and scorecards.</li>
                  <li>• Reach, striking, takedown, and control advantages for winner prediction.</li>
                  <li>• A Random Forest model trained on in-fight metrics to predict results.</li>
                  <li>• Data cleaning and merging of fight rows with fighter profile data.</li>
                </ul>
              </div>

              <div className="rounded-[32px] border border-[#1b1b1b] bg-[#111] p-7">
                <div className="flex items-center gap-3 mb-5">
                  <Database className="w-5 h-5 text-ufc-red" />
                  <h2 className="font-oswald text-sm uppercase tracking-[0.35em] text-[#777]">Notebook sources</h2>
                </div>
                <p className="text-sm text-ufc-metallic leading-7 mb-6">The notebook is built from the attached UFC gold dataset and fighter profile CSV files. It is served directly from public assets so you can open it in the browser or download it for deeper offline review.</p>
                <div className="grid gap-3">
                  <a href="/analytics/ufc-fight-analytics-prediction-1993-2026.ipynb" target="_blank" rel="noreferrer" className="rounded-3xl border border-[#333] bg-[#0b0b0b] px-4 py-3 text-sm text-white hover:border-ufc-red transition">Open analytics notebook</a>
                  <a href="/data/ufc_gold_dataset_final.csv" download className="rounded-3xl border border-[#333] bg-[#0b0b0b] px-4 py-3 text-sm text-[#aaa] hover:border-ufc-red hover:text-white transition">Download UFC gold dataset (CSV)</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
