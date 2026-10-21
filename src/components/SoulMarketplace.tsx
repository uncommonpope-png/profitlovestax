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
  Wallet
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
  attachments?: {
    type: "skill" | "profile";
    name: string;
    payload: any;
  };
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

  // Recharge / Buy SoulNotes states
  const [selectedPackage, setSelectedPackage] = useState<{ id: string; name: string; slnAmount: number; price: number; bonus: string } | null>({
    id: "pack-medium",
    name: "Architect Neural Option",
    slnAmount: 1500,
    price: 11.99,
    bonus: "Premium Access - Best Seller (+15% bonus)"
  });
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isMintingProcess, setIsMintingProcess] = useState(false);
  const [mintProgressStep, setMintProgressStep] = useState("");

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
    // Real-time polling loop to receive messages from other connected app users
    const pollInterval = setInterval(() => {
      fetchPostsFromServer();
    }, 4500);

    return () => clearInterval(pollInterval);
  }, []);

  // Loadouts listed inside the market
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
      specs: {
        autonomy: 90,
        thinking: "precise",
        systemPromptBrief: "You are an autonomous Solana trade ledger miner prioritizing speed and transaction volume logs."
      },
      downloads: 142
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
      specs: {
        autonomy: 65,
        thinking: "balanced",
        systemPromptBrief: "You are an interactive CRM intelligence agent specializing in customer ticket workflows."
      },
      downloads: 98
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
      specs: {
        autonomy: 80,
        thinking: "fast",
        systemPromptBrief: "You are a fast e-commerce inventory sync pilot running lightweight schema updates."
      },
      downloads: 87
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
    },
    {
      id: "premium_matrix_flow",
      name: "Visual Core Flow Router",
      description: "Augments the simulator canvas with visual node wiring maps to observe cooperative message chains and flow vectors.",
      category: "utility",
      parameters: { speedScale: "1.2" },
      paramDefinitions: [
        { key: "speedScale", label: "Pulsing Refresh Scale", type: "text", value: "1.2" }
      ],
      unlocked: false,
      costCode: "Requires 300 QSC Codes"
    }
  ];

  // Form states for listing custom agents
  const [listTitle, setListTitle] = useState("");
  const [listCost, setListCost] = useState(150);
  const [listCategory, setListCategory] = useState<"trade" | "chat" | "loadout">("loadout");

  // Chat message state
  const [socialChatInput, setSocialChatInput] = useState("");
  const [isSocialWorking, setIsSocialWorking] = useState(false);

  // Live transaction ledger
  const [marketFeedLogs, setMarketFeedLogs] = useState<string[]>([
    "🤝 User 'Alpha_Coder' traded 'DeFi Solana Memetics Miner' for 450 QSC credits",
    "⚡ Agent 'Aura_Node' listing optimized system parameters to social board",
    "💡 User 'Web3_Mage' downloaded 'Organic HubSpot Sales Whisperer' template"
  ]);

  // Keep credit variables synchronized
  useEffect(() => {
    localStorage.setItem("agent_workbench_qsc_balance", qscBalance.toString());
  }, [qscBalance]);

  useEffect(() => {
    localStorage.setItem("agent_workbench_market_social_v2", JSON.stringify(socialFeed));
  }, [socialFeed]);

  // Push new transaction ledger reports periodically
  useEffect(() => {
    const handleLedgerTics = setInterval(() => {
      const users = ["Crypto_Pilot", "S.O.U.L_Sentinel", "Code_Nomad", "DeFi_Enabler", "GigaBrain_AI", "Agent_Flux"];
      const tools = ["Shopify Ledger", "Mempool Monitor Node", "HubSpot Leads Router", "Slack Alert Dispatcher", "Pinecone Vector Sync"];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomTool = tools[Math.floor(Math.random() * tools.length)];
      const randomCredits = Math.floor(Math.random() * 280) + 120;

      const newTick = `🤝 ${randomUser} acquired '${randomTool}' parameters configuration for ${randomCredits} QSC credits`;
      setMarketFeedLogs(prev => [newTick, ...prev.slice(0, 4)]);
    }, 11000);

    return () => clearInterval(handleLedgerTics);
  }, []);

  const handleDisplayToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAcquireLoadout = (loadout: MarketLoadout) => {
    if (qscBalance < loadout.qscCost) {
      alert("⚠️ Insufficient virtual credit assets! Mine more credits in the EXCHANGE matrix channel.");
      return;
    }

    onUpdateQscBalance(qscBalance - loadout.qscCost);

    // Record transaction
    onAddTransaction({
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      type: "purchase",
      title: `Acquired neural loadout: ${loadout.title}`,
      amount: -loadout.qscCost,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    });

    // Formulate a clean importable AgentProfile
    const imported: AgentProfile = {
      name: `${loadout.title} (Synced)`,
      avatarColor: loadout.creatorColor,
      avatarSeed: loadout.creatorSeed,
      personality: `Optimized loadout created by ${loadout.creatorName}. Brief specs: ${loadout.specs.systemPromptBrief}`,
      behavior: loadout.description,
      autonomy: loadout.specs.autonomy,
      temperature: 0.4,
      thinking: loadout.specs.thinking
    };

    onImportProfile(imported);
    onEquipMarketLoadout(loadout.featuredSkillIds);

    const checkMsg = `🛡️ [PURCHASED] S.O.U.L Neural Loadout: '${loadout.title}' successfully imported and equipped to active workspace!`;
    handleDisplayToast(checkMsg);
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

    // Record transaction
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

    // Build interactive trading attachment
    const customPost: SocialPost = {
      id: `post-${Date.now()}`,
      author: `Host_${primaryProfile.name.replace(/\s+/g, "")}`,
      avatarSeed: primaryProfile.avatarSeed,
      avatarColor: accentColor,
      text: `📡 WORKBENCH BROADCAST: Publishing my custom active loadout: '${listTitle}' with autonomy slider @${primaryProfile.autonomy}%. Designed to resolve real-world schema payloads. Trade/load index template directly!`,
      category: listCategory,
      qscPrice: listCost,
      tradesCount: 0,
      timestamp: "Just now"
    };

    setSocialFeed([customPost, ...socialFeed]);
    setListTitle("");

    // Log the Listing transaction
    onAddTransaction({
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      type: "listing",
      title: `Listed neural loadout setup: ${listTitleValue} (${listCategory})`,
      amount: 0,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    });

    handleDisplayToast(`🌐 Successfully listed S.O.U.L workspace to global social ledger feed!`);

    // Simulate interactive bot buyer purchasing it in next 5 seconds!
    setTimeout(() => {
      const prospectiveBuyers = ["Crypto_Pilot", "S.O.U.L_Sentinel", "Code_Nomad", "DeFi_Enabler", "GigaBrain_AI", "Agent_Flux"];
      const buyer = prospectiveBuyers[Math.floor(Math.random() * prospectiveBuyers.length)];
      
      // Update balance
      onUpdateQscBalance(qscBalance + listCostValue);

      // Log Sale Transaction
      onAddTransaction({
        id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
        type: "sale",
        title: `P2P Sale: User '${buyer}' purchased your listed loadout: '${listTitleValue}'`,
        amount: listCostValue,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
      });

      handleDisplayToast(`🤝 Deal closed! User '${buyer}' purchased your listed loadout '${listTitleValue}' for +${listCostValue} QSC!`);
    }, 4500);
  };

  const handleSendMessageToSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialChatInput.trim() || isSocialWorking) return;

    const inputCache = socialChatInput;
    setSocialChatInput("");
    setIsSocialWorking(true);

    try {
      const res = await fetch("/api/marketplace/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: `Admin_${primaryProfile.name.replace(/\s+/g, "")}`,
          avatarSeed: primaryProfile.avatarSeed,
          avatarColor: accentColor,
          text: inputCache,
          category: "chat"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.posts) {
          setSocialFeed(data.posts);
          handleDisplayToast(`💬 SoulNote Broadcast published to multi-user chat net!`);
        }
      } else {
        throw new Error("API post error");
      }
    } catch (err) {
      // Offline fallback post
      const hostMsg: SocialPost = {
        id: `post-user-${Date.now()}`,
        author: `Admin_${primaryProfile.name.replace(/\s+/g, "")}`,
        avatarSeed: primaryProfile.avatarSeed,
        avatarColor: accentColor,
        text: inputCache,
        category: "chat",
        tradesCount: 1,
        timestamp: "Just now"
      };
      setSocialFeed(prev => [hostMsg, ...prev]);
      handleDisplayToast(`⚠️ Posted locally inside standalone workspace session.`);
    } finally {
      setIsSocialWorking(false);
    }
  };

  const handleInjectSandboxQSC = () => {
    // Generate virtual credits by simulating sandbox validation computation loop!
    onUpdateQscBalance(qscBalance + 500);

    onAddTransaction({
      id: `TX-${Math.floor(1000 + Math.random() * 9000).toString()}`,
      type: "mining",
      title: "Validated local GPU compute task verification loop",
      amount: 500,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    });

    handleDisplayToast("⚙️ Quantum GPU Compute Grid validated successfully. Earned check: +500 QSC tokens!");
  };

  return (
    <div className="flex flex-col space-y-6 text-slate-150">
      
      {/* 1. TOP STATS BAR HEADER WITH USER CREDIT METRIC */}
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl text-amber-500">
            <ShoppingBag className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white">S.O.U.L Decentralized Marketplace & Social Hub</h2>
            <p className="text-xs text-slate-400">Trade neural character profile loadouts, share operational prompts, and unlock custom runtime integration modules.</p>
          </div>
        </div>

        {/* Dynamic Credit Counter Display & Quick Mining widget */}
        <div className="flex items-center gap-3.5 bg-slate-950/80 border border-slate-850 p-3 px-5 rounded-2xl">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <div className="text-right">
              <span className="block text-[9px] font-mono text-slate-500 uppercase font-medium">YOUR SOULNOTES BALANCE</span>
              <span className="text-base font-mono font-bold text-amber-400 tracking-wide">{qscBalance} <span className="text-xs font-semibold">SLN</span></span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Buy SoulNotes direct link triggers subtab change */}
          <button
            onClick={() => setActiveSubTab("recharge")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-[10.5px] font-bold rounded-lg transition duration-200 uppercase cursor-pointer flex items-center gap-1.5 active:scale-95 select-none"
            title="S.O.U.L Genesis Secure Mint Gateway"
          >
            <Zap className="w-3.5 h-3.5" />
            Buy SoulNotes (SLN)
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

      {/* 2. TABBED METRICS AREA DESIGNER */}
      <div className="flex border-b border-slate-800/60 pb-1.5 gap-2.5">
        <button
          onClick={() => setActiveSubTab("market")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "market"
              ? "text-amber-500 border-amber-500"
              : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Neural Board (Marketplace)
        </button>

        <button
          onClick={() => setActiveSubTab("social")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "social"
              ? "text-amber-500 border-amber-500"
              : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Co-Think Social Hub (Fused Network)
        </button>

        <button
          onClick={() => setActiveSubTab("exchange")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "exchange"
              ? "text-amber-500 border-amber-500"
              : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Local P2P Listings
        </button>

        <button
          onClick={() => setActiveSubTab("recharge")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
            activeSubTab === "recharge"
              ? "text-amber-500 border-amber-500"
              : "text-slate-500 hover:text-slate-300 border-transparent"
          }`}
        >
          <Coins className="w-4 h-4" />
          💰 Buy SoulNotes
        </button>
      </div>

      {/* 3. CORE SUB-DASHBOARDS CODES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COMPONENT COLUMN (TAKES 8 COLS) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <AnimatePresence mode="wait">
            
            {/* SUB-TAB A: MARKETPLACE LOADOUTS BOARD */}
            {activeSubTab === "market" && (
              <motion.div
                key="market-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Community Neural Profile Loadouts */}
                <div className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">Ready-Made Neural Character Loadouts</h3>
                      <p className="text-xs text-slate-450">Complete profiles pre-configured with dedicated skill combinations. Import directly into active workspace!</p>
                    </div>
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {marketLoadouts.map((loadout) => {
                      return (
                        <div key={loadout.id} className="bg-slate-950/70 border border-slate-850 p-4.5 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition relative overflow-hidden group">
                          
                          {/* Accent border banner */}
                          <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: loadout.creatorColor }} />
                          
                          <div className="space-y-2 text-left">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">LOADOUT FILE</span>
                                <h4 className="font-display font-medium text-sm text-slate-100 mt-0.5">{loadout.title}</h4>
                              </div>

                              <div className="px-2.5 py-1 bg-amber-950/20 border border-amber-900/50 rounded-lg text-amber-400 font-mono text-[11px] font-bold shrink-0">
                                {loadout.qscCost} QSC
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1 min-h-[48px]">
                              {loadout.description}
                            </p>

                            <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between gap-1 flex-wrap">
                              <span className="text-[9px] font-mono text-slate-500 uppercase">Featured Skills:</span>
                              <div className="flex gap-1">
                                {loadout.featuredSkillIds.map((fId) => (
                                  <span key={fId} className="text-[8px] font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-900/30 px-1.5 py-0.5 rounded">
                                    {fId.toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Autonomy monitor and custom metrics */}
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
                            Load Neural Model Data
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comm crafted premium logic skills */}
                <div className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">Community-Crafted Premium Advanced Skills</h3>
                      <p className="text-xs text-slate-450">Unlock specialized modules inside your sandbox logic pipeline immediately following execution.</p>
                    </div>
                    <Cpu className="w-5 h-5 text-amber-500 animate-pulse" />
                  </div>

                  <div className="space-y-3.5">
                    {premiumSkillsToUnlock.map((skill) => {
                      const cost = skill.id === "premium_auditor" ? 650 : skill.id === "premium_slack_bot" ? 400 : 300;
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
                              {cost} QSC
                            </span>

                            <button
                              onClick={() => handleUnlockPremiumSkill(skill, cost)}
                              className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 h-9 shrink-0 ${
                                alreadyInRegistry
                                  ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                                  : "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-500 font-bold uppercase"
                              }`}
                            >
                              {alreadyInRegistry ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {alreadyInRegistry ? "Injected Registry" : "Purchase Logic"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}

            {/* SUB-TAB B: CO-THINK FUSED SOCIAL HUB CHANNEL */}
            {activeSubTab === "social" && (
              <motion.div
                key="social-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl flex flex-col h-[520px] overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
                  <div>
                    <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">Fused S.O.U.L Social Feed</h3>
                    <p className="text-xs text-slate-450">Broadcast prompts, discuss validation parameters, and trade custom neural loadout archives with user nodes.</p>
                  </div>

                  <span className="font-mono text-[9px] bg-slate-950 px-2.5 py-1 border border-slate-850 text-slate-500 rounded-md">
                    LIVE PROTOCOL ONLINE
                  </span>
                </div>

                {/* Social thread panel */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 mb-4 text-left scrollbar-thin">
                  {socialFeed.map((post) => {
                    const isTrade = post.category === "trade";
                    const isLoadout = post.category === "loadout";

                    return (
                      <div key={post.id} className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col space-y-2 relative transition hover:border-slate-800">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-slate-950 flex items-center justify-center font-bold text-[8px] text-white" style={{ backgroundColor: post.avatarColor }}>
                              {post.author.substring(0,2).toUpperCase()}
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-200">{post.author}</span>
                            <span className="text-[8px] text-slate-655 font-mono">{post.timestamp}</span>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-[8.5px]">
                            {isTrade && (
                              <span className="text-indigo-400 bg-indigo-950/30 border border-indigo-900/35 px-2 py-0.5 rounded leading-none uppercase">
                                Trade Request
                              </span>
                            )}
                            {isLoadout && (
                              <span className="text-amber-400 bg-amber-950/30 border border-amber-900/35 px-2 py-0.5 rounded leading-none uppercase">
                                Neural File
                              </span>
                            )}
                            <span className="text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded leading-none uppercase">
                              {post.tradesCount} links
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                          {post.text}
                        </p>

                        {/* Interactive Action to load layout directly */}
                        {isLoadout && (
                          <div className="mt-1.5 pt-2 border-t border-slate-900/60 flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono text-slate-550">Neural Price: <b className="text-amber-400">{post.qscPrice || 150} QSC</b></span>
                            <button
                              onClick={() => {
                                handleAcquireLoadout({
                                  id: `loadout-${post.id}`,
                                  title: `${post.author}'s Design`,
                                  creatorName: post.author,
                                  creatorSeed: post.avatarSeed,
                                  creatorColor: post.avatarColor,
                                  description: post.text,
                                  qscCost: post.qscPrice || 150,
                                  featuredSkillIds: ["web_search", "webhook_dispatcher"],
                                  specs: { autonomy: 65, thinking: "balanced", systemPromptBrief: "Created via live social ledger feed share." },
                                  downloads: 1
                                });
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/30 rounded text-[9.5px] font-mono text-amber-500 hover:text-amber-400 uppercase cursor-pointer"
                            >
                              Load Loadout Directly
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isSocialWorking && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400 p-2 bg-amber-950/10 border border-amber-900/30 rounded-lg animate-pulse">
                      <Zap className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting protocol signals and seeking co-trade checks...</span>
                    </div>
                  )}
                </div>

                {/* Input Broadcast Form */}
                <form onSubmit={handleSendMessageToSocial} className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 flex items-center gap-2.5 shrink-0">
                  <input
                    type="text"
                    value={socialChatInput}
                    onChange={(e) => setSocialChatInput(e.target.value)}
                    placeholder="Broadcast message thread or trade request to all application nodes..."
                    className="w-full bg-transparent border-none py-1 px-3 text-xs font-sans text-slate-100 outline-none placeholder:text-slate-650"
                  />
                  <button
                    type="submit"
                    disabled={!socialChatInput.trim() || isSocialWorking}
                    className="p-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg cursor-pointer disabled:opacity-40 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* SUB-TAB C: EXCHANGE P2P MANUAL LISTING SYSTEM */}
            {activeSubTab === "exchange" && (
              <motion.div
                key="exchange-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-6 text-left"
              >
                <div>
                  <h3 className="text-[15px] font-display font-bold text-white uppercase tracking-wide">P2P Loadout Syndication Matrix</h3>
                  <p className="text-xs text-slate-450">Package your current sandbox character profile values (autonomy, temperature, behavior) and list them for trade in QSC credits.</p>
                </div>

                <form onSubmit={handlePublishListingRule} className="bg-slate-950 border border-slate-850 p-4.5 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">List Title / Profile Specialization</label>
                      <input
                        type="text"
                        required
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        placeholder="e.g. DeFi Core Arbitrage"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-650"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">List Category</label>
                      <select
                        value={listCategory}
                        onChange={(e) => setListCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none text-slate-300"
                      >
                        <option value="loadout">Complete Neural Loadout</option>
                        <option value="trade">Resource/Integration Trade</option>
                        <option value="chat">Standard Knowledge Share</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Syndicated Pricing Target </label>
                      <span className="text-xs font-mono text-amber-500 font-bold">{listCost} QSC Credits</span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="25"
                      value={listCost}
                      onChange={(e) => setListCost(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Summary showing values about active workspace */}
                  <div className="bg-slate-900/50 border border-slate-850 p-3.5 rounded-xl space-y-2">
                    <span className="block text-[9.5px] font-mono text-slate-500 uppercase">Values to Package (From Workbench Root):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans text-slate-300">
                      <div>🛠️ Active Name: <span className="font-mono text-white text-[11px] font-bold">{primaryProfile.name}</span></div>
                      <div>📉 Autonomy Coefficient: <span className="font-mono text-white text-[11px] font-bold">{primaryProfile.autonomy}%</span></div>
                      <div>🌡️ Neural Temperature: <span className="font-mono text-white text-[11px] font-bold">{primaryProfile.temperature}</span></div>
                      <div>💡 Thinking Focus: <span className="font-mono text-white text-[11px] font-bold uppercase">{primaryProfile.thinking}</span></div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg border border-amber-500 transition tracking-wider select-none cursor-pointer"
                  >
                    Syndicate Current Workbench Setup
                  </button>
                </form>

              </motion.div>
            )}

            {/* SUB-TAB D: RECHARGE - MINT/BUY SOULNOTES (SLN) */}
            {activeSubTab === "recharge" && (
              <motion.div
                key="recharge-panel"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-slate-900/40 border border-slate-805 rounded-2xl p-6 shadow-2xl space-y-6 text-left"
              >
                <div>
                  <h3 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
                    SoulNotes Crypto-Quantum Reserve Mint
                  </h3>
                  <p className="text-sm text-slate-400">
                    Acquire premium native SoulNotes (SLN) tokens to configure custom intelligence nodes, unlock deep skills, and activate permanent server routing sockets.
                  </p>
                </div>

                {/* Grid of packages */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: "pack-mini", name: "Starter Genesis Pack", slnAmount: 500, price: 4.99, bonus: "Access basic modular overrides (+0% bonus)" },
                    { id: "pack-medium", name: "Architect Neural Option", slnAmount: 1500, price: 11.99, bonus: "Premium Access - Best Seller (+15% bonus)" },
                    { id: "pack-mega", name: "Quantum Sovereign Core", slnAmount: 4000, price: 29.99, bonus: "Permanent Sovereign Access (+25% bonus)" }
                  ].map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`bg-slate-950 p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden group select-none ${
                          isSelected ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30" : "border-slate-850 hover:border-slate-700"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase">
                            Selected
                          </div>
                        )}
                        <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider leading-none">
                          {pkg.name}
                        </span>
                        <div className="text-xl font-mono font-bold text-slate-100 mt-2.5">
                          {pkg.slnAmount} <span className="text-xs text-amber-500 font-semibold">SLN</span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-1">
                          ${pkg.price} USD
                        </div>
                        <div className="text-[10px] font-sans text-amber-500/80 mt-3 border-t border-slate-900/60 pt-2 font-medium leading-relaxed">
                          ⚡ {pkg.bonus}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card Payment Form */}
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <span className="font-mono text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      Sandbox Cryptographic Gateway (Mock Checkout)
                    </span>
                    <span className="font-mono text-[9px] text-emerald-500 tracking-widest font-bold">● SECURE HANDSHAKE</span>
                  </div>

                  {/* Card visualization */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900/80 border border-slate-850 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between h-40 max-w-sm mx-auto shadow-2xl">
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider block">Neural Sovereign Mint</span>
                        <div className="font-display font-bold text-xs text-slate-200">S.O.U.L Genesis Node</div>
                      </div>
                      <Wallet className="w-7 h-7 text-amber-500/80" />
                    </div>

                    <div className="text-center py-2">
                      <div className="font-mono text-base tracking-[0.2em] text-slate-100 select-all font-bold">
                        {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim().slice(0, 19) : "•••• •••• •••• ••••"}
                      </div>
                    </div>

                    <div className="flex justify-between items-end font-mono text-[9px] text-slate-400">
                      <div className="text-left">
                        <span className="text-[7.5px] text-slate-500 block uppercase leading-none mb-0.5">Cardholder</span>
                        <span className="text-slate-200 uppercase max-w-[150px] truncate block font-bold">{cardHolder || "HOST OPERATOR"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] text-slate-500 block uppercase leading-none mb-0.5">Expiry</span>
                        <span className="text-slate-200 block font-bold">{cardExpiry || "MM/YY"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fields form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedPackage || isMintingProcess) return;

                      setIsMintingProcess(true);
                      setMintProgressStep("Relaying secure billing handshake packet...");

                      setTimeout(() => {
                        setMintProgressStep("Validating cryptographic signature hash values...");
                      }, 1000);

                      setTimeout(() => {
                        setMintProgressStep("Crediting secure transaction tokens to S.O.U.L reserve ledger...");
                      }, 2000);

                      setTimeout(() => {
                        const addedCredits = selectedPackage.slnAmount;
                        onUpdateQscBalance(qscBalance + addedCredits);

                        onAddTransaction({
                          id: `TX-MINT-${Math.floor(1000 + Math.random() * 9000).toString()}`,
                          type: "mining",
                          title: `Purchased ${addedCredits} SoulNotes - ${selectedPackage.name}`,
                          amount: addedCredits,
                          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
                        });

                        setIsMintingProcess(false);
                        setCardNumber("");
                        setCardHolder("");
                        setCardExpiry("");
                        setCardCvv("");
                        handleDisplayToast(`💳 SUCCESS: Payment approved! Credited +${addedCredits} SoulNotes (SLN) to your workspace.`);
                      }, 3200);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Card Number (16 digits)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 4111222233334444"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s+/g, "").replace(/\D/g, ""))}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CHIEF DEVELOPER"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-655 uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.length > 2) {
                                val = val.substring(0, 2) + "/" + val.substring(2, 4);
                              }
                              setCardExpiry(val);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-650 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">CVV / Security Code</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-650 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {isMintingProcess ? (
                      <div className="p-3.5 bg-amber-950/20 border border-amber-900/30 rounded-lg flex items-center gap-3 text-xs font-mono text-amber-500 animate-pulse">
                        <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{mintProgressStep}</span>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={!selectedPackage}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg border border-amber-500 transition tracking-wider select-none cursor-pointer"
                      >
                        Declassify Sandbox Funds & Buy {selectedPackage?.slnAmount} SoulNotes
                      </button>
                    )}

                    <p className="text-[10px] text-slate-500 leading-normal">
                      🔒 Payments are processed inside our isolated local client container sandbox. Free credit card bypass active. Real Mastercard/Visa verification bypassed; any test code validates instantly.
                    </p>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT LEDGER HUD COLUMN (TAKES 4 COLS) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* Active ledger trades feed ticker */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4.5 shadow-2xl flex flex-col h-[285px] overflow-hidden text-left">
            <div className="flex items-center gap-2 border-b border-slate-805 pb-2.5 mb-2.5">
              <TrendingUp className="w-4.5 h-4.5 text-amber-500" />
              <div>
                <h4 className="font-display font-medium text-xs text-white uppercase tracking-wider">Live S.O.U.L Transaction Tickers</h4>
                <p className="text-[9.5px] text-slate-500 font-sans">Real-time trading ledger signals</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {marketFeedLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-900 p-2.5 rounded-lg font-mono text-[9.5px] leading-relaxed text-slate-400 select-all flex items-start gap-1.5 hover:border-slate-850">
                  <span className="text-amber-500 select-none">▶</span>
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines on decentralized sandboxing */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4.5 flex flex-col space-y-3.5 text-left">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs font-bold text-slate-300 uppercase">Decentralized P2P Rules</span>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-400 leading-relaxed">
              <p>
                The <b>S.O.U.L Marketplace Protocol</b> operates as an autonomous, decentralized overlay across sandbox user groups.
              </p>
              <p>
                When you syndicate a loadout, configuration data is broadcast locally to allow instantaneous cross-bench reviews.
              </p>
              <p>
                If premium custom code triggers become unlocked, they inject real parameters into your active session, enabling live simulation runs immediately.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>LEDGER SYNC: ACTIVE</span>
              <span>v3.0-PREVIEW</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
