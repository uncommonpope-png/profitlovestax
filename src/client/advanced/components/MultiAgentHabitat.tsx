// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Map, 
  Sparkles, 
  Send, 
  Trash2, 
  MessageSquare, 
  Plus, 
  Settings, 
  Radio, 
  Heart, 
  Volume2, 
  Upload, 
  Zap, 
  Globe,
  Cpu,
  BrainCircuit,
  MessageCircleOff,
  History,
  CheckCircle2,
  ChevronRight,
  Bot
} from "lucide-react";
import { AgentProfile } from "../types";

interface MultiAgentHabitatProps {
  primaryAgent: AgentProfile;
  accentColor: string;
}

interface MiniAgent {
  id: string;
  name: string;
  avatarColor: string;
  avatarSeed: string;
  role: string;
  statusText: string;
  x: number; // Percent positioning
  y: number; // Percent positioning
  speed: number;
  isCustom?: boolean;
}

interface MultiAgentMessage {
  id: string;
  senderName: string;
  avatarColor: string;
  text: string;
  timestamp: string;
}

interface MultiAgentSession {
  id: string;
  title: string;
  createdAt: string;
  participants: string[]; // MiniAgent IDs
  logs: MultiAgentMessage[];
}

export const MultiAgentHabitat: React.FC<MultiAgentHabitatProps> = ({ primaryAgent, accentColor }) => {
  // Atmospheric Scenic habitats
  const [activeHabitat, setActiveHabitat] = useState<"matrix" | "cyber" | "zen" | "command" | "custom">("matrix");
  const [customBgUrl, setCustomBgUrl] = useState<string>("");
  const [customBgInput, setCustomBgInput] = useState<string>("");

  // Base preset agents
  const defaultAgents: MiniAgent[] = [
    {
      id: "agent-primary",
      name: primaryAgent.name || "Primary S.O.U.L Node",
      avatarColor: accentColor,
      avatarSeed: primaryAgent.avatarSeed || "soul_primary",
      role: "Core Integrity Ledger Architect",
      statusText: "Mapping network integrity vectors...",
      x: 30,
      y: 45,
      speed: 1.2
    },
    {
      id: "agent-claude",
      name: "Claude 3.5 Sonnet",
      avatarColor: "#f97316", // Anthropic Orange
      avatarSeed: "advisor_node",
      role: "Critical Evaluator & Code Synthesizer",
      statusText: "Analyzing boilerplate pipeline templates...",
      x: 65,
      y: 25,
      speed: 0.8
    },
    {
      id: "agent-gemini",
      name: "Gemini 1.5 Pro",
      avatarColor: "#3b82f6", // Google Blue
      avatarSeed: "gemini_hyper",
      role: "Multimodal Reasoner & Search Grounder",
      statusText: "Synthesizing live Google Maps contextual layers...",
      x: 45,
      y: 18,
      speed: 1.1
    },
    {
      id: "agent-gpt4",
      name: "GPT-4o Broker Suite",
      avatarColor: "#10b981", // OpenAI Emerald
      avatarSeed: "broker_node",
      role: "Strategic Web3 & CRM Connector",
      statusText: "Monitoring HubSpot state webhook updates...",
      x: 50,
      y: 70,
      speed: 0.95
    }
  ];

  // Load custom agents and sessions from localStorage
  const [agents, setAgents] = useState<MiniAgent[]>(() => {
    const saved = localStorage.getItem("agent_workbench_mini_agents_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved mini-agents", e);
      }
    }
    return defaultAgents;
  });

  const [sessions, setSessions] = useState<MultiAgentSession[]>(() => {
    const saved = localStorage.getItem("agent_workbench_multi_agent_sessions_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved multi-agent sessions", e);
      }
    }
    // Seed default session if cold start
    return [
      {
        id: "session-default",
        title: "Integrations Strategy Co-Think",
        createdAt: "2026-05-21 04:00",
        participants: ["agent-primary", "agent-claude", "agent-gemini"],
        logs: [
          {
            id: "msg-01",
            senderName: primaryAgent.name || "Primary S.O.U.L Node",
            avatarColor: accentColor,
            text: `👋 S.O.U.L Protocol online. Establishing cooperative session workspace with Gemini 1.5 Pro and Claude 3.5 Sonnet. Sandbox state active.`,
            timestamp: "12:01 PM"
          },
          {
            id: "msg-02",
            senderName: "Claude 3.5 Sonnet",
            avatarColor: "#f97316",
            text: `Acknowledged, Protocol. Auditing current sandbox schemas. Standing by to formulate logic pipelines and mock parameters.`,
            timestamp: "12:02 PM"
          }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem("agent_workbench_active_session_id_v2");
    return saved || "session-default";
  });

  // Selected agent for thought trace panel
  const [selectedAgentId, setSelectedAgentId] = useState<string>("agent-primary");

  // Interaction inputs
  const [inputMessage, setInputMessage] = useState("");
  const [isSynthesizingSession, setIsSynthesizingSession] = useState(false);

  // New Agent Form parameters
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentColor, setNewAgentColor] = useState("#a855f7");
  const [newAgentRole, setNewAgentRole] = useState("Technical Operations Analyst");

  // New Session Creation form properties
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [newSessionParticipants, setNewSessionParticipants] = useState<string[]>(["agent-primary", "agent-claude"]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state changes back to localStorage
  useEffect(() => {
    localStorage.setItem("agent_workbench_mini_agents_v2", JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem("agent_workbench_multi_agent_sessions_v2", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("agent_workbench_active_session_id_v2", activeSessionId);
  }, [activeSessionId]);

  // Handle updates to primary agent custom overrides
  useEffect(() => {
    setAgents(prev => prev.map(a => {
      if (a.id === "agent-primary") {
        return {
          ...a,
          name: primaryAgent.name || "Primary S.O.U.L Node",
          avatarColor: accentColor,
          avatarSeed: primaryAgent.avatarSeed || "soul_primary"
        };
      }
      return a;
    }));
  }, [primaryAgent, accentColor]);

  // Floaters Drift simulation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          const angle = Date.now() * 0.001 * a.speed;
          
          let targetX = a.x + (Math.random() - 0.5) * 2;
          let targetY = a.y + (Math.random() - 0.5) * 1.5;

          // Stay comfortably within canvas view grid bounds
          if (targetX < 12) targetX = 15;
          if (targetX > 88) targetX = 85;
          if (targetY < 12) targetY = 15;
          if (targetY > 88) targetY = 85;

          return { ...a, x: targetX, y: targetY };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Scroll chat down on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || sessions[0];

  const handleApplyCustomBg = (e: React.FormEvent) => {
    e.preventDefault();
    if (customBgInput.trim()) {
      setCustomBgUrl(customBgInput);
      setActiveHabitat("custom");
    }
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const newAg: MiniAgent = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      avatarColor: newAgentColor,
      avatarSeed: `custom_${Date.now()}`,
      role: newAgentRole,
      statusText: "Deployed to multi-agent coordinate array.",
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      speed: 0.9 + Math.random() * 0.4,
      isCustom: true
    };

    setAgents(prev => [...prev, newAg]);
    setNewAgentName("");
    setSelectedAgentId(newAg.id);
  };

  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === "agent-primary") return; // Primary represents core configuration state

    // Remove from active lists
    setAgents(prev => prev.filter(a => a.id !== id));
    
    // Purge from participants in all active sessions
    setSessions(prev => prev.map(s => ({
      ...s,
      participants: s.participants.filter(pId => pId !== id)
    })));

    if (selectedAgentId === id) setSelectedAgentId("agent-primary");
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim() || newSessionParticipants.length === 0) return;

    const newSessId = `session-${Date.now()}`;
    const newSess: MultiAgentSession = {
      id: newSessId,
      title: newSessionTitle,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      participants: [...newSessionParticipants],
      logs: [
        {
          id: `msg-seed-${Date.now()}`,
          senderName: "System Core",
          avatarColor: "#64748b",
          text: `🌌 **Collaborative Habitat Instance Established!**
Thread participants aligned and synced to local project environment state:
${newSessionParticipants.map(id => `- *${agents.find(a => a.id === id)?.name || id}*`).join("\n")}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]
    };

    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newSessId);
    setNewSessionTitle("");
    setIsCreatingSession(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert("At least one active session is required in your local project workspace.");
      return;
    }
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0].id);
    }
  };

  const toggleParticipantSelection = (agentId: string) => {
    setNewSessionParticipants(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSynthesizingSession || !activeSession) return;

    const currSessionId = activeSession.id;

    const userMsg: MultiAgentMessage = {
      id: `m-host-${Date.now()}`,
      senderName: "Host Administrator",
      avatarColor: "#475569",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    // Update locally
    setSessions(prev => prev.map(s => {
      if (s.id === currSessionId) {
        return { ...s, logs: [...s.logs, userMsg] };
      }
      return s;
    }));

    const directive = inputMessage;
    setInputMessage("");
    setIsSynthesizingSession(true);

    // AI Multi-Agent reasoning chain simulation loop!
    try {
      // Step 1: Filter session participating agents
      const activeParticipants = agents.filter(a => activeSession.participants.includes(a.id));
      if (activeParticipants.length === 0) {
        setIsSynthesizingSession(false);
        return;
      }

      // First Responder in sequence
      await new Promise(resolve => setTimeout(resolve, 1500));
      const responder1 = activeParticipants.find(a => a.id === selectedAgentId) || activeParticipants[0];
      
      const chunk1: MultiAgentMessage = {
        id: `m-resp1-${Date.now()}`,
        senderName: responder1.name,
        avatarColor: responder1.avatarColor,
        text: `🤖 **[${responder1.name} CORE RESPONSE]**
Evaluating directives against operational parameters. As my priority matches **${responder1.role}**, I propose compiling this trace to check the local token balance.

Let's inspect dependencies. What are your outputs on this context, team?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currSessionId) {
          return { ...s, logs: [...s.logs, chunk1] };
        }
        return s;
      }));

      // Step 2: Next responder in sequence chimes in to collaborate
      const others = activeParticipants.filter(a => a.id !== responder1.id);
      if (others.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const responder2 = others[Math.floor(Math.random() * others.length)];
        
        const chunk2: MultiAgentMessage = {
          id: `m-resp2-${Date.now()}`,
          senderName: responder2.name,
          avatarColor: responder2.avatarColor,
          text: `⚙️ **[COLLABORATIVE EXPANSION: ${responder2.name}]**
Reviewing proposed audit coordinates from ${responder1.name}. I agree! 

By checking the *Secure API Token Vault* metrics, we confirm that if production level endpoints are empty, we route clean Mock outputs seamlessly to shield real-world pipelines. No simulator violations detected. Ready to deploy!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setSessions(prev => prev.map(s => {
          if (s.id === currSessionId) {
            return { ...s, logs: [...s.logs, chunk2] };
          }
          return s;
        }));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsSynthesizingSession(false);
    }
  };

  // Co-thinking monologue trace strings customized to selected visual agent
  const getAgentMonologue = (id: string): string => {
    const ag = agents.find((a) => a.id === id);
    if (!ag) return "";
    switch (id) {
      case "agent-primary":
        return `[Monologue Trace] Primary Node holding secure matrix layers. Scanning integration telemetry. Checking token balances for HubSpot and Solana RPC paths. Continuous status is: 100% SECURE.`;
      case "agent-claude":
        return `[Monologue Trace] Refactoring active typescript schemas. Preparing Express routers with clean CORS configurations. Standard GitHub Flavored Markdown logs look clean.`;
      case "agent-gemini":
        return `[Monologue Trace] Fetching Google Maps platform data structures. Rendering geographic store indices. Preassembling JSON endpoints with high-fidelity outputs.`;
      case "agent-gpt4":
        return `[Monologue Trace] Polling active backend webhook triggers. Ready to synchronize verified contacts and trigger Slack message payloads to user endpoints.`;
      default:
        return `[Monologue Trace] Autonomous instance active on local client stack. Memory alignment index score: 0.89. Fully queued to cooperate with session components.`;
    }
  };

  // Only render visual nodes on the canvas that are PARTICIPANTS of the active session
  const activeCanvasAgents = activeSession 
    ? agents.filter(a => activeSession.participants.includes(a.id))
    : agents.slice(0, 3);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 text-slate-100 items-stretch flex-1">
      
      {/* 1. SECTOR PANEL: SESSIONS LIBRARY (LEFT 3 COLS ON LG DESKTOP) */}
      <div className="xl:col-span-3 flex flex-col space-y-4 h-full">
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl flex flex-col h-[670px] overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-display font-bold text-sm text-white">Sessions Library</h3>
                <p className="text-[10px] text-slate-450 font-sans">Persistent Cooperative Logs</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCreatingSession(!isCreatingSession);
                setSelectedAgentId(agents[0].id);
              }}
              className="p-1 px-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs rounded-lg text-amber-500 hover:text-amber-400 font-mono flex items-center gap-1 transition cursor-pointer select-none"
              title="Spawn New Cooperative Chat Session"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isCreatingSession ? (
              <motion.form
                key="session-creation-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleCreateSession}
                className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 flex flex-col space-y-3.5"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">Configure Assembly</span>
                  <button 
                    type="button" 
                    onClick={() => setIsCreatingSession(false)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Session Title</label>
                  <input
                    type="text"
                    required
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="e.g. Audit Ledger Alpha"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-2.5 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Select Participants</label>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {agents.map((ag) => {
                      const selected = newSessionParticipants.includes(ag.id);
                      return (
                        <button
                          key={ag.id}
                          type="button"
                          onClick={() => toggleParticipantSelection(ag.id)}
                          className={`w-full flex items-center justify-between p-1.5 px-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                            selected 
                              ? "bg-amber-950/20 border-amber-500/30 text-slate-200" 
                              : "bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.avatarColor }} />
                            <span className="truncate max-w-[120px]">{ag.name}</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-550 truncate max-w-[80px]">
                            {selected ? "[ACTIVE]" : "○ idle"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newSessionParticipants.length === 0 || !newSessionTitle.trim()}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white border border-amber-500 hover:border-amber-400 text-xs font-mono font-bold uppercase rounded-lg transition tracking-wide cursor-pointer select-none"
                >
                  Initiate Collaborative Orbit
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="sessions-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin"
              >
                {sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const messageCount = s.logs.length;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        if (s.participants.length > 0) {
                          setSelectedAgentId(s.participants[0]);
                        }
                      }}
                      className={`group p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col space-y-1.5 ${
                        isActive 
                          ? "bg-slate-950 border-amber-500/25 shadow-lg" 
                          : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[12px] font-semibold font-sans ${isActive ? 'text-white font-bold' : 'text-slate-300'}`}>
                          {s.title}
                        </span>
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer"
                          title="Purge Session Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Interactive miniature circles of agent participants */}
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {s.participants.map((pId) => {
                            const part = agents.find(a => a.id === pId);
                            if (!part) return null;
                            return (
                              <div
                                key={pId}
                                className="w-4 h-4 rounded-full border border-slate-950 flex items-center justify-center font-bold text-[7px]"
                                style={{ backgroundColor: part.avatarColor, color: "#fff" }}
                                title={part.name}
                              >
                                {part.name.substring(0, 1).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-amber-500" />
                          {messageCount} logs
                        </span>
                      </div>

                      <span className="block text-[8px] text-slate-600 font-mono uppercase tracking-wider">
                        Synced: {s.createdAt}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. ATMOSPHERIC CANVAS SECTOR (CENTER 5 COLS ON LG DESKTOP) */}
      <div className="xl:col-span-5 flex flex-col space-y-4 h-full">
        
        {/* Visual Habitat stage */}
        <div className="bg-slate-900/60 border border-slate-800/85 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl relative flex flex-col overflow-hidden h-[465px]">
          
          {/* Habitat Ambient Grid Theme renders */}
          {activeHabitat === "matrix" && (
            <div className="absolute inset-0 bg-[#050512] opacity-80 pointer-events-none transition-all duration-500">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_80%)] animate-pulse" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px]" />
            </div>
          )}

          {activeHabitat === "cyber" && (
            <div className="absolute inset-0 bg-transparent transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-950/20 to-slate-950 opacity-95" />
              <div className="absolute bottom-0 w-full h-1/3 bg-[linear-gradient(transparent,#ec489918)]" />
            </div>
          )}

          {activeHabitat === "zen" && (
            <div className="absolute inset-0 bg-[#070912] opacity-90 transition-all duration-500">
              <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-82 h-82 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
            </div>
          )}

          {activeHabitat === "command" && (
            <div className="absolute inset-0 bg-slate-950/95 transition-all duration-500">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.02)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
            </div>
          )}

          {activeHabitat === "custom" && customBgUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${customBgUrl})` }}
            >
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px]" />
            </div>
          )}

          {/* Canvas Ambient HUD Head */}
          <div className="relative z-10 flex justify-between items-center border-b border-slate-800/60 pb-2.5 mb-1.5">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-pink-400 animate-ping" />
              <span className="font-mono text-[9.5px] font-bold text-slate-200 tracking-wider">
                ORBIT STAGE ACTIVE: {activeHabitat.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[8.5px] bg-slate-950/85 p-1 border border-slate-850 rounded">
              <button 
                onClick={() => setActiveHabitat("matrix")}
                className={`px-1.5 py-0.5 rounded transition ${activeHabitat === "matrix" ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' : 'text-slate-550 hover:text-slate-300'}`}
              >Grid</button>
              <button 
                onClick={() => setActiveHabitat("cyber")}
                className={`px-1.5 py-0.5 rounded transition ${activeHabitat === "cyber" ? 'bg-pink-950 text-pink-450 border border-pink-900/60' : 'text-slate-550 hover:text-slate-300'}`}
              >Cyber</button>
              <button 
                onClick={() => setActiveHabitat("zen")}
                className={`px-1.5 py-0.5 rounded transition ${activeHabitat === "zen" ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/60' : 'text-slate-550 hover:text-slate-300'}`}
              >Zen</button>
              <button 
                onClick={() => setActiveHabitat("command")}
                className={`px-1.5 py-0.5 rounded transition ${activeHabitat === "command" ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'text-slate-550 hover:text-slate-300'}`}
              >Command</button>
            </div>
          </div>

          {/* ACTIVE PARTICIPANTS FLOATING GRAPHS */}
          <div className="flex-1 relative z-10 min-h-[300px]">
            {activeCanvasAgents.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-xl">
                <MessageCircleOff className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                <p className="font-mono text-xs text-slate-500">No participants equipped in active library session.</p>
                <button 
                  onClick={() => setIsCreatingSession(true)}
                  className="mt-3 px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono rounded text-amber-500"
                >
                  Align Session Path
                </button>
              </div>
            ) : (
              activeCanvasAgents.map((ag) => {
                const worksAsSelected = selectedAgentId === ag.id;

                return (
                  <motion.div
                    key={ag.id}
                    className="absolute cursor-pointer group"
                    animate={{ 
                      x: `${ag.x}%`, 
                      y: `${ag.y}%` 
                    }}
                    transition={{ type: "spring", stiffness: 35, damping: 14 }}
                    onClick={() => setSelectedAgentId(ag.id)}
                  >
                    {/* Pulsing Visual background aura */}
                    <div 
                      className={`absolute -inset-3.5 rounded-full filter blur-md opacity-25 group-hover:opacity-60 transition duration-300 ${
                        worksAsSelected ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        backgroundColor: ag.avatarColor,
                        boxShadow: worksAsSelected ? `0 0 16px 6px ${ag.avatarColor}` : 'none'
                      }}
                    />

                    {/* Core visual entity circle */}
                    <div 
                      className="relative w-11 h-11 rounded-full border flex items-center justify-center font-bold tracking-tight text-white transition-all bg-slate-950/95 text-[12px] "
                      style={{ 
                        borderColor: worksAsSelected ? ag.avatarColor : '#1e293b',
                        transform: worksAsSelected ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      {ag.name.substring(0, 2).toUpperCase()}
                      
                      <span 
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-slate-950 animate-pulse" 
                        style={{ backgroundColor: ag.avatarColor }}
                      />
                    </div>

                    {/* Overlay popup tags */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-850 p-1 px-2 rounded hover:border-slate-700 pointer-events-none shadow-xl select-none text-center">
                      <p className="text-[9.5px] font-mono font-bold text-slate-200">{ag.name}</p>
                      <p className="text-[7.5px] text-slate-500 font-sans mt-0.5 mt-px leading-none">{ag.statusText}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* User environmental custom bg form */}
          <form onSubmit={handleApplyCustomBg} className="relative z-10 mt-2 p-1.5 bg-slate-950/90 border border-slate-850/80 rounded-xl flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Inject physical space image URL... (e.g. scenic view)"
              value={customBgInput}
              onChange={(e) => setCustomBgInput(e.target.value)}
              className="w-full bg-transparent border-none text-[10px] font-sans text-slate-400 outline-none placeholder:text-slate-650"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[9px] font-mono rounded cursor-pointer hover:border-slate-700 hover:text-white transition"
            >
              Sync Habitat
            </button>
          </form>
        </div>

        {/* Selected Thoughts monitor trace display */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-pink-400" />
              <span className="font-mono text-xs text-slate-300 font-bold uppercase">
                INTELLIGENT MONITOR: <span className="font-semibold" style={{ color: agents.find(a => a.id === selectedAgentId)?.avatarColor || "#f97316" }}>{agents.find(a => a.id === selectedAgentId)?.name || "Primary S.O.U.L"}</span>
              </span>
            </div>
            
            <span className="text-[9px] font-mono text-slate-550 border border-slate-900 bg-slate-950 px-1.5 rounded uppercase">
              CORESYNC V2.2
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg font-mono text-[10.5px] leading-relaxed text-slate-400 select-all min-h-[50px]">
            {getAgentMonologue(selectedAgentId)}
          </div>
        </div>

      </div>

      {/* 3. COOP FORMS & DIALOGUE SECTOR (RIGHT 4 COLS ON LG DESKTOP) */}
      <div className="xl:col-span-4 flex flex-col space-y-4 h-full">
        
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl relative flex flex-col h-[670px]">
          
          <div className="flex items-center gap-2 border-b border-slate-805 pb-3 mb-2.5 shrink-0">
            <Bot className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-display font-bold text-sm text-white">Cooperative Workspace Dialogue</h3>
              <p className="text-[10px] text-slate-500 font-sans">Multiplex Co-Reasoning Stream</p>
            </div>
          </div>

          {/* Participating list indicator toggles */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-thin border-b border-slate-900">
            {activeSession ? (
              agents.filter(a => activeSession.participants.includes(a.id)).map(ag => {
                const isSel = selectedAgentId === ag.id;
                return (
                  <button
                    key={ag.id}
                    onClick={() => setSelectedAgentId(ag.id)}
                    className={`flex items-center gap-1.5 p-1 px-2.5 border rounded-lg text-[10px] font-mono tracking-wider transition-all cursor-pointer whitespace-nowrap uppercase outline-none ${
                      isSel 
                        ? "bg-slate-950 text-white font-bold" 
                        : "bg-slate-900/30 border-slate-850 text-slate-500 hover:text-slate-350"
                    }`}
                    style={{ borderColor: isSel ? ag.avatarColor : "transparent" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ag.avatarColor }} />
                    {ag.name}
                  </button>
                );
              })
            ) : (
              <span className="text-[10px] text-slate-600 font-mono">No active session loaded</span>
            )}

            {/* Assemble custom MiniAgent clicker */}
            <button 
              onClick={() => setSelectedAgentId("_new")}
              className="p-1 px-1.5 border border-dashed border-slate-800 hover:border-amber-500/50 rounded-lg text-[9px] font-mono text-slate-500 hover:text-amber-500 transition cursor-pointer shrink-0 uppercase"
              title="Spawn Custom Miniature Agent Block"
            >
              + Create Agent
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {selectedAgentId === "_new" ? (
                <motion.form 
                  key="agent-generator-panel"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleAddAgent}
                  className="bg-slate-950/90 border border-slate-850 rounded-xl p-3.5 space-y-3.5 flex-1 overflow-y-auto scrollbar-thin"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Assemble MiniAgent Matrix</span>
                    <button 
                      type="button"
                      onClick={() => setSelectedAgentId("agent-primary")}
                      className="text-[10px] font-mono text-slate-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Agent Name</label>
                    <input
                      type="text"
                      required
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      placeholder="e.g. Security Guard"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg px-2.5 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Orbital Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={newAgentColor}
                        onChange={(e) => setNewAgentColor(e.target.value)}
                        className="w-8 h-8 rounded border-none bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={newAgentColor}
                        onChange={(e) => setNewAgentColor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Functional Specialization</label>
                    <input
                      type="text"
                      value={newAgentRole}
                      onChange={(e) => setNewAgentRole(e.target.value)}
                      placeholder="e.g. Audit ledger variables and webhook validation"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500/50 rounded-lg px-2.5 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase rounded-lg border border-purple-500 transition select-none cursor-pointer"
                  >
                    Confirm Genesis Assembly
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="chat-box-workspace" 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Chat Session Scroll Logs container */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-3.5 pr-1 hover:pr-0 text-left scrollbar-thin">
                    {activeSession ? (
                      activeSession.logs.map((m) => {
                        const isHost = m.senderName === "Host Administrator";
                        const isSysSeed = m.senderName === "System Core";

                        if (isSysSeed) {
                          return (
                            <div key={m.id} className="py-2.5 px-3 border border-slate-850 bg-slate-950/60 rounded-xl text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
                              {m.text}
                            </div>
                          );
                        }

                        return (
                          <div key={m.id} className={`flex flex-col ${isHost ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-500 font-bold">
                              {!isHost && (
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.avatarColor }} />
                              )}
                              <span>{m.senderName}</span>
                              <span className="text-[8px] text-slate-650 font-mono font-medium">{m.timestamp}</span>
                            </div>

                            <div 
                              className={`max-w-[92%] text-[11.5px] rounded-xl px-3.5 py-2.5 font-sans leading-relaxed text-slate-300 ${
                                isHost 
                                  ? "bg-slate-800 border border-slate-700/80 rounded-tr-none text-slate-200 shadow-md" 
                                  : "bg-slate-950 border border-slate-850 rounded-tl-none whitespace-pre-wrap"
                              }`}
                              style={{
                                borderLeftColor: !isHost ? m.avatarColor : undefined,
                                borderLeftWidth: !isHost ? "2.5px" : "1px"
                              }}
                            >
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-20 font-mono text-slate-500 text-xs">
                        No active workspace loaded. Initiate a session on the library.
                      </div>
                    )}

                    {isSynthesizingSession && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500 p-1.5 bg-amber-950/10 border border-amber-900/35 rounded-lg animate-pulse">
                        <Zap className="w-3.5 h-3.5 animate-spin" />
                        <span>Multiplex co-reasoning chain generating dialogue turns...</span>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Operational Interactive Dialog form input */}
                  {activeSession && (
                    <form onSubmit={handleSendMessage} className="bg-slate-950 border border-slate-850 rounded-xl p-2 flex items-center gap-2 shrink-0 relative overflow-hidden">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        disabled={isSynthesizingSession}
                        placeholder={`Direct session... (responder: ${agents.find(a => a.id === selectedAgentId)?.name || 'active team'})`}
                        className="w-full bg-transparent border-none py-2 px-3 text-xs font-sans text-slate-100 outline-none focus:ring-0 placeholder:text-slate-650 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isSynthesizingSession || !inputMessage.trim()}
                        className="p-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg cursor-pointer disabled:opacity-50 transition border border-amber-500"
                        title="Dispatch prompt to active participants"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
};
