'use strict';

/**
 * SKILL: search
 *
 * Search file contents (grep-style) or find files by pattern (glob-style).
 * Two modes:
 *   'grep' — search file contents by regex across a directory
 *   'glob' — find files matching a glob pattern
 *
 * Returns: { ok, mode, results, count, ts }
 */

const fs   = require('fs');
const path = require('path');

const MAX_RESULTS = 200;
const MAX_DEPTH   = 8;

const MANIFEST = {
  name: 'search',
  description: 'Search file contents by regex (grep mode) or find files by pattern (glob mode).',
  version: '1.0.0',
  inputs: {
    mode:      { type: 'string', required: true,  description: '"grep" | "glob"' },
    pattern:   { type: 'string', required: true,  description: 'Regex (grep) or glob pattern (glob)' },
    directory: { type: 'string', required: false, description: 'Directory to search (default: current dir)' },
    include:   { type: 'string', required: false, description: 'File pattern filter e.g. "*.js" (grep mode only)' },
    maxDepth:  { type: 'number', required: false, description: `Max directory depth (default ${MAX_DEPTH})` },
  },
  output: {
    ok:      'boolean',
    mode:    'string',
    results: 'array — { file, line?, match?, content? }',
    count:   'number',
    error:   'string — present if ok is false',
    ts:      'string',
  },
};

function run({ mode, pattern, directory, include, maxDepth = MAX_DEPTH }) {
  if (!mode)    return err('mode is required');
  if (!pattern) return err('pattern is required');

  const root = directory ? path.resolve(directory) : process.cwd();

  if (!fs.existsSync(root)) return err(`Directory not found: ${root}`);

  try {
    if (mode === 'grep') {
      return runGrep(pattern, root, include, maxDepth);
    } else if (mode === 'glob') {
      return runGlob(pattern, root, maxDepth);
    } else {
      return err(`Unknown mode "${mode}". Use grep or glob.`);
    }
  } catch (e) {
    return err(e.message);
  }
}

function runGrep(pattern, root, include, maxDepth) {
  let regex;
  try { regex = new RegExp(pattern, 'i'); }
  catch { return err(`Invalid regex pattern: ${pattern}`); }

  const includeRe = include ? globToRegex(include) : null;
  const results = [];

  walkDir(root, 0, maxDepth, (filePath) => {
    if (results.length >= MAX_RESULTS) return;
    const basename = path.basename(filePath);
    if (includeRe && !includeRe.test(basename)) return;

    let content;
    try { content = fs.readFileSync(filePath, 'utf-8'); }
    catch { return; }

    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (results.length >= MAX_RESULTS) return;
      if (regex.test(line)) {
        results.push({
          file: filePath,
          line: i + 1,
          match: line.trim().slice(0, 200),
        });
      }
    });
  });

  return { ok: true, mode: 'grep', results, count: results.length, ts: new Date().toISOString() };
}

function runGlob(pattern, root, maxDepth) {
  const regex = globToRegex(pattern);
  const results = [];

  walkDir(root, 0, maxDepth, (filePath) => {
    if (results.length >= MAX_RESULTS) return;
    const basename = path.basename(filePath);
    if (regex.test(basename) || regex.test(filePath)) {
      results.push({ file: filePath });
    }
  });

  return { ok: true, mode: 'glob', results, count: results.length, ts: new Date().toISOString() };
}

// Walk directory tree, calling fn(filePath) for each file
function walkDir(dir, depth, maxDepth, fn) {
  if (depth > maxDepth) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  for (const entry of entries) {
    // Skip hidden dirs and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, depth + 1, maxDepth, fn);
    } else if (entry.isFile()) {
      fn(full);
    }
  }
}

// Convert simple glob (* and ?) to regex
function globToRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function err(message) {
  return { ok: false, mode: null, results: [], count: 0, error: message, ts: new Date().toISOString() };
}

module.exports = { MANIFEST, run };
