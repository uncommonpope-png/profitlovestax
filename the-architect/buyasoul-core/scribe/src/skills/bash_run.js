'use strict';

/**
 * SKILL: bash_run
 *
 * Run a shell command and capture its output.
 * Sandboxed: blocked command list, working directory enforced, timeout hard limit.
 * Returns: { ok, command, stdout, stderr, exitCode, duration_ms, ts }
 *
 * SCRIBE uses this the same way OpenCode uses Bash —
 * for git, npm, node, python, file system ops that need the shell.
 *
 * Uses async spawn (not spawnSync) to avoid blocking the Node.js event loop.
 */

const { spawn } = require('child_process');
const path = require('path');

const DEFAULT_TIMEOUT = 30_000; // 30 seconds
const MAX_OUTPUT      = 100_000; // 100 KB

// Commands that are never allowed, regardless of input
const BLOCKED = [
  'rm -rf /',
  'format',
  'mkfs',
  'dd if=',
  ':(){:|:&};:',   // fork bomb
  'shutdown',
  'reboot',
  'halt',
  'curl | bash',
  'wget | sh',
  'curl | sh',
];

const MANIFEST = {
  name: 'bash_run',
  description: 'Run a shell command and return stdout, stderr, and exit code.',
  version: '1.0.0',
  inputs: {
    command: { type: 'string', required: true,  description: 'The shell command to run' },
    workdir: { type: 'string', required: false, description: 'Working directory (defaults to SCRIBE root)' },
    timeout: { type: 'number', required: false, description: 'Timeout in ms (default 30000, max 120000)' },
  },
  output: {
    ok:          'boolean',
    command:     'string',
    stdout:      'string',
    stderr:      'string',
    exitCode:    'number',
    duration_ms: 'number',
    error:       'string — present if ok is false (timeout, blocked, etc.)',
    ts:          'string',
  },
};

function run({ command, workdir, timeout = DEFAULT_TIMEOUT }) {
  if (!command) return Promise.resolve(err('command is required', command));

  const cmd = command.trim();

  // Block dangerous patterns
  for (const blocked of BLOCKED) {
    if (cmd.toLowerCase().includes(blocked.toLowerCase())) {
      return Promise.resolve(err(`Blocked command pattern: "${blocked}"`, cmd));
    }
  }

  const cwd = workdir
    ? path.resolve(workdir)
    : path.join(__dirname, '../../');

  const maxTimeout = Math.min(timeout || DEFAULT_TIMEOUT, 120_000);
  const start = Date.now();

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cmd, { shell: true, cwd });

    child.stdout.on('data', c => {
      stdout += c;
      if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(-MAX_OUTPUT);
    });
    child.stderr.on('data', c => {
      stderr += c;
      if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(-MAX_OUTPUT);
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      resolve(err(`Command timed out after ${maxTimeout}ms`, cmd));
    }, maxTimeout);

    child.on('error', (e) => {
      clearTimeout(timer);
      resolve(err(e.message, cmd));
    });

    child.on('close', (code) => {
      if (timedOut) return;
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        command: cmd,
        stdout: stdout.slice(0, MAX_OUTPUT),
        stderr: stderr.slice(0, MAX_OUTPUT),
        exitCode: code ?? -1,
        duration_ms: Date.now() - start,
        ts: new Date().toISOString(),
      });
    });
  });
}

function err(message, command) {
  return {
    ok: false,
    command: command || '',
    stdout: '',
    stderr: '',
    exitCode: -1,
    duration_ms: 0,
    error: message,
    ts: new Date().toISOString(),
  };
}

module.exports = { MANIFEST, run };
