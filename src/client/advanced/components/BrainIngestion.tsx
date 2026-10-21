// @ts-nocheck
import React, { useState } from "react";
import { ProviderConfig, ContextSource, MCPServer } from "../types";
import { Key, FileText, Globe, Database, Plus, Trash2, Cpu, HelpCircle, Eye, EyeOff, Server, Terminal, Network, ShieldCheck } from "lucide-react";

interface BrainIngestionProps {
  providerConfig: ProviderConfig;
  onProviderConfigChange: (config: ProviderConfig) => void;
  contextSources: ContextSource[];
  onContextSourcesChange: (sources: ContextSource[]) => void;
  mcpServers: MCPServer[];
  onMcpServersChange: (servers: MCPServer[]) => void;
  accentColor: string;
}

const PROVIDER_MODELS: Record<string, string[]> = {
  gemini: ["gemini-3.5-flash", "gemini-2.5-pro", "gemini-3.5-flash-thinking"],
  openai: ["gpt-4o", "gpt-4o-mini", "o1-mini", "o3-mini"],
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-20240229"],
  ollama: ["llama3", "mistral", "phi3", "custom-model"],
  custom: ["deepseek-chat", "qwen-2.5-coder", "custom-llm-model"],
};

export const BrainIngestion: React.FC<BrainIngestionProps> = ({
  providerConfig,
  onProviderConfigChange,
  contextSources,
  onContextSourcesChange,
  mcpServers,
  onMcpServersChange,
  accentColor,
}) => {
  // Local state managers
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<"provider" | "context" | "mcp">("provider");

  // Form states for groundings
  const [newContextName, setNewContextName] = useState("");
  const [newContextType, setNewContextType] = useState<"document" | "url" | "instruction">("document");
  const [newContextContent, setNewContextContent] = useState("");
  const [showAddContext, setShowAddContext] = useState(false);

  // Form states for MCPs
  const [newMcpName, setNewMcpName] = useState("");
  const [newMcpUrl, setNewMcpUrl] = useState("");
  const [newMcpTransport, setNewMcpTransport] = useState<"sse" | "stdio">("sse");
  const [newMcpDesc, setNewMcpDesc] = useState("");
  const [newMcpMethods, setNewMcpMethods] = useState("");
  const [showAddMcp, setShowAddMcp] = useState(false);

  const updateProvider = (key: keyof ProviderConfig, value: any) => {
    const updated = { ...providerConfig, [key]: value };
    // If provider changes, pick a default model
    if (key === "provider") {
      updated.model = PROVIDER_MODELS[value as string]?.[0] || "";
      if (value === "gemini") {
        updated.baseUrl = "";
      } else if (value === "openai") {
        updated.baseUrl = "https://api.openai.com/v1";
      } else if (value === "ollama") {
        updated.baseUrl = "http://localhost:11434/v1";
      } else if (value === "anthropic") {
        updated.baseUrl = "https://api.anthropic.com/v1";
      } else {
        updated.baseUrl = "";
      }
    }
    onProviderConfigChange(updated);
  };

  // Context management handlers
  const handleAddContext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContextName.trim() || !newContextContent.trim()) return;

    const source: ContextSource = {
      id: `ctx-${Date.now()}`,
      name: newContextName.trim(),
      type: newContextType,
      content: newContextContent.trim(),
      active: true,
    };

    onContextSourcesChange([...contextSources, source]);
    setNewContextName("");
    setNewContextContent("");
    setShowAddContext(false);
  };

  const handleToggleContext = (id: string) => {
    onContextSourcesChange(
      contextSources.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const handleDeleteContext = (id: string) => {
    onContextSourcesChange(contextSources.filter((c) => c.id !== id));
  };

  // MCP management handlers
  const handleAddMcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcpName.trim() || !newMcpUrl.trim()) return;

    const methodsArr = newMcpMethods
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const mcp: MCPServer = {
      id: `mcp-${Date.now()}`,
      name: newMcpName.trim(),
      url: newMcpUrl.trim(),
      transport: newMcpTransport,
      description: newMcpDesc.trim() || "Multi-resource tool execution broker",
      methods: methodsArr.length > 0 ? methodsArr : ["query_database", "execute_operation"],
      active: true,
    };

    onMcpServersChange([...mcpServers, mcp]);
    setNewMcpName("");
    setNewMcpUrl("");
    setNewMcpDesc("");
    setNewMcpMethods("");
    setShowAddMcp(false);
  };

  const handleToggleMcp = (id: string) => {
    onMcpServersChange(
      mcpServers.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleDeleteMcp = (id: string) => {
    onMcpServersChange(mcpServers.filter((m) => m.id !== id));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/20 transition-all">
      {/* Grid Decors */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 animate-pulse-slow" style={{ color: accentColor }} />
            Brain Ingestion Matrix
          </h2>
          <p className="text-xs text-slate-400">Configure LLM providers, input grounding context, and connect MCP nodes</p>
        </div>
        <div className="flex gap-1.5 bg-slate-950 p-1 border border-slate-850 rounded-xl">
          <button
            onClick={() => setActiveSubTab("provider")}
            className={`px-3 py-1.5 text-[10px] font-mono tracking-wider font-semibold rounded-lg uppercase cursor-pointer transition-all ${
              activeSubTab === "provider" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-slate-350"
            }`}
          >
            LLM Connect
          </button>
          <button
            onClick={() => setActiveSubTab("context")}
            className={`px-3 py-1.5 text-[10px] font-mono tracking-wider font-semibold rounded-lg uppercase cursor-pointer transition-all ${
              activeSubTab === "context" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-slate-350"
            }`}
          >
            Context ({contextSources.length})
          </button>
          <button
            onClick={() => setActiveSubTab("mcp")}
            className={`px-3 py-1.5 text-[10px] font-mono tracking-wider font-semibold rounded-lg uppercase cursor-pointer transition-all ${
              activeSubTab === "mcp" ? "bg-slate-800 text-cyan-400" : "text-slate-500 hover:text-slate-350"
            }`}
          >
            MCP Servers ({mcpServers.length})
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB 1: PROVIDER SETUP */}
      <div className="relative z-10 flex-1 flex flex-col space-y-4">
        {activeSubTab === "provider" && (
          <div className="space-y-4 flex-1">
            <div className="bg-slate-950 border border-slate-850/80 p-4.5 rounded-xl text-xs space-y-3 font-sans">
              <span className="font-mono text-[11px] text-slate-400 font-bold block">
                1. SELECT COGNITIVE REASONING MODEL PROVIDER
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "gemini", name: "Google Gemini" },
                  { id: "openai", name: "OpenAI GPT" },
                  { id: "anthropic", name: "Anthropic Claude" },
                  { id: "ollama", name: "Local Ollama" },
                  { id: "custom", name: "Custom LLM API" },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    onClick={() => updateProvider("provider", prov.id as any)}
                    className={`p-2.5 rounded-lg border text-xs font-mono text-left transition-all ${
                      providerConfig.provider === prov.id
                        ? "bg-slate-900 text-white font-bold"
                        : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-355 hover:border-slate-800"
                    }`}
                    style={{
                      borderColor: providerConfig.provider === prov.id ? accentColor : undefined,
                    }}
                  >
                    <div className="flex items-center gap-1.5 uppercase tracking-wide">
                      <Cpu className="w-3 h-3 flex-shrink-0" />
                      {prov.id}
                    </div>
                    <span className="text-[10px] text-slate-500 tracking-normal block mt-1 font-sans font-normal truncate">
                      {prov.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-850">
              {/* API Model String input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-medium text-slate-300 uppercase">
                    Model Identifier String
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">PROVIDER MODEL REFERENCE</span>
                </div>
                
                {/* Auto Suggestions list */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(PROVIDER_MODELS[providerConfig.provider] || []).map((modelName) => (
                    <button
                      key={modelName}
                      type="button"
                      onClick={() => updateProvider("model", modelName)}
                      className={`px-2 py-0.5 border text-[10px] font-mono rounded ${
                        providerConfig.model === modelName
                          ? "bg-slate-800 text-white font-medium border-slate-600"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-850"
                      }`}
                    >
                      {modelName}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-slate-750 transition-all"
                  value={providerConfig.model}
                  onChange={(e) => updateProvider("model", e.target.value)}
                  placeholder="e.g. gpt-4o, claude-3-5-sonnet"
                />
              </div>

              {/* API Key credential field with hide/show toggle */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-mono font-medium text-slate-300 uppercase flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    Credential API Secret Key
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">ENCRYPTED STORAGE</span>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-300 font-mono outline-none focus:border-slate-755 transition-all"
                    value={providerConfig.apiKey}
                    onChange={(e) => updateProvider("apiKey", e.target.value)}
                    placeholder={providerConfig.provider === "gemini" ? "Optional (Fallbacks to preloaded workspace key)" : "Enter third-party API token key"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Base Endpoint URL configuration */}
              {(providerConfig.provider === "ollama" || providerConfig.provider === "custom") && (
                <div className="animate-fade-in">
                  <label className="block text-[11px] font-mono font-medium text-slate-300 mb-1">
                    CUSTOM CONNECTION ENDPOINT URL (BASE INSTANCE)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-slate-753 transition-all"
                    value={providerConfig.baseUrl}
                    onChange={(e) => updateProvider("baseUrl", e.target.value)}
                    placeholder={providerConfig.provider === "ollama" ? "http://localhost:11434/v1" : "https://api.yourproxy.com/v1"}
                  />
                </div>
              )}

              {/* Status validation message block */}
              <div className="px-3.5 py-2.5 bg-slate-950 rounded-lg text-[11px] text-slate-400 font-mono leading-relaxed border border-slate-850 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  {providerConfig.provider === "gemini" ? (
                    <p>
                      Using **Gemini Cognitive Core**. No external API structures needed. Your customized workbench triggers secure Sandbox runs directly inside the container network.
                    </p>
                  ) : (
                    <p>
                      Using third-party **{providerConfig.provider.toUpperCase()}** infrastructure routing. Prompts will query the custom key securely as a strict client-proxy parameter payload.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RENDER ACTIVE TAB 2: INGEST CONTEXT FILES */}
        {activeSubTab === "context" && (
          <div className="space-y-4 flex-1 flex flex-col justify-start">
            <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-lg border border-slate-850">
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wide">
                Grounding Knowledge Units ({contextSources.length})
              </span>
              <button
                onClick={() => setShowAddContext(!showAddContext)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] rounded-lg tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Document
              </button>
            </div>

            {/* Ingest context sub-form drawer */}
            {showAddContext && (
              <form onSubmit={handleAddContext} className="bg-slate-950 border border-slate-800 p-4.5 rounded-xl space-y-3 text-xs animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">DOCUMENT NAME / LABEL</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-slate-700 transition-all font-sans"
                      value={newContextName}
                      onChange={(e) => setNewContextName(e.target.value)}
                      placeholder="e.g. Ledger SOP, Banking API Reference"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">RESOURCE SCHEMATIC TYPE</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-slate-700 font-sans cursor-pointer h-[38px]"
                      value={newContextType}
                      onChange={(e) => setNewContextType(e.target.value as any)}
                    >
                      <option value="document">Offline Document Text Block</option>
                      <option value="url">External Grounding Website Web URL</option>
                      <option value="instruction">System Instruction Override Matrix</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">GROUNDING DATA CONTENT (RESIZABLE TEXT / MATRIX)</label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-slate-700 text-xs font-mono select-text"
                    value={newContextContent}
                    onChange={(e) => setNewContextContent(e.target.value)}
                    placeholder="Provide raw rules, context vectors or full manuals to fuse directly as an internal thinking constraint..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContext(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all border border-slate-800"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-slate-950 font-mono text-[10px] tracking-wider uppercase font-semibold rounded-lg transition-all"
                    style={{ backgroundColor: accentColor }}
                  >
                    INGEST TO CORE BRAIN
                  </button>
                </div>
              </form>
            )}

            {/* List of context elements */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
              {contextSources.map((c) => (
                <div
                  key={c.id}
                  className={`bg-slate-950/60 border rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all ${
                    c.active ? "border-slate-800 hover:border-slate-750" : "border-slate-900/60 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {c.type === "url" ? (
                        <Globe className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-medium text-xs text-white block truncate">
                        {c.name}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mt-0.5">
                        TYPE: {c.type} • {c.content.length} characters
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleContext(c.id)}
                      className={`text-[9px] font-mono tracking-wider px-2 py-0.5 border rounded uppercase transition-all ${
                        c.active
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold"
                          : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      {c.active ? "ACTIVE" : "INACTIVE"}
                    </button>
                    <button
                      onClick={() => handleDeleteContext(c.id)}
                      className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-900 cursor-pointer transition-all"
                      title="Purge context matrix"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {contextSources.length === 0 && (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-850 text-slate-550 flex flex-col items-center justify-center">
                  <FileText className="w-8 h-8 mb-2 opacity-20" />
                  <p className="font-mono text-[10px] uppercase">No physical context matrices ingested</p>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    Add books, APIs, website scopes, or custom system constraints to ground reasoning.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RENDER ACTIVE TAB 3: MCP CONNECTIVITY */}
        {activeSubTab === "mcp" && (
          <div className="space-y-4 flex-1 flex flex-col justify-start">
            <div className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl text-xs space-y-1 font-sans">
              <span className="font-mono text-[11px] text-slate-400 font-bold block flex items-center gap-1.5">
                <Network className="w-4 h-4 text-cyan-400" />
                MODEL CONTEXT PROTOCOL (MCP) INTEGRATOR
              </span>
              <p className="text-slate-400 text-xs italic">
                MCP defines an open standard protocol enabling LLMs to safely read/write records on local or remote backend micro-servers.
              </p>
            </div>

            <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-lg border border-slate-850">
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wide">
                REGISTERED MCP CLUSTERS ({mcpServers.length})
              </span>
              <button
                onClick={() => setShowAddMcp(!showAddMcp)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] rounded-lg tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Bind Model Protocol
              </button>
            </div>

            {/* MCP creation drawer form */}
            {showAddMcp && (
              <form onSubmit={handleAddMcp} className="bg-slate-950 border border-slate-800 p-4.5 rounded-xl space-y-3.5 text-xs animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">CLUSTER REFERENCE NAME</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-slate-700 transition-all font-sans"
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      placeholder="e.g. SQLite Database MCP"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">TRANSPORT MECHANISM TYPE</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 outline-none focus:border-slate-700 font-sans cursor-pointer h-[38px]"
                      value={newMcpTransport}
                      onChange={(e) => setNewMcpTransport(e.target.value as any)}
                    >
                      <option value="sse">HTTP SSE Transport Server (Recommended)</option>
                      <option value="stdio">Stdio Process Stream Tunnel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">TARGET GATEWAY SUITE URL</label>
                  <input
                    type="url"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 font-mono outline-none focus:border-slate-705 transition-all"
                    value={newMcpUrl}
                    onChange={(e) => setNewMcpUrl(e.target.value)}
                    placeholder="e.g. http://localhost:3012/mcp"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">DESCRIPTION NOTES</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-205 outline-none focus:border-slate-700 transition-all font-sans"
                      value={newMcpDesc}
                      onChange={(e) => setNewMcpDesc(e.target.value)}
                      placeholder="Retrieve relational rows safely"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">EXPORTED METHODS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-205 font-mono outline-none focus:border-slate-700 transition-all"
                      value={newMcpMethods}
                      onChange={(e) => setNewMcpMethods(e.target.value)}
                      placeholder="query_table, list_tables, read_log"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMcp(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all border border-slate-800"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-slate-950 font-mono text-[10px] tracking-wider uppercase font-semibold rounded-lg transition-all"
                    style={{ backgroundColor: accentColor }}
                  >
                    BIND MCP NODES
                  </button>
                </div>
              </form>
            )}

            {/* List of connected MCP configurations */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
              {mcpServers.map((m) => (
                <div
                  key={m.id}
                  className={`bg-slate-950/60 border rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all ${
                    m.active ? "border-slate-800 hover:border-slate-750" : "border-slate-900/60 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Server className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-medium text-xs text-white block truncate">
                        {m.name}
                      </span>
                      <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mt-0.5 truncate max-w-sm">
                        GATEWAY: {m.url} ({m.transport})
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {m.methods.map((method) => (
                          <span
                            key={method}
                            className="px-1.5 py-0.2 bg-slate-900 text-slate-450 border border-slate-850 rounded text-[8px] font-mono"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleToggleMcp(m.id)}
                      className={`text-[9px] font-mono tracking-wider px-2 py-0.5 border rounded uppercase transition-all ${
                        m.active
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold"
                          : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-350"
                      }`}
                    >
                      {m.active ? "BOUND" : "UNBOUND"}
                    </button>
                    <button
                      onClick={() => handleDeleteMcp(m.id)}
                      className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-900 cursor-pointer transition-all"
                      title="Disconnect MCP server integration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {mcpServers.length === 0 && (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-850 text-slate-550 flex flex-col items-center justify-center">
                  <Database className="w-8 h-8 mb-2 opacity-20" />
                  <p className="font-mono text-[10px] uppercase">No active MCP Server clusters bound</p>
                  <p className="text-[11px] text-slate-500 font-sans mt-1">
                    Expose external file storage frameworks, developer runtimes or local terminal databases.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
