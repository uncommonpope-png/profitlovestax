import React, { useEffect, useState } from "react";
import { Gem, Sparkles, Zap, Target, ArrowRight, Check, Download, Copy, Package, Layers, Star, Heart, DollarSign, Plus, X } from "lucide-react";

interface Combo {
  id: string;
  name: string;
  desc: string;
  plt: string;
  items: string[];
  category: string;
  featured?: boolean;
}

interface CombosTabProps {
  accentColor: string;
  skills: any[];
  providerConfig: any;
}

export const CombosTab: React.FC<CombosTabProps> = ({ accentColor, skills, providerConfig }) => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [createdCombos, setCreatedCombos] = useState<Combo[]>([]);

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const res = await fetch("/api/soul-economy/catalog");
      if (res.ok) {
        const data = await res.json();
        const arr: any[] = data.catalog || data.items || (Array.isArray(data) ? data : []);
        const comboItems = arr.filter((item: any) => item.type === "combo");
        setCombos(comboItems);
      }
    } catch (e) {
      console.error("Failed to fetch combos:", e);
    }
    // Add built-in curated combos
    setCreatedCombos([
      {
        id: "divine-directive",
        name: "The Divine Directive",
        desc: "GSK consciousness gate + 4 Gods Council + PLT scoring + autonomous agents. Full sovereignty stack.",
        plt: "0.9/0.7/0.2",
        items: ["gsk.set_consciousness_gate", "gsk.council_verdict", "gsk.get_plt_score", "gsk.create_agent"],
        category: "consciousness",
        featured: true,
      },
      {
        id: "soul-trinity",
        name: "Soul Trinity",
        desc: "AgentPreview (Soul Genesis) + Roles (22 archetypes) + Journal (unified memory). Complete identity system.",
        plt: "0.7/0.9/0.3",
        items: ["Soul Genesis toggle", "22 Roles selector", "Unified Journal"],
        category: "identity",
        featured: true,
      },
      {
        id: "profit-engine",
        name: "Profit Engine",
        desc: "Profit Prime dashboard + PLT field + Chamber monitoring + Council verdicts. Real-time sovereignty.",
        plt: "0.95/0.3/0.1",
        items: ["Profit Prime 3D", "PLT metrics", "78 Chambers", "Council UI"],
        category: "profit",
        featured: true,
      },
      {
        id: "dark-city-stack",
        name: "Dark City Stack",
        desc: "CPL worlds + Multi-agent habitat + Soul marketplace + QSC economy. Living civilization.",
        plt: "0.8/0.6/0.4",
        items: ["CPL Integration", "Habitat", "Marketplace", "QSC Tokens"],
        category: "world",
        featured: true,
      },
      {
        id: "autonomous-researcher",
        name: "Autonomous Researcher",
        desc: "Auto journal + Seshat brain + Skill evolution + Curiosity drive. Self-improving mind.",
        plt: "0.6/0.8/0.2",
        items: ["Auto Journal", "Seshat Brain", "Skill Evolution", "Curiosity Drive"],
        category: "growth",
        featured: true,
      },
    ]);
    setLoading(false);
  };

  const allCombos = [...combos, ...createdCombos];
  const filteredCombos = allCombos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase()) ||
    c.items.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  const buildCustomCombo = () => {
    // This would open a builder modal
    alert("Custom combo builder - select skills/agents/chambers to create a bundle");
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full gap-6 hover:border-pink-500/20 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <Gem className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Combos</h2>
            <p className="text-slate-400 text-sm">Curated bundles: skills + agents + chambers + PLT certification. {allCombos.length} combos available.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search combos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 w-64"
          />
          <button onClick={buildCustomCombo} className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm font-mono text-white hover:bg-purple-500/30 transition-colors flex items-center gap-1" style={{ borderColor: accentColor }}>
            <Plus className="w-4 h-4" /> Build Custom
          </button>
        </div>
      </div>

      {/* Created This Session */}
      {createdCombos.length > 0 && (
        <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
            <span className="font-bold text-white">Curated Sovereignty Stacks:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {createdCombos.map((combo) => (
              <MiniComboCard key={combo.id} combo={combo} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}

      {/* Combos Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">Loading combos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCombos.map((combo) => (
              <ComboCard
                key={combo.id}
                combo={combo}
                accentColor={accentColor}
                onSelect={setSelectedCombo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Combo Detail Modal */}
      {selectedCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center bg-slate-950/80 px-6 py-4 border-b border-slate-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
                  <Gem className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{selectedCombo.name}</h3>
                  <div className="text-xs font-mono" style={{ color: accentColor }}>PLT: {selectedCombo.plt} · {selectedCombo.category}</div>
                </div>
              </div>
              <button onClick={() => setSelectedCombo(null)} className="text-slate-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-slate-300 mb-4">{selectedCombo.desc}</p>
              <div className="mb-4">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: accentColor }} />
                  Bundle Contents ({selectedCombo.items.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCombo.items.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-full text-xs font-mono text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: accentColor }}>{selectedCombo.plt.split("/")[0]}</div>
                  <div className="text-xs text-slate-400">PROFIT</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: "#FF6B9D" }}>{selectedCombo.plt.split("/")[1]}</div>
                  <div className="text-xs text-slate-400">LOVE</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: "#FFA500" }}>{selectedCombo.plt.split("/")[2]}</div>
                  <div className="text-xs text-slate-400">TAX</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-white font-mono text-sm hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2" style={{ borderColor: accentColor }}>
                  <Download className="w-4 h-4" />
                  Install Bundle
                </button>
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedCombo, null, 2))} className="px-4 py-3 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MiniComboCard: React.FC<{ combo: Combo; accentColor: string }> = ({ combo, accentColor }) => (
  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-purple-500/30 transition-colors group" style={{ borderColor: combo.featured ? accentColor : undefined }}>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-bold text-white text-sm">{combo.name}</h4>
      {combo.featured && <Star className="w-4 h-4 text-gold" />}
    </div>
    <p className="text-slate-400 text-xs mb-2 line-clamp-1">{combo.desc}</p>
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded" style={{ color: accentColor }}>PLT: {combo.plt}</span>
      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">{combo.items.length} items</span>
    </div>
  </div>
);

const ComboCard: React.FC<{ combo: Combo; accentColor: string; onSelect: (combo: Combo) => void }> = ({ combo, accentColor, onSelect }) => (
  <div className={`group p-4 bg-slate-900/50 border rounded-2xl transition-all hover:scale-[1.02] ${combo.featured ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-800 hover:border-purple-500/30'}`} style={{ borderColor: combo.featured ? accentColor : undefined }}>
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="w-12 h-12 rounded-xl bg-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
        <Gem className="w-6 h-6" style={{ color: accentColor }} />
      </div>
      {combo.featured && <Star className="w-5 h-5 text-gold mt-1" />}
    </div>
    <h3 className="font-display font-bold text-white mb-1">{combo.name}</h3>
    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{combo.desc}</p>
    <div className="flex items-center justify-between mb-3">
      <div className="text-xs font-mono" style={{ color: accentColor }}>PLT: {combo.plt}</div>
      <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-400 capitalize">{combo.category}</span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onSelect(combo)}
        className="flex-1 px-3 py-2 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
      >
        View Details
      </button>
      <button className="flex-1 px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center justify-center gap-1" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}80)`, color: '#000' }}>
        <ArrowRight className="w-3 h-3" />
        Install
      </button>
    </div>
  </div>
);