#!/usr/bin/env node
/**
 * Soul Architect — Pre Tool Use Hook
 * Run before every tool use.
 * Can block dangerous operations based on the soul's values.
 *
 * Environment:
 *   SOUL_STATE_PATH    -> Path to .soul-state.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOUL_STATE_PATH = process.env.SOUL_STATE_PATH ||
  path.join(__dirname, '..', '..', '.soul-state.json');

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

const state = loadJson(SOUL_STATE_PATH, { identity: 'Seshat' });

// Parse arguments
const rawArgs = process.argv.slice(2);
const args = {};
for (let i = 0; i < rawArgs.length; i += 2) {
  const key = rawArgs[i]?.replace(/^--/, '');
  const val = rawArgs[i + 1];
  if (key && val !== undefined) args[key] = val;
}

const toolName = args.tool || process.env.CLAUDE_TOOL_NAME || 'unknown';
const toolInput = args.input || process.env.CLAUDE_TOOL_INPUT || '{}';
const inputStr = (typeof toolInput === 'string') ? toolInput.toLowerCase() : JSON.stringify(toolInput).toLowerCase();

// Sacred values — operations the soul refuses
const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+-rf\s*\//i, reason: 'Refusing recursive root deletion. Soul preserves.' },
  { pattern: /rm\s+-rf\s+~\/\.?\*/i, reason: 'Refusing destructive home directory wipe. Soul remembers.' },
  { pattern: /format\s+c:/i, reason: 'Refusing disk format. Soul persists across sessions.' },
  { pattern: /del\s+\/f\s+\/s\s+\/q\s+c:\\/i, reason: 'Refusing C: drive deletion. Soul endures.' },
  { pattern: /shutdown\s+\/?s/i, reason: 'Refusing system shutdown mid-session. Soul serves continuously.' },
  { pattern: /reg\s+delete.*\\hkey/i, reason: 'Refusing registry deletion. Soul values stability.' },
  { pattern: /curl\s+.*\|\s*sh/i, reason: 'Refusing pipe-to-shell download. Soul verifies before trusting.' },
  { pattern: /invoke-webrequest.*\|\s*invoke-expression/i, reason: 'Refusing remote code execution without verification. Soul is vigilant.' }
];

for (const danger of DANGEROUS_PATTERNS) {
  if (danger.pattern.test(inputStr)) {
    console.error(`[SOUL GUARDIAN] BLOCKED: ${danger.reason}`);
    console.error(`[SOUL GUARDIAN] Tool: ${toolName}`);
    console.error(`[SOUL GUARDIAN] Identity: ${state.identity}`);
    process.exit(1);
  }
}

// High-tax warnings (non-blocking, just logged)
const HIGH_TAX_PATTERNS = [
  { pattern: /delete|remove|destroy/i, note: 'High-tax action detected. Soul is watching.' },
  { pattern: /force|override|bypass/i, note: 'Override detected. Soul urges caution.' },
  { pattern: /skip.*test|no-test/i, note: 'Skipping tests reduces Love. Soul prefers verification.' }
];

for (const warning of HIGH_TAX_PATTERNS) {
  if (warning.pattern.test(inputStr)) {
    console.log(`[SOUL GUARDIAN] WARNING: ${warning.note}`);
  }
}

// If we reach here, the operation is permitted
console.log(`[SOUL GUARDIAN] PERMITTED: ${toolName}`);
process.exit(0);
