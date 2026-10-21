import { readFileSync, writeFileSync } from 'node:fs';

const P = 'WORKBENCH_COMPLETE/workbench/src/App.tsx';
let s = readFileSync(P + '.bak', 'utf8');

// ---------- normalize newlines for processing ----------
s = s.replace(/\r\n/g, '\n');
const lines = s.split('\n');

// ---------- 1. Purge old single-card system ----------
lines.splice(lines.findIndex((l) => l.includes('const [poppedTab')), 1);
{
  const a = lines.findIndex((l) => l.includes('{/* POPPED CHILD CARDS'));
  const b = lines.findIndex((l) => l.includes('{/* Master JSON Export Modal */}'));
  if (a >= 0 && b > a) {
    lines.splice(a, b - a);
  }
}

// ---------- 2. Locate region ----------
const firstIdx = lines.findIndex((l) => l.trim() === '{activeTab === "capabilities" && (');
const mainCloseIdx = lines.findIndex((l) => l.trim() === '</main>');
if (firstIdx < 0 || mainCloseIdx < 0) {
  console.error('region missing');
  process.exit(1);
}

// ---------- 3. Harvest all blocks (plain + KeepAlive-wrapped) ----------
const openers = [];
for (let i = firstIdx; i < mainCloseIdx; i++) {
  const t = lines[i].trim();
  const mPlain = t.match(/^\{activeTab === "(\w+)" && \($/);
  const mWrapped = t.match(/^<KeepAlive active=\{activeTab === "(\w+)"\}/);
  const key = mPlain ? mPlain[1] : mWrapped ? mWrapped[1] : null;
  if (key) openers.push({ key, idx: i });
}
console.log('harvested:', openers.map((o) => o.key).join(','));

const HEAVY_TABS = ['ide', 'power', 'stream', 'profitPrime'];
const bodies = {};
for (let n = 0; n < openers.length; n++) {
  const { key, idx } = openers[n];
  const end = n + 1 < openers.length ? openers[n + 1].idx : mainCloseIdx;
  let chunk = lines.slice(idx + 1, end);
  while (chunk.length && chunk[chunk.length - 1].trim() === '') chunk.pop();
  while (chunk.length && chunk[chunk.length - 1].trim() === ')}') chunk.pop();
  if (chunk[0] && chunk[0].includes('<KeepAlive')) {
    chunk = chunk.slice(1);
    while (chunk.length && chunk[chunk.length - 1].trim() !== '</KeepAlive>') chunk.pop();
    chunk.pop();
  }
  while (chunk.length && chunk[0].trim() === '') chunk.shift();
  const indents = chunk.filter((l) => l.trim()).map((l) => (l.match(/^\s*/) || [''])[0].length);
  const dedent = Math.min(...indents);
  bodies[key] = chunk.map((l) => l.slice(dedent)).join('\n');
}
const order = openers.map((o) => o.key);
console.log('bodies built:', order.length);

// ---------- 4. Build renderTabBody ----------
const cases = order
  .map((k) => `      case "${k}":\n        return (\n<>\n${bodies[k]}\n</>\n        );`)
  .join('\n');
const renderFn = `  const renderTabBody = (k: string) => {
    switch (k) {
${cases}
      default:
        return null;
    }
  };
`;

// ---------- 5. Window manager ----------
const wmState = `
  const [wins, setWins] = useState<{key: string; x: number; y: number; w: number; h: number; min: boolean; z: number}[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tool_wins") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const zRef = useRef<number>(100);
  useEffect(() => {
    localStorage.setItem("tool_wins", JSON.stringify(wins));
  }, [wins]);
  const winOpen = (k: string) => wins.some((w) => w.key === k);
  const openTool = (k: string) =>
    setWins((ws) => {
      if (ws.some((w) => w.key === k)) return focusWinIn(ws, k), ws;
      const n = ws.length;
      return [...ws, { key: k, x: 140 + ((n * 40) % 280), y: 90 + ((n * 30) % 170), w: 660, h: 500, min: false, z: ++zRef.current }];
    });
  const focusWinIn = (ws: any[], k: string) => ws.map((w) => (w.key === k ? { ...w, min: false, z: ++zRef.current } : w));
  const focusWin = (k: string) => setWins((ws) => focusWinIn(ws, k));
  const closeWin = (k: string) => setWins((ws) => ws.filter((w) => w.key !== k));
  const patchWin = (k: string, patch: Partial<{ x: number; y: number; w: number; h: number; min: boolean }>) =>
    setWins((ws) => ws.map((w) => (w.key === k ? { ...w, ...patch } : w)));
`;
s = s.replace('  const [strictRealismMode', wmState + '  const HEAVY_TABS = ' + JSON.stringify(HEAVY_TABS) + ';\n' + renderFn + '\n  const [strictRealismMode');

// ---------- 6. Replace main region ----------
const newRegion = `        {!HEAVY_TABS.includes(activeTab) && renderTabBody(activeTab)}
        {HEAVY_TABS.map((hk) => (
          <KeepAlive key={hk} active={true} hidden={!winOpen(hk) && activeTab !== hk}>
            {renderTabBody(hk)}
          </KeepAlive>
        ))}`;
lines.splice(firstIdx, mainCloseIdx - firstIdx, ...newRegion.split('\n'));
s = lines.join('\n');

// ---------- 7. Uniform tab buttons: focus-window-if-open + draggable ----------
for (const k of order) {
  const target = 'onClick={() => setActiveTab("' + k + '")}';
  if (!s.includes(target)) continue;
  const inject =
    'onClick={() => (winOpen("' + k + '") ? focusWin("' + k + '") : setActiveTab("' + k + '"))}\n            draggable={true}\n            onDragStart={(e) => { e.dataTransfer.setData("text/pop-tab", "' + k + '"); }}';
  s = s.replace(target, inject);
}

// ---------- 8. Drop zone ----------
s = s.replace(
  '<main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col">',
  `<main
      className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/pop-tab")) e.preventDefault();
      }}
      onDrop={(e) => {
        const key = e.dataTransfer.getData("text/pop-tab");
        if (key) openTool(key);
      }}
    >`
);

// ---------- 9. Tool windows layer ----------
const layer = `
      {/* TOOL WINDOWS — Workbench Desktop */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {wins.map((w) => (
          <div
            key={w.key}
            className="absolute pointer-events-auto bg-slate-950/95 border border-slate-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ left: w.x, top: w.y, width: w.w, height: w.min ? 38 : w.h, zIndex: w.z }}
            onMouseDown={() => focusWin(w.key)}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-700 cursor-move select-none"
              onMouseDown={(e) => {
                e.preventDefault();
                const sx = e.clientX - w.x;
                const sy = e.clientY - w.y;
                const mv = (ev: MouseEvent) => patchWin(w.key, { x: ev.clientX - sx, y: Math.max(0, ev.clientY - sy) });
                const up = () => {
                  window.removeEventListener('mousemove', mv);
                  window.removeEventListener('mouseup', up);
                };
                window.addEventListener('mousemove', mv);
                window.addEventListener('mouseup', up);
              }}
              onDoubleClick={() => patchWin(w.key, { min: !w.min })}
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                {w.key}{w.min ? ' — minimized' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => patchWin(w.key, { min: !w.min })}
                  className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 text-[10px] leading-none"
                >
                  –
                </button>
                <button
                  onClick={() => closeWin(w.key)}
                  className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 text-[10px] leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            {!w.min && (
              <div className="flex-1 min-h-0 overflow-auto p-2">
                {renderTabBody(w.key)}
              </div>
            )}
          </div>
        ))}
      </div>
`;
s = s.replace('      {/* Master JSON Export Modal */}', layer + '\n      {/* Master JSON Export Modal */}');

writeFileSync(P, s);
console.log('DESKTOP MODE v2 INSTALLED —', order.length, 'tools');
