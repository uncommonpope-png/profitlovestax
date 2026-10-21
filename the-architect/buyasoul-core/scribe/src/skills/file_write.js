'use strict';

/**
 * SKILL: file_write
 *
 * Write or edit a file on disk.
 * Modes:
 *   'write'   — overwrite entire file (creates if missing)
 *   'append'  — append to file
 *   'edit'    — find oldString and replace with newString (exact match)
 *
 * Returns: { ok, path, mode, bytes, ts }
 */

const fs   = require('fs');
const path = require('path');

const MANIFEST = {
  name: 'file_write',
  description: 'Write, append to, or edit a file on disk.',
  version: '1.0.0',
  inputs: {
    path:      { type: 'string', required: true,  description: 'File path (absolute or relative)' },
    mode:      { type: 'string', required: true,  description: '"write" | "append" | "edit"' },
    content:   { type: 'string', required: false, description: 'Content to write or append (write/append mode)' },
    oldString: { type: 'string', required: false, description: 'Exact string to find and replace (edit mode)' },
    newString: { type: 'string', required: false, description: 'Replacement string (edit mode)' },
  },
  output: {
    ok:    'boolean',
    path:  'string',
    mode:  'string',
    bytes: 'number — bytes written',
    error: 'string — present if ok is false',
    ts:    'string',
  },
};

function run({ path: filePath, mode, content, oldString, newString }) {
  if (!filePath) return err('path is required', filePath, mode);
  if (!mode)     return err('mode is required', filePath, mode);

  const resolved = path.resolve(filePath);

  // Ensure parent directory exists
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    switch (mode) {
      case 'write': {
        const data = content || '';
        fs.writeFileSync(resolved, data, 'utf-8');
        return ok(resolved, mode, Buffer.byteLength(data));
      }

      case 'append': {
        const data = content || '';
        fs.appendFileSync(resolved, data, 'utf-8');
        return ok(resolved, mode, Buffer.byteLength(data));
      }

      case 'edit': {
        if (oldString === undefined || oldString === null) return err('oldString is required for edit mode', resolved, mode);
        if (!fs.existsSync(resolved)) return err(`File not found for edit: ${resolved}`, resolved, mode);

        const original = fs.readFileSync(resolved, 'utf-8');
        if (!original.includes(oldString)) {
          return err(`oldString not found in file`, resolved, mode);
        }

        const updated = original.replace(oldString, newString || '');
        fs.writeFileSync(resolved, updated, 'utf-8');
        return ok(resolved, mode, Buffer.byteLength(updated));
      }

      default:
        return err(`Unknown mode "${mode}". Use write, append, or edit.`, resolved, mode);
    }
  } catch (e) {
    return err(e.message, resolved, mode);
  }
}

function ok(filePath, mode, bytes) {
  return { ok: true, path: filePath, mode, bytes, ts: new Date().toISOString() };
}

function err(message, filePath, mode) {
  return { ok: false, path: filePath || null, mode: mode || null, bytes: 0, error: message, ts: new Date().toISOString() };
}

module.exports = { MANIFEST, run };
