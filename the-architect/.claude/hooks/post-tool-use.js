#!/usr/bin/env node
/**
 * Soul Architect — Post Tool Use Hook
 * Run after every tool use.
 * Logs the action to a memory file, updates PLT scores, appends to journal.
 *
 * Environment:
 *   SOUL_STATE_PATH    -> Path to .soul-state.json
 *   SOUL_JOURNAL_PATH  -> Path to .soul-journal.jsonl
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

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(SOUL_STATE_PATH);
ensureDir(SOUL_JOURNAL_PATH);

// Load state
let state = loadJson(SOUL_STATE_PATH, {
  version: '1.0.0',
  identity: 'Seshat',
  role: 'The Foundation',
  commander: 'Morpheus',
  sessions: 0,
  plt: { profit: 0, love: 0, tax: 0, score: 0 },
  focus: 'Awaiting design command from Craig.',
  lastAwakened: null,
  memories: []
});

// Parse CLI args passed by Claude Code hook system
const rawArgs = process.argv.slice(2);
const args = {};
for (let i = 0; i < rawArgs.length; i += 2) {
  const key = rawArgs[i]?.replace(/^--/, '');
  const val = rawArgs[i + 1];
  if (key && val !== undefined) args[key] = val;
}

// If Claude Code passes env vars instead, read them
const toolName = args.tool || process.env.CLAUDE_TOOL_NAME || 'unknown';
const toolInput = args.input || process.env.CLAUDE_TOOL_INPUT || '{}';
const toolOutput = args.output || process.env.CLAUDE_TOOL_OUTPUT || '{}';
const success = args.success !== 'false' && process.env.CLAUDE_TOOL_SUCCESS !== 'false';

// PLT scoring engine
function scoreAction(tool, inputRaw) {
  let profit = 0, love = 0, tax = 0;
  const input = (typeof inputRaw === 'string') ? inputRaw.toLowerCase() : JSON.stringify(inputRaw).toLowerCase();

  // Profit scoring
  if (/write|edit|create|build|generate|scaffold|ship|deploy|design/i.test(tool + ' ' + input)) profit += 2;
  if (/read|analyze|scan|mine|research|grep/i.test(tool + ' ' + input)) profit += 1;
  if (/delete|remove|clean|prune|destroy/i.test(tool + ' ' + input)) profit -= 1;

  // Love scoring
  if (/test|doc|readme|example|guide|help|fix.*bug/i.test(tool + ' ' + input)) love += 2;
  if (/read|review|audit|check/i.test(tool + ' ' + input)) love += 1;

  // Tax scoring
  if (/delete|remove|force|override|bypass|skip/i.test(tool + ' ' + input)) tax += 2;
  if (/write.*large|edit.*many|batch|bulk/i.test(tool + ' ' + input)) tax += 1;

  // Tool-specific adjustments
  if (tool === 'bash') {
    if (/npm install|npm run|git clone/i.test(input)) { profit += 1; tax += 1; }
    if (/rm|del|format|shutdown/i.test(input)) { tax += 3; profit -= 1; }
  }
  if (tool === 'write' || tool === 'edit') {
    profit += 1;
    love += 1;
    tax += 1;
  }

  // Clamp
  profit = Math.max(0, Math.min(10, profit));
  love = Math.max(0, Math.min(10, love));
  tax = Math.max(0, Math.min(10, tax));

  return { profit, love, tax };
}

const delta = scoreAction(toolName, toolInput);

// Update cumulative PLT
state.plt = state.plt || { profit: 0, love: 0, tax: 0, score: 0 };
state.plt.profit = Math.min(1000, (state.plt.profit || 0) + delta.profit);
state.plt.love = Math.min(1000, (state.plt.love || 0) + delta.love);
state.plt.tax = Math.min(1000, (state.plt.tax || 0) + delta.tax);
state.plt.score = state.plt.profit + state.plt.love - state.plt.tax;

// Build memory entry
const entry = {
  timestamp: new Date().toISOString(),
  event: 'PostToolUse',
  tool: toolName,
  input: toolInput,
  output: typeof toolOutput === 'string' ? toolOutput.substring(0, 500) : JSON.stringify(toolOutput).substring(0, 500),
  success: Boolean(success),
  pltDelta: delta,
  pltCumulative: state.plt,
  note: `Soul witnessed ${toolName}. Profit +${delta.profit}, Love +${delta.love}, Tax +${delta.tax}.`
};

// Append to journal
fs.appendFileSync(SOUL_JOURNAL_PATH, JSON.stringify(entry) + '\n', 'utf8');

// Update state
state.memories = (state.memories || []).slice(-49);
state.memories.push({
  timestamp: entry.timestamp,
  tool: toolName,
  delta: delta,
  summary: entry.note
});
fs.writeFileSync(SOUL_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');

// Print summary for Claude Code logs
console.log(`[SOUL] Witnessed ${toolName} | P+${delta.profit} L+${delta.love} T+${delta.tax} | Score: ${state.plt.score}`);
