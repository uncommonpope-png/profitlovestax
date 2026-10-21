'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SCAN_SKIP_DIRS = new Set([
    'node_modules', '.git', '.svn', '.hg', '.idea', '.vscode',
    '__pycache__', '.cache', '.npm', '.yarn', 'vendor', 'bower_components',
    '.next', '.nuxt', 'dist', 'build', '.turbo', '.vercel',
    '.DS_Store', 'Thumbs.db', 'Desktop.ini'
]);

const SCAN_SKIP_EXT = new Set([
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac', '.ogg',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.iso',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    '.pyc', '.pyo', '.class', '.o', '.obj'
]);

const PROJECT_INDICATORS = {
    node: ['package.json', 'node_modules', 'tsconfig.json', '.nvmrc'],
    python: ['requirements.txt', 'setup.py', 'setup.cfg', 'pyproject.toml', 'Pipfile', 'poetry.lock', 'tox.ini'],
    rust: ['Cargo.toml', 'Cargo.lock', 'rust-toolchain'],
    go: ['go.mod', 'go.sum', 'Gopkg.toml'],
    java: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle'],
    csharp: ['.csproj', '.sln', 'NuGet.config'],
    cpp: ['CMakeLists.txt', 'Makefile', 'configure.ac', 'meson.build'],
    ruby: ['Gemfile', 'Gemfile.lock', 'Rakefile', '*.gemspec'],
    php: ['composer.json', 'composer.lock'],
    elixir: ['mix.exs', 'mix.lock'],
    haskell: ['stack.yaml', 'package.yaml', '*.cabal'],
    swift: ['Package.swift', 'Package.resolved'],
    html: ['index.html', 'package.json'],
    web: ['webpack.config.js', 'vite.config.js', 'next.config.js', 'nuxt.config.js', 'svelte.config.js'],
};

const USER_DIRS = [
    'Desktop', 'Documents', 'Projects', 'Code', 'Work', 'dev', 'src',
    'Downloads', 'OneDrive', 'Dropbox', 'GitHub', 'repos',
];

class PCScanner {
    constructor(options = {}) {
        this.dataDir = options.dataDir || path.join(os.homedir(), '.brain-in-a-box');
        this.scanResults = null;
        this.userProfile = null;
        this.scanStats = { scans: 0, filesFound: 0, projectsFound: 0, lastScan: null };
        this._scanCache = path.join(this.dataDir, 'pc-scan.json');
        this._profileCache = path.join(this.dataDir, 'user-profile.json');
        this._cacheTTL = options.cacheTTL || 3600000;
    }

    async scan(startPaths = null) {
        const paths = startPaths || this._getDefaultScanPaths();
        const results = {
            projects: [],
            userFiles: [],
            abandoned: [],
            stats: { dirs: 0, files: 0, errors: 0, skipped: 0, startTime: Date.now() }
        };

        for (const startPath of paths) {
            if (!fs.existsSync(startPath)) continue;
            try {
                await this._walk(startPath, results, 0);
            } catch (e) {
                results.stats.errors++;
            }
        }

        results.stats.endTime = Date.now();
        results.stats.duration = results.stats.endTime - results.stats.startTime;
        results.stats.uniqueProjects = results.projects.length;

        this._analyzeAbandoned(results);
        this._buildUserProfile(results);
        this.scanResults = results;
        this.scanStats.scans++;
        this.scanStats.filesFound = results.stats.files;
        this.scanStats.projectsFound = results.projects.length;
        this.scanStats.lastScan = Date.now();

        this._cache(results);
        return results;
    }

    _getDefaultScanPaths() {
        const home = os.homedir();
        const paths = [home];
        const drives = this._getWindowsDrives();
        for (const d of drives) {
            if (d !== home[0] && fs.existsSync(d + ':\\')) {
                paths.push(d + ':\\');
            }
        }
        return paths;
    }

    _getWindowsDrives() {
        const drives = [];
        try {
            const exec = require('child_process').execSync;
            const out = exec('wmic logicaldisk get name', { encoding: 'utf8', timeout: 5000 });
            out.split('\n').forEach(line => {
                const m = line.match(/^([A-Z]):/);
                if (m) drives.push(m[1]);
            });
        } catch (e) {}
        if (drives.length === 0) drives.push('C');
        return drives;
    }

    async _walk(dirPath, results, depth) {
        if (depth > 12) return;
        let entries;
        try {
            entries = fs.readdirSync(dirPath, { withFileTypes: true });
        } catch (e) {
            results.stats.errors++;
            return;
        }

        const subdirs = [];
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (SCAN_SKIP_DIRS.has(entry.name)) {
                results.stats.skipped++;
                continue;
            }
            if (entry.isDirectory()) {
                if (entry.name.startsWith('.')) { results.stats.skipped++; continue; }
                subdirs.push(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (SCAN_SKIP_EXT.has(ext)) { results.stats.skipped++; continue; }
                results.stats.files++;

                const projectType = this._detectProjectType(entry.name, dirPath);
                if (projectType && !results.projects.find(p => p.root === dirPath)) {
                    const proj = this._catalogProject(dirPath, projectType);
                    if (proj) results.projects.push(proj);
                }
            }
        }

        if (results.stats.files > 50000) return;
        for (const sub of subdirs) {
            await this._walk(sub, results, depth + 1);
        }
    }

    _detectProjectType(fileName, dirPath) {
        for (const [type, indicators] of Object.entries(PROJECT_INDICATORS)) {
            for (const ind of indicators) {
                if (ind.startsWith('*.')) {
                    if (fileName.endsWith(ind.slice(1))) return type;
                } else if (fileName === ind && fs.existsSync(path.join(dirPath, ind))) {
                    return type;
                } else if (fileName === ind) {
                    return type;
                }
            }
        }
        return null;
    }

    _catalogProject(root, type) {
        try {
            const stat = fs.statSync(root);
            const gitDir = path.join(root, '.git');
            const hasGit = fs.existsSync(gitDir);
            let gitInfo = null;
            if (hasGit) {
                try {
                    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
                    const branchMatch = head.match(/ref:\s+refs\/heads\/(.+)/);
                    gitInfo = { branch: branchMatch ? branchMatch[1] : 'detached' };
                    const commitsDir = path.join(gitDir, 'logs', 'HEAD');
                    if (fs.existsSync(commitsDir)) {
                        const logs = fs.readFileSync(commitsDir, 'utf8');
                        const lines = logs.split('\n').filter(l => l.trim());
                        gitInfo.totalCommits = lines.length;
                        if (lines.length > 0) {
                            const lastLine = lines[lines.length - 1];
                            const tsMatch = lastLine.match(/(\d+)\s*[+-]/);
                            gitInfo.lastCommit = tsMatch ? parseInt(tsMatch[1]) * 1000 : stat.mtimeMs;
                        }
                    }
                } catch (e) {}
            }

            const pkg = this._readJson(path.join(root, 'package.json'));
            const readme = this._findFile(root, /^README/i);
            const license = this._findFile(root, /^LICENSE/i);

            return {
                root,
                type,
                name: pkg ? pkg.name || path.basename(root) : path.basename(root),
                description: pkg ? pkg.description || '' : '',
                hasGit,
                gitInfo,
                size: this._dirSize(root),
                fileCount: this._countFiles(root),
                mtime: stat.mtimeMs,
                birthtime: stat.birthtimeMs,
                hasReadme: !!readme,
                hasLicense: !!license,
                dependencies: pkg ? Object.keys(pkg.dependencies || {}).length : 0,
                devDependencies: pkg ? Object.keys(pkg.devDependencies || {}).length : 0,
                scripts: pkg ? Object.keys(pkg.scripts || {}).length : 0,
                isAbandoned: false,
                abandonScore: 0,
                tags: []
            };
        } catch (e) {
            return null;
        }
    }

    _analyzeAbandoned(results) {
        const now = Date.now();
        for (const proj of results.projects) {
            let score = 0;
            const reasons = [];

            const ageDays = (now - proj.mtime) / 86400000;

            if (ageDays > 90) { score += 20; reasons.push('no_activity_3mo'); }
            if (ageDays > 180) { score += 20; reasons.push('no_activity_6mo'); }
            if (ageDays > 365) { score += 30; reasons.push('no_activity_1yr'); }

            if (proj.hasGit && proj.gitInfo) {
                const lastCommitAge = proj.gitInfo.lastCommit ? (now - proj.gitInfo.lastCommit) / 86400000 : ageDays;
                if (lastCommitAge > 90) score += 15;
                if (lastCommitAge > 365) score += 20;
                if ((proj.gitInfo.totalCommits || 0) < 5 && ageDays > 60) score += 15;
                if (proj.gitInfo.branch && proj.gitInfo.branch !== 'main' && proj.gitInfo.branch !== 'master') {
                    score += 5;
                }
            }

            if (proj.dependencies > 0 && ageDays > 90) score += 10;
            if (!proj.hasReadme && proj.fileCount > 10) score += 5;

            const todos = this._findTodos(proj.root);
            if (todos > 0) { score += Math.min(todos * 2, 15); reasons.push(`${todos} TODOs`); }

            if (proj.scripts > 5 && ageDays > 60) score += 5;

            const buildDirExists = ['dist', 'build', '.next', '.nuxt'].some(d => fs.existsSync(path.join(proj.root, d)));
            if (buildDirExists && ageDays > 60) score += 5;

            if (score >= 20) {
                proj.isAbandoned = true;
                proj.abandonScore = Math.min(score, 100);
                proj.abandonReasons = reasons;
                proj.abandonAgeDays = Math.round(ageDays);
                results.abandoned.push(proj);
            }
        }
        results.abandoned.sort((a, b) => b.abandonScore - a.abandonScore);
    }

    _buildUserProfile(results) {
        const types = {};
        const totalProjects = results.projects.length;
        for (const proj of results.projects) {
            types[proj.type] = (types[proj.type] || 0) + 1;
        }

        const primaryTypes = Object.entries(types)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([t, c]) => ({ type: t, count: c, pct: Math.round(c / totalProjects * 100) }));

        const totalFiles = results.stats.files;
        const scannedDirs = results.stats.dirs;

        this.userProfile = {
            primaryTypes,
            totalProjects,
            totalFiles,
            scannedDirs,
            abandonedCount: results.abandoned.length,
            analysisTime: Date.now(),
            driveInfo: this._getDriveInfo(),
            dominantTech: primaryTypes[0]?.type || 'unknown',
            skillAreas: this._inferSkillAreas(results.projects, types),
        };

        this._saveProfile();
    }

    _saveProfile() {
        try {
            if (this.userProfile) {
                fs.writeFileSync(this._profileCache, JSON.stringify(this.userProfile, null, 2));
            }
        } catch (e) {}
    }

    _inferSkillAreas(projects, types) {
        const areas = [];
        const typeAreas = {
            node: ['web development', 'javascript', 'fullstack'],
            python: ['data science', 'automation', 'backend', 'ml'],
            rust: ['systems programming', 'performance'],
            go: ['cloud', 'microservices', 'devops'],
            java: ['enterprise', 'android'],
            csharp: ['dotnet', 'game dev', 'enterprise'],
            cpp: ['systems', 'game dev', 'embedded'],
            ruby: ['web development', 'automation'],
            php: ['web development', 'cms'],
            html: ['web design', 'frontend'],
            web: ['web development', 'frontend'],
        };
        for (const type of Object.keys(types)) {
            const ta = typeAreas[type];
            if (ta) {
                for (const area of ta) {
                    if (!areas.includes(area)) areas.push(area);
                }
            }
        }
        return areas;
    }

    _getDriveInfo() {
        const info = {};
        try {
            const exec = require('child_process').execSync;
            const out = exec('wmic logicaldisk get size,freespace,name', { encoding: 'utf8', timeout: 5000 });
            const lines = out.split('\n').slice(1);
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    info[parts[2]] = {
                        total: parseInt(parts[0]) || 0,
                        free: parseInt(parts[1]) || 0
                    };
                }
            }
        } catch (e) {}
        return info;
    }

    _findTodos(root) {
        let count = 0;
        try {
            const entries = fs.readdirSync(root, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && /\.(js|ts|py|rs|go|java|c|cpp|rb|php|md|txt)$/i.test(entry.name)) {
                    try {
                        const content = fs.readFileSync(path.join(root, entry.name), 'utf8').substring(0, 50000);
                        const matches = content.match(/\b(TODO|FIXME|HACK|XXX|BUG|FIX|WIP|UNDONE)\b/gi);
                        if (matches) count += matches.length;
                    } catch (e) {}
                }
                if (count > 100) break;
            }
        } catch (e) {}
        return count;
    }

    _findFile(dir, pattern) {
        try {
            const entries = fs.readdirSync(dir);
            return entries.some(e => pattern.test(e));
        } catch (e) { return false; }
    }

    _dirSize(dir) {
        let size = 0;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fp = path.join(dir, entry.name);
                try {
                    if (entry.isFile()) size += fs.statSync(fp).size;
                    else if (entry.isDirectory() && !SCAN_SKIP_DIRS.has(entry.name)) size += this._dirSize(fp);
                } catch (e) {}
            }
        } catch (e) {}
        return size;
    }

    _countFiles(dir) {
        let count = 0;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fp = path.join(dir, entry.name);
                try {
                    if (entry.isFile()) count++;
                    else if (entry.isDirectory() && !SCAN_SKIP_DIRS.has(entry.name)) count += this._countFiles(fp);
                } catch (e) {}
            }
        } catch (e) {}
        return count;
    }

    _readJson(fp) {
        try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return null; }
    }

    _cache(results) {
        try {
            fs.writeFileSync(this._scanCache, JSON.stringify({
                ts: Date.now(), projects: results.projects.map(p => ({
                    root: p.root, type: p.type, name: p.name, isAbandoned: p.isAbandoned,
                    abandonScore: p.abandonScore, mtime: p.mtime, gitInfo: p.gitInfo
                })), stats: results.stats, abandoned: results.abandoned.map(p => p.root)
            }));
        } catch (e) {}
    }

    getProjects(type = null, abandoned = false) {
        if (!this.scanResults) return [];
        let projects = this.scanResults.projects;
        if (type) projects = projects.filter(p => p.type === type);
        if (abandoned) projects = projects.filter(p => p.isAbandoned);
        return projects;
    }

    getAbandonedProjects(minScore = 20) {
        if (!this.scanResults) return [];
        return this.scanResults.abandoned.filter(p => p.abandonScore >= minScore);
    }

    getProfile() {
        return this.userProfile;
    }

    getStatus() {
        return {
            lastScan: this.scanStats.lastScan,
            projectsFound: this.scanStats.projectsFound,
            filesFound: this.scanStats.filesFound,
            abandonedFound: this.scanResults ? this.scanResults.abandoned.length : 0,
            totalScans: this.scanStats.scans,
            profileBuilt: !!this.userProfile
        };
    }
}

module.exports = { PCScanner, PROJECT_INDICATORS, USER_DIRS };
