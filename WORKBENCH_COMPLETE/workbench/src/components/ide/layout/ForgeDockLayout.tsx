import React, { useCallback, useEffect, useRef, useState } from "react";
import { DockviewReact, DockviewReadyEvent } from "dockview";
import Editor from "@monaco-editor/react";
import { XtermDrawer } from "../terminal/XtermDrawer";
import "dockview/dist/styles/dockview.css";
import { FORGE_BG, FORGE_MONACO_THEME, defineForgeTheme } from "../../../shared/forgeTheme";
import { loader } from "@monaco-editor/react";
import { getMonacoLspAdapter, subscribeLspDiagnostics, type FlatDiag } from "../../../services/monaco/MonacoLspAdapter";

loader.init().then((mon) => defineForgeTheme(mon as any)).catch(() => {});

/**
 * ForgeDockLayout — THE default spatial workspace (Movement II).
 * Boots the IDE directly into a resizable multi-pane grid whose panes are
 * wired to the real backend: explorer tree -> Monaco -> disk save, live ConPTY
 * terminal, git pulse. Not a demo shell.
 */

const ROOT_FALLBACK = "C:\\Users\\uncom\\Downloads\\Profit Bible Foundation Acknowledged - DeepSeek_files\\WORKBENCH_COMPLETE";

interface TreeNode {
  name: string;
  type: "dir" | "file";
  children?: TreeNode[];
}

const ExplorerPane: React.FC<{ rootDir: string; onOpen: (abs: string) => void }> = ({ rootDir, onOpen }) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const load = useCallback(() => {
    fetch(`/api/ide/tree?dir=${encodeURIComponent(rootDir)}&depth=2`).then((r) => r.json()).then((j) => setTree(j.tree || [])).catch(() => {});
  }, [rootDir]);
  useEffect(() => { load(); }, [load]);

  const render = (nodes: TreeNode[], depth: number): React.ReactNode =>
    nodes.map((n) =>
      n.type === "dir" ? (
        <div key={n.name} style={{ paddingLeft: depth * 8 }}>
          <span className="text-[10px] font-mono text-amber-200/70">▸ {n.name}/</span>
          <div>{render(n.children || [], depth + 1)}</div>
        </div>
      ) : (
        <div
          key={n.name}
          onClick={() => onOpen(`${rootDir}\\${n.name}`)}
          className="cursor-pointer text-[10px] font-mono text-sky-300 hover:text-cyan-200 truncate"
          style={{ paddingLeft: depth * 8 }}
        >
          • {n.name}
        </div>
      )
    );

  return (
    <div className="h-full overflow-auto bg-slate-950/80 p-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono uppercase text-slate-500">explorer</p>
        <button onClick={load} className="text-[9px] text-slate-500 hover:text-white">⟳</button>
      </div>
      {render(tree, 0)}
    </div>
  );
};

const EditorPane: React.FC<{ rootDir: string; bus: React.MutableRefObject<{ open?: (p: string) => void }>; onSaveState?: (s: string) => void }> = ({ rootDir, bus, onSaveState }) => {
  const [path, setPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [original, setOriginal] = useState("");
  const dirty = content !== original;
  const monacoRef = useRef<any>(null);

  const langOf = (p: string | null) => {
    const ext = (p || "").split(".").pop()?.toLowerCase();
    return ({ ts: "typescript", tsx: "typescript", js: "javascript", mjs: "javascript", cjs: "javascript", json: "json", md: "markdown", html: "html", css: "css", ps1: "shell" } as Record<string, string>)[ext || ""] || "plaintext";
  };

  const feedLsp = (p: string | null, text: string) => {
    if (!p || !monacoRef.current) return;
    try { getMonacoLspAdapter(monacoRef.current, rootDir).openDocument(p, text, langOf(p)); } catch {}
  };

  useEffect(() => { if (path) feedLsp(path, content); /* eslint-disable-next-line */ }, [path]);

  bus.current.open = (abs: string) => {
    fetch(`/api/ide/file?path=${encodeURIComponent(abs)}`).then((r) => r.json()).then((j) => {
      if (j?.success) { setPath(j.path); setContent(j.content); setOriginal(j.content); }
    }).catch(() => {});
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && path && dirty) {
        e.preventDefault();
        fetch("/api/ide/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, content }) })
          .then((r) => r.json())
          .then((j) => { if (j?.success) { setOriginal(content); onSaveState?.(`saved ${path.split("\\").pop()} (${content.length}b)`); } });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [path, dirty, content, onSaveState]);

  const lang = (() => {
    const ext = (path || "").split(".").pop()?.toLowerCase();
    return ({ ts: "typescript", tsx: "typescript", js: "javascript", mjs: "javascript", cjs: "javascript", json: "json", md: "markdown", html: "html", css: "css", ps1: "shell" } as Record<string, string>)[ext || ""] || "plaintext";
  })();

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/80 border-b border-slate-800">
        <span className="text-[10px] font-mono text-slate-400 truncate flex-1">{path ? path.replace(rootDir, "") : "no file open — pick one in explorer"}</span>
        {dirty && <span className="text-[9px] font-mono text-yellow-300">● unsaved</span>}
        {path && <button onClick={() => { fetch("/api/ide/file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, content }) }).then((r) => r.json()).then((j) => { if (j?.success) { setOriginal(content); onSaveState?.("saved"); } }); }} className={`px-2 py-0.5 rounded text-[9px] font-bold ${dirty ? "bg-green-500/20 text-green-300 border border-green-500/40" : "bg-slate-800 text-slate-500"}`}>Save</button>}
      </div>
      <div className="flex-1 min-h-0">
        {path ? (
          <Editor height="100%" theme={FORGE_MONACO_THEME} beforeMount={(mon) => defineForgeTheme(mon as any)} onMount={(_ed, mon) => { monacoRef.current = mon; feedLsp(path, content); }} path={path} language={lang} value={content} onChange={(v) => { setContent(v ?? ""); try { getMonacoLspAdapter(monacoRef.current, rootDir).changeDocument(path, v ?? ""); } catch {} }} options={{ fontSize: 13, automaticLayout: true, minimap: { enabled: true } }} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-600">⌘S saves straight to disk</div>
        )}
      </div>
    </div>
  );
};

const GitPulsePane: React.FC = () => {
  const [status, setStatus] = useState("");
  const load = useCallback(() => {
    fetch("/api/ide/git?cmd=status").then((r) => r.json()).then((j) => setStatus(String(j.out || ""))).catch(() => {});
  }, []);
  useEffect(() => { load(); const iv = window.setInterval(load, 10000); return () => window.clearInterval(iv); }, [load]);
  return (
    <div className="h-full overflow-auto bg-black/50 p-2">
      <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">git pulse (10s)</p>
      <pre className="text-[9px] font-mono text-slate-300 whitespace-pre-wrap">{status || "clean?"}</pre>
    </div>
  );
};

const ProblemsPane: React.FC<{ rootDir: string; bus: React.MutableRefObject<{ open?: (p: string) => void }> }> = ({ rootDir, bus }) => {
  const [diags, setDiags] = useState<FlatDiag[]>([]);
  const [filter, setFilter] = useState<"all" | "err">("all");
  useEffect(() => subscribeLspDiagnostics(setDiags), []);
  const shown = filter === "err" ? diags.filter((d) => d.severity === 1) : diags;
  const errors = diags.filter((d) => d.severity === 1).length;
  const warns = diags.filter((d) => d.severity === 2).length;
  const open = (d: FlatDiag) => {
    const abs = d.fsPath.replace(/^\//, "").replace(/\//g, "\\");
    bus.current.open?.(abs);
  };
  return (
    <div className="h-full overflow-auto bg-slate-950/80 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-mono uppercase text-slate-500">
          problems <span className="text-red-400">{errors} err</span> <span className="text-yellow-400">{warns} warn</span>
        </p>
        <button onClick={() => setFilter((f) => (f === "all" ? "err" : "all"))} className="text-[9px] text-slate-500 hover:text-white">{filter === "all" ? "errors only" : "show all"}</button>
      </div>
      {shown.length === 0 ? (
        <p className="text-[9px] font-mono text-slate-600">no diagnostics — open a file to activate tsserver</p>
      ) : (
        shown.map((d, i) => (
          <div key={`${d.uri}:${d.line}:${i}`} onClick={() => open(d)} className="cursor-pointer flex items-start gap-1 py-0.5 hover:bg-slate-800/60 rounded px-1">
            <span className={`text-[9px] font-bold shrink-0 ${d.severity === 1 ? "text-red-400" : d.severity === 2 ? "text-yellow-400" : "text-sky-400"}`}>{d.severity === 1 ? "✕" : d.severity === 2 ? "⚠" : "ℹ"}</span>
            <span className="text-[9px] font-mono text-slate-300 flex-1 truncate">{d.fsPath.replace(rootDir, "")}:{d.line}</span>
            <span className="text-[9px] font-mono text-slate-400 flex-1 min-w-0 truncate">{d.message}</span>
          </div>
        ))
      )}
    </div>
  );
};

export const ForgeDockLayout: React.FC<{ rootDir?: string; dockApiRef?: React.MutableRefObject<any | null> }> = ({ rootDir, dockApiRef }) => {
  const root = rootDir || ROOT_FALLBACK;
  const apiRef = useRef<any>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const editorBus = useRef<{ open?: (p: string) => void }>({});
  const [, forceTick] = useState(0);

  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api;
    if (dockApiRef) dockApiRef.current = event.api;
    event.api.addPanel({ id: "explorer", component: "explorer", title: "Explorer", position: { direction: "left" } });
    event.api.addPanel({ id: "editor", component: "editor", title: "Editor", position: { referencePanel: "explorer", direction: "right" } });
    event.api.addPanel({ id: "terminal", component: "terminal", title: "Terminal (ConPTY)", position: { referencePanel: "editor", direction: "below" } });
    event.api.addPanel({ id: "git", component: "git", title: "Git", position: { referencePanel: "terminal", direction: "right" } });
    event.api.addPanel({ id: "problems", component: "problems", title: "Problems", position: { referencePanel: "git", direction: "below" } });

    const w = shellRef.current?.clientWidth || 1200;
    const h = shellRef.current?.clientHeight || 800;
    event.api.getPanel("explorer")?.group?.api.setSize({ width: Math.round(w * 0.18) });
    event.api.getPanel("git")?.group?.api.setSize({ width: Math.round(w * 0.22) });
    event.api.getPanel("problems")?.group?.api.setSize({ width: Math.round(w * 0.22) });
    event.api.getPanel("terminal")?.group?.api.setSize({ height: Math.round(h * 0.32) });

    const forceLayout = () => {
      try {
        const rw = shellRef.current?.clientWidth || window.innerWidth;
        const rh = shellRef.current?.clientHeight || 600;
        if (rw > 0 && rh > 0) event.api.layout(rw, rh);
      } catch {}
    };

    // Drive layout from the container's REAL measured size. Dockview measures
    // 0 on first mount (panel body reported 0x0), so we re-layout whenever the
    // host actually gets pixels. This is what makes the inner panes visible.
    const ro = new ResizeObserver(() => forceLayout());
    if (shellRef.current) ro.observe(shellRef.current);
    setTimeout(forceLayout, 50);
    setTimeout(forceLayout, 250);
    setTimeout(forceLayout, 600);
    setTimeout(forceLayout, 1200);

    window.addEventListener("resize", forceLayout);
    (window as any).__forgeLayout = forceLayout;
  };

  return (
    <div ref={shellRef} className="absolute inset-0 rounded-xl overflow-hidden border border-slate-800/80" style={{ background: FORGE_BG }}>
      {/* Glass unification: dockview CSS vars resolve to the Forge surface */}
      <style>{`
        .dockview-theme-dark {
          height: 100% !important;
          min-height: 500px !important;
          width: 100% !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          --dv-group-view-background-color:${FORGE_BG};
          --dv-tabs-and-actions-container-background-color:#0b101b;
          --dv-active-tab-background-color:#101828;
          --dv-inactive-tab-background-color:#0b101b;
          --dv-separator-border:#1e293b;
        }
        .dv-grid-view, .dv-dockview, .dockview-container {
          height: 100% !important;
          min-height: 500px !important;
          width: 100% !important;
          flex: 1 !important;
        }
      `}</style>
      <DockviewReact
        components={{
          explorer: () => <ExplorerPane rootDir={root} onOpen={(abs) => { editorBus.current.open?.(abs); forceTick((t) => t + 1); }} />,
          editor: () => <EditorPane rootDir={root} bus={editorBus} />,
          terminal: () => <div className="h-full bg-[#090d16]"><XtermDrawer /></div>,
          git: () => <GitPulsePane />,
          problems: () => <ProblemsPane rootDir={root} bus={editorBus} />,
        }}
        onReady={onReady}
        className="dockview-theme-dark"
      />
    </div>
  );
};
