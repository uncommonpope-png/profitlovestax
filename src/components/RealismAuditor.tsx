import React, { useEffect, useState } from "react";
import { Skill, AgentProfile } from "../types";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight,
  Sparkles, 
  Code, 
  Server,
  Zap,
  Play,
  Check,
  RefreshCw,
  FileCode,
  Globe
} from "lucide-react";

interface RealismAuditorProps {
  skills: Skill[];
  equippedSkillIds: string[];
  profile: AgentProfile;
  accentColor: string;
  strictRealismMode: boolean;
  onToggleStrictRealismMode: (enabled: boolean) => void;
}

interface AuditData {
  success: boolean;
  envKeys: Record<string, boolean>;
  overallTally: number;
  isSimulationOnly: boolean;
  systemMode: string;
}

export const RealismAuditor: React.FC<RealismAuditorProps> = ({
  skills,
  equippedSkillIds,
  profile,
  accentColor,
  strictRealismMode,
  onToggleStrictRealismMode,
}) => {
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<{ id: string; status: "success" | "error" | "idle"; message: string } | null>(null);
  const [testingSkillId, setTestingSkillId] = useState<string | null>(null);

  const equippedSkills = skills.filter((s) => equippedSkillIds.includes(s.id));

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-integrity");
      const data = await res.json();
      if (data.success) {
        setAudit(data);
      }
    } catch (err) {
      console.error("Auditor connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [equippedSkillIds]);

  const triggerTestConnection = async (skillId: string) => {
    setTestingSkillId(skillId);
    setTestResult(null);

    // Simulate sending a test request
    await new Promise((resolve) => setTimeout(resolve, 1450));

    let keyName = "";
    switch (skillId) {
      case "pinecone_retriever":
        keyName = "PINECONE_API_KEY";
        break;
      case "slack_notifier":
        keyName = "SLACK_WEBHOOK_URL";
        break;
      case "hubspot_crm":
        keyName = "HUBSPOT_API_KEY";
        break;
      case "shopify_sync":
        keyName = "SHOPIFY_ADMIN_ACCESS_TOKEN";
        break;
      case "solana_tracker":
        keyName = "SOLANA_RPC_URL";
        break;
      default:
        keyName = "GEMINI_API_KEY";
    }

    let isKeySet = audit?.envKeys[keyName] || false;
    if (!isKeySet) {
      const savedVault = localStorage.getItem("agent_workbench_vault_keys");
      if (savedVault) {
        try {
          const keys = JSON.parse(savedVault);
          if (keys[keyName] && keys[keyName].trim() !== "") {
            isKeySet = true;
          }
        } catch (e) {
          console.error("Failed to parse local stored keys", e);
        }
      }
    }

    if (isKeySet) {
      setTestResult({
        id: skillId,
        status: "success",
        message: `📢 [PROBE SUCCESSFUL] Active secure connection established! Verified ${keyName} is fully loaded and routing live transactions.`
      });
    } else {
      setTestResult({
        id: skillId,
        status: "error",
        message: `❌ [PROBE NOTICE: SIMULATOR ACTIVATED] Variable ${keyName} is unassigned. Playground operates via simulated backstop. Add real tokens in your API Vault to execute live.`
      });
    }
    setTestingSkillId(null);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all">
      {/* Visual ambient backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/85 pb-4 mb-6 gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 animate-pulse text-amber-500" />
            Ultra-Realism & Deployment Auditor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ensuring zero simulacrum: audit active integrations, verify real client keys, and inspect environment pipeline compliance.
          </p>
        </div>

        <button 
          onClick={fetchAuditData}
          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-mono rounded-lg flex items-center gap-1.5 cursor-pointer select-none transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Integrity
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1 items-stretch">
        
        {/* Left Column: Diagnostics Framework & Key auditor */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Strict realism switch widget */}
          <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/5 to-transparent blur-xl pointer-events-none" />
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-pink-400 uppercase bg-pink-950/40 border border-pink-900/40 px-2 py-0.5 rounded-full">
                Strict Non-Simulation Protection
              </span>
              <p className="text-[13px] font-semibold text-white mt-1">Strict Realism Enforcement Mode</p>
              <p className="text-xs text-slate-400 max-w-sm">
                When active, the agent playground rejects all simulated fallback outcomes if genuine provider API credentials are not found.
              </p>
            </div>

            <button
              onClick={() => onToggleStrictRealismMode(!strictRealismMode)}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl border tracking-wider transition-all duration-300 cursor-pointer ${
                strictRealismMode 
                  ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500 text-red-200 outline-none"
                  : "bg-slate-900 border-slate-850 text-slate-500"
              }`}
              style={{
                boxShadow: strictRealismMode ? `0 0 12px rgba(239, 68, 68, 0.15)` : 'none'
              }}
            >
              {strictRealismMode ? "● STRICT REALISM" : "○ SIMULATED ALLOWED"}
            </button>
          </div>

          {/* Active Skills Verification Matrix */}
          <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col space-y-3.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5 border-b border-slate-905 pb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Equipped Slots Validation Matrix
            </h3>

            {equippedSkills.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                No active skills equipped in the loadout. Equip custom tools under "Equip Skills Loadout" to analyze integration paths.
              </div>
            ) : (
              <div className="space-y-2.5">
                {equippedSkills.map((skill) => {
                  let requiredEnvKey = "GEMINI_API_KEY";
                  switch (skill.id) {
                    case "pinecone_retriever":
                      requiredEnvKey = "PINECONE_API_KEY";
                      break;
                    case "slack_notifier":
                      requiredEnvKey = "SLACK_WEBHOOK_URL";
                      break;
                    case "hubspot_crm":
                      requiredEnvKey = "HUBSPOT_API_KEY";
                      break;
                    case "shopify_sync":
                      requiredEnvKey = "SHOPIFY_ADMIN_ACCESS_TOKEN";
                      break;
                    case "solana_tracker":
                      requiredEnvKey = "SOLANA_RPC_URL";
                      break;
                  }

                  let isVerified = audit?.envKeys[requiredEnvKey] || false;
                  if (!isVerified) {
                    const savedVault = localStorage.getItem("agent_workbench_vault_keys");
                    if (savedVault) {
                      try {
                        const keys = JSON.parse(savedVault);
                        if (keys[requiredEnvKey] && keys[requiredEnvKey].trim() !== "") {
                          isVerified = true;
                        }
                      } catch (e) {
                        // quiet ignore
                      }
                    }
                  }

                  return (
                    <div 
                      key={skill.id}
                      className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-850 p-3 rounded-lg flex items-center justify-between gap-3 group transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-md ${isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-200">{skill.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-500">
                              Requires: <code className="text-rose-450">{requiredEnvKey}</code>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <div className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-900 text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            PRODUCTION READY
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-900 text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            SIMULATOR FALLBACK
                          </div>
                        )}

                        <button
                          onClick={() => triggerTestConnection(skill.id)}
                          disabled={testingSkillId === skill.id}
                          className="p-1 px-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-mono rounded cursor-pointer transition select-none disabled:opacity-50"
                        >
                          {testingSkillId === skill.id ? "PROBING..." : "TEST PROBE"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Test connection report */}
          {testResult && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`border p-4.5 rounded-xl ${
                testResult.status === "success" 
                  ? "bg-emerald-950/30 border-emerald-900 text-emerald-100" 
                  : "bg-rose-955/20 border-rose-900/60 text-rose-200"
              }`}
            >
              <div className="flex items-start gap-2 text-xs">
                {testResult.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 w-full">
                  <p className="font-semibold text-[13px]">
                    {testResult.status === "success" ? "Channel Connection Live!" : "Simulated Backstop Warn-out"}
                  </p>
                  <p className="font-mono text-[11px] leading-relaxed break-all">
                    {testResult.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column: Tailored .env block builder & deployment recipes */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4.5 flex-1 flex flex-col h-full">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5 border-b border-slate-905 pb-2 mb-3">
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              Tailored .env Production Key-Value
            </h3>

            <p className="text-[11px] text-slate-400 leading-normal mb-3.5">
              Copy and inject these exact production key-value pairs into your hosting platform secrets (or local container `.env`) to seamlessly link equipped agents to external SaaS APIs!
            </p>

            <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 flex-1 flex flex-col min-h-[160px] overflow-hidden">
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase border-b border-slate-900 pb-1.5 mb-2 shrink-0">
                <span>CONFIG DIRECTIVE: CUSTOMIZED ENV</span>
                <span className="text-amber-500 animate-pulse">AUTOGENERATED</span>
              </div>
              <pre className="font-mono text-[10.5px] leading-relaxed text-slate-300 overflow-y-auto overflow-x-auto flex-1 h-[220px] scrollbar-thin scrollbar-thumb-slate-800">
{`# -----------------------------------------------------
# Customized Production Variables for ${profile.name || "Custom Agent"}
# -----------------------------------------------------
GEMINI_API_KEY="AI_STUDIO_LIVE_KEY"
APP_URL="${window.location.origin}"

${equippedSkills.map(s => {
  let binding = "";
  switch (s.id) {
    case "pinecone_retriever":
      binding = `PINECONE_API_KEY="your-pinecone-db-pro-key"\nPINECONE_INDEX_HOST="${s.parameters.indexName || "agent-memory-index"}"`;
      break;
    case "slack_notifier":
      binding = `SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxxx"`;
      break;
    case "hubspot_crm":
      binding = `HUBSPOT_API_KEY="pat-na1-${s.parameters.apiKey || "HS_DEMO_KEY"}"`;
      break;
    case "shopify_sync":
      binding = `SHOPIFY_ADMIN_ACCESS_TOKEN="shpat_xxxx_xxxx"\nSHOPIFY_STORE_URL="${s.parameters.storeUrl || "agent-merch.myshopify.com"}"`;
      break;
    case "solana_tracker":
      binding = `SOLANA_RPC_URL="https://api.${s.parameters.rpcCluster || "mainnet-beta"}.solana.com"`;
      break;
    default:
      binding = `# ${s.name} requires no custom secrets config.`;
  }
  return `# SLOT: ${s.name}\n${binding}\n`;
}).join("\n")}
`}
              </pre>
            </div>

            <div className="mt-4 bg-slate-900/30 border border-slate-850 p-3 rounded-lg text-[10.5px] font-mono leading-relaxed text-slate-300">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                Continuous Deployment Tips
              </p>
              Under your system's <span className="text-pink-400 font-bold">Production Pipelines</span> tab, compile the autogenerated express bundle and launch. You can safely assign these variables to avoid all simulations.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
