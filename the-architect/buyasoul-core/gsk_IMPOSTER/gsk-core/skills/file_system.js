'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.6, love: 0.2, tax: 0.2 };

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
    
    return { skill: 'file_system', plt_affinity: PLT_AFFINITY, error: `Unknown action: ${action}`, available: ['list_dir', 'read_file', 'write_file', 'search_files'], timestamp: Date.now() };
}

module.exports = { skill_file_system };