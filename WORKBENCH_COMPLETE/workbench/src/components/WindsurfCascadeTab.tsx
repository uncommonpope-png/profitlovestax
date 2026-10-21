import React, { useState, useEffect } from "react";
import { Wind, Pin, Plus, Trash2, Play, Sparkles, Check, Lock, Code, Cpu, Layers, GitPullRequest, CheckCircle2, ShieldCheck, Zap, Activity } from "lucide-react";

interface WindsurfCascadeTabProps {
  accentColor: string;
}

interface ContextPin {
  id: string;
  type: string;
  label: string;
  path: string;
}

interface CascadeTask {
  id: string;
  title: string;
  agent: string;
  status: "planning" | "running" | "review" | "done";
  diffs: string[];
  timestamp: string;
}

export const WindsurfCascadeTab: React.FC<WindsurfCascadeTabProps> = ({ accentColor }) => {
  const [pins, setPins] = useState<ContextPin[]>([]);
  const [board, setBoard] = useState<CascadeTask[]>([]);
  const [prompt, setPrompt] = useState<string>("Graft Windsurf Supercomplete and Fast Context memory into the Workbench kernel.");
  const [selectedAgentModel, setSelectedAgentModel] = useState<string>("auto/best-coding");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [cascadeReply, setCascadeReply] = useState<string>("");
  const [mintStatus, setMintStatus] = useState<string>("");

  // New Pin Form
  const [newPinLabel, setNewPinLabel] = useState<string>("");
  const [newPinPath, setNewPinPath] = useState<string>("");

  const fetchData = async () => {
    try {
      const [pinsRes, boardRes] = await Promise.all([
        fetch("/api/profit/cascade/pins"),
        fetch("/api/profit/cascade/board"),
      ]);
      const pinsData = await pinsRes.json();
      const boardData = await boardRes.json();
      if (pinsData.success) setPins(pinsData.pins || []);
      if (boardData.success) setBoard(boardData.board || []);
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinLabel.trim()) return;
    try {
      const res = await fetch("/api/profit/cascade/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newPinLabel, path: newPinPath || newPinLabel, type: "file" }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPinLabel("");
        setNewPinPath("");
        fetchData();
      }
    } catch {}
  };

  const handleRemovePin = async (id: string) => {
    try {
      await fetch(`/api/profit/cascade/pins/${id}`, { method: "DELETE" });
      fetchData();
    } catch {}
  };

  const handleExecuteCascade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;
    setIsExecuting(true);
    setCascadeReply("");
    setMintStatus("");

    try {
      const res = await fetch("/api/profit/cascade/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedAgentModel }),
      });
      const data = await res.json();
      if (data.success) {
        setCascadeReply(data.reply || "[Cascade step executed successfully]");
        fetchData();
      } else {
        alert(`Cascade error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Cascade execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const mintCascadeToSoulChain = async () => {
    if (!cascadeReply || !prompt) return;
    setMintStatus("Minting Cascade Deed to Soul Chain...");
    try {
      const res = await fetch("/api/profit/soul-chain/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "WINDSURF_CASCADE_MINTED",
          title: `Cascade Graft: ${prompt.slice(0, 50)}`,
          author: "Profit Prime & Windsurf Cascade Copilot",
          code: cascadeReply,
          profit: 1.0,
          love: 1.0,
          tax: 0.1,
        }),
      });
      const data = await res.json();
      if (data.success && data.block) {
        setMintStatus(`Minted Cascade Deed to Block #${data.block.index}! 🔒`);
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <Wind className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Windsurf Cascade Studio & Command Center
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                GRAFTED ARCHITECTURE
              </span>
            </h2>
            <p className="text-slate-400 text-sm">Grafted from Windsurf / Devin Desktop: Fast Context Pins, Cascade Flow, and ACP Multi-Agent Command Center</p>
          </div>
        </div>

        {/* ACP Model Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">ACP Model:</span>
          <select
            value={selectedAgentModel}
            onChange={(e) => setSelectedAgentModel(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-cyan-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 font-bold"
          >
            <option value="auto/best-coding">Profit Prime (OmniRoute Auto)</option>
            <option value="auto/best-chat">Agent Smith (Qwen Architect)</option>
            <option value="windsurf-cascade">Windsurf Cascade Copilot</option>
            <option value="devin-local">Devin Local Agent</option>
          </select>
        </div>
      </div>

      {/* Fast Context Pins Bar */}
      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
            <Pin className="w-4 h-4 text-cyan-400" /> Fast Context Memory Pins ({pins.length} items pinned)
          </span>
          <span className="text-[10px] text-slate-500">Pins inject instant context into Cascade reasoning rings</span>
        </div>

        {/* Pin Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {pins.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 shrink-0">
              <span className="text-[10px] uppercase font-bold text-cyan-400">[{p.type}]</span>
              <span>{p.label}</span>
              <button onClick={() => handleRemovePin(p.id)} className="text-slate-500 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Quick Pin Form */}
          <form onSubmit={handleAddPin} className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={newPinLabel}
              onChange={(e) => setNewPinLabel(e.target.value)}
              placeholder="Label / File path..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none w-36"
            />
            <button type="submit" className="p-1.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg hover:bg-cyan-500/30 text-xs">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Layout: Left Cascade Task Kanban (5 cols) | Right Cascade Step Executor & Code Output (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left: Agent Command Center Kanban Board (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Command Center Board ({board.length} tasks)
            </span>
            <span className="text-[10px] text-slate-500">Live Git Worktrees</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {board.map((task) => (
              <div key={task.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">{task.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    task.status === "done" ? "bg-emerald-500/20 text-emerald-400" :
                    task.status === "running" ? "bg-cyan-500/20 text-cyan-400 animate-pulse" :
                    task.status === "review" ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Agent: {task.agent}</span>
                  <span>{new Date(task.timestamp).toLocaleTimeString()}</span>
                </div>

                {task.diffs && task.diffs.length > 0 && (
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded text-[10px] font-mono text-cyan-300 space-y-0.5">
                    {task.diffs.map((d, i) => (
                      <div key={i}>• {d}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cascade Step Flow Executor & Code Output (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 min-h-0 overflow-y-auto">
          
          <form onSubmit={handleExecuteCascade} className="flex flex-col gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Execute Cascade Flow Step
              </span>
              <span className="text-[10px] text-slate-500">Fast Context Attached</span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none font-mono"
              placeholder="Enter instructions for Cascade Copilot & Profit Prime..."
              required
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={isExecuting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
                {isExecuting ? "Executing Cascade Step..." : "⚡ Run Cascade Flow Step"}
              </button>
            </div>
          </form>

          {/* Cascade Reply & Synthesized Code Output */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Code className="w-4 h-4 text-cyan-400" /> Cascade Flow Response & Code Output
              </span>
              {cascadeReply && (
                <button
                  onClick={mintCascadeToSoulChain}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 text-xs transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" /> Mint to Soul Chain
                </button>
              )}
            </div>

            {!cascadeReply && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
                <Wind className="w-8 h-8 opacity-30" />
                <p className="text-xs text-center">Execute a Cascade Step above to generate multi-file code diffs and Fast Context responses.</p>
              </div>
            )}

            {cascadeReply && (
              <div className="flex-1 overflow-y-auto space-y-3">
                <pre className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {cascadeReply}
                </pre>
                {mintStatus && <div className="text-xs text-emerald-400 animate-pulse font-mono">{mintStatus}</div>}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
