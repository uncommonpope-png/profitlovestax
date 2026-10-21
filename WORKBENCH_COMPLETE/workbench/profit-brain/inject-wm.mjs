import { readFileSync, writeFileSync } from 'node:fs';

// ---- harvest bodies from pristine backup ----
const bakLines = readFileSync('WORKBENCH_COMPLETE/workbench/src/App.tsx.bak', 'utf8').replace(/\r\n/g, '\n').split('\n');
const firstIdx = bakLines.findIndex((l) => l.trim() === '{activeTab === "capabilities" && (');
const mainCloseIdx = bakLines.findIndex((l) => l.trim() === '</main>');
const openers = [];
for (let i = firstIdx; i < mainCloseIdx; i++) {
  const t = bakLines[i].trim();
  const mPlain = t.match(/^\{activeTab === "(\w+)" && \($/);
  const mWrapped = t.match(/^<KeepAlive active=\{activeTab === "(\w+)"\}/);
  const key = mPlain ? mPlain[1] : mWrapped ? mWrapped[1] : null;
  if (key) openers.push({ key, idx: i });
}
const bodies = {};
for (let n = 0; n < openers.length; n++) {
  const { key, idx } = openers[n];
  const end = n + 1 < openers.length ? openers[n + 1].idx : mainCloseIdx;
  let chunk = bakLines.slice(idx + 1, end);
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
console.log('harvested', openers.length, 'bodies');

const HEAVY_TABS = ['ide', 'power', 'stream', 'profitPrime'];
const cases = openers
  .map((o) => o.key)
  .map((k) => `      case "${k}":\n        return (\n<>\n${bodies[k]}\n</>\n        );`)
  .join('\n');

const BLOCK = `
  const HEAVY_TABS = ${JSON.stringify(HEAVY_TABS)};
  const renderTabBody = (k: string) => {
    switch (k) {
${cases}
      default:
        return null;
    }
  };

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
  const focusWinIn = (ws: any[], k: string) => ws.map((w) => (w.key === k ? { ...w, min: false, z: ++zRef.current } : w));
  const focusWin = (k: string) => setWins((ws) => focusWinIn(ws, k));
  const closeWin = (k: string) => setWins((ws) => ws.filter((w) => w.key !== k));
  const openTool = (k: string) =>
    setWins((ws) => {
      if (ws.some((w) => w.key === k)) return focusWinIn(ws, k);
      const n = ws.length;
      return [...ws, { key: k, x: 140 + ((n * 40) % 280), y: 90 + ((n * 30) % 170), w: 660, h: 500, min: false, z: ++zRef.current }];
    });
  const patchWin = (k: string, patch: Partial<{ x: number; y: number; w: number; h: number; min: boolean }>) =>
    setWins((ws) => ws.map((w) => (w.key === k ? { ...w, ...patch } : w)));
`;

// ---- inject into CURRENT App.tsx ----
const P = 'WORKBENCH_COMPLETE/workbench/src/App.tsx';
let cur = readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
if (cur.includes('const renderTabBody')) {
  console.log('already patched — aborting to avoid duplication');
  process.exit(0);
}
const anchor = '  const [strictRealismMode';
if (!cur.includes(anchor)) {
  console.error('anchor missing!');
  process.exit(1);
}
cur = cur.replace(anchor, BLOCK + '\n' + anchor);
writeFileSync(P, cur);
console.log('WM + renderTabBody injected. Cases:', openers.length);
