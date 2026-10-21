import React, { useState } from "react";
import { Zap, Terminal, FileText, Edit3, Folder, Search, GitBranch, Archive, Brain, Play, Plus, Trash2, ArrowDown, Code, Copy, Check, Sparkles, Layers } from "lucide-react";

interface SoulGunArmoryTabProps {
  accentColor: string;
}

interface MuscleNode {
  id: string;
  muscle: string;
  label: string;
  icon: any;
  color: string;
  args: Record<string, string>;
}

interface StepResult {
  stepIndex: number;
  stepId: string;
  muscle: string;
  args: any;
  output: string;
  runtimeMs: number;
}

const MUSCLE_PALETTE = [
  { id: "shell", label: "Shell Execution", icon: Terminal, color: "#00ff41", defaultArgs: { command: 'Get-ChildItem -Path "." | Select-Object -First 5' } },
  { id: "read_file", label: "Read File", icon: FileText, color: "#38bdf8", defaultArgs: { path: "package.json" } },
  { id: "write_file", label: "Write File", icon: Edit3, color: "#f59e0b", defaultArgs: { path: "artifacts/test-output.txt", content: "{{prev.output}}" } },
  { id: "list_dir", label: "List Directory", icon: Folder, color: "#a855f7", defaultArgs: { path: "." } },
  { id: "search", label: "Grep Search", icon: Search, color: "#ec4899", defaultArgs: { pattern: "SOUL_PROFIT" } },
  { id: "git_status", label: "Git Status", icon: GitBranch, color: "#10b981", defaultArgs: {} },
  { id: "save_artifact", label: "Save Artifact", icon: Archive, color: "#6366f1", defaultArgs: { title: "Soul Gun Pipeline Output", kind: "html", content: "{{prev.output}}" } },
  { id: "consult_gsk", label: "Consult GSK Brain", icon: Brain, color: "#f43f5e", defaultArgs: { query: "Audit pipeline performance for {{prev.output}}" } },
];

export const SoulGunArmoryTab: React.FC<SoulGunArmoryTabProps> = ({ accentColor }) => {
  const [nodes, setNodes] = useState<MuscleNode[]>([
    {
      id: "node-1",
      muscle: "git_status",
      label: "Git Status",
      icon: GitBranch,
      color: "#10b981",
      args: {},
    },
    {
      id: "node-2",
      muscle: "consult_gsk",
      label: "Consult GSK Brain",
      icon: Brain,
      color: "#f43f5e",
      args: { query: "Perform a security and stability audit on these uncommitted changes:\n{{prev.output}}" },
    },
    {
      id: "node-3",
      muscle: "save_artifact",
      label: "Save Artifact",
      icon: Archive,
      color: "#6366f1",
      args: { title: "Git Audit Report", kind: "markdown", content: "# Soul Gun Git Audit Report\n\n{{prev.output}}" },
    },
  ]);

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const addNode = (item: typeof MUSCLE_PALETTE[number]) => {
    const newNode: MuscleNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      muscle: item.id,
      label: item.label,
      icon: item.icon,
      color: item.color,
      args: { ...item.defaultArgs },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const updateNodeArg = (nodeId: string, argKey: string, val: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, args: { ...n.args, [argKey]: val } } : n
      )
    );
  };

  const firePipeline = async () => {
    if (nodes.length === 0 || isExecuting) return;
    setIsExecuting(true);
    setResults([]);

    try {
      const payloadSteps = nodes.map((n) => ({
        id: n.id,
        muscle: n.muscle,
        args: n.args,
      }));

      for (let i = 0; i < nodes.length; i++) {
        setActiveStepIndex(i);
        await new Promise((r) => setTimeout(r, 400));
      }

      const res = await fetch("/api/profit/muscles/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: payloadSteps }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        alert(`Pipeline execution error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setIsExecuting(false);
      setActiveStepIndex(null);
    }
  };

  const generateTriggerScript = () => {
    const script = `// Soul-Gun Armory Visual Pipeline Trigger Script
async function fireMusclePipeline() {
  const response = await fetch('/api/profit/muscles/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      steps: ${JSON.stringify(nodes.map(n => ({ muscle: n.muscle, args: n.args })), null, 2)}
    })
  });
  const data = await response.json();
  console.log('⚡ Soul-Gun Pipeline Output:', data.finalOutput);
  return data;
}

fireMusclePipeline();`;

    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl flex flex-col h-full gap-6 text-slate-100 font-mono overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Soul-Gun Armory (Visual Muscle Node Matrix)
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                DAG PIPELINE MATRIX
              </span>
            </h2>
            <p className="text-slate-400 text-sm">Visual node-based workflow editor connecting Profit's 8 core muscles into executable DAG chains</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateTriggerScript}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl text-xs transition-colors"
          >
            {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Code className="w-4 h-4 text-amber-400" />}
            {copiedScript ? "Script Copied!" : "Export Trigger Script"}
          </button>

          <button
            onClick={firePipeline}
            disabled={isExecuting || nodes.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
            {isExecuting ? "Executing DAG Pipeline..." : "⚡ Fire Soul-Gun Pipeline"}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Muscle Palette | Center DAG Canvas | Right Execution Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left: Core Muscle Palette (3 cols) */}
        <div className="lg:col-span-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
            <Layers className="w-4 h-4 text-amber-400" /> Muscle Node Palette (8)
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {MUSCLE_PALETTE.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => addNode(item)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:scale-[1.02] transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20`, borderColor: item.color }}>
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: DAG Node Pipeline Canvas (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Connected DAG Workflow ({nodes.length} nodes)
            </span>
            <span className="text-[10px] text-amber-400/80">Placeholder: &#123;&#123;prev.output&#125;&#125;</span>
          </div>

          {nodes.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
              <Zap className="w-8 h-8 opacity-30" />
              <p className="text-xs">Click muscles on the left palette to add nodes to the DAG pipeline.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {nodes.map((node, index) => {
              const Icon = node.icon;
              const isActive = activeStepIndex === index;
              return (
                <React.Fragment key={node.id}>
                  <div
                    className={`p-3.5 rounded-xl border transition-all relative ${
                      isActive
                        ? "bg-amber-950/40 border-amber-400 scale-[1.02] shadow-xl"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          #{index + 1}
                        </span>
                        <Icon className="w-4 h-4" style={{ color: node.color }} />
                        <span className="text-xs font-bold text-white">{node.label}</span>
                      </div>

                      <button
                        onClick={() => removeNode(node.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Node Arguments Configuration */}
                    <div className="flex flex-col gap-2">
                      {Object.keys(node.args).map((argKey) => (
                        <div key={argKey} className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{argKey}:</span>
                          <textarea
                            value={node.args[argKey]}
                            onChange={(e) => updateNodeArg(node.id, argKey, e.target.value)}
                            rows={node.args[argKey].length > 40 ? 2 : 1}
                            className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none resize-none font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {index < nodes.length - 1 && (
                    <div className="flex justify-center my-[-4px]">
                      <div className="p-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 animate-pulse">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right: Live Execution Results (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-300">
            <span>Execution Output Logs</span>
            <span className="text-[10px] text-slate-500">{results.length} steps complete</span>
          </div>

          {results.length === 0 && !isExecuting && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2 py-12">
              <Play className="w-8 h-8 opacity-30" />
              <p className="text-xs text-center">Click "Fire Soul-Gun Pipeline" to execute your visual node matrix live.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {results.map((res) => (
              <div key={res.stepId} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-850 pb-1">
                  <span className="font-bold text-amber-400">Step #{res.stepIndex + 1}: {res.muscle}</span>
                  <span className="text-[10px] text-slate-500">{res.runtimeMs}ms</span>
                </div>
                <pre className="p-2 bg-slate-950 border border-slate-850 rounded text-[11px] text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {res.output}
                </pre>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
