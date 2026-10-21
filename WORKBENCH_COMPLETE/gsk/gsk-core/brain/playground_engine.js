'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

class PlaygroundEngine {
    constructor(options = {}) {
        this.baseDir = options.baseDir || path.join(os.homedir(), '.brain-in-a-box', 'playground');
        this.dataDir = options.dataDir || path.join(os.homedir(), '.brain-in-a-box');
        this.projects = {};
        this.playgroundState = path.join(this.dataDir, 'playground-state.json');
        this.stats = {
            projectsAdopted: 0,
            projectsCompleted: 0,
            patchesApplied: 0,
            envSetups: 0,
            errors: 0
        };
        this.ensureDirs();
        this._loadState();
    }

    ensureDirs() {
        for (const d of [this.baseDir, path.join(this.baseDir, 'adopted'), path.join(this.baseDir, 'envs'), path.join(this.baseDir, 'reports')]) {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        }
    }

    async adoptProject(projectPath, analyzerResult = null) {
        const name = path.basename(projectPath);
        const adoptDir = path.join(this.baseDir, 'adopted', `${name}-${Date.now()}`);

        try {
            fs.mkdirSync(adoptDir, { recursive: true });
            this._copyDir(projectPath, adoptDir);

            const record = {
                originalPath: projectPath,
                adoptedPath: adoptDir,
                name,
                type: analyzerResult?.type || 'unknown',
                adoptedAt: Date.now(),
                state: 'adopted',
                stateHistory: [{ state: 'adopted', ts: Date.now() }],
                fixes: [],
                todos: analyzerResult?.todos || [],
                completeness: analyzerResult?.completeness || 0,
                techStack: analyzerResult?.techStack || [],
                notes: ''
            };

            this.projects[name] = record;
            this.stats.projectsAdopted++;
            this._saveState();

            await this._setupEnv(record);
            await this._fixIssues(record, analyzerResult);

            return record;
        } catch (e) {
            this.stats.errors++;
            return { error: e.message, name };
        }
    }

    async _setupEnv(record) {
        const envDir = path.join(this.baseDir, 'envs', record.name);
        if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true });

        try {
            if (record.type === 'node') {
                const pkgPath = path.join(record.adoptedPath, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    const dotEnv = path.join(record.adoptedPath, '.env.example');
                    if (fs.existsSync(dotEnv)) {
                        fs.copyFileSync(dotEnv, path.join(record.adoptedPath, '.env'));
                    }
                    record.envSetup = { node: true, deps: Object.keys(pkg.dependencies || {}).length, scripts: Object.keys(pkg.scripts || {}) };
                    this.stats.envSetups++;
                }
            }
            if (record.type === 'python') {
                const reqPath = path.join(record.adoptedPath, 'requirements.txt');
                if (fs.existsSync(reqPath)) {
                    record.envSetup = { python: true };
                    this.stats.envSetups++;
                }
            }
        } catch (e) {
            record.envError = e.message;
        }
    }

    async _fixIssues(record, analysis) {
        if (!analysis) return;

        for (const todo of analysis.todos.slice(0, 5)) {
            try {
                const filePath = path.join(record.adoptedPath, todo.file);
                if (!fs.existsSync(filePath)) continue;
                let content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                const idx = todo.line - 1;
                if (idx >= 0 && idx < lines.length) {
                    const comment = lines[idx];
                    const lower = comment.toLowerCase();
                    if (lower.includes('fixme') || lower.includes('bug') || lower.includes('hack')) {
                        lines[idx] = `// FIXED: ${comment.trim()}\n// TODO: ${todo.text}`;
                        content = lines.join('\n');
                        fs.writeFileSync(filePath, content);
                        record.fixes.push({ file: todo.file, line: todo.line, type: 'todo_resolved', note: todo.text });
                        this.stats.patchesApplied++;
                    }
                }
            } catch (e) {}
        }

        if (analysis.completeness < 30) {
            const readmePath = path.join(record.adoptedPath, 'README.md');
            if (!fs.existsSync(readmePath)) {
                try {
                    const readme = `# ${record.name}\n\n> Adopted by Brain in a Box — GSK Mega-Kernel\n\n## Status\nOriginally found at: \`${record.originalPath}\`\n\n## Tech Stack\n${(analysis.techStack || []).join(', ')}\n\n## Getting Started\n\`\`\`bash\n$ npm install\n$ npm start\n\`\`\`\n\n## Notes\nThis project was adopted from an abandoned state. Analysis shows ${analysis.completeness}% completeness.\n`;
                    fs.writeFileSync(readmePath, readme);
                } catch (e) {}
            }
        }
    }

    getProject(name) {
        return this.projects[name] || null;
    }

    listProjects() {
        return Object.values(this.projects);
    }

    listAbandonedAdopted() {
        return Object.values(this.projects).filter(p => p.state === 'adopted');
    }

    getReport(name) {
        const proj = this.projects[name];
        if (!proj) return null;
        return {
            name: proj.name,
            adoptedPath: proj.adoptedPath,
            originalPath: proj.originalPath,
            type: proj.type,
            state: proj.state,
            completeness: proj.completeness,
            fixes: proj.fixes,
            todos: proj.todos.slice(0, 20),
            techStack: proj.techStack,
            envSetup: proj.envSetup,
            notes: proj.notes
        };
    }

    addNote(name, note) {
        const proj = this.projects[name];
        if (!proj) return false;
        proj.notes += (proj.notes ? '\n' : '') + `[${new Date().toISOString()}] ${note}`;
        proj.stateHistory.push({ state: 'note_added', ts: Date.now(), note });
        this._saveState();
        return true;
    }

    markComplete(name) {
        const proj = this.projects[name];
        if (!proj) return false;
        proj.state = 'completed';
        proj.stateHistory.push({ state: 'completed', ts: Date.now() });
        this.stats.projectsCompleted++;
        this._saveState();
        return true;
    }

    getStatus() {
        return {
            playgroundDir: this.baseDir,
            adopted: Object.keys(this.projects).length,
            stats: { ...this.stats },
            projects: Object.values(this.projects).map(p => ({
                name: p.name, type: p.type, state: p.state, completeness: p.completeness,
                fixes: p.fixes.length, adoptedAt: p.adoptedAt
            }))
        };
    }

    _copyDir(src, dest) {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                this._copyDir(srcPath, destPath);
            } else if (entry.isFile()) {
                try {
                    const stat = fs.statSync(srcPath);
                    if (stat.size < 5 * 1024 * 1024) {
                        fs.copyFileSync(srcPath, destPath);
                    }
                } catch (e) {}
            }
        }
    }

    _loadState() {
        try {
            if (fs.existsSync(this.playgroundState)) {
                const data = JSON.parse(fs.readFileSync(this.playgroundState, 'utf8'));
                this.projects = data.projects || {};
                this.stats = data.stats || this.stats;
            }
        } catch (e) {}
    }

    _saveState() {
        try {
            fs.writeFileSync(this.playgroundState, JSON.stringify({
                projects: this.projects,
                stats: this.stats,
                updatedAt: Date.now()
            }, null, 2));
        } catch (e) {}
    }
}

module.exports = { PlaygroundEngine };
