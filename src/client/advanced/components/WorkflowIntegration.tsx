// @ts-nocheck
import React, { useState, useEffect } from "react";
import { AgentProfile, Skill } from "../types";
import { Play, Copy, Check, Terminal, ExternalLink, Network, RefreshCw, Send, HelpCircle, Download } from "lucide-react";

interface WorkflowIntegrationProps {
  profile: AgentProfile;
  activeSkills: Skill[];
  accentColor: string;
}

export const WorkflowIntegration: React.FC<WorkflowIntegrationProps> = ({
  profile,
  activeSkills,
  accentColor,
}) => {
  const [activeTab, setActiveTab] = useState<"node" | "python" | "json">("node");
  const [copied, setCopied] = useState<boolean>(false);
  
  // Webhook Tester states
  const [webhookUrl, setWebhookUrl] = useState<string>("https://httpbin.org/post");
  const [testPayload, setTestPayload] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Integration Code segments
  const [nodeCode, setNodeCode] = useState<string>("");
  const [pythonCode, setPythonCode] = useState<string>("");
  const [jsonPayload, setJsonPayload] = useState<string>("");

  // Compile on change
  useEffect(() => {
    const fetchCompilation = async () => {
      try {
        const res = await fetch("/api/agent/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            skills: activeSkills,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setNodeCode(data.node);
          setPythonCode(data.python);
          setJsonPayload(data.webhookPayload);

          // Update test payload template
          setTestPayload(JSON.stringify(JSON.parse(data.webhookPayload), null, 2));
        }
      } catch (err) {
        console.error("Compilation error:", err);
      }
    };
    fetchCompilation();
  }, [profile, activeSkills]);

  const handleCopy = () => {
    let source = "";
    if (activeTab === "node") source = nodeCode;
    else if (activeTab === "python") source = pythonCode;
    else source = jsonPayload;

    navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/agent/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          nodeCode,
          pythonCode,
          webhookPayload: jsonPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile ZIP payload on backend");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${profile.name?.replace(/\s+/g, "_") || "agent"}_neural_loadout.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const executeWebhookTest = async () => {
    setIsLoading(true);
    setDispatchResult(null);
    setDispatchError(null);

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(testPayload);
      } catch (e: any) {
        throw new Error(`Invalid JSON test payload format: ${e.message}`);
      }

      const res = await fetch("/api/agent/dispatch-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          payload: parsedPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({
          status: data.status,
          statusText: data.statusText,
          durationMs: data.durationMs,
          body: data.response,
        });
      } else {
        setDispatchError(data.error || "Failed to dispatch hook payload.");
      }
    } catch (err: any) {
      setDispatchError(err.message || "Network request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/20 transition-all">
      <div className="relative z-10 border-b border-slate-800 pb-4 mb-5">
        <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Network className="w-5 h-5 animate-pulse-slow" style={{ color: accentColor }} />
          Workflow Integration Hub
        </h2>
        <p className="text-xs text-slate-400">Generate copyable SDK scripts or run live test dispatches to standard webhooks</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10 flex-1">
        
        {/* Left Card: Code Generation Tabs */}
        <div className="xl:col-span-7 flex flex-col space-y-3">
          <div className="flex justify-between items-center bg-slate-950 p-1.5 rounded-lg border border-slate-850">
            <div className="flex space-x-1">
              {(["node", "python", "json"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md uppercase transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? "bg-slate-800 text-white font-semibold border border-slate-700/50"
                      : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  {tab === "node" ? "NodeJS (Express)" : tab === "python" ? "Python (Flask)" : "Blueprint Event"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-mono transition-all cursor-pointer active:scale-95 select-none"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    COPY
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 border border-amber-600 rounded-lg text-[11px] text-slate-950 font-mono font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 select-none uppercase tracking-tight"
                title="Download entire agent loadout files as a direct structured ZIP bundle"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ZIPPING...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    DOWNLOAD ZIP
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[300px] flex flex-col bg-slate-950 border border-slate-850 rounded-xl overflow-hidden font-mono text-xs">
            {/* Terminal status bar */}
            <div className="bg-slate-900 border-b border-slate-850 px-4 py-2 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-600" />
                INTEGRATION_SDK_GENERATED
              </span>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse" />
              </div>
            </div>

            <textarea
              readOnly
              className="w-full flex-1 p-4 bg-slate-950 text-slate-300 outline-none resize-none select-text font-mono text-[11px] leading-relaxed overflow-y-auto"
              value={
                activeTab === "node"
                  ? nodeCode
                  : activeTab === "python"
                  ? pythonCode
                  : jsonPayload
              }
            />
          </div>
        </div>

        {/* Right card: Live Webhook Connection Sandbox */}
        <div className="xl:col-span-5 flex flex-col space-y-3.5">
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col h-full">
            <h3 className="text-white font-semibold font-display text-xs flex items-center gap-1.5 mb-2 uppercase">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Interactive Webhook Tester
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 font-sans leading-relaxed">
              Equip your agent with real outer-world trigger actions. Use standard web endpoints (e.g. Webhook.site) to capture live dispatches on demand.
            </p>

            <div className="space-y-3 flex-1 mb-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">ENDPOINT HTTP POST TARGET URL</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-20 py-2 text-xs text-slate-200 outline-none focus:border-slate-700 font-mono transition-all"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://yourserver.com/hooks"
                  />
                  <div className="absolute right-1 top-1 text-[9px] font-mono px-2 py-1.5 bg-slate-955 rounded text-slate-400">
                    POST
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">INTERACTION METRICS PAYLOAD (JSON)</label>
                <textarea
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-[10px] text-emerald-400 outline-none focus:border-slate-700 font-mono transition-all resize-none"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                />
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={executeWebhookTest}
              disabled={isLoading || !webhookUrl}
              className={`w-full py-2.5 flex items-center justify-center gap-2 font-mono text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isLoading || !webhookUrl
                  ? "bg-slate-850 border-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 tracking-wide hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  DISPATCHING SIGNAL...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  DISPATCH LIVE TEST PAYLOAD
                </>
              )}
            </button>

            {/* Results Console Terminal */}
            {(dispatchResult || dispatchError) && (
              <div className="mt-4 border-t border-slate-850 pt-3 text-left">
                <span className="font-mono text-[10px] text-slate-400 block mb-2 uppercase">TELEMETRY RESULTS</span>
                
                {dispatchError ? (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-xs font-mono text-red-400 h-[100px] overflow-y-auto">
                    {dispatchError}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-4 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 mr-15">HTTP STATUS:</span>
                        <span className={dispatchResult.status < 300 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {dispatchResult.status} {dispatchResult.statusText}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 mr-2">RESPONSE TIME:</span>
                        <span className="text-white font-bold">{dispatchResult.durationMs}ms</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-300 h-[80px] overflow-y-auto select-all">
                      {typeof dispatchResult.body === "object"
                        ? JSON.stringify(dispatchResult.body, null, 2)
                        : dispatchResult.body}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
