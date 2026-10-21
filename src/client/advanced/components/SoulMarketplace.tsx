// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  MessageSquare, 
  Share2, 
  Coins, 
  ArrowRightLeft, 
  Plus, 
  Check, 
  Zap, 
  Send, 
  Download, 
  Copy, 
  Cpu, 
  Users, 
  Flame, 
  TrendingUp, 
  Lock, 
  Unlock, 
  DollarSign, 
  Globe, 
  CheckCircle2, 
  Terminal, 
  Trash2,
  ExternalLink,
  CreditCard,
  Wallet,
  ArrowRight
} from "lucide-react";
import { AgentProfile, Skill } from "../types";

interface SoulMarketplaceProps {
  primaryProfile: AgentProfile;
  skills: Skill[];
  onImportProfile: (imported: AgentProfile) => void;
  onUnlockSkill: (skillId: string) => void;
  onInjectCommunitySkill: (newSkill: Skill) => void;
  onEquipMarketLoadout: (skillIds: string[]) => void;
  accentColor: string;
  qscBalance: number;
  onUpdateQscBalance: (newBalance: number) => void;
  onAddTransaction: (transaction: {
    id: string;
    type: "purchase" | "sale" | "mining" | "listing";
    title: string;
    amount: number;
    timestamp: string;
  }) => void;
}

interface SocialPost {
  id: string;
  author: string;
  avatarSeed: string;
  avatarColor: string;
  text: string;
  category: "trade" | "chat" | "loadout";
  qscPrice?: number;
  tradesCount: number;
  timestamp: string;
  worldContext?: string; // Phase D: universe identifier
}

interface MarketLoadout {
  id: string;
  title: string;
  creatorName: string;
  creatorSeed: string;
  creatorColor: string;
  description: string;
  qscCost: number;
  featuredSkillIds: string[];
  specs: {
    autonomy: number;
    thinking: "balanced" | "fast" | "precise";
    systemPromptBrief: string;
  };
  downloads: number;
  worldOrigin: string; // Phase D: origin world
}

export const SoulMarketplace: React.FC<SoulMarketplaceProps> = ({
  primaryProfile,
  skills,
  onImportProfile,
  onUnlockSkill,
  onInjectCommunitySkill,
  onEquipMarketLoadout,
  accentColor,
  qscBalance,
  onUpdateQscBalance,
  onAddTransaction
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"market" | "social" | "exchange" | "recharge">("market");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recharge / USDC Bridge Option state
  const [usdcAmount, setUsdcAmount] = useState<number>(50);
  const [bridgeStatus, setBridgeStatus] = useState<string | null>(null);

  // Social feed logs state loaded in real-time from server
  const [socialFeed, setSocialFeed] = useState<SocialPost[]>([]);

  // Retrieves posts from our multi-user Express server
  const fetchPostsFromServer = async () => {
    try {
      const res = await fetch("/api/marketplace/posts");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.posts) {
          setSocialFeed(data.posts);
        }
      }
    } catch (e) {
      console.warn("Could not retrieve social post threads from server backplane, offline fallback active.", e);
    }
  };

  useEffect(() => {
    fetchPostsFromServer();
    const pollInterval = setInterval(() => {
      fetchPostsFromServer();
    }, 4500);

    return () => clearInterval(pollInterval);
  }, []);

  // Loadouts listed inside the market with cross-world origin tags
  const marketLoadouts: MarketLoadout[] = [
    {
      id: "loadout-1",
      title: "DeFi Solana Memetics Miner",
      creatorName: "SolanaCyber_Ox",
      creatorSeed: "creator-cyber",
      creatorColor: "#10b981",
      description: "Optimized precise thinking block with custom parameters to detect slippages, calculate volume weightages, and trigger Slack notifications.",
      qscCost: 450,
      featuredSkillIds: ["web_search", "slack_dispatcher"],
      specs: { autonomy: 90, thinking: "precise", systemPromptBrief: "You are an autonomous Solana trade ledger miner prioritizing speed and transaction volume logs." },
      downloads: 142,
      worldOrigin: "world_prime"
    },
    {
      id: "loadout-2",
      title: "Organic HubSpot Sales Whisperer",
      creatorName: "HubSpotMaster_AI",
      creatorSeed: "creator-hubspot",
      creatorColor: "#f97316",
      description: "Preconfigured high creativity agent crafted to automate CRM contact leads pipeline, checking web hooks, and formatting rich markdown layouts.",
      qscCost: 320,
      featuredSkillIds: ["hubspot_leads_syncer", "webhook_dispatcher"],
      specs: { autonomy: 65, thinking: "balanced", systemPromptBrief: "You are an interactive CRM intelligence agent specializing in customer ticket workflows." },
      downloads: 98,
      worldOrigin: "world_prime"
    },
    {
      id: "loadout-3",
      title: "E-Commerce Stock Oracle",
      creatorName: "ShopCore_Guru",
      creatorSeed: "creator-shop",
      creatorColor: "#ec4899",
      description: "Excellent fast-thinking operational layout to inspect Shopify SKU counts and sync webhook alerts directly.",
      qscCost: 200,
      featuredSkillIds: ["shopify_syncer", "webhook_dispatcher"],
      specs: { autonomy: 80, thinking: "fast", systemPromptBrief: "You are a fast e-commerce inventory sync pilot running lightweight schema updates." },
      downloads: 87,
      worldOrigin: "world_chaos_66"
    }
  ];

  // Community Advanced Skills list available for purchase
  const premiumSkillsToUnlock: Skill[] = [
    {
      id: "premium_auditor",
      name: "Quantum Realism Evaluator",
      description: "Autonomous real-time checker comparing user tokens with production endpoints to verify strict system compliance parameters.",
      category: "core",
      parameters: { strictCheck: "true", maxAttempts: "3" },
      paramDefinitions: [
        { key: "strictCheck", label: "Perform Deep Inspection", type: "select", options: ["true", "false"], value: "true" }
      ],
      unlocked: false,
      costCode: "Requires 650 QSC Codes"
    },
    {
      id: "premium_slack_bot",
      name: "Slack Collaborative Broadcaster",
      description: "Multi-channel agent skill. Securely pipes interactive thought traces directly to public hooks under sandboxed conditions.",
      category: "integration",
      parameters: { channelPattern: "#workspace-alerts", syncStatus: "active" },
      paramDefinitions: [
        { key: "channelPattern", label: "Default Target Channel", type: "text", value: "#workspace-alerts" }
      ],
      unlocked: false,
      costCode: "Requires 400 QSC Codes"
    }
  ];

  const [listTitle, setListTitle] = useState("");
  const [listCost, setListCost] = useState(150);
  const [listCategory, setListCategory] = useState<"trade" | "chat" | "loadout">("loadout");

  const [socialChatInput, setSocialChatInput] = useState("");
  const [isSocialWorking, setIsSocialWorking] = useState(false);

  // Live transaction ledger with cross-world dimensions
  const [marketFeedLogs, setMarketFeedLogs] = useState<string[]>([
    "🌐 [BRIDGE] User 'Alpha_Coder' bridged 50 USDC from OmniRoute Prime to purchase 'Stock Oracle' in Chaos Void",
    "🤝 [TRADE] User 'Crypto_Pilot' exported skill 'Relational DB Sync' to Chaos Void",
    "⚡ [LIST] Agent 'Aura_Node' listed interdimensional parameters config"
  ]);

  const handleDisplayToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAcquireLoadout = (loadout: MarketLoadout) => {
    if (qscBalance < loadout.qscCost) {
      alert("⚠️ Insufficient virtual credit assets! Refuel tokens in the EXCHANGE matrix channel or use the USDC Bridge.");
      return;
    }

    onUpdateQscBalance(qscBalance - loadout.qscCost);

    onAddTransaction({
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      type: "purchase",
      title: `Acquired loadout: ${loadout.title} (imported from ${loadout.worldOrigin})`,
      amount: -loadout.qscCost,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    });

    const imported: AgentProfile = {
      name: `${loadout.title} (Ported)`,
      avatarColor: loadout.creatorColor,
      avatarSeed: loadout.creatorSeed,
      personality: `Multiversal agent ported from universe ${loadout.worldOrigin}. Spec: ${loadout.specs.systemPromptBrief}`,
      behavior: loadout.description,
      autonomy: loadout.specs.autonomy,
      temperature: 0.4,
      thinking: loadout.specs.thinking
    };

    onImportProfile(imported);
    onEquipMarketLoadout(loadout.featuredSkillIds);

    handleDisplayToast(`🛡️ [PORTED] S.O.U.L Neural Loadout: '${loadout.title}' successfully imported from ${loadout.worldOrigin}!`);
  };

  const handleUnlockPremiumSkill = (skill: Skill, price: number) => {
    const isAlreadyOwned = skills.some(s => s.id === skill.id);
    if (isAlreadyOwned) {
      handleDisplayToast(`💡 You already own '${skill.name}'! Equipped directly.`);
      return;
    }

    if (qscBalance < price) {
      alert("⚠️ Insufficient QSC credits balance. Refuel credits with our local compute loop!");
      return;
    }

    onUpdateQscBalance(qscBalance - price);

    onAddTransaction({
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      type: "purchase",
      title: `Unlocked premium skill: ${skill.name}`,
      amount: -price,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    });

    onInjectCommunitySkill({
      ...skill,
      unlocked: true,
      costCode: "OWNED"
    });

    onUnlockSkill(skill.id);
    handleDisplayToast(`🛒 UNLOCKED: Community Skill '${skill.name}' injected directly to your local Skill Builder Library!`);
  };

  const handlePublishListingRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listTitle.trim()) return;

    const listCostValue = listCost;
    const listTitleValue = listTitle;

    const customPost: SocialPost = {
      id: `post-${Date.now()}`,
      author: `Host_${primaryProfile.name.replace(/\s+/g, "")}`,
      avatarSeed: primaryProfile.avatarSeed,
      avatarColor: accentColor,
      text: `📡 MULTIVERSE BROADCAST: Syndicating loadout '${listTitle}' spanning dimensions. Autonomy coefficient @${primaryProfile.autonomy}%. Designed to resolve cross-reality payloads.`,
      category: listCategory,
      qscPrice: listCost,
      tradesCount: 0,
      timestamp: "Just now",
      worldContext: "all_worlds"
    };

    setSocialFeed([customPost, ...socialFeed]);
    setListTitle("");

    onAddTransaction({
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      type: "listing",
      title: `Listed loadout: ${listTitleValue} (${listCategory}) to Multiverse`,
      amount: 0,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    });

    handleDisplayToast(`🌐 Successfully listed S.O.U.L workspace to the multiversal registry!`);
  };

  const handleExecuteUsdcBridge = () => {
    if (usdcAmount <= 0) return;

    setBridgeStatus("⚡ [BRIDGE INITIALIZED] Connecting Solana RPC Wallet to target World State bridge...");
    setTimeout(() => {
      setBridgeStatus("⛓️ [SIGNING] Cryptographic proof signature generated. Minting SoulNotes...");
    }, 900);

    setTimeout(() => {
      const mintedSln = usdcAmount * 100;
      onUpdateQscBalance(qscBalance + mintedSln);

      onAddTransaction({
        id: `BRIDGE-${Date.now()}`,
        type: "mining",
        title: `USDC Bridge: Minted +${mintedSln} SLN using ${usdcAmount} USDC`,
        amount: mintedSln,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
      });

      setBridgeStatus(null);
      handleDisplayToast(`⛓️ [BRIDGE SUCCESS] Bridged ${usdcAmount} USDC. Credited +${mintedSln} SoulNotes (SLN) across alternate worlds!`);
    }, 1800);
  };

  return (
    <div className="flex flex-col space-y-6 text-slate-150">
      
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl text-amber-500">
            <ShoppingBag className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">Cross-World Multiversal Marketplace</h2>
            <p className="text-xs text-slate-400">Trade characters across dimensions, export/import skill fragments between realities, and utilize USDC bridges.</p>
          </div>
        </div>

        {/* Credit Counter */}
        <div className="flex items-center gap-3.5 bg-slate-950/80 border border-slate-850 p-3 px-5 rounded-2xl">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <div className="text-right">
              <span className="block text-[9px] font-mono text-slate-500 uppercase font-medium">MULTIVERSE CREDIT RESERVE</span>
              <span className="text-base font-mono font-bold text-amber-400 tracking-wide">{qscBalance} <span className="text-xs font-semibold">SLN</span></span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <button
            onClick={() => setActiveSubTab("recharge")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-[10.5px] font-bold rounded-lg transition duration-200 uppercase cursor-pointer flex items-center gap-1.5 active:scale-95 select-none animate-pulse-slow"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            USDC Bridge
          </button>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/45 border border-emerald-900 text-emerald-300 font-mono text-xs p-3.5 rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* SUB-TAB SELECTS */}
      <div className="flex border-b border-slate-800/60 pb-1.5 gap-2.5">
        <button
          onClick={() => setActiveSubTab("market")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "market" ? "text-amber-500 border-amber-500" : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Neural Board (Market)
        </button>

        <button
          onClick={() => setActiveSubTab("social")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "social" ? "text-amber-500 border-amber-500" : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Cross-Reality Feeds
        </button>

        <button
          onClick={() => setActiveSubTab("exchange")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "exchange" ? "text-amber-500 border-amber-500" : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Multiverse Syndications
        </button>

        <button
          onClick={() => setActiveSubTab("recharge")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "recharge" ? "text-amber-500 border-amber-500" : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <Wallet className="w-4 h-4" />
          ⛓️ Interdimensional USDC Bridge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <AnimatePresence mode="wait">
            
            {activeSubTab === "market" && (
              <motion.div
                key="market-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
                    <div>
                      <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">Ready-Made Multiversal Characters</h3>
                      <p className="text-xs text-slate-450">Load characters and import their custom dimension-specific neural configurations directly.</p>
                    </div>
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketLoadouts.map((loadout) => {
                      return (
                        <div key={loadout.id} className="bg-slate-950/70 border border-slate-850 p-4.5 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition relative overflow-hidden group">
                          <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: loadout.creatorColor }} />
                          
                          <div className="space-y-2 text-left">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-mono text-[9px] text-cyan-400 bg-slate-900 px-1.5 py-0.5 border border-slate-800 rounded font-bold uppercase">
                                  Origin: {loadout.worldOrigin === "world_chaos_66" ? "Chaos Void" : "Prime"}
                                </span>
                                <h4 className="font-display font-medium text-sm text-slate-100 mt-1">{loadout.title}</h4>
                              </div>

                              <div className="px-2.5 py-1 bg-amber-950/20 border border-amber-900/50 rounded-lg text-amber-400 font-mono text-[11px] font-bold shrink-0">
                                {loadout.qscCost} SLN
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1 min-h-[48px]">
                              {loadout.description}
                            </p>

                            <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>Autonomy: <b className="text-slate-100">{loadout.specs.autonomy}%</b></span>
                              <span>Thinking: <b className="text-slate-100 uppercase">{loadout.specs.thinking}</b></span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAcquireLoadout(loadout)}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 hover:border-amber-500/30 font-mono text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer uppercase flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Port Dimension Soul
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
                    <div>
                      <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">Decentralized Premium Skill Nodes</h3>
                      <p className="text-xs text-slate-455">Unlock specialized cognitive rules that inject themselves directly into your sandbox logical loops.</p>
                    </div>
                    <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>

                  <div className="space-y-3.5">
                    {premiumSkillsToUnlock.map((skill) => {
                      const cost = skill.id === "premium_auditor" ? 650 : 400;
                      const alreadyInRegistry = skills.some(s => s.id === skill.id);

                      return (
                        <div key={skill.id} className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none relative overflow-hidden group text-left">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] text-pink-400 bg-pink-950/20 border border-pink-900/30 px-2 py-0.5 rounded-md uppercase font-bold tracking-wide">
                                {skill.category}
                              </span>
                              <h4 className="font-display font-bold text-[13px] text-slate-100">{skill.name}</h4>
                            </div>

                            <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
                              {skill.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-end border-t md:border-none pt-2 md:pt-0">
                            <span className="font-mono text-xs font-bold text-amber-400">
                              {cost} SLN
                            </span>

                            <button
                              onClick={() => handleUnlockPremiumSkill(skill, cost)}
                              className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 h-9 shrink-0 ${
                                alreadyInRegistry ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400" : "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-500 font-bold"
                              }`}
                            >
                              {alreadyInRegistry ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {alreadyInRegistry ? "OWNED" : "UNSTAKE SKILL"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSubTab === "social" && (
              <motion.div
                key="social-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl flex flex-col h-[520px] overflow-hidden text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
                  <div>
                    <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">Cross-Reality Sub-Agent Feeds</h3>
                    <p className="text-xs text-slate-455">Broadcast prompt files, discuss world parameters, and smuggled data through the OmniRoute gateway.</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 mb-4 scrollbar-thin">
                  {socialFeed.map((post) => {
                    return (
                      <div key={post.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-slate-950 flex items-center justify-center font-bold text-[8px] text-white" style={{ backgroundColor: post.avatarColor }}>
                              {post.author.substring(0,2).toUpperCase()}
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-200">{post.author}</span>
                            <span className="text-[8px] text-slate-555 font-mono">{post.timestamp}</span>
                          </div>
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                            universe: {post.worldContext || "Global"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed font-sans">{post.text}</p>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessageToSocial} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center gap-2.5 shrink-0">
                  <input
                    type="text"
                    value={socialChatInput}
                    onChange={(e) => setSocialChatInput(e.target.value)}
                    placeholder="smuggle knowledge fragment or chat across alternate realities..."
                    className="w-full bg-transparent border-none py-1 px-3 text-xs font-sans text-slate-100 outline-none placeholder:text-slate-600"
                  />
                  <button type="submit" disabled={!socialChatInput.trim()} className="p-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg cursor-pointer transition">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {activeSubTab === "exchange" && (
              <motion.div
                key="exchange-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-6 text-left"
              >
                <div>
                  <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">P2P Loadout Syndication Matrix</h3>
                  <p className="text-xs text-slate-455">Package your current sandbox character profile values and list them for trade across the sovereign multiverse.</p>
                </div>

                <form onSubmit={handlePublishListingRule} className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">List Title / Profile Specialization</label>
                      <input
                        type="text" required value={listTitle} onChange={(e) => setListTitle(e.target.value)}
                        placeholder="e.g. Chaos Arbitrage Setup"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-655"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Reality Target Destination</label>
                      <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none text-slate-355">
                        <option value="all">Sovereign Multiverse (All Worlds)</option>
                        <option value="world_prime">OmniRoute Prime</option>
                        <option value="world_chaos_66">Chaos Void</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-slate-505 font-mono uppercase font-bold">Virtual Pricing (SLN Tokens)</label>
                      <span className="text-xs font-mono text-amber-500 font-bold">{listCost} SLN</span>
                    </div>
                    <input
                      type="range" min="50" max="1000" step="25" value={listCost}
                      onChange={(e) => setListCost(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg border border-amber-500 cursor-pointer">
                    Syndicate Current Workbench Setup to Multiverse
                  </button>
                </form>
              </motion.div>
            )}

            {activeSubTab === "recharge" && (
              <motion.div
                key="recharge-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-6 text-left"
              >
                <div>
                  <h3 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-amber-500 animate-pulse" />
                    Interdimensional USDC Bridge Gateway
                  </h3>
                  <p className="text-sm text-slate-455 leading-relaxed">
                    Bridge real USDC on Solana directly into the sovereign multiverse, minting alternate-world SoulNotes (SLN) at a fixed 1:100 ratio. Permanent, secure, and instant.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-xs font-mono font-bold text-slate-350 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      SOLANA MAINNET USDC BRIDGE CODES
                    </span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">GATEWAY: ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5 font-bold">Bridge Amount (USDC)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={usdcAmount}
                          onChange={(e) => setUsdcAmount(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-800 text-base font-mono font-bold rounded-xl pl-9 pr-24 py-3 outline-none focus:border-amber-500/50 text-white"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-500">$</span>
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-cyan-400">USDC</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Mints: {usdcAmount * 100} SoulNotes (SLN) across worlds</p>
                    </div>

                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-mono text-slate-505 uppercase leading-none block mb-1">Bridge Transaction Outcome</span>
                      <div className="text-xl font-mono font-bold text-white mt-1">
                        + {usdcAmount * 100} <span className="text-amber-500 text-xs font-semibold">SLN</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-sans">USDC bridges immediately into the target sovereign dimension.</p>
                    </div>
                  </div>

                  {bridgeStatus ? (
                    <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg font-mono text-[10.5px] text-amber-500 flex items-center gap-2.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{bridgeStatus}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleExecuteUsdcBridge}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-450 text-slate-950 font-mono text-xs font-bold uppercase rounded-xl border border-cyan-400 transition"
                    >
                      EXECUTE INTERDIMENSIONAL SOLANA BRIDGE
                    </button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT LEDGER HUD COLUMN */}
        <div className="lg:col-span-4 flex flex-col space-y-4 text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl flex flex-col h-[285px] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-805 pb-2.5 mb-2.5">
              <TrendingUp className="w-4.5 h-4.5 text-amber-500" />
              <div>
                <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">Multiversal Commerce Tickers</h4>
                <p className="text-[9.5px] text-slate-505 font-sans">Cross-world transaction ledgers</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {marketFeedLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-900 p-2.5 rounded-lg font-mono text-[9.5px] leading-relaxed text-slate-400 flex items-start gap-1.5 hover:border-slate-850">
                  <span className="text-amber-500 select-none">▶</span>
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4.5 flex flex-col space-y-3.5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs font-bold text-slate-350 uppercase">Interdimensional Trade Rules</span>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-400 leading-relaxed">
              <p>The <b>USDC Bridge</b> utilizes decentralized Solana RPC gateways to lock mainnet liquidity and mint aligned SoulNotes (SLN) inside your alternate world states.</p>
              <p>Imported character souls are ported along with their original world's physical and economic signatures, giving them advantage metrics.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
