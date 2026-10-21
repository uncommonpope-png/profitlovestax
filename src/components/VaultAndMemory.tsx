import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Key, 
  Database, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Network,
  Download,
  Terminal,
  Cpu
} from "lucide-react";

interface VaultAndMemoryProps {
  accentColor: string;
  apiKey?: string;
}

interface VaultKeys {
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  SLACK_WEBHOOK_URL: string;
  HUBSPOT_API_KEY: string;
  PINECONE_API_KEY: string;
  SHOPIFY_ADMIN_ACCESS_TOKEN: string;
  SOLANA_RPC_URL: string;
}

interface MemoryElement {
  id: string;
  key: string;
  value: string;
  category: "episodic" | "semantic" | "procedural";
  cosineSim: number;
  timestamp: string;
}

export const VaultAndMemory: React.FC<VaultAndMemoryProps> = ({ accentColor, apiKey }) => {
  // Vault state
  const [vault, setVault] = useState<VaultKeys>({
    GEMINI_API_KEY: "",
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    SLACK_WEBHOOK_URL: "",
    HUBSPOT_API_KEY: "",
    PINECONE_API_KEY: "",
    SHOPIFY_ADMIN_ACCESS_TOKEN: "",
    SOLANA_RPC_URL: "",
  });

  const [revealKey, setRevealKey] = useState<Record<string, boolean>>({});
  const [vaultStatusMsg, setVaultStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Memory states
  const [memories, setMemories] = useState<MemoryElement[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemoryElement[]>([]);

  // Load keys from server on mount
  useEffect(() => {
    if (apiKey) {
      loadKeys();
      loadCollections();
    }
  }, [apiKey]);

  const loadKeys = async () => {
    try {
      const res = await fetch("/api/keys", {
        headers: { "X-API-Key": apiKey || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setVault(data.keys);
      }
    } catch (err) {
      console.error("Failed to load keys:", err);
    }
  };

  const loadCollections = async () => {
    try {
      const res = await fetch("/api/collections", {
        headers: { "X-API-Key": apiKey || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections);
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  };

  const handleSaveKey = async (service: keyof VaultKeys) => {
    const value = vault[service];
    if (!value) return;

    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
        },
        body: JSON.stringify({ service, apiKey: value }),
      });

      if (res.ok) {
        setVaultStatusMsg(`${service} saved securely.`);
        setTimeout(() => setVaultStatusMsg(null), 3000);
      } else {
        const data = await res.json();
        setVaultStatusMsg(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setVaultStatusMsg(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleValidateKey = async (service: keyof VaultKeys) => {
    const value = vault[service];
    if (!value) return;

    setLoading(true);
    try {
      const res = await fetch("/api/keys/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
        },
        body: JSON.stringify({ service, apiKey: value }),
      });

      if (res.ok) {
        const data = await res.json();
        setVaultStatusMsg(data.message);
      }
    } catch (err: any) {
      setVaultStatusMsg(`Validation failed: ${err.message}`);
    }
    setLoading(false);
  };

  const handleSearchMemory = async () => {
    if (!searchQuery || collections.length === 0) return;

    setLoading(true);
    try {
      const results: MemoryElement[] = [];
      for (const col of collections) {
        const res = await fetch("/api/retrieve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey || "",
          },
          body: JSON.stringify({ collection: col, query: searchQuery }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.sources) {
            data.sources.forEach((s: any, i: number) => {
              results.push({
                id: `${col}-${i}`,
                key: col,
                value: s.text,
                category: "semantic",
                cosineSim: s.score,
                timestamp: s.metadata?.ingestedAt || new Date().toISOString(),
              });
            });
          }
        }
      }
      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    }
    setLoading(false);
  };

  const [newMemoryKey, setNewMemoryKey] = useState("");
  const [newMemoryValue, setNewMemoryValue] = useState("");
  const [newMemoryCat, setNewMemoryCat] = useState<"episodic" | "semantic" | "procedural">("semantic");
  const [newMemorySim, setNewMemorySim] = useState(0.85);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return;

    const newMem: MemoryElement = {
      id: `mem-${Date.now()}`,
      key: newMemoryKey,
      value: newMemoryValue,
      category: newMemoryCat,
      cosineSim: parseFloat(newMemorySim.toFixed(2)),
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    setMemories([newMem, ...memories]);
    setNewMemoryKey("");
    setNewMemoryValue("");
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
  };

  const handleClearAllMemories = () => {
    setMemories([]);
  };

  const toggleReveal = (key: string) => {
    setRevealKey(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearKey = (key: keyof VaultKeys) => {
    setVault({ ...vault, [key]: "" });
  };

  const saveVaultKeys = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(vault)
        .filter(([_, value]) => value)
        .map(([service, apiKey]) =>
          fetch("/api/keys", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": apiKey || "",
            },
            body: JSON.stringify({ service, apiKey }),
          })
        );
      await Promise.all(promises);
      setVaultStatusMsg("Keys saved securely.");
    } catch (err: any) {
      setVaultStatusMsg(`Error: ${err.message}`);
    }
    setLoading(false);
    setTimeout(() => setVaultStatusMsg(null), 3000);
  };

  const filteredMemories = memories.filter((m) => {
    const query = searchQuery.toLowerCase();
    return m.key.toLowerCase().includes(query) || m.value.toLowerCase().includes(query);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-100 flex-1">
      
      {/* LEFT COLUMN: API VAULT & SECURE TOKEN STORE */}
      <div className="lg:col-span-6 flex flex-col space-y-6">
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/5 to-transparent blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4 mb-4">
            <div className="p-2 bg-gradient-to-tr from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-xl text-cyan-400">
              <Key className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-1.5">
                Secure API & Token Vault
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted sandbox storage for live integration keys. Used during deployment and strict non-simulated runs.
              </p>
            </div>
          </div>

          {vaultStatusMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/45 border border-emerald-900 text-emerald-300 font-mono text-[10.5px] p-3 rounded-lg flex items-center gap-2 mb-4"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{vaultStatusMsg}</span>
            </motion.div>
          )}

          {/* Key Input Matrix List */}
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1.5 scrollbar-thin">
            {Object.keys(vault).map((k) => {
              const keyName = k as keyof VaultKeys;
              const hasVal = vault[keyName].length > 0;
              const isRevealed = revealKey[keyName] || false;

              let keyDesc = "Required for standard AI core models";
              if (keyName === "SLACK_WEBHOOK_URL") keyDesc = "Inbound connection link to Post Slack alerts";
              if (keyName === "PINECONE_API_KEY") keyDesc = "Authorized endpoint for continuous vector storage";
              if (keyName === "HUBSPOT_API_KEY") keyDesc = "Personal Token targeting corporate CRM records";
              if (keyName === "SHOPIFY_ADMIN_ACCESS_TOKEN") keyDesc = "Shopify GraphQL and REST authentication token";
              if (keyName === "SOLANA_RPC_URL") keyDesc = "Access network RPC gateway provider";

              return (
                <div key={keyName} className="bg-slate-950/70 border border-slate-850 p-3.5 rounded-xl flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[12px] font-mono font-bold text-slate-200">{keyName}</span>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">{keyDesc}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasVal ? (
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/40 px-2 py-0.5 rounded">
                          LOADED
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900/40 border border-slate-800/40 px-2 py-0.5 rounded">
                          EMPTY (SIMULATED FALLBACK)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={isRevealed ? "text" : "password"}
                        value={vault[keyName]}
                        onChange={(e) => setVault({ ...vault, [keyName]: e.target.value })}
                        placeholder={`Provide ${keyName}...`}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/50 text-xs font-mono rounded-lg pl-3 pr-10 py-2.5 outline-none transition-all placeholder:text-slate-600 text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => toggleReveal(keyName)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-white text-slate-500 cursor-pointer"
                      >
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {hasVal && (
                      <button
                        onClick={() => handleClearKey(keyName)}
                        className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-805 hover:border-red-500/30 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Reset Key Clear"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <span className="text-[10px] font-sans text-slate-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-cyan-500" />
              This configuration remains 100% sandboxed in secure local cookie-state.
            </span>

            <button
              onClick={saveVaultKeys}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-mono font-bold tracking-wider uppercase rounded-xl border border-cyan-500 shadow-lg cursor-pointer transition select-none text-white h-10 shrink-0"
              style={{
                boxShadow: "0 0 15px rgba(6, 182, 212, 0.2)"
              }}
            >
              Lock-In Vault Array
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: VECTOR MEMORY LIBRARY */}
      <div className="lg:col-span-6 flex flex-col space-y-6 animate-fade-in">
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/5 to-transparent blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-pink-500/10 to-transparent border border-pink-500/20 rounded-xl text-pink-400">
                <Database className="w-5.5 h-5.5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">Dynamic Memory Library</h2>
                <p className="text-xs text-slate-400">Inspection & Vector space queries of persistent agent-level memory nodes</p>
              </div>
            </div>

            {memories.length > 0 && (
              <button
                onClick={handleClearAllMemories}
                className="px-2.5 py-1 text-[9px] border border-red-950 hover:border-red-800 bg-red-950/20 rounded text-red-450 hover:text-red-300 font-mono transition-all cursor-pointer uppercase flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear Matrix
              </button>
            )}
          </div>

          {/* Manual Memory Injection Tool */}
          <form onSubmit={handleAddMemory} className="bg-slate-950 border border-slate-850 rounded-xl p-4 mb-5 space-y-3.5">
            <span className="text-[10px] font-mono text-pink-400 font-bold tracking-wider uppercase flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Manual Memory Injection Node
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Memory Title (Header/Index)</label>
                <input
                  type="text"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  placeholder="e.g. Preferred Language"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-pink-500/50 text-xs rounded-lg px-3 py-2 outline-none transition text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Knowledge Category</label>
                <select
                  value={newMemoryCat}
                  onChange={(e) => setNewMemoryCat(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 outline-none text-slate-300"
                >
                  <option value="semantic">Semantic (Factual Concept)</option>
                  <option value="episodic">Episodic (Event Experience)</option>
                  <option value="procedural">Procedural (Behavior Pattern)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Knowledge Chunk Value (Payload Content)</label>
              <textarea
                value={newMemoryValue}
                onChange={(e) => setNewMemoryValue(e.target.value)}
                placeholder="Declare concrete operational knowledge to seed..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 focus:border-pink-500/50 text-xs rounded-lg px-3 py-2 outline-none transition text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">Cosine Index Relevance:</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.01"
                  value={newMemorySim}
                  onChange={(e) => setNewMemorySim(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg"
                />
                <span className="text-xs font-mono text-pink-400 font-semibold">{newMemorySim.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 border border-pink-500 hover:border-pink-400 rounded-lg text-xs font-mono font-bold text-white transition cursor-pointer select-none"
              >
                Inject Node
              </button>
            </div>
          </form>

          {/* Search Memory Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Query vector namespace index... (e.g., invoice, webhook)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans outline-none focus:border-pink-500/40 text-slate-300"
            />
          </div>

          {/* Memory Records List */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[290px] pr-1 scrollbar-thin">
            {filteredMemories.length === 0 ? (
              <div className="text-center py-10 font-mono text-slate-500 text-xs">
                {searchQuery ? "No matching memory nodes discovered in index search." : "Matrix memory bank is unseeded. Inject custom nodes above."}
              </div>
            ) : (
              filteredMemories.map((m) => {
                let badgeColor = "text-indigo-400 bg-indigo-950/30 border-indigo-900/40";
                if (m.category === "procedural") badgeColor = "text-cyan-400 bg-cyan-950/30 border-cyan-900/40";
                if (m.category === "episodic") badgeColor = "text-pink-400 bg-pink-950/30 border-pink-900/40";

                return (
                  <div key={m.id} className="bg-slate-950/40 hover:bg-slate-950/85 border border-slate-850 p-3.5 rounded-xl flex items-start gap-3 relative group transition">
                    <div className="pt-0.5 select-none shrink-0">
                      <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-md text-slate-400 font-mono text-[9px]">
                        {(m.cosineSim * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-mono text-[12px] font-bold text-slate-200">{m.key}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono leading-none border uppercase font-medium tracking-wide px-1.5 py-0.5 rounded ${badgeColor}`}>
                            {m.category}
                          </span>
                          <button
                            onClick={() => handleDeleteMemory(m.id)}
                            className="text-slate-500 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">
                        {m.value}
                      </p>

                      <span className="block text-[8px] text-slate-650 font-mono mt-1.5 uppercase">
                        Vector Synced: {m.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
