/**
 * SYNC BUYaSOUL CORE → SCRIBE MEMORY
 * Walks GSK codebase and posts each file as a memory via /ump/remember.
 * 
 * Run: node scripts/sync-gsk-to-scribe.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const SCRIBE_URL = process.env.SCRIBE_URL || 'http://127.0.0.1:4000';
const GSK_ROOT = path.join(__dirname, '..', '..', 'gsk');

const EXTENSIONS = new Set(['.js', '.md', '.json', '.jsonl', '.yaml', '.yml']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', '__pycache__', 'dist']);
const MAX_FILE_SIZE = 50000; // skip files larger than 50KB
const MAX_FILES = 300;

let synced = 0;
let skipped = 0;
let errors = 0;

function walkDir(dir, maxDepth, currentDepth = 0) {
    const results = [];
    if (currentDepth > maxDepth) return results;
    try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
            if (entry.startsWith('.') || EXCLUDE_DIRS.has(entry)) continue;
            const full = path.join(dir, entry);
            try {
                const stat = fs.statSync(full);
                if (stat.isDirectory()) {
                    results.push(...walkDir(full, maxDepth, currentDepth + 1));
                } else if (EXTENSIONS.has(path.extname(entry))) {
                    if (stat.size < MAX_FILE_SIZE) {
                        results.push(full);
                    }
                }
            } catch {}
        }
    } catch {}
    return results;
}

function httpPost(pathname, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const port = parseInt(SCRIBE_URL.split(':').pop() || '4000', 10);
        const req = http.request({
            hostname: '127.0.0.1',
            port,
            path: pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 15000
        }, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); } catch { resolve({ raw: raw.substring(0, 200) }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(data);
        req.end();
    });
}

function httpGet(pathname) {
    return new Promise((resolve, reject) => {
        const port = parseInt(SCRIBE_URL.split(':').pop() || '4000', 10);
        const req = http.get({
            hostname: '127.0.0.1',
            port,
            path: pathname,
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve({ raw: data.substring(0, 200) }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

async function syncFile(filePath, label) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8').substring(0, 8000);
        if (!content.trim()) { skipped++; return; }

        const relPath = path.relative(GSK_ROOT, filePath);
        const ext = path.extname(filePath);
        const tags = ['gsk', label, ext.replace('.', '')];

        const result = await httpPost('/ump/remember', {
            agent: 'scribe_repo_study',
            content: `[${label}] ${relPath}:\n${content}`,
            type: 'repo_study',
            tags,
            source: filePath,
            metadata: { label, relPath, syncedAt: Date.now() }
        });

        if (result && result.ok !== false) {
            synced++;
        } else {
            errors++;
            console.log(`  ERROR: ${relPath} — ${result?.error || 'unknown'}`);
        }
    } catch (e) {
        errors++;
        const relPath = path.relative(GSK_ROOT, filePath);
        console.log(`  FAIL: ${relPath} — ${e.message.substring(0, 80)}`);
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  SYNC BUYaSOUL CORE → SCRIBE MEMORY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  SCRIBE: ${SCRIBE_URL}`);
    console.log(`  GSK root: ${GSK_ROOT}`);
    console.log('');

    // Check SCRIBE is alive
    try {
        const health = await httpGet('/health');
        console.log(`  SCRIBE health: ${health.status === 'alive' ? '✅' : '❌'} (${health.skills_loaded} skills, ${health.memory_entries} memories)`);
        if (health.status !== 'alive') { console.log('  Aborting: SCRIBE not healthy'); return; }
    } catch (e) {
        console.log(`  SCRIBE not reachable at ${SCRIBE_URL}: ${e.message}`);
        console.log('  Start SCRIBE first: cd final-run && node scribe.js');
        return;
    }

    // Sync groups
    const groups = [
        { dir: GSK_ROOT, label: 'GSK-Core', maxDepth: 2 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'brain'), label: 'GSK-Brain', maxDepth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'memory'), label: 'GSK-Memory', maxDepth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'identity'), label: 'GSK-Identity', maxDepth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'chambers'), label: 'GSK-Chambers', maxDepth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'council'), label: 'GSK-Council', maxDepth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'tools'), label: 'GSK-Tools', maxDepth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'governance'), label: 'GSK-Governance', maxDepth: 3 },
    ];

    let totalFiles = 0;
    for (const group of groups) {
        if (!fs.existsSync(group.dir)) {
            console.log(`  ⏭  ${group.label}: directory not found at ${group.dir}`);
            continue;
        }
        const files = walkDir(group.dir, group.maxDepth).slice(0, MAX_FILES);
        console.log(`  📂 ${group.label}: ${files.length} files`);

        for (const file of files) {
            await syncFile(file, group.label);
        }
        totalFiles += files.length;
    }

    // Sync key top-level files
    const topFiles = [
        path.join(GSK_ROOT, 'fusion-loader.js'),
        path.join(GSK_ROOT, '..', 'index.js'),
        path.join(GSK_ROOT, 'gsk-core', 'memory', 'memory_compiler.js'),
        path.join(GSK_ROOT, 'gsk-core', 'memory', 'narrative_compiler.js'),
        path.join(GSK_ROOT, 'gsk-core', 'memory', 'symbolic_memory.js'),
        path.join(GSK_ROOT, 'gsk-core', 'memory', 'working_memory.js'),
        path.join(GSK_ROOT, 'gsk-core', 'brain', 'scribe_bridge.js'),
        path.join(GSK_ROOT, 'gsk-core', 'identity', 'identity_kernel.js'),
        path.join(GSK_ROOT, 'gsk-core', 'brain', 'perpetual_consciousness.js'),
        path.join(GSK_ROOT, 'gsk-core', 'brain', 'system_prompt_compiler.js'),
    ];

    console.log(`\n  📄 Top-level files: ${topFiles.length}`);
    for (const file of topFiles) {
        if (fs.existsSync(file)) {
            await syncFile(file, 'GSK-Top');
        }
    }
    totalFiles += topFiles.length;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${synced} synced, ${skipped} skipped, ${errors} errors (of ${totalFiles} found)`);
    console.log('═══════════════════════════════════════════════════');
}

main().catch(e => {
    console.error('Script error:', e);
    process.exit(1);
});
