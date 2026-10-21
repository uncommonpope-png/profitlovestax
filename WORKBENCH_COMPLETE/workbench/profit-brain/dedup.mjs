import { readFileSync, writeFileSync } from 'node:fs';

const p = 'WORKBENCH_COMPLETE/workbench/src/App.tsx';
const lines = readFileSync(p, 'utf8').split('\n');
const out = [];
let removed = 0;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  const prevT = out.length ? out[out.length - 1].trim() : '';
  if (t === 'draggable={true}' && prevT === 'draggable={true}') {
    removed++;
    continue;
  }
  if (
    t.startsWith('onDragStart=') &&
    t.includes('text/pop-tab') &&
    prevT.startsWith('onDragStart=') &&
    prevT.includes('text/pop-tab')
  ) {
    removed++;
    continue;
  }
  out.push(lines[i]);
}
writeFileSync(p, out.join('\n'));
console.log('removed duplicate attrs:', removed);
