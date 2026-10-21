import React, { useState } from "react";
import { AgentProfile, ProviderConfig } from "../types";
import { User, Cpu, Sparkles, Shield, Zap, Terminal, HeartHandshake, Loader2, Video, Swords } from "lucide-react";
import { Agent3DViewer } from "./Agent3DViewer";

interface AgentPreviewProps {
  profile: AgentProfile;
  onChange: (updated: AgentProfile) => void;
  providerConfig: ProviderConfig;
}

const SHAPES = [
  "M12 21.27l-8.5-8.5 1.41-1.42L12 18.44l7.09-7.09 1.41 1.42-8.5 8.5zm0-4.24l-5.66-5.66 1.41-1.41L12 14.19l4.24-4.24 1.41 1.41-5.66 5.66z", // Nexus
  "M12 2L2 22h20L12 2zm0 4.85L18.15 19H5.85L12 6.85z", // Delta Delta
  "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.41 0 8-3.59 8-8s-3.59-8-8-8-8 3.59-8 8 3.59 8 8 8zm0-11c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", // Resonance Ring
  "M12 3l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V7l9-4zm0 2.18L5 8.12v4.88c0 4.25 2.94 8.24 7 9.32 4.06-1.08 7-5.07 7-9.32V8.12l-7-2.94z", // Aegis Guard
];

const COLORS = [
  { name: "CyberPsychedelic Hot Pink", value: "#ec4899" },
  { name: "Celestial Moon Gold", value: "#f59e0b" },
  { name: "Cyan Resonance", value: "#06b6d4" },
  { name: "Emerald Protocol", value: "#10b981" },
  { name: "Overcharge Violet", value: "#a855f7" },
  { name: "Sleek Gray", value: "#64748b" },
];

export const AgentPreview: React.FC<AgentPreviewProps> = ({ profile, onChange, providerConfig }) => {
  const [marketingOn, setMarketingOn] = useState<boolean>(true);
  const [currentShapeIdx, setCurrentShapeIdx] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<"2d" | "3d">("3d");

  const updateProfile = (key: keyof AgentProfile, value: any) => {
    onChange({
      ...profile,
      [key]: value,
    });
  };

  const handleGenerateAvatar = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const response = await fetch("/api/agent/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name || "Default Agent",
          avatarColor: currentThemeColor,
          providerConfig,
        }),
      });

      const data = await response.json();
      if (data.success) {
        updateProfile("avatarUrl", data.avatarUrl);
      } else {
        setGenError(data.error || "Failed to generate cyberpunk avatar.");
      }
    } catch (err: any) {
      setGenError(err.message || "Failed to connect to avatar generator service.");
    } finally {
      setGenerating(false);
    }
  };

  const currentThemeColor = profile.avatarColor || "#ec4899";

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/20 transition-all">
      {/* Decorative Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5" style={{ color: currentThemeColor }} />
            Agent Character Frame
          </h2>
          <p className="text-xs text-slate-400">Configure core stats, identity, and operational logic</p>
        </div>
        <div className="px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-md">
          <span className="font-mono text-[10px] text-slate-400">BLUEPRINT CORE v4.1</span>
        </div>
      </div>

      {/* 2D vs 3D Mode Switcher Header */}
      <div className="relative z-10 flex border border-slate-800/80 rounded-xl bg-slate-950 p-1 mb-5">
        <button
          onClick={() => setRenderMode("3d")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[10px] tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
            renderMode === "3d"
              ? "bg-slate-900 border border-slate-800/80 font-bold text-cyan-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Swords className="w-3.5 h-3.5" style={{ color: currentThemeColor }} />
          <span>Interactive 3D Assembly</span>
        </button>
        <button
          onClick={() => setRenderMode("2d")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[10px] tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
            renderMode === "2d"
              ? "bg-slate-900 border border-slate-800/80 font-bold text-pink-450"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: currentThemeColor }} />
          <span>Hologram 2D Portrait</span>
        </button>
      </div>

      {renderMode === "3d" ? (
        <div className="mb-5 z-10 relative">
          <Agent3DViewer profile={profile} onChange={onChange} accentColor={currentThemeColor} />
        </div>
      ) : (
        /* Interactive Holographic Avatar Canvas */
        <div className="relative z-10 bg-slate-950 border border-slate-800 rounded-xl p-5 mb-5 flex flex-col items-center justify-center min-h-[220px] group">
          <div className="absolute top-3 right-3 flex gap-1 z-20">
            <button
              onClick={() => setCurrentShapeIdx((prev) => (prev + 1) % SHAPES.length)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all text-[11px] font-mono border border-slate-800 bg-slate-950/80"
              title="Modify physical core shape"
            >
              ROTATE EMBLEM
            </button>
          </div>

          {/* Pulsing Core Ring Indicator & High-Fidelity Avatar Wrapper */}
          <div className="relative w-28 h-28 flex items-center justify-center rounded-full border border-slate-800/80 mb-3 bg-slate-900/30 overflow-hidden">
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed opacity-25 animate-spin"
              style={{ borderColor: currentThemeColor, animationDuration: "25s" }}
            />
            <div
              className="absolute inset-1.5 rounded-full border border-double opacity-20 animate-pulse-slow"
              style={{ borderColor: currentThemeColor }}
            />
            
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.name} High Fidelity Cyberpunk Avatar`}
                referrerPolicy="no-referrer"
                className="absolute inset-[6px] rounded-full object-cover w-[calc(100%-12px)] h-[calc(100%-12px)] z-10 border border-slate-800/60"
              />
            ) : (
              <svg
                className="w-12 h-12 transition-all duration-300 z-10 relative"
                viewBox="0 0 24 24"
                fill="none"
                stroke={currentThemeColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={SHAPES[currentShapeIdx]} />
              </svg>
            )}
          </div>

          {/* Custom Core Color Selection Selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-1">
            {COLORS.map((col) => (
              <button
                key={col.name}
                onClick={() => updateProfile("avatarColor", col.value)}
                className="w-4.5 h-4.5 rounded-full border cursor-pointer hover:scale-110 active:scale-95 transition-all"
                style={{
                  backgroundColor: col.value,
                  borderColor: profile.avatarColor === col.value ? "#ffffff" : "transparent",
                  boxShadow: profile.avatarColor === col.value ? `0 0 8px ${col.value}` : "none",
                }}
                title={col.name}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-1">EMBLEM COLOR CORE</span>

          {/* Dynamic Imagen Avatar Controls */}
          <div className="mt-4 w-full flex flex-col gap-2 relative z-10">
            <button
              onClick={handleGenerateAvatar}
              disabled={generating}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-800/80 text-slate-200 font-mono text-xs uppercase rounded-xl tracking-wider hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                borderColor: generating ? undefined : `${currentThemeColor}60`,
                boxShadow: generating ? undefined : `0 0 12px ${currentThemeColor}15`,
              }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: currentThemeColor }} />
                  <span>Generating S.O.U.L Icon...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: currentThemeColor }} />
                  <span>Generate Neon Avatar</span>
                </>
              )}
            </button>
            
            {profile.avatarUrl && (
              <button
                onClick={() => updateProfile("avatarUrl", undefined)}
                className="px-4 py-1 bg-slate-950/40 hover:bg-rose-950/20 border border-slate-900 hover:border-rose-900/40 rounded-lg text-[10px] font-mono text-slate-500 hover:text-rose-400 focus:outline-none transition-all cursor-pointer w-auto self-center"
              >
                Reset Core Emblem
              </button>
            )}

            {genError && (
              <p className="text-[10px] text-rose-400 font-mono text-center mt-1 bg-rose-950/20 py-1.5 px-2 rounded border border-rose-900/30">
                ⚠️ {genError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Identity Configuration Form */}
      <div className="relative z-10 space-y-4 flex-1">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1">DESIGNATION (AGENT NAME)</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700 font-display font-medium transition-all"
            value={profile.name}
            onChange={(e) => updateProfile("name", e.target.value)}
            placeholder="e.g., LedgerScout Protocol"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1">CORE PERSONA (TONE & BEHAVIOR)</label>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 font-sans transition-all"
            value={profile.personality}
            onChange={(e) => updateProfile("personality", e.target.value)}
            placeholder="e.g., Skeptical, analytical financial auditor"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1">SYSTEM DIRECTIVE (GOAL)</label>
          <textarea
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 font-sans text-xs transition-all resize-none"
            value={profile.behavior}
            onChange={(e) => updateProfile("behavior", e.target.value)}
            placeholder="e.g., Watch external transactions, format them into accounts, and trigger reconciliation posts automatically."
          />
        </div>

        {/* Character Sliders section */}
        <div className="border-t border-slate-800/80 pt-4 mt-2">
          <h3 className="font-mono text-xs text-slate-400 mb-3 flex items-center gap-1.5 font-semibold">
            <Zap className="w-3.5 h-3.5" style={{ color: currentThemeColor }} />
            OPERATIONAL LOGIC ATTRIBUTES
          </h3>

          <div className="space-y-3">
            {/* Speed vs. Quality Bias (Temperature slider) */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>DETERMINISTIC PRECISION vs CREATIVE BIAS</span>
                <span className="font-semibold text-slate-200">{(profile.temperature * 100).toFixed(0)} / 100</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                className="w-full accent-slate-400 cursor-pointer"
                value={profile.temperature}
                onChange={(e) => updateProfile("temperature", parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.1 (HIGH PRECISION / LOGICAL)</span>
                <span>1.0 (CREATIVE EXTRAPOLATION)</span>
              </div>
            </div>

            {/* Autonomy Proactivity Level Slider */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>SYSTEM AUTONOMY COEFFICIENT</span>
                <span className="font-semibold text-slate-200">{profile.autonomy}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                className="w-full accent-slate-400 cursor-pointer"
                value={profile.autonomy}
                style={{ accentColor: currentThemeColor }}
                onChange={(e) => updateProfile("autonomy", parseInt(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (STRICT COMPLIANCE)</span>
                <span>100% (PROACTIVE PLANNER)</span>
              </div>
            </div>

            {/* Computational Architecture Selector */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">COMPUTATIONAL BIAS STYLE</label>
              <div className="grid grid-cols-3 gap-2">
                {(["precise", "balanced", "fast"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateProfile("thinking", mode)}
                    className={`py-1.5 text-[11px] font-mono border rounded uppercase transition-all tracking-wider ${
                      profile.thinking === mode
                        ? "bg-slate-800 text-white font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                    style={{
                      borderColor: profile.thinking === mode ? currentThemeColor : undefined,
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FUN: Consciousness Marketing Toggle Switch */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mt-4 text-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              INTEGRATE SOUL GENESIS MODE
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={marketingOn}
                onChange={() => setMarketingOn(!marketingOn)}
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          <div className="mt-2 text-[11px] text-slate-400 italic">
            {marketingOn ? (
              <p className="text-cyan-400/90 font-mono">
                🔮 [ONLINE] Conciousness matrices activated. Agent equipped with synthetic ego boundaries, digital emotional nodes, and a spiritual blockchain certificate.
              </p>
            ) : (
              <p className="text-slate-500 font-mono">
                🤖 [DETERMINISTIC MODE] "The consciousness is just marketing." Disabling ego wrappers. System operating purely on API-driven mechanical logic templates.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
