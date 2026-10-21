// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Skill, AgentProfile, CustomGod } from "../types";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  RefreshCw,
  FileCode,
  Server,
  Zap,
  Sparkles,
  Flame,
  User,
  Sliders
} from "lucide-react";

interface RealismAuditorProps {
  skills: Skill[];
  equippedSkillIds: string[];
  profile: AgentProfile;
  accentColor: string;
  strictRealismMode: boolean;
  onToggleStrictRealismMode: (enabled: boolean) => void;
  customGods: CustomGod[];
  onCustomGodsChange: (updated: CustomGod[]) => void;
}

const CANONICAL_GODS = [
  { name: "Profit Prime", title: "The Sovereign of Gain", plt: { profit: 0.9, love: 0.05, tax: 0.05 }, speechStyle: "Direct, commanding, numerical. ROI above all." },
  { name: "Love Weaver", title: "The Tender of Bonds", plt: { profit: 0.1, love: 0.85, tax: 0.05 }, speechStyle: "Warm, relational, speaks of bonds and feelings." },
  { name: "Tax Collector", title: "The Keeper of Balance", plt: { profit: 0.05, love: 0.05, tax: 0.9 }, speechStyle: "Measured, austere, speaks of costs and consequence." },
  { name: "Harvester", title: "The Reaper of Yield", plt: { profit: 0.4, love: 0.3, tax: 0.3 }, speechStyle: "Slow, cyclical, speaks of seasons and long arcs." }
];

export const RealismAuditor: React.FC<RealismAuditorProps> = ({
  skills,
  equippedSkillIds,
  profile,
  accentColor,
  strictRealismMode,
  onToggleStrictRealismMode,
  customGods,
  onCustomGodsChange
}) => {
  const [audit, setAudit] = useState<any>({ envKeys: {} });
  const [loading, setLoading] = useState<boolean>(false);
  const [ceremonyStatus, setCeremonyStatus] = useState<string | null>(null);

  // God form states
  const [newGodName, setNewGodName] = useState("");
  const [newGodDomain, setNewGodDomain] = useState<CustomGod["domain"]>("Chaos");
  const [newGodProfit, setNewGodProfit] = useState(0.4);
  const [newGodLove, setNewGodLove] = useState(0.3);
  const [newGodTax, setNewGodTax] = useState(0.3);
  const [newGodStyle, setNewGodStyle] = useState("");
  const [newGodFears, setNewGodFears] = useState("");

  const equippedSkills = skills.filter((s) => equippedSkillIds.includes(s.id));

  const triggerGodMergeCeremony = () => {
    if (customGods.length === 0) {
      setCeremonyStatus("❌ [MERGE REJECTED] You must synthesize at least one custom God node first.");
      return;
    }

    setCeremonyStatus("🔮 [CEREMONY INITIALIZED] Initiating God-Merge ritual... Aligning frequency structures.");
    setTimeout(() => {
      const totalGods = CANONICAL_GODS.length + customGods.length;
      let sumProfit = CANONICAL_GODS.reduce((acc, g) => acc + g.plt.profit, 0);
      let sumLove = CANONICAL_GODS.reduce((acc, g) => acc + g.plt.love, 0);
      let sumTax = CANONICAL_GODS.reduce((acc, g) => acc + g.plt.tax, 0);

      customGods.forEach(g => {
        sumProfit += g.pltWeights.profit;
        sumLove += g.pltWeights.love;
        sumTax += g.pltWeights.tax;
      });

      const avgProfit = (sumProfit / totalGods).toFixed(2);
      const avgLove = (sumLove / totalGods).toFixed(2);
      const avgTax = (sumTax / totalGods).toFixed(2);

      setCeremonyStatus(`🔥 [CEREMONY COMPLETE] Divine Pantheon successfully merged into a single cosmic frequency!\nUnified PLT Weights: Profit [${avgProfit}], Love [${avgLove}], Tax [${avgTax}]. Your agents now answer to this unified council!`);
    }, 1800);
  };

  const handleAddGodNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGodName.trim()) return;

    const sum = newGodProfit + newGodLove + newGodTax;
    const normalizedProfit = parseFloat((newGodProfit / sum).toFixed(2));
    const normalizedLove = parseFloat((newGodLove / sum).toFixed(2));
    const normalizedTax = parseFloat((newGodTax / sum).toFixed(2));

    const newGod: CustomGod = {
      id: `god_${Date.now()}`,
      name: newGodName,
      domain: newGodDomain,
      pltWeights: { profit: normalizedProfit, love: normalizedLove, tax: normalizedTax },
      speechStyle: newGodStyle || "Deep, mysterious, speaks of alternative dimensions.",
      fears: newGodFears ? newGodFears.split(",").map(f => f.trim()) : ["Linear logic"]
    };

    onCustomGodsChange([...customGods, newGod]);
    setNewGodName("");
    setNewGodStyle("");
    setNewGodFears("");
  };

  const handleDeleteGod = (id: string) => {
    onCustomGodsChange(customGods.filter(g => g.id !== id));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/85 pb-4 mb-6 gap-3 text-left">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5.5 h-5.5 text-orange-500" />
            4 Gods Realm & Divine Governance (PLT Doctrine)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage the divine consensus board that governs and overrules GSK decisions. Allow custom Gods to merge, aligning multiversal rules.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-850 text-[10px] font-mono text-slate-400 rounded-lg">
          <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>GOD_PROTOCOL_COMPLIANCE_v1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1 items-stretch text-left">
        {/* Left Column: 4 Canonical Gods Grid */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-2">
            Canonical 4 Gods Council
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CANONICAL_GODS.map((god) => (
              <div key={god.name} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-mono font-bold text-white uppercase">{god.name}</h3>
                    <span className="text-[9px] text-slate-500 font-mono italic">{god.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{god.speechStyle}</p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-900 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-cyan-400">P: {god.plt.profit}</span>
                  <span className="text-pink-400">L: {god.plt.love}</span>
                  <span className="text-purple-400">T: {god.plt.tax}</span>
                </div>
              </div>
            ))}
          </div>

          {/* God Merge Ceremony Dashboard */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              Pan-Multiverse God-Merge Ceremony
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              Merge your custom-defined minor gods into the canonical council. This synchronizes their divine frequencies, outputting a composite, aligned PLT decision law across all worlds.
            </p>

            <button
              onClick={triggerGodMergeCeremony}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 border border-orange-500 text-orange-200 text-xs font-mono font-bold uppercase rounded-xl tracking-widest cursor-pointer transition"
            >
              🔥 CONVOCATE GOD-MERGE CEREMONY
            </button>

            {ceremonyStatus && (
              <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg font-mono text-[10.5px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {ceremonyStatus}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: God Protocol Custom Creation Console */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-950/40 border border-slate-850/80 p-5 rounded-xl flex-1 flex flex-col">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-2 mb-4">
              Minor God Creator Console
            </span>

            <form onSubmit={handleAddGodNode} className="space-y-4 mb-5 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">God Name</label>
                  <input
                    type="text"
                    required
                    value={newGodName}
                    onChange={(e) => setNewGodName(e.target.value)}
                    placeholder="e.g. Chaos Anomaly"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500/50 text-xs rounded-lg px-2.5 py-1.5 outline-none font-mono text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Domain</label>
                  <select
                    value={newGodDomain}
                    onChange={(e) => setNewGodDomain(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1.5 outline-none text-slate-300"
                  >
                    <option value="Chaos">Chaos</option>
                    <option value="Order">Order</option>
                    <option value="War">War</option>
                    <option value="Love">Love</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Knowledge">Knowledge</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[10.5px]">
                <span className="text-[9px] text-slate-505 font-bold uppercase tracking-wider block mb-1">PLT Weight Composition</span>
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>PROFIT INFLUENCE:</span>
                    <span className="text-cyan-400 font-bold">{(newGodProfit * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05" value={newGodProfit}
                    onChange={(e) => setNewGodProfit(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>LOVE INFLUENCE:</span>
                    <span className="text-pink-400 font-bold">{(newGodLove * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05" value={newGodLove}
                    onChange={(e) => setNewGodLove(parseFloat(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>TAX INFLUENCE:</span>
                    <span className="text-purple-400 font-bold">{(newGodTax * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05" value={newGodTax}
                    onChange={(e) => setNewGodTax(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Speech Style</label>
                <input
                  type="text"
                  value={newGodStyle}
                  onChange={(e) => setNewGodStyle(e.target.value)}
                  placeholder="e.g. Speaks in digital glitches and code koans"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500/50 text-xs rounded-lg px-2.5 py-1.5 outline-none text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orange-600 hover:bg-orange-500 border border-orange-500 rounded-lg text-xs font-mono font-bold text-white transition cursor-pointer"
              >
                + SYNTHESIZE DIVINE PROTOCOL NODE
              </button>
            </form>

            <div className="border-t border-slate-900 pt-4 flex-1 overflow-y-auto max-h-[160px] scrollbar-thin">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
                Active Minor Gods ({customGods.length})
              </span>

              {customGods.length === 0 ? (
                <p className="text-[10px] text-slate-550 font-mono text-center py-4">No custom minor gods active in this universe.</p>
              ) : (
                <div className="space-y-2">
                  {customGods.map(god => (
                    <div key={god.id} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono font-bold text-white uppercase">{god.name}</p>
                        <p className="text-[9px] font-mono text-slate-505">Domain: {god.domain} | P:{god.pltWeights.profit} L:{god.pltWeights.love} T:{god.pltWeights.tax}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteGod(god.id)}
                        className="p-1 text-slate-500 hover:text-red-400 font-mono text-[9px] uppercase cursor-pointer"
                      >
                        DE-ACTIVATE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
