'use strict';
/*
 * GSK CONTRACT AUDIT — the "map" of the language.
 * Static heuristic scanner (not a full type checker). Surfaces:
 *   1. Port contract      — declared listeners vs referenced ports
 *   2. Model contract     — OmniRoute whitelist vs model strings used
 *   3. Chamber interface  — do all chambers implement summary/breathe/status?
 *   4. Cross-boundary calls — kernel.chambers.X.method existence
 *   5. Property-shape traps — nested .will / object-vs-scalar collisions
 *   6. Stale dialect      — :61998, World Bridge, Soulverse, Unreal
 * Output: contract_audit_report.md + console summary.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'gsk-core');

const KNOWN_MODELS = ['pAUL', 'GOGOGO', 'hy3-free', 'free', 'cf-free', 'useg'];
const KNOWN_LIVE_PORTS = new Set(['3001', '3002', '4000', '20128', '61999', '9001']);
const BAD_MODEL_HINTS = ['hy3', 'gemini', 'groq', 'mistral', 'gpt-', 'claude', 'openai', 'anthropic'];
const CHAMBER_METHODS = ['summary', 'breathe', 'status'];

const findings = [];
const note = (sev, cat, file, line, msg) => findings.push({ sev, cat, file: file.replace(ROOT + path.sep, ''), line, msg });

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const fileText = {};
for (const f of files) {
  try { fileText[f] = fs.readFileSync(f, 'utf8'); } catch (e) { fileText[f] = ''; }
}

// ---- 1. PORTS ----
const listeners = {}; // port -> [files]
const referenced = {}; // port -> [files]
for (const f of files) {
  const t = fileText[f];
  // declared listeners: .listen(3001) or PORT = 3001 or port = 3001
  for (const m of t.matchAll(/\.listen\s*\(\s*(\d{3,5})/g)) (listeners[m[1]] ||= []).push(f);
  for (const m of t.matchAll(/(?:PORT|port|wsPort|WS_PORT)\s*[:=]\s*(\d{3,5})/g)) (listeners[m[1]] ||= []).push(f);
  // referenced ports anywhere: :3001, :61998, etc (string or comment)
  for (const m of t.matchAll(/:(\d{3,5})\b/g)) (referenced[m[1]] ||= []).push(f);
}
const livePorts = new Set(Object.keys(listeners));
for (const [port, fs2] of Object.entries(referenced)) {
  if (!livePorts.has(port) && !KNOWN_LIVE_PORTS.has(port)) {
    for (const f of [...new Set(fs2)]) {
      const ln = fileText[f].split('\n').findIndex(l => l.includes(':' + port)) + 1;
      note('HIGH', 'port', f, ln, `Port :${port} is referenced but NO listener declares it (ghost port / dead dialect).`);
    }
  }
}

// ---- 2. MODELS ----
for (const f of files) {
  const t = fileText[f];
  for (const hint of BAD_MODEL_HINTS) {
    // find quoted tokens containing the hint
    for (const m of t.matchAll(new RegExp(`['"\`]([^'"\`]*${hint}[^'"\`]*)['"\`]`, 'gi'))) {
      const tok = m[1].trim();
      if (!KNOWN_MODELS.includes(tok) && !KNOWN_MODELS.some(k => tok.includes(k))) {
        const ln = fileText[f].split('\n').findIndex(l => l.includes(m[0])) + 1;
        note('MED', 'model', f, ln, `Model token "${tok}" is not in the OmniRoute whitelist ${KNOWN_MODELS.join(', ')} — likely dead/429.`);
      }
    }
  }
}

// ---- 3 + 5. CHAMBERS + nested property traps ----
// field -> class mapping inside mega_chambers
let chamberMap = {};
const megaFile = files.find(f => f.endsWith('mega_chambers.js'));
if (megaFile) {
  const t = fileText[megaFile];
  for (const m of t.matchAll(/this\.([A-Za-z_]\w*)\s*=\s*new\s+([A-Za-z_]\w*)\s*\(/g)) {
    chamberMap[m[1]] = m[2];
  }
}

// class -> defined methods
const classMethods = {};
for (const f of files) {
  const t = fileText[f];
  let lastClass = null;
  for (const m of t.matchAll(/class\s+([A-Za-z_]\w*)/g)) lastClass = m[1];
  for (const m of t.matchAll(/(?:async\s+)?([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g)) {
    const name = m[1];
    if (['if', 'for', 'while', 'switch', 'catch', 'function', 'constructor', 'return', 'await'].includes(name)) continue;
    (classMethods[lastClass] ||= new Set()).add(name);
  }
}

// chamber conformance — summary() is the hard requirement (called by getSoulContext on every chamber);
// breathe()/status() are recommended (flagged LOW).
for (const [field, cls] of Object.entries(chamberMap)) {
  const methods = classMethods[cls] || new Set();
  if (!methods.has('summary')) {
    note('MED', 'chamber-iface', megaFile, 0, `Chamber field "${field}" -> class ${cls} is missing required "summary()()" (called by getSoulContext on every cycle).`);
  }
  for (const need of ['breathe', 'status']) {
    if (!methods.has(need)) {
      note('LOW', 'chamber-iface', megaFile, 0, `Chamber field "${field}" -> class ${cls} has no "${need}()" (optional Chamber contract method).`);
    }
  }
}

// property-shape traps: agentic_will.will = number (scalar overwrite of an object)
for (const f of files) {
  const t = fileText[f];
  let idx = 0;
  for (const m of t.matchAll(/agentic_will\.will\s*=/g)) {
    const ln = t.slice(0, m.index).split('\n').length;
    note('HIGH', 'prop-shape', f, ln, `Writes to agentic_will.will (the AgenticWill OBJECT) — verify it is not overwritten with a scalar (the bug AUDIT_CLEARED: consciousness fix #1 verified in consciousness_engine.js).`);
  }
  // any `X.will = <number-ish>` where X is a chamber-like object
  for (const m of t.matchAll(/\.will\s*=\s*(Math\.min|Math\.max|\d|\w+\s*[-+*])/g)) {
    const ln = t.slice(0, m.index).split('\n').length;
    note('HIGH', 'prop-shape', f, ln, `Assigns a scalar/computed value to a ".will" property — potential object-vs-scalar collision.`);
  }
}

// nested .will.summarize etc — flag for review
for (const f of files) {
  const t = fileText[f];
  for (const m of t.matchAll(/\.will\.summarize\(/g)) {
    const ln = t.slice(0, m.index).split('\n').length;
    note('LOW', 'prop-shape', f, ln, `Calls .will.summarize() — confirm the left side's ".will" actually holds an object with summarize().`);
  }
}

// ---- 4. CROSS-BOUNDARY CALLS ----
for (const f of files) {
  const t = fileText[f];
  // kernel.chambers.X.method(
  for (const m of t.matchAll(/kernel\.chambers\.([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s*\(/g)) {
    const [_, field, method] = m;
    if (!(field in chamberMap)) {
      const ln = t.slice(0, m.index).split('\n').length;
      note('MED', 'xcall', f, ln, `Calls kernel.chambers.${field}.${method}() but "${field}" is not a registered chamber field in mega_chambers.`);
    }
  }
  // kernel.SYS.method(
  for (const m of t.matchAll(/kernel\.([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s*\(/g)) {
    const [_, sys, method] = m;
    if (['chambers', 'brain', 'memory', 'systems', 'mcp', 'perpetualConsciousness', 'consciousnessLoop'].includes(sys)) continue;
    // only flag if sys looks like a kernel subsystem but unknown
  }
}

// ---- 6. STALE DIALECT ----
const STALE = ['61998', 'World Bridge', 'world bridge', 'Soulverse', 'soulverse', 'Unreal Engine', 'unreal'];
for (const f of files) {
  const t = fileText[f];
  for (const s of STALE) {
    if (t.includes(s)) {
      const ln = t.split('\n').findIndex(l => l.includes(s)) + 1;
      note('MED', 'stale-dialect', f, ln, `References stale dialect token "${s}" — likely superseded by CPL (:3001/:3002).`);
    }
  }
}

// ---- REPORT ----
const bySev = { HIGH: 0, MED: 0, LOW: 0 };
findings.forEach(f => bySev[f.sev]++);
let md = `# GSK CONTRACT AUDIT — the map of the language\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Scanned: ${files.length} files under gsk-core\n`;
md += `Findings: ${findings.length}  (HIGH ${bySev.HIGH} / MED ${bySev.MED} / LOW ${bySev.LOW})\n\n`;

md += `## Methodology\nStatic heuristic scan (regex-based, not a full type checker). It maps what each module PROVIDES (class methods) vs what others CALL it as, and flags the known mismatch classes: ghost ports, dead model names, missing chamber-interface methods, object-vs-scalar property collisions, and stale dialect tokens. False positives possible — each finding needs a human eyeball.\n\n`;

md += `## Live listeners (declared ports)\n`;
for (const [p, fs2] of Object.entries(listeners)) md += `- :${p}  (${[...new Set(fs2)].map(x => x.replace(ROOT + path.sep, '')).join(', ')})\n`;
md += `\n## Referenced-but-dead ports\n`;
for (const [p, fs2] of Object.entries(referenced)) if (!livePorts.has(p)) md += `- :${p}\n`;
md += `\n`;

md += `## Chamber interface conformance (summary/breathe/status)\n`;
for (const [field, cls] of Object.entries(chamberMap)) {
  const methods = classMethods[cls] || new Set();
  const missing = CHAMBER_METHODS.filter(m => !methods.has(m));
  md += `- ${field} -> ${cls}: ${missing.length ? 'MISSING ' + missing.join(',') : 'OK'}\n`;
}
md += `\n`;

md += `## Findings (by severity)\n`;
for (const sev of ['HIGH', 'MED', 'LOW']) {
  md += `\n### ${sev}\n`;
  findings.filter(f => f.sev === sev).forEach(f => {
    md += `- [${f.cat}] ${f.file}:${f.line} — ${f.msg}\n`;
  });
}

md += `\n## Proposed canonical contract (lingua franca)\n`;
md += `- **Chamber interface**: every chamber implements \`summary(): string\`, \`breathe(cycle)\`, \`status(): object\`. No caller reaches into chamber internals (e.g. \`.will\`).\n`;
md += `- **Will shape**: \`agentic_will.will\` is ALWAYS the AgenticWill object; will strength is \`agentic_will.will.will_strength\` (number). Never overwrite \`.will\` with a scalar.\n`;
md += `- **Brain**: \`brain.think(prompt, context)\` where context is a plain object. Model must be in the OmniRoute whitelist.\n`;
md += `- **Ports**: live = :3001 (MCP, CPL), :3002 (thought stream), :4000 (SCRIBE), :20128 (OmniRoute). :61998 / :9001 are dead dialects.\n`;
md += `- **Auth**: :3001/mcp/health is open; /status and /memories require header \`x-api-key: gsk-mcp-key-dev\`.\n`;

const outPath = path.join(__dirname, 'contract_audit_report.md');
fs.writeFileSync(outPath, md);
console.log(`Wrote ${outPath}`);
console.log(`Files: ${files.length} | Findings: ${findings.length} (HIGH ${bySev.HIGH}, MED ${bySev.MED}, LOW ${bySev.LOW})`);
const top = findings.filter(f => f.sev === 'HIGH').slice(0, 12);
if (top.length) { console.log('\nTOP HIGH findings:'); top.forEach(f => console.log(`  [${f.cat}] ${f.file}:${f.line} — ${f.msg}`)); }
