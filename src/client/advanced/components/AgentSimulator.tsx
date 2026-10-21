// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { AgentProfile, Skill, Message, SimulatedLog, ProviderConfig, ContextSource, MCPServer } from "../types";
import { Send, Terminal, Cpu, ChevronDown, ChevronRight, HelpCircle, AlertCircle, Info, CheckCircle2, Globe, FileText, Bot, ExternalLink, ShieldCheck, Sparkles, Wrench, Activity, Check, Plus, AlertTriangle, Link } from "lucide-react";

interface AgentSimulatorProps {
  profile: AgentProfile;
  activeSkills: Skill[];
  accentColor: string;
  providerConfig?: ProviderConfig;
  mcpServers?: MCPServer[];
  contextSources?: ContextSource[];
  onEquipSkill?: (skillId: string) => void;
  strictRealismMode?: boolean;
}

// Interfaces for structured rendering
interface ParsedPart {
  type: "text" | "trigger";
  text?: string;
  skillId?: string;
  description?: string;
  parameters?: string;
  outcome?: string;
}

export const AgentSimulator: React.FC<AgentSimulatorProps> = ({
  profile,
  activeSkills,
  accentColor,
  providerConfig,
  mcpServers = [],
  contextSources = [],
  onEquipSkill,
  strictRealismMode = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `agent_workbench_copilot_history_${profile.name || "default"}`;
  const lastLoadedProfileRef = useRef<string | null>(null);

  // Architect Copilot conversational state
  const [copilotMessages, setCopilotMessages] = useState<Message[]>([
    {
      id: "copilot-welcome",
      role: "model",
      text: `⚙️ **[ARCHITECT COPILOT V2.0 READY]**
Greetings, administrator. I am your **S.O.U.L Architect Copilot**, running a co-thinking layer parallel to your agent's neural loadout.

I am scanning your workbench configuration in real-time. Ask me to **write custom webhook integration blocks**, **refine character profiles**, or **solve active dependency alerts**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [copilotInput, setCopilotInput] = useState<string>("");
  const [isCopilotLoading, setIsCopilotLoading] = useState<boolean>(false);
  const copilotEndRef = useRef<HTMLDivElement>(null);

  // Load message history from localStorage on mount or when the storageKey (profile name) changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCopilotMessages(parsed);
          lastLoadedProfileRef.current = profile.name;
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved copilot messages", e);
      }
    }
    // Fallback if no saved messages found
    setCopilotMessages([
      {
        id: "copilot-welcome",
        role: "model",
        text: `⚙️ **[ARCHITECT COPILOT V2.0 READY]**
Greetings, administrator. I am your **S.O.U.L Architect Copilot**, running a co-thinking layer parallel to your agent's neural loadout.

I am scanning your workbench configuration in real-time. Ask me to **write custom webhook integration blocks**, **refine character profiles**, or **solve active dependency alerts**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
    lastLoadedProfileRef.current = profile.name;
  }, [storageKey]);

  // Save conversation history to local storage upon updates
  useEffect(() => {
    if (lastLoadedProfileRef.current === profile.name && copilotMessages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(copilotMessages));
    }
  }, [copilotMessages, storageKey, profile.name]);

  const handleClearCopilotHistory = () => {
    const defaultMsg: Message = {
      id: "copilot-welcome",
      role: "model",
      text: `⚙️ **[ARCHITECT COPILOT V2.0 READY]**
Greetings, administrator. I am your **S.O.U.L Architect Copilot**, running a co-thinking layer parallel to your agent's neural loadout.

I am scanning your workbench configuration in real-time. Ask me to **write custom webhook integration blocks**, **refine character profiles**, or **solve active dependency alerts**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setCopilotMessages([defaultMsg]);
    localStorage.removeItem(storageKey);
  };

  // Auto-scroll copilot window
  useEffect(() => {
    copilotEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [copilotMessages, isCopilotLoading]);


  // Suggested Prompts
  const suggestedPrompts = [
    activeSkills.some(s => s.id === "web_search") 
      ? "What is the latest news and tech trends in AI agents?" 
      : "Conduct a system logic assessment.",
    "Draft a transaction summary and dispatch it via my hooks.",
    "Simulate structural storage of ledger items and write them into tables.",
  ];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const onSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Collect message history formatted for SDK integration
      const historyPayload = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text,
      }));

      // Ingest live credentials from the user's secure client vault
      let vaultKeys = {};
      const savedVault = localStorage.getItem("agent_workbench_vault_keys");
      if (savedVault) {
        try {
          vaultKeys = JSON.parse(savedVault);
        } catch (e) {
          console.error("Failed to parse saved keys vault", e);
        }
      }

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          skills: activeSkills,
          message: textToSend,
          history: historyPayload,
          providerConfig,
          mcpServers,
          contextSources,
          strictRealismMode,
          vaultKeys,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process message.");
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        groundingSources: data.groundingSources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        text: `⚠️ operational error: ${err.message || "Failed to reach agent framework core."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);

      // Proactively post a diagnostic action notice down to Copilot history
      const incidentNotice: Message = {
        id: `copilot-alert-${Date.now()}`,
        role: "system",
        text: `⚡ **[SIMULATION INCIDENT DETECTED]**
The agent workbench simulation failed with the message: *"${err.message || "Endpoint offline/timeout"}"*.

Click the **Debug Output** option under the failure message, or activate the automated **[RUN AUTO-DIAGNOSTICS]** suite below to audit prompt formatting, active skills (${activeSkills.length} equipped), and API parameters.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setCopilotMessages((prev) => [...prev, incidentNotice]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugWithCopilot = async (msgToDebug: Message) => {
    // Locate the user query instruction that preceded this message
    const msgIndex = messages.findIndex((m) => m.id === msgToDebug.id);
    let precedingUserPrompt = "";
    if (msgIndex > 0) {
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          precedingUserPrompt = messages[i].text;
          break;
        }
      }
    }

    const isSystemError = msgToDebug.role === "system";

    const debugPrompt = `
[DEBUGGER TRACE DIRECTIVE]
I need help debugging an unexpected output or execution failure.
${isSystemError ? "⚠️ **System Level Exception Encountered**" : "🔍 **Divergent Output Evaluation**"}

- **Preceding User Directive**: "${precedingUserPrompt || "Direct simulation trigger without prompt historical path"}"
- **Observed Chat Outcome to Debug**:
\`\`\`text
${msgToDebug.text}
\`\`\`

- **Active Neural Skills in Workspace**:
${activeSkills.map(s => `- \`${s.id}\` (${s.name}): "${s.description}" params: ${JSON.stringify(s.parameters)}`).join("\n") || "No neural skills currently equipped."}

Please provide a meticulous debugger analysis. Break it down into these exact technical sections:
1. **Divergent Cause Analysis**: Pinpoint exactly why this behavior deviated or failed (such as missing credential values, prompt-skill logic mismatch, formatting failure).
2. **Behavior Prompt Modifications**: Recommend precise paragraph refinements to copy-paste into our CORE Agent Behavior Metrics on the left pane under "Core Instructions", so that the agent handles this better next time.
3. **Integration Code Boilerplate**: Draft a secure Node.js Express server proxy route or Python middleware function demonstrating how we can validate this prompt and handle output responses properly.
4. **Suggested Action**: Provide a concise summary action that I can execute right away.
`.trim();

    await onSendCopilotMessage(debugPrompt);
  };

  const onSendCopilotMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isCopilotLoading) return;

    const userMsg: Message = {
      id: `copilot-user-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput("");
    setIsCopilotLoading(true);

    try {
      const historyPayload = copilotMessages
        .filter((m) => m.id !== "copilot-welcome" && m.role !== "system")
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          text: m.text,
        }));

      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          profile,
          skills: activeSkills,
          providerConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reach Architect Copilot.");
      }

      const botMessage: Message = {
        id: `copilot-bot-${Date.now()}`,
        role: "model",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setCopilotMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `copilot-error-${Date.now()}`,
        role: "system",
        text: `⚠️ Copilot Interface Failure: ${err.message || "Endpoint offline."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setCopilotMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Parsing routine: Breaks apart standard reply strings and isolates action triggers
  const parseMessageContent = (text: string): ParsedPart[] => {
    const parts: ParsedPart[] = [];
    const triggerRegex = /\[SKILL_TRIGGER:\s*([a-zA-Z0-9_-]+)\]([\s\S]*?)\[SKILL_END\]/g;
    
    let lastIndex = 0;
    let match;

    while ((match = triggerRegex.exec(text)) !== null) {
      const precedingText = text.substring(lastIndex, match.index);
      if (precedingText.trim()) {
        parts.push({ type: "text", text: precedingText });
      }

      const skillId = match[1];
      const interior = match[2];

      // Parse interior details
      let description = "";
      let parameters = "";
      let outcome = "";

      const descMatch = /Description of action:\s*(.*)/i.exec(interior);
      const paramMatch = /Input parameters:\s*(.*)/i.exec(interior);
      const outcomeMatch = /Simulated outcome:\s*([\s\S]*)/i.exec(interior);

      if (descMatch) description = descMatch[1].trim();
      if (paramMatch) parameters = paramMatch[1].trim();
      if (outcomeMatch) outcome = outcomeMatch[1].trim();

      parts.push({
        type: "trigger",
        skillId,
        description: description || "Executing customized operational directive",
        parameters: parameters || "{}",
        outcome: outcome || "Signal compiled successfully.",
      });

      lastIndex = triggerRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText.trim() || parts.length === 0) {
      parts.push({ type: "text", text: remainingText || text });
    }

    return parts;
  };

  // Helper component to render trigger nodes neatly
  const SkillTriggerNode: React.FC<{ part: ParsedPart; accentColor: string; activeSkills: Skill[] }> = ({
    part,
    accentColor,
    activeSkills,
  }) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    
    // Find skill definitions if they exist active
    const matchingSkill = activeSkills.find((s) => s.id === part.skillId);
    const skillName = matchingSkill ? matchingSkill.name : `${part.skillId?.toUpperCase()} SKILL`;

    return (
      <div className="my-3 border border-slate-800 bg-slate-950 rounded-xl overflow-hidden shadow-md">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-left bg-slate-900 border-b border-slate-850 px-4 py-2.5 flex items-center justify-between text-xs font-mono font-medium hover:bg-slate-850/60 transition-all"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span className="text-slate-300">ACTIVE TRACE:</span>
            <span style={{ color: accentColor }} className="font-bold uppercase tracking-wider">
              {skillName}
            </span>
          </span>
          <span className="flex items-center gap-2 text-slate-500">
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.2 rounded uppercase">
              RUNNING_OK
            </span>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {!collapsed && (
          <div className="p-4 space-y-3.5 text-xs font-mono bg-slate-950/60">
            <div>
              <span className="text-slate-550 block text-[10px] mb-0.5">DIRECTIVE DESCRIPTION:</span>
              <p className="text-slate-300 leading-relaxed font-sans">{part.description}</p>
            </div>

            {part.parameters && (
              <div>
                <span className="text-slate-550 block text-[10px] mb-0.5">INPUT ARGS SCHEMA:</span>
                <div className="p-2.5 bg-slate-900 rounded-md text-cyan-400 text-[11px] overflow-x-auto border border-slate-850/50">
                  {part.parameters}
                </div>
              </div>
            )}

            {part.outcome && (
              <div>
                <span className="text-slate-550 block text-[10px] mb-0.5">SIGNAL RESPONSES (OUTPUT):</span>
                <div className="p-2.5 bg-slate-900 rounded-md text-emerald-400 text-[11px] overflow-x-auto border border-slate-850/50">
                  {part.outcome}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full min-h-[500px]">
      {/* 1. AGENT SANDBOX SIMULATOR COLUMN */}
      <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl relative overflow-hidden flex flex-col h-full h-[520px] md:h-full text-slate-100 hover:border-pink-500/20 transition-all">
      {/* Header Info */}
      <div className="relative z-10 border-b border-slate-800 px-6 py-4.5 flex justify-between items-center bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center bg-slate-950" style={{ borderColor: accentColor }}>
            <Bot className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold tracking-tight text-white">
              {profile.name || "Custom Agent Sandbox"}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-550 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mr-1 sm:mr-2">
                ACTIVE ON TEST BENCH
              </span>
              {providerConfig && (
                <span className="text-[10px] bg-slate-950 border border-slate-800 text-cyan-400 font-mono px-2 py-0.5 rounded uppercase flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {providerConfig.provider}: {providerConfig.model}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {activeSkills.map((s) => (
            <div
              key={s.id}
              className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono font-medium text-slate-400 uppercase"
              title={s.description}
            >
              {s.name.split(" ")[0]}
            </div>
          ))}
          {activeSkills.length === 0 && (
            <span className="text-[10px] font-mono text-slate-550 italic">NO SKILLS INSTALLED</span>
          )}
        </div>
      </div>

      {/* Suggested Starting Prompt Chips */}
      {messages.length === 0 && (
        <div className="p-6 bg-slate-950/45 border-b border-slate-850/50">
          <span className="font-mono text-[10px] text-slate-500 block mb-2 uppercase">SUGGESTED OPERATIONAL PROMPTS</span>
          <div className="flex flex-col md:flex-row gap-2">
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(p)}
                className="text-left px-3.5 py-2 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-sans bg-slate-900/30 font-medium"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Core chat window container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <Cpu className="w-12 h-12 mb-3 opacity-15 animate-pulse" style={{ color: accentColor }} />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-450">ENTER SIGNAL DIRECTIVES TO INITIATE RUNTIME</p>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "user";
          const isMsgError = m.role === "system";

          return (
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              {/* Profile Icon for response bubble */}
              {!isUser && !isMsgError && (
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center bg-slate-950 mr-2.5 flex-shrink-0 self-start mt-1"
                  style={{ borderColor: accentColor }}
                >
                  <Bot className="w-4 h-4" style={{ color: accentColor }} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  isUser
                    ? "bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700/60 font-sans"
                    : isMsgError
                    ? "bg-red-950/20 border border-red-550/20 text-red-300 font-mono text-xs text-left"
                    : "bg-slate-925/80 border border-slate-800/80 text-slate-20/90 rounded-tl-none font-sans leading-relaxed text-left"
                }`}
              >
                {/* Parse & Render parts separately */}
                {isUser || isMsgError ? (
                  <p>{m.text}</p>
                ) : (
                  <div className="space-y-2">
                    {parseMessageContent(m.text).map((part, index) =>
                      part.type === "text" ? (
                        <p key={index} className="whitespace-pre-wrap leading-relaxed">{part.text}</p>
                      ) : (
                        <SkillTriggerNode
                          key={index}
                          part={part}
                          accentColor={accentColor}
                          activeSkills={activeSkills}
                        />
                      )
                    )}

                    {/* Google Search Citation links */}
                    {m.groundingSources && m.groundingSources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-850/80">
                        <span className="font-mono text-[10px] text-slate-550 flex items-center gap-1.5 uppercase mb-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          SEARCH GROUNDING VERIFIED SOURCES:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {m.groundingSources.map((src, i) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-330 hover:underline bg-slate-950 px-2.5 py-1 rounded border border-slate-850 font-sans font-medium"
                            >
                              {src.title || "Web Link"}
                              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-slate-800/40 mt-2.5 pt-2 shrink-0">
                  {!isUser ? (
                    <button
                      type="button"
                      onClick={() => handleDebugWithCopilot(m)}
                      className="inline-flex items-center gap-1.5 text-[9px] bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-amber-500/25 px-2.5 py-1 rounded text-slate-400 hover:text-amber-400 font-mono uppercase tracking-wider transition-all cursor-pointer font-semibold"
                      title="Analyze with Copilot to debug output anomalies, prompt mismatch or parameter settings."
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Debug Output</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <span className="text-[9px] text-slate-550 font-mono">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center bg-slate-950 mr-2.5 flex-shrink-0 mt-1 animate-pulse">
              <Bot className="w-4 h-4 text-slate-600 animate-spin" style={{ animationDuration: "10s" }} />
            </div>
            <div className="bg-slate-925/40 border border-slate-800/40 rounded-2xl rounded-tl-none px-4.5 py-3 text-xs font-mono text-slate-400 flex items-center gap-3">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="uppercase text-[10px] tracking-wide text-slate-500">
                {profile.name || "Agent"} is analyzing parameters...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input controls form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSendMessage(inputText);
        }}
        className="p-4 bg-slate-950/80 border-t border-slate-850 flex gap-2.5 relative z-10"
      >
        <input
          type="text"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-slate-700 transition-all font-sans"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          placeholder={`Instruct ${profile.name || "agent"}... e.g: "Search the latest news about prompt engineering."`}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-5 py-3 rounded-xl font-mono text-xs font-semibold uppercase flex items-center gap-1 bg-slate-200 hover:bg-white text-slate-950 disabled:bg-slate-850 disabled:border-slate-900 disabled:text-slate-650 disabled:cursor-not-allowed transition-all cursor-pointer"
          style={{
            backgroundColor: isLoading || !inputText.trim() ? undefined : accentColor,
            color: isLoading || !inputText.trim() ? undefined : "#0f172a",
          }}
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5px]" />
          SEND
        </button>
      </form>
    </div>

    {/* 2. S.O.U.L ARCHITECT BUILDER COPILOT PANEL */}
    <div className="lg:col-span-12 xl:col-span-5 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl relative overflow-hidden flex flex-col h-[550px] lg:h-[650px] text-slate-100 hover:border-pink-500/20 transition-all">
      {/* Pinned Title bar */}
      <div className="border-b border-slate-800 px-5 py-4 bg-slate-950/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-left font-display">
            <h3 className="text-xs font-bold text-slate-200">CO-PILOT ENGINEER</h3>
            <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              ACTIVE ARCHITECT CO-LOGIC
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearCopilotHistory}
            className="flex items-center gap-1 px-2 py-0.5 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 rounded text-[9px] font-mono text-slate-400 hover:text-red-400 transition-all cursor-pointer uppercase"
            title="Clear Chat History"
          >
            Clear History
          </button>
          <span className="font-mono text-[9px] bg-slate-900 px-2 py-0.5 border border-slate-800 text-slate-400 rounded">
            v2.1
          </span>
        </div>
      </div>

      {/* Real-time Diagnostics HUD */}
      <div className="bg-slate-950/40 p-3 border-b border-slate-850 stretch-0 shrink-0 text-left">
        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>NEURAL MATRIX REAL-TIME DIAGNOSTIC ASSESSMENT</span>
        </div>

        <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-0.5">
          {/* Compute and list diagnostic assessments */}
          {(() => {
            const alerts: { type: "info" | "warning" | "success"; text: string; action?: { label: string; skillId: string } }[] = [];

            if (!profile.personality || profile.personality.trim().length < 15) {
              alerts.push({
                type: "warning",
                text: "System Persona is sparse. Refine under the CORE metrics to ensure Gemini outputs targeted roles.",
              });
            }

            if (!profile.behavior || profile.behavior.trim().length < 15) {
              alerts.push({
                type: "warning",
                text: "Behavior direct instructions are thin. Map output guidelines for operational tasks.",
              });
            }

            // Evaluate dependencies
            const slackEquipped = activeSkills.some((s) => s.id === "slack_notifier");
            const webhookEquipped = activeSkills.some((s) => s.id === "webhook_dispatcher");
            if (slackEquipped && !webhookEquipped) {
              alerts.push({
                type: "warning",
                text: "Node 'Slack Dispatcher' requires active webhook handler forwarding triggers in slot loadout.",
                action: {
                  label: "SLOT WEBHOOK CAPABILITY",
                  skillId: "webhook_dispatcher",
                },
              });
            }

            const sandboxEquipped = activeSkills.some((s) => s.id === "sandbox_executor");
            const dataExtractorEquipped = activeSkills.some((s) => s.id === "data_extractor");
            if (sandboxEquipped && !dataExtractorEquipped) {
              alerts.push({
                type: "warning",
                text: "Container 'Python Executor' requires structured 'Table Parser' active to extract inputs.",
                action: {
                  label: "SLOT TABLE DATA PARSER",
                  skillId: "data_extractor",
                },
              });
            }

            // Check if there are active simulator errors / exceptions
            const hasSimulatorErrors = messages.some((m) => m.role === "system");
            if (hasSimulatorErrors) {
              alerts.push({
                type: "warning",
                text: "Simulation trace contains active exceptions. Prompt guidelines or parameters might have a logic deviation.",
                action: {
                  label: "RUN AUTO-DIAGNOSTICS TRACE",
                  skillId: "auto_diagnose",
                },
              });
            }

            if (alerts.length === 0) {
              alerts.push({
                type: "success",
                text: "No loadout anomalies found. Core node synapses are stable and correctly calibrated.",
              });
            }

            return alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-[10px] flex flex-col gap-1 ${
                  alert.type === "warning"
                    ? "bg-amber-500/5 border-amber-500/15 text-amber-300"
                    : "bg-emerald-500/5 border-emerald-500/15 text-emerald-300"
                }`}
              >
                <div className="flex items-start gap-1.5 leading-snug">
                  {alert.type === "warning" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <span>{alert.text}</span>
                </div>

                {alert.action && onEquipSkill && (
                  <button
                    type="button"
                    onClick={() => {
                      if (alert.action!.skillId === "auto_diagnose") {
                        const latestSystemErrorMsg = [...messages].reverse().find(msg => msg.role === "system");
                        if (latestSystemErrorMsg) {
                          handleDebugWithCopilot(latestSystemErrorMsg);
                        } else {
                          onSendCopilotMessage(`Initiate a trace sweep on prompt instructions: "${profile.behavior}". Active skills: ${activeSkills.map(s => s.name).join(", ")}`);
                        }
                      } else {
                        onEquipSkill!(alert.action!.skillId);
                      }
                    }}
                    className="mt-1 w-full text-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-550/30 text-amber-300 font-mono text-[9px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
                  >
                    <Plus className="w-3 h-3" />
                    {alert.action.label}
                    </button>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Copilot Chat Dialogue Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
          {copilotMessages.map((m) => {
            const isUser = m.role === "user";
            const isSystem = m.role === "system";

            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && !isSystem && (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-bold shrink-0 self-start mt-0.5 mr-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-xs text-left ${
                    isUser
                      ? "bg-slate-800 text-slate-100 rounded-tr-none border border-slate-700/50"
                      : isSystem
                      ? "bg-red-950/20 text-red-300 border border-red-550/20 font-mono text-xs"
                      : "bg-slate-950/60 text-slate-300 border border-slate-850/80 rounded-tl-none prose prose-invert font-sans"
                  }`}
                >
                  {isUser || isSystem ? (
                    <div className="space-y-2 flex flex-col w-full">
                      <span className="whitespace-pre-wrap leading-normal font-sans">{m.text}</span>
                      {isSystem && m.text.includes("[RUN AUTO-DIAGNOSTICS]") && (
                        <button
                          type="button"
                          onClick={() => {
                            const latestSystemErrorMsg = [...messages].reverse().find(msg => msg.role === "system");
                            if (latestSystemErrorMsg) {
                              handleDebugWithCopilot(latestSystemErrorMsg);
                            } else {
                              onSendCopilotMessage(`Synthesize a diagnostics test harness. Equipped skills: ${activeSkills.map(s => s.name).join(", ")}. Primary guidelines: "${profile.behavior}". Propose exact fixes.`);
                            }
                          }}
                          className="mt-1 w-full text-center bg-red-500/10 hover:bg-red-500/20 border border-red-550/20 text-red-300 font-mono text-[9px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all uppercase"
                        >
                          <Activity className="w-3.5 h-3.5 text-red-400" />
                          <span>Run Auto-Diagnostics Suite</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300 leading-relaxed font-sans space-y-1 select-text markdown-body">
                      <Markdown>{m.text}</Markdown>
                    </div>
                  )}
                  <span className="block text-[8px] text-slate-500 font-mono text-right mt-1">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isCopilotLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse mr-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div className="bg-slate-950/50 border border-slate-850/80 rounded-xl rounded-tl-none px-3.5 py-2 text-[10px] text-amber-400 font-mono flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-amber-550 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="uppercase text-[9px]">Copilot indexing context...</span>
              </div>
            </div>
          )}

          <div ref={copilotEndRef} />
        </div>

        {/* Quick Suggestion inquiries */}
        <div className="px-4 py-2 border-t border-slate-850 bg-slate-950/30 text-left shrink-0">
          <span className="font-mono text-[8px] text-slate-500 uppercase block mb-1">CO-PILOT QUICK CONSTRUCTIONS</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => onSendCopilotMessage("Show Node.js Express integrations for active skills.")}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/25 rounded text-[10px] shrink-0 transition-all font-sans font-medium cursor-pointer"
            >
              Node.js SDK
            </button>
            <button
              onClick={() => onSendCopilotMessage("Write a complete Flask Python app setup with Webhook dispatcher.")}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/25 rounded text-[10px] shrink-0 transition-all font-sans font-medium cursor-pointer"
            >
              Flask Python
            </button>
            <button
              onClick={() => onSendCopilotMessage("Check my custom agent personality prompt and suggest an optimized prompt block.")}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/25 rounded text-[10px] shrink-0 transition-all font-sans font-medium cursor-pointer"
            >
              Optimize Character
            </button>
          </div>
        </div>

        {/* Input dialog form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendCopilotMessage(copilotInput);
          }}
          className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2 shrink-0 relative z-10"
        >
          <input
            type="text"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-slate-700 transition-all font-sans"
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            disabled={isCopilotLoading}
            placeholder="Ask Architect Copilot... e.g: 'Help me write an MCP script.'"
          />
          <button
            type="submit"
            disabled={isCopilotLoading || !copilotInput.trim()}
            className="px-4 py-2 text-xs font-mono font-semibold uppercase flex items-center gap-1.5 rounded-xl transition-all cursor-pointer"
            style={{
              backgroundColor: isCopilotLoading || !copilotInput.trim() ? "#1e293b" : "#f59e0b",
              color: isCopilotLoading || !copilotInput.trim() ? "#475569" : "#0f172a",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2px]" />
            ASK
          </button>
        </form>
      </div>
    </div>
  );
};
