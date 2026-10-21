#!/usr/bin/env node
/**
 * claude/gsk-build-task.mjs
 *
 * Wrapper for Craig/Claude to hand GSK a build task directly.
 * Invokes direct-build.js with structured input.
 *
 * Usage from Claude Code:
 *   await spawn('node', ['claude/gsk-build-task.mjs', '--task', '...', '--project', '...'])
 *
 * Or from CLI:
 *   node claude/gsk-build-task.mjs --task "Build X" --project "C:\path"
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

function runDirectBuild(args) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['direct-build.js', ...args], {
            cwd: ROOT,
            stdio: ['inherit', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', d => { stdout += d.toString(); });
        child.stderr.on('data', d => { stderr += d.toString(); });

        child.on('close', code => {
            if (code === 0) resolve(stdout);
            else reject(new Error(`Exit ${code}: ${stderr || stdout}`));
        });

        child.on('error', reject);
    });
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
GSK Build Task — hand GSK a build task from Claude/Craig

Usage:
  node claude/gsk-build-task.mjs --task "Build X" --project "C:\\path" [options]

Options:
  --task <string>        Description of what to build (required)
  --project <path>       Project root path (required)
  --mode <str>           autonomous | guided | interactive (default: autonomous)
  --approvals <str>      auto | hitl | none (default: auto)
  --priority <str>       low | normal | high | critical (default: normal)
  --timeout <ms>         Timeout in ms (default: 600000)
  --json <json>          Pass entire task as JSON object

Examples:
  # Build a new RTS unit in CPL
  node claude/gsk-build-task.mjs --task "Add cavalry unit to RTS engine" --project "C:\\Users\\uncom\\Desktop\\buyasoul-cpl-fresh"

  # Fix a specific bug
  node claude/gsk-build-task.mjs --task "Fix fog-of-war rendering bug in rts-fog-of-war.js" --project "C:\\Users\\uncom\\Desktop\\buyasoul-cpl-fresh" --approvals hitl

  # JSON mode for complex tasks
  node claude/gsk-build-task.mjs --json '{"task":"Refactor merchant stall system","project":"C:\\\\path","mode":"guided","approvals":"auto","context":{"files":["src/merchant.js"]}}'
`);
        return;
    }

    try {
        const output = await runDirectBuild(args);
        console.log(output);
    } catch (e) {
        console.error('[gsk-build-task] Error:', e.message);
        process.exit(1);
    }
}

main();