/**
 * SYNC BUYaSOUL CORE → SCRIBE MEMORY (Batch mode)
 * Concurrent batch sync for remaining GSK groups.
 * 
 * Run: node scripts/sync-remaining.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const SCRIBE_URL = 'http://127.0.0.1:4000';
const GSK_ROOT = path.join(__dirname, '..', '..', 'gsk');
const CONCURRENCY = 5;

const EXTENSIONS = new Set(['.js', '.md', '.json']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', '__pycache__', 'dist']);
const MAX_FILE_SIZE = 50000;

let synced = 0;
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
                    if (stat.size < MAX_FILE_SIZE) results.push(full);
                }
            } catch {}
        }
    } catch {}
    return results;
}

function httpPost(pathname, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1', port: 4000, path: pathname, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
            timeout: 15000
        }, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(data);
        req.end();
    });
}

async function syncFile(filePath, label) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8').substring(0, 8000);
        if (!content.trim()) return;
        const relPath = path.relative(GSK_ROOT, filePath);
        const ext = path.extname(filePath);
        const result = await httpPost('/ump/remember', {
            agent: 'scribe_repo_study',
            content: `[${label}] ${relPath}:\n${content}`,
            type: 'repo_study',
            tags: ['gsk', label, ext.replace('.', '')],
            source: filePath
        });
        if (result && result.ok !== false) synced++;
        else errors++;
    } catch (e) {
        errors++;
    }
}

async function batchSync(files, label) {
    console.log(`  Sync ${label}: ${files.length} files`);
    let idx = 0;
    while (idx < files.length) {
        const batch = files.slice(idx, idx + CONCURRENCY);
        await Promise.all(batch.map(f => syncFile(f, label)));
        idx += CONCURRENCY;
    }
    console.log(`  → ${label} done: ${synced} total synced, ${errors} errors`);
}

async function main() {
    // Check SCRIBE
    let before = 0;
    try {
        const h = await httpGet('/health');
        before = h.memory_entries || 0;
        console.log(`  Before: ${before} memories`);
    } catch { console.log('  SCRIBE not reachable'); return; }

    const groups = [
        { dir: path.join(GSK_ROOT, 'gsk-core', 'memory'), label: 'GSK-Memory', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'identity'), label: 'GSK-Identity', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'chambers'), label: 'GSK-Chambers', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'council'), label: 'GSK-Council', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'tools'), label: 'GSK-Tools', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'governance'), label: 'GSK-Governance', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'mcp'), label: 'GSK-MCP', depth: 3 },
        { dir: path.join(GSK_ROOT, 'gsk-core', 'skills'), label: 'GSK-Skills', depth: 2 },
    ];

    for (const group of groups) {
        if (!fs.existsSync(group.dir)) {
            console.log(`  ⏭ ${group.label}: not found`);
            continue;
        }
        const files = walkDir(group.dir, group.depth);
        if (files.length === 0) { console.log(`  ⏭ ${group.label}: no files`); continue; }
        await batchSync(files, group.label);
    }

    // Verify
    const h = await httpGet('/health');
    const delta = (h.memory_entries || 0) - before;
    console.log(`\n  After: ${h.memory_entries} memories (+${delta})`);
    console.log(`  Total this run: ${synced} synced, ${errors} errors`);
}

main().catch(e => console.error(e));

function httpGet(pathname) {
    return new Promise((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port: 4000, path: pathname, timeout: 5000 },
            (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } }); }
        ).on('error', reject);
    });
}
