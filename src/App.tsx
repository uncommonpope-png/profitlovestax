import { useState, useEffect } from "react";
import { AgentProfile, Skill, ProviderConfig, ContextSource, MCPServer, MarketplaceTransaction } from "./types";
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
  Layers
} from "lucide-react";

export default function App() {
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
  const [activeTab, setActiveTab] = useState<"capabilities" | "profile" | "skills" | "simulation" | "integrations" | "realism" | "vault" | "habitat" | "marketplace" | "transactions">("capabilities");
  const [strictRealismMode, setStrictRealismMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

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
    if (equippedSkillIds.length >= 4) return; // Cap at 4
    setEquippedSkillIds((prev) => [...prev, skillId]);
  };

  const handleUnequipSkill = (skillId: string) => {
    setEquippedSkillIds((prev) => prev.filter((id) => id !== skillId));
  };

  const handleEquipPreset = (presetIds: string[]) => {
    // Only set equipped IDs that exist in the skills list
    const validIds = presetIds.filter(id => skills.some(s => s.id === id));
    setEquippedSkillIds(validIds);
  };

  const handleUpdateParameters = (skillId: string, updatedParams: Record<string, string>) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, parameters: updatedParams } : s))
    );
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
                BETA_VER_2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-sans">Visual character loadout workbench for functional artificial agents</p>
          </div>
        </div>

        {/* Global Operational Metrics */}
        <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-850 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>INTELLIGENCE Matrix: <span className="text-pink-400 font-bold uppercase">{providerConfig.provider}</span></span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>LOAD_COEFFICIENT: <span className="text-slate-300 font-bold">{computedActiveSkills.length}/4 NODES</span></span>
          </div>
        </div>
      </header>

      {/* Sub-Navigation Dashboard tabs */}
      <div className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-800/80 px-6 py-2.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between relative z-10">
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab("capabilities")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "capabilities"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "capabilities" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "capabilities" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Layers className="w-4 h-4" style={{ color: profile.avatarColor }} />
            0. Core Capabilities
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "profile"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "profile" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "profile" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: profile.avatarColor }} />
            1. Character Blueprint
          </button>

          <button
            onClick={() => setActiveTab("skills")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "skills"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "skills" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "skills" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Settings2 className="w-4 h-4" style={{ color: profile.avatarColor }} />
            2. Equip Skills Loadout
          </button>

          <button
            onClick={() => setActiveTab("simulation")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "simulation"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "simulation" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "simulation" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Terminal className="w-4 h-4" style={{ color: profile.avatarColor }} />
            3. Test Bench Playground
          </button>

          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "integrations"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "integrations" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "integrations" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Workflow className="w-4 h-4" style={{ color: profile.avatarColor }} />
            4. Production Pipelines
          </button>

          <button
            onClick={() => setActiveTab("realism")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "realism"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "realism" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "realism" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: profile.avatarColor }} />
            5. Ultra-Realism Reviewer
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "vault"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "vault" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "vault" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Key className="w-4 h-4" style={{ color: profile.avatarColor }} />
            6. API & Token Vault
          </button>

          <button
            onClick={() => setActiveTab("habitat")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "habitat"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "habitat" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "habitat" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <Users className="w-4 h-4" style={{ color: profile.avatarColor }} />
            7. Multi-Agent Habitat
          </button>

          <button
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "marketplace"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "marketplace" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "marketplace" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <ShoppingBag className="w-4 h-4" style={{ color: profile.avatarColor }} />
            8. Social & Live Market
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-300 whitespace-nowrap cursor-pointer hover:scale-[1.03] active:scale-95 ${
              activeTab === "transactions"
                ? "bg-slate-950 text-white font-bold border-slate-650"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
            style={{
              borderColor: activeTab === "transactions" ? profile.avatarColor : undefined,
              boxShadow: activeTab === "transactions" ? `0 0 16px ${profile.avatarColor}25, inset 0 0 8px ${profile.avatarColor}10` : undefined,
            }}
          >
            <History className="w-4 h-4" style={{ color: profile.avatarColor }} />
            9. Marketplace Transactions
          </button>
        </div>

        <div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-755 bg-slate-950 hover:bg-slate-900 text-white font-mono text-xs rounded-xl tracking-wider uppercase hover:scale-[1.03] hover:border-slate-550 transition-all cursor-pointer whitespace-nowrap"
            style={{
              boxShadow: `0 0 12px ${profile.avatarColor}20`
            }}
          >
            <FileJson className="w-4 h-4" style={{ color: profile.avatarColor }} />
            Export Config [JSON]
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            {/* Left character attributes designer */}
            <div className="lg:col-span-5 h-full">
              <AgentPreview profile={profile} onChange={setProfile} providerConfig={providerConfig} />
            </div>

            {/* Right Cognitive Brain Ingestion component */}
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

        {activeTab === "simulation" && (
          <div className="flex-1 min-h-[480px]">
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
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="flex-1">
            <WorkflowIntegration
              profile={profile}
              activeSkills={computedActiveSkills}
              accentColor={profile.avatarColor}
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

        {activeTab === "habitat" && (
          <div className="flex-1">
            <MultiAgentHabitat
              primaryAgent={profile}
              accentColor={profile.avatarColor}
            />
          </div>
        )}

        {activeTab === "marketplace" && (
          <div className="flex-1">
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
                // Ensure unique IDs in our active array and verify they exist
                setEquippedSkillIds((prev) => {
                  const combined = Array.from(new Set([...prev, ...skillIds]));
                  return combined.slice(0, 4); // Limit to top 4 max
                });
              }}
              accentColor={profile.avatarColor}
              qscBalance={qscBalance}
              onUpdateQscBalance={setQscBalance}
              onAddTransaction={(tx) => {
                setTransactions((prev) => [tx, ...prev]);
              }}
            />
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
      </main>

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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs rounded-xl transition-all cursor-pointer border border-slate-750"
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
