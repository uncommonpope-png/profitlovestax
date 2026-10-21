import React, { useState, useEffect, useRef } from "react";
import { Upload, Play, Bug, Sparkles, Archive, Download, Code, FileCode, Check, RefreshCw, AlertCircle, Terminal, FileText, History, FolderOpen, Plus, Trash2, Save, FastForward, Rewind, Wand2, Cpu, Layers, Activity } from "lucide-react";

interface ArtifactForgeTabProps {
  accentColor: string;
  providerConfig?: any;
}

interface LogEntry {
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: string;
}

interface ArtifactSessionMeta {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  codeLength: number;
  hasProposal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuantumFrame {
  id: number;
  timestamp: string;
  type: "log" | "error" | "warn" | "info" | "checkpoint";
  message: string;
  codeSnapshot: string;
}

export const ArtifactForgeTab: React.FC<ArtifactForgeTabProps> = ({ accentColor }) => {
  const [code, setCode] = useState<string>(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0b0f19; color: #00ff41; font-family: monospace; padding: 20px; text-align: center; }
    .card { border: 1px solid #00ff41; padding: 20px; border-radius: 12px; box-shadow: 0 0 20px rgba(0,255,65,0.2); }
    button { background: #00ff41; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ PROFIT ARTIFACT SANDBOX</h1>
    <p>Uploaded HTML/JS code renders live here.</p>
    <button onclick="console.log('Artifact pulse triggered!')">Test Execution</button>
  </div>
</body>
</html>`);

  const [fileName, setFileName] = useState<string>("sample-artifact.html");
  const [fileType, setFileType] = useState<"html" | "javascript" | "json" | "markdown">("html");
  const [activeSubTab, setActiveSubTab] = useState<"preview" | "debug" | "proposals" | "quantum">("preview");
  
  // Console logs & errors
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // AI Audit / Proposals
  const [isAuditing, setIsAuditing] = useState(false);
  const [proposal, setProposal] = useState<string>("");
  const [pltScore, setPltScore] = useState<{ profit: number; love: number; tax: number }>({ profit: 0.9, love: 0.7, tax: 0.2 });
  const [savedStatus, setSavedStatus] = useState<string>("");

  // Artifact Working Sessions
  const [artifactSessions, setArtifactSessions] = useState<ArtifactSessionMeta[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Time-Travel Quantum Debugger & Auto-Patch Engine
  const [quantumFrames, setQuantumFrames] = useState<QuantumFrame[]>([
    {
      id: 0,
      timestamp: new Date().toLocaleTimeString(),
      type: "checkpoint",
      message: "Initial Code Checkpoint Loaded",
      codeSnapshot: code,
    },
  ]);
  const [scrubIndex, setScrubIndex] = useState<number>(0);
  const [isAutoPatching, setIsAutoPatching] = useState<boolean>(false);
  const [quantumPatch, setQuantumPatch] = useState<{ patchedCode: string; explanation: string } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch session history list
  const fetchArtifactSessions = async () => {
    try {
      const res = await fetch("/api/profit/artifact-sessions");
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setArtifactSessions(data.sessions);
      }
    } catch {
      // silently ignore if offline
    }
  };

  useEffect(() => {
    fetchArtifactSessions();
  }, []);

  // Load selected session
  const handleLoadSession = async (id: string) => {
    if (!id) return;
    try {
      setSessionStatus("Loading...");
      const res = await fetch(`/api/profit/artifact-sessions/${id}`);
      const data = await res.json();
      if (data.success && data.session) {
        const s = data.session;
        setCode(s.code || "");
        setFileName(s.fileName || "artifact.html");
        setFileType((s.fileType as any) || "html");
        setProposal(s.proposal || "");
        setLogs(Array.isArray(s.logs) ? s.logs : []);
        setPltScore(s.pltScore || { profit: 0.9, love: 0.7, tax: 0.2 });
        setCurrentSessionId(s.id);
        setSessionStatus(`Restored: ${s.title}`);
        setTimeout(() => setSessionStatus(""), 3000);
      }
    } catch (e: any) {
      setSessionStatus(`Failed: ${e.message}`);
    }
  };

  // Save current session
  const handleSaveSession = async () => {
    if (isSavingSession) return;
    setIsSavingSession(true);
    setSessionStatus("Saving...");
    try {
      const res = await fetch("/api/profit/artifact-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentSessionId || undefined,
          title: fileName || "Untitled Artifact Session",
          fileName,
          fileType,
          code,
          proposal,
          logs,
          pltScore,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setCurrentSessionId(data.session.id);
        setSessionStatus("Session saved!");
        fetchArtifactSessions();
        setTimeout(() => setSessionStatus(""), 3000);
      } else {
        setSessionStatus(`Save error: ${data.error}`);
      }
    } catch (e: any) {
      setSessionStatus(`Save error: ${e.message}`);
    } finally {
      setIsSavingSession(false);
    }
  };

  // Create fresh session
  const handleNewSession = () => {
    setCurrentSessionId(null);
    setFileName(`artifact-${Date.now().toString(36)}.html`);
    setCode(`<!DOCTYPE html><html><body><h1>New Artifact</h1></body></html>`);
    setProposal("");
    setLogs([]);
    setSessionStatus("Started new fresh session");
    setTimeout(() => setSessionStatus(""), 3000);
  };

  // Delete current session
  const handleDeleteSession = async (idToDelete?: string) => {
    const id = idToDelete || currentSessionId;
    if (!id) return;
    if (!confirm("Are you sure you want to delete this artifact working session?")) return;
    try {
      const res = await fetch(`/api/profit/artifact-sessions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (id === currentSessionId) {
          setCurrentSessionId(null);
        }
        setSessionStatus("Session deleted");
        fetchArtifactSessions();
        setTimeout(() => setSessionStatus(""), 3000);
      }
    } catch (e: any) {
      setSessionStatus(`Delete error: ${e.message}`);
    }
  };

  // Intercept iframe logs via postMessage wrapper
  const getWrappedCode = () => {
    if (fileType !== "html") return code;
    const consoleInterceptor = `
      <script>
        (function() {
          var _log = console.log, _err = console.error, _warn = console.warn;
          console.log = function() {
            var msg = Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'log', message: msg }, '*');
            _log.apply(console, arguments);
          };
          console.error = function() {
            var msg = Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: msg }, '*');
            _err.apply(console, arguments);
          };
          window.onerror = function(msg, url, line) {
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: msg + ' (Line ' + line + ')' }, '*');
          };
        })();
      </script>
    `;
    return consoleInterceptor + code;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "CONSOLE_LOG") {
        const newLog: LogEntry = {
          type: event.data.level || "log",
          message: event.data.message,
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogs((prev) => [...prev, newLog]);

        // Record Quantum Frame Snapshot
        setQuantumFrames((prev) => {
          const nextFrames: QuantumFrame[] = [
            ...prev,
            {
              id: prev.length,
              timestamp: newLog.timestamp,
              type: newLog.type as any,
              message: newLog.message,
              codeSnapshot: code,
            },
          ];
          setScrubIndex(nextFrames.length - 1);
          return nextFrames;
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code]);

  // Run AI Quantum Auto-Patch Engine
  const runQuantumAutoPatch = async () => {
    if (isAutoPatching) return;
    setIsAutoPatching(true);
    setQuantumPatch(null);
    try {
      const activeFrame = quantumFrames[scrubIndex] || quantumFrames[quantumFrames.length - 1];
      const errorLogs = logs.filter((l) => l.type === "error");

      const prompt = `Act as Profit's Time-Travel Quantum Auto-Patch Engine.
Analyze this code and the captured execution error:

Code Snapshot (${fileName}):
\`\`\`${fileType}
${code}
\`\`\`

Captured Error / Event Frame:
${activeFrame ? `[${activeFrame.timestamp}] ${activeFrame.type.toUpperCase()}: ${activeFrame.message}` : "No specific error frame"}
All Error Logs: ${errorLogs.map((e) => e.message).join(" | ") || "None recorded"}

Provide a JSON object response with:
1. "explanation": A 2-sentence summary of the bug and how it was quantum-patched.
2. "patchedCode": The complete, fully-functional refactored code block with the fix applied.

Return ONLY raw JSON in this format:
{"explanation": "...", "patchedCode": "..."}`;

      const res = await fetch("/api/profit/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      
      if (data.success && data.reply) {
        try {
          // Extract JSON block from response
          const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.patchedCode) {
              setQuantumPatch({
                patchedCode: parsed.patchedCode,
                explanation: parsed.explanation || "Quantum auto-patch compiled successfully.",
              });
              setActiveSubTab("quantum");
            }
          } else {
            // Fallback: extract code block if markdown code returned
            const codeMatch = data.reply.match(/```(?:html|javascript|js|json)?\n([\s\S]*?)\n```/);
            if (codeMatch && codeMatch[1]) {
              setQuantumPatch({
                patchedCode: codeMatch[1],
                explanation: "Extracted code patch from Profit proposal.",
              });
              setActiveSubTab("quantum");
            }
          }
        } catch {
          setQuantumPatch({
            patchedCode: code,
            explanation: `Raw proposal received: ${data.reply.slice(0, 200)}...`,
          });
        }
      }
    } catch (e: any) {
      alert(`Quantum Auto-Patch Error: ${e.message}`);
    } finally {
      setIsAutoPatching(false);
    }
  };

  // Apply Quantum Patch Live
  const applyQuantumPatch = () => {
    if (!quantumPatch?.patchedCode) return;
    setCode(quantumPatch.patchedCode);
    setQuantumPatch(null);
    setActiveSubTab("preview");

    // Add Quantum Checkpoint Frame
    setQuantumFrames((prev) => [
      ...prev,
      {
        id: prev.length,
        timestamp: new Date().toLocaleTimeString(),
        type: "checkpoint",
        message: "Applied Quantum Auto-Patch Refactor",
        codeSnapshot: quantumPatch.patchedCode,
      },
    ]);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx") setFileType("javascript");
    else if (ext === "json") setFileType("json");
    else if (ext === "md") setFileType("markdown");
    else setFileType("html");

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCode(event.target.result);
        setLogs([]);
        setProposal("");
      }
    };
    reader.readAsText(file);
  };

  // AI Code Audit & Proposal Request
  const runAiProposal = async () => {
    if (!code.trim() || isAuditing) return;
    setIsAuditing(true);
    setProposal("");
    try {
      const prompt = `Perform a high-level code audit and optimization proposal for this uploaded ${fileType} artifact ("${fileName}"):

\`\`\`${fileType}
${code.slice(0, 3000)}
\`\`\`

Provide:
1. **PLT Score Analysis** (Profit, Love, Tax evaluation of this code)
2. **Security & Bug Audit** (Highlight syntax issues, unhandled errors, or bad practices)
3. **Refactored Code Proposal** (Specific code improvements to elevate performance or UI)`;

      const res = await fetch("/api/profit/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setProposal(data.reply);
        setActiveSubTab("proposals");
      } else {
        setProposal(`[Error generating proposal] ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setProposal(`[Link Error] ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Save to Profit Artifact Vault
  const saveToVault = async () => {
    setSavedStatus("Saving...");
    try {
      const res = await fetch("/api/profit/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fileName,
          kind: fileType,
          content: code,
          notes: `Uploaded artifact audited & stored via Artifact Forge. PLT: ${pltScore.profit}/${pltScore.love}/${pltScore.tax}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedStatus("Saved to Vault!");
        setTimeout(() => setSavedStatus(""), 3000);
      } else {
        setSavedStatus(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setSavedStatus(`Error: ${e.message}`);
    }
  };

  // Download Code
  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl flex flex-col h-full gap-6 text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff41]/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <FileCode className="w-6 h-6 text-[#00ff41]" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Artifact Forge & Code Studio
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30">
                LIVE SANDBOX
              </span>
            </h2>
            <p className="text-slate-400 text-sm">Upload, render, debug, and generate AI proposals for HTML & JavaScript artifacts</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:border-[#00ff41]/50 rounded-xl text-xs font-mono cursor-pointer transition-colors text-slate-200">
            <Upload className="w-4 h-4 text-[#00ff41]" />
            Upload File
            <input type="file" accept=".html,.js,.jsx,.ts,.tsx,.json,.md" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={runAiProposal}
            disabled={isAuditing}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 rounded-xl text-xs font-mono text-purple-300 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? "Auditing Code..." : "AI Proposals"}
          </button>

          <button
            onClick={saveToVault}
            className="flex items-center gap-2 px-3 py-2 bg-[#00ff41]/15 border border-[#00ff41]/40 hover:bg-[#00ff41]/25 rounded-xl text-xs font-mono text-[#00ff41] transition-colors"
          >
            <Archive className="w-4 h-4" />
            {savedStatus || "Save to Vault"}
          </button>

          <button
            onClick={downloadCode}
            className="p-2 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-300 transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Artifact Session recall & switcher bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800/90 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Artifact Session Recall:</span>
          </div>
          
          <select
            value={currentSessionId || ""}
            onChange={(e) => handleLoadSession(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 max-w-xs truncate"
          >
            <option value="">-- Active Sandbox (Unsaved Session) --</option>
            {artifactSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({new Date(s.updatedAt).toLocaleTimeString()}) {s.hasProposal ? '✦ AI Proposal' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleSaveSession}
            disabled={isSavingSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors disabled:opacity-50"
            title="Save current code state to artifact session history"
          >
            <Save className="w-3.5 h-3.5" />
            Save Session
          </button>

          <button
            onClick={handleNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            title="Start new fresh session"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            New Session
          </button>

          {currentSessionId && (
            <button
              onClick={() => handleDeleteSession()}
              className="p-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Delete active session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {sessionStatus && (
            <span className="text-slate-400 font-mono text-[11px] animate-pulse">
              {sessionStatus}
            </span>
          )}
        </div>
      </div>

      {/* Workspace Grid: Left Editor | Right Sandbox & Debugger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left: Code Editor Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#00ff41]" />
              <span className="text-xs font-mono text-slate-300 font-bold">{fileName}</span>
            </div>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-300 outline-none"
            >
              <option value="html">HTML Sandbox</option>
              <option value="javascript">JavaScript / TS</option>
              <option value="json">JSON Spec</option>
              <option value="markdown">Markdown Docs</option>
            </select>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-slate-950 border border-slate-800 focus:border-[#00ff41]/50 rounded-xl p-3 font-mono text-xs text-slate-200 outline-none resize-none leading-relaxed"
            placeholder="Paste HTML or JavaScript code here..."
            spellCheck={false}
          />
        </div>

        {/* Right: Live Sandbox, Debugger & AI Proposals (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 min-h-0">
          
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveSubTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors ${
                activeSubTab === "preview"
                  ? "bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Live Render
            </button>

            <button
              onClick={() => setActiveSubTab("debug")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors relative ${
                activeSubTab === "debug"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bug className="w-3.5 h-3.5" /> Debug Console
              {logs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500/30 text-amber-300 font-bold">
                  {logs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab("proposals")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors ${
                activeSubTab === "proposals"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Proposals
            </button>

            <button
              onClick={() => setActiveSubTab("quantum")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors relative ${
                activeSubTab === "quantum"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Time-Travel Quantum (5)
              {quantumFrames.length > 1 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-500/30 text-cyan-300 font-bold">
                  {quantumFrames.length}
                </span>
              )}
            </button>
          </div>

          {/* Sub-tab 1: Live Render Sandbox */}
          {activeSubTab === "preview" && (
            <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-white relative">
              {fileType === "html" ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={getWrappedCode()}
                  title="Artifact Render Sandbox"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                />
              ) : (
                <div className="w-full h-full bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-auto">
                  <div className="text-slate-500 mb-2">// Raw Code View ({fileType}):</div>
                  <pre className="whitespace-pre-wrap">{code}</pre>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Debug Console */}
          {activeSubTab === "debug" && (
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-2 text-slate-400">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> Captured Runtime Logs
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 uppercase tracking-wider"
                >
                  Clear Console
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {logs.length === 0 && (
                  <div className="text-slate-600 italic py-6 text-center">
                    No runtime logs captured yet. Click elements inside the sandbox to trigger events.
                  </div>
                )}
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded border flex items-start gap-2 ${
                      log.type === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-300"
                        : log.type === "warn"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 3: AI Audit & Proposals */}
          {activeSubTab === "proposals" && (
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col font-mono text-xs overflow-y-auto">
              {isAuditing && (
                <div className="flex-1 flex flex-col items-center justify-center text-purple-400 gap-3">
                  <Sparkles className="w-8 h-8 animate-spin" />
                  <p>Profit & GSK are auditing your code artifact...</p>
                </div>
              )}
              {!isAuditing && !proposal && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Sparkles className="w-8 h-8 opacity-40" />
                  <p>Click "AI Proposals" above to generate a PLT audit & refactor plan for this artifact.</p>
                </div>
              )}
              {!isAuditing && proposal && (
                <div className="space-y-3 text-slate-200 leading-relaxed">
                  <div className="text-purple-400 font-bold text-sm border-b border-slate-800 pb-2">
                    ⚡ PROFIT AI AUDIT & CODE PROPOSAL
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs">{proposal}</pre>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 4: Time-Travel Quantum Debugger & Auto-Patch Engine */}
          {activeSubTab === "quantum" && (
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col font-mono text-xs gap-4 overflow-y-auto">
              
              {/* Quantum Auto-Patch Header Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div>
                    <div className="font-bold text-cyan-300 text-sm">Time-Travel Quantum Debugger</div>
                    <div className="text-[11px] text-cyan-200/70">Scrub execution timeline & trigger AI auto-patch refactors live.</div>
                  </div>
                </div>

                <button
                  onClick={runQuantumAutoPatch}
                  disabled={isAutoPatching}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 hover:border-cyan-400 text-cyan-200 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-cyan-400 ${isAutoPatching ? 'animate-spin' : ''}`} />
                  {isAutoPatching ? "Synthesizing Quantum Patch..." : "⚡ Run Quantum Auto-Patch"}
                </button>
              </div>

              {/* Time-Travel Timeline Scrubber */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Activity className="w-3.5 h-3.5" /> Timeline Scrubber: Frame {scrubIndex + 1} of {quantumFrames.length}
                  </span>
                  <span>
                    {quantumFrames[scrubIndex]?.timestamp || "N/A"}
                  </span>
                </div>

                {/* Scrubber Range Slider & Step Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScrubIndex(0)}
                    disabled={scrubIndex === 0}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30"
                    title="First Frame"
                  >
                    <Rewind className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setScrubIndex((prev) => Math.max(0, prev - 1))}
                    disabled={scrubIndex === 0}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[11px] disabled:opacity-30"
                  >
                    Step Back
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, quantumFrames.length - 1)}
                    value={scrubIndex}
                    onChange={(e) => setScrubIndex(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  <button
                    onClick={() => setScrubIndex((prev) => Math.min(quantumFrames.length - 1, prev + 1))}
                    disabled={scrubIndex === quantumFrames.length - 1}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-[11px] disabled:opacity-30"
                  >
                    Step Fwd
                  </button>

                  <button
                    onClick={() => setScrubIndex(quantumFrames.length - 1)}
                    disabled={scrubIndex === quantumFrames.length - 1}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30"
                    title="Latest Frame"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quantum Auto-Patch Result Banner (if synthesized) */}
              {quantumPatch && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                    <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" /> Quantum Auto-Patch Synthesized!
                    </span>
                    <button
                      onClick={applyQuantumPatch}
                      className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors text-xs"
                    >
                      Apply Patch Live
                    </button>
                  </div>

                  <p className="text-slate-300 text-xs italic">{quantumPatch.explanation}</p>

                  <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">// Patched Code Preview:</div>
                    <pre className="text-slate-200 text-[11px] whitespace-pre-wrap">{quantumPatch.patchedCode}</pre>
                  </div>
                </div>
              )}

              {/* Active Frame Detailed View */}
              {quantumFrames[scrubIndex] && (
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> Frame Event Details:
                    </span>
                    <button
                      onClick={() => setCode(quantumFrames[scrubIndex].codeSnapshot)}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Restore Code To This Frame Snapshot
                    </button>
                  </div>

                  <div className={`p-2.5 rounded border text-xs ${
                    quantumFrames[scrubIndex].type === "error"
                      ? "bg-red-500/10 border-red-500/30 text-red-300"
                      : quantumFrames[scrubIndex].type === "checkpoint"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-300"
                  }`}>
                    <div className="text-[10px] opacity-60 mb-0.5">
                      [{quantumFrames[scrubIndex].timestamp}] TYPE: {quantumFrames[scrubIndex].type.toUpperCase()}
                    </div>
                    <div>{quantumFrames[scrubIndex].message}</div>
                  </div>

                  <div className="mt-1">
                    <div className="text-[10px] text-slate-500 mb-1">// Frame Code Snapshot ({quantumFrames[scrubIndex].codeSnapshot.length} chars):</div>
                    <pre className="p-2 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {quantumFrames[scrubIndex].codeSnapshot}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
