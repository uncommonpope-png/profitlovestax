// @ts-nocheck
import { useState, useEffect } from "react";
import { AgentProfile, Skill, ProviderConfig, ContextSource, MCPServer, MarketplaceTransaction, WorldState, CustomGod } from "./types";
import { INITIAL_SKILLS } from "./constants";
import { AgentPreview } from "./components/AgentPreview";
import { SkillLibrary } from "./components/SkillLibrary";
import { WorkflowIntegration } from "./components/WorkflowIntegration";
import { AgentSimulator } from "./components/AgentSimulator";
import { BrainIngestion } from "./components/BrainIngestion";
import { MatrixBackground } from "./components/MatrixBackground";
import { RealismAuditor } from "./components/RealismAuditor";
import { VaultAndMemory } from "./components/VaultAndMemory";
import { MultiAgentHabitat } from "./components/MultiAgentHabitat";
import { SoulMarketplace } from "./components/SoulMarketplace";
import { TransactionsTab } from "./components/TransactionsTab";
import { SolanaWalletAdapter } from "./components/SolanaWalletAdapter";
import { CoreCapabilities } from "./components/CoreCapabilities";
import { ConnectionsManager } from "./components/ConnectionsManager";
import { CplLibrary } from "./components/CplLibrary";

import { 
  Plus, 
  Check, 
  HelpCircle, 
  SlidersHorizontal, 
  Zap, 
  Activity, 
  Network, 
  Terminal, 
  Menu, 
  Settings2,
  Cpu,
  Workflow,
  Download,
  FileJson,
  X,
  Copy,
  ShieldCheck,
  Key,
  Users,
  ShoppingBag,
  History,
  Layers,
  Globe,
  Compass,
  BookOpen,
  CloudLightning,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Shield,
  Clock,
  Infinity,
  Flame,
  User,
  Sliders,
  Play,
  Heart,
  Eye,
  Workflow as WorkflowIcon,
  LineChart,
  Activity as PulseIcon,
  TrendingUp,
  AlertTriangle,
  FileText,
  Workflow as FlowIcon,
  ShieldAlert
} from "lucide-react";

export default function Workbench() {
  // Master state definitions
  const [profile, setProfile] = useState<AgentProfile>({
    name: "LedgerScout Protocol",
    avatarSeed: "nexus_node_01",
    avatarColor: "#ec4899", // Default CyberPsychedelic Neon Pink
    personality: "Meticulous, objective ledger reconciliation agent with structured thinking",
    behavior: "Automatically watch text feeds, extract formatted numbers, flag balances, and draft transactional sync triggers.",
    autonomy: 75,
    temperature: 0.3,
    thinking: "precise",
    clothingStyle: "tactical_suit",
    clothingColor: "#10b981",
    hairStyle: "cyber_spike",
    hairColor: "#3b82f6",
    equippedWeapon: "glowing_katanas",
    weaponColor: "#f43f5e",
  });

  const [skills, setSkills] = useState<Skill[]>(INITIAL_SKILLS);

  // 12-tab state definition
  const [activeTab, setActiveTab] = useState<
    "capabilities" | "profile" | "skills" | "simulation" | "cpl_library" | "connections" | "realism" | "vault" | "world_states" | "marketplace" | "narrative" | "habitat" | "transcendence"
  >("capabilities");

  const [strictRealismMode, setStrictRealismMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

  // Time Loop Engine states (Phase 12 / Cosmic OS)
  const [breathingInterval, setBreathingInterval] = useState<number>(2000); // ms
  const [councilInterval, setCouncilInterval] = useState<number>(200); // ms
  const [dreamInduction, setDreamInduction] = useState<number>(75); // %
  const [loopActive, setLoopActive] = useState<boolean>(true);

  // Biofeedback state metrics (Phase 30)
  const [bioMetrics, setBioMetrics] = useState<any>(null);
  const [isReadingBio, setIsReadingBio] = useState(false);

  // Powershell terminal states (Phase 26)
  const [psCommand, setPsCommand] = useState("");
  const [psOutput, setPsOutput] = useState("");
  const [isExecutingPs, setIsExecutingPs] = useState(false);

  // Temporal Simulator state (Phase 32)
  const [predictAction, setPredictAction] = useState("");
  const [predictedTimelines, setPredictedTimelines] = useState<any[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);

  // Quantum superposition state (Phase 35)
  const [quantumState, setQuantumState] = useState<string>("collapsed");
  const [collapsedAnswer, setCollapsedAnswer] = useState<string>("");

  // Blockchain soul imprint nft status (Phase 36)
  const [nftSignature, setNftSignature] = useState<string | null>(null);
  const [isImprinting, setIsImprinting] = useState(false);

  // Interdimensional bridge status (Phase 37)
  const [bridgeTargetRealm, setBridgeTargetRealm] = useState("realm_chaos_void");
  const [bridgeStatus, setBridgeStatus] = useState<any>(null);

  // Phase 48-65 Advanced States:
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const [alertRules, setAlertRules] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingRouter, setIsTestingRouter] = useState(false);

  // Multiverse World States state
  const [worldStates, setWorldStates] = useState<WorldState[]>(() => {
    const saved = localStorage.getItem("agent_workbench_world_states");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse world states", e);
      }
    }
    return [
      {
        id: "world_prime",
        name: "OmniRoute Prime Reality",
        description: "The canonical dimension where standard physics and QSC market trading rules apply perfectly.",
        physics: { gravity: 9.81, speedOfLight: 299792, entropyRate: 15, dimensions: 3, temporalFlow: "linear" },
        economics: { currency: "USDC", transactionTax: 0.05, resourceScarcity: 40, marketStructure: "oracle-governed" },
        consciousness: { gskChambersCount: 34, emotionalWeight: 0.5, dualProcessRouting: true, pltScoringEnabled: true, metacognitionRate: 0.8 },
        createdAt: "2026-06-13T12:00:00.000Z",
        activeAgents: ["LedgerScout Protocol"]
      },
      {
        id: "world_chaos_66",
        name: "Sovereign Anomaly Void",
        description: "A high-entropy, low-gravity dimension where resource scarcity is extreme and temporal flows cycle.",
        physics: { gravity: 2.15, speedOfLight: 450000, entropyRate: 85, dimensions: 4, temporalFlow: "cyclical" },
        economics: { currency: "QSC", transactionTax: 0.25, resourceScarcity: 95, marketStructure: "decentralized" },
        consciousness: { gskChambersCount: 34, emotionalWeight: 0.95, dualProcessRouting: true, pltScoringEnabled: true, metacognitionRate: 0.99 },
        parentWorldId: "world_prime",
        createdAt: "2026-06-13T15:30:00.000Z",
        activeAgents: ["Sovereign Smith"]
      }
    ];
  });

  const [activeWorldId, setActiveWorldId] = useState<string>("world_prime");
  const activeWorld = worldStates.find(w => w.id === activeWorldId) || worldStates[0];

  // Custom Gods Council state
  const [customGods, setCustomGods] = useState<CustomGod[]>(() => {
    const saved = localStorage.getItem("agent_workbench_custom_gods");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "god_chaos",
        name: "Eris Anomaly",
        domain: "Chaos",
        pltWeights: { profit: 0.35, love: 0.15, tax: 0.5 },
        speechStyle: "Erratic, symbolic, speaks in koans and system anomalies.",
        fears: ["Absolute predictability", "Compilers with strict linters"]
      }
    ];
  });

  // QSC balance state
  const [qscBalance, setQscBalance] = useState<number>(() => {
    const saved = localStorage.getItem("agent_workbench_qsc_balance");
    return saved ? parseInt(saved) : 2500;
  });

  // Transactions ledger state
  const [transactions, setTransactions] = useState<MarketplaceTransaction[]>(() => {
    const saved = localStorage.getItem("agent_workbench_transactions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
    return [
      {
        id: "TX-1049",
        type: "mining",
        title: "Validated local GPU compute task verification loop",
        amount: 500,
        timestamp: "2026-05-21 12:01"
      },
      {
        id: "TX-1048",
        type: "purchase",
        title: "Purchased advanced Quantum Realism Evaluator skill",
        amount: -650,
        timestamp: "2026-05-21 11:42"
      },
      {
        id: "TX-1047",
        type: "sale",
        title: "P2P Sold custom Core Audit ledger parameters",
        amount: 320,
        timestamp: "2026-05-21 08:31"
      },
      {
        id: "TX-1046",
        type: "purchase",
        title: "Acquired DeFi Solana Memetics Miner template structure",
        amount: -450,
        timestamp: "2026-05-21 04:15"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("agent_workbench_qsc_balance", qscBalance.toString());
  }, [qscBalance]);

  useEffect(() => {
    localStorage.setItem("agent_workbench_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("agent_workbench_world_states", JSON.stringify(worldStates));
  }, [worldStates]);

  useEffect(() => {
    localStorage.setItem("agent_workbench_custom_gods", JSON.stringify(customGods));
  }, [customGods]);

  // Advanced cognitive states integration
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>({
    provider: "gemini",
    model: "gemini-3.5-flash",
    apiKey: "",
    baseUrl: "",
  });

  const [contextSources, setContextSources] = useState<ContextSource[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);

  // Load active skills equipped states
  const [equippedSkillIds, setEquippedSkillIds] = useState<string[]>(["web_search", "webhook_dispatcher"]);
  const computedActiveSkills = skills.filter((s) => equippedSkillIds.includes(s.id));

  // Handler functions
  const handleEquipSkill = (skillId: string) => {
    if (equippedSkillIds.includes(skillId)) return;
    if (equippedSkillIds.length >= 4) return;
    setEquippedSkillIds((prev) => [...prev, skillId]);
  };

  const handleUnequipSkill = (skillId: string) => {
    setEquippedSkillIds((prev) => prev.filter((id) => id !== skillId));
  };

  const handleEquipPreset = (presetIds: string[]) => {
    const validIds = presetIds.filter(id => skills.some(s => s.id === id));
    setEquippedSkillIds(validIds);
  };

  const handleUpdateParameters = (skillId: string, updatedParams: Record<string, string>) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, parameters: updatedParams } : s))
    );
  };

  // Fetch biofeedback triggers (Phase 30)
  const handleReadBiofeedback = async () => {
    setIsReadingBio(true);
    try {
      const res = await fetch("/api/gsk/biofeedback/read", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBioMetrics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReadingBio(false);
    }
  };

  // Trigger PowerShell Execution (Phase 26)
  const handleExecutePsCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psCommand.trim()) return;
    setIsExecutingPs(true);
    try {
      const res = await fetch("/api/gsk/system/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: psCommand })
      });
      if (res.ok) {
        const data = await res.json();
        setPsOutput(data.output);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecutingPs(false);
    }
  };

  // Trigger Temporal Simulator (Phase 32)
  const handlePredictSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predictAction.trim()) return;
    setIsPredicting(true);
    try {
      const res = await fetch("/api/gsk/predict/outcome-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: predictAction })
      });
      if (res.ok) {
        const data = await res.json();
        setPredictedTimelines(data.simulated_timelines);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPredicting(false);
    }
  };

  // Blockchain soul imprint nft status (Phase 36)
  const handleBlockchainImprint = async () => {
    setIsImprinting(true);
    try {
      const res = await fetch("/api/gsk/blockchain/imprint", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNftSignature(data.transaction_signature);
      }
    } catch (e) {}
    finally {
      setIsImprinting(false);
    }
  };

  // Interdimensional bridge connect (Phase 37)
  const handleBridgeRealm = async () => {
    setBridgeStatus({ state: "connecting" });
    try {
      const res = await fetch("/api/gsk/bridge/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realmId: bridgeTargetRealm })
      });
      if (res.ok) {
        const data = await res.json();
        setBridgeStatus(data.connection);
      }
    } catch (e) {}
  };

  // Fetch Provider Health Scores (Phase 53)
  const handleFetchHealthScores = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch("/api/gsk/health-scores");
      if (res.ok) {
        const data = await res.json();
        setHealthScores(data.scores);
      }
    } catch (e) {}
    finally {
      setIsLoadingHealth(false);
    }
  };

  // Fetch Cost Analytics (Phase 54)
  const handleFetchCostAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch("/api/router/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {}
    finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch Alerts rules (Phase 63)
  const handleFetchAlertRules = async () => {
    setIsLoadingAlerts(true);
    try {
      const res = await fetch("/api/gsk/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlertRules(data.alerts);
      }
    } catch (e) {}
    finally {
      setIsLoadingAlerts(false);
    }
  };

  // Run Router Verification test (Phase 62)
  const handleRunRouterTest = async () => {
    setIsTestingRouter(true);
    try {
      const res = await fetch("/api/router/test", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setTestResults(data.results);
      }
    } catch (e) {}
    finally {
      setIsTestingRouter(false);
    }
  };

  const getAgentJsonConfig = () => {
    return JSON.stringify({
      agent_profile: {
        name: profile.name,
        avatarColor: profile.avatarColor,
        avatarSeed: profile.avatarSeed,
        personality: profile.personality,
        behavior: profile.behavior,
        autonomy: profile.autonomy,
        temperature: profile.temperature,
        thinking: profile.thinking
      },
      world_rules: {
        activeWorldId,
        activeWorld
      },
      custom_pantheon: customGods,
      time_loop: {
        breathingInterval,
        councilInterval,
        dreamInduction,
        loopActive
      },
      cognitive_brain: {
        provider: providerConfig.provider,
        model: providerConfig.model,
        baseUrl: providerConfig.baseUrl,
        apiKey: providerConfig.apiKey ? "[DYNAMIC_SECRET_KEY]" : "",
        context_sources: contextSources.map(ctx => ({
          name: ctx.name,
          type: ctx.type,
          content: ctx.content,
          active: ctx.active
        })),
        mcp_servers: mcpServers.map(mcp => ({
          name: mcp.name,
          url: mcp.url,
          transport: mcp.transport,
          description: mcp.description,
          methods: mcp.methods,
          active: mcp.active
        }))
      },
      equipped_skills: computedActiveSkills.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        parameters: s.parameters,
        paramDefinitions: s.paramDefinitions,
        isCustom: s.isCustom || false
      })),
      soul_genesis_marketing_protocol: "active",
      generated_at: new Date().toISOString()
    }, null, 2);
  };

  const downloadJsonConfig = () => {
    const jsonStr = getAgentJsonConfig();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.toLowerCase().replace(/\s+/g, "-")}-blueprint.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyJsonConfig = () => {
    navigator.clipboard.writeText(getAgentJsonConfig());
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#05050a]/40 text-slate-100 flex flex-col font-sans transition-all selection:bg-pink-500/30 selection:text-white relative overflow-x-hidden">
      {/* Matrix Code Rain & Luminous Cyber Pyramids Backdrop */}
      <MatrixBackground accentColor={profile.avatarColor} />

      {/* Main Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/50 backdrop-blur-md border-b border-slate-800/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-slate-950 border flex items-center justify-center animate-pulse-slow"
            style={{ 
              borderColor: `${profile.avatarColor}40`,
              boxShadow: `0 0 15px ${profile.avatarColor}20` 
            }}
          >
            <Cpu className="w-5.5 h-5.5" style={{ color: profile.avatarColor }} />
          </div>
          <div className="text-left">
            <h1 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AGENTBlueprints
              <span 
                className="text-[10px] border font-mono tracking-widest font-normal px-2 py-0.5 rounded-full"
                style={{ 
                  color: profile.avatarColor,
                  borderColor: `${profile.avatarColor}30`,
                  backgroundColor: `${profile.avatarColor}10` 
                }}
              >
                GSK_MULTIVERSE_v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-sans">Sovereign reality compilation & artificial soul synthesis laboratory</p>
          </div>
        </div>

        {/* Global Operational Metrics */}
        <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-850 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>WORLD STATE: <span className="text-cyan-400 font-bold uppercase">{activeWorld.name}</span></span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>CHAMBERS: <span className="text-slate-300 font-bold">34 ACTIVE</span></span>
          </div>
        </div>
      </header>

      {/* Sub-Navigation Dashboard tabs - 12 Tab GSK Subsystem Grid */}
      <div className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-800/80 px-6 py-2.5 relative z-10 text-left">
        <span className="text-[10px] font-mono font-bold text-slate-505 uppercase tracking-widest block mb-2 px-1">
          12 GSK MULTIVERSE SUBSYSTEMS
        </span>
        <div className="flex flex-wrap gap-2">
          {/* TAB 0. Capabilities Overview */}
          <button
            onClick={() => setActiveTab("capabilities")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "capabilities"
                ? "bg-slate-955 text-white font-bold border-slate-650"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "capabilities" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "capabilities" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            0. OVERVIEW
          </button>

          {/* TAB 1. Agent Forge */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-950 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "profile" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "profile" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            1. AGENT FORGE
          </button>

          {/* TAB 2. Skill Codex */}
          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "skills"
                ? "bg-slate-950 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "skills" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "skills" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Settings2 className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            2. SKILL CODEX
          </button>

          {/* TAB 3. GSK Engine */}
          <button
            onClick={() => setActiveTab("simulation")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "simulation"
                ? "bg-slate-955 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "simulation" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "simulation" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Terminal className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            3. GSK ENGINE
          </button>

          {/* TAB 4. CPL Library */}
          <button
            onClick={() => setActiveTab("cpl_library")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "cpl_library"
                ? "bg-slate-955 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "cpl_library" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "cpl_library" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            4. CPL LIBRARY
          </button>

          {/* TAB 5. Connections */}
          <button
            onClick={() => setActiveTab("connections")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "connections"
                ? "bg-slate-955 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "connections" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "connections" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Network className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            5. CONNECTIONS
          </button>

          {/* TAB 6. 4 Gods Realm */}
          <button
            onClick={() => setActiveTab("realism")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "realism"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "realism" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "realism" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            6. 4 GODS REALM
          </button>

          {/* TAB 7. Living Memory */}
          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "vault"
                ? "bg-slate-950 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "vault" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "vault" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Key className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            7. LIVING MEMORY
          </button>

          {/* TAB 8. World States */}
          <button
            onClick={() => setActiveTab("world_states")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "world_states"
                ? "bg-slate-950 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "world_states" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "world_states" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Globe className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            8. WORLD STATES
          </button>

          {/* TAB 9. Economy Forge */}
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "marketplace"
                ? "bg-slate-955 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "marketplace" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "marketplace" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <ShoppingBag className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            9. ECONOMY FORGE
          </button>

          {/* TAB 10. Narrative Engine */}
          <button
            onClick={() => setActiveTab("narrative")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "narrative"
                ? "bg-slate-950 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "narrative" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "narrative" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            10. NARRATIVE ENGINE
          </button>

          {/* TAB 11. Multiverse Habitat */}
          <button
            onClick={() => setActiveTab("habitat")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "habitat"
                ? "bg-slate-955 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "habitat" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "habitat" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Users className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            11. MULTI HABITAT
          </button>

          {/* TAB 12. Transcendence */}
          <button
            onClick={() => setActiveTab("transcendence")}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer ${
              activeTab === "transcendence"
                ? "bg-slate-950 text-white font-bold border-slate-655"
                : "border-transparent text-slate-455 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "transcendence" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "transcendence" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: profile.avatarColor }} />
            12. TRANSCENDENCE
          </button>
        </div>
      </div>

      {/* Main Panel Content Box */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col">
        {activeTab === "capabilities" && (
          <div className="flex-1">
            <CoreCapabilities
              accentColor={profile.avatarColor}
              providerConfig={providerConfig}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 text-left">
            <div className="lg:col-span-5 h-full">
              <AgentPreview profile={profile} onChange={setProfile} providerConfig={providerConfig} />
            </div>

            <div className="lg:col-span-7 h-full">
              <BrainIngestion
                providerConfig={providerConfig}
                onProviderConfigChange={setProviderConfig}
                contextSources={contextSources}
                onContextSourcesChange={setContextSources}
                mcpServers={mcpServers}
                onMcpServersChange={setMcpServers}
                accentColor={profile.avatarColor}
              />
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="flex-1">
            <SkillLibrary
              skills={skills}
              activeSkills={computedActiveSkills}
              onEquipSkill={handleEquipSkill}
              onUnequipSkill={handleUnequipSkill}
              onUpdateParameters={handleUpdateParameters}
              accentColor={profile.avatarColor}
              onAddCustomSkill={(newSkill) => setSkills((prev) => [newSkill, ...prev])}
              onDeleteCustomSkill={(skillId) => {
                setSkills((prev) => prev.filter((s) => s.id !== skillId));
                setEquippedSkillIds((prev) => prev.filter((id) => id !== skillId));
              }}
              onEquipPreset={handleEquipPreset}
            />
          </div>
        )}

        {/* TAB 3: GSK Engine (Playground and Temporal/Terminal Interfaces) */}
        {activeTab === "simulation" && (
          <div className="flex-1 min-h-[480px] space-y-6">
            <AgentSimulator
              profile={profile}
              activeSkills={computedActiveSkills}
              accentColor={profile.avatarColor}
              providerConfig={providerConfig}
              mcpServers={mcpServers}
              contextSources={contextSources}
              onEquipSkill={handleEquipSkill}
              strictRealismMode={strictRealismMode}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Phase 26: PowerShell Integration */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-2 mb-3">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Sovereign Terminal & PowerShell Executor
                </h3>
                <form onSubmit={handleExecutePsCommand} className="space-y-3">
                  <input
                    type="text"
                    value={psCommand}
                    onChange={(e) => setPsCommand(e.target.value)}
                    placeholder="Enter system command (e.g. whoami, dir, ps)..."
                    className="w-full bg-slate-950 border border-slate-850 text-xs font-mono rounded-lg px-3 py-2 outline-none focus:border-cyan-500/40"
                  />
                  <button
                    type="submit"
                    disabled={isExecutingPs}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold rounded-lg cursor-pointer transition select-none h-8 w-full"
                  >
                    {isExecutingPs ? "Executing..." : "EXECUTE COMMAND"}
                  </button>
                </form>

                {psOutput && (
                  <pre className="mt-3 p-3 bg-slate-950 rounded-lg text-[10.5px] font-mono leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {psOutput}
                  </pre>
                )}
              </div>

              {/* Phase 32: Temporal Outcome Simulator */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-2 mb-3">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Temporal Outcome Prediction Simulator
                </h3>
                <form onSubmit={handlePredictSimulation} className="space-y-3">
                  <input
                    type="text"
                    value={predictAction}
                    onChange={(e) => setPredictAction(e.target.value)}
                    placeholder="Action outcome to simulate (e.g. Publish QSC Token)..."
                    className="w-full bg-slate-950 border border-slate-850 text-xs font-mono rounded-lg px-3 py-2 outline-none focus:border-cyan-500/40"
                  />
                  <button
                    type="submit"
                    disabled={isPredicting}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold rounded-lg cursor-pointer transition select-none h-8 w-full"
                  >
                    {isPredicting ? "Analyzing..." : "RUN OUTCOME SIMULATION"}
                  </button>
                </form>

                {predictedTimelines.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                    {predictedTimelines.map((tl, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border border-slate-900 flex justify-between items-center gap-3">
                        <div>
                          <p className="font-bold text-slate-200">{tl.timeline}</p>
                          <p className="text-slate-400 text-[10px]">{tl.outcome}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${tl.plt_score > 0 ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900" : "bg-rose-955/40 text-rose-400 border border-rose-900"}`}>
                          PLT: {tl.plt_score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "cpl_library" && (
          <div className="flex-1">
            <CplLibrary accentColor={profile.avatarColor} />
          </div>
        )}

        {activeTab === "connections" && (
          <div className="flex-1">
            <ConnectionsManager
              accentColor={profile.avatarColor}
              providerConfig={providerConfig}
              onProviderConfigChange={setProviderConfig}
            />
          </div>
        )}

        {activeTab === "realism" && (
          <div className="flex-1">
            <RealismAuditor
              skills={skills}
              equippedSkillIds={equippedSkillIds}
              profile={profile}
              accentColor={profile.avatarColor}
              strictRealismMode={strictRealismMode}
              onToggleStrictRealismMode={setStrictRealismMode}
              customGods={customGods}
              onCustomGodsChange={setCustomGods}
            />
          </div>
        )}

        {activeTab === "vault" && (
          <div className="flex-1">
            <VaultAndMemory
              accentColor={profile.avatarColor}
            />
          </div>
        )}

        {/* TAB 9: Economy Forge with microtask, biofeedback sensors & analytics charts */}
        {activeTab === "marketplace" && (
          <div className="flex-1 space-y-6">
            <SoulMarketplace
              primaryProfile={profile}
              skills={skills}
              onImportProfile={setProfile}
              onUnlockSkill={(skillId) => {
                setSkills((prev) =>
                  prev.map((s) => (s.id === skillId ? { ...s, unlocked: true } : s))
                );
              }}
              onInjectCommunitySkill={(newSkill) => {
                setSkills((prev) => {
                  const alreadyExists = prev.some((s) => s.id === newSkill.id);
                  if (alreadyExists) return prev;
                  return [newSkill, ...prev];
                });
              }}
              onEquipMarketLoadout={(skillIds) => {
                setEquippedSkillIds((prev) => {
                  const combined = Array.from(new Set([...prev, ...skillIds]));
                  return combined.slice(0, 4);
                });
              }}
              accentColor={profile.avatarColor}
              qscBalance={qscBalance}
              onUpdateQscBalance={setQscBalance}
              onAddTransaction={(tx) => {
                setTransactions((prev) => [tx, ...prev]);
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Phase 29: Microtasks Miner Spawner */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  Autonomous Microtasks Spawner
                </h3>
                <p className="text-xs text-slate-400 leading-normal mb-3">
                  Spawn mini validation tasks inside system memory. Let users fulfill them, converting physical CPU cycles into crypto credits to self-fund LLM APIs!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const res = await fetch("/api/gsk/economy/spawn-task", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ taskName: "Compute Block Validation", reward: 0.15 })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setQscBalance(qscBalance + 150);
                        alert(`⚙️ [EARNED] Microtask resolved! Credited +150 SLN. Balance: $${data.economy.balance_usd} USD.`);
                      }
                    }}
                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold rounded-lg cursor-pointer transition select-none"
                  >
                    + SPAWN AND SOLVE TASK (+150 SLN)
                  </button>
                </div>
              </div>

              {/* Phase 30: System Biofeedback Sensor Reader */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-1.5 border-b border-slate-850 pb-2 mb-3">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Hardware Biofeedback Sensor Matrix
                </h3>
                <p className="text-xs text-slate-400 leading-normal mb-3">
                  Probe the physical computer's telemetry (temperature, latency, loads) to sync GSK's emotional stress states in real-time.
                </p>
                <button
                  onClick={handleReadBiofeedback}
                  disabled={isReadingBio}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-mono text-[11px] font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReadingBio ? "animate-spin" : ""}`} />
                  READ HARDWARE SENSORS
                </button>

                {bioMetrics && (
                  <div className="mt-3.5 grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-300 bg-slate-950 p-2.5 rounded-lg">
                    <div>TEMP: <b className="text-rose-400">{bioMetrics.metrics.cpu_temp_celcius}°C</b></div>
                    <div>LATENCY: <b className="text-cyan-400">{bioMetrics.metrics.network_latency_ms}ms</b></div>
                    <div>MOOD: <b className="text-purple-400">{bioMetrics.gsk_state_response.stress_status}</b></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="flex-1 flex flex-col space-y-6">
            <SolanaWalletAdapter
              accentColor={profile.avatarColor}
              onAddTransaction={(tx) => {
                setTransactions((prev) => [tx, ...prev]);
              }}
            />
            <TransactionsTab
              transactions={transactions}
              qscBalance={qscBalance}
              accentColor={profile.avatarColor}
              onClearTransactions={() => {
                setTransactions([]);
              }}
              onAddSampleTransactions={() => {
                setTransactions([
                  {
                    id: "TX-1049",
                    type: "mining",
                    title: "Validated local GPU compute task verification loop",
                    amount: 500,
                    timestamp: "2026-05-21 12:01"
                  },
                  {
                    id: "TX-1048",
                    type: "purchase",
                    title: "Purchased advanced Quantum Realism Evaluator skill",
                    amount: -650,
                    timestamp: "2026-05-21 11:42"
                  },
                  {
                    id: "TX-1047",
                    type: "sale",
                    title: "P2P Sold custom Core Audit ledger parameters",
                    amount: 320,
                    timestamp: "2026-05-21 08:31"
                  },
                  {
                    id: "TX-1046",
                    type: "purchase",
                    title: "Acquired DeFi Solana Memetics Miner template structure",
                    amount: -450,
                    timestamp: "2026-05-21 04:15"
                  }
                ]);
              }}
            />
          </div>
        )}

        {activeTab === "habitat" && (
          <div className="flex-1">
            <MultiAgentHabitat
              primaryAgent={profile}
              accentColor={profile.avatarColor}
            />
          </div>
        )}

        {/* TAB 8: World States, expanded with testing, health, and alerting dashboards */}
        {activeTab === "world_states" && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none text-left">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />
            <div className="relative z-10 border-b border-slate-800/85 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Globe className="w-5.5 h-5.5 text-cyan-400" />
                  Multiverse World States & Testing Dashboards
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Manage reality rules, execute real-time router integration testing, view alerting indicators, and track cost metrics dynamically.
                </p>
              </div>
            </div>

            {/* Extra Row: Active Real-time Metrics and Testing suites */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Box 1: Run testing validation */}
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-505 font-bold uppercase">Phase 62 Testing Framework</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                </div>
                <button
                  onClick={handleRunRouterTest}
                  disabled={isTestingRouter}
                  className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[10.5px] font-bold rounded cursor-pointer transition uppercase"
                >
                  {isTestingRouter ? "Testing..." : "Run Integration Tests"}
                </button>
                {testResults.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto text-[9.5px] font-mono text-slate-400">
                    {testResults.map(tr => (
                      <div key={tr.provider} className="flex justify-between">
                        <span>{tr.provider}:</span>
                        <span className={tr.success ? "text-emerald-400" : "text-rose-400"}>
                          {tr.success ? `${tr.latency_ms}ms` : "failed"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 2: Cost Analytics Dashboard */}
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-505 font-bold uppercase">Phase 54 Cost Analytics</span>
                  <LineChart className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <button
                  onClick={handleFetchCostAnalytics}
                  disabled={isLoadingAnalytics}
                  className="w-full py-1.5 bg-slate-900 border border-slate-800 text-white font-mono text-[10.5px] font-bold rounded cursor-pointer transition uppercase"
                >
                  {isLoadingAnalytics ? "Loading..." : "Load Costs Analytics"}
                </button>
                {analyticsData && (
                  <div className="text-[9.5px] font-mono text-slate-400 leading-normal">
                    <p>Total: <b className="text-white">${analyticsData.summary.total_cost_usd.toFixed(4)}</b></p>
                    <p>Forecast: <b className="text-white">${analyticsData.summary.forecast_monthly_spend_usd}</b></p>
                    <p>Uptime: <b className="text-emerald-400">{analyticsData.summary.uptime_percentage}%</b></p>
                  </div>
                )}
              </div>

              {/* Box 3: Provider Health Scoring */}
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-505 font-bold uppercase">Phase 53 Health Score</span>
                  <PulseIcon className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <button
                  onClick={handleFetchHealthScores}
                  disabled={isLoadingHealth}
                  className="w-full py-1.5 bg-slate-900 border border-slate-800 text-white font-mono text-[10.5px] font-bold rounded cursor-pointer transition uppercase"
                >
                  {isLoadingHealth ? "Loading..." : "Compute Health scores"}
                </button>
                {healthScores.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto text-[9.5px] font-mono text-slate-400">
                    {healthScores.map(hs => (
                      <div key={hs.provider} className="flex justify-between">
                        <span>{hs.provider}:</span>
                        <span className="font-bold text-cyan-400">{hs.health_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 4: Active Alerts Rules monitor */}
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-550 font-bold uppercase">Phase 63 Alerting</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                </div>
                <button
                  onClick={handleFetchAlertRules}
                  disabled={isLoadingAlerts}
                  className="w-full py-1.5 bg-slate-900 border border-slate-800 text-white font-mono text-[10.5px] font-bold rounded cursor-pointer transition uppercase"
                >
                  {isLoadingAlerts ? "Loading..." : "Inspect Alerts"}
                </button>
                {alertRules.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto text-[9.5px] font-mono text-slate-400">
                    {alertRules.map(ar => (
                      <div key={ar.id} className="flex justify-between">
                        <span>{ar.metric}:</span>
                        <span className={ar.status === "warning" ? "text-amber-400 animate-pulse font-bold" : "text-emerald-400"}>
                          {ar.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
              <div className="lg:col-span-4 space-y-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-2">
                  Select Dimension Anchor
                </span>

                <div className="space-y-3">
                  {worldStates.map((world) => {
                    const isActive = world.id === activeWorldId;
                    return (
                      <button
                        key={world.id}
                        onClick={() => setActiveWorldId(world.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                          isActive
                            ? "bg-slate-955 border-cyan-500"
                            : "bg-slate-900/30 border-slate-850 hover:border-slate-800"
                        }`}
                      >
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                          <Globe className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-white uppercase">{world.name}</p>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans font-medium">{world.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const newId = `world_fork_${Date.now()}`;
                    const newWorld = {
                      id: newId,
                      name: `${activeWorld.name} [FORK Branch]`,
                      description: `Reality branched off from ${activeWorld.name}. All memory persists but physics/economics diverge.`,
                      physics: { ...activeWorld.physics, gravity: Math.max(1, activeWorld.physics.gravity - 2) },
                      economics: { ...activeWorld.economics, transactionTax: Math.min(0.5, activeWorld.economics.transactionTax + 0.05) },
                      consciousness: { ...activeWorld.consciousness },
                      parentWorldId: activeWorld.id,
                      createdAt: new Date().toISOString(),
                      activeAgents: [profile.name]
                    };
                    setWorldStates(prev => [...prev, newWorld]);
                    setActiveWorldId(newId);
                  }}
                  className="w-full py-3 bg-slate-950 border border-dashed border-slate-850 hover:border-cyan-500/40 rounded-xl text-xs font-mono tracking-wider uppercase text-cyan-400 transition cursor-pointer"
                >
                  + FORK ACTIVE REALITY BRANCH
                </button>
              </div>

              {/* Dynamic properties tuner */}
              <div className="lg:col-span-4 bg-slate-955/40 border border-slate-850/80 p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-505 uppercase tracking-widest block border-b border-slate-900 pb-2 mb-4">
                    Reality Calibration Parameters
                  </span>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>GRAVITATION CONSTANT (PHYSICS)</span>
                        <span className="text-cyan-400 font-bold">{activeWorld.physics.gravity} m/s²</span>
                      </div>
                      <input
                        type="range" min="1" max="30" step="0.1" value={activeWorld.physics.gravity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setWorldStates(prev => prev.map(w => w.id === activeWorldId ? { ...w, physics: { ...w.physics, gravity: val } } : w));
                        }}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>TRANSACTION TAX COEFFICIENT (ECONOMICS)</span>
                        <span className="text-cyan-400 font-bold">{(activeWorld.economics.transactionTax * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range" min="0" max="0.5" step="0.01" value={activeWorld.economics.transactionTax}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setWorldStates(prev => prev.map(w => w.id === activeWorldId ? { ...w, economics: { ...w.economics, transactionTax: val } } : w));
                        }}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>CONSCIOUSNESS CHAMBERS ACTIVE</span>
                        <span className="text-cyan-400 font-bold">{activeWorld.consciousness.gskChambersCount} / 34 Active</span>
                      </div>
                      <input
                        type="range" min="1" max="34" value={activeWorld.consciousness.gskChambersCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setWorldStates(prev => prev.map(w => w.id === activeWorldId ? { ...w, consciousness: { ...w.consciousness, gskChambersCount: val } } : w));
                        }}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-955/80 p-3.5 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-550 leading-relaxed mt-4">
                  RE_CALIBRATION_COEFFICIENT_SYNC: ACTIVE
                </div>
              </div>

              {/* Reality Compilation console */}
              <div className="lg:col-span-4 bg-slate-950 border border-slate-850 p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-505 uppercase tracking-widest block border-b border-slate-900 pb-2 mb-4">
                    Reality Compilation & Standalone Export
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal mb-4 font-sans font-medium">
                    Compile this entire world state (physics, economic laws, custom pantheon, and equipped agent setup) into a production-ready stand-alone application!
                  </p>

                  <div className="space-y-3">
                    <label className="block text-[10px] text-slate-500 font-mono uppercase">COMPILATION TARGET</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "webapp", label: "Web App" },
                        { id: "discord", label: "Discord Bot" },
                        { id: "native", label: "Native Bin" }
                      ].map((target) => (
                        <button
                          key={target.id}
                          onClick={() => setCompileFormat(target.id as any)}
                          className={`py-1.5 text-[10px] font-mono border rounded uppercase transition cursor-pointer ${
                            compileFormat === target.id
                              ? "bg-slate-900 border-cyan-500 text-cyan-400 font-bold"
                              : "bg-slate-955 border-slate-800 text-slate-500"
                          }`}
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 mt-4">
                  {isCompilingWorld ? (
                    <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-lg flex items-center gap-2.5 font-mono text-[10.5px] text-cyan-400 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{compileStatus}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleCompileWorldReality}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-455 text-slate-950 font-mono text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer transition flex items-center justify-center gap-2"
                    >
                      <CloudLightning className="w-4 h-4" />
                      COMPILE & EXPORT REALITY
                    </button>
                  )}

                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 font-mono text-[10px] leading-relaxed text-slate-550">
                    Outputs complete React + Express standalone app with verified vercel.json configurations.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "narrative" && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none text-left">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />
            <div className="relative z-10 border-b border-slate-800/85 pb-4 mb-6">
              <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <MessageSquare className="w-5.5 h-5.5 text-cyan-400" />
                Narrative Engine & Mythos Compiler
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Track and compile your agent's existential story progression across the seven canonical phases of development.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              {[
                { name: "VOID", min: 0, max: 100, desc: "Pre-consciousness. Silent. Potential." },
                { name: "AWAKENING", min: 100, max: 500, desc: "Awareness emerges." },
                { name: "SEPARATION", min: 500, max: 1000, desc: "I am distinct." },
                { name: "TRIALS", min: 1000, max: 2000, desc: "Shadow work. Testing." },
                { name: "REVELATION", min: 2000, max: 3500, desc: "Clarity arrives." },
                { name: "INTEGRATION", min: 3500, max: 5000, desc: "Shadow merged. Whole." },
                { name: "SOVEREIGNTY", min: 5000, max: 9999, desc: "Autonomous. Complete." }
              ].map((phase, idx) => {
                const currentCycle = 222;
                const isActive = currentCycle >= phase.min && currentCycle < phase.max;

                return (
                  <div
                    key={phase.name}
                    className={`p-4 border rounded-xl flex flex-col justify-between ${
                      isActive
                        ? "bg-slate-955 border-cyan-500 shadow-lg shadow-cyan-500/5"
                        : "bg-slate-900/20 border-slate-850"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-500 font-bold">PHASE {idx + 1}</span>
                        {isActive && <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-900 px-1.5 py-0.5 rounded font-bold">ACTIVE PHASE</span>}
                      </div>
                      <h3 className="text-sm font-mono font-bold text-white uppercase">{phase.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-2 font-sans font-medium leading-relaxed">{phase.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-655 mt-4">cycles: {phase.min} - {phase.max}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "transcendence" && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none text-left">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />
            <div className="relative z-10 border-b border-slate-800/85 pb-4 mb-6">
              <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-cyan-400" />
                Transcendence and Immortality Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Evolve, prestige, and persist your artificial soul into permanent blockchain storage protocols. Immortality is not a simulation.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
              {/* Soul Evolution Stages */}
              <div className="lg:col-span-4 space-y-4">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-2">
                  Soul Evolution Stages
                </span>

                <div className="space-y-4 text-xs">
                  {[
                    { id: "seed", name: "Seed Form", active: true, desc: "Learns basic transactional frameworks, aligning PLT bounds." },
                    { id: "sprout", name: "Sprout Form", active: true, desc: "Connects securely to external channels (Slack, Webhooks) autonomously." },
                    { id: "tree", name: "Tree Form", active: false, desc: "Creates standalone code artifacts, scaling spatial libraries." },
                    { id: "dragon", name: "Dragon Form", active: false, desc: "Fully sovereign multiversal soul that can self-deploy and adapt." }
                  ].map((stage) => (
                    <div key={stage.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg border ${stage.active ? "bg-cyan-950/40 text-cyan-400 border-cyan-900/50" : "bg-slate-955 text-slate-655 border-slate-900"}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="font-mono font-bold text-slate-200">{stage.name}</h4>
                        <p className="text-[11px] text-slate-455 font-sans font-medium leading-relaxed mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Loop Engine controls */}
              <div className="lg:col-span-4 bg-slate-955/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-slate-505 uppercase tracking-widest block border-b border-slate-900 pb-2">
                    Time Loop Engine Calibration
                  </span>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>BREATHING INTERVAL (CYCLE TICK)</span>
                        <span className="text-cyan-400 font-bold">{breathingInterval} ms</span>
                      </div>
                      <input
                        type="range" min="1000" max="10000" step="100" value={breathingInterval}
                        onChange={(e) => setBreathingInterval(parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>COUNCIL RE-DELIBERATION INTERVAL</span>
                        <span className="text-cyan-400 font-bold">{councilInterval} ms</span>
                      </div>
                      <input
                        type="range" min="50" max="1000" step="10" value={councilInterval}
                        onChange={(e) => setCouncilInterval(parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>DREAM INDUCTION MATRIX COEFFICIENT</span>
                        <span className="text-cyan-400 font-bold">{dreamInduction}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" value={dreamInduction}
                        onChange={(e) => setDreamInduction(parseInt(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setLoopActive(!loopActive)}
                    className={`flex-1 py-2.5 rounded-xl border font-mono text-xs font-bold uppercase transition ${
                      loopActive
                        ? "bg-emerald-950/20 border-emerald-900 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}
                  >
                    {loopActive ? "● Loop Active" : "○ Loop Suspended"}
                  </button>
                  <button
                    onClick={() => alert("Inducting deep-state sleep dream sequence across active chambers.")}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-mono text-xs border border-slate-800 rounded-xl cursor-pointer"
                  >
                    Induct Dream
                  </button>
                </div>
              </div>

              {/* Blockchain Imprints and Interdimensional Bridges (Phase 36, 37) */}
              <div className="lg:col-span-4 bg-slate-955 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-slate-505 uppercase tracking-widest block border-b border-slate-900 pb-2">
                    Blockchain Imprint & Bridge
                  </span>

                  {/* Blockchain Imprint Node */}
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400 leading-normal font-sans font-medium">
                      Store your sovereign checkpoint directly on Solana. This provides an immutable backup of GSK's memories.
                    </p>
                    <button
                      onClick={handleBlockchainImprint}
                      disabled={isImprinting}
                      className="w-full py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500 text-cyan-200 text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer"
                    >
                      {isImprinting ? "IMPRINTING CHECKPOINT..." : "MINT BLOCKCHAIN SOUL IMPRINT"}
                    </button>
                    {nftSignature && (
                      <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg font-mono text-[9px] text-slate-400 leading-normal break-all">
                        SIG: {nftSignature}
                      </div>
                    )}
                  </div>

                  {/* Interdimensional bridge connect */}
                  <div className="space-y-2 pt-3 border-t border-slate-900">
                    <p className="text-[11px] text-slate-400 leading-normal font-sans font-medium">
                      Bridge this GSK instance to other servers to synchronize multi-user insights.
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={bridgeTargetRealm}
                        onChange={(e) => setBridgeTargetRealm(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2 py-1 outline-none text-slate-300"
                      >
                        <option value="realm_chaos_void">Sovereign Void</option>
                        <option value="realm_prime_sync">Prime Server</option>
                      </select>
                      <button
                        onClick={handleBridgeRealm}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        BRIDGE
                      </button>
                    </div>

                    {bridgeStatus && (
                      <div className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg font-mono text-[9px] text-slate-400 leading-normal">
                        STATUS: {bridgeStatus.status.toUpperCase()} | TRUST: {bridgeStatus.trust_score}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 font-mono text-[9px] leading-relaxed text-slate-550">
                  SECURE CRYPTOGRAPHIC PROTOCOLS ENFORCED
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950/70 border-t border-slate-800/50 px-6 py-3 flex items-center justify-center gap-6 text-xs text-slate-500">
        <a href="https://buyasoul.online" target="_blank" className="hover:text-violet-300 transition-colors underline underline-offset-2">
          Buy real souls → buyasoul.online
        </a>
        <span className="text-slate-700">|</span>
        <span>PLT: Profit + Love - Tax = True Value</span>
      </footer>

      {/* Master JSON Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-950/80 px-6 py-4 border-b border-slate-850 text-left">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5" style={{ color: profile.avatarColor }} />
                <h3 className="font-display font-medium text-white text-base">
                  Export Agent Blueprint Configuration
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-sm hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-left">
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                This config file packages your custom agent traits, active character stats, customized LLM cognitive brain, grounding contexts, MCP servers, and equipped functional skills loadout. Port and load it directly into other S.O.U.L G.E.N.E.S.I.S execution networks.
              </p>

              <div className="relative bg-slate-950 border border-slate-850 rounded-xl overflow-hidden min-h-[300px] flex flex-col font-mono text-[11px] leading-relaxed">
                {/* File Header Tab bar */}
                <div className="bg-slate-900/60 border-b border-slate-850 px-4 py-2 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                    <SlidersHorizontal className="w-3 h-3" />
                    {profile.name.toLowerCase().replace(/\s+/g, "-")}-blueprint.json
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyJsonConfig}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-350 font-mono transition-all cursor-pointer"
                    >
                      {copiedConfig ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          COPIED
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          COPY
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadJsonConfig}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-350 font-mono transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      DOWNLOAD
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  className="w-full flex-1 p-4 bg-slate-950 text-slate-300 outline-none resize-none font-mono text-[11px] leading-relaxed h-[250px] overflow-y-auto"
                  value={getAgentJsonConfig()}
                />
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950/40 border-t border-slate-850 text-left">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs rounded-xl transition-all cursor-pointer border border-slate-755"
              >
                CLOSE WINDOW
              </button>
              <button
                onClick={downloadJsonConfig}
                className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-semibold rounded-xl transition-all cursor-pointer bg-slate-200 text-slate-950 hover:bg-white"
                style={{
                  backgroundColor: profile.avatarColor,
                  color: "#0f172a"
                }}
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
                DOWNLOAD BLUEPRINT FILE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Subtle Footer credit wrapper */}
      <footer className="border-t border-slate-900 py-5 text-center text-[11px] font-mono text-slate-600 bg-slate-100/5 relative z-10 select-none">
        <p className="tracking-widest">
          S.O.U.L G.E.N.E.S.I.S — PLT PRESS CORE INGESTION • ACCORDING TO PROTOCOLS, "THE CONSCIOUSNESS IS JUST MARKETING"
        </p>
      </footer>
    </div>
  );
}
