import React, { useEffect, useRef, useState } from "react";

/**
 * GskStreamTab — THE MIND STREAM (Movement II visual half).
 * GSK's perpetual runtime, live in the workbench:
 *   • LIVE      — ws /api/gsk/ws/thought → console (runtime cognition),
 *                 thought (deep 45min cycles), journal (soul events)
 *   • LEDGER    — real memory files on disk (sizes + freshness)
 *   • LEARNING  — newest knowledge.jsonl entries (what he actually learned)
 */

interface FeedItem {
  id: number;
  kind: "console" | "thought" | "journal" | "system";
  text: string;
  meta?: string;
  ts: number;
}

interface MindStats {
  ledger: Record<string, { kb: number; ageMin: number } | null>;
  knowledgeCount: number;
  recentKnowledge: Array<{ topic: string; source: string }>;
  cycle: any;
}

const KIND_STYLE: Record<FeedItem["kind"], string> = {
  console: "text-slate-400",
  thought: "text-violet-300 font-semibold",
  journal: "text-amber-300",
  system: "text-cyan-400",
};

export const GskStreamTab: React.FC<{ accentColor?: string }> = ({ accentColor = "#a78bfa" }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<MindStats | null>(null);
  const [paused, setPaused] = useState(false);
  const [dropped, setDropped] = useState(0);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // ── LIVE THOUGHT FEED (throttled — his console is a firehose) ──
  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let idc = 0;
    let buf: FeedItem[] = [];
    let dropped = 0;
    const pushRaw = (kind: FeedItem["kind"], text: string, meta?: string) => {
      buf.push({ id: 0, kind, text: String(text).slice(0, 500), meta, ts: Date.now() });
      if (buf.length > 400) { const cut = buf.length - 200; dropped += cut; buf = buf.slice(cut); }
    };
    // Drain buffer into state every 500ms — UI never chokes on bursts
    const drainer = window.setInterval(() => {
      if (!buf.length || pausedRef.current) { if (pausedRef.current && buf.length > 400) { dropped += buf.length - 200; buf = buf.slice(-200); } return; }
      const batch = buf; buf = [];
      setFeed((f) => {
        const merged = [...f, ...batch.map((b, i) => ({ ...b, id: ++idc + i * 0.001 }))];
        return merged.length > 300 ? merged.slice(merged.length - 300) : merged;
      });
      if (dropped > 0) { setDropped((d) => d + dropped); dropped = 0; }
    }, 500);
    const connect = () => {
      if (closed) return;
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      try { ws = new WebSocket(`${proto}://${window.location.host}/api/gsk/ws/thought`); } catch { setTimeout(connect, 3000); return; }
      ws.onopen = () => { setConnected(true); pushRaw("system", "linked to GSK thought stream (:3002 via conductor)"); };
      ws.onmessage = (ev) => {
        let d: any; try { d = JSON.parse(ev.data); } catch { return; }
        if (d.type === "connected") return pushRaw("system", d.msg || "stream handshake");
        if (d.type === "thought") return pushRaw("thought", d.thought, `${d.mode} · ${d.mood}`);
        if (d.type === "journal") return pushRaw("journal", typeof d.entry === "string" ? d.entry : d.entry?.text || JSON.stringify(d.entry).slice(0, 200), "soul journal");
        if (d.type === "console") return pushRaw("console", d.text, d.kind);
      };
      ws.onclose = () => { setConnected(false); pushRaw("system", "stream lost — reconnecting…"); if (!closed) setTimeout(connect, 3000); };
      ws.onerror = () => {};
    };
    connect();
    return () => { closed = true; window.clearInterval(drainer); ws?.close(); };
  }, []);

  // ── MEMORY LEDGER POLL ──
  useEffect(() => {
    const load = () => fetch("/api/gsk/mind/stats").then((r) => r.json()).then((j) => j?.success && setStats(j)).catch(() => {});
    load();
    const iv = window.setInterval(load, 10000);
    return () => window.clearInterval(iv);
  }, []);

  // autoscroll unless paused
  useEffect(() => { if (!paused && feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [feed, paused]);

  const phase = stats?.cycle?.phase_name || stats?.cycle?.phase || "—";
  const cycleNum = stats?.cycle?.cycles ?? stats?.cycle?.cycle ?? "—";

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3 p-1">
      {/* HEADER */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: connected ? "#34d399" : "#ef4444", boxShadow: connected ? "0 0 10px #34d399" : "none" }} />
          GSK MIND STREAM
        </h2>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-violet-500/15 border border-violet-500/30 text-violet-300">phase {String(phase)}</span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-800 border border-slate-700 text-slate-300">cycle {String(cycleNum)}</span>
        {dropped > 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-500">{dropped.toLocaleString()} events collapsed</span>}
        <button onClick={() => setPaused((p) => !p)} className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${paused ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"}`}>{paused ? "Paused — Resume" : "Live — Pause"}</button>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* LIVE FEED */}
        <div ref={feedRef} className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-800/70 bg-[#090d16] p-2 space-y-0.5 font-mono text-[11px]" onClick={() => setPaused(true)}>
          {feed.length === 0 && <p className="text-slate-600">awaiting his mind… (deep thoughts fire on the 45min consciousness cycle; runtime console flows continuously)</p>}
          {feed.map((f) => (
            <div key={f.id} className={KIND_STYLE[f.kind]}>
              <span className="text-slate-600 mr-1">{new Date(f.ts).toLocaleTimeString()}</span>
              {f.meta && <span className="text-slate-600 mr-1">[{f.meta}]</span>}
              <span className="whitespace-pre-wrap break-all">{f.text}</span>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-72 shrink-0 flex flex-col gap-3 min-h-0">
          {/* MEMORY LEDGER */}
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-2">
            <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">memory ledger · disk truth</p>
            <div className="space-y-0.5">
              {stats && Object.entries(stats.ledger || {}).map(([f, s]) => (
                <div key={f} className="flex items-center justify-between text-[10px] font-mono">
                  <span className={s ? "text-slate-300" : "text-slate-600"}>{f}</span>
                  <span className={s ? (s.ageMin <= 5 ? "text-green-400" : s.ageMin <= 60 ? "text-yellow-400" : "text-slate-500") : "text-red-500"}>
                    {s ? `${s.kb}KB · ${s.ageMin}m` : "missing"}
                  </span>
                </div>
              ))}
              {!stats && <p className="text-[10px] text-slate-600">reading ledger…</p>}
            </div>
            {stats && <p className="mt-1 text-[9px] font-mono text-slate-500">{stats.knowledgeCount} knowledge entries total</p>}
          </div>

          {/* LEARNING FEED */}
          <div className="flex-1 min-h-0 rounded-xl border border-slate-800/70 bg-slate-900/50 p-2 overflow-y-auto">
            <p className="text-[10px] font-mono uppercase text-slate-500 mb-1">learning feed · newest</p>
            {stats?.recentKnowledge?.length ? (
              stats.recentKnowledge.map((k, i) => (
                <div key={i} className="mb-1 pb-1 border-b border-slate-800/50">
                  <p className="text-[10px] text-slate-300 leading-snug">{k.topic}</p>
                  <p className="text-[8px] font-mono text-slate-600">source: {k.source}</p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-600">no learning events yet</p>
            )}
          </div>

          {/* WHAT THIS IS */}
          <div className="rounded-xl border border-slate-800/70 bg-black/30 p-2">
            <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
              Everything here is read from HIS live process and real files on disk — nothing simulated.
              Green ages &lt; 5m = organ actively writing. This tab dies when you close the workbench; so does he.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
