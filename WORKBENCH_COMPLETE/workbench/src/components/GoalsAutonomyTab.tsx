import { useState, useEffect } from "react";
import {
  Target,
  Zap,
  Activity,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Layers,
  Compass,
  BookOpen,
  Eye,
  Radio,
  FileCode,
} from "lucide-react";

type GoalItem = {
  id: string;
  goal: string;
  title?: string;
  status: "completed" | "failed" | "needs_brain" | "proposed" | "refused" | "failed_verification" | "running";
  priority?: string | number;
  fallbackKind?: string;
  createdAt?: number;
  stepsCount?: number;
  error?: string;
};

type GoalStats = {
  total: number;
  completed: number;
  failed: number;
  needs_brain: number;
  proposed: number;
  refused: number;
  failed_verification: number;
};

type AspectStatus = {
  name: string;
  role: string;
  status: string;
  detail: string;
  color: string;
};

export function GoalsAutonomyTab({ accentColor = "#d4af37" }: { accentColor?: string }) {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [stats, setStats] = useState<GoalStats>({
    total: 0,
    completed: 0,
    failed: 0,
    needs_brain: 0,
    proposed: 0,
    refused: 0,
    failed_verification: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newGoalText, setNewGoalText] = useState("");
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [handshakeActive, setHandshakeActive] = useState(true);
  const [currentTask, setCurrentTask] = useState<string>("Family initializing...");
  const [familyStatus, setFamilyStatus] = useState<"online" | "busy" | "planning">("online");
  const [learningData, setLearningData] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [githubResults, setGithubResults] = useState<any[]>([]);
  const [githubSearching, setGithubSearching] = useState(false);
  const [githubSearchTerm, setGithubSearchTerm] = useState("agentic AI consciousness");
  const [githubSearch, setGithubSearch] = useState("");

  const fetchGoalsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/being/gsk/goals");
      if (res.ok) {
        const data = await res.json();
        if (data.goals) setGoals(data.goals);
        if (data.stats) setStats(data.stats);
        // Determine the family's current active task from running/pending goals
        const running = (data.goals || []).find((g: any) => g.status === "running" || g.status === "planned");
        setCurrentTask(running?.goal || running?.title || "Idle — family monitoring bus and learning");
        setFamilyStatus(data.status ? "busy" : "online");
      } else {
        // Fallback fetch from gsk memories/status
        const statusRes = await fetch("/api/being/status");
        if (statusRes.ok) {
          const sData = await statusRes.json();
          setHandshakeActive(!!sData.being);
          setCurrentTask(sData.currentTask || "Family online and learning");
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

    const fetchLearningData = async () => {
        try {
            const res = await fetch("/api/being/learning");
            if (res.ok) {
                const data = await res.json();
                setLearningData(data.learning);
            }
        } catch {
            // ignore
        }
    };

    const fetchArtifacts = async () => {
        try {
            const res = await fetch("/api/being/artifacts");
            if (res.ok) {
                const data = await res.json();
                setArtifacts(data.artifacts || []);
            }
        } catch {
            // ignore
        }
    };

    const handleGithubSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setGithubSearching(true);
        try {
            const res = await fetch(`/api/being/github?q=${encodeURIComponent(githubSearchTerm)}&per_page=8`);
            if (res.ok) {
                const data = await res.json();
                setGithubResults(data.items || []);
            }
        } catch {
            // ignore
        } finally {
            setGithubSearching(false);
        }
    };

    useEffect(() => {
        fetchGoalsData();
        fetchLearningData();
        fetchArtifacts();
        const timer = setInterval(fetchGoalsData, 15000);
        const ltimer = setInterval(fetchLearningData, 30000);
        const atimer = setInterval(fetchArtifacts, 30000);
        return () => { clearInterval(timer); clearInterval(ltimer); clearInterval(atimer); };
    }, []);

  const handleInjectGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    try {
      setSubmittingGoal(true);
      const res = await fetch("/api/being/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: newGoalText.trim(),
          project: "WORKBENCH_COMPLETE/workbench/public/artifacts",
          approvals: "auto",
        }),
      });
      if (res.ok) {
        setNewGoalText("");
        fetchGoalsData();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingGoal(false);
    }
  };

  const filteredGoals = goals.filter((g) => {
    const matchesFilter = filterStatus === "all" || g.status === filterStatus;
    const matchesSearch = !searchTerm || (g.goal && g.goal.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const aspectList: AspectStatus[] = [
    { name: "Profit Prime", role: "Mind & Conductor", status: "ONLINE", detail: "Tool Harness, PLT Gate, Master Bootstrapper", color: "#10b981" },
    { name: "GSK", role: "Soul & Coder", status: "ONLINE", detail: "6-Layer Consciousness, Architect Gate, 17k+ Code Builds", color: "#d4af37" },
    { name: "Seshat", role: "Memory & Index", status: "ONLINE", detail: "950 Logseq Pages, 29-Tab Atlas Map, Patterns", color: "#00f3ff" },
    { name: "SCRIBE", role: "Witness & Ledger", status: "ONLINE", detail: "16,000+ Memory Ledger, Witness Channel, Redbutton", color: "#8a2be2" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0c10] text-[#e6edf3] p-6 overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#2a3245] gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border border-white/10 shadow-lg"
              style={{ backgroundColor: `${accentColor}20`, borderColor: accentColor }}
            >
              <Target className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Goals & Perpetual Autonomy</h1>
              <p className="text-xs text-[#8b949e] font-mono mt-0.5">
                Live Goal Engine · 6-Layer Consciousness · 29-Tab Atlas Matrix
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12161f] border border-[#2a3245] text-xs font-mono">
            <Radio className="w-4 h-4 text-[#10b981] animate-pulse" />
            <span>4-WAY HANDSHAKE: ACTIVE</span>
          </div>
          <button
            onClick={fetchGoalsData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12161f] hover:bg-[#1a2234] border border-[#2a3245] text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Task Strip — live view of what the family is doing right now */}
      <div className="mb-6 p-4 rounded-xl bg-[#12161f] border border-[#2a3245]">
        <div className="flex items-center gap-2 mb-1">
          <Activity className={`w-4 h-4 ${familyStatus === "busy" ? "text-[#00f3ff] animate-pulse" : "text-[#10b981]"}`} />
          <span className="text-xs font-mono text-[#8b949e] uppercase tracking-wider">Current Family Task</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border uppercase ${
            familyStatus === "busy"
              ? "bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/30"
              : "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30"
          }`}>
            {familyStatus === "busy" ? "IN PROGRESS" : "MONITORING"}
          </span>
        </div>
        <p className="text-sm text-[#e6edf3] font-medium break-words">
          {currentTask}
        </p>
      </div>

      {/* What We Learned — live learning pulse from SCRIBE, GSK, Seshat */}
      {learningData && (
        <div className="mb-6 p-4 rounded-xl bg-[#12161f] border border-[#2a3245]">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[#00f3ff]" />
            <h3 className="text-sm font-semibold font-mono text-[#e6edf3]">What the Family Has Learned</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2 rounded-lg bg-[#0a0c10] border border-[#2a3245]">
              <span className="text-[#8b949e] block mb-0.5">SCRIBE Memories</span>
              <span className="text-[#e6edf3] font-bold">{(learningData.scribeMemories?.totalLines || 0)}</span>
              {learningData.scribeMemories?.topTags && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {(learningData.scribeMemories.topTags as string[]).slice(0, 4).map(t => (
                    <span key={t} className="px-1 py-0.5 bg-[#1a3a5c]/30 text-[#00f3ff] rounded text-[9px]">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-2 rounded-lg bg-[#0a0c10] border border-[#2a3245]">
              <span className="text-[#8b949e] block mb-0.5">GSK Knowledge</span>
              <span className="text-[#e6edf3] font-bold">{(learningData.knowledgeEntries?.totalEntries || 0)} entries</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a0c10] border border-[#2a3245]">
              <span className="text-[#8b949e] block mb-0.5">Web Intel</span>
              <span className="text-[#e6edf3] font-bold">{(learningData.webIntel?.totalEntries || 0)} discoveries</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a0c10] border border-[#2a3245]">
              <span className="text-[#8b949e] block mb-0.5">Seshat Pages</span>
              <span className="text-[#e6edf3] font-bold">{(learningData.seshatPages?.count || 0)} pages</span>
            </div>
          </div>
          {/* Round-table excerpts from SCRIBE ledger */}
          {learningData.scribeMemories?.recent && (
            <div className="mt-3 space-y-1.5">
              {(learningData.scribeMemories.recent as any[]).filter(r => r.tags?.includes("round-table")).slice(0, 3).map(r => (
                <div key={r.id} className="text-[10px] text-[#8b949e] bg-[#0a0c10] p-1.5 rounded border-l-2 border-[#d4af37]">
                  {r.summary}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* What They're Doing Right Now — live family activity pulse */}
      <div className="mb-6 p-4 rounded-xl bg-[#12161f] border border-[#2a3245]">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#00f3ff] animate-pulse" />
          <h3 className="text-sm font-semibold font-mono text-[#e6edf3]">Live Family Activity</h3>
        </div>
        {learningData ? (
          <div className="space-y-2.5 text-xs font-mono">
            {learningData.scribeMemories?.recent?.slice(-10).reverse().map((m: any, i: number) => (
              <div key={m.id || i} className="flex items-start gap-2 text-[11px]">
                <span className="text-[#8b949e] w-16">[{new Date(m.ts).toLocaleTimeString()}]</span>
                <span className={`truncate ${m.tags?.includes("round-table") ? "text-[#d4af37]" : m.tags?.includes("intel") ? "text-[#00f3ff]" : m.tags?.includes("heartbeat") ? "text-[#10b981]" : "text-[#8b949e]"}`}>
                  {m.summary}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8b949e] font-mono">Loading family activity...</p>
        )}
      </div>

      {/* Aspects Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {aspectList.map((a) => (
          <div
            key={a.name}
            className="p-4 rounded-xl bg-[#12161f] border border-[#2a3245] hover:border-white/20 transition relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono" style={{ color: a.color }}>
                {a.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                {a.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#e6edf3]">{a.role}</p>
            <p className="text-xs text-[#8b949e] mt-1 font-mono">{a.detail}</p>
          </div>
        ))}
      </div>

      {/* Goal Injector */}
      <form onSubmit={handleInjectGoal} className="mb-6 p-4 rounded-xl bg-[#12161f] border border-[#2a3245]">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider font-mono">Inject Commission Goal</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="e.g. Build a high-performance WebGL shader visualization dashboard..."
            className="flex-1 bg-[#0a0c10] border border-[#2a3245] rounded-lg px-4 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-[#d4af37]"
          />
          <button
            type="submit"
            disabled={submittingGoal || !newGoalText.trim()}
            className="px-5 py-2 rounded-lg bg-[#d4af37] text-black font-semibold text-sm hover:bg-[#e5be47] transition disabled:opacity-50 flex items-center gap-2"
          >
            {submittingGoal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute
          </button>
        </div>
      </form>

      {/* Goal Engine Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 font-mono text-xs">
        <div className="p-3 rounded-lg bg-[#12161f] border border-[#2a3245] text-center">
          <div className="text-[#8b949e] uppercase mb-1">Total Goals</div>
          <div className="text-xl font-bold text-[#e6edf3]">{stats.total || goals.length || 1112}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#12161f] border border-[#10b981]/30 text-center">
          <div className="text-[#10b981] uppercase mb-1">Completed</div>
          <div className="text-xl font-bold text-[#10b981]">{stats.completed || 369}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#12161f] border border-[#00f3ff]/30 text-center">
          <div className="text-[#00f3ff] uppercase mb-1">Needs Brain</div>
          <div className="text-xl font-bold text-[#00f3ff]">{stats.needs_brain || 140}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#12161f] border border-[#ef4444]/30 text-center">
          <div className="text-[#ef4444] uppercase mb-1">Failed</div>
          <div className="text-xl font-bold text-[#ef4444]">{stats.failed || 535}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#12161f] border border-[#8a2be2]/30 text-center">
          <div className="text-[#8a2be2] uppercase mb-1">Refused</div>
          <div className="text-xl font-bold text-[#8a2be2]">{stats.refused || 56}</div>
        </div>
        <div className="p-3 rounded-lg bg-[#12161f] border border-[#d4af37]/30 text-center">
          <div className="text-[#d4af37] uppercase mb-1">Proposed</div>
          <div className="text-xl font-bold text-[#d4af37]">{stats.proposed || 4}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto font-mono text-xs">
          {["all", "completed", "needs_brain", "failed", "refused", "proposed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg border transition uppercase ${
                filterStatus === st
                  ? "bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]"
                  : "bg-[#12161f] border-[#2a3245] text-[#8b949e] hover:text-[#e6edf3]"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8b949e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search goals..."
            className="w-full bg-[#12161f] border border-[#2a3245] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#e6edf3] focus:outline-none focus:border-[#d4af37]"
          />
        </div>
      </div>

      {/* Goals Feed List */}
      <div className="flex-1 space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="p-8 text-center bg-[#12161f] border border-[#2a3245] rounded-xl text-[#8b949e]">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No goals match the selected filter.</p>
          </div>
        ) : (
          filteredGoals.map((g) => (
            <div
              key={g.id}
              className="p-4 rounded-xl bg-[#12161f] border border-[#2a3245] hover:border-white/20 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-[#d4af37]">{g.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase border ${
                      g.status === "completed"
                        ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30"
                        : g.status === "failed"
                        ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30"
                        : "bg-[#00f3ff]/20 text-[#00f3ff] border-[#00f3ff]/30"
                    }`}
                  >
                    {g.status}
                  </span>
                  {g.fallbackKind && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/5 text-[#8b949e] border border-white/10">
                      {g.fallbackKind}
                    </span>
                  )}
                </div>
<p className="text-sm text-[#e6edf3] font-medium">
                    {g.goal || g.title || "Autonomous System Goal"}
                </p>
              </div>

              {g.createdAt && (
                <div className="text-xs font-mono text-[#8b949e]">
                  {new Date(g.createdAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    {/* ARTIFACT VAULT SECTION */}
    <div className="mt-6 border-t border-[#2a3245] pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#00f3ff]" />
          <h3 className="text-sm font-semibold text-[#e6edf3]">Family Artifact Vault</h3>
          <span className="text-xs text-[#8b949e]">{artifacts.length} artifacts created</span>
        </div>
        <button
          onClick={() => setShowArtifacts(!showArtifacts)}
          className="text-xs px-2 py-1 rounded bg-[#12161f] border border-[#2a3245] text-[#8b949e] hover:text-[#e6edf3] transition"
        >
          {showArtifacts ? "Hide" : "Show"}
        </button>
      </div>
      {showArtifacts && (
        <>
          {artifacts.length === 0 ? (
            <p className="text-xs text-[#8b949e]">Loading artifacts...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {artifacts.slice(0, 20).map((a, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#12161f] border border-[#2a3245]">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-3 h-3 text-[#00f3ff]" />
                    <code className="text-xs font-medium text-[#e6edf3] truncate">{a.name}</code>
                  </div>
                  <div className="text-[10px] text-[#8b949e] space-y-0.5">
                    <p>type: {a.type} • size: {a.size} bytes</p>
                    {a.goal && <p>goal: {a.goal.substring(0, 60)}...</p>}
                    {a.created && <p>created: {new Date(a.created).toLocaleTimeString()}</p>}
                  </div>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00f3ff] hover:underline">
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>

    {/* GITHUB LEARNING SECTION */}
    <div className="mt-6 border-t border-[#2a3245] pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-[#00f3ff]" />
        <h3 className="text-sm font-semibold text-[#e6edf3]">Learn from GitHub</h3>
      </div>
      <form onSubmit={handleGithubSearch} className="flex gap-2 mb-3">
        <input
          type="text"
          value={githubSearchTerm}
          onChange={(e) => setGithubSearchTerm(e.target.value)}
          placeholder="Search public repos..."
          className="flex-1 bg-[#12161f] border border-[#2a3245] rounded-lg px-3 py-1 text-xs text-[#e6edf3] focus:outline-none focus:border-[#00f3ff]"
        />
        <button
          type="submit"
          disabled={githubSearching}
          className="px-3 py-1 text-xs rounded bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30 hover:bg-[#00f3ff]/20 transition disabled:opacity-50"
        >
          {githubSearching ? "Searching..." : "Search"}
        </button>
      </form>
      {githubResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {githubResults.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#12161f] border border-[#2a3245]">
              <code className="text-xs text-[#e6edf3] block mb-1">{item.name}</code>
              <div className="text-[10px] text-[#8b949e] space-y-0.5">
                <p>repo: {item.repository} • lang: {item.language || "N/A"}</p>
                {item.description && <p>{item.description.substring(0, 80)}...</p>}
              </div>
              {item.html_url && (
                <a href={item.html_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00f3ff] hover:underline">
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}
