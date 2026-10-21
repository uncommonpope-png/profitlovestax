import React from "react";

export interface GraphCommit {
  hash: string;
  parents: string[];
  author: string;
  date: string;
  refs: string;
  subject: string;
}

const LANE_COLORS = ["#22d3ee", "#a78bfa", "#4ade80", "#fbbf24", "#f472b6", "#60a5fa"];
const ROW_H = 24;
const COL_W = 16;

interface Curve {
  x1: number; y1: number; x2: number; y2: number; color: string;
}

/**
 * GitGraph — GitLens-style SVG lane graph aligned row-for-row with the log list.
 * First parent inherits the node's lane (vertical flow); extra (merge) parents
 * are registered as pending targets and drawn as bezier elbows when their row
 * appears. Lane colors are stable per lane index.
 */
export const GitGraph: React.FC<{ commits: GraphCommit[] }> = ({ commits }) => {
  const curves: Curve[] = [];
  const rows: Array<{ c: GraphCommit; lane: number }> = [];
  let lanes: (string | null)[] = [];
  const pending = new Map<string, Array<{ fromRow: number; fromLane: number }>>();

  commits.forEach((c, row) => {
    let lane = lanes.indexOf(c.hash);
    if (lane === -1) {
      lane = lanes.findIndex((x) => x === null);
      if (lane === -1) { lane = lanes.length; lanes.push(null); }
    }

    // Resolve curves flowing INTO this node
    const waiting = pending.get(c.hash);
    if (waiting) {
      for (const w of waiting) {
        curves.push({
          x1: w.fromLane * COL_W + 10,
          y1: w.fromRow * ROW_H + 12,
          x2: lane * COL_W + 10,
          y2: row * ROW_H + 12,
          color: LANE_COLORS[w.fromLane % LANE_COLORS.length],
        });
      }
      pending.delete(c.hash);
    }

    const parents = c.parents || [];
    lanes[lane] = parents[0] || null;
    for (let i = 1; i < parents.length; i++) {
      const arr = pending.get(parents[i]) || [];
      arr.push({ fromRow: row, fromLane: lane });
      pending.set(parents[i], arr);
    }

    rows.push({ c, lane });
  });

  const maxLanes = Math.max(1, rows.reduce((m, r) => Math.max(m, r.lane + 1), 1));
  const width = maxLanes * COL_W + 8;
  const height = rows.length * ROW_H + 8;

  return (
    <div className="flex gap-2 overflow-auto" style={{ maxHeight: 280 }}>
      <svg width={width} height={height} className="shrink-0">
        {curves.map((cu, i) => {
          const midY = cu.y1 + (cu.y2 - cu.y1) / 2;
          return (
            <path
              key={"e" + i}
              d={`M ${cu.x1} ${cu.y1} C ${cu.x1} ${midY}, ${cu.x2} ${midY}, ${cu.x2} ${cu.y2}`}
              stroke={cu.color}
              strokeWidth={1.5}
              fill="none"
              opacity={0.85}
            />
          );
        })}
        {rows.map((r, i) => (
          <circle
            key={r.c.hash + ":" + i}
            cx={r.lane * COL_W + 10}
            cy={i * ROW_H + 12}
            r={4.5}
            fill={LANE_COLORS[r.lane % LANE_COLORS.length]}
            stroke="#0b1220"
            strokeWidth={1}
          />
        ))}
      </svg>
      <div className="flex-1 min-w-0">
        {rows.map((r, i) => (
          <div key={r.c.hash + "l" + i} className="flex items-center gap-1.5 font-mono text-[9px]" style={{ height: ROW_H }}>
            <span className="text-slate-600 shrink-0">{r.c.hash}</span>
            {r.c.refs && <span className="px-1 rounded bg-green-500/15 text-green-300 shrink-0">{r.c.refs.split(",")[0].replace("HEAD -> ", "").trim()}</span>}
            <span className="text-slate-300 truncate" title={`${r.c.author} · ${r.c.subject}`}>{r.c.subject}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
