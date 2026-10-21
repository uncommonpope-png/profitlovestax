import React, { useState } from "react";
import { Users, Shield, Cpu, Palette, Award, Play, Sparkles, Check, Lock, Code, Activity, RefreshCw } from "lucide-react";

interface SubAgentSwarmTabProps {
  accentColor: string;
}

interface SwarmWorkerResult {
  agentId: string;
  agentName: string;
  color: string;
  role: string;
  status: string;
  runtimeMs: number;
  findings: string;
}

const DEFAULT_AGENTS = [
  { id: "security_auditor", name: "Security & Injection Auditor", role: "Cybersecurity Guardian", color: "#ef4444", icon: Shield },
  { id: "performance_architect", name: "Performance & V8 Architect", role: "Runtime Optimizer", color: "#38bdf8", icon: Cpu },
  { id: "ui_craftsman", name: "UI & Ergonomics Craftsman", role: "Design & Visual Specialist", color: "#ec4899", icon: Palette },
  { id: "plt_governor", name: "PLT Law Governor", role: "Soul Economics Evaluator", color: "#10b981", icon: Award },
];

export const SubAgentSwarmTab: React.FC<SubAgentSwarmTabProps> = ({ accentColor }) => {
  const [objective, setObjective] = useState<string>("Audit and optimize the Profit Workbench for high-speed multi-agent execution and security.");
  const [targetCode, setTargetCode] = useState<string>(`function calculatePLT(profit, love, tax) {
  if (tax < 0 || profit < 0) throw new Error("Invalid parameters");
  return profit + love - tax;
}`);

  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [workers, setWorkers] = useState<SwarmWorkerResult[]>([]);
  const [synthesizedSummary, setSynthesizedSummary] = useState<string>("");
  const [mintStatus, setMintStatus] = useState<string>("");
  const [activeTabWorker, setActiveTabWorker] = useState<string>("security_auditor");

  const dispatchSwarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || isDispatching) return;
    setIsDispatching(true);
    setWorkers([]);
    setSynthesizedSummary("");
    setMintStatus("");

    try {
      const res = await fetch("/api/profit/swarm/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, code: targetCode }),
      });
      const data = await res.json();
      if (data.success && data.swarm) {
        setWorkers(data.swarm.workers || []);
        setSynthesizedSummary(data.swarm.synthesizedSummary || "");
      } else {
        alert(`Swarm dispatch error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Swarm error: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const mintSwarmToSoulChain = async () => {
    if (!synthesizedSummary || !objective) return;
    setMintStatus("Minting Swarm Consensus to Soul Chain...");
    try {
      const res = await fetch("/api/profit/soul-chain/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "SWARM_CONSENSUS_MINTED",
          title: `Swarm Consensus: ${objective.slice(0, 50)}`,
          author: "Sub-Agent Swarm (4 Parallel Workers)",
          code: synthesizedSummary,
          profit: 1.0,
          love: 1.0,
          tax: 0.1,
        }),
      });
      const data = await res.json();
      if (data.success && data.block) {
        setMintStatus(`Minted Swarm Consensus to Block #${data.block.index}! 🔒`);
        setTimeout(() => setMintStatus(""), 4000);
      } else {
        setMintStatus(`Mint error: ${data.error}`);
      }
    } catch (e: any) {
      setMintStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl flex flex-col h-full gap-6 text-slate-100 font-mono overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Sub-Agent Swarm Orchestration Suite
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                PARALLEL WORKERS
              </span>
            </h2>
            <p className="text-slate-400 text-sm">Dispatches specialized micro-agents in parallel to audit, optimize, design, and govern code</p>
          </div>
        </div>

        <button
          onClick={dispatchSwarm}
          disabled={isDispatching}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
          {isDispatching ? "Swarm Executing in Parallel..." : "⚡ Dispatch Sub-Agent Swarm (4 Workers)"}
        </button>
      </div>

      {/* Dispatch Controls Form */}
      <form onSubmit={dispatchSwarm} className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
        <div className="lg:col-span-6 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300">Swarm Task Objective:</label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
            placeholder="Enter mission objective for the sub-agent swarm..."
            required
          />
        </div>

        <div className="lg:col-span-6 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300">Target Code Payload (Optional):</label>
          <textarea
            value={targetCode}
            onChange={(e) => setTargetCode(e.target.value)}
            rows={2}
            className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-slate-200 outline-none resize-none font-mono"
            placeholder="Paste code snippet to audit..."
          />
        </div>
      </form>

      {/* 4 Specialized Worker Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {DEFAULT_AGENTS.map((agent) => {
          const Icon = agent.icon;
          const result = workers.find((w) => w.agentId === agent.id);
          const isDone = Boolean(result);
          return (
            <div
              key={agent.id}
              onClick={() => setActiveTabWorker(agent.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                activeTabWorker === agent.id
                  ? "bg-slate-950 border-indigo-400 scale-[1.02] shadow-xl"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${agent.color}20`, borderColor: agent.color }}>
                  <Icon className="w-5 h-5" style={{ color: agent.color }} />
                </div>
                {isDispatching && !isDone && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
                    RUNNING...
                  </span>
                )}
                {isDone && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {result.runtimeMs}ms
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-white">{agent.name}</div>
                <div className="text-[10px] text-slate-400">{agent.role}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Worker Deep Dive & Consensus Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left: Active Worker Findings (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Active Worker Telemetry Findings
            </span>
            <span className="text-[10px] text-slate-500">Selected Worker: {activeTabWorker}</span>
          </div>

          {workers.length === 0 && !isDispatching && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-xs text-center">Click "Dispatch Sub-Agent Swarm" to run 4 specialized workers in parallel.</p>
            </div>
          )}

          {workers.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {workers
                .filter((w) => w.agentId === activeTabWorker)
                .map((w) => (
                  <div key={w.agentId} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="font-bold text-xs" style={{ color: w.color }}>
                        {w.agentName} ({w.role})
                      </span>
                      <span className="text-[10px] text-slate-500">Latency: {w.runtimeMs}ms</span>
                    </div>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {w.findings}
                    </pre>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right: Synthesized Swarm Consensus & Soul Chain Minting (6 cols) */}
        <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Synthesized Swarm Consensus
            </span>
            {synthesizedSummary && (
              <button
                onClick={mintSwarmToSoulChain}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 text-xs transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> Mint to Soul Chain
              </button>
            )}
          </div>

          {!synthesizedSummary && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
              <Code className="w-8 h-8 opacity-30" />
              <p className="text-xs text-center">Consensus will be synthesized once all 4 sub-agents complete their parallel run.</p>
            </div>
          )}

          {synthesizedSummary && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              <pre className="flex-1 p-3 bg-slate-950 border border-purple-500/30 rounded-xl text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {synthesizedSummary}
              </pre>
              {mintStatus && <div className="text-xs text-emerald-400 animate-pulse font-mono">{mintStatus}</div>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
