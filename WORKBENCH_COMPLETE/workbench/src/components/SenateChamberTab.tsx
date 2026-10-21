import React, { useEffect, useState, useRef } from "react";
import { Columns, CheckCircle2, X, ShieldCheck, Sparkles, UserCheck, Bot, Lock, Code, Vote } from "lucide-react";

export type CouncilMessage = {
  type: "council_speech";
  chamber: string;
  speaker: string;
  speakerRole: string;
  vote: string;
  message: string;
  pltImpact?: { profit?: number; love?: number; tax?: number };
  timestamp: number;
  color?: string;
};

type SenateChamberProps = {
  accentColor?: string;
};

const CHAMBERS = [
  { key: "initial_position", label: "1. Legislative Proposals", speakerHint: "Profit & Smith" },
  { key: "challenge", label: "2. Safety & Tax Audits", speakerHint: "Tax Tribune" },
  { key: "verdict", label: "3. Chancellor's Final Verdict", speakerHint: "GSK Chancellor" },
];

const VOTE_COLORS: Record<string, string> = {
  approve: "text-emerald-300",
  veto: "text-red-400",
  caution: "text-amber-300",
  statement: "text-slate-200",
  gavel: "text-cyan-300",
  plaque: "text-purple-300",
  challenge: "text-orange-400",
  support: "text-blue-300"
};

const SEATED_AGENTS = [
  { id: "profit", name: "Profit Prime", role: "Neo - Genesis Agent", color: "#00ff41", icon: Bot },
  { id: "smith", name: "Agent Smith", role: "Qwen Architect", color: "#38bdf8", icon: Bot },
  { id: "chancellor", name: "GSK Chancellor", role: "Dual-Process Gatekeeper", color: "#a855f7", icon: Vote },
  { id: "tax", name: "Tax Tribune", role: "PLT Law Guardian", color: "#f59e0b", icon: ShieldCheck },
  { id: "craig", name: "Craig (Typist)", role: "Human Sovereign", color: "#ec4899", icon: UserCheck },
];

export const SenateChamberTab: React.FC<SenateChamberProps> = ({ accentColor = "#ec4899" }) => {
  const [messages, setMessages] = useState<CouncilMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Cross-Agent Debate Engine State
  const [topic, setTopic] = useState<string>("");
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [synthesizedCode, setSynthesizedCode] = useState<string>("");
  const [mintStatus, setMintStatus] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/gsk/events");
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === "council_speech") {
          setMessages((prev) => [...prev.slice(-199), data as CouncilMessage]);
          setConnected(true);
        }
        if (data.type === "connected") setConnected(true);
      } catch {}
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Run Multiverse War Room Debate
  const handleConveneDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isDebating) return;
    setIsDebating(true);
    setSynthesizedCode("");
    setMintStatus("");

    try {
      const res = await fetch("/api/profit/senate-debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();

      if (data.success && data.debate) {
        const speeches = data.debate.speeches || [];
        if (data.debate.synthesizedCode) {
          setSynthesizedCode(data.debate.synthesizedCode);
        }

        // Stream speeches one by one around the round table
        for (let i = 0; i < speeches.length; i++) {
          const speech = speeches[i];
          setActiveSpeaker(speech.speaker);
          setMessages((prev) => [
            ...prev,
            {
              type: "council_speech",
              chamber: speech.chamber || "initial_position",
              speaker: speech.speaker,
              speakerRole: speech.role || "Council Member",
              vote: speech.vote || "statement",
              message: speech.message,
              pltImpact: speech.pltImpact,
              timestamp: Date.now(),
              color: speech.color,
            },
          ]);
          await new Promise((r) => setTimeout(r, 1200));
        }
      }
    } catch (err: any) {
      alert(`Debate Convene Error: ${err.message}`);
    } finally {
      setIsDebating(false);
      setActiveSpeaker(null);
    }
  };

  // Mint Approved Code to Soul Chain
  const mintToSoulChain = async () => {
    if (!synthesizedCode || !topic) return;
    setMintStatus("Minting to Soul Chain...");
    try {
      const res = await fetch("/api/profit/soul-chain/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "SENATE_DEED_MINTED",
          title: `Senate Deed: ${topic.slice(0, 50)}`,
          author: "Multiverse Senate Council",
          code: synthesizedCode,
          profit: 1.0,
          love: 1.0,
          tax: 0.1,
        }),
      });
      const data = await res.json();
      if (data.success && data.block) {
        setMintStatus(`Minted to Soul Chain Block #${data.block.index}! 🔒`);
        setTimeout(() => setMintStatus(""), 4000);
      } else {
        setMintStatus(`Minting error: ${data.error}`);
      }
    } catch (e: any) {
      setMintStatus(`Error: ${e.message}`);
    }
  };

  const byChamber = (chamberKey: string) =>
    messages.filter((m) => m.chamber === chamberKey);

  const renderChamber = (c: typeof CHAMBERS[number]) => {
    const msgs = byChamber(c.key);
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-2 border-b border-slate-800 text-xs font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>{c.label}</span>
          <span className="text-[10px] text-slate-600">({msgs.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {msgs.map((m, i) => (
            <div
              key={`${m.timestamp}-${i}`}
              className={`
                rounded-lg p-2.5 text-xs leading-snug transition-all
                ${m.vote === "veto" ? "bg-red-950/40 border border-red-900/50" :
                  m.vote === "approve" ? "bg-emerald-950/40 border border-emerald-900/50" :
                  m.vote === "caution" ? "bg-amber-950/40 border border-amber-900/50" :
                  "bg-slate-900/40 border border-slate-800"}
              `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`font-bold ${VOTE_COLORS[m.vote] || "text-slate-300"}`}>
                  [{m.speaker}]
                </span>
                <span className="text-slate-600">—</span>
                <span className="text-slate-500">{m.speakerRole}</span>
                {m.vote === "veto" && <X className="w-3 h-3 text-red-400" />}
                {m.vote === "approve" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              <div
                className={`
                  ${m.vote === "veto" ? "text-red-200" :
                    m.vote === "approve" ? "text-emerald-200" :
                    m.vote === "caution" ? "text-amber-200" :
                    "text-slate-300"}
                `}
                dangerouslySetInnerHTML={{ __html: m.message }}
              />
              {m.pltImpact && (
                <div className="mt-1 flex gap-3 text-[9px] text-slate-600 font-mono">
                  {m.pltImpact.profit !== undefined && (
                    <span>💰 Profit: {Math.round((m.pltImpact.profit ?? 0) * 100)}%</span>
                  )}
                  {m.pltImpact.love !== undefined && (
                    <span>❤️ Love: {Math.round((m.pltImpact.love ?? 0) * 100)}%</span>
                  )}
                  {m.pltImpact.tax !== undefined && (
                    <span>📊 Tax: {Math.round((m.pltImpact.tax ?? 0) * 100)}%</span>
                  )}
                </div>
              )}
              <div className="mt-1 text-[9px] opacity-40">
                {(new Date(m.timestamp).toLocaleTimeString()).slice(0, 8)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-mono p-4 gap-4 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
            <Columns className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Multiverse Senate War Room & Cross-Agent Council
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                3D ROUND TABLE
              </span>
            </h2>
            <p className="text-slate-400 text-xs">Profit, Agent Smith, GSK Council & Craig debating code architectures live</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${connected ? "text-emerald-400" : "text-red-400"}`} />
          <span className={`text-xs ${connected ? "text-emerald-400" : "text-red-400"}`}>
            {connected ? "COUNCIL EVENT BUS ACTIVE" : "LOCAL MODE"}
          </span>
        </div>
      </div>

      {/* Interactive Hologram War Room Stage */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
        {/* Ambient Ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/20 via-cyan-950/20 to-emerald-950/20 animate-pulse pointer-events-none" />

        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Vote className="w-4 h-4 text-purple-400" /> Multiverse Round Table Council Floor
        </div>

        {/* 5 Seated Council Entities */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap z-10">
          {SEATED_AGENTS.map((agent) => {
            const IconComponent = agent.icon;
            const isSpeaking = activeSpeaker?.toLowerCase().includes(agent.id) || activeSpeaker?.toLowerCase().includes(agent.name.toLowerCase());
            return (
              <div
                key={agent.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                  isSpeaking
                    ? "bg-slate-900 border-2 scale-110 shadow-2xl"
                    : "bg-slate-900/60 border-slate-800 opacity-80"
                }`}
                style={{ borderColor: isSpeaking ? agent.color : undefined, boxShadow: isSpeaking ? `0 0 20px ${agent.color}40` : undefined }}
              >
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative ${isSpeaking ? 'animate-bounce' : ''}`}
                  style={{ borderColor: agent.color, backgroundColor: `${agent.color}15` }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: agent.color }} />
                  {isSpeaking && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs font-bold text-white">{agent.name}</div>
                  <div className="text-[9px] text-slate-400">{agent.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debate Proposal Synthesizer Input */}
      <form onSubmit={handleConveneDebate} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Propose a software architecture or feature to the Senate War Room..."
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none w-full"
          required
        />
        <button
          type="submit"
          disabled={isDebating}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 w-full sm:w-auto whitespace-nowrap"
        >
          <Sparkles className={`w-4 h-4 ${isDebating ? 'animate-spin' : ''}`} />
          {isDebating ? "Council Debating..." : "⚡ Convene Senate Debate"}
        </button>
      </form>

      {/* Synthesized Consensus Code Banner */}
      {synthesizedCode && (
        <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
            <span className="font-bold text-purple-300 text-xs flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-400" /> Senate Approved Consensus Code Artifact
            </span>
            <button
              onClick={mintToSoulChain}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 text-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5" /> Mint to Soul Chain
            </button>
          </div>
          <pre className="p-3 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-200 text-xs whitespace-pre-wrap">
            {synthesizedCode}
          </pre>
          {mintStatus && <div className="text-xs text-emerald-400 animate-pulse">{mintStatus}</div>}
        </div>
      )}

      {/* Live Council Floor 3-Column Display */}
      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-[300px]"
      >
        {CHAMBERS.map((c) => (
          <div key={c.key} className="flex flex-col bg-slate-950/80 border border-slate-800 rounded-2xl">
            {renderChamber(c)}
          </div>
        ))}
      </div>

      <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-[10px] text-slate-500">
        <span>{messages.length} council speeches streamed</span>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            autoScroll
              ? "bg-amber-950/40 text-amber-300 hover:bg-amber-900/40"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
        </button>
      </div>
    </div>
  );
};
