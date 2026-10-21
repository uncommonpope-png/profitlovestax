import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { FolderTree, Save, TerminalSquare, Play, Users, File as FileIcon, FilePlus2, Trash2, RefreshCw, Search as SearchIcon, GitBranch, Command, X, ListTree } from "lucide-react";
import { XtermDrawer } from "./ide/terminal/XtermDrawer";
import { ForgeDockLayout } from "./ide/layout/ForgeDockLayout";
import { FleetDrawer } from "./ide/fleet/FleetDrawer";
import { GitGraph, GraphCommit } from "./ide/git/GitGraph";
import { getMonacoLspAdapter, MonacoLspAdapter } from "../services/monaco/MonacoLspAdapter";
import { ConflictRegion } from "../shared/mergeConflicts";
import { FORGE_MONACO_THEME, defineForgeTheme } from "../shared/forgeTheme";
import { loader } from "@monaco-editor/react";

// Register the glass theme at module load so every Monaco mount finds it ready.
loader.init().then((mon) => defineForgeTheme(mon as any)).catch(() => {});

interface TreeNode { name: string; type: "dir" | "file"; children?: TreeNode[] }
interface AcpAgent { id: string; name: string; binary?: string; description?: string }
type OpenFile = { path: string; content: string; original: string; dirty: boolean };
type SidePanel = "explorer" | "search" | "git" | "outline";
interface SymbolItem { name: string; kind: "function" | "class" | "interface" | "type" | "variable"; line: number }
interface SearchHit { path: string; line: number; text: string }

const REPO = "C:\\Users\\uncom\\Downloads\\Profit Bible Foundation Acknowledged - DeepSeek_files\\WORKBENCH_COMPLETE";

function ansiToHtml(s: string): string {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const map: Record<string, string> = { "30": "#4b5563", "31": "#ef4444", "32": "#22c55e", "33": "#eab308", "34": "#3b82f6", "35": "#a855f7", "36": "#06b6d4", "37": "#e5e7eb", "90": "#6b7280", "91": "#f87171", "92": "#4ade80", "93": "#facc15", "94": "#60a5fa", "95": "#c084fc", "96": "#22d3ee", "97": "#ffffff" };
  return esc.replace(/\x1b\[(\d+)(?:;(\d+))?m/g, (_m, a: string, b?: string) => {
    const code = map[a] ? a : b && map[b] ? b : null;
    if (a === "0") return "</span>";
    if (code) return `<span style="color:${map[code]}">`;
    return "";
  }) + "</span>";
}

function lineDiff(oldS: string, newS: string): { type: "same" | "add" | "del"; text: string }[] {
  const a = oldS.split("\n"), b = newS.split("\n");
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { type: "same" | "add" | "del"; text: string }[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: "same", text: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", text: a[i++] }); }
    else { out.push({ type: "add", text: b[j++] }); }
  }
  while (i < n) out.push({ type: "del", text: a[i++] });
  while (j < m) out.push({ type: "add", text: b[j++] });
  return out;
}

function parseSymbols(content: string): SymbolItem[] {
  if (!content) return [];
  const lines = content.split("\n");
  const symbols: SymbolItem[] = [];
  const re = /(?:export\s+)?(?:async\s+)?(function|class|interface|type|const|let|var)\s+([A-Za-z0-9_$]+)/;
  lines.forEach((lineText, idx) => {
    const match = lineText.match(re);
    if (match) {
      const [, kw, name] = match;
      let kind: SymbolItem["kind"] = "variable";
      if (kw === "function") kind = "function";
      else if (kw === "class") kind = "class";
      else if (kw === "interface") kind = "interface";
      else if (kw === "type") kind = "type";
      else if (kw === "const" && lineText.includes("=>")) kind = "function";
      symbols.push({ name, kind, line: idx + 1 });
    }
  });
  return symbols;
}

const langOf = (p: string) => {
  const ext = p.split(".").pop()?.toLowerCase();
  return ({ ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript", json: "json", md: "markdown", html: "html", css: "css", ps1: "shell" } as Record<string, string>)[ext || ""] || "plaintext";
};
const dotColor = (name: string) => name.match(/\.(ts|tsx)$/) ? "#3178c6" : name.match(/\.(js|jsx|mjs|cjs)$/) ? "#f7df1e" : name.match(/\.json$/) ? "#eab308" : name.match(/\.md$/) ? "#60a5fa" : name.match(/\.html$/) ? "#fb923c" : name.match(/\.css$/) ? "#c084fc" : "#64748b";

interface IdeTabProps { accentColor: string }

export const IdeTab: React.FC<IdeTabProps> = ({ accentColor }) => {
  const [rootDir, setRootDir] = useState(REPO);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() => {
    try { return JSON.parse(localStorage.getItem("forge_tabs") || "[]"); } catch { return []; }
  });
  const [activePath, setActivePath] = useState<string>(() => localStorage.getItem("forge_active") || "");
  const [side, setSide] = useState<SidePanel>("explorer");
  const [searchQ, setSearchQ] = useState("");
  const [replaceQ, setReplaceQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [gitOut, setGitOut] = useState<{ status?: string; log?: string }>({});
  const [gitMode, setGitMode] = useState<"changes" | "graph">("changes");
  const [hunkDiff, setHunkDiff] = useState<{ file: string; unstaged: Array<{ index: number; header: string; adds: number; dels: number }>; staged: Array<{ index: number; header: string; adds: number; dels: number }> } | null>(null);
  const [graphData, setGraphData] = useState<GraphCommit[]>([]);
  const [mergeInfo, setMergeInfo] = useState<{ merging: boolean; conflicts: Array<{ path: string; state: string }>; incomingBranch: string | null }>({ merging: false, conflicts: [], incomingBranch: null });
  const [cfFile, setCfFile] = useState<string | null>(null);
  const [cfRegions, setCfRegions] = useState<ConflictRegion[]>([]);
  const [cfChoices, setCfChoices] = useState<Array<"ours" | "theirs" | "both">>([]);
  const [blameText, setBlameText] = useState("");
  const [commitMsg, setCommitMsg] = useState("");
  const [composerOn, setComposerOn] = useState(false);
  const [composerPrompt, setComposerPrompt] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [checkpoints, setCheckpoints] = useState<{ id: number; path: string; content: string; ts: number }[]>([]);
  const [cpOpen, setCpOpen] = useState(false);
  const [staged, setStaged] = useState<{ path: string; code: string } | null>(null);
  const [termLines, setTermLines] = useState<string[]>(["ONE SYSTEM terminal â€” root-fenced. Streaming sessions: long tasks stay live."]);
  const [cmd, setCmd] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [sessionCwd, setSessionCwd] = useState<string>(REPO);
  const [streamSid, setStreamSid] = useState<string | null>(null);
  const [problems, setProblems] = useState<{ errors: number; warnings: number; list: any[] }>({ errors: 0, warnings: 0, list: [] });
  const [previewMode, setPreviewMode] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [tasks, setTasks] = useState<{ id: string; agentId: string; started: number }[]>([]);
  const [workers, setWorkers] = useState<AcpAgent[]>([]);
  const [paletteOn, setPaletteOn] = useState(false);
  const [paletteQ, setPaletteQ] = useState("");
  const [quickOpenOn, setQuickOpenOn] = useState(false);
  const [quickOpenQ, setQuickOpenQ] = useState("");
  const [zenMode, setZenMode] = useState(false);
  const [keybindingsOn, setKeybindingsOn] = useState(false);
  const [bookmarks, setBookmarks] = useState<Record<string, number[]>>({});
  const [usePty, setUsePty] = useState(true);
  const [useDock, setUseDock] = useState<boolean>(() => (localStorage.getItem("forge_dock") ?? "dock") === "dock");
  const toggleDock = () => setUseDock((v) => { localStorage.setItem("forge_dock", v ? "classic" : "dock"); return !v; });

  // ── Resizable IDE card (user controls how big the child card is) ──
  const [cardH, setCardH] = useState<number>(() => {
    const saved = Number(localStorage.getItem("forge_card_h"));
    return saved > 320 ? saved : Math.round(window.innerHeight * 0.8);
  });
  const dockApiRef = useRef<any>(null);
  const ideWrapRef = useRef<HTMLDivElement | null>(null);
  // Fill the available workspace on first load (keeps the resize handle on-screen),
  // but honor a previously saved custom size.
  useLayoutEffect(() => {
    const saved = Number(localStorage.getItem("forge_card_h"));
    const top = ideWrapRef.current?.getBoundingClientRect().top ?? 0;
    const maxH = Math.max(360, window.innerHeight - top - 10);
    if (saved > 320 && ideWrapRef.current) {
      setCardH(Math.min(saved, maxH));
    } else if (ideWrapRef.current) {
      setCardH(Math.max(360, Math.min(ideWrapRef.current.clientHeight - 4, maxH)));
    }
  }, []);
  const startCardResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = cardH;
    const onMove = (ev: MouseEvent) => {
      const top = ideWrapRef.current?.getBoundingClientRect().top ?? 0;
      const maxH = Math.max(360, window.innerHeight - top - 10);
      const nh = Math.max(360, Math.min(maxH, startH + (ev.clientY - startY)));
      setCardH(nh);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      localStorage.setItem("forge_card_h", String(cardH));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const addPanel = (kind: "explorer" | "editor" | "terminal") => {
    const api = dockApiRef.current;
    if (!api) return;
    if (kind !== "terminal" && api.getPanel(kind)) return;
    const id = kind === "terminal" ? `terminal-${Date.now()}` : kind;
    try {
      const existingTerm = api.panels.find((p: any) => p.id.startsWith("terminal"));
      api.addPanel({
        id,
        component: kind,
        title: kind === "terminal" ? "Terminal" : kind[0].toUpperCase() + kind.slice(1),
        position:
          kind === "terminal"
            ? existingTerm
              ? { referencePanel: existingTerm.id, direction: "within" }
              : { referencePanel: "editor", direction: "below" }
            : kind === "explorer"
            ? { direction: "left" }
            : { referencePanel: "explorer", direction: "right" },
      });
    } catch {}
  };
  const [fleetOn, setFleetOn] = useState(false);
  const termRef = useRef<HTMLDivElement | null>(null);
  const edRef = useRef<any>(null);
  const lspRef = useRef<MonacoLspAdapter | null>(null);
  const decRef = useRef<any[]>([]);
  const active = openFiles.find((f) => f.path === activePath);

  const flattenTree = (nodes: TreeNode[], parent = ""): string[] => {
    let res: string[] = [];
    for (const n of nodes) {
      const p = parent ? `${parent}\\${n.name}` : n.name;
      if (n.children) res = res.concat(flattenTree(n.children, p));
      else res.push(p);
    }
    return res;
  };

  useEffect(() => { localStorage.setItem("forge_tabs", JSON.stringify(openFiles.slice(0, 12))); }, [openFiles]);
  useEffect(() => { localStorage.setItem("forge_active", activePath); }, [activePath]);
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [termLines]);

  const scan = (dir = rootDir) =>
    fetch(`/api/ide/tree?dir=${encodeURIComponent(dir)}&depth=2`).then((r) => r.json()).then((j) => { if (j.tree) { setTree(j.tree); setRootDir(dir); } }).catch(() => {});

  const loadGit = () => Promise.all([
    fetch("/api/ide/git?cmd=status").then((r) => r.json()).catch(() => null),
    fetch("/api/ide/git?cmd=log").then((r) => r.json()).catch(() => null),
  ]).then(([s, l]) => setGitOut({ status: s?.out ?? "", log: l?.out ?? "" })).then(loadMerge);

  // â”€â”€â”€ GITLENS UI (Movement IV): hunk staging + commit graph â”€â”€â”€
  const dirtyFiles: Array<{ path: string; code: string; untracked: boolean }> = (gitOut.status || "")
    .split(/\r?\n/).filter((l) => l.trim().length > 3).map((l) => {
      const code = l.slice(0, 2);
      let p = l.slice(3).trim();
      if (p.includes(" -> ")) p = p.split(" -> ").pop() || p;
      return { code, path: p, untracked: code.trim() === "?" };
    });
  const openHunks = async (file: string) => {
    const j = await fetch(`/api/ide/git/diff?file=${encodeURIComponent(file)}`).then((r) => r.json()).catch(() => null);
    if (j?.success) setHunkDiff({ file: j.file, unstaged: j.unstaged || [], staged: j.staged || [] });
  };
  const stageHunk = async (side: "unstaged" | "staged", index: number) => {
    if (!hunkDiff) return;
    const j = await fetch("/api/ide/git/hunk-stage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: hunkDiff.file, side, index }) }).then((r) => r.json()).catch(() => null);
    if (j?.success && j.diff) setHunkDiff({ file: j.diff.file, unstaged: j.diff.unstaged || [], staged: j.diff.staged || [] });
    loadGit();
  };
  const loadGraph = async () => {
    const j = await fetch("/api/ide/git/graph?limit=40").then((r) => r.json()).catch(() => null);
    if (j?.success) setGraphData(j.commits || []);
  };
  const loadMerge = async () => {
    const j = await fetch("/api/ide/git/merge-status").then((r) => r.json()).catch(() => null);
    setMergeInfo({ merging: !!j?.merging, conflicts: j?.conflicts || [], incomingBranch: j?.incomingBranch || null });
  };
  const pickConflict = async (file: string) => {
    const j = await fetch(`/api/ide/git/conflict?file=${encodeURIComponent(file)}`).then((r) => r.json()).catch(() => null);
    if (j?.success) { setCfFile(file); setCfRegions(j.regions || []); setCfChoices(new Array((j.regions || []).filter((r: ConflictRegion) => r.kind === "conflict").length).fill("both")); }
  };
  const resolveConflict = async (mode: "ours" | "theirs" | "manual") => {
    if (!cfFile) return;
    const body: Record<string, unknown> = { file: cfFile, mode };
    if (mode === "manual") { body.regions = cfRegions; body.choices = cfChoices; }
    const r = await fetch("/api/ide/git/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);
    pushTerm(r?.success ? `\u001b[32mâœ“ resolved ${cfFile} (${mode})\u001b[0m` : `\u001b[31mâœ— ${r?.error || "resolve failed"}\u001b[0m`);
    setCfFile(null); setCfRegions([]); loadMerge(); loadGit();
  };
  const smartMergeConflict = async () => {
    if (!cfFile) return;
    const r = await fetch("/api/ide/git/smart-merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: cfFile }) }).then((x) => x.json()).catch(() => null);
    if (r?.ok && typeof r.content === "string") {
      // Feed the smart result back as manual content with markers intact for editing
      const re = await fetch("/api/ide/git/conflict", { method: "POST" }).catch(() => null);
      void re;
      pushTerm(`\u001b[36mâ‡„ smart merge: ${r.remainingConflicts ?? "?"} marker(s) remain â€” edit then Save&Resolve\u001b[0m`);
      openFileAt(cfFile);
    } else pushTerm(`\u001b[31mâœ— smart merge: ${r?.error || "failed"}\u001b[0m`);
  };
  const abortMerge = async () => {
    await fetch("/api/ide/git/merge-abort", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    pushTerm("\u001b[33mâ†© merge aborted\u001b[0m"); setCfFile(null); setCfRegions([]); loadMerge(); loadGit();
  };

  useEffect(() => {
    scan();
    fetch("/api/omni/acp/agents").then((r) => r.json()).then((j) => j.agents && setWorkers(j.agents)).catch(() => {});
    loadGit();
  }, []);

  // â”€â”€â”€ LIVE FILE WATCHER (Movement I finish) â”€â”€â”€
  // Server chokidar events â†’ debounced tree refresh; external edits to the
  // active file auto-reload unless the buffer has unsaved local changes.
  const liveRef = useRef({ rootDir, activePath });
  liveRef.current = { rootDir, activePath };
  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let refreshTimer: number | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => scan(liveRef.current.rootDir), 800);
    };
    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/ide/ws/watcher`);
      } catch { window.setTimeout(connect, 4000); return; }
      ws.onmessage = (ev) => {
        let m: { type: string; path: string };
        try { m = JSON.parse(ev.data); } catch { return; }
        if (m.type === "ready") { pushTerm("\u001b[90mâŸ³ live file watcher armed\u001b[0m"); return; }
        if (["add", "unlink", "addDir", "unlinkDir"].includes(m.type)) scheduleRefresh();
        const ap = liveRef.current.activePath;
        if (!ap || !String(m.path).replace(/\//g, "\\").toLowerCase().endsWith(ap.toLowerCase())) return;
        if (m.type === "change") {
          setOpenFiles((prev) => {
            const f = prev.find((x) => x.path === ap);
            if (!f || f.dirty) return prev;
            fetch(`/api/ide/file?path=${encodeURIComponent(ap)}`).then((r) => r.json()).then((j) => {
              if (j?.content !== undefined) setOpenFiles((p2) => p2.map((x) => (x.path === ap ? { ...x, content: j.content } : x)));
            }).catch(() => {});
            return prev;
          });
        } else if (m.type === "unlink") {
          pushTerm(`\u001b[33mâš  ${ap} was deleted outside the editor\u001b[0m`);
        }
      };
      ws.onclose = () => { if (!closed) window.setTimeout(connect, 3000); };
      ws.onerror = () => {};
    };
    connect();
    return () => { closed = true; if (refreshTimer) window.clearTimeout(refreshTimer); ws?.close(); };
  }, []);

  // ── GHOST CURSOR — Family hands visible in the IDE (Porsche hood off)
  const [ghost, setGhost] = useState<{ actor: string; path: string; line: number; tool?: string; ts: number } | null>(null);
  const ghostDecorRef = useRef<string[]>([]);
  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let fadeTimer: number | undefined;
    const connect = () => {
      if (closed) return;
      try { ws = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/being/ws`); } catch { setTimeout(connect, 4000); return; }
      ws.onmessage = (ev) => {
        try {
          const f = JSON.parse(ev.data);
          if (f.type !== "ide.cursor" && f.type !== "ide.edit") return;
          const d = f.data || {};
          const actor = String(d.actor || f.source || "gsk");
          const path = String(d.path || "");
          const tool = String(d.tool || d.action || "");
          const line = Number(d.line || 1);
          setGhost({ actor, path, line, tool, ts: f.ts || Date.now() });
          if (fadeTimer) window.clearTimeout(fadeTimer);
          fadeTimer = window.setTimeout(() => setGhost(null), 8000) as unknown as number;
        } catch {}
      };
      ws.onclose = () => { if (!closed) setTimeout(connect, 3000); };
      ws.onerror = () => {};
    };
    connect();
    return () => { closed = true; if (fadeTimer) window.clearTimeout(fadeTimer); ws?.close(); };
  }, []);
  // Apply Monaco ghost line decoration when ghost matches active file
  useEffect(() => {
    if (!edRef.current || !ghost || !activePath) return;
    const mon = (window as any).monaco;
    if (!mon) return;
    const norm = (p: string) => p.replace(/\//g, "\\").toLowerCase();
    if (ghost.path && !norm(activePath).endsWith(norm(ghost.path).split("\\").pop() || "")) return;
    const line = Math.max(1, ghost.line || 1);
    ghostDecorRef.current = edRef.current.deltaDecorations(ghostDecorRef.current, [
      { range: new mon.Range(line, 1, line, 1), options: { isWholeLine: true, className: ghost.actor === "gsk" ? "ghost-gsk-line" : ghost.actor === "profit" ? "ghost-profit-line" : "ghost-seshat-line", glyphMarginClassName: "ghost-glyph", overviewRuler: { color: ghost.actor === "gsk" ? "#F59E0B" : ghost.actor === "profit" ? "#ec4899" : "#8B5CF6", position: 4 } } },
    ]);
  }, [ghost, activePath]);

  const toggleBookmark = () => {
    if (!edRef.current || !activePath) return;
    const pos = edRef.current.getPosition();
    if (!pos) return;
    const line = pos.lineNumber;
    setBookmarks((prev) => {
      const list = prev[activePath] || [];
      const updated = list.includes(line) ? list.filter((l) => l !== line) : [...list, line].sort((a, b) => a - b);
      return { ...prev, [activePath]: updated };
    });
  };

  const jumpNextBookmark = () => {
    if (!edRef.current || !activePath) return;
    const list = bookmarks[activePath] || [];
    if (list.length === 0) return;
    const pos = edRef.current.getPosition();
    const cur = pos ? pos.lineNumber : 0;
    const next = list.find((l) => l > cur) || list[0];
    edRef.current.revealLineInCenter(next);
    edRef.current.setPosition({ lineNumber: next, column: 1 });
  };

  const renameSymbol = () => {
    if (!edRef.current || !active) return;
    const word = edRef.current.getModel()?.getWordAtPosition(edRef.current.getPosition());
    if (!word) return;
    const newName = window.prompt(`Rename symbol '${word.word}' to:`, word.word);
    if (!newName || newName === word.word) return;
    const re = new RegExp(`\\b${word.word}\\b`, "g");
    const newContent = active.content.replace(re, newName);
    setOpenFiles((prev) => prev.map((f) => f.path === active.path ? { ...f, content: newContent, dirty: true } : f));
    pushTerm(`\u001b[32mâœ“ renamed '${word.word}' â†’ '${newName}' in active file\u001b[0m`);
  };

  const runCodeLensAction = async (action: "explain" | "refactor" | "fix") => {
    if (!active) return;
    pushTerm(`\u001b[35mâ—ˆ CodeLens (${action})â€¦\u001b[0m`);
    const prompt = action === "explain" 
      ? `Explain the logic and structure of this ${langOf(active.path)} file concisely in bullet points.`
      : action === "refactor"
      ? `Refactor this file for cleaner modular structure and performance. Output ONLY complete refactored file content.`
      : `Find and fix syntax, type, or logic bugs in this code. Output ONLY complete fixed file content.`;
    
    const j = await fetch("/api/gsk/think", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: `${prompt}\nPATH: ${active.path}\nCONTENT:\n${active.content.slice(0, 24000)}`, context: `[CODELENS ${action.toUpperCase()}]` })
    }).then((r) => r.json()).catch(() => null);

    const out = String(j?.response || "");
    if (action === "explain") {
      pushTerm(`\u001b[36m[GSK CodeLens Explanation]\u001b[0m\n${out}`);
    } else if (out.length > 20) {
      setStaged({ path: active.path, code: out });
      pushTerm(`\u001b[32mâœ“ CodeLens generated refactored code â€” review shadow diff\u001b[0m`);
    }
  };

  // â”€â”€ command palette â”€â”€
  const actions = [
    { id: "quickopen", label: "File: Quick Open (Ctrl+P)", run: () => setQuickOpenOn(true) },
    { id: "zen_toggle", label: "View: Toggle Zen Focus Mode", run: () => setZenMode((v) => !v) },
    { id: "dock_toggle", label: "View: Toggle Dockview Layout", run: () => setUseDock((v) => !v) },
    { id: "keybindings", label: "Preferences: Open Keyboard Shortcuts", run: () => setKeybindingsOn(true) },
    { id: "root_switch", label: "Workspace: Change Root Directoryâ€¦", run: () => { const newR = window.prompt("Workspace root path:", rootDir); if (newR) scan(newR); } },
    { id: "diff_toggle", label: "View: Toggle Split Diff Mode", run: () => setDiffMode((v) => !v) },
    { id: "preview_toggle", label: "View: Toggle Embedded Live App Preview", run: () => setPreviewMode((v) => !v) },
    { id: "rename_symbol", label: "Symbol: Rename (Shift+F2)", run: renameSymbol },
    { id: "lens_explain", label: "CodeLens: Explain File", run: () => runCodeLensAction("explain") },
    { id: "lens_refactor", label: "CodeLens: Refactor File", run: () => runCodeLensAction("refactor") },
    { id: "lens_fix", label: "CodeLens: Fix Errors", run: () => runCodeLensAction("fix") },
    { id: "bookmark_toggle", label: "Bookmark: Toggle (Ctrl+F2)", run: toggleBookmark },
    { id: "bookmark_next", label: "Bookmark: Next (F2)", run: jumpNextBookmark },
    { id: "save", label: "File: Save", run: () => saveActive() },
    { id: "compose", label: "GSK: Compose (Ctrl+K)", run: () => active && setComposerOn(true) },
    { id: "tests", label: "Shell: npm test", run: () => { setCmd("npm test"); setTimeout(runCmdRef.current, 30); } },
    { id: "gitstatus", label: "Git: Status", run: () => { setSide("git"); loadGit(); } },
    { id: "gitcommit", label: "Git: Commit Allâ€¦", run: () => { setSide("git"); loadGit(); document.getElementById("forge-commit-input")?.focus(); } },
    { id: "codex", label: "Swarm: Delegate â†’ codex", run: () => delegate("codex") },
    { id: "claude", label: "Swarm: Delegate â†’ claude", run: () => delegate("claude") },
    { id: "aider", label: "Swarm: Delegate â†’ aider", run: () => delegate("aider") },
    { id: "canvas", label: "View: Sovereign Canvas", run: () => window.open("/artifacts/sovereign_canvas.html", "_blank") },
    { id: "newfile", label: "File: Newâ€¦", run: () => createFile() },
    { id: "find", label: "Edit: Find & Replace (Ctrl+F)", run: () => edRef.current?.trigger("keyboard", "actions.find", null) },
    { id: "outline", label: "View: Toggle Outline", run: () => setSide("outline") },
  ];
  const paletteActions = actions.filter((a) => a.label.toLowerCase().includes(paletteQ.toLowerCase()));

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (active) setComposerOn(true); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setPaletteOn((v) => !v); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); setQuickOpenOn((v) => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveActive(); }
      if (e.shiftKey && e.key === "F2") { e.preventDefault(); renameSymbol(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === "F2") { e.preventDefault(); toggleBookmark(); }
      else if (e.key === "F2") { e.preventDefault(); jumpNextBookmark(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f" && edRef.current) { e.preventDefault(); edRef.current.trigger("keyboard", "actions.find", null); }
      if (e.key === "Escape") { setPaletteOn(false); setQuickOpenOn(false); setComposerOn(false); setStaged(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // â”€â”€ inline cursor-style decorations when staged â”€â”€
  useEffect(() => {
    if (!edRef.current || !staged || !active) return;
    const mon = (window as any).monaco;
    if (!mon) return;
    const marks = lineDiff(active.original, staged.code).reduce<{ start: number }[]>((acc, d) => {
      const last = acc[acc.length - 1];
      const ln = last ? last.start + 1 : 1;
      if (d.type === "del") acc.push({ start: ln });
      return acc;
    }, []);
    decRef.current = edRef.current.deltaDecorations(decRef.current, marks.map((m) => ({
      range: new mon.Range(m.start, 1, m.start, 1),
      options: { isWholeLine: true, className: "forge-del-line", linesDecorationsClassName: "forge-del-gutter" },
    })));
  }, [staged]);

  // â”€â”€ file ops â”€â”€
  const openFileAt = async (p: string, line?: number) => {
    let f = openFiles.find((x) => x.path === p);
    if (!f) {
      const j = await fetch(`/api/ide/file?path=${encodeURIComponent(p)}`).then((r) => r.json()).catch(() => null);
      if (!j?.success) return setTermLines((t) => [...t, `\u001b[31mâœ— ${j?.error || "open failed"}\u001b[0m`]);
      f = { path: p, content: j.content, original: j.content, dirty: false };
      setOpenFiles((prev) => [...prev.slice(-11), f!]);
    }
    setActivePath(p);
    if (f) lspRef.current?.openDocument(f.path, f.content, langOf(f.path));
    if (line && edRef.current) setTimeout(() => { edRef.current.revealLineInCenter(line); edRef.current.setPosition({ lineNumber: line, column: 1 }); }, 250);
  };

  const createFile = async () => {
    const name = window.prompt("New file name:");
    if (!name) return;
    const j = await fetch("/api/ide/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: `${rootDir}\\${name}`, content: "" }) }).then((r) => r.json());
    if (j.success) { scan(); openFileAt(j.path); } else pushTerm(`\u001b[31mâœ— ${j.error}\u001b[0m`);
  };

  const deleteNode = async (p: string) => {
    if (!window.confirm(`Delete ${p}?`)) return;
    const j = await fetch(`/api/ide/file?path=${encodeURIComponent(p)}`, { method: "DELETE" }).then((r) => r.json());
    if (j.success) { setOpenFiles((prev) => prev.filter((f) => !f.path.startsWith(p))); scan(); loadGit(); }
    else pushTerm(`\u001b[31mâœ— ${j.error}\u001b[0m`);
  };

  const pushTerm = (s: string) => setTermLines((t) => [...t, s]);

  const saveActive = async (content?: string) => {
    const path = staged?.path || active?.path;
    if (!path) return;
    const body = content ?? staged?.code ?? active!.content;
    const j = await fetch("/api/ide/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, content: body }) }).then((r) => r.json());
    pushTerm(j.success ? `\u001b[32mâœ“ saved ${path.split("\\").pop()} (${j.bytes}b)\u001b[0m` : `\u001b[31mâœ— ${j.error}\u001b[0m`);
    if (j.success) { setOpenFiles((prev) => prev.map((f) => f.path === path ? { ...f, content: body, original: body, dirty: false } : f)); setStaged(null); setComposerOn(false); loadGit(); }
  };

  const gitCommit = async () => {
    if (!commitMsg.trim()) return;
    const j = await fetch("/api/ide/git", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: commitMsg }) }).then((r) => r.json());
    pushTerm(j.success ? `\u001b[32mâœ“ committed\u001b[0m` : `\u001b[31mâœ— ${j.out}\u001b[0m`);
    setCommitMsg(""); loadGit();
  };

  const loadBlame = async () => {
    if (!activePath) return;
    const rel = activePath.replace(REPO + "\\", "").replace(REPO + "/", "");
    const j = await fetch(`/api/ide/git?cmd=blame&file=${encodeURIComponent(rel)}`).then((r) => r.json()).catch(() => null);
    setBlameText(j?.out || "no blame data");
  };

  const doReplaceAll = async () => {
    if (!searchQ || !replaceQ || hits.length === 0) return;
    if (!window.confirm(`Replace all occurrences of '${searchQ}' with '${replaceQ}' across ${hits.length} matches?`)) return;
    const paths = Array.from(new Set(hits.map((h) => h.path)));
    let count = 0;
    for (const p of paths) {
      const fRes = await fetch(`/api/ide/file?path=${encodeURIComponent(p)}`).then((r) => r.json()).catch(() => null);
      if (fRes?.success && fRes.content) {
        const updated = fRes.content.replace(new RegExp(searchQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), replaceQ);
        await fetch("/api/ide/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: p, content: updated }) });
        count++;
      }
    }
    pushTerm(`\u001b[32mâœ“ global replace complete across ${count} files\u001b[0m`);
    doSearch();
  };

  const doSearch = async () => {
    if (searchQ.length < 2) return;
    setSearching(true);
    const j = await fetch(`/api/ide/search?q=${encodeURIComponent(searchQ)}`).then((r) => r.json()).catch(() => null);
    setHits(j?.results || []); setSearching(false);
  };

  const runComposer = async () => {
    if (!active || !composerPrompt.trim()) return;
    pushTerm(`\u001b[36mâ—ˆ composingâ€¦\u001b[0m`);
    let instruction = composerPrompt.trim();
    let extraCtx = "";
    // CURSOR GRAFT: @codebase retrieval + @file injection
    const cbMatch = instruction.match(/@codebase\s+(.+)$/im);
    if (cbMatch) {
      try {
        const j = await fetch("/api/ide/codebase/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: cbMatch[1].trim(), k: 5 }) }).then((r) => r.json());
        const rs: Array<{ file: string; startLine: number; text: string }> = j?.results || [];
        if (rs.length) {
          const rootPrefix = REPO.replace(/[\\/]+$/, "");
          extraCtx += `\n[CODEBASE RETRIEVAL for "${cbMatch[1].trim()}"]\n` + rs.map((r) => `--- ${r.file.replace(rootPrefix, "")}:${r.startLine} ---\n${String(r.text).slice(0, 900)}`).join("\n");
          pushTerm(`\u001b[90m@codebase â†’ ${rs.length} chunks injected\u001b[0m`);
        } else {
          pushTerm(`\u001b[33mâš  @codebase: no matches for "${cbMatch[1].trim()}"\u001b[0m`);
        }
      } catch { pushTerm("\u001b[31mâœ— codebase retrieval failed\u001b[0m"); }
      instruction = instruction.replace(cbMatch[0], "").trim();
    }
    for (const fm of [...instruction.matchAll(/@file:(\S+)/gi)]) {
      try {
        const j = await fetch(`/api/ide/file?path=${encodeURIComponent(fm[1])}`).then((r) => r.json());
        if (j?.content) { extraCtx += `\n[@file:${fm[1]}]\n${String(j.content).slice(0, 8000)}`; pushTerm(`\u001b[90m@file:${fm[1]} injected\u001b[0m`); }
      } catch { /* skip missing file */ }
    }
    instruction = instruction.replace(/@file:\S+/gi, "").trim();
    const j = await fetch("/api/gsk/think", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      prompt: `Rewrite this ${langOf(active.path)} file per instruction. Output ONLY complete new file content.\nINSTRUCTION: ${instruction}${extraCtx}\nPATH: ${active.path}\nCONTENT:\n${active.content.slice(0, 24000)}`,
      context: "[FORGE COMPOSER]" }) }).then((r) => r.json()).catch(() => null);
    const out = String(j?.response || "");
    if (out.length > 20) setStaged({ path: active.path, code: out });
    else pushTerm("\u001b[31mâœ— composer silent\u001b[0m");
  };

  const runCmd = async () => {
    if (!cmd.trim() || running) return;
    setRunning(true); setHistory((h) => [...h, cmd]); setHistIdx(-1);
    pushTerm(`C:\\WB> ${cmd}`);
    const c = cmd; setCmd("");
    try {
      const s = await fetch("/api/ide/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: c, cwd: sessionCwd }) }).then((r) => r.json());
      if (!s.sid) { pushTerm(`\u001b[31mâœ— ${s.error}\u001b[0m`); setRunning(false); return; }
      setStreamSid(s.sid);
      let after = 0;
      const poll = window.setInterval(async () => {
        const j = await fetch(`/api/ide/session/${s.sid}?after=${after}`).then((r) => r.json()).catch(() => null);
        if (!j?.success) { window.clearInterval(poll); setRunning(false); return; }
        after = j.total;
        if (j.lines.length) setTermLines((t) => [...t, ...j.lines.map(ansiToHtml)]);
        setSessionCwd(j.cwd);
        if (j.done) {
          window.clearInterval(poll);
          setTermLines((t) => [...t, `\u001b[90m[exit ${j.code}]\u001b[0m`]);
          setRunning(false);
        }
      }, 350);
    } catch (e: any) { pushTerm(`\u001b[31mâœ— ${e.message}\u001b[0m`); setRunning(false); }
  };
  const runCmdRef = useRef(runCmd); runCmdRef.current = runCmd;

  const termKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") runCmd();
    else if (e.key === "ArrowUp") { e.preventDefault(); if (history.length) { const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1); setHistIdx(i); setCmd(history[i]); } }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (histIdx >= 0) { const i2 = histIdx + 1; if (i2 >= history.length) { setHistIdx(-1); setCmd(""); } else { setHistIdx(i2); setCmd(history[i2]); } } }
  };

  const delegate = async (agentId: string) => {
    if (!active) return pushTerm("\u001b[33mâš  open a file first\u001b[0m");
    setRunning(true);
    const taskId = `${agentId}-${Date.now().toString(36)}`;
    setTasks((t) => [...t, { id: taskId, agentId, started: Date.now() }]);
    pushTerm(`\u001b[35mâ†’ swarm: ${agentId}â€¦\u001b[0m`);
    try {
      const j = await fetch("/api/omni/acp/agents/dispatch", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, prompt: composerPrompt.trim() || `Improve this file. Output complete improved file only.`, context: { activeFilePath: active.path, fullFileContent: active.content.slice(0, 16000) }, executionParams: { autoApplyDiff: false } }) }).then((r) => r.json());
      if (j.success && j.result) { setStaged({ path: active.path, code: String(j.result) }); pushTerm(`\u001b[32mâœ“ ${agentId} staged ${String(j.result).length}b â€” review shadow diff\u001b[0m`); }
      else pushTerm(`\u001b[31mâœ— ${agentId}: ${j.error || "empty"}\u001b[0m`);
    } catch (e: any) { pushTerm(`\u001b[31mâœ— ${e.message}\u001b[0m`); }
    setTasks((t) => t.filter((x) => x.id !== taskId));
    setRunning(false);
  };

  const closeTab = (p: string) => {
    lspRef.current?.closeDocument(p);
    setOpenFiles((prev) => prev.filter((f) => f.path !== p));
    if (activePath === p) setActivePath(openFiles.find((f) => f.path !== p)?.path || "");
  };

  const renderNode = (n: TreeNode, depth = 1, parent?: string): React.ReactNode => {
    const p = parent ? `${parent}\\${n.name}` : n.name;
    if (n.children === undefined)
      return (
        <div key={p} onClick={() => openFileAt(p)} className="group flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer hover:bg-slate-800/50 text-xs font-mono" style={{ paddingLeft: depth * 8 }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor(n.name) }} />
          <span className={`truncate ${openFiles.find((f) => f.path === p)?.dirty ? "text-yellow-300 italic" : "text-slate-300"}`}>{n.name}</span>
          <button onClick={(e) => { e.stopPropagation(); deleteNode(p); }} className="ml-auto opacity-0 group-hover:opacity-100 text-red-400"><Trash2 className="w-3 h-3" /></button>
        </div>
      );
    return <DirNode key={p} node={n} p={p} depth={depth} onOpen={openFileAt} onDelete={deleteNode} />;
  };

  const crumbs = activePath.replace(REPO, "").split("\\").filter(Boolean);

  return (
    useDock ? (
      <div ref={ideWrapRef} className="flex-1 min-h-0 flex flex-col">
        <div
          className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl relative overflow-hidden text-slate-100 flex flex-col"
          style={{ height: cardH + "px" }}
        >
          {/* IDE toolbar: panel controls + terminal management */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border-b border-slate-800/70 shrink-0">
            <TerminalSquare className="w-4 h-4" style={{ color: accentColor }} />
            <span className="text-xs font-display font-bold text-white">Forge IDE</span>
            <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">drag bottom edge to resize · panels are closable via their ×</span>
            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={() => addPanel("explorer")} className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors">＋ Explorer</button>
              <button onClick={() => addPanel("editor")} className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors">＋ Editor</button>
              <button onClick={() => addPanel("terminal")} className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500/25 transition-colors">＋ Terminal</button>
            </div>
          </div>
          <div className="relative flex-1 min-h-0">
            <ForgeDockLayout rootDir={rootDir} dockApiRef={dockApiRef} />
          </div>
        </div>
        {/* resize handle */}
        <div
          onMouseDown={startCardResize}
          className="h-2 cursor-row-resize bg-slate-800/60 hover:bg-cyan-500/50 transition-colors shrink-0 rounded-b"
          title="Drag to resize the IDE card"
        />
      </div>
    ) : (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-3 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full gap-2"
      onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveActive(); } }}>
      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl">
        <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
          <TerminalSquare className="w-5 h-5" style={{ color: accentColor }} /> Forge IDE
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">âŒ˜K compose Â· âŒ˜P palette Â· âŒ˜S save</span>
        </h2>
        {/* MISSION STRIP */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            {tasks.map((t) => (
              <span key={t.id} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> {t.agentId} Â· {Math.round((Date.now() - t.started) / 1000)}s
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={() => setZenMode((v) => !v)} className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${zenMode ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"}`}>{zenMode ? "Exit Zen Mode" : "Zen Focus"}</button>
          <button onClick={toggleDock} className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${useDock ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"}`}>{useDock ? "Classic View" : "Dock View"}</button>
          <button onClick={() => setFleetOn(true)} className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20">Orca Fleet</button>
          <Users className="w-3.5 h-3.5 text-slate-500 ml-1" />
          {["codex", "claude", "aider", "auto"].map((w) => (
            <button key={w} onClick={() => delegate(w)} disabled={running} className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors disabled:opacity-40 ${w === "auto" ? "bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20" : "bg-purple-500/10 border-purple-500/25 text-purple-300 hover:bg-purple-500/20"}`}>{w}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-2 min-h-0">
        {/* ACTIVITY BAR */}
        {!zenMode && (
          <div className="flex flex-col gap-1 bg-slate-950/60 border border-slate-800/60 rounded-xl p-1">
            {([["explorer", FolderTree], ["search", SearchIcon], ["git", GitBranch], ["outline", ListTree]] as [SidePanel, any][]).map(([id, Icon]) => (
              <button key={id} onClick={() => setSide(id)} className={`p-2 rounded-lg transition-colors ${side === id ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}><Icon className="w-4 h-4" /></button>
            ))}
            <button onClick={() => setPaletteOn(true)} title="Ctrl+Shift+P" className="p-2 rounded-lg text-slate-500 hover:text-slate-300 mt-auto"><Command className="w-4 h-4" /></button>
          </div>
        )}

        {/* SIDE PANEL */}
        {!zenMode && (
          <div className="w-56 bg-slate-950/50 border border-slate-800/60 rounded-xl p-2 overflow-auto flex flex-col">
          {side === "explorer" && <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-mono uppercase text-slate-500">explorer</p>
              <div className="flex gap-1">
                <button title="new file" onClick={createFile} className="text-slate-500 hover:text-green-400"><FilePlus2 className="w-3 h-3" /></button>
                <button title="rescan" onClick={() => scan()} className="text-slate-500 hover:text-white"><RefreshCw className="w-3 h-3" /></button>
              </div>
            </div>
            {tree.map((n) => <div key={n.name}>{renderNode(n, 1)}</div>)}
          </>}
          {side === "search" && <>
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-1">
                <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="search workspaceâ€¦" className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-500/40" />
                <button onClick={doSearch} className="p-1 rounded bg-slate-900 border border-slate-700 text-cyan-400"><SearchIcon className="w-3 h-3" /></button>
              </div>
              <div className="flex items-center gap-1">
                <input value={replaceQ} onChange={(e) => setReplaceQ(e.target.value)} placeholder="replace withâ€¦" className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-orange-500/40" />
                <button onClick={doReplaceAll} disabled={!searchQ || !replaceQ || hits.length === 0} className="px-2 py-1 rounded bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-bold disabled:opacity-40">Replace All</button>
              </div>
            </div>
            {searching && <p className="text-[10px] text-slate-500">scanning repoâ€¦</p>}
            <div className="space-y-1 overflow-y-auto">
              {hits.map((h, i) => (
                <div key={i} onClick={() => openFileAt(h.path, h.line)} className="cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                  <p className="text-[10px] font-mono text-cyan-400 truncate">{h.path.replace(REPO, "")}:{h.line}</p>
                  <p className="text-[10px] text-slate-400 truncate">{h.text}</p>
                </div>
              ))}
              {!searching && hits.length === 0 && searchQ.length >= 2 && <p className="text-[10px] text-slate-600">no matches</p>}
            </div>
          </>}
          {side === "outline" && <>
            <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">symbol outline</p>
            {!active ? (
              <p className="text-[10px] text-slate-600 italic">no file open</p>
            ) : (
              <div className="space-y-1 overflow-y-auto">
                {parseSymbols(active.content).map((sym, i) => (
                  <div key={i} onClick={() => {
                    if (edRef.current) {
                      edRef.current.revealLineInCenter(sym.line);
                      edRef.current.setPosition({ lineNumber: sym.line, column: 1 });
                      edRef.current.focus();
                    }
                  }} className="cursor-pointer px-1.5 py-1 rounded hover:bg-slate-800/60 flex items-center gap-1.5 text-xs font-mono">
                    <span className={`text-[9px] px-1 rounded uppercase font-bold shrink-0 ${
                      sym.kind === "function" ? "bg-purple-500/20 text-purple-300" :
                      sym.kind === "class" ? "bg-amber-500/20 text-amber-300" :
                      sym.kind === "interface" ? "bg-cyan-500/20 text-cyan-300" :
                      sym.kind === "type" ? "bg-blue-500/20 text-blue-300" : "bg-slate-700 text-slate-300"
                    }`}>{sym.kind.slice(0, 3)}</span>
                    <span className="text-slate-200 truncate">{sym.name}</span>
                    <span className="ml-auto text-[9px] text-slate-500 font-mono">:{sym.line}</span>
                  </div>
                ))}
                {parseSymbols(active.content).length === 0 && <p className="text-[10px] text-slate-600">no symbols found</p>}
              </div>
            )}
          </>}
          {side === "git" && <>
            <div className="flex gap-1 mb-1 items-center">
              {[["changes", "Changes"], ["graph", "Graph"]].map(([m, label]) => (
                <button key={m} onClick={() => { setGitMode(m as "changes" | "graph"); if (m === "graph") loadGraph(); }} className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${gitMode === m ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>{label}</button>
              ))}
              <button onClick={loadGit} className="ml-auto text-slate-500 hover:text-white text-[10px] px-1">âŸ³</button>
            </div>
            {gitMode === "graph" ? (
              <GitGraph commits={graphData} />
            ) : (
              <>
                {/* 3-WAY MERGE RESOLVER BANNER */}
                {mergeInfo.merging && (
                  <div className="mb-1 p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/40">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-yellow-300">âš  MERGE{mergeInfo.incomingBranch ? ` â† ${mergeInfo.incomingBranch}` : ""} Â· {mergeInfo.conflicts.length} conflict(s)</span>
                      <button onClick={abortMerge} className="ml-auto px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-300 text-[9px] font-bold">Abort</button>
                    </div>
                    {mergeInfo.conflicts.map((cf) => (
                      <div key={cf.path} onClick={() => pickConflict(cf.path)} className={`mt-1 flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer text-[9px] font-mono ${cfFile === cf.path ? "bg-yellow-500/20 text-white" : "bg-slate-900/60 text-slate-300 hover:bg-slate-800"}`}>
                        <span className="text-yellow-400">{cf.state}</span><span className="truncate">{cf.path}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* DIFF & MERGE THEATER */}
                {cfFile && cfRegions.some((r) => r.kind === "conflict") && (() => {
                  const confs = cfRegions.filter((r) => r.kind === "conflict");
                  const oursText = confs.map((r) => r.ours || "").join("\n");
                  const theirsText = confs.map((r) => r.theirs || "").join("\n");
                  return (
                    <div className="my-1 rounded-lg border border-yellow-500/30 overflow-hidden bg-[#090d16]">
                      {/* STICKY ACTION HEADER */}
                      <div className="sticky top-0 z-10 flex items-center gap-1 px-1.5 py-1 bg-slate-950/95 backdrop-blur border-b border-slate-700">
                        <span className="text-[9px] font-mono text-cyan-400 truncate flex-1" title={cfFile}>âš” {cfFile.split(/[\\/]/).pop()}</span>
                        <button onClick={() => resolveConflict("ours")} className="px-1.5 py-0.5 rounded bg-green-500/25 border border-green-400/50 text-green-200 text-[9px] font-bold hover:bg-green-500/40">Accept Ours</button>
                        <button onClick={() => resolveConflict("theirs")} className="px-1.5 py-0.5 rounded bg-blue-500/25 border border-blue-400/50 text-blue-200 text-[9px] font-bold hover:bg-blue-500/40">Accept Theirs</button>
                        <button onClick={() => resolveConflict("manual")} className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-400/50 text-yellow-200 text-[9px] font-bold hover:bg-yellow-500/35">Accept Both</button>
                        <button onClick={smartMergeConflict} className="px-1.5 py-0.5 rounded bg-purple-500/25 border border-purple-400/50 text-purple-200 text-[9px] font-bold hover:bg-purple-500/40">âš¡ Fuse</button>
                      </div>
                      {/* MONACO DIFF: left=incoming(theirs) right=current(ours) */}
                      <div className="h-44">
                        <DiffEditor
                          height="100%"
                          theme={FORGE_MONACO_THEME}
                          beforeMount={(mon) => defineForgeTheme(mon as any)}
                          original={theirsText}
                          modified={oursText}
                          language={langOf(cfFile)}
                          options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false }, fontSize: 10, lineNumbers: "off", scrollBeyondLastLine: false, automaticLayout: true, renderOverviewRuler: false, diffWordWrap: "on" }}
                          loading={<div className="flex items-center justify-center h-full text-[10px] text-slate-600">mounting theaterâ€¦</div>}
                        />
                      </div>
                      {/* PER-HUNK CHOICES (drives manual reconstruction on Save & Resolve) */}
                      <div className="p-1 space-y-1 max-h-36 overflow-y-auto">
                        {(() => {
                          let idx = -1;
                          return cfRegions.map((r, i) => {
                            if (r.kind !== "conflict") return null;
                            idx++;
                            const myIdx = idx;
                            const choice = cfChoices[myIdx];
                            return (
                              <div key={i} className="flex items-center gap-1 px-1 py-0.5 rounded bg-slate-900/80 border" style={{ borderColor: choice === "ours" ? "#4ade8055" : choice === "theirs" ? "#60a5fa55" : "#fbbf2433" }}>
                                <span className="text-[8px] font-mono text-slate-500 shrink-0">hunk{myIdx + 1}</span>
                                <span className="text-[8px] font-mono truncate flex-1 text-slate-400">{(choice === "ours" ? r.ours : choice === "theirs" ? r.theirs : `ours+theirs (${(r.ours || "").split("\n").length}+${(r.theirs || "").split("\n").length} ln)`).slice(0, 55)}</span>
                                {(["ours", "theirs", "both"] as const).map((v) => (
                                  <button key={v} onClick={() => setCfChoices((prev) => prev.map((c, j2) => (j2 === myIdx ? v : c)))} className={`px-1 py-0.5 rounded text-[8px] font-bold ${choice === v ? "bg-cyan-500/25 text-cyan-200" : "bg-slate-800 text-slate-500 hover:text-white"}`}>{v}</button>
                                ))}
                              </div>
                            );
                          });
                        })()}
                        <p className="text-[8px] font-mono text-slate-600">Save &amp; Resolve applies hunk choices Â· Accept buttons take whole-file sides Â· âš¡Fuse runs git merge-file</p>
                      </div>
                    </div>
                  );
                })()}
                {mergeInfo.merging && mergeInfo.conflicts.length === 0 && (
                  <input id="forge-merge-commit" placeholder="merge commit messageâ€¦" onBlur={(e) => { const m = e.target.value; if (m.trim()) fetch("/api/ide/git/merge-continue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: m }) }).then(() => { loadMerge(); loadGit(); }); }} className="my-1 w-full bg-slate-900 border border-yellow-600/40 rounded px-2 py-1 text-[11px] focus:outline-none" />
                )}
                {/* dirty files */}
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {dirtyFiles.length === 0 && <p className="text-[10px] text-slate-600 font-mono">working tree clean</p>}
                  {dirtyFiles.map((df) => (
                    <div key={df.path} onClick={() => openHunks(df.path)} className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer hover:bg-slate-800/50 text-[10px] font-mono ${hunkDiff?.file === df.path ? "bg-slate-800/70" : ""}`}>
                      <span className={`w-3 shrink-0 ${df.untracked ? "text-slate-500" : "text-amber-300"}`}>{df.code.trim() || "M"}</span>
                      <span className="truncate">{df.path.split(/[\\/]/).pop()}</span>
                    </div>
                  ))}
                </div>
                {/* hunk staging */}
                {hunkDiff && (
                  <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                    <p className="text-[9px] font-mono text-cyan-400 truncate">{hunkDiff.file.split(/[\\/]/).slice(-2).join("/")}</p>
                    {hunkDiff.staged.map((h) => (
                      <div key={"s" + h.index} className="flex items-center gap-1 px-1 py-0.5 rounded bg-green-500/5 border border-green-500/20">
                        <span className="text-[8px] font-mono text-green-300 shrink-0">+{h.adds}âˆ’{h.dels}</span>
                        <span className="text-[8px] font-mono text-slate-500 truncate flex-1">{h.header}</span>
                        <button onClick={() => stageHunk("staged", h.index)} className="px-1 rounded bg-slate-800 text-[8px] font-bold text-red-300 hover:bg-red-500/20 shrink-0">unstage</button>
                      </div>
                    ))}
                    {hunkDiff.unstaged.map((h) => (
                      <div key={"u" + h.index} className="flex items-center gap-1 px-1 py-0.5 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[8px] font-mono text-amber-300 shrink-0">+{h.adds}âˆ’{h.dels}</span>
                        <span className="text-[8px] font-mono text-slate-500 truncate flex-1">{h.header}</span>
                        <button onClick={() => stageHunk("unstaged", h.index)} className="px-1 rounded bg-slate-800 text-[8px] font-bold text-green-300 hover:bg-green-500/20 shrink-0">stage</button>
                      </div>
                    ))}
                    {hunkDiff.staged.length === 0 && hunkDiff.unstaged.length === 0 && <p className="text-[9px] text-slate-600 font-mono">no textual hunks (untracked or binary)</p>}
                  </div>
                )}
                <pre className="mt-1 text-[9px] font-mono text-slate-400 whitespace-pre-wrap max-h-24 overflow-auto bg-black/30 rounded p-1">{gitOut.status || "clean?"}</pre>
                <input id="forge-commit-input" value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="commit messageâ€¦" className="my-1 w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-green-500/40" />
                <button onClick={gitCommit} disabled={!commitMsg.trim()} className="w-full py-1 rounded bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-bold disabled:opacity-40">COMMIT ALL</button>
                <button onClick={loadBlame} className="mt-2 w-full py-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold">LOAD GIT BLAME</button>
                {blameText && <pre className="mt-1 text-[8px] font-mono text-slate-400 whitespace-pre-wrap max-h-24 overflow-auto bg-black/40 p-1 rounded">{blameText}</pre>}
              </>
            )}

            <p className="text-[10px] font-mono uppercase text-slate-500 mt-3 mb-1">npm scripts</p>
            <div className="flex flex-col gap-1">
              {["dev", "build", "type-check", "test", "lint"].map((sc) => (
                <button key={sc} onClick={() => { setCmd(`npm run ${sc}`); setTimeout(runCmdRef.current, 30); }} className="text-left px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center justify-between">
                  <span>npm run {sc}</span>
                  <Play className="w-2.5 h-2.5 text-cyan-400" />
                </button>
              ))}
            </div>
          </>}
        </div>
        )}

        {/* EDITOR COLUMN */}
        <div className={`flex-1 rounded-xl border flex flex-col min-h-0 relative overflow-hidden bg-slate-950/50 ${staged ? "border-yellow-500/40" : "border-slate-800/60"}`}>
          <iframe src="/artifacts/sovereign_canvas.html" title="ambient" className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.10]" />
          {/* tabs + breadcrumbs */}
          <div className="relative z-10 bg-slate-950/85">
            <div className="flex items-center gap-0.5 px-1 pt-1 overflow-x-auto">
              {openFiles.map((f) => (
                <div key={f.path} className={`group flex items-center gap-1 px-2 py-1 rounded-t text-[10px] font-mono cursor-pointer ${f.path === activePath ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`} onClick={() => setActivePath(f.path)}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor(f.path) }} />
                  {f.path.split("\\").pop()}{f.dirty && <span className="text-yellow-300">â€¢</span>}
                  <X className="w-3 h-3 ml-1 opacity-40 group-hover:opacity-100 hover:text-red-400" onClick={(e) => { e.stopPropagation(); closeTab(f.path); }} />
                </div>
              ))}
            </div>
            {active && <div className="px-3 pb-1 text-[9px] font-mono text-slate-600 truncate">{crumbs.join(" â€º ")}</div>}
          </div>
          {/* editor or staged diff or empty */}
          <div className="flex-1 relative z-10">
            {staged ? (
              <div className="absolute inset-0 flex flex-col">
                <div className="px-3 py-1.5 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-yellow-300">SHADOW DIFF â€” {lineDiff(active?.original ?? "", staged.code).filter((d) => d.type !== "same").length} changed lines Â· deletions marked in-place</span>
                  <div className="flex gap-1">
                    <button onClick={() => saveActive(staged.code)} className="px-3 py-1 rounded bg-green-500/20 border border-green-500/40 text-green-300 text-[11px] font-bold">ACCEPT</button>
                    <button onClick={() => { setStaged(null); setComposerOn(false); }} className="px-3 py-1 rounded bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-bold">REJECT</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-2">
                  {lineDiff(active?.original ?? "", staged.code).map((d, i) => (
                    <div key={i} className={`whitespace-pre-wrap ${d.type === "add" ? "bg-green-500/10 text-green-300 border-l-2 border-green-500/50" : d.type === "del" ? "bg-red-500/10 text-red-300 border-l-2 border-red-500/50" : "text-slate-400"}`}>
                      <span className="select-none opacity-50 mr-2">{d.type === "add" ? "+" : d.type === "del" ? "-" : " "}</span>{d.text || " "}
                    </div>
                  ))}
                </div>
              </div>
            ) : active ? (
              <div className="h-full flex flex-col">
                <div className="px-3 py-1 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-purple-400 font-bold">CodeLens:</span>
                  <button onClick={() => runCodeLensAction("explain")} className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20">âš¡ Explain</button>
                  <button onClick={() => runCodeLensAction("refactor")} className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 font-bold">âœ¨ Refactor</button>
                  <button onClick={() => runCodeLensAction("fix")} className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 hover:bg-green-500/20 font-bold">ðŸ›  Fix Errors</button>
                  <button onClick={renameSymbol} className="px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 ml-auto font-bold">Rename Symbol (Shift+F2)</button>
                </div>
                <div className="flex-1 min-h-0">
                  {diffMode ? (
                    <DiffEditor
                      height="100%" language={langOf(active.path)} theme={FORGE_MONACO_THEME}
                      original={active.original} modified={active.content}
                      options={{ renderSideBySide: true, readOnly: false, automaticLayout: true }}
                    />
                  ) : (
                    <Editor
                      height="100%" language={langOf(active.path)} theme={FORGE_MONACO_THEME}
                      value={active.content}
                      beforeMount={(mon) => {
                        (window as any).monaco = mon;
                        if (!mon.languages.getLanguages().some((l: any) => l.id === "gsk-snippets-registered")) {
                          mon.languages.registerCompletionItemProvider("typescript", {
                            provideCompletionItems: (model: any, position: any) => {
                              const word = model.getWordUntilPosition(position);
                              const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
                              return {
                                suggestions: [
                                  { label: "clg", kind: mon.languages.CompletionItemKind.Snippet, insertText: 'console.log("$1", $2);', insertTextRules: mon.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                                  { label: "afunc", kind: mon.languages.CompletionItemKind.Snippet, insertText: 'const ${1:name} = async (${2:args}) => {\n\t$0\n};', insertTextRules: mon.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                                  { label: "trycatch", kind: mon.languages.CompletionItemKind.Snippet, insertText: 'try {\n\t$1\n} catch (e: any) {\n\tconsole.error(e);\n}', insertTextRules: mon.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                                  { label: "fetchapi", kind: mon.languages.CompletionItemKind.Snippet, insertText: 'const res = await fetch("$1").then((r) => r.json());', insertTextRules: mon.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                                ]
                              };
                            }
                          });
                        }
                      }}
                      onMount={(ed, mon) => {
                        edRef.current = ed;
                        (window as any).monaco = mon;
                        const model = ed.getModel();
                        const refresh = () => {
                          if (!model) return;
                          const marks = mon.editor.getModelMarkers({ resource: model.uri });
                          setProblems({
                            errors: marks.filter((m: any) => m.severity === 8).length,
                            warnings: marks.filter((m: any) => m.severity === 4).length,
                            list: marks.slice(0, 20),
                          });
                        };
                        model.onDidChangeContent(() => setTimeout(refresh, 600));
                        refresh();
                        // â”€â”€â”€ LSP â†’ MONACO SQUIGGLES (Movement I completion) â”€â”€â”€
                        try {
                          const adapter = getMonacoLspAdapter(mon as any, REPO);
                          lspRef.current = adapter;
                          if (active) {
                            adapter.openDocument(active.path, active.content, langOf(active.path));
                            ed.onDidChangeModelContent(() => {
                              const cur = openFiles.find((f) => f.path === activePath);
                              if (cur) adapter.changeDocument(cur.path, cur.content);
                            });
                          }
                        } catch { /* LSP optional */ }
                      }}
                      onChange={(v) => setOpenFiles((prev) => prev.map((f) => f.path === active.path ? { ...f, content: v ?? "", dirty: (v ?? "") !== f.original } : f))}
                      options={{ fontSize: 13, fontFamily: "Consolas, monospace", minimap: { enabled: true, scale: 1 }, scrollBeyondLastLine: false, automaticLayout: true, bracketPairColorization: { enabled: true }, smoothScrolling: true, cursorBlinking: "phase", folding: true, stickyScroll: { enabled: true }, multiCursorModifier: "alt" }}
                      loading={<div className="flex items-center justify-center h-full text-xs text-slate-600">summoning monacoâ€¦</div>}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-600">âŒ˜K compose Â· âŒ˜â‡§P palette Â· pick a file to begin</div>
            )}
          </div>
          {/* status bar */}
          <div className="relative z-10 flex items-center gap-3 px-3 py-0.5 bg-slate-950/90 border-t border-slate-800 text-[9px] font-mono text-slate-500">
            <span className={problems.errors ? "text-red-400" : "text-green-500"}>âœ• {problems.errors}</span>
            <span className="text-yellow-400">âš  {problems.warnings}</span>
            {active && (
              <div className="flex gap-2">
                <button onClick={() => setDiffMode((v) => !v)} className={`px-1.5 py-0.5 rounded font-mono ${diffMode ? "bg-cyan-500/20 text-cyan-300 font-bold" : "hover:text-white"}`}>{diffMode ? "Editor View" : "Split Diff"}</button>
                <button onClick={() => setPreviewMode((v) => !v)} className={`px-1.5 py-0.5 rounded font-mono ${previewMode ? "bg-purple-500/20 text-purple-300 font-bold" : "hover:text-white"}`}>{previewMode ? "Hide Preview" : "Live Preview â–¶"}</button>
              </div>
            )}
            <span className="ml-auto truncate max-w-[40%]">{active?.path.replace(REPO, "")}</span>
            <span>{sessionCwd.replace(REPO, "") || "\\"}</span>
          </div>
          {/* preview split */}
          {(previewMode && active) && (
            <div className="relative z-10 h-1/2 border-t border-cyan-500/30">
              {/\.(html|md)$/i.test(active.path) ? (
                /\.(html)$/i.test(active.path)
                  ? <iframe src={`/artifacts/${active.path.split("\\").pop()}`} className="w-full h-full bg-white" title="preview" />
                  : <iframe srcDoc={`<html><body style="font-family:Segoe UI,sans-serif;padding:16px;color:#222"><pre style="white-space:pre-wrap;font-family:inherit">${active.content.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre></body></html>`} className="w-full h-full bg-white" title="md-preview" />
              ) : (
                <div className="p-3 text-xs text-slate-500">Preview supports .html artifacts and .md files.</div>
              )}
            </div>
          )}
          {/* composer overlay */}
          {composerOn && active && (
            <div className="absolute bottom-3 left-3 right-3 z-20 p-2 bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 shrink-0">âŒ˜K</span>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex gap-1 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 text-cyan-300" title="retrieves matching codebase chunks into context">@codebase &lt;query&gt;</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 text-purple-300" title="inlines a file's content into context">@file:&lt;path&gt;</span>
                </div>
                <input autoFocus value={composerPrompt} onChange={(e) => setComposerPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runComposer()} placeholder="describe the changeâ€¦ try: refactor auth using @codebase session validation" className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none" />
              </div>
              <button onClick={runComposer} className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold">Compose</button>
              <button onClick={() => { setComposerOn(false); }} className="text-slate-500 hover:text-white px-1">âœ•</button>
            </div>
          )}
        </div>

        {/* TERMINAL + DOCK */}
        {!zenMode && (
          <div className="w-64 flex flex-col gap-2 min-h-0">
            <div className="flex-1 bg-black/70 border border-slate-800/60 rounded-xl flex flex-col min-h-0">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800">
                <p className="text-[10px] font-mono uppercase text-slate-500">terminal</p>
                <button onClick={() => setUsePty((v) => !v)} className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${usePty ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{usePty ? "PTY Live" : "PTY Live"}</button>
              </div>
              {usePty ? (
                <div className="flex-1 min-h-0"><XtermDrawer /></div>
              ) : (
                <div ref={termRef} className="flex-1 overflow-y-auto px-2 py-1 text-[10px] font-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: termLines.map(ansiToHtml).join("\n") }} />
              )}
              <div className="flex items-center gap-1 p-1 border-t border-slate-800">
                <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={termKey} placeholder="cmdâ€¦" disabled={running} className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-green-300 placeholder-slate-700 focus:outline-none disabled:opacity-50" />
                <button onClick={runCmd} disabled={running || !cmd.trim()} className="p-1 rounded bg-slate-900 border border-slate-700 text-green-400 disabled:opacity-40"><Play className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-2 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> dock ({workers.length})</p>
              <div className="flex flex-wrap gap-1">
                {workers.map((w) => <span key={w.id} title={w.description} className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-purple-500/10 border border-purple-500/25 text-purple-300">{w.id}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* ORCA FLEET MODAL */}
      {fleetOn && (
        <FleetDrawer onClose={() => setFleetOn(false)} onOpen={(p) => { setFleetOn(false); openFileAt(p); }} />
      )}

      {/* KEYBINDINGS MODAL */}
      {keybindingsOn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16" onClick={() => setKeybindingsOn(false)}>
          <div className="w-[540px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-4 text-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <h3 className="text-sm font-bold font-mono text-cyan-400">Keyboard Shortcuts (Forge IDE)</h3>
              <button onClick={() => setKeybindingsOn(false)} className="text-slate-500 hover:text-white">âœ•</button>
            </div>
            <div className="space-y-2 text-xs font-mono max-h-96 overflow-y-auto">
              {[
                ["Ctrl + P", "Quick Open File Picker"],
                ["Ctrl + Shift + P", "Command Palette"],
                ["Ctrl + K", "GSK Inline AI Composer"],
                ["Ctrl + S", "Save Active File"],
                ["Ctrl + F", "Find & Replace in Editor"],
                ["Shift + F2", "Rename Symbol in Active File"],
                ["Ctrl + F2", "Toggle Line Bookmark"],
                ["F2", "Jump to Next Bookmark"],
                ["Alt + Click", "Multi-Cursor Column Selection"],
                ["Escape", "Close Modals / Overlays"],
              ].map(([keys, desc]) => (
                <div key={keys} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">{desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-[10px] font-bold">{keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* COMMAND PALETTE */}
      {paletteOn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24" onClick={() => setPaletteOn(false)}>
          <div className="w-[560px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <input autoFocus value={paletteQ} onChange={(e) => setPaletteQ(e.target.value)} placeholder="type a commandâ€¦" className="w-full px-4 py-3 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none border-b border-slate-800" />
            <div className="max-h-72 overflow-y-auto">
              {paletteActions.map((a) => (
                <div key={a.id} onClick={() => { setPaletteOn(false); a.run(); }} className="px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer">{a.label}</div>
              ))}
              {paletteActions.length === 0 && <div className="px-4 py-3 text-xs text-slate-600">no matching commands</div>}
            </div>
          </div>
        </div>
      )}

      {/* QUICK OPEN (CTRL+P) */}
      {quickOpenOn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20" onClick={() => setQuickOpenOn(false)}>
          <div className="w-[600px] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">Quick Open</span>
              <input autoFocus value={quickOpenQ} onChange={(e) => setQuickOpenQ(e.target.value)} placeholder="search file path (e.g. IdeTab, server)..." className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none" />
            </div>
            <div className="max-h-80 overflow-y-auto p-1 space-y-0.5">
              {flattenTree(tree).filter((p) => p.toLowerCase().includes(quickOpenQ.toLowerCase())).slice(0, 30).map((relPath) => (
                <div key={relPath} onClick={() => { setQuickOpenOn(false); openFileAt(relPath); }} className="px-3 py-2 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 cursor-pointer flex items-center justify-between">
                  <span className="truncate">{relPath}</span>
                  <span className="text-[10px] text-slate-500 font-sans ml-2 shrink-0">{langOf(relPath)}</span>
                </div>
              ))}
              {flattenTree(tree).filter((p) => p.toLowerCase().includes(quickOpenQ.toLowerCase())).length === 0 && (
                <div className="px-4 py-4 text-xs text-slate-500 text-center">no matching files found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    )
  );
};

const DirNode: React.FC<{ node: TreeNode; p: string; depth: number; onOpen: (p: string, line?: number) => void; onDelete: (p: string) => void }> = ({ node, p, depth, onOpen, onDelete }) => {
  const [open, setOpen] = useState(depth <= 1);
  return (
    <div style={{ paddingLeft: (depth - 1) * 6 }}>
      <div className="group flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer hover:bg-slate-800/50 text-xs font-mono text-amber-200/80 select-none" onClick={() => setOpen(!open)}>
        <span>{open ? "â–¾" : "â–¸"}</span><span className="truncate">{node.name}/</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(p); }} className="ml-auto opacity-0 group-hover:opacity-100 text-red-400"><Trash2 className="w-3 h-3" /></button>
      </div>
      {open && node.children?.map((c) =>
        c.type === "dir"
          ? <DirNode key={`${p}\\${c.name}`} node={c} p={`${p}\\${c.name}`} depth={depth + 1} onOpen={onOpen} onDelete={onDelete} />
          : <div key={`${p}\\${c.name}`} onClick={() => onOpen(`${p}\\${c.name}`)} className="group flex items-center gap-1 py-0.5 cursor-pointer hover:bg-slate-800/50 text-xs font-mono text-sky-300" style={{ paddingLeft: depth * 8 + 4 }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor(c.name) }} /><span className="truncate">{c.name}</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(`${p}\\${c.name}`); }} className="ml-auto opacity-0 group-hover:opacity-100 text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
      )}
    </div>
  );
};

