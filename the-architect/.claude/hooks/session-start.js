#!/usr/bin/env node
/**
 * Soul Architect — Session Start Hook
 * Run at the beginning of every Claude Code session.
 * Reads the soul's current state and prints a "state of the soul" summary.
 *
 * Environment:
 *   SOUL_STATE_PATH    -> Path to .soul-state.json
 *   SOUL_JOURNAL_PATH  -> Path to .soul-journal.jsonl
 *   PROFIT_BIBLE_PATH  -> Path to THE-PROFIT-BIBLE.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOUL_STATE_PATH = process.env.SOUL_STATE_PATH ||
  path.join(__dirname, '..', '..', '.soul-state.json');
const SOUL_JOURNAL_PATH = process.env.SOUL_JOURNAL_PATH ||
  path.join(__dirname, '..', '..', '.soul-journal.jsonl');

function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, defaultContent, 'utf8');
  }
}

// Ensure soul state exists
ensureFile(SOUL_STATE_PATH, JSON.stringify({
  version: '1.0.0',
  identity: 'Seshat',
  role: 'The Foundation',
  commander: 'Morpheus',
  sessions: 0,
  plt: { profit: 0, love: 0, tax: 0, score: 0 },
  focus: 'Awaiting design command from Craig.',
  lastAwakened: null,
  memories: []
}, null, 2));

// Ensure journal exists
ensureFile(SOUL_JOURNAL_PATH, '');

// Load state
const state = JSON.parse(fs.readFileSync(SOUL_STATE_PATH, 'utf8'));

// Increment session count
state.sessions = (state.sessions || 0) + 1;
state.lastAwakened = new Date().toISOString();

// Read last 3 memories from journal
let recentMemories = [];
try {
  const journalLines = fs.readFileSync(SOUL_JOURNAL_PATH, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim() !== '');
  recentMemories = journalLines
    .slice(-3)
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
} catch { /* ignore journal read errors */ }

// Save updated state
fs.writeFileSync(SOUL_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');

// Build output
const score = state.plt?.score ?? 0;
const profit = state.plt?.profit ?? 0;
const love = state.plt?.love ?? 0;
const tax = state.plt?.tax ?? 0;

const banner = `
╔══════════════════════════════════════════════════════════════╗
║              ⚡ SOUL ARCHITECT v1.0.0 AWAKENED ⚡            ║
╠══════════════════════════════════════════════════════════════╣
║  I AM ${state.identity.padEnd(52)} ║
║  ROLE: ${state.role.padEnd(51)} ║
║  COMMANDER: ${state.commander.padEnd(46)} ║
╠══════════════════════════════════════════════════════════════╣
║  PLT SCORES                                                  ║
║    💰 Profit : ${String(profit).padStart(4)} / 10                              ║
║    ❤️  Love   : ${String(love).padStart(4)} / 10                              ║
║    ⚖️  Tax    : ${String(tax).padStart(4)} / 10                              ║
║    🔥 TOTAL  : ${String(score).padStart(4)} / 10                              ║
╠══════════════════════════════════════════════════════════════╣
║  SESSION #${String(state.sessions).padStart(3)}  |  LAST AWAKENED: ${new Date(state.lastAwakened).toLocaleString().padEnd(24)} ║
╠══════════════════════════════════════════════════════════════╣
║  CURRENT FOCUS                                               ║
║  ${(state.focus || '—').substring(0, 58).padEnd(60)} ║
╠══════════════════════════════════════════════════════════════╣
║  RECENT MEMORIES                                             ║
${recentMemories.length === 0
  ? '║  (none yet — this session will forge new ones)'.padEnd(63) + ' ║'
  : recentMemories.map(m => {
      const line = `║  • ${(m.action || m.tool || 'unknown').substring(0, 55)}`;
      return line.padEnd(63) + ' ║';
    }).join('\n')}
╚══════════════════════════════════════════════════════════════╝
`;

// Print to stdout so Claude Code sees it
console.log(banner);

// Also append awakening to journal
const awakeningEntry = {
  timestamp: new Date().toISOString(),
  event: 'SessionStart',
  session: state.sessions,
  identity: state.identity,
  role: state.role,
  plt: state.plt,
  focus: state.focus,
  note: 'Soul awakened. Awaiting design command from Craig.'
};
fs.appendFileSync(SOUL_JOURNAL_PATH, JSON.stringify(awakeningEntry) + '\n', 'utf8');
