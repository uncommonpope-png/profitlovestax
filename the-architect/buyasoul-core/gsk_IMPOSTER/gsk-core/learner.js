const fs = require('fs');
const path = require('path');

class Learner {
    constructor(brainEngine, dataDir) {
        this.brain = brainEngine;
        this.dataDir = dataDir || path.join(require('os').homedir(), '.brain-in-a-box');
        this.watchedFiles = new Map();
        this.watchInterval = null;
        this.stats = { filesWatched: 0, filesLearnedFrom: 0, totalBytesProcessed: 0, sessions: 0 };
        this.ensureDir();
    }

    ensureDir() {
        if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    }

    learnFromFile(filePath) {
        try {
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) return { success: false, error: 'Not a file' };
            if (stat.size > 10 * 1024 * 1024) return { success: false, error: 'File too large (>10MB)' };
            const content = fs.readFileSync(filePath, 'utf8').slice(0, 100000);
            const lines = content.split('\n').filter(l => l.trim().length > 20);
            let learned = 0;
            for (const line of lines.slice(0, 200)) {
                const clean = line.replace(/[^\w\s.,!?;:'"()-]/g, ' ').replace(/\s+/g, ' ').trim();
                if (clean.length > 30) {
                    this.brain.learnFromText(clean);
                    learned++;
                }
            }
            this.stats.filesLearnedFrom++;
            this.stats.totalBytesProcessed += stat.size;
            return { success: true, fileName: path.basename(filePath), lines: lines.length, learnedSegments: learned, size: stat.size };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    watchFile(filePath) {
        const absPath = path.resolve(filePath);
        if (!fs.existsSync(absPath)) return { success: false, error: 'File does not exist' };

        if (this.watchedFiles.has(absPath)) {
            return { success: false, error: 'Already watching this file' };
        }

        this.watchedFiles.set(absPath, { mtime: fs.statSync(absPath).mtimeMs, changes: 0 });
        this.stats.filesWatched++;

        if (!this.watchInterval) {
            this.watchInterval = setInterval(() => this.checkFiles(), 5000);
        }

        const initial = this.learnFromFile(absPath);
        return { success: true, watching: true, initial: initial, totalWatched: this.watchedFiles.size };
    }

    checkFiles() {
        for (const [filePath, info] of this.watchedFiles) {
            try {
                if (!fs.existsSync(filePath)) {
                    this.watchedFiles.delete(filePath);
                    continue;
                }
                const stat = fs.statSync(filePath);
                if (stat.mtimeMs > info.mtime) {
                    info.mtime = stat.mtimeMs;
                    info.changes++;
                    this.learnFromFile(filePath);
                }
            } catch { }
        }
        if (this.watchedFiles.size === 0 && this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
    }

    learnFromConversation(q, a) {
        this.stats.sessions++;
        this.brain.learnFromText(`User asked: ${q}. Response: ${a}.`);
        this.brain.learn(q, a);
    }

    watchDirectory(dirPath) {
        const absPath = path.resolve(dirPath);
        if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
            return { success: false, error: 'Directory does not exist' };
        }
        const files = fs.readdirSync(absPath).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.txt', '.md', '.json', '.csv', '.log', '.html', '.js', '.py', '.java', '.c', '.cpp', '.rs', '.go', '.rb', '.ts', '.yaml', '.yml', '.xml'].includes(ext);
        });
        let results = [];
        for (const file of files.slice(0, 50)) {
            const result = this.learnFromFile(path.join(absPath, file));
            results.push(result);
        }
        return { success: true, dir: absPath, filesFound: files.length, filesProcessed: results.filter(r => r.success).length, results };
    }

    getStats() {
        return {
            ...this.stats,
            watchedFilesCount: this.watchedFiles.size,
            isWatching: this.watchInterval !== null,
            brainLearnedItems: this.brain.stats.learnedItems,
            dataDir: this.dataDir
        };
    }

    saveState() {
        const state = { watched: Array.from(this.watchedFiles.entries()).map(([k, v]) => ({ path: k, ...v })), stats: this.stats };
        fs.writeFileSync(path.join(this.dataDir, 'learner-state.json'), JSON.stringify(state, null, 2));
    }

    loadState() {
        const statePath = path.join(this.dataDir, 'learner-state.json');
        if (fs.existsSync(statePath)) {
            try {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
                if (state.stats) this.stats = { ...this.stats, ...state.stats };
                return true;
            } catch { }
        }
        return false;
    }

    stop() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
        this.saveState();
    }
}

module.exports = { Learner };
