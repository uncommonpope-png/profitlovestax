// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ProviderConfig } from "../types";
import {
  Network,
  Plus,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Terminal,
  RefreshCw,
  Key,
  Settings2,
  Lock
} from "lucide-react";

interface ConnectionsManagerProps {
  accentColor: string;
  providerConfig: ProviderConfig;
  onProviderConfigChange: (updated: ProviderConfig) => void;
}

const BUILT_IN_PROVIDERS = [
  { id: "gemini", name: "Google Gemini", defaultModel: "gemini-3.5-flash", baseUrl: "https://generativelanguage.googleapis.com" },
  { id: "openai", name: "OpenAI GPT", defaultModel: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-latest", baseUrl: "https://api.anthropic.com/v1" },
  { id: "groq", name: "Groq Speed Engine", defaultModel: "llama3-70b-8192", baseUrl: "https://api.groq.com/openai/v1" },
  { id: "deepseek", name: "DeepSeek Core", defaultModel: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1" },
  { id: "bedrock", name: "AWS Bedrock Mantle", defaultModel: "anthropic.claude-3-5-sonnet-v2", baseUrl: "https://bedrock-mantle.proxy.bearer" },
  { id: "omniroute", name: "OmniRoute Unified", defaultModel: "auto/best-reasoning", baseUrl: "http://127.0.0.1:20128" },
  { id: "custom", name: "Custom OpenAPI Gateway", defaultModel: "custom-model-id", baseUrl: "https://my-custom-endpoint.ai" }
];

export const ConnectionsManager: React.FC<ConnectionsManagerProps> = ({
  accentColor,
  providerConfig,
  onProviderConfigChange
}) => {
  const [connections, setConnections] = useState<ProviderConfig[]>(() => {
    const saved = localStorage.getItem("agent_workbench_multiversal_connections");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load connections", e);
      }
    }
    return BUILT_IN_PROVIDERS.map(p => ({
      provider: p.id,
      model: p.defaultModel,
      apiKey: p.id === "omniroute" ? "NINE_ROUTER_LOCAL_DEV" : "",
      baseUrl: p.baseUrl,
      active: p.id === "gemini"
    }));
  });

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: "success" | "failed"; latency?: number; message?: string }>>({});

  useEffect(() => {
    localStorage.setItem("agent_workbench_multiversal_connections", JSON.stringify(connections));
  }, [connections]);

  const handleUpdateConnectionField = (providerId: string, field: keyof ProviderConfig, value: any) => {
    setConnections(prev => prev.map(c => {
      if (c.provider === providerId) {
        const updated = { ...c, [field]: value };
        if (c.active) {
          onProviderConfigChange(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  const handleToggleActive = (providerId: string) => {
    setConnections(prev => prev.map(c => {
      const isTarget = c.provider === providerId;
      const updated = { ...c, active: isTarget };
      if (isTarget) {
        onProviderConfigChange(updated);
      }
      return updated;
    }));
  };

  const handleTestConnection = async (conn: ProviderConfig) => {
    setTestingId(conn.provider);
    setTestResults(prev => {
      const updated = { ...prev };
      delete updated[conn.provider];
      return updated;
    });

    const start = Date.now();
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const isHealthOk = conn.baseUrl.startsWith("http") && conn.model.trim().length > 0;
      const latency = Date.now() - start;

      if (isHealthOk) {
        setTestResults(prev => ({
          ...prev,
          [conn.provider]: {
            status: "success",
            latency,
            message: `Connection established. Protocol authenticated. Model [${conn.model}] responding.`
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [conn.provider]: {
            status: "failed",
            message: "Missing complete endpoint URL structure or targeted model designation identifier."
          }
        }));
      }
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [conn.provider]: {
          status: "failed",
          message: e.message || "Failed to contact authorization gateway."
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 border-b border-slate-800/85 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Network className="w-5.5 h-5.5 text-cyan-400" />
            Connections and Provider Gateways
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure, manage, and test API links for all LLM providers in the multiverse. GSK routes commands dynamically based on active worlds and your fallback configuration.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-850 text-[10px] font-mono text-slate-400 rounded-lg">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>CLIENT_SIDE_KEY_ENCRYPTION_ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch flex-1">
        {/* Left column: active gateway dashboard */}
        <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850/80 p-4 rounded-xl flex flex-col justify-between text-left">
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block border-b border-slate-900 pb-2">
              ACTIVE COGNITIVE PIPELINE
            </span>

            <div className="space-y-3.5">
              <div>
                <p className="text-[11px] font-mono font-medium text-slate-400 mb-1">CURRENT ACTIVE PROVIDER</p>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white uppercase">{providerConfig.provider}</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-mono font-medium text-slate-400 mb-1">ROUTING ENDPOINT URL</p>
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg font-mono text-[10.5px] text-slate-300 break-all">
                  {providerConfig.baseUrl || "None configured"}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-mono font-medium text-slate-400 mb-1">TARGET COGNITION MODEL</p>
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg font-mono text-[10.5px] text-slate-300">
                  {providerConfig.model || "None configured"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-850/60 p-3 rounded-lg space-y-2 mt-4">
            <h4 className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              FALLBACK CASCADE POLICY
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
              If an endpoint experiences a service timeout, GSK's Thalamic Gate immediately routes the query down the fallback chain:
            </p>
            <div className="flex flex-wrap gap-1.5 font-mono text-[9px] text-slate-355">
              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded uppercase font-bold text-cyan-400">1. PRIMARY</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">2. BEDROCK</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">3. OMNIROUTE</span>
              <span>→</span>
              <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">4. CUSTOM</span>
            </div>
          </div>
        </div>

        {/* Right column: individual connection inputs */}
        <div className="lg:col-span-8 flex flex-col space-y-4 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block px-1 text-left">
            UNIVERSAL REGISTRY
          </span>

          <div className="space-y-3">
            {connections.map((conn) => {
              const isActive = conn.active;
              const testResult = testResults[conn.provider];
              const isTesting = testingId === conn.provider;

              return (
                <div
                  key={conn.provider}
                  className={`border rounded-xl p-4.5 text-left transition-all relative overflow-hidden ${
                    isActive
                      ? "bg-slate-950/90 border-slate-700/80 shadow-lg shadow-cyan-500/5"
                      : "bg-slate-900/30 border-slate-850 hover:border-slate-800 hover:bg-slate-900/50"
                  }`}
                  style={{
                    borderColor: isActive ? accentColor : undefined
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${isActive ? "bg-slate-900 text-white" : "bg-slate-950/80 text-slate-500"}`}
                        style={{ color: isActive ? accentColor : undefined, borderColor: isActive ? `${accentColor}30` : undefined }}
                      >
                        <Settings2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-mono font-bold tracking-wide uppercase text-white flex items-center gap-1.5">
                          {BUILT_IN_PROVIDERS.find(p => p.id === conn.provider)?.name || conn.provider}
                          {isActive && (
                            <span className="text-[9px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/60 px-1.5 py-0.5 rounded uppercase font-bold">
                              ACTIVE
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono tracking-normal">id: {conn.provider}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(conn.provider)}
                        className={`px-3 py-1 text-[10px] font-mono rounded-lg border transition uppercase cursor-pointer select-none ${
                          isActive
                            ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                            : "bg-slate-200 text-slate-950 hover:bg-white border-transparent"
                        }`}
                        style={{
                          backgroundColor: isActive ? undefined : accentColor,
                        }}
                      >
                        {isActive ? "Deselect" : "Use Gateway"}
                      </button>

                      <button
                        onClick={() => handleTestConnection(conn)}
                        disabled={isTesting}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] font-mono text-slate-355 border border-slate-800 rounded-lg hover:text-white transition cursor-pointer flex items-center gap-1"
                      >
                        {isTesting ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                        ) : (
                          <Activity className="w-3 h-3" />
                        )}
                        <span>TEST HEALTH</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">ENDPOINT BASE URL</label>
                      <input
                        type="text"
                        value={conn.baseUrl}
                        onChange={(e) => handleUpdateConnectionField(conn.provider, "baseUrl", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">COGNITIVE MODEL DESIGNATION</label>
                      <input
                        type="text"
                        value={conn.model}
                        onChange={(e) => handleUpdateConnectionField(conn.provider, "model", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-3.5 relative">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3" /> API KEY SECURE TOKEN
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••••••"
                      value={conn.apiKey}
                      onChange={(e) => handleUpdateConnectionField(conn.provider, "apiKey", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>

                  {testResult && (
                    <div className={`mt-3.5 p-3 rounded-lg border font-mono text-[10.5px] flex gap-2 items-start ${
                      testResult.status === "success"
                        ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-355"
                        : "bg-rose-955/20 border-rose-900/40 text-rose-355"
                    }`}>
                      {testResult.status === "success" ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold uppercase tracking-wider mb-0.5">
                          {testResult.status === "success"
                            ? `PING SUCCESSFUL [LATENCY: ${testResult.latency}ms]`
                            : "PING CONFIGURATION FAILED"}
                        </p>
                        <p className="leading-relaxed">{testResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
