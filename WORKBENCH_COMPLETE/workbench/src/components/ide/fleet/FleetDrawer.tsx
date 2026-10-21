import React, { useCallback, useEffect, useState } from "react";
import { GitBranch, Plus, Trash2, Merge, Play, X, RefreshCw } from "lucide-react";

interface WorktreeRow {
  name: string;
  relPath: string;
  branch: string;
  head: string;
  isMain: boolean;
  task: string;
  dirty: number;
  ahead: number;
  log: string[];
  changedFiles: string[];
}

interface FleetDrawerProps {
  onClose: () => void;
  onOpen?: (relPath: string) => void;
}

export const FleetDrawer: React.FC<FleetDrawerProps> = ({ onClose, onOpen }) => {
  const [items, setItems] = useState<WorktreeRow[]>([]);
  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [cmds, setCmds] = useState<Record<string, string>>({});
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const pushLog = (line: string) => setLog((l) => [...l.slice(-40), line]);

  const load = useCallback(async () => {
    const j = await fetch("/api/ide/fleet").then((r) => r.json()).catch(() => null);
    setItems(j?.worktrees || []);
  }, []);

  useEffect(() => {
    load();
    const iv = window.setInterval(load, 5000);
    return () => window.clearInterval(iv);
  }, [load]);

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    const j = await fetch("/api/ide/fleet/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), task }) }).then((r) => r.json()).catch(() => null);
    pushLog(j?.ok ? `\u001b[32m✓ worktree '${name}' created (branch fleet/${name})\u001b[0m` : `\u001b[31m✗ ${j?.error || "create failed"}\u001b[0m`);
    setName(""); setTask("");
    await load();
    setBusy(false);
  };

  const act = async (verb: "remove" | "merge" | "run", wt: WorktreeRow) => {
    if (busy) return;
    setBusy(true);
    if (verb === "run") {
      const cmd = cmds[wt.name] || "";
      pushLog(`\u001b[35m▶ [${wt.name}] $ ${cmd}\u001b[0m`);
      const j = await fetch("/api/ide/fleet/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wt.name, cmd }) }).then((r) => r.json()).catch(() => null);
      pushLog((j?.output || "(no output)").slice(0, 1500));
    } else if (verb === "merge") {
      pushLog(`\u001b[36m⇅ merging fleet/${wt.name} into main…\u001b[0m`);
      const j = await fetch("/api/ide/fleet/merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wt.name }) }).then((r) => r.json()).catch(() => null);
      pushLog(`${j?.ok ? "\u001b[32m✓ merged" : "\u001b[31m✗ merge failed"}\u001b[0m — ${(j?.output || "").slice(0, 400)}`);
    } else {
      const j = await fetch("/api/ide/fleet/remove", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wt.name }) }).then((r) => r.json()).catch(() => null);
      pushLog(j?.ok ? `\u001b[32m✓ worktree '${wt.name}' removed\u001b[0m` : `\u001b[31m✗ remove failed\u001b[0m`);
    }
    await load();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-12" onClick={onClose}>
      <div className="w-[860px] max-h-[85vh] bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold font-mono text-purple-300">ORCA FLEET — isolated git-worktree agents</span>
          <button onClick={load} className="ml-auto text-slate-500 hover:text-white"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <div className="p-3 border-b border-slate-800 flex gap-2 items-center">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="agent-name (e.g. refactor-auth)" className="w-48 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-purple-500/50" />
          <input value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="task brief for this agent's worktree…" className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-purple-500/50" />
          <button onClick={create} disabled={busy || !name.trim()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold disabled:opacity-40"><Plus className="w-3 h-3" />Spawn</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {items.filter((w) => !w.isMain).length === 0 && (
            <div className="text-xs text-slate-500 text-center py-6 font-mono">no fleet worktrees — spawn one above; each agent works in an isolated checkout, merges land on main</div>
          )}
          {items.filter((w) => !w.isMain).map((wt) => (
            <div key={wt.name} className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-purple-300">{wt.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{wt.branch}@{wt.head}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${wt.ahead > 0 ? "bg-green-500/15 text-green-300" : "bg-slate-800 text-slate-400"}`}>↑{wt.ahead} commits</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${wt.dirty > 0 ? "bg-amber-500/15 text-amber-300" : "bg-slate-800 text-slate-400"}`}>●{wt.dirty} dirty</span>
                {wt.task && <span className="text-[10px] text-slate-400 truncate flex-1 min-w-[120px]">“{wt.task}”</span>}
                <button onClick={() => act("merge", wt)} disabled={busy} className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-300 text-[10px] font-bold disabled:opacity-40"><Merge className="w-3 h-3" />Merge</button>
                <button onClick={() => act("remove", wt)} disabled={busy} className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-bold disabled:opacity-40"><Trash2 className="w-3 h-3" />Kill</button>
              </div>
              {wt.changedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wt.changedFiles.slice(0, 6).map((f) => (
                    <button key={f} onClick={() => onOpen?.(`${wt.relPath}\\${f}`)} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800/80 text-cyan-300 hover:bg-slate-700">{f}</button>
                  ))}
                  {wt.changedFiles.length > 6 && <span className="text-[9px] text-slate-500 font-mono self-center">+{wt.changedFiles.length - 6} more</span>}
                </div>
              )}
              <div className="flex gap-1 mt-1.5">
                <input value={cmds[wt.name] || ""} onChange={(e) => setCmds((c) => ({ ...c, [wt.name]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && act("run", wt)} placeholder="command in this worktree (e.g. npm test)" className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-green-300 placeholder-slate-600 focus:outline-none" />
                <button onClick={() => act("run", wt)} disabled={busy || !(cmds[wt.name] || "").trim()} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-green-400 text-[10px] font-bold disabled:opacity-40"><Play className="w-3 h-3" />Run</button>
              </div>
              {wt.log.length > 0 && <p className="mt-1 text-[9px] font-mono text-slate-600 truncate">{wt.log.join(" · ")}</p>}
            </div>
          ))}
        </div>

        {log.length > 0 && (
          <div className="border-t border-slate-800 bg-black/60 max-h-40 overflow-y-auto px-3 py-2">
            {log.map((l, i) => (
              <pre key={i} className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all">{l}</pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
