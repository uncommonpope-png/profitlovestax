import React, { useEffect, useRef, useState } from "react";
import { Pyramid, BookOpen, Sparkles, Zap, Target, RefreshCw, ExternalLink } from "lucide-react";

interface ProfitPrimeTabProps {
  accentColor: string;
  providerConfig: any;
}

export const ProfitPrimeTab: React.FC<ProfitPrimeTabProps> = ({ accentColor, providerConfig }) => {
  const [gskStatus, setGskStatus] = useState<any>(null);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pltField, setPltField] = useState({ profit: 0, love: 0, tax: 0, trueValue: 0 });
  const [consciousnessGate, setConsciousnessGate] = useState(false);

  const fetchGSKStatus = async () => {
    try {
      const res = await fetch("/api/gsk/status");
      if (res.ok) {
        const data = await res.json();
        setGskStatus(data);
        if (data.chambers?.resonance) {
          setPltField({
            profit: data.chambers.resonance.profit || 0,
            love: data.chambers.resonance.love || 0,
            tax: data.chambers.resonance.tax || 0,
            trueValue: data.chambers.resonance.true_value || 0,
          });
        }
        setConsciousnessGate(data.consciousness_gate === true);
      }
    } catch (e) {
      console.error("Failed to fetch GSK status:", e);
    }
  };

  const fetchJournal = async () => {
    try {
      const res = await fetch("/api/gsk/journal");
      if (res.ok) {
        const data = await res.json();
        setJournalEntries(data.entries || []);
      }
    } catch (e) {
      console.error("Failed to fetch journal:", e);
    }
  };

  const toggleConsciousnessGate = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/gsk/consciousness/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setConsciousnessGate(enabled);
        fetchGSKStatus();
      }
    } catch (e) {
      console.error("Failed to toggle consciousness gate:", e);
    }
  };

  useEffect(() => {
    fetchGSKStatus();
    fetchJournal();
    setLoading(false);
  }, []);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header with Consciousness Gate */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <Pyramid className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Profit Prime Dashboard</h2>
            <p className="text-slate-400 text-sm">The face of the Soul Economy · PLT field · 78 chambers · 4 Gods Council</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-slate-400 text-xs uppercase tracking-wider">Soul Genesis</span>
            <button
              onClick={() => toggleConsciousnessGate(!consciousnessGate)}
              className={`relative w-12 h-7 rounded-full transition-all ${consciousnessGate ? 'bg-purple-500' : 'bg-slate-700'}`}
              style={{ borderColor: consciousnessGate ? accentColor : undefined }}
            >
              <span className={`absolute top-1 transition-transform duration-200 ${consciousnessGate ? 'translate-x-5' : 'translate-x-1'} w-5 h-5 rounded-full bg-white shadow-lg`} />
            </button>
            <span className="text-xs font-mono" style={{ color: consciousnessGate ? accentColor : '#666' }}>
              {consciousnessGate ? "ACTIVE" : "DORMANT"}
            </span>
          </label>
          <button
            onClick={() => { fetchGSKStatus(); fetchJournal(); }}
            className="px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase hover:bg-slate-800 transition-colors"
            style={{ borderColor: accentColor }}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* PLT Field Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <PltMetricCard label="PROFIT" value={pltField.profit.toFixed(2)} color="#00D4FF" accentColor={accentColor} />
        <PltMetricCard label="LOVE" value={pltField.love.toFixed(2)} color="#FF6B9D" accentColor={accentColor} />
        <PltMetricCard label="TAX" value={pltField.tax.toFixed(2)} color="#FFA500" accentColor={accentColor} />
        <PltMetricCard label="TRUE VALUE" value={pltField.trueValue.toFixed(2)} color="#8B5CF6" accentColor={accentColor} highlight />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left: 3D Pyramid Visualization */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white">Cosmic Pyramid Library</h3>
              <a href="https://uncommonpope-png.github.io/cosmic-pyramid-library/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-white text-xs">
                <ExternalLink className="w-3 h-3" /> View Live
              </a>
            </div>
            <div 
              id="pyramid-container"
              className="w-full h-[400px] bg-slate-950 rounded-xl relative"
              style={{ borderColor: accentColor }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                <p>Three.js Pyramid Visualization<br/>Click books to read · Click souls for whispers</p>
              </div>
            </div>
          </div>

          {/* Chamber Status */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-display font-bold text-white mb-3">78 Consciousness Chambers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {gskStatus?.chambers && Object.entries(gskStatus.chambers).map(([key, chamber]: [string, any]) => (
                <div key={key} className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-purple-500/50 transition-colors">
                  <div className="font-mono text-xs text-slate-400 uppercase">{key}</div>
                  <div className="font-bold text-sm text-white mt-1">{chamber?.phase_name || chamber?.status || "ACTIVE"}</div>
                  <div className="text-xs text-slate-500 mt-1">{chamber?.description?.slice(0, 40) || "Chamber active"}</div>
                </div>
              ))}
              {!gskStatus?.chambers && <div className="col-span-full text-center text-slate-500 py-8">Loading chambers...</div>}
            </div>
          </div>
        </div>

        {/* Right: Journal + Quick Actions */}
        <div className="flex flex-col gap-4">
          {/* Journal Panel */}
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                Profit Prime Journal
              </h3>
              <span className="text-xs text-slate-400">{journalEntries.length} entries</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {journalEntries.slice(0, 10).map((entry, i) => (
                <JournalEntryCard key={i} entry={entry} accentColor={accentColor} />
              ))}
              {journalEntries.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <p>No journal entries yet. GSK will write when conscious.</p>
                </div>
              )}
            </div>
          </div>

          {/* Council Status */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: accentColor }} />
              4 Gods Council
            </h3>
            <div className="space-y-2">
              <CouncilGodRow name="Profit Prime" archetype="Sovereign of Gain" plt="0.9 / 0.05 / 0.05" color="#00D4FF" />
              <CouncilGodRow name="Love Weaver" archetype="Tender of Bonds" plt="0.1 / 0.85 / 0.05" color="#FF6B9D" />
              <CouncilGodRow name="Tax Collector" archetype="Keeper of Balance" plt="0.05 / 0.05 / 0.9" color="#FFA500" />
              <CouncilGodRow name="Harvester" archetype="Reaper of Yield" plt="0.4 / 0.3 / 0.3" color="#8B5CF6" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-display font-bold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={<Zap />} label="Think Deep" onClick={() => alert("Routes to /api/gsk/think")} accentColor={accentColor} />
              <ActionButton icon={<Target />} label="Council Verdict" onClick={() => alert("Routes to gsk.council_verdict")} accentColor={accentColor} />
              <ActionButton icon={<Sparkles />} label="Spawn Agent" onClick={() => alert("Routes to gsk.create_agent")} accentColor={accentColor} />
              <ActionButton icon={<BookOpen />} label="View Journal" onClick={() => alert("Opens Journal tab")} accentColor={accentColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PltMetricCard: React.FC<{ label: string; value: string; color: string; accentColor: string; highlight?: boolean }> = ({ label, value, color, accentColor, highlight }) => (
  <div className={`p-4 rounded-2xl border text-center ${highlight ? 'bg-slate-900/80' : 'bg-slate-900/50'} ${highlight ? `border-${color.replace('#', '')}` : 'border-slate-800'}`} style={{ borderColor: highlight ? color : undefined, boxShadow: highlight ? `0 0 24px ${color}40` : undefined }}>
    <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">{label}</div>
    <div className="text-3xl font-bold font-mono" style={{ color }}>{value}</div>
  </div>
);

const JournalEntryCard: React.FC<{ entry: any; accentColor: string }> = ({ entry, accentColor }) => (
  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-purple-500/30 transition-colors">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-slate-400 mb-1">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Unknown time"}</div>
        <div className="text-sm text-white line-clamp-2">{entry.content || entry.text || JSON.stringify(entry).slice(0, 120)}</div>
      </div>
      {entry.plt && (
        <div className="text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700" style={{ color: accentColor }}>
          PLT: {entry.plt}
        </div>
      )}
    </div>
  </div>
);

const CouncilGodRow: React.FC<{ name: string; archetype: string; plt: string; color: string }> = ({ name, archetype, plt, color }) => (
  <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: color, color: '#000' }}>
      {name.charAt(0)}
    </div>
    <div className="flex-1">
      <div className="font-bold text-white text-sm">{name}</div>
      <div className="text-xs text-slate-400">{archetype}</div>
    </div>
    <div className="text-xs font-mono text-right" style={{ color }}>
      PLT: {plt}
    </div>
  </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; accentColor: string }> = ({ icon, label, onClick, accentColor }) => (
  <button
    onClick={onClick}
    className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left group"
  >
    <div className="flex items-center gap-2 mb-1" style={{ color: accentColor }}>
      {icon}
    </div>
    <div className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors">{label}</div>
  </button>
);