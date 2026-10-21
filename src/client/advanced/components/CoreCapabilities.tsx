// @ts-nocheck
import React, { useState } from "react";
import { 
  Database, 
  LineChart, 
  Table, 
  PenTool, 
  FileCode, 
  Sparkles, 
  Calendar, 
  Clock, 
  Settings2, 
  MessageSquare, 
  Send, 
  Share2, 
  Terminal, 
  Activity, 
  Play, 
  Check, 
  AlertTriangle, 
  RotateCw, 
  Layers, 
  Cpu, 
  BookOpen
} from "lucide-react";
import { ProviderConfig } from "../types";
import Markdown from "react-markdown";

interface CoreCapabilitiesProps {
  accentColor: string;
  providerConfig?: ProviderConfig;
}

interface CapabilityDef {
  id: "data_analysis" | "content_creation" | "scheduling" | "communication";
  title: string;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderHoverColor: string;
  subTasks: {
    title: string;
    description: string;
  }[];
  requiredSkills: string[];
  suggestedPrompt: string;
  suggestedInput?: string;
}

export const CoreCapabilities: React.FC<CoreCapabilitiesProps> = ({
  accentColor,
  providerConfig
}) => {
  const [selectedCapId, setSelectedCapId] = useState<CapabilityDef["id"]>("data_analysis");
  const [taskPrompt, setTaskPrompt] = useState<string>("");
  const [inputDataset, setInputDataset] = useState<string>("");
  const [executing, setExecuting] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<{ text: string; source: string } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const capabilitiesList: CapabilityDef[] = [
    {
      id: "data_analysis",
      title: "Data Analysis Engine",
      description: "Empowers agents to perform real quantitative parsing, math, sorting, anomaly scanning, and statistical graphing.",
      icon: <LineChart className="w-5 h-5" />,
      bgGradient: "from-cyan-500/10 to-teal-500/5",
      borderHoverColor: "hover:border-cyan-500/30",
      subTasks: [
        {
          title: "Quantitative Table Parsing",
          description: "Analyze, structure, and read numbers, sums, average variations, and counts directly from tables or text chains."
        },
        {
          title: "Multi-parameter Sorting",
          description: "Sort records, isolate the highest value thresholds, query filters, and clean layout rows."
        },
        {
          title: "PII Security Masking",
          description: "Scan conversations and datasets, automatically redacting credit card tokens, SSNs, or addresses."
        },
        {
          title: "Vector Anomaly Scanning",
          description: "Calculate proximity metrics using Cosine or Euclidean math to flag anomalies and deviation pools."
        }
      ],
      requiredSkills: [
        "Quantitative Statistical Auditing",
        "AST Regular Expression Extraction",
        "Volatile Cache RAM Management (LRU)",
        "JSON/CSV Matrix Structuring"
      ],
      suggestedPrompt: "Analyze the provided historical list of agent sales transactions, calculate totals and compute the average order value.",
      suggestedInput: "ID,SKU,AMOUNT,STATUS\nTX-11,SOUL-V1,450,success\nTX-12,SOUL-V2,650,success\nTX-13,SOUL-V1,450,pending\nTX-14,SOUL-V2,650,success"
    },
    {
      id: "content_creation",
      title: "Abstractive Creation Matrix",
      description: "Equips agents with deep natural language orthographics and programming logic to synthesize literature, codes, and newsletters.",
      icon: <PenTool className="w-5 h-5" />,
      bgGradient: "from-pink-500/10 to-purple-500/5",
      borderHoverColor: "hover:border-pink-500/30",
      subTasks: [
        {
          title: "Orthographic Tone Styling",
          description: "Formulate business brief newsletters, casual chat threads, or formal educational literature with custom accent bounds."
        },
        {
          title: "AST Structural Code Compiling",
          description: "Draft clean, copyable NodeJS/Python SDK proxies, CORS handlers, or RPC connection blocks from human queries."
        },
        {
          title: "Few-Shot Prompt Tuning",
          description: "Auto-compile XML instruction tags and relevant contextual examples into prompts to guarantee reliable downstream model runs."
        },
        {
          title: "Preserved Polyglot Translation",
          description: "Convert dialogues across 120+ languages while completely maintaining markdown layouts and raw tag properties."
        }
      ],
      requiredSkills: [
        "Dynamic NLP Prompt Compilation",
        "Orthographic Style and Syntax Rules",
        "AST Parsing and Boilerplate Splicing",
        "Few-shot Context Tuning"
      ],
      suggestedPrompt: "Write a high-converting announcement email newsletter introducing our Sovereign Neural Core v2, customized for enterprise developers who care about strict compliance.",
      suggestedInput: "Brand: buyasoulfinal.myshopify.com\nCore Features: Zero-simulacrum runs, Live pinecone indexes, Multi-Agent Habitat."
    },
    {
      id: "scheduling",
      title: "Chrono-Scheduling Oracle",
      description: "Gives agents robust chronological orchestration loops, automated task calendar builders, and backup retry triggers.",
      icon: <Calendar className="w-5 h-5" />,
      bgGradient: "from-amber-500/10 to-orange-500/5",
      borderHoverColor: "hover:border-amber-500/30",
      subTasks: [
        {
          title: "UTC/Local Calendar Syncing",
          description: "Audit availability slots across multiple participants, calculate chronological overlaps, and book appointments."
        },
        {
          title: "Dynamic Cron Interval Parsing",
          description: "Translate instruction commands into valid standard CRON expressions (e.g. daily midnight run backups)."
        },
        {
          title: "CRM Kanban Deal Progression",
          description: "Spur automatic status shifts, deal lifecycle modifications, and linear story log tickets upon events."
        },
        {
          title: "Backoff Retry Configuration",
          description: "Orchestrate automated linear or exponential retry timers when microservices report network API timeouts."
        }
      ],
      requiredSkills: [
        "Chronological Pipeline Orchestration",
        "CRON Scheduling Expression Tuning",
        "Timezone Alignment Alignment (UTC)",
        "Automated Failover Routing Maps"
      ],
      suggestedPrompt: "Draft a cron scheduling plan to backup the Ledger database daily at midnight UTC, with an active retry policy that triggers up to 3 times on API failure.",
      suggestedInput: "Primary Job: Ledger Backup\nTarget Server: genesis-neural-prod\nRetry Limit: 3 runs"
    },
    {
      id: "communication",
      title: "Notification Webhook Dispatcher",
      description: "Connects agent results to human team nodes via webhooks, rich card blocks, instant SMS alerts, and group chat broadcasts.",
      icon: <MessageSquare className="w-5 h-5" />,
      bgGradient: "from-indigo-500/10 to-blue-500/5",
      borderHoverColor: "hover:border-indigo-500/30",
      subTasks: [
        {
          title: "Rich Card Layout Formatting",
          description: "Construct Discord Webhook embeds or Slack Block Kit structures with thumbnail triggers, margins, and custom values."
        },
        {
          title: "Outbound Newsletter Dispatch",
          description: "Assemble responsive HTML/CSS structures and route them safely using SMTP portals on triggers."
        },
        {
          title: "Urgent Cellular SMS Alert",
          description: "Route instant telephone SMS messages for critical exceptions through cellular gateway bridges."
        },
        {
          title: "Multi-Group Bot Broadcast",
          description: "Distribute formatted alerts to specific target chat IDs or channels instantly on deployment events."
        }
      ],
      requiredSkills: [
        "REST API Protocol Webhook Deserialization",
        "JWT Security Claim Header Validations",
        "JSON Payload Schema Formatting",
        "Dashboard Micro-Layout Typography"
      ],
      suggestedPrompt: "Write a complete Slack Block Kit JSON schema to announce a high-priority system alert, with a visual text preview of how the dispatch reads.",
      suggestedInput: "Sender: LedgerScout Protocol\nAlert: Balance Discrepancy on TX-1099 ($1,250 deviation)\nUrgency: High"
    }
  ];

  const activeCap = capabilitiesList.find(c => c.id === selectedCapId)!;

  const handleApplyPreset = (cap: CapabilityDef) => {
    setTaskPrompt(cap.suggestedPrompt);
    setInputDataset(cap.suggestedInput || "");
    setExecResult(null);
    setErrorText(null);
  };

  const handleExecuteLive = async () => {
    if (!taskPrompt.trim()) {
      setErrorText("Please specify a task instruction first.");
      return;
    }

    setExecuting(true);
    setErrorText(null);
    setExecResult(null);

    // Load local vault credentials if available
    let vaultKeys = {};
    const savedVault = localStorage.getItem("agent_workbench_vault_keys");
    if (savedVault) {
      try {
        vaultKeys = JSON.parse(savedVault);
      } catch (e) {
        console.error("Local keys vault parse failed", e);
      }
    }

    try {
      const res = await fetch("/api/agent/execute-capability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability: selectedCapId,
          task: taskPrompt,
          inputData: inputDataset,
          providerConfig: {
            ...providerConfig,
            apiKey: providerConfig?.apiKey || (vaultKeys as any).GEMINI_API_KEY || ""
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExecResult({
          text: data.text,
          source: data.source
        });
      } else {
        setErrorText(data.error || "The execution failed to build a valid response.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(`Failed to connect to the Capability Executive backend: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none">
      {/* Absolute grid aesthetic background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />

      {/* Header View */}
      <div className="relative z-10 border-b border-slate-800/85 pb-4.5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5.5 h-5.5 text-pink-500" />
            Core Capabilities Blueprint
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspect our standard core agent capabilities, explore sub-task taxonomies, audit general skill requirements, and run real, non-simulated processes using live input streams.
          </p>
        </div>

        {/* Local time or meta tag to prevent telemetry slop */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-805 text-[10px] font-mono text-slate-400 rounded-lg">
          <BookOpen className="w-3.5 h-3.5 text-pink-500" />
          <span>CAPABILITY_STANDARDS_V2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch flex-1">
        
        {/* Left Column: List of 4 capabilities */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-1">
            Sovereign Skill Capacities
          </span>

          <div className="space-y-3">
            {capabilitiesList.map((cap) => {
              const isSelected = selectedCapId === cap.id;
              return (
                <button
                  key={cap.id}
                  onClick={() => {
                    setSelectedCapId(cap.id);
                    setExecResult(null);
                    setErrorText(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden select-none cursor-pointer flex gap-3.5 items-start ${
                    isSelected 
                      ? "bg-slate-950/90 text-white border-slate-700" 
                      : `bg-slate-900/30 text-slate-400 border-slate-800/70 hover:border-slate-800 hover:bg-slate-900/50 ${cap.borderHoverColor}`
                  }`}
                  style={{
                    borderColor: isSelected ? accentColor : undefined,
                    boxShadow: isSelected ? `0 0 16px ${accentColor}18, inset 0 0 8px ${accentColor}05` : "none"
                  }}
                >
                  {/* Subtle color flare */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${cap.bgGradient} blur-xl opacity-30 pointer-events-none`} />

                  <div 
                    className={`p-2 rounded-lg border ${
                      isSelected ? "bg-slate-900 text-white" : "bg-slate-950/60 text-slate-500"
                    }`}
                    style={{ 
                      borderColor: isSelected ? `${accentColor}30` : undefined,
                      color: isSelected ? accentColor : undefined
                    }}
                  >
                    {cap.icon}
                  </div>

                  <div className="space-y-1">
                    <p className={`text-xs font-mono font-bold tracking-wide uppercase ${
                      isSelected ? "text-slate-100" : "text-slate-350"
                    }`}
                    style={{ color: isSelected ? accentColor : undefined }}
                    >
                      {cap.title}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-medium">
                      {cap.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active capability required general skill sets */}
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 shrink-0 text-left">
            <h4 className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
              <Cpu className="w-3.5 h-3.5 text-pink-400" />
              General Skill Set Required
            </h4>

            <ul className="grid grid-cols-1 gap-2">
              {activeCap.requiredSkills.map((sk, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                  <span>{sk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Dynamic Sub-tasks view and executive console */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Sub tasks display list */}
          <div className="bg-slate-950/40 border border-slate-850/80 p-4.5 rounded-xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-pink-400" />
                Specific sub-tasks taxonomies
              </span>
              <span className="text-[9px] font-mono bg-pink-950/40 border border-pink-900/40 px-2.5 py-0.5 rounded text-pink-400 font-bold uppercase">
                {activeCap.title.split(" ")[0]} Tasks
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCap.subTasks.map((task, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-855 rounded-xl p-3.5 hover:border-slate-800 hover:bg-slate-900/70 transition">
                  <p className="text-xs font-mono font-bold text-white flex items-center gap-1.5 mb-1">
                    <span className="text-pink-500 font-bold">0{idx + 1}.</span>
                    {task.title}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans leading-normal font-medium">
                    {task.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Core capability live executive lab (The real deal!) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 flex-1 flex flex-col relative h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/5 to-transparent blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5 mb-3.5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                Capability Executive Lab
              </h3>
              
              <button
                onClick={() => handleApplyPreset(activeCap)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-850 hover:text-white text-[10px] font-mono text-slate-400 rounded-md border border-slate-800 hover:border-slate-700 transition cursor-pointer select-none"
              >
                Apply Sample Task & Data
              </button>
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col">
              {/* Task prompt instruction string */}
              <div className="text-left">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Task Command Instruction:
                </label>
                <input
                  type="text"
                  placeholder={activeCap.suggestedPrompt}
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  className="w-full text-xs font-sans p-2.5 bg-slate-950 text-slate-250 border border-slate-850 rounded-xl focus:border-pink-500/40 outline-none transition"
                  style={{ height: "42px" }}
                />
              </div>

              {/* Input context dataset optional area */}
              <div className="flex-1 flex flex-col min-h-[90px] text-left">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Optional Dataset Ingest / Raw Parameters:
                </label>
                <textarea
                  placeholder={activeCap.suggestedInput || "Input raw sales lists, content keys, email instructions, or schedule settings here..."}
                  value={inputDataset}
                  onChange={(e) => setInputDataset(e.target.value)}
                  className="w-full flex-1 p-2.5 bg-slate-950 text-slate-300 font-mono text-[10.5px] border border-slate-850 rounded-xl focus:border-pink-500/40 outline-none resize-none transition"
                  rows={3}
                />
              </div>

              {/* Execution controller button */}
              <div className="flex items-center justify-between gap-3 pt-1.5 shrink-0">
                <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 font-medium">
                  {providerConfig?.apiKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                      <span>Live Gemini API Enabled</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5 text-cyan-400/80 shrink-0 animate-pulse" />
                      <span>Local Secure Sandbox Run</span>
                    </>
                  )}
                </p>

                <button
                  onClick={handleExecuteLive}
                  disabled={executing}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-white text-slate-950 font-mono text-xs font-bold rounded-xl tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 select-none cursor-pointer border-t border-white/20"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: `${accentColor}30`,
                    boxShadow: `0 0 16px ${accentColor}25`
                  }}
                >
                  {executing ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      PROCESSING COMMAND...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
                      EXECUTE LIVE CAPABILITY RUN
                    </>
                  )}
                </button>
              </div>

              {/* Display Result terminal box */}
              {(execResult || errorText) && (
                <div className="border border-slate-850 bg-slate-950 rounded-xl overflow-hidden mt-4 text-left">
                  <div className="bg-slate-900/80 border-b border-slate-850 px-4 py-2 flex justify-between items-center font-mono text-[10px]">
                    <span className="text-slate-450 uppercase flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      LOG_STREAM: CAPABILITY_RUN
                    </span>
                    <span className={errorText ? "text-rose-450" : "text-emerald-450 animate-pulse font-bold"}>
                      {errorText ? "ERROR_ENCOUNTERED" : `RUN_SUCCESSFUL (${execResult?.source})`}
                    </span>
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[190px] scrollbar-thin scrollbar-thumb-slate-850">
                    {errorText ? (
                      <div className="flex items-start gap-2 text-rose-200 font-mono text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <p className="leading-relaxed whitespace-pre-wrap">{errorText}</p>
                      </div>
                    ) : (
                      <div className="markdown-body text-slate-300 font-sans text-xs leading-relaxed max-w-full">
                        <Markdown>{execResult?.text}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
