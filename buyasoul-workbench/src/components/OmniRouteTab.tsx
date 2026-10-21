import React, { useEffect, useState } from "react";
import { 
  Server, 
  Cpu, 
  Zap, 
  Activity, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Database,
  Network,
  Terminal,
  Eye,
  Monitor
} from "lucide-react";

interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  provider?: string;
  context_length?: number;
  pricing?: { prompt: number; completion: number };
}

interface OmniRouteTabProps {
  accentColor: string;
}

export const OmniRouteTab: React.FC<OmniRouteTabProps> = ({ accentColor }) => {
  const [health, setHealth] = useState<any>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tokenUsage, setTokenUsage] = useState({ prompt: 0, completion: 0, total: 0, cost: 0 });
  const [chatHistory, setChatHistory] = useState<Array<{role: string; content: string; model: string; tokens: number; timestamp: number}>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [providerFilter, setProviderFilter] = useState<string>("all");

  useEffect(() => {
    fetchHealth();
    fetchModels();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/omniroute/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.error("OmniRoute health check failed:", e);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/omniroute/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data.data || data.models || []);
      }
    } catch (e) {
      console.error("Failed to fetch models:", e);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!newMessage.trim() || !selectedModel) return;
    setSending(true);
    const userMsg = { role: "user", content: newMessage };
    setChatHistory(prev => [...prev, { ...userMsg, model: selectedModel, tokens: 0, timestamp: Date.now() }]);
    const msg = newMessage;
    setNewMessage("");

    try {
      const res = await fetch("/api/omniroute/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: chatHistory.map(m => ({ role: m.role, content: m.content })).concat(userMsg),
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message) {
        const tokens = data.usage?.total_tokens || 0;
        const cost = calculateCost(selectedModel, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);
        setTokenUsage(prev => ({
          prompt: prev.prompt + (data.usage?.prompt_tokens || 0),
          completion: prev.completion + (data.usage?.completion_tokens || 0),
          total: prev.total + tokens,
          cost: prev.cost + cost,
        }));
        setChatHistory(prev => [...prev, { 
          role: "assistant", 
          content: data.choices[0].message.content, 
          model: selectedModel, 
          tokens, 
          timestamp: Date.now() 
        }]);
      }
    } catch (e) {
      console.error("Chat failed:", e);
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: `Error: ${e}`, 
        model: selectedModel, 
        tokens: 0, 
        timestamp: Date.now() 
      }]);
    } finally {
      setSending(false);
    }
  };

  const calculateCost = (modelId: string, prompt: number, completion: number) => {
    const model = models.find(m => m.id === modelId);
    if (model?.pricing) {
      return (prompt / 1000000) * model.pricing.prompt + (completion / 1000000) * model.pricing.completion;
    }
    return 0;
  };

  const filteredModels = models.filter(m => 
    providerFilter === "all" || m.owned_by?.toLowerCase().includes(providerFilter) || m.provider?.toLowerCase().includes(providerFilter)
  );

  const providers = [...new Set(models.map(m => m.owned_by || m.provider || "unknown").filter(Boolean))];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-slate-950 border flex items-center justify-center ${health?.success ? 'border-cyan-500' : 'border-slate-700'}`}>
            <Server className="w-6 h-6" style={{ color: health?.success ? '#00D4FF' : '#666' }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">OmniRoute Gateway</h2>
            <p className="text-slate-400 text-sm">{models.length} models · {providers.length} providers · Token tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchHealth(); fetchModels(); }} className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <a href="http://127.0.0.1:20128" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-400 hover:bg-cyan-500/30 transition-colors flex items-center gap-1">
            <ExternalLink className="w-4 h-4" />
            Open Dashboard
          </a>
        </div>
      </div>

      {/* Status & Token Usage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard 
          label="OmniRoute" 
          value={health?.success ? "ONLINE" : "OFFLINE"} 
          icon={<Server />}
          color={health?.success ? "#00D4FF" : "#EF4444"}
          accentColor={accentColor}
        />
        <StatusCard 
          label="Models" 
          value={models.length.toString()} 
          icon={<Cpu />}
          color="#8B5CF6"
          accentColor={accentColor}
        />
        <StatusCard 
          label="Providers" 
          value={providers.length.toString()} 
          icon={<Network />}
          color="#F59E0B"
          accentColor={accentColor}
        />
        <StatusCard 
          label="Total Tokens" 
          value={tokenUsage.total.toLocaleString()} 
          icon={<Zap />}
          color="#FFD166"
          accentColor={accentColor}
        />
      </div>

      {/* Cost Tracker */}
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Session Cost Tracker</h3>
          <span className="text-lg font-bold font-mono" style={{ color: accentColor }}>${tokenUsage.cost.toFixed(6)}</span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold font-mono text-slate-300">{tokenUsage.prompt.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Prompt Tokens</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold font-mono text-slate-300">{tokenUsage.completion.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Completion Tokens</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold font-mono text-slate-300">{tokenUsage.total.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Total Tokens</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold font-mono" style={{ color: accentColor }}>${tokenUsage.cost.toFixed(6)}</div>
            <div className="text-xs text-slate-400">Est. Cost</div>
          </div>
        </div>
      </div>

      {/* Model Selector + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Model List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Models ({filteredModels.length})</h3>
              <select value={providerFilter} onChange={e => setProviderFilter(e.target.value)} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white">
                <option value="all">All Providers</option>
                {providers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {loading ? (
              <div className="text-center text-slate-500 py-8">Loading models...</div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredModels.map(model => (
                  <ModelCard 
                    key={model.id}
                    model={model}
                    selected={selectedModel === model.id}
                    onSelect={() => setSelectedModel(model.id)}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Chat Test</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Model:</span>
                <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white max-w-xs" disabled={!selectedModel}>
                  {filteredModels.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages">
              {chatHistory.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>Select a model and start chatting. Tokens tracked in real-time.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <ChatMessage key={i} message={msg} accentColor={accentColor} />
              ))}
            </div>
            <div className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !sending && sendChat()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500"
                  disabled={!selectedModel || sending}
                />
                <button
                  onClick={sendChat}
                  disabled={!newMessage.trim() || !selectedModel || sending}
                  className="px-6 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-white font-mono text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                  style={{ borderColor: accentColor }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OmniRoute Dashboard Embed */}
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Monitor className="w-5 h-5" style={{ color: accentColor }} />
          OmniRoute Live Dashboard (iframe)
        </h3>
        <iframe
          src="http://127.0.0.1:20128"
          className="w-full h-96 bg-slate-950 rounded-xl border border-slate-800"
          title="OmniRoute Dashboard"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; accentColor: string }> = ({ label, value, icon, color, accentColor }) => (
  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl" style={{ borderColor: color }}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
  </div>
);

const ModelCard: React.FC<{ model: Model; selected: boolean; onSelect: () => void; accentColor: string }> = ({ model, selected, onSelect, accentColor }) => (
  <button
    onClick={onSelect}
    className={`w-full p-3 bg-slate-950 border rounded-xl text-left transition-all ${selected ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 hover:border-purple-500/30'}`}
    style={{ borderColor: selected ? accentColor : undefined }}
  >
    <div className="flex items-center justify-between">
      <span className="font-mono text-sm text-white truncate">{model.id}</span>
      {selected && <CheckCircle className="w-4 h-4" style={{ color: accentColor }} />}
    </div>
    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded">{model.owned_by || model.provider || "unknown"}</span>
      {model.context_length && <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded">{model.context_length.toLocaleString()} ctx</span>}
    </div>
  </button>
);

const ChatMessage: React.FC<{ message: any; accentColor: string }> = ({ message, accentColor }) => (
  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[80%] p-3 rounded-2xl ${message.role === "user" ? "bg-purple-500/20 border border-purple-500/30" : "bg-slate-950 border border-slate-800"}`} style={{ borderColor: message.role === "user" ? accentColor : undefined }}>
      <div className="text-sm text-slate-300 whitespace-pre-wrap">{message.content}</div>
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
        <span className="font-mono">{message.model}</span>
        {message.tokens > 0 && <span>· {message.tokens} tokens</span>}
        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  </div>
);