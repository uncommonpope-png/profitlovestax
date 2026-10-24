module.exports.MANIFEST = {
    name: 'file_system',
    description: 'Skill: file_system',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PLT_AFFINITY = { profit: 0.6, love: 0.2, tax: 0.2 };

// ── GUARDED EDITS (Steal List #4, 2026-10-23 — SWE-agent's ACI
// lesson: the interface is the performance. Purpose-built guarded
// edit instead of raw writes):
//   - PATH ALLOWLIST: the target must resolve INSIDE this tree
//     (TREE_ROOT = the itsus-test working tree). Outside writes
//     are refused unless the caller passes allowOutside:true — an
//     explicit flag, never a default.
//   - EXACT-MATCH REPLACE: old_text must occur exactly once
//     (or pass replaceAll:true); a missing or ambiguous anchor is
//     a refusal, not a guess.
//   - SYNTAX GUARD: for .js/.cjs/.mjs targets the post-edit source
//     must compile (vm.Script — parsed, never executed) or the
//     edit is refused BEFORE it lands.
//   - DIFF CAPTURED: the result carries the line diff (added /
//     removed lines + counts) so the caller — and the trace — see
//     exactly what changed.
//   - ATOMIC LANDING: tmp + rename, the chamber-store discipline.
const TREE_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
let _trace = null;
try { _trace = require('../brain/event_trace.js').trace; } catch { _trace = null; }

function _lineDiff(before, after) {
    const a = before.split('\n'), b = after.split('\n');
    // LCS length via DP, capped — huge files fall back to counts.
    if (a.length * b.length <= 4_000_000) {
        const dp = new Uint32Array(b.length + 1);
        for (let i = a.length - 1; i >= 0; i--) {
            let prevDiag = 0;
            for (let j = b.length - 1; j >= 0; j--) {
                const t = dp[j];
                dp[j] = a[i] === b[j] ? prevDiag + 1 : Math.max(dp[j], dp[j + 1]);
                prevDiag = t;
            }
        }
        const common = dp[0];
        return { addedCount: b.length - common, removedCount: a.length - common, exact: true };
    }
    const setA = new Set(a), setB = new Set(b);
    return {
        addedCount: b.filter(l => !setA.has(l)).length,
        removedCount: a.filter(l => !setB.has(l)).length,
        exact: false,
    };
}

function _editGuarded(input) {
    const base = { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'edit_guarded', timestamp: Date.now() };
    if (!input.path || typeof input.old_text !== 'string' || typeof input.new_text !== 'string') {
        return { ...base, success: false, error: 'bad_input', detail: 'edit_guarded requires path, old_text (string) and new_text (string)' };
    }
    const target = path.resolve(String(input.path));
    const insideTree = target === TREE_ROOT || target.startsWith(TREE_ROOT + path.sep);
    if (!insideTree && input.allowOutside !== true) {
        return { ...base, success: false, error: 'outside_tree_refused', path: target, detail: `resolved path is OUTSIDE the tree (${TREE_ROOT}) and allowOutside was not set — refused. Pass allowOutside:true only as a deliberate, explicit act.` };
    }
    let before;
    try { before = fs.readFileSync(target, 'utf8'); }
    catch (e) { return { ...base, success: false, error: 'read_failed', path: target, detail: e.message }; }
    const occurrences = before.split(input.old_text).length - 1;
    if (occurrences === 0) return { ...base, success: false, error: 'old_text_not_found', path: target, detail: 'old_text does not occur in the file — nothing was changed' };
    if (occurrences > 1 && input.replaceAll !== true) return { ...base, success: false, error: 'old_text_ambiguous', path: target, occurrences, detail: `old_text occurs ${occurrences} times; refusing to guess — narrow the anchor or pass replaceAll:true` };
    const after = input.replaceAll === true ? before.split(input.old_text).join(input.new_text) : before.replace(input.old_text, input.new_text);
    if (/\.(js|cjs|mjs)$/i.test(target)) {
        try { new vm.Script(after, { filename: target }); }
        catch (e) { return { ...base, success: false, error: 'syntax_guard_refused', path: target, detail: `post-edit source would not parse: ${String(e.message).slice(0, 200)} — edit NOT landed` }; }
    }
    const diff = _lineDiff(before, after);
    try {
        const tmp = `${target}.tmp-${process.pid}`;
        fs.writeFileSync(tmp, after, 'utf8');
        fs.renameSync(tmp, target);
    } catch (e) { return { ...base, success: false, error: 'write_failed', path: target, detail: e.message }; }
    if (_trace) { try { _trace('skill.file_system', 'edit_guarded', { path: target, insideTree, added: diff.addedCount, removed: diff.removedCount }, {}); } catch { /* witness, never a gate */ } }
    return { ...base, success: true, path: target, insideTree, replacements: input.replaceAll === true ? occurrences : 1, diff, bytesBefore: Buffer.byteLength(before), bytesAfter: Buffer.byteLength(after) };
}

function skill_file_system(input) {
    const action = input.action || 'list_dir';
    
    if (action === 'list_dir') {
        try {
            const targetPath = input.path || '.';
            const entries = fs.readdirSync(targetPath, { withFileTypes: true });
            const items = entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' }));
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'list_dir', path: targetPath, items, count: items.length, timestamp: Date.now() };
        } catch (e) {
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'list_dir', error: e.message, timestamp: Date.now() };
        }
    }
    
    if (action === 'read_file') {
        try {
            const content = fs.readFileSync(input.path, 'utf8');
            const stats = fs.statSync(input.path);
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'read_file', path: input.path, content, size: stats.size, lines: content.split('\n').length, timestamp: Date.now() };
        } catch (e) {
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'read_file', error: e.message, timestamp: Date.now() };
        }
    }
    
    if (action === 'write_file') {
        try {
            const dir = path.dirname(input.path);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(input.path, input.content, 'utf8');
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'write_file', path: input.path, success: true, timestamp: Date.now() };
        } catch (e) {
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'write_file', error: e.message, timestamp: Date.now() };
        }
    }
    
    if (action === 'search_files') {
        try {
            const pattern = new RegExp(input.pattern, 'i');
            const results = [];
            const searchDir = (dir) => {
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const entry of entries) {
                        const fullPath = path.join(dir, entry.name);
                        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                            searchDir(fullPath);
                        } else if (pattern.test(entry.name)) {
                            results.push({ file: fullPath });
                        }
                    }
                } catch (e) {}
            };
            searchDir(input.path || '.');
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'search_files', pattern: input.pattern, results, count: results.length, timestamp: Date.now() };
        } catch (e) {
            return { skill: 'file_system', plt_affinity: PLT_AFFINITY, action: 'search_files', error: e.message, timestamp: Date.now() };
        }
    }
    
    if (action === 'edit_guarded') {
        return _editGuarded(input);
    }

    return { skill: 'file_system', plt_affinity: PLT_AFFINITY, error: `Unknown action: ${action}`, available: ['list_dir', 'read_file', 'write_file', 'search_files', 'edit_guarded'], timestamp: Date.now() };
}

module.exports = { skill_file_system };
