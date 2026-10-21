import React, { useEffect, useState } from "react";
import {
  Brain,
  Lightbulb,
  Syringe,
  Link2,
  FileText,
  Code2,
  Check,
  X,
  RefreshCw,
  Clock,
  Upload,
} from "lucide-react";

interface Thought {
  type: string;
  summary: string;
  timestamp: number;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  risk: string;
  status: string;
  createdAt: number | null;
}

type InjectMode = "text" | "link" | "file" | "skill";

interface GskMindTabProps {
  accentColor: string;
}

export const GskMindTab: React.FC<GskMindTabProps> = ({ accentColor }) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const [injectMode, setInjectMode] = useState<InjectMode>("text");
  const [kTitle, setKTitle] = useState("");
  const [kContent, setKContent] = useState("");
  const [kUrl, setKUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillCode, setSkillCode] = useState("");
  const [recallQuery, setRecallQuery] = useState("");
  const [recallResults, setRecallResults] = useState<any[]>([]);
  const [forgePrompt, setForgePrompt] = useState("");
  const [forgeUrl, setForgeUrl] = useState("");
  const [forgeInfo, setForgeInfo] = useState<string>("");
  const [forgePrevCode, setForgePrevCode] = useState<string>("");
  const [forging, setForging] = useState(false);
  const [gallery, setGallery] = useState<Array<{ id: string; url: string; bytes: number; created: number; title: string }>>([]);

  const loadGallery = async () => {
    try {
      const r = await fetch("/api/gsk/artifacts").then((x) => x.json());
      if (r.success) setGallery(r.artifacts || []);
    } catch {}
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const viewArtifact = (url: string) => {
    setForgeUrl(url);
    setForgeInfo("Viewing artifact from gallery.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteArtifact = async (id: string) => {
    try {
      await fetch(`/api/gsk/artifacts/${id}.html`, { method: "DELETE" });
      setGallery((g) => g.filter((a) => a.id !== id));
      if (forgeUrl.includes(id)) setForgeUrl("");
    } catch {}
  };

  const forge = async (fixNote?: string) => {
    const p = forgePrompt.trim();
    if (!p || forging) return;
    setForging(true);
    setForgeUrl("");
    setForgeInfo("GSK is building...");
    try {
      const r = await fetch("/api/gsk/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, previousCode: fixNote ? forgePrevCode : undefined, fixNote }),
      }).then((x) => x.json());
      if (r.success) {
        setForgeUrl(r.url);
        setForgeInfo(`Artifact ${r.id} forged — ${r.bytes} bytes, live below.`);
      } else {
        setForgeInfo(`Forge failed: ${r.error}${r.raw ? ` — "${String(r.raw).slice(0, 120)}..."` : ""}`);
      }
    } catch (e: any) {
      setForgeInfo(`Forge error: ${e.message}`);
    } finally {
      setForging(false);
    }
  };

  const fetchForgeCode = async () => {
    try {
      const t = await fetch(forgeUrl).then((x) => x.text());
      setForgePrevCode(t);
      return t;
    } catch { return ""; }
  };

  const fixForge = async () => {
    const code = await fetchForgeCode();
    if (!code) return setForgeInfo("Could not fetch current artifact to fix.");
    setForging(true);
    setForgeInfo("Telling GSK what broke...");
    try {
      const r = await fetch("/api/gsk/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: forgePrompt,
          previousCode: code,
          fixNote: "The artifact failed to render properly in the user's iframe. Diagnose likely issues (syntax errors, missing closing tags, broken JS) and return the FULL corrected artifact.",
        }),
      }).then((x) => x.json());
      if (r.success) {
        setForgeUrl(r.url);
        setForgeInfo(`Re-forged as ${r.id} (${r.bytes} bytes).`);
      } else {
        setForgeInfo(`Fix attempt rejected: ${r.error}`);
      }
    } catch (e: any) {
      setForgeInfo(`Fix error: ${e.message}`);
    } finally {
      setForging(false);
    }
  };

  const recall = async () => {
    const q = recallQuery.trim();
    if (!q) return;
    setStatus(`Searching his long-term memory for "${q}"...`);
    try {
      const r = await fetch(`/api/gsk/recall?q=${encodeURIComponent(q)}`).then((x) => x.json());
      if (r.success) {
        setRecallResults(r.results || []);
        setStatus(`Found ${r.results.length} memories.`);
      } else {
        setStatus(`Recall failed: ${r.error}`);
      }
    } catch (e: any) {
      setStatus(`Recall error: ${e.message}`);
    }
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 20000);
    return () => clearInterval(iv);
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        fetch("/api/gsk/thoughts").then(r => r.json()).catch(() => null),
        fetch("/api/gsk/proposals").then(r => r.json()).catch(() => null),
      ]);
      if (t?.success) setThoughts(t.thoughts || []);
      if (p?.success) setProposals(p.proposals || []);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id: string, approve: boolean) => {
    setStatus(`${approve ? "Approving" : "Denying"} ${id}...`);
    try {
      const r = await fetch(`/api/gsk/proposals/${approve ? "approve" : "deny"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then(x => x.json());
      setStatus(r.success ? `${id} ${approve ? "approved" : "denied"}` : `Failed: ${r.error}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
    refresh();
  };

  const inject = async () => {
    try {
      if (injectMode === "text") {
        if (!kContent.trim()) return setStatus("Knowledge content is empty.");
        await postInject("/api/gsk/inject/knowledge", { title: kTitle || undefined, content: kContent });
      } else if (injectMode === "link") {
        if (!/^https?:\/\//i.test(kUrl)) return setStatus("Enter a valid http(s) URL.");
        await postInject("/api/gsk/inject/knowledge", { url: kUrl });
      } else if (injectMode === "file") {
        if (!kContent.trim()) return setStatus("No file loaded — pick a file first.");
        await postInject("/api/gsk/inject/knowledge", { title: fileName, content: kContent });
      } else {
        if (!skillName.trim() || !skillCode.trim()) return setStatus("Skill needs name and code.");
        await postInject("/api/gsk/inject/skill", { name: skillName.trim(), code: skillCode });
      }
    } catch (e: any) {
      setStatus(`Injection failed: ${e.message}`);
    }
  };

  const postInject = async (url: string, body: any) => {
    setStatus("Injecting into GSK's brain...");
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(x => x.json());
    setStatus(
      r.success
        ? r.stored === false && url.includes("knowledge")
          ? "Queued (GSK memory busy — will retry on next witness)."
          : `Injected: ${r.label || r.name || r.chars + " chars"}`
        : `Rejected: ${r.error}`
    );
    if (r.success) {
      setKTitle(""); setKContent(""); setKUrl(""); setFileName(""); setSkillName(""); setSkillCode("");
    }
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 500000) return setStatus("File too large (max ~500KB of text).");
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setKContent(String(reader.result || ""));
    reader.readAsText(f);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full gap-6 hover:border-pink-500/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">GSK Mind</h2>
            <p className="text-slate-400 text-sm">His thoughts, his proposals, your injections.</p>
          </div>
        </div>
        <button onClick={refresh} disabled={loading} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {status && (
        <div className="p-3 bg-slate-950/50 border border-purple-500/30 rounded-xl text-sm font-mono text-purple-300">{status}</div>
      )}

      {/* ARTIFACT GALLERY */}
      {gallery.length > 0 && (
        <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5" style={{ color: accentColor }} />
              Artifact Gallery ({gallery.length})
            </h3>
            <button onClick={loadGallery} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white">Refresh</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {gallery.map((a) => (
              <div key={a.id} className={`group relative rounded-xl border transition-all cursor-pointer ${forgeUrl.includes(a.id) ? "border-purple-500/50" : "border-slate-800 hover:border-purple-500/30"}`} onClick={() => viewArtifact(a.url)}>
                <div className="relative h-28 overflow-hidden rounded-t-xl bg-slate-950 pointer-events-none">
                  <iframe src={a.url} sandbox="allow-scripts" loading="lazy" title={a.id} className="absolute top-0 left-0 w-[300%] h-[300%] origin-top-left scale-[0.3333] border-0" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-bold text-white truncate">{a.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{(a.bytes / 1024).toFixed(1)}KB · {new Date(a.created).toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteArtifact(a.id); }}
                  title="Delete artifact"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-red-950/90 border border-red-500/40 rounded text-[10px] text-red-400 hover:text-red-300 transition-opacity"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THOUGHT STREAM */}
      <div className="flex-1 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl min-h-0">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: accentColor }} />
          Thought Stream ({thoughts.length})
        </h3>
        {thoughts.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recent thoughts captured. They appear as GSK processes.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {thoughts.map((t, i) => (
              <div key={i} className="p-3 bg-slate-900/70 border-l-2 border-purple-500/40 rounded-r-lg">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-3">{t.summary}</p>
                  <span className="text-[10px] text-slate-500 shrink-0">{new Date(t.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LONG-TERM RECALL */}
      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5" style={{ color: accentColor }} />
          Long-Term Recall
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={recallQuery}
            onChange={(e) => setRecallQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") recall(); }}
            placeholder="Search everything he has ever learned..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40"
          />
          <button onClick={recall} className="px-4 py-2 bg-slate-900 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors">
            Search
          </button>
        </div>
        {recallResults.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {recallResults.map((m, i) => (
              <div key={i} className="p-3 bg-slate-900/70 border-l-2 border-cyan-500/40 rounded-r-lg">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-3">{String(m.content ?? m.summary ?? "").slice(0, 300)}</p>
                  <span className="text-[10px] text-purple-400 shrink-0 uppercase">{m.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PROPOSALS */}
      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" style={{ color: accentColor }} />
          His Proposals ({proposals.length})
        </h3>
        {proposals.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No pending proposals. GSK proposes when his GoalEngine fires.</p>
        ) : (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {proposals.map((p) => (
              <div key={p.id} className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-white">{p.title}</p>
                    {p.description && p.description !== p.title && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0 uppercase">{p.risk}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide(p.id, true)} className="flex-1 py-1.5 bg-slate-950 border border-green-500/30 rounded-lg text-xs font-bold text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => decide(p.id, false)} className="flex-1 py-1.5 bg-slate-950 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                    <X className="w-3.5 h-3.5" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THE FORGE */}
      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Code2 className="w-5 h-5" style={{ color: accentColor }} />
          The Forge — he builds, you see it
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={forgePrompt}
            onChange={(e) => setForgePrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !forging) forge(); }}
            disabled={forging}
            placeholder={forging ? "GSK is forging..." : "Tell him what to build — e.g. an animated PLT pyramid visualizer"}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
          />
          <button onClick={() => forge()} disabled={forging || !forgePrompt.trim()} className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-300 hover:from-purple-500/30 transition-all disabled:opacity-40 whitespace-nowrap">
            Forge It
          </button>
        </div>
        {forgeInfo && <p className="text-xs font-mono text-purple-300 mb-3">{forgeInfo}</p>}
        {forgeUrl && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase">Live artifact — rendered from his code</span>
              <button onClick={fixForge} disabled={forging} className="px-2 py-1 bg-slate-900 border border-orange-500/30 rounded-lg text-[10px] font-bold text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-40">
                Broken? Tell GSK to fix it
              </button>
            </div>
            <iframe
              src={forgeUrl}
              sandbox="allow-scripts"
              className="w-full h-80 rounded-xl border border-slate-800 bg-slate-950"
              title="GSK forged artifact"
            />
          </div>
        )}
      </div>

      {/* INJECTION BAY */}
      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Syringe className="w-5 h-5" style={{ color: accentColor }} />
          Injection Bay
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {([
            ["text", "Knowledge", FileText],
            ["link", "Link", Link2],
            ["file", "File", Upload],
            ["skill", "Skill", Code2],
          ] as [InjectMode, string, any][]).map(([mode, label, Icon]) => (
            <button
              key={mode}
              onClick={() => setInjectMode(mode)}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                injectMode === mode
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                  : "bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {injectMode === "text" && (
          <div className="space-y-2">
            <input value={kTitle} onChange={(e) => setKTitle(e.target.value)} placeholder="Title (optional)" className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40" />
            <textarea value={kContent} onChange={(e) => setKContent(e.target.value)} placeholder="Paste knowledge, context, instructions..." rows={4} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40 resize-y" />
          </div>
        )}
        {injectMode === "link" && (
          <input value={kUrl} onChange={(e) => setKUrl(e.target.value)} placeholder="https://example.com/article — server fetches and feeds GSK" className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40" />
        )}
        {injectMode === "file" && (
          <div className="space-y-2">
            <label className="block px-3 py-4 bg-slate-900 border border-dashed border-slate-700 rounded-xl text-center text-sm text-slate-400 hover:border-purple-500/40 cursor-pointer transition-colors">
              <input type="file" accept=".txt,.md,.json,.js,.csv,.html" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
              {fileName ? <span className="text-green-400">{fileName} loaded</span> : "Click to choose a text file (.txt .md .json .js .csv)"}
            </label>
            {kContent && <p className="text-[10px] text-slate-500">{kContent.length} chars ready</p>}
          </div>
        )}
        {injectMode === "skill" && (
          <div className="space-y-2">
            <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Skill name e.g. price_analyzer" className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40" />
            <textarea value={skillCode} onChange={(e) => setSkillCode(e.target.value)} placeholder={"module.exports.execute = async function(input) {\n  return 'result';\n};"} rows={5} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/40 resize-y" />
          </div>
        )}

        <button onClick={inject} className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl text-sm font-bold text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center justify-center gap-2">
          <Syringe className="w-4 h-4" /> Inject into GSK
        </button>
      </div>
    </div>
  );
};
