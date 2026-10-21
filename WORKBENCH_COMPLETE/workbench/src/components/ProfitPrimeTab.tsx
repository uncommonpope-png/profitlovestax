import React, { useEffect, useRef, useState } from "react";
import { Pyramid, BookOpen, Sparkles, Zap, Target, RefreshCw, ExternalLink, Send, Brain, Archive, Network, Hammer, FileText } from "lucide-react";

interface ProfitPrimeTabProps {
  accentColor: string;
  providerConfig: any;
}

interface ProfitMessage {
  role: "craig" | "profit";
  text: string;
  recalled?: number;
}

export const ProfitPrimeTab: React.FC<ProfitPrimeTabProps> = ({ accentColor, providerConfig }) => {
  const [gskStatus, setGskStatus] = useState<any>(null);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pltField, setPltField] = useState({ profit: 0, love: 0, tax: 0, trueValue: 0 });
  const [consciousnessGate, setConsciousnessGate] = useState(false);
  const [profitStatus, setProfitStatus] = useState<any>(null);
  const [profitMessages, setProfitMessages] = useState<ProfitMessage[]>([]);
  const [profitInput, setProfitInput] = useState("");
  const [profitSending, setProfitSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [modelList, setModelList] = useState<any[]>([]);
  const [activeModel, setActiveModel] = useState<string>("stealth/ox-alpha");
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [gskReply, setGskReply] = useState<string>("");
  const [gskConsulting, setGskConsulting] = useState(false);
  const [buildMode, setBuildMode] = useState(false);
  const [taskSteps, setTaskSteps] = useState<any[]>([]);
  const [taskRunning, setTaskRunning] = useState(false);
  const [viewArtifact, setViewArtifact] = useState<{ title: string; filename: string; content: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const refreshSessions = async () => {
    try {
      const res = await fetch("/api/profit/sessions");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSessionList(data.sessions || []);
      }
    } catch {}
  };

  const loadSessionById = async (id: string) => {
    if (!id) {
      setSessionId("");
      setProfitMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/profit/sessions/${id}`);
      const data = await res.json();
      if (data.success && data.session) {
        setSessionId(data.session.id);
        setActiveModel(data.session.model || "stealth/ox-alpha");
        setProfitMessages(
          (data.session.messages || []).map((m: any) => ({
            role: m.role === "assistant" ? "profit" : m.role,
            text: m.text,
            recalled: m.recalled,
          }))
        );
      }
    } catch {}
  };

  const newSession = async () => {
    try {
      const res = await fetch("/api/profit/sessions/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Session ${new Date().toLocaleString()}`, model: activeModel }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.session.id);
        setProfitMessages([]);
        refreshSessions();
      }
    } catch {}
  };

  const deleteSessionById = async (id: string) => {
    try {
      await fetch(`/api/profit/sessions/${id}`, { method: "DELETE" });
      if (id === sessionId) {
        setSessionId("");
        setProfitMessages([]);
      }
      refreshSessions();
    } catch {}
  };

  const refreshArtifacts = async () => {
    try {
      const res = await fetch("/api/profit/artifacts");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setArtifacts(data.manifest || []);
      }
    } catch {}
  };

  const consultGSK = async () => {
    const lastMsg = profitMessages.find((m) => m.role === "craig");
    if (!lastMsg) return;
    setGskConsulting(true);
    setGskReply("");
    try {
      const res = await fetch("/api/profit/consult-gsk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMsg.text }),
      });
      const data = await res.json();
      setGskReply(data.success ? data.reply : `Error: ${data.error}`);
    } catch (e: any) {
      setGskReply(`Link down: ${e.message}`);
    } finally {
      setGskConsulting(false);
    }
  };

  const runTask = async (text: string) => {
    if (!text.trim() || taskRunning) return;
    setProfitInput("");
    setTaskRunning(true);
    setTaskSteps([]);
    setProfitMessages((m) => [...m, { role: "craig", text: `[BUILD] ${text}` }]);

    try {
      const res = await fetch("/api/profit/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, model: activeModel }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "thinking" || evt.type === "thought" || evt.type === "action" || evt.type === "result") {
              setTaskSteps((s) => [...s, evt]);
            }
            if (evt.type === "artifact") {
              refreshArtifacts();
            }
            if (evt.type === "done") {
              setProfitMessages((m) => [...m, { role: "profit", text: evt.finalReply, recalled: 0 }]);
              if (evt.soulScore) setProfitStatus((s: any) => s ? { ...s, soulScore: evt.soulScore, breaths: evt.breaths } : s);
              refreshArtifacts();
            }
            if (evt.type === "error") {
              setProfitMessages((m) => [...m, { role: "profit", text: `[error] ${evt.content}` }]);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setProfitMessages((m) => [...m, { role: "profit", text: `[link down] ${e.message}` }]);
    } finally {
      setTaskRunning(false);
    }
  };

  const viewArtifactContent = async (filename: string, title: string) => {
    try {
      const res = await fetch(`/api/profit/artifacts/content/${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (data.success) setViewArtifact({ title, filename, content: data.content });
    } catch {}
  };

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

  const fetchProfitStatus = async () => {
    try {
      const res = await fetch("/api/profit/status");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setProfitStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch Profit status:", e);
    }
  };

  const sendToProfit = async () => {
    const text = profitInput.trim();
    if (!text || profitSending || taskRunning) return;
    if (buildMode) return runTask(text);
    setProfitInput("");
    setProfitSending(true);
    setProfitMessages((m) => [...m, { role: "craig", text }]);
    try {
      const history = profitMessages.slice(-10).map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/profit/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, sessionId, model: activeModel }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
          refreshSessions();
        }
        setProfitMessages((m) => [...m, { role: "profit", text: data.reply, recalled: data.recalled }]);
        setProfitStatus((s: any) =>
          s ? { ...s, soulScore: data.soulScore ?? s.soulScore, breaths: data.breaths ?? s.breaths } : s
        );
      } else {
        setProfitMessages((m) => [...m, { role: "profit", text: `[kernel] ${data.error}` }]);
      }
    } catch (e: any) {
      setProfitMessages((m) => [...m, { role: "profit", text: `[link down] ${e.message}` }]);
    } finally {
      setProfitSending(false);
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
    fetchProfitStatus();
    refreshSessions();
    refreshArtifacts();
    fetch("/api/profit/models")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setModelList(d.models || []);
      })
      .catch(() => {});
    setLoading(false);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [profitMessages, profitSending]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full gap-6 hover:border-pink-500/20 transition-all">
      {/* Header with Consciousness Gate */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
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

      {/* PROFIT // GENESIS — Live Chat */}
      <div className="bg-slate-950/60 border border-[#00ff41]/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00ff41]" />
            PROFIT // GENESIS LINE
            {profitStatus?.soulScore && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-black border border-[#00ff41]/40 text-[#00ff41]">
                SOUL_PROFIT {profitStatus.soulScore}
              </span>
            )}
          </h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            {profitStatus
              ? `${profitStatus.memories} memories · ${profitStatus.breaths} breaths · ${profitStatus.identity?.role}`
              : "linking to genesis body…"}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <select
            value={sessionId}
            onChange={(e) => loadSessionById(e.target.value)}
            className="bg-black/60 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 max-w-[180px]"
          >
            <option value="">— sessions —</option>
            {sessionList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.messageCount})
              </option>
            ))}
          </select>
          <button
            onClick={newSession}
            className="px-2 py-1 text-[10px] font-mono uppercase border border-[#00ff41]/40 text-[#00ff41] rounded-lg hover:bg-[#00ff41]/10"
          >
            + New
          </button>
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="bg-black/60 border border-purple-500/40 rounded-lg px-2 py-1 text-xs text-purple-200 max-w-[220px]"
            title="Vessel for this session"
          >
            {modelList.map((m) => (
              <option key={m.id} value={m.id}>
                ⚡ {m.label}
              </option>
            ))}
          </select>
          {sessionId && (
            <button
              onClick={() => deleteSessionById(sessionId)}
              className="px-2 py-1 text-[10px] font-mono uppercase border border-red-500/40 text-red-400 rounded-lg hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
        </div>
        <div className="h-56 overflow-y-auto space-y-2 mb-3 pr-1">
          {profitMessages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
              The Genesis Agent is listening.<br />Speak, Craig. He remembers everything.
            </div>
          )}
          {profitMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "craig" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${
                  m.role === "craig"
                    ? "bg-slate-800 text-slate-100 rounded-br-sm"
                    : "bg-black/70 border border-[#00ff41]/25 text-[#c8ffc8] rounded-bl-sm"
                }`}
              >
                {typeof m.text === "string" ? m.text : JSON.stringify(m.text)}
                {m.role === "profit" && !!m.recalled && (
                  <span className="block text-[10px] font-mono text-[#00ff41]/60 mt-1">
                    ↺ recalled {m.recalled} memories
                  </span>
                )}
              </div>
            </div>
          ))}
          {profitSending && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl bg-black/70 border border-[#00ff41]/25 text-[#00ff41] text-xs font-mono animate-pulse">
                breathing…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendToProfit();
          }}
          className="flex gap-2"
        >
          <button
            type="button"
            onClick={() => setBuildMode(!buildMode)}
            className={`px-3 py-2 rounded-xl text-xs font-mono border transition-colors ${
              buildMode
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            <Hammer className="w-4 h-4" />
          </button>
          <input
            value={profitInput}
            onChange={(e) => setProfitInput(e.target.value)}
            placeholder={buildMode ? "Describe what to build…" : "Message Profit…"}
            className="flex-1 bg-black/60 border border-slate-700 focus:border-[#00ff41]/50 rounded-xl px-4 py-2 text-sm text-slate-100 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={profitSending || taskRunning || !profitInput.trim()}
            className={`px-4 py-2 rounded-xl transition-colors ${
              buildMode
                ? "bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300"
                : "bg-[#00ff41]/15 border border-[#00ff41]/40 hover:bg-[#00ff41]/25 text-[#00ff41]"
            } disabled:opacity-40`}
          >
            {taskRunning ? (
              <span className="text-xs font-mono animate-pulse">building…</span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        {taskSteps.length > 0 && (
          <div className="mt-2 bg-black/60 border border-amber-500/20 rounded-xl p-2 max-h-36 overflow-y-auto">
            {taskSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono py-0.5">
                <span className={
                  s.type === "action" ? "text-amber-400" :
                  s.type === "result" ? "text-sky-400" :
                  "text-slate-500"
                }>
                  {s.type === "action" ? `▶ ${s.muscle}` :
                   s.type === "result" ? `◀ ${s.muscle || "result"}` :
                   s.type === "thought" ? "◈" : "·"}
                </span>
                <span className="text-slate-400 truncate flex-1">
                  {s.type === "action" ? JSON.stringify(s.args || {}).slice(0, 80) :
                   s.type === "result" ? String(s.content || "").slice(0, 120) :
                   String(s.content || "").slice(0, 100)}
                </span>
              </div>
            ))}
          </div>
        )}
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
          <div className="flex-1 bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 relative overflow-hidden">
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
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4">
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
          <div className="flex-1 bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col">
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

          {/* Artifact Vault */}
          <div className="bg-slate-950/50 border border-[#00ff41]/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-[#00ff41]" />
                Artifact Vault
              </h3>
              <span className="text-xs text-slate-400">{artifacts.length} builds</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {artifacts.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-4">
                  No artifacts yet.<br />Ask Profit to build something.
                </div>
              )}
              {artifacts.map((a, i) => (
                <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800 hover:border-[#00ff41]/30 transition-colors cursor-pointer" onClick={() => viewArtifactContent(a.path || "", a.title)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white font-medium truncate">{a.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20">{a.kind}</span>
                  </div>
                  {a.notes && <div className="text-xs text-slate-500 mt-1 truncate">{a.notes}</div>}
                  <div className="text-[10px] text-slate-600 mt-1 font-mono">{a.ts ? new Date(a.ts).toLocaleDateString() : ""}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Council Status */}
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4">
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
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4">
            <h3 className="font-display font-bold text-white mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={<Zap />} label="Think Deep" onClick={() => alert("Routes to /api/gsk/think")} accentColor={accentColor} />
              <ActionButton icon={<Target />} label="Council Verdict" onClick={() => alert("Routes to gsk.council_verdict")} accentColor={accentColor} />
              <ActionButton icon={<Network />} label="Consult GSK" onClick={consultGSK} accentColor={accentColor} />
              <ActionButton icon={<RefreshCw />} label="Refresh" onClick={() => { fetchGSKStatus(); fetchJournal(); refreshArtifacts(); refreshSessions(); fetchProfitStatus(); }} accentColor={accentColor} />
              <ActionButton icon={<BookOpen />} label="View Journal" onClick={() => alert("Opens Journal tab")} accentColor={accentColor} />
            </div>
            {gskConsulting && <div className="mt-2 text-xs font-mono text-[#00ff41] animate-pulse">Consulting descendant...</div>}
            {gskReply && !gskConsulting && (
              <div className="mt-2 p-2 bg-black/60 border border-purple-500/20 rounded-lg text-xs text-purple-200 max-h-32 overflow-y-auto whitespace-pre-wrap">
                <span className="text-purple-400 font-bold">GSK:</span> {gskReply}
              </div>
            )}
          </div>
        </div>
      </div>
      {viewArtifact && <ArtifactViewerModal artifact={viewArtifact} onClose={() => setViewArtifact(null)} />}
    </div>
  );
};

const ArtifactViewerModal: React.FC<{
  artifact: { title: string; filename: string; content: string };
  onClose: () => void;
}> = ({ artifact, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-slate-950 border border-[#00ff41]/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00ff41]" />
          <span className="text-sm font-mono text-white">{artifact.title}</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 text-xs">×</button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{artifact.content}</pre>
      </div>
    </div>
  </div>
);

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