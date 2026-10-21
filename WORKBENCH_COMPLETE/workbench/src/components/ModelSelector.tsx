import React, { useEffect, useState } from "react";
import { Zap, Globe, Package, Star, AlertTriangle, Palette, Plus, RefreshCw, Brain, Cpu } from "lucide-react";
import { getOmniRouteModels } from "../lib/gskClient";

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length?: number;
}

interface ProviderInfo {
  key: string;
  name: string;
  url: string;
  apiKeyRequired: boolean;
  status: "connected" | "disconnected" | "error";
}

interface ModelSelectorProps {
  accentColor: string;
  initialProvider?: string;
  initialModel?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ accentColor, initialProvider, initialModel }) => {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>(initialProvider || "gsk");
  const [selectedModel, setSelectedModel] = useState<string>(initialModel || "gsk-default");
  const [tokenUsage, setTokenUsage] = useState({ prompt: 0, completion: 0, total: 0, cost: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [recentModels, setRecentModels] = useState<string[]>([]);
  const [providerStatus, setProviderStatus] = useState<Record<string, "connected" | "disconnected" | "error">>({});
  const [newProviderKey, setNewProviderKey] = useState<string>("");
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);

  useEffect(() => {
    fetchProviders();
    fetchTokenUsage();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/gsk/status");
      if (res.ok) {
        const data = await res.json();
        const provs: ProviderInfo[] = [
          { key: "gemini", name: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/models", apiKeyRequired: true, status: "connected" },
          { key: "openai", name: "OpenAI", url: "https://api.openai.com/v1/models", apiKeyRequired: true, status: "connected" },
          { key: "anthropic", name: "Anthropic", url: "https://api.anthropic.com/v1/models", apiKeyRequired: true, status: "connected" },
          { key: "ollama", name: "Ollama (local)", url: "http://localhost:11434/api/tags", apiKeyRequired: false, status: "connected" },
          { key: "gsk", name: "GSK Daemon", url: "http://localhost:3001", apiKeyRequired: false, status: data?.consciousness_gate === true ? "connected" : "disconnected" },
          { key: "omniroute", name: "OmniRoute", url: "http://127.0.0.1:20128", apiKeyRequired: false, status: "connected" }
        ];
        setProviders(provs);
        if (!selectedProvider) setSelectedProvider("gsk");
      }
    } catch (e) {
      console.error("Failed to fetch providers:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokenUsage = async () => {
    try {
      const res = await fetch("/api/gsk/status");
      if (res.ok) {
        const data = await res.json();
        setTokenUsage({
          prompt: data?.token_usage?.prompt_tokens || 0,
          completion: data?.token_usage?.completion_tokens || 0,
          total: data?.token_usage?.total_tokens || 0,
          cost: data?.token_usage?.estimated_cost || 0
        });
      }
    } catch {}
  };

  const fetchOmniRouteModels = async () => {
    try {
      const models = await getOmniRouteModels();
      if (models && models.length > 0) {
        setProviders(prev => prev.map(p => 
          p.key === "omniroute" 
            ? { ...p, status: "connected", url: `http://127.0.0.1:20128 (${models.length} models)` }
            : p
        ));
      }
    } catch (e) {
      console.error("Failed to fetch OmniRoute models:", e);
    }
  };

  useEffect(() => {
    fetchOmniRouteModels();
  }, []);

  const switchProvider = async (providerKey: string) => {
    setSelectedProvider(providerKey);
    setIsLoading(true);

    setRecentModels(prev => {
      if (prev.includes(providerKey)) prev = prev.filter(m => m !== providerKey);
      return [providerKey, ...prev].slice(0, 5);
    });

    try {
      const provider = providers.find(p => p.key === providerKey);
      if (provider && provider.url) {
        const res = await fetch(provider.url, {
          headers: provider.apiKeyRequired ? { "Authorization": `Bearer ${newProviderKey || ""}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const models = data.data || data.models || [];
          const modelNames = models.map((m: any) => m.id || m.name || providerKey);
          setSelectedModel(modelNames[0] || providerKey);
        }
      }
    } catch (e) {
      console.error(`Failed to fetch models for ${providerKey}:`, e);
    }

    setIsLoading(false);
  };

  const getIcon = (key: string) => {
    switch (key) {
      case "gsk": return <Zap className="w-4 h-4" />;
      case "omniroute": return <Globe className="w-4 h-4" />;
      case "ollama": return <Package className="w-4 h-4" />;
      case "openai": return <Star className="w-4 h-4" />;
      case "anthropic": return <AlertTriangle className="w-4 h-4" />;
      case "gemini": return <Palette className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getIconColor = (key: string) => {
    if (providerStatus[key] === "connected") return "#10B981";
    if (providerStatus[key] === "error") return "#EF4444";
    return "#6B7280";
  };

  const formatTokens = (n: number) => n.toLocaleString();
  const formatCost = (n: number) => `$${n.toFixed(6)}`;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Model Selector</h2>
            <p className="text-slate-400 text-sm">Current: {selectedProvider}/{selectedModel} · Tokens: {formatTokens(tokenUsage.total)} · Cost: {formatCost(tokenUsage.cost)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProviderModal(true)} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1" title="Add Provider">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={fetchProviders} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        {providers.map((p) => (
          <div key={p.key} className="p-4 rounded-xl border transition-colors hover:border-slate-600/50" style={{ 
            backgroundColor: providerStatus[p.key] === "connected" ? 'rgba(16, 187, 129, 0.2)' : providerStatus[p.key] === "error" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(171, 166, 171, 0.2)',
            borderColor: providerStatus[p.key] === "connected" ? '#10B981' : providerStatus[p.key] === "error" ? '#EF4444' : '#6B7280',
            color: providerStatus[p.key] === "connected" ? '#10B981' : providerStatus[p.key] === "error" ? '#EF4444' : '#A3A6AB',
          }}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded flex items-center justify-center`} style={{ color: getIconColor(p.key) }}>
                {getIcon(p.key)}
              </div>
              <span className="font-medium text-white">{p.name}</span>
            </div>
            <span className="text-xs text-slate-500">{providerStatus[p.key] || "checking..."}</span>
            {p.apiKeyRequired && (
              <div className="mt-2 pt-2 border-t border-slate-800/50">
                <input
                  type="password"
                  placeholder="API Key"
                  className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white placeholder-slate-500"
                  value={newProviderKey}
                  onChange={e => setNewProviderKey(e.target.value)}
                />
              </div>
            )}
            <div className="mt-2 text-center">
              <button
                onClick={() => switchProvider(p.key)}
                className={`w-full px-3 py-1 text-xs font-mono ${selectedProvider === p.key ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors'} ${providerStatus[p.key] === "error" ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={providerStatus[p.key] === "error"}
              >
                {selectedProvider === p.key ? "Currently Active" : "Select"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <h3 className="font-bold text-white mb-3">Token Usage</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold font-mono text-cyan-400">{formatTokens(tokenUsage.prompt)}</div>
            <div className="text-xs text-slate-500">Prompt</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-orange-400">{formatTokens(tokenUsage.completion)}</div>
            <div className="text-xs text-slate-500">Completion</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-green-400">{formatTokens(tokenUsage.total)}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: accentColor }}>{formatCost(tokenUsage.cost)}</div>
            <div className="text-xs text-slate-500">Cost</div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <h3 className="font-bold text-white mb-3">Recent Models</h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {recentModels.map(modelKey => {
            const p = providers.find(p => p.key === modelKey);
            const modelName = p ? p.name : modelKey;
            return (
              <button
                key={modelKey}
                onClick={() => setSelectedModel(modelKey)}
                className={`w-full p-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors ${selectedModel === modelKey ? 'bg-purple-500/20 border-purple-500/30' : ''}`}
              >
                {modelName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};