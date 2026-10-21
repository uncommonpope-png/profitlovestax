// @ts-nocheck
import React, { useState } from "react";
import { Skill, SkillParameter, ProviderConfig } from "../types";
import { Hammer, Settings2, Sparkles, Check, Plus, Trash, Globe, ShieldCheck, Mail, Database, Send, Terminal, X, Code, AlertTriangle, Link, Eye, Box, Briefcase, ShoppingCart, Coins, GitBranch } from "lucide-react";

interface SkillLibraryProps {
  skills: Skill[];
  activeSkills: Skill[];
  onEquipSkill: (skillId: string) => void;
  onUnequipSkill: (skillId: string) => void;
  onUpdateParameters: (skillId: string, parameters: Record<string, string>) => void;
  accentColor: string;
  onAddCustomSkill?: (newSkill: Skill) => void;
  onDeleteCustomSkill?: (skillId: string) => void;
  providerConfig?: ProviderConfig;
  onEquipPreset?: (presetIds: string[]) => void;
}

export const SkillLibrary: React.FC<SkillLibraryProps> = ({
  skills,
  activeSkills,
  onEquipSkill,
  onUnequipSkill,
  onUpdateParameters,
  accentColor,
  onAddCustomSkill,
  onDeleteCustomSkill,
  providerConfig,
  onEquipPreset,
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || "");
  const [activeCategory, setActiveCategory] = useState<"all" | "core" | "integration" | "utility">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Skill Synthesizer state
  const [synthesisIdea, setSynthesisIdea] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisSuccess, setSynthesisSuccess] = useState(false);

  // Custom skills builder composer modal state
  const [isCustomComposerOpen, setIsCustomComposerOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<"core" | "integration" | "utility">("core");
  const [newSkillCostCode, setNewSkillCostCode] = useState("SOUL_GEN_PLUG_X");

  // Form helper for adding individual custom param definitions
  const [paramKey, setParamKey] = useState("");
  const [paramLabel, setParamLabel] = useState("");
  const [paramType, setParamType] = useState<"text" | "password" | "number" | "select" | "textarea">("text");
  const [paramDefaultValue, setParamDefaultValue] = useState("");

  const [builtParams, setBuiltParams] = useState<SkillParameter[]>([
    { key: "endpointUrl", label: "Target Service API Endpoint", type: "text", placeholder: "https://your.custom.api/v1", value: "" },
    { key: "secretKey", label: "Secret Authorization Code Token", type: "password", placeholder: "Bearer code", value: "" },
  ]);

  const handleSynthesizeSkill = async () => {
    if (!synthesisIdea.trim() || !onAddCustomSkill) return;
    setIsSynthesizing(true);
    setSynthesisSuccess(false);

    try {
      const res = await fetch("/api/copilot/synthesize-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: synthesisIdea,
          providerConfig,
        }),
      });
      const data = await res.json();
      if (data.success && data.skill) {
        onAddCustomSkill(data.skill);
        setSelectedSkillId(data.skill.id);
        setSynthesisIdea("");
        setSynthesisSuccess(true);
        setTimeout(() => setSynthesisSuccess(false), 4500);
      } else {
        alert(data.error || "Copilot synthesis encountered an issue.");
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to reach Copilot synthesis endpoint.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);
  const isSelectedEquipped = activeSkills.some((s) => s.id === selectedSkillId);
  
  const filteredSkills = skills.filter((s) => {
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    const matchesQuery = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.costCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getDependencyStatus = (skillId: string) => {
    const targetSkill = skills.find((s) => s.id === skillId);
    if (!targetSkill || !targetSkill.dependencies || targetSkill.dependencies.length === 0) {
      return { met: true, missing: [] as string[] };
    }
    const missing = targetSkill.dependencies.filter(
      (depId) => !activeSkills.some((act) => act.id === depId)
    );
    return {
      met: missing.length === 0,
      missing,
    };
  };

  const handleParamChange = (skillId: string, key: string, val: string) => {
    const target = skills.find((s) => s.id === skillId);
    if (target) {
      const updatedParams = { ...target.parameters, [key]: val };
      onUpdateParameters(skillId, updatedParams);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "core":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "integration":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "utility":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getSkillIcon = (id: string, color: string, isCustom?: boolean) => {
    if (isCustom) {
      return <Sparkles className="w-5 h-5 text-emerald-450" />;
    }
    switch (id) {
      case "web_search":
        return <Globe className="w-5 h-5" style={{ color }} />;
      case "vision_processor":
        return <Eye className="w-5 h-5" style={{ color }} />;
      case "webhook_dispatcher":
        return <Send className="w-5 h-5" style={{ color }} />;
      case "db_query_sync":
        return <Database className="w-5 h-5" style={{ color }} />;
      case "pinecone_retriever":
        return <Box className="w-5 h-5" style={{ color }} />;
      case "slack_notifier":
        return <Terminal className="w-5 h-5" style={{ color }} />;
      case "hubspot_crm":
        return <Briefcase className="w-5 h-5" style={{ color }} />;
      case "shopify_sync":
        return <ShoppingCart className="w-5 h-5" style={{ color }} />;
      case "data_extractor":
        return <ShieldCheck className="w-5 h-5" style={{ color }} />;
      case "email_composer":
        return <Mail className="w-5 h-5" style={{ color }} />;
      case "solana_tracker":
        return <Coins className="w-5 h-5" style={{ color }} />;
      case "git_auditor":
        return <GitBranch className="w-5 h-5" style={{ color }} />;
      default:
        return <Hammer className="w-5 h-5" style={{ color }} />;
    }
  };

  const handlePushParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramKey.trim() || !paramLabel.trim()) return;

    const newParam: SkillParameter = {
      key: paramKey.trim().replace(/\s+/g, ""),
      label: paramLabel.trim(),
      type: paramType,
      value: paramDefaultValue.trim(),
      placeholder: `Enter ${paramLabel}`,
    };

    setBuiltParams([...builtParams, newParam]);
    setParamKey("");
    setParamLabel("");
    setParamDefaultValue("");
  };

  const handleRemoveParam = (key: string) => {
    setBuiltParams(builtParams.filter((p) => p.key !== key));
  };

  const handleCreateCustomSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillDesc.trim() || !onAddCustomSkill) return;

    // Build initial parameters
    const initialConfig: Record<string, string> = {};
    builtParams.forEach((p) => {
      initialConfig[p.key] = p.value || "";
    });

    const newlyCreated: Skill = {
      id: `custom_skill_${Date.now()}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim(),
      category: newSkillCategory,
      parameters: initialConfig,
      paramDefinitions: builtParams,
      unlocked: true,
      costCode: newSkillCostCode.trim() || "SOUL_GEN_PLUG_X",
      isCustom: true,
    };

    onAddCustomSkill(newlyCreated);
    setSelectedSkillId(newlyCreated.id);
    setIsCustomComposerOpen(false);

    // Reset forms
    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillCostCode("SOUL_GEN_PLUG_X");
    setBuiltParams([
      { key: "endpointUrl", label: "Target Service API Endpoint", type: "text", placeholder: "https://your.custom.api/v1", value: "" },
      { key: "secretKey", label: "Secret Authorization Code Token", type: "password", placeholder: "Bearer code", value: "" },
    ]);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/20 transition-all">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-5 gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Hammer className="w-5 h-5" style={{ color: accentColor }} />
            Custom Skill Inventory
          </h2>
          <p className="text-xs text-slate-400">Unlock, customize, and slot functional execution nodes & custom souls</p>
        </div>

        {/* Loadout Indicators: Slots Equipped (Max 4) */}
        <div className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 gap-2 items-center">
          <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Active Loadout Slots:
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((slotIdx) => {
              const activeS = activeSkills[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                    activeS
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-800 bg-slate-900/40 text-slate-600"
                  }`}
                  style={{
                    borderColor: activeS ? accentColor : undefined,
                    boxShadow: activeS ? `0 0 5px ${accentColor}44` : "none",
                  }}
                  title={activeS ? `Active: ${activeS.name}` : "Empty Loadout Slot"}
                >
                  <span className="font-mono text-[9px] font-bold">{slotIdx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 relative z-10">
        {/* Left column: Skills Grid */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Quick Preset Matrix Templates */}
          {onEquipPreset && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 leading-none">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" style={{ color: accentColor }} />
                Instant Neural Loadout Presets
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => onEquipPreset(["web_search", "vision_processor", "pinecone_retriever"])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/55 hover:border-cyan-500/35 transition-all font-mono text-[9px] uppercase tracking-wider font-medium text-cyan-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                  title="Equips Grounding Search, Vision Processing, and Pinecone Vector indexers"
                >
                  <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                  RAG Cognition
                </button>
                <button
                  onClick={() => onEquipPreset(["webhook_dispatcher", "slack_notifier", "hubspot_crm"])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/55 hover:border-emerald-500/35 transition-all font-mono text-[9px] uppercase tracking-wider font-medium text-emerald-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                  title="Equips Webhook Dispatch, Slack Alerts, and HubSpot CRM Nodes"
                >
                  <Briefcase className="w-3 h-3 text-emerald-400 shrink-0" />
                  Enterprise Automation
                </button>
                <button
                  onClick={() => onEquipPreset(["shopify_sync", "data_extractor", "email_composer"])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/55 hover:border-orange-500/35 transition-all font-mono text-[9px] uppercase tracking-wider font-medium text-orange-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                  title="Equips Shopify Logistics, Data Extraction, and Outbound Email composer"
                >
                  <ShoppingCart className="w-3 h-3 text-orange-400 shrink-0" />
                  Ecom & Logistics
                </button>
                <button
                  onClick={() => onEquipPreset(["git_auditor", "sandbox_executor", "solana_tracker"])}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/55 hover:border-pink-500/35 transition-all font-mono text-[9px] uppercase tracking-wider font-medium text-pink-400 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                  title="Equips Git Security Analyzer, Sandbox Python environments, and Solana RPC networks"
                >
                  <GitBranch className="w-3 h-3 text-pink-400 shrink-0" />
                  Dev & Web3 Ledger
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between w-full">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 self-start">
              {(["all", "core", "integration", "utility"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  title={`Filter inventory checklist to display ${cat.toUpperCase()} nodes only`}
                  className={`px-2.5 py-1 text-xs font-mono rounded uppercase transition-all tracking-wider ${
                    activeCategory === cat
                      ? "bg-slate-850 text-white font-medium"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {onAddCustomSkill && (
              <button
                onClick={() => setIsCustomComposerOpen(true)}
                title="Open the manual Custom Soul Compositor to manually code and define a new custom execution node with customizable credentials parameters"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border bg-slate-950 hover:bg-slate-850 text-emerald-400 border-slate-800 hover:border-slate-705 font-mono text-[10px] tracking-wider uppercase font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-500/5 hover:-translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                COMPOSE PLUGINS / SKILLS
              </button>
            )}
          </div>

          {/* Real-time search query box */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search 100+ high-fidelity neural skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-205 placeholder-slate-500 outline-none focus:border-purple-500/40 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 hover:text-slate-300 font-bold select-none cursor-pointer border border-slate-800 bg-slate-900 px-1.5 py-0.5 rounded"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="h-[280px] md:h-[350px] overflow-y-auto pr-1 space-y-2">
            {filteredSkills.map((skill) => {
              const isEquipped = activeSkills.some((s) => s.id === skill.id);
              const isSelected = selectedSkillId === skill.id;
              const depStatus = getDependencyStatus(skill.id);
              return (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkillId(skill.id)}
                  title={`Click to select ${skill.name} and tune its credentials or parameters`}
                  className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? "bg-slate-800/40 border-slate-600 shadow-lg"
                      : "bg-slate-950/40 border-slate-855 hover:bg-slate-800/20 hover:border-slate-800"
                  }`}
                  style={{
                    borderColor: isSelected ? accentColor : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 relative flex-shrink-0">
                        {getSkillIcon(skill.id, isSelected ? accentColor : "#94a3b8", skill.isCustom)}
                        {isEquipped && (
                          <div className="absolute -top-1 -right-1 bg-emerald-550 border border-slate-900 rounded-full p-0.5 shadow-md">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                          </div>
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="text-sm font-semibold text-slate-200 truncate font-display flex items-center gap-1">
                          {skill.name}
                          {skill.isCustom && (
                            <span className="w-2.5 h-2.5 text-emerald-400 font-bold" title="Custom Crafted Client-Plugin">★</span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 border rounded uppercase ${getCategoryBadgeColor(skill.category)}`}>
                            {skill.category}
                          </span>
                          <span className="text-[9px] font-mono text-slate-550">
                            {skill.costCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEquipped ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnequipSkill(skill.id);
                          }}
                          title={`Click to remove ${skill.name} from active equipped slots`}
                          className="px-2 py-1 bg-slate-800/70 border border-slate-750 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 text-slate-355 font-mono text-[10px] rounded-lg transition-all cursor-pointer"
                        >
                          DE-SLOT
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEquipSkill(skill.id);
                          }}
                          disabled={activeSkills.length >= 4}
                          title={activeSkills.length >= 4 ? "Cannot equip. Maximum of 4 loadout nodes reached." : `Click to equip ${skill.name} into an active slot`}
                          className={`px-2 py-1 border font-mono text-[10px] rounded-lg transition-all cursor-pointer ${
                            activeSkills.length >= 4
                              ? "bg-slate-900 border-slate-855 text-slate-600 cursor-not-allowed"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40"
                          }`}
                        >
                          SLOT UP
                        </button>
                      )}

                      {skill.isCustom && onDeleteCustomSkill && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to purge this custom plugin?")) {
                              onDeleteCustomSkill(skill.id);
                              if (selectedSkillId === skill.id) {
                                setSelectedSkillId(skills[0]?.id || "");
                              }
                            }
                          }}
                          className="p-1 cursor-pointer text-slate-600 hover:text-red-400 bg-slate-900 border border-slate-850 hover:border-red-500/20 rounded-md transition-all animate-pulse"
                          title="Permanently purge this custom plugin node from memory"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual indication of missing dependencies and equipment prompt */}
                  {!depStatus.met && (
                    <div className="border-t border-slate-850 pt-2 mt-1 space-y-1.5 w-full text-left">
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>UNMET NODE PREREQUISITES</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {depStatus.missing.map((depId) => {
                          const depSkill = skills.find((s) => s.id === depId);
                          return (
                            <button
                              key={depId}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeSkills.length >= 4) {
                                  alert("Global neural loadout capacity reached (4/4 limit). Please unequip a node.");
                                  return;
                                }
                                onEquipSkill(depId);
                              }}
                              className="text-[9px] font-mono uppercase bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1"
                              title={`Equip required co-requisite component node: ${depSkill?.name || depId}`}
                            >
                              <Plus className="w-2.5 h-2.5 stroke-[2.5px]" />
                              EQUIP Required: {depSkill ? depSkill.name.split(" ")[0] : depId}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI SKILL SYNTHESIZER AND MCP BINDER */}
          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col gap-2.5 text-left shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-200">
                  Co-Pilot Skill & MCP Synthesizer
                </span>
              </div>
              <span className="text-[8px] font-mono bg-slate-900 border border-slate-800 text-amber-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Copilot Engine
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Feed an app idea or Model Context Protocol logic description (e.g., <i>"A Hubspot CRM connector with contactOwner parameters"</i> or <i>"Create a Shopify fulfillment tracker"</i>) and the Copilot will instantly turn it into an active custom skill configuration.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Give Copilot an app idea or MCP tool configuration..."
                value={synthesisIdea}
                onChange={(e) => setSynthesisIdea(e.target.value)}
                disabled={isSynthesizing}
                title="Input your app idea, custom webhook logic, database query parameters or MCP server integration requirements here"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 transition-all font-sans"
              />
              <button
                type="button"
                onClick={handleSynthesizeSkill}
                disabled={isSynthesizing || !synthesisIdea.trim()}
                title="Request Copilot engine to synthesize, design, and append a structured node skill directly into your loadout inventory"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-mono text-[10px] uppercase font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                {isSynthesizing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" style={{ animationDuration: "1s" }} />
                    COMPILING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 stroke-[2.2px]" />
                    SYNTHESIZE
                  </>
                )}
              </button>
            </div>
            {synthesisSuccess && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md text-center max-w-full font-bold">
                ✔ SUCCESS: Custom Node generated & loaded in inventory!
              </span>
            )}
          </div>
        </div>

        {/* Right column: Skill Parameter Editor Detail Drawer */}
        <div className="lg:col-span-6 flex flex-col">
          {selectedSkill ? (
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col h-full">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getSkillIcon(selectedSkill.id, accentColor, selectedSkill.isCustom)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold font-display text-sm">{selectedSkill.name}</h3>
                    <span className="font-mono text-[10px] text-slate-500">{selectedSkill.costCode}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className={`text-[10px] font-mono px-2 py-0.5 border rounded uppercase ${getCategoryBadgeColor(selectedSkill.category)}`}>
                    {selectedSkill.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed font-sans mb-5 text-left">
                {selectedSkill.description}
              </p>

              {/* Dependencies Status Panel */}
              {selectedSkill.dependencies && selectedSkill.dependencies.length > 0 && (() => {
                const depStatus = getDependencyStatus(selectedSkill.id);
                return (
                  <div className={`p-3.5 rounded-xl mb-5 border text-left flex flex-col gap-2 ${
                    depStatus.met 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" 
                      : "bg-amber-500/5 border-amber-500/20 text-amber-300"
                  }`}>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                      <Link className="w-3.5 h-3.5" />
                      <span>CO-PROCESSOR LOADOUT RELATIONSHIPS ({selectedSkill.dependencies.length})</span>
                    </div>
                    <p className="text-[10px] font-sans text-slate-400 leading-normal">
                      This node requires active backing services in the neural loadout matrix:
                    </p>
                    <div className="space-y-1.5 mt-1 font-mono text-[11px]">
                      {selectedSkill.dependencies.map((depId) => {
                        const depSkill = skills.find((s) => s.id === depId);
                        const isDepActive = activeSkills.some((s) => s.id === depId);
                        return (
                          <div key={depId} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2 rounded-lg">
                            <span className="font-medium text-slate-300 flex items-center gap-1.5 truncate mr-2">
                              {getSkillIcon(depId, isDepActive ? accentColor : "#64748b", false)}
                              <span className="truncate">{depSkill?.name || depId}</span>
                            </span>
                            {isDepActive ? (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                <Check className="w-3 h-3" /> ACTIVE
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (activeSkills.length >= 4) {
                                    alert("Unable to equip node. Maximum of 4 loadout skills reached.");
                                    return;
                                  }
                                  onEquipSkill(depId);
                                }}
                                className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3 h-3" /> EQUIP SECURELY
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Form Parameters Editor */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Settings2 className="w-3.5 h-3.5" />
                    SKILL METRICS TUNER
                  </span>
                  {isSelectedEquipped && (
                    <span className="font-mono text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      SLOT ACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  {selectedSkill.paramDefinitions.map((param) => {
                    const currentValue = selectedSkill.parameters[param.key] ?? param.value;

                    return (
                      <div key={param.key} className="space-y-1 text-left">
                        <label className="block text-[11px] font-mono font-medium text-slate-355">
                          {param.label.toUpperCase()}
                        </label>

                        {param.type === "select" ? (
                          <select
                            value={currentValue}
                            onChange={(e) => handleParamChange(selectedSkill.id, param.key, e.target.value)}
                            title={`Select dynamic option for ${param.label}`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 transition-all font-mono"
                          >
                            {param.options?.map((opt) => (
                              <option key={opt} value={opt} className="bg-slate-950">
                                {opt.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        ) : param.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={currentValue}
                            onChange={(e) => handleParamChange(selectedSkill.id, param.key, e.target.value)}
                            title={`Input multi-line content for parameter ${param.label}`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 transition-all font-sans"
                            placeholder={param.placeholder}
                          />
                        ) : (
                          <input
                            type={param.type}
                            value={currentValue}
                            onChange={(e) => handleParamChange(selectedSkill.id, param.key, e.target.value)}
                            title={`Type input value for key parameter: ${param.label}`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 transition-all font-mono"
                            placeholder={param.placeholder}
                          />
                        )}
                      </div>
                    );
                  })}

                  {selectedSkill.paramDefinitions.length === 0 && (
                    <div className="text-center py-6 text-slate-600 font-mono text-xs">
                      No configurable metrics declared for this soul.
                    </div>
                  )}
                </div>
              </div>

              {/* Foot action */}
              <div className="mt-5 border-t border-slate-855 pt-4 flex gap-2">
                {isSelectedEquipped ? (
                  <button
                    onClick={() => onUnequipSkill(selectedSkill.id)}
                    title={`De-slot and deactivate ${selectedSkill.name} node`}
                    className="w-full py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-slate-755 rounded-lg font-mono text-xs cursor-pointer transition-all"
                  >
                    REMOVE FROM SLOT MODULE
                  </button>
                ) : (
                  <button
                    onClick={() => onEquipSkill(selectedSkill.id)}
                    disabled={activeSkills.length >= 4}
                    title={activeSkills.length >= 4 ? "Unequip another node first to free a slot" : `Slot ${selectedSkill.name} to activate its behaviors`}
                    className={`w-full py-2 border font-mono text-xs rounded-lg transition-all cursor-pointer ${
                      activeSkills.length >= 4
                        ? "bg-slate-900 border-slate-855 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40"
                    }`}
                  >
                    {activeSkills.length >= 4
                      ? "SLOTS MAX INTRUDED (4/4)"
                      : "SLOT CAPACITOR ON ACTIVE BLUEPRINT"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-880 rounded-xl p-5 flex flex-col justify-center items-center h-full min-h-[250px] text-slate-500">
              <Settings2 className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs font-mono">SELECT A NODE TO REVEAL PARAMETER SCHEMATICS</p>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM SOUL / SKILL COMPOSITOR MODAL */}
      {isCustomComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-slate-950/80 px-6 py-4 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-display font-medium text-white text-base">
                  Soul Compositor: Author Custom Plugin Skill
                </h3>
              </div>
              <button
                onClick={() => setIsCustomComposerOpen(false)}
                title="Dismiss compositor and return to inventory"
                className="text-slate-550 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-slate-450 uppercase mb-1 font-semibold">
                    Custom Skill Name (Designation)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 transition-all font-display font-medium"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    title="Enter a recognizable capitalized name for this custom node"
                    placeholder="e.g. Ledger reconciling core"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-455 uppercase mb-1 font-semibold">
                    System Cost/Module Key Code
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 font-mono"
                    value={newSkillCostCode}
                    onChange={(e) => setNewSkillCostCode(e.target.value)}
                    title="A unique machine-oriented code identifier for system compilation"
                    placeholder="e.g. CUSTOM_PLUG_NODE_LV1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-slate-450 uppercase mb-1 font-semibold">
                    Core Function Category
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 font-sans cursor-pointer h-[38px]"
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as any)}
                    title="Select the node operational category type"
                  >
                    <option value="core">Core Thinking Skill</option>
                    <option value="integration">External Network Integration</option>
                    <option value="utility">Computational Utility Assistant</option>
                  </select>
                </div>
                <div className="text-slate-450 text-[11px] font-sans flex items-center leading-relaxed italic bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-850/50">
                  <span className="text-emerald-450 mr-1.5 font-bold">★</span>
                  Every custom skill becomes immediately bindable, with custom parameters that your LLM reads securely.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-450 uppercase mb-1 font-semibold">
                  Skill Trigger Objective (Description)
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-700 font-sans text-xs resize-none"
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  title="Describe precisely what functions this skill triggers so that the LLM understands when to call it"
                  placeholder="e.g. Scans general database columns to align and double compile corporate journals."
                  required
                />
              </div>

              {/* Define dynamic keys segment */}
              <div className="border-t border-slate-800/80 pt-4 mt-2">
                <span className="font-mono text-xs text-slate-400 font-semibold block mb-3 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-emerald-400" />
                  Define Active UI Parameters Mapping ({builtParams.length})
                </span>

                {/* Sub-form to add field row */}
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 mb-4">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Add Component Parameter Key/Field:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-left">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Key (lowercase)</span>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none font-mono"
                        placeholder="e.g. securityLevel"
                        value={paramKey}
                        onChange={(e) => setParamKey(e.target.value)}
                        title="Lowercase parameter programmatic key name used in system calls"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Label (User Friendly)</span>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none font-sans"
                        placeholder="e.g. Maximum Access Depth"
                        value={paramLabel}
                        onChange={(e) => setParamLabel(e.target.value)}
                        title="Humanized, friendly form label title to display"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 block mb-0.5">Control Input Type</span>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none font-sans cursor-pointer h-[32px]"
                        value={paramType}
                        onChange={(e) => setParamType(e.target.value as any)}
                        title="Form input style to render for configuration"
                      >
                        <option value="text">Simple Text Input</option>
                        <option value="password">Password Keys</option>
                        <option value="number">Numeric Dial</option>
                        <option value="textarea">Multi-line Textbox</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handlePushParam}
                        disabled={!paramKey.trim() || !paramLabel.trim()}
                        title="Add parameter definition to the custom design sequence"
                        className="w-full py-1.5 bg-slate-805 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[10px] rounded transition-all cursor-pointer font-bold border border-slate-750 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-900 disabled:cursor-not-allowed"
                      >
                        + ADD FIELD
                      </button>
                    </div>
                  </div>
                </div>

                {/* Listing added dynamic keys */}
                <div className="space-y-1.5 max-h-[125px] overflow-y-auto">
                  {builtParams.map((p) => (
                    <div key={p.key} className="bg-slate-950 border border-slate-855 px-3 py-2 rounded-lg flex justify-between items-center text-[11px] font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded text-[10px]">{p.type.toUpperCase()}</span>
                        <span className="text-slate-250 font-semibold">{p.label} <span className="text-slate-500">({p.key})</span></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam(p.key)}
                        title="Remove this field parameter requirement"
                        className="text-slate-550 hover:text-red-400 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {builtParams.length === 0 && (
                    <span className="text-slate-600 text-xs italic">No custom credentials inputs configured yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950/40 border-t border-slate-850 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsCustomComposerOpen(false)}
                title="Discard design and leave soul compositor"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 font-mono text-xs rounded-xl transition-all cursor-pointer border border-slate-755"
              >
                CLOSE COMPOSER
              </button>
              <button
                type="submit"
                onClick={handleCreateCustomSkillSubmit}
                disabled={!newSkillName.trim() || !newSkillDesc.trim()}
                title="Consolidate definitions and append custom skill to inventory loading nodes"
                className="flex items-center gap-1.5 px-4 py-2 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer bg-slate-200 text-slate-950 hover:bg-white disabled:bg-slate-800 disabled:border-slate-850 disabled:text-slate-600 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: !newSkillName.trim() || !newSkillDesc.trim() ? undefined : accentColor,
                  color: !newSkillName.trim() || !newSkillDesc.trim() ? undefined : "#0f172a"
                }}
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5px]" />
                GENERATE SKILL METAMatrix
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
