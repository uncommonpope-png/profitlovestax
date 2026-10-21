import { readFileSync, writeFileSync } from 'node:fs';

const P = 'WORKBENCH_COMPLETE/workbench/src/App.tsx';
let s = readFileSync(P, 'utf8');
const lines = s.split('\n');

// Locate renderTabBody function span
const fnStart = lines.findIndex((l) => l.includes('const renderTabBody'));
const fnEnd = lines.findIndex((l) => l.trim() === '};' && l !== lines[fnStart] && lines.indexOf(l, fnStart) >= 0);
let end = -1;
for (let i = fnStart + 1; i < lines.length; i++) {
  if (lines[i].trim() === '};') {
    end = i;
    break;
  }
}
console.log('renderTabBody span:', fnStart + 1, '->', end + 1);

// Inside the switch, remove orphan closers and legacy KeepAlive/popped references
const badLine = (t) => t === ')}' || t.startsWith('<KeepAlive') || t === '</KeepAlive>' || t.includes('poppedTab');
const kept = [];
let removed = 0;
for (let i = 0; i < lines.length; i++) {
  const inFn = i > fnStart && i < end;
  const t = lines[i].replace(/\r$/, '').trim();
  if (inFn && badLine(t)) {
    removed++;
    continue;
  }
  // also purge any残 floating-card remnants outside the function
  if (!inFn && (lines[i].includes('{poppedTab') || lines[i].includes('popTitles['))) {
    removed++;
    continue;
  }
  kept.push(lines[i]);
}
console.log('removed lines:', removed);
writeFileSync(P, kept.join('\n'));
