'use strict';

const fs = require('fs');
const path = require('path');

class ProjectAnalyzer {
    constructor(options = {}) {
        this.dataDir = options.dataDir || path.join(require('os').homedir(), '.brain-in-a-box');
        this.analysisCache = path.join(this.dataDir, 'project-analysis.json');
        this.analyses = {};
    }

    async analyze(projectRoot) {
        const result = {
            root: projectRoot,
            name: path.basename(projectRoot),
            type: 'unknown',
            state: 'unknown',
            completeness: 0,
            issues: [],
            nextSteps: [],
            techStack: [],
            buildStatus: null,
            testStatus: null,
            dependencies: { outdated: 0, missing: 0, total: 0 },
            git: null,
            todos: [],
            suggestions: []
        };

        result.type = this._detectType(projectRoot);
        result.techStack = this._detectTechStack(projectRoot, result.type);
        result.state = this._detectState(projectRoot, result);
        result.completeness = this._estimateCompleteness(projectRoot, result);
        result.issues = this._findIssues(projectRoot, result);
        result.todos = this._extractTodos(projectRoot);
        result.dependencies = this._analyzeDependencies(projectRoot, result.type);
        result.git = this._analyzeGit(projectRoot);
        result.buildStatus = this._checkBuild(projectRoot, result.type);
        result.nextSteps = this._generateNextSteps(result);
        result.suggestions = this._generateSuggestions(result);

        this.analyses[projectRoot] = result;
        return result;
    }

    _detectType(root) {
        const markers = {
            'package.json': 'node', 'tsconfig.json': 'node',
            'requirements.txt': 'python', 'setup.py': 'python', 'pyproject.toml': 'python',
            'Cargo.toml': 'rust', 'Cargo.lock': 'rust',
            'go.mod': 'go', 'go.sum': 'go',
            'pom.xml': 'java', 'build.gradle': 'java',
            'CMakeLists.txt': 'cpp', 'Makefile': 'generic',
            'Gemfile': 'ruby', 'Gemfile.lock': 'ruby',
            'composer.json': 'php',
            'mix.exs': 'elixir',
            'stack.yaml': 'haskell', 'package.yaml': 'haskell',
            'index.html': 'html',
        };
        try {
            const entries = fs.readdirSync(root);
            for (const [file, type] of Object.entries(markers)) {
                if (entries.includes(file)) return type;
            }
        } catch (e) {}
        return 'unknown';
    }

    _detectTechStack(root, type) {
        const stack = [type];
        try {
            const entries = fs.readdirSync(root);
            if (entries.includes('Dockerfile')) stack.push('docker');
            if (entries.includes('docker-compose.yml') || entries.includes('docker-compose.yaml')) stack.push('docker-compose');
            if (entries.includes('.github')) stack.push('github-actions');
            if (entries.includes('.gitlab-ci.yml')) stack.push('gitlab-ci');
            if (entries.includes('.travis.yml')) stack.push('travis');
            if (entries.some(e => /\.test\.(js|ts|py|rs)$/.test(e) || /\.spec\.(js|ts)$/.test(e))) stack.push('testing');
            if (type === 'node') {
                const pkg = this._readJson(path.join(root, 'package.json'));
                if (pkg) {
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                    if (deps) {
                        const allDeps = Object.keys(deps);
                        if (allDeps.some(d => d.startsWith('react') || d === 'next')) stack.push('react');
                        if (allDeps.some(d => d.startsWith('vue') || d === 'nuxt')) stack.push('vue');
                        if (allDeps.some(d => d.startsWith('svelte') || d.startsWith('@svelte'))) stack.push('svelte');
                        if (allDeps.some(d => d.startsWith('@angular') || d === 'angular')) stack.push('angular');
                        if (allDeps.includes('express') || allDeps.includes('fastify') || allDeps.includes('koa')) stack.push('backend');
                        if (allDeps.includes('typeorm') || allDeps.includes('prisma') || allDeps.includes('sequelize') || allDeps.includes('mongoose')) stack.push('database');
                        if (allDeps.includes('jest') || allDeps.includes('mocha') || allDeps.includes('vitest')) stack.push('testing');
                        if (allDeps.includes('tailwindcss') || allDeps.includes('bootstrap')) stack.push('css-framework');
                        if (allDeps.includes('webpack') || allDeps.includes('vite') || allDeps.includes('rollup') || allDeps.includes('esbuild')) stack.push('bundler');
                        if (allDeps.includes('electron')) stack.push('electron');
                    }
                }
            }
            if (type === 'python') {
                const req = this._readFile(path.join(root, 'requirements.txt'));
                if (req) {
                    if (req.includes('django') || req.includes('flask') || req.includes('fastapi')) stack.push('web-framework');
                    if (req.includes('numpy') || req.includes('pandas') || req.includes('scikit')) stack.push('data-science');
                    if (req.includes('pytorch') || req.includes('tensorflow')) stack.push('ml');
                    if (req.includes('pytest') || req.includes('unittest')) stack.push('testing');
                }
            }
        } catch (e) {}
        return [...new Set(stack)];
    }

    _detectState(root, analysis) {
        const git = analysis.git;
        if (!git) return 'new_unversioned';
        if (git.totalCommits === 0) return 'just_started';
        if (git.totalCommits < 5) return 'early_development';
        if (git.isAbandoned && (git.daysSinceLastCommit > 180)) return 'abandoned';
        if (git.isAbandoned && (git.daysSinceLastCommit > 30)) return 'stalled';
        if (git.hasUnpushed) return 'unpublished';
        if (analysis.todos.length > 5 && git.daysSinceLastCommit > 7) return 'in_progress_stale';
        return 'active_development';
    }

    _estimateCompleteness(root, analysis) {
        let score = 0;
        if (analysis.git && analysis.git.totalCommits > 0) score += 10;
        if (analysis.git && analysis.git.totalCommits > 10) score += 10;
        if (analysis.git && analysis.git.totalCommits > 50) score += 10;
        if (fs.existsSync(path.join(root, 'README.md'))) score += 10;
        if (fs.existsSync(path.join(root, 'LICENSE'))) score += 5;
        if (analysis.dependencies.total > 0) score += 10;
        if (fs.existsSync(path.join(root, 'tests')) || fs.existsSync(path.join(root, '__tests__'))) score += 10;
        if (fs.existsSync(path.join(root, '.gitignore'))) score += 5;
        if (fs.existsSync(path.join(root, 'Dockerfile'))) score += 5;
        const pkg = this._readJson(path.join(root, 'package.json'));
        if (pkg && pkg.scripts && pkg.scripts.build) score += 5;
        if (pkg && pkg.scripts && pkg.scripts.test) score += 5;
        if (this._countFiles(root) > 20) score += 5;
        if (this._countFiles(root) > 100) score += 5;
        if (this._countLinesOfCode(root) > 1000) score += 5;
        if (analysis.todos.length === 0) score += 5;
        return Math.min(score, 100);
    }

    _findIssues(root, analysis) {
        const issues = [];
        if (analysis.git && analysis.git.daysSinceLastCommit > 30) {
            issues.push({ severity: 'warning', text: `No commits in ${analysis.git.daysSinceLastCommit} days` });
        }
        if (analysis.dependencies.outdated > 0) {
            issues.push({ severity: 'warning', text: `${analysis.dependencies.outdated} outdated dependencies` });
        }
        const pkg = this._readJson(path.join(root, 'package.json'));
        if (pkg && !pkg.scripts) {
            issues.push({ severity: 'info', text: 'No npm scripts defined' });
        }
        if (!fs.existsSync(path.join(root, 'README.md'))) {
            issues.push({ severity: 'info', text: 'No README.md' });
        }
        if (!fs.existsSync(path.join(root, '.gitignore'))) {
            issues.push({ severity: 'low', text: 'No .gitignore' });
        }
        if (analysis.todos.length > 10) {
            issues.push({ severity: 'info', text: `${analysis.todos.length} TODO/FIXME items found` });
        }
        return issues;
    }

    _extractTodos(root) {
        const todos = [];
        try {
            const entries = fs.readdirSync(root, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile()) continue;
                if (!/\.(js|ts|jsx|tsx|py|rs|go|java|c|cpp|h|hpp|rb|php|md|txt|yml|yaml|json|css|scss|html)$/i.test(entry.name)) continue;
                try {
                    const content = fs.readFileSync(path.join(root, entry.name), 'utf8');
                    const lines = content.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        const m = lines[i].match(/\b(TODO|FIXME|HACK|XXX|BUG|WIP|UNDONE)\b[:;\s]*(.*)/i);
                        if (m) {
                            todos.push({
                                file: entry.name,
                                line: i + 1,
                                type: m[1].toUpperCase(),
                                text: m[2].trim().substring(0, 200)
                            });
                        }
                    }
                } catch (e) {}
                if (todos.length > 100) break;
            }
        } catch (e) {}
        return todos;
    }

    _analyzeDependencies(root, type) {
        const result = { outdated: 0, missing: 0, total: 0, names: [] };
        if (type === 'node') {
            const pkg = this._readJson(path.join(root, 'package.json'));
            if (pkg) {
                const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                if (deps) {
                    result.total = Object.keys(deps).length;
                    result.names = Object.keys(deps);
                    const nodeModules = path.join(root, 'node_modules');
                    if (!fs.existsSync(nodeModules)) {
                        result.missing = result.total;
                    } else {
                        for (const dep of Object.keys(deps)) {
                            if (!fs.existsSync(path.join(nodeModules, dep))) result.missing++;
                        }
                    }
                }
            }
        }
        if (type === 'python') {
            const req = this._readFile(path.join(root, 'requirements.txt'));
            if (req) {
                const lines = req.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
                result.total = lines;
            }
        }
        return result;
    }

    _analyzeGit(root) {
        const gitDir = path.join(root, '.git');
        if (!fs.existsSync(gitDir)) return null;
        try {
            const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
            const branchMatch = head.match(/ref:\s+refs\/heads\/(.+)/);
            const branch = branchMatch ? branchMatch[1] : 'detached';
            const logsPath = path.join(gitDir, 'logs', 'HEAD');
            let totalCommits = 0;
            let lastCommitTime = null;
            if (fs.existsSync(logsPath)) {
                const logs = fs.readFileSync(logsPath, 'utf8');
                const lines = logs.split('\n').filter(l => l.trim());
                totalCommits = lines.length;
                if (lines.length > 0) {
                    const lastLine = lines[lines.length - 1];
                    const m = lastLine.match(/(\d+)\s*[+-]/);
                    if (m) lastCommitTime = parseInt(m[1]) * 1000;
                }
            }
            const hasUnpushed = this._hasUnpushed(root, gitDir);
            return {
                branch,
                totalCommits,
                lastCommitTime,
                daysSinceLastCommit: lastCommitTime ? Math.round((Date.now() - lastCommitTime) / 86400000) : null,
                isAbandoned: lastCommitTime ? (Date.now() - lastCommitTime) > 30 * 86400000 : true,
                hasUnpushed,
                hasRemote: fs.existsSync(path.join(gitDir, 'config')) &&
                    fs.readFileSync(path.join(gitDir, 'config'), 'utf8').includes('[remote')
            };
        } catch (e) { return null; }
    }

    _hasUnpushed(root, gitDir) {
        try {
            const refsPath = path.join(gitDir, 'refs', 'heads');
            if (!fs.existsSync(refsPath)) return false;
            const branches = fs.readdirSync(refsPath);
            for (const b of branches) {
                const localPath = path.join(refsPath, b);
                const localCommit = fs.readFileSync(localPath, 'utf8').trim();
                const remotePath = path.join(gitDir, 'refs', 'remotes', 'origin', b);
                if (fs.existsSync(remotePath)) {
                    const remoteCommit = fs.readFileSync(remotePath, 'utf8').trim();
                    if (localCommit !== remoteCommit) return true;
                } else {
                    return true;
                }
            }
        } catch (e) {}
        return false;
    }

    _checkBuild(root, type) {
        try {
            if (type === 'node') {
                const pkg = this._readJson(path.join(root, 'package.json'));
                if (pkg && pkg.scripts) {
                    if (pkg.scripts.build) return { canBuild: true, command: 'npm run build' };
                    if (pkg.scripts.start) return { canBuild: true, command: 'npm start' };
                }
            }
            if (type === 'python') {
                if (fs.existsSync(path.join(root, 'setup.py'))) return { canBuild: true, command: 'python setup.py build' };
            }
            if (type === 'rust' && fs.existsSync(path.join(root, 'Cargo.toml'))) {
                return { canBuild: true, command: 'cargo build' };
            }
            if (type === 'go' && fs.existsSync(path.join(root, 'go.mod'))) {
                return { canBuild: true, command: 'go build' };
            }
            if (fs.existsSync(path.join(root, 'Makefile'))) return { canBuild: true, command: 'make' };
            return { canBuild: false };
        } catch (e) { return { canBuild: false, error: e.message }; }
    }

    _generateNextSteps(analysis) {
        const steps = [];
        if (analysis.todos.length > 0) {
            steps.push(`Resolve ${analysis.todos.length} TODO/FIXME items (start with ${analysis.todos[0].file}:${analysis.todos[0].line})`);
        }
        if (analysis.dependencies.missing > 0) {
            steps.push(`Install ${analysis.dependencies.missing} missing dependencies`);
        }
        if (analysis.git && !analysis.git.hasRemote && analysis.git.totalCommits > 0) {
            steps.push('Set up a remote repository and push your code');
        }
        if (analysis.git && analysis.git.hasUnpushed) {
            steps.push('Push local commits to remote repository');
        }
        if (!fs.existsSync(path.join(analysis.root, 'README.md'))) {
            steps.push('Write a README.md to document the project');
        }
        if (analysis.completeness < 30) {
            steps.push('Add core functionality — project is in early stage');
        }
        if (analysis.state === 'abandoned' || analysis.state === 'stalled') {
            steps.push('Review git history to understand where you left off');
            steps.push('Run the project to see current state');
            if (analysis.buildStatus && analysis.buildStatus.canBuild) {
                steps.push(`Try building: ${analysis.buildStatus.command}`);
            }
        }
        return steps;
    }

    _generateSuggestions(analysis) {
        const suggestions = [];
        const recentFiles = this._findRecentlyModified(analysis.root);
        if (recentFiles.length > 0) {
            suggestions.push(`You were last working on: ${recentFiles.slice(0, 3).join(', ')}`);
        }
        if (analysis.git && analysis.git.daysSinceLastCommit > 30) {
            suggestions.push(`It's been ${analysis.git.daysSinceLastCommit} days since your last commit. Consider a fresh pass through the code.`);
        }
        if (analysis.todos.some(t => t.type === 'BUG' || t.type === 'FIXME')) {
            suggestions.push('There are bugs marked in the code that need attention');
        }
        if (analysis.techStack.includes('testing') && !fs.existsSync(path.join(analysis.root, '__tests__')) && !fs.existsSync(path.join(analysis.root, 'tests'))) {
            suggestions.push('Consider adding tests for better stability');
        }
        if (analysis.dependencies.outdated > 5) {
            suggestions.push(`${analysis.dependencies.outdated} dependencies are outdated — run an update`);
        }
        return suggestions;
    }

    _findRecentlyModified(root) {
        const recent = [];
        try {
            const entries = fs.readdirSync(root, { withFileTypes: true });
            const now = Date.now();
            for (const entry of entries) {
                if (!entry.isFile()) continue;
                const fp = path.join(root, entry.name);
                try {
                    const stat = fs.statSync(fp);
                    if (now - stat.mtimeMs < 7 * 86400000 && entry.name.length < 40) {
                        recent.push({ name: entry.name, mtime: stat.mtimeMs });
                    }
                } catch (e) {}
            }
        } catch (e) {}
        return recent.sort((a, b) => b.mtime - a.mtime).map(r => r.name);
    }

    _countLinesOfCode(root) {
        let lines = 0;
        try {
            const entries = fs.readdirSync(root, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile()) continue;
                if (!/\.(js|ts|jsx|tsx|py|rs|go|java|c|cpp|h|hpp|rb|php)$/i.test(entry.name)) continue;
                try {
                    const content = fs.readFileSync(path.join(root, entry.name), 'utf8');
                    lines += content.split('\n').length;
                } catch (e) {}
                if (lines > 50000) break;
            }
        } catch (e) {}
        return lines;
    }

    _countFiles(dir) {
        let count = 0;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile()) count++;
            }
        } catch (e) {}
        return count;
    }

    _readJson(fp) {
        try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return null; }
    }

    _readFile(fp) {
        try { return fs.readFileSync(fp, 'utf8'); } catch (e) { return null; }
    }

    getAnalysis(projectRoot) {
        return this.analyses[projectRoot] || null;
    }

    getAllAnalyses() {
        return Object.values(this.analyses);
    }

    getStats() {
        return {
            analyzed: Object.keys(this.analyses).length,
            types: [...new Set(Object.values(this.analyses).map(a => a.type))],
            states: [...new Set(Object.values(this.analyses).map(a => a.state))],
        };
    }
}

module.exports = { ProjectAnalyzer };
