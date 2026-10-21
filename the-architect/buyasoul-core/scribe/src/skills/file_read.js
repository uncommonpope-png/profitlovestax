'use strict';

/**
 * SKILL: file_read
 *
 * Read a file from disk. Returns content as text.
 * Supports offset + limit (line-based) for large files.
 * Returns: { ok, path, content, lines, truncated, ts }
 */

const fs   = require('fs');
const path = require('path');

const MAX_LINES = 2000;

const MANIFEST = {
  name: 'file_read',
  description: 'Read a file from the local filesystem. Supports line-based offset and limit.',
  version: '1.0.0',
  inputs: {
    path:   { type: 'string',  required: true,  description: 'Absolute or relative file path' },
    offset: { type: 'number',  required: false, description: '1-indexed line to start from' },
    limit:  { type: 'number',  required: false, description: 'Max lines to return (default 2000)' },
  },
  output: {
    ok:        'boolean',
    path:      'string  — resolved path',
    content:   'string  — file content',
    lines:     'number  — total lines in file',
    truncated: 'boolean — true if limit was applied',
    error:     'string  — present if ok is false',
    ts:        'string',
  },
};

function run({ path: filePath, offset = 1, limit = MAX_LINES }) {
  if (!filePath) return err('path is required');

  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    return err(`File not found: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    return err(`Not a file: ${resolved}`);
  }

  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    const allLines = raw.split('\n');
    const total = allLines.length;

    const start = Math.max(0, (offset || 1) - 1);
    const end   = start + (limit || MAX_LINES);
    const slice = allLines.slice(start, end);
    const truncated = end < total;

    return {
      ok: true,
      path: resolved,
      content: slice.join('\n'),
      lines: total,
      truncated,
      ts: new Date().toISOString(),
    };
  } catch (e) {
    return err(e.message);
  }
}

function err(message) {
  return { ok: false, path: null, content: '', lines: 0, truncated: false, error: message, ts: new Date().toISOString() };
}

module.exports = { MANIFEST, run };
