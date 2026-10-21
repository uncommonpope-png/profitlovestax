import React, { useEffect, useMemo, useState } from "react";
import { Bomb, Wrench, Brain, Sparkles, Play, Search, RefreshCw, Activity, Shield, Clock, Zap, Users } from "lucide-react";

interface OmniTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface MemoryEntry {
  id?: string;
  title?: string;
  content?: string;
  type?: string;
  createdAt?: string;
}

type Panel = "tools" | "memory" | "skills" | "caller" | "providers" | "guardrails" | "cache" | "combos" | "agents";

interface ProviderStat {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  avgLatencyMs?: number;
  [k: string]: any;
}

interface Guardrail {
  name: string;
  enabled: boolean;
  priority?: number;
}

interface PowerTabProps {
  accentColor: string;
}

export const OmniRoutePowerTab: React.FC<PowerTabProps> = ({ accentColor }) => {
  const [panel, setPanel] = useState<Panel>("tools");
  const [tools, setTools] = useState<OmniTool[]>([]);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [memStats, setMemStats] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const [callTool, setCallTool] = useState("");
  const [callArgs, setCallArgs] = useState("{}");
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState("");
  const [providers, setProviders] = useState<ProviderStat[]>([]);
  const [guardrails, setGuardrails] = useState<Guardrail[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [acpAgents, setAcpAgents] = useState<any[]>([]);
  const [a2aStatus, setA2aStatus] = useState<any>(null);
  const [agentSkills, setAgentSkills] = useState<any[]>([]);

  const refreshBody = async () => {
    try {
      const [ps, gr, ca, co, ag, a2, ask] = await Promise.all([
        fetch("/api/omni/provider-stats").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/guardrails").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/cache").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/combos").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/acp/agents").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/a2a/status").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/agent-skills").then((r) => r.json()).catch(() => null),
      ]);
      if (ps?.providers) setProviders(ps.providers);
      if (gr?.guardrails) setGuardrails(gr.guardrails);
      if (ca?.semanticCache) setCacheStats(ca);
      if (co?.combos) setCombos(co.combos);
      if (ag?.agents) setAcpAgents(ag.agents);
      if (a2) setA2aStatus(a2);
      if (ask?.skills) setAgentSkills(ask.skills);
    } catch {}
  };

  const toggleGuardrail = async (name: string, enabled: boolean) => {
    await fetch(`/api/omni/guardrails/${encodeURIComponent(name)}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    }).catch(() => {});
    refreshBody();
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const [t, m, s] = await Promise.all([
        fetch("/api/omni/tools").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/memory").then((r) => r.json()).catch(() => null),
        fetch("/api/omni/skills").then((r) => r.json()).catch(() => null),
      ]);
      if (t?.tools) setTools(t.tools);
      if (m?.data) { setMemories(m.data); setMemStats(m.stats ?? null); }
      if (s?.data) setSkills(s.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); refreshBody(); }, []);

  const filteredTools = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)
    );
  }, [tools, query]);

  const runTool = async () => {
    if (!callTool || calling) return;
    setCalling(true);
    setCallResult("Firing...");
    try {
      let args: any = {};
      try { args = JSON.parse(callArgs || "{}"); } catch { setCallResult("Arguments must be valid JSON"); setCalling(false); return; }
      const r = await fetch("/api/omni/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: callTool, arguments: args }),
      }).then((x) => x.json());
      setCallResult(r.success ? String(r.result).slice(0, 4000) : `FAILED: ${r.error}`);
    } catch (e: any) {
      setCallResult(`Error: ${e.message}`);
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full gap-6 hover:border-pink-500/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/25 to-slate-950 border border-orange-500/40 flex items-center justify-center">
            <Bomb className="w-6 h-6" style={{ color: "#FB923C" }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">OmniRoute Power</h2>
            <p className="text-slate-400 text-sm">{tools.length} MCP tools · memory engine · skills system — the nuclear arsenal</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
        {([
          ["tools", "Tools", Wrench],
          ["memory", "Memory", Brain],
          ["skills", "Skills", Sparkles],
          ["caller", "Fire", Play],
          ["providers", "Providers", Activity],
          ["guardrails", "Rails", Shield],
          ["cache", "Cache", Clock],
          ["combos", "Combos", Zap],
          ["agents", "Agents", Users],
        ] as [Panel, string, any][]).map(([p, label, Icon]) => (
          <button key={p} onClick={() => setPanel(p)} className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${panel === p ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {panel === "tools" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 42 nuclear tools..." className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/40" />
          </div>
          <div className="overflow-y-auto space-y-2 max-h-[28rem] pr-1">
            {filteredTools.map((t) => (
              <div key={t.name} className="p-3 bg-slate-900/70 border-l-2 border-orange-500/40 rounded-r-lg">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-mono font-bold text-white">{t.name}</p>
                  <button onClick={() => { setCallTool(t.name); try { setCallArgs(JSON.stringify(sampleArgs(t.inputSchema), null, 2)); } catch { setCallArgs("{}"); } setPanel("caller"); }} className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25">try</button>
                </div>
                {t.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>}
              </div>
            ))}
            {filteredTools.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No tools match.</p>}
          </div>
        </div>
      )}

      {panel === "memory" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0">
          {memStats && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="Entries" value={String(memStats.total ?? memories.length)} />
              <Stat label="Tokens" value={String(memStats.tokensUsed ?? 0)} />
              <Stat label="Hit Rate" value={`${Math.round((memStats.hitRate ?? 0) * 100)}%`} />
            </div>
          )}
          <div className="overflow-y-auto space-y-2 max-h-72 pr-1">
            {memories.map((m, i) => (
              <div key={i} className="p-3 bg-slate-900/70 border-l-2 border-cyan-500/40 rounded-r-lg">
                <p className="text-sm font-bold text-white">{m.title || m.type || "(untitled)"}</p>
                {m.content && <p className="text-xs text-slate-400 line-clamp-2 mt-1">{String(m.content).slice(0, 200)}</p>}
              </div>
            ))}
            {memories.length === 0 && <p className="text-center text-xs text-slate-500 py-6">Memory engine empty — GSK hasn't stored router-memories yet. Fire a tool that writes one.</p>}
          </div>
        </div>
      )}

      {panel === "skills" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0">
          {skills.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Skills registry empty. Popular defaults available: git, terminal, web... Install via OmniRoute dashboard or a tool call.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-72">
              {skills.map((s: any, i: number) => (
                <div key={i} className="p-3 bg-slate-900/70 border-l-2 border-pink-500/40 rounded-r-lg">
                  <p className="text-sm font-bold text-white">{s.name || s.id}</p>
                  {s.description && <p className="text-xs text-slate-400 line-clamp-1">{s.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {panel === "providers" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {providers.map((p) => {
              const okRate = p.totalRequests ? Math.round((p.successfulRequests / p.totalRequests) * 100) : 0;
              const color = okRate >= 95 ? "text-green-400" : okRate >= 80 ? "text-yellow-400" : "text-red-400";
              return (
                <div key={p.provider} className="p-3 bg-slate-900/70 border-l-2 border-orange-500/40 rounded-r-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white">{p.provider}</p>
                    <span className={`text-xs font-mono font-bold ${color}`}>{okRate}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{p.totalRequests} reqs · {p.avgLatencyMs ?? "?"}ms avg</p>
                </div>
              );
            })}
          </div>
          {providers.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No provider telemetry yet.</p>}
        </div>
      )}

      {panel === "guardrails" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0 overflow-y-auto space-y-2">
          {guardrails.map((g) => (
            <div key={g.name} className="flex items-center justify-between p-3 bg-slate-900/70 rounded-xl">
              <div>
                <p className="text-sm font-mono font-bold text-white">{g.name}</p>
                {g.priority !== undefined && <p className="text-[10px] text-slate-500">priority {g.priority}</p>}
              </div>
              <button onClick={() => toggleGuardrail(g.name, !g.enabled)} className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${g.enabled ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                {g.enabled ? "ACTIVE" : "OFF"}
              </button>
            </div>
          ))}
          {guardrails.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No guardrails configured.</p>}
        </div>
      )}

      {panel === "cache" && cacheStats && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Stat label="Memory Entries" value={String(cacheStats.semanticCache?.memoryEntries ?? 0)} />
            <Stat label="DB Entries" value={String(cacheStats.semanticCache?.dbEntries ?? 0)} />
            <Stat label="Hits" value={String(cacheStats.semanticCache?.hits ?? 0)} />
            <Stat label="Hit Rate" value={`${cacheStats.semanticCache?.hitRate ?? "0"}%`} />
          </div>
          <p className="text-xs text-slate-500">Semantic cache: repeated questions answered from memory — zero tokens, instant. It fills as traffic flows through the body.</p>
        </div>
      )}

      {panel === "combos" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0">
          {combos.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No combos yet. 18 relay strategies await configuration (cheap drafts → smart reviews → free polishes). Coming in Movement V fusion phases.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-72">
              {combos.map((c: any, i: number) => (
                <div key={i} className="p-3 bg-slate-900/70 border-l-2 border-zinc-500/40 rounded-r-lg">
                  <p className="text-sm font-bold text-white">{c.name || c.id}</p>
                  {c.strategy && <p className="text-[10px] text-slate-500 font-mono uppercase">{c.strategy}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {panel === "agents" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-xs font-mono uppercase text-slate-500 mb-2 flex items-center gap-2">
              A2A Protocol
              {a2aStatus?.online ? <span className="px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">ONLINE</span> : <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500">OFFLINE</span>}
            </h4>
            {a2aStatus && (
              <p className="text-xs text-slate-400 font-mono">
                tasks: total={a2aStatus.tasks?.total ?? 0} · working={a2aStatus.tasks?.counts?.working ?? 0} · completed={a2aStatus.tasks?.counts?.completed ?? 0}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase text-slate-500 mb-2">ACP Agents (cloud workers)</h4>
            <div className="space-y-2">
              {acpAgents.map((a: any) => (
                <div key={a.id} className="p-3 bg-slate-900/70 border-l-2 border-purple-500/40 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white">{a.name}</p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-purple-300">{a.binary}</span>
                  </div>
                  {a.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.description}</p>}
                </div>
              ))}
              {acpAgents.length === 0 && <p className="text-center text-xs text-slate-500">No ACP agents detected.</p>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase text-slate-500 mb-2">Agent Skills ({agentSkills.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agentSkills.slice(0, 12).map((s: any) => (
                <div key={s.id} className="p-2.5 bg-slate-900/70 rounded-lg">
                  <p className="text-xs font-bold text-white">{s.name}</p>
                  {s.description && <p className="text-[10px] text-slate-500 line-clamp-1">{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {panel === "caller" && (
        <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0 flex flex-col">
          <select value={callTool} onChange={(e) => setCallTool(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 mb-2 focus:outline-none focus:border-orange-500/40">
            <option value="">— pick a tool —</option>
            {tools.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <textarea value={callArgs} onChange={(e) => setCallArgs(e.target.value)} rows={4} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500/40 resize-y mb-2" />
          <button onClick={runTool} disabled={calling || !callTool} className="w-full py-2.5 bg-gradient-to-r from-orange-500/25 to-red-500/20 border border-orange-500/40 rounded-xl text-sm font-bold text-orange-300 hover:from-orange-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-40 mb-3">
            <Play className="w-4 h-4" /> {calling ? "Detonating..." : "Execute"}
          </button>
          {callResult && (
            <pre className="flex-1 overflow-auto max-h-64 p-3 bg-black/50 border border-slate-800 rounded-xl text-[11px] font-mono text-green-300 whitespace-pre-wrap">{callResult}</pre>
          )}
        </div>
      )}
    </div>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
      <span className="block text-[10px] font-mono text-slate-500 uppercase">{label}</span>
      <span className="text-lg font-mono font-bold text-cyan-400">{value}</span>
    </div>
  );
}

function sampleArgs(schema: any): any {
  if (!schema || schema.type !== "object") return {};
  const out: any = {};
  for (const [k, v] of Object.entries<any>(schema.properties || {})) {
    out[k] = v.type === "number" || v.type === "integer" ? 0 : v.type === "boolean" ? false : v.type === "array" ? [] : "";
  }
  return out;
}
