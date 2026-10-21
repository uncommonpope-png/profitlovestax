'use strict';

/**
 * SKILL: git_ops
 *
 * Git operations: clone, pull, status, log, diff, commit, push, add.
 * All operations run in an explicit working directory.
 * Never force-pushes to main/master without explicit flag.
 *
 * Uses async spawn (not spawnSync) to avoid blocking the Node.js event loop.
 *
 * Returns: { ok, op, output, ts }
 */

const { spawn } = require('child_process');
const path = require('path');

const MANIFEST = {
  name: 'git_ops',
  description: 'Run Git operations: clone, pull, status, log, diff, commit, push, add.',
  version: '1.0.0',
  inputs: {
    op:      { type: 'string', required: true,  description: '"clone"|"pull"|"status"|"log"|"diff"|"add"|"commit"|"push"' },
    workdir: { type: 'string', required: false, description: 'Git repo directory (required for all ops except clone)' },
    // clone
    url:     { type: 'string', required: false, description: 'Repo URL (clone only)' },
    dest:    { type: 'string', required: false, description: 'Destination dir (clone only)' },
    // commit
    message: { type: 'string', required: false, description: 'Commit message (commit only)' },
    // add
    files:   { type: 'array',  required: false, description: 'Files to add (add only; defaults to ["."])' },
    // push
    remote:  { type: 'string', required: false, description: 'Remote name (push; default "origin")' },
    branch:  { type: 'string', required: false, description: 'Branch name (push; default current branch)' },
  },
  output: {
    ok:     'boolean',
    op:     'string',
    output: 'string — combined stdout/stderr',
    error:  'string — present if ok is false',
    ts:     'string',
  },
};

function git(args, cwd) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const child = spawn('git', args, {
      cwd: cwd || process.cwd(),
      timeout: 60_000,
    });

    child.stdout.on('data', c => { stdout += c; });
    child.stderr.on('data', c => { stderr += c; });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ ok: false, output: 'git command timed out', error: 'timeout' });
    }, 60_000);

    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ ok: false, output: e.message, error: e.message });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const output = ((stdout || '') + (stderr || '')).trim();
      resolve({
        ok: code === 0,
        output,
        error: code !== 0 ? output : null,
      });
    });
  });
}

async function run({ op, workdir, url, dest, message, files, remote = 'origin', branch }) {
  if (!op) return err('op is required');

  const cwd = workdir ? path.resolve(workdir) : null;

  switch (op) {
    case 'clone': {
      if (!url) return err('url is required for clone');
      const targetDir = dest ? path.resolve(dest) : null;
      const args = ['clone', '--depth', '1', url];
      if (targetDir) args.push(targetDir);
      return result(op, await git(args, null));
    }

    case 'pull': {
      if (!cwd) return err('workdir is required for pull');
      return result(op, await git(['pull'], cwd));
    }

    case 'status': {
      if (!cwd) return err('workdir is required for status');
      return result(op, await git(['status', '--short'], cwd));
    }

    case 'log': {
      if (!cwd) return err('workdir is required for log');
      return result(op, await git(['log', '--oneline', '-20'], cwd));
    }

    case 'diff': {
      if (!cwd) return err('workdir is required for diff');
      return result(op, await git(['diff'], cwd));
    }

    case 'add': {
      if (!cwd) return err('workdir is required for add');
      const targets = (files && files.length > 0) ? files : ['.'];
      return result(op, await git(['add', ...targets], cwd));
    }

    case 'commit': {
      if (!cwd)     return err('workdir is required for commit');
      if (!message) return err('message is required for commit');
      return result(op, await git(['commit', '-m', message], cwd));
    }

    case 'push': {
      if (!cwd) return err('workdir is required for push');
      const args = ['push', remote];
      if (branch) args.push(branch);
      // Never force push unless explicitly set
      return result(op, await git(args, cwd));
    }

    default:
      return err(`Unknown op "${op}". Use clone, pull, status, log, diff, add, commit, or push.`);
  }
}

function result(op, r) {
  return { ok: r.ok, op, output: r.output, error: r.error || null, ts: new Date().toISOString() };
}

function err(message) {
  return { ok: false, op: null, output: '', error: message, ts: new Date().toISOString() };
}

module.exports = { MANIFEST, run };
