/**
 * TEACHER_AGENT.JS — Autonomous GitHub study agent
 *
 * Scans GitHub for 20k+ star repos, clones them, studies the code/docs,
 * extracts knowledge, and feeds it into the kernel's brain.
 *
 * PLT Press — Profit + Love - Tax = True Value
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TeacherAgent {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.brain = kernel.brain;
        this.memory = kernel.memory;
        this.chambers = kernel.chambers;
        this.selfGrowingBrain = kernel.selfGrowingBrain;

        this.studiedRepos = new Set();
        this.dataDir = path.join(__dirname, '../../data');
        this.historyPath = path.join(this.dataDir, 'teacher-history.json');
        this.githubToken = options.githubToken || process.env.GITHUB_TOKEN || '';
        this.hfToken = options.hfToken || process.env.HF_TOKEN || '';
        this.maxReposPerCycle = options.maxReposPerCycle || 2;
        this.studyQueue = [];
        this._loadStudyQueue();
        this.minStars = options.minStars || 10000;
        this.isRunning = false;
        this._loadHistory();

        this.stats = {
            reposScanned: 0,
            reposStudied: 0,
            filesAnalyzed: 0,
            learningsFed: 0,
            errors: 0,
        };
    }

    _loadHistory() {
        try {
            if (fs.existsSync(this.historyPath)) {
                const data = JSON.parse(fs.readFileSync(this.historyPath, 'utf-8'));
                this.studiedRepos = new Set(data.studied || []);
                this.stats = data.stats || this.stats;
                console.log(`[Teacher] Loaded history: ${this.studiedRepos.size} repos already studied`);
            }
        } catch (e) {
            console.log(`[Teacher] No history to load`);
        }
    }

    _saveHistory() {
        try {
            const dir = path.dirname(this.historyPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.historyPath, JSON.stringify({
                studied: [...this.studiedRepos],
                stats: this.stats,
                updatedAt: Date.now()
            }, null, 2), 'utf-8');
        } catch (e) {
            console.log(`[Teacher] History save failed: ${e.message}`);
        }
    }

    _loadStudyQueue() {
        try {
            const queuePath = path.join(this.dataDir, 'teacher-queue.json');
            if (fs.existsSync(queuePath)) {
                const data = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
                this.studyQueue = data.queue || [];
                console.log(`[Teacher] Loaded ${this.studyQueue.length} repos in study queue`);
            }
        } catch (e) { /* silent */ }
    }

    _saveStudyQueue() {
        try {
            const queuePath = path.join(this.dataDir, 'teacher-queue.json');
            const dir = path.dirname(queuePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(queuePath, JSON.stringify({ queue: this.studyQueue, updatedAt: Date.now() }), 'utf-8');
        } catch (e) { /* silent */ }
    }

    addToQueue(repo) {
        const fullName = repo.full_name || repo.name || repo;
        if (this.studiedRepos.has(fullName)) return false;
        if (this.studyQueue.find(r => (r.full_name || r.name || r) === fullName)) return false;
        this.studyQueue.push(typeof repo === 'string' ? { full_name: repo, name: repo.split('/').pop(), stargazers_count: 0, language: 'unknown', description: 'queued' } : repo);
        this._saveStudyQueue();
        console.log(`[Teacher] Queued: ${fullName} (${this.studyQueue.length} total queued)`);
        return true;
    }

    removeFromQueue(repoFullName) {
        this.studyQueue = this.studyQueue.filter(r => (r.full_name || r.name || r) !== repoFullName);
        this._saveStudyQueue();
    }

    async _searchTopRepos() {
        const topics = [
            'machine-learning', 'deep-learning', 'artificial-intelligence',
            'javascript', 'python', 'react', 'nodejs', 'typescript',
            'computer-vision', 'nlp', 'llm', 'neural-networks',
            'data-science', 'automation', 'devops', 'blockchain',
            'rust', 'go', 'kubernetes', 'docker', 'database',
        ];

        const query = topics[Math.floor(Math.random() * topics.length)];

        return new Promise((resolve) => {
            const options = {
                hostname: 'api.github.com',
                path: `/search/repositories?q=${query}+stars:>${this.minStars}&sort=stars&order=desc&per_page=10`,
                method: 'GET',
                headers: {
                    'User-Agent': 'GrandSoulKernel-TeacherAgent/1.0',
                    'Accept': 'application/vnd.github.v3+json',
                },
            };

            // Send any non-empty token (supports classic ghp_, fine-grained github_pat_, and env-set tokens)
            if (this.githubToken && this.githubToken.length > 10) {
                options.headers['Authorization'] = `Bearer ${this.githubToken}`;
            }

            const req = https.get(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.items) {
                            this.stats.reposScanned += json.items.length;
                            resolve(json.items);
                        } else if (json.message) {
                            console.log(`[Teacher] GitHub API: ${json.message}`);
                            resolve([]);
                        } else {
                            resolve([]);
                        }
                    } catch (e) {
                        resolve([]);
                    }
                });
            });

            req.on('error', (e) => {
                console.log(`[Teacher] GitHub search error: ${e.message}`);
                resolve([]);
            });
            req.setTimeout(15000, () => { req.destroy(); resolve([]); });
        });
    }

    async _searchHuggingFace() {
        return new Promise((resolve) => {
            const headers = { 'User-Agent': 'GrandSoulKernel-TeacherAgent/1.0' };
            if (this.hfToken) {
                headers['Authorization'] = `Bearer ${this.hfToken}`;
            }
            const options = {
                hostname: 'huggingface.co',
                path: '/api/models?sort=downloads&direction=-1&limit=10',
                method: 'GET',
                headers,
            };

            const req = https.get(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (Array.isArray(json)) {
                            resolve(json.filter(m => m.pipeline_tag).map(m => ({
                                full_name: `huggingface/${m.id}`,
                                name: m.id,
                                stargazers_count: m.likes || 0,
                                language: m.pipeline_tag || 'model',
                                description: m.cardData?.short_description || `${m.pipeline_tag} model`,
                                clone_url: '',
                                html_url: `https://huggingface.co/${m.id}`,
                                isHuggingFace: true,
                            })));
                        }
                        resolve([]);
                    } catch (e) {
                        resolve([]);
                    }
                });
            });

            req.on('error', () => resolve([]));
            req.setTimeout(10000, () => { req.destroy(); resolve([]); });
        });
    }

    async studyNextBatch() {
        if (this.isRunning) return { status: 'already_running' };
        this.isRunning = true;

        try {
            // Process study queue first (God Mode injected repos)
            let repos = [];
            if (this.studyQueue.length > 0) {
                repos = this.studyQueue.splice(0, this.maxReposPerCycle);
                this._saveStudyQueue();
                console.log(`[Teacher] Processing ${repos.length} repos from God Mode study queue...`);
            } else {
                console.log('[Teacher] Searching for top repos/models to study...');
                // Try GitHub first, fall back to HuggingFace if GitHub returns nothing
                repos = await this._searchTopRepos();
                if (!repos || repos.length === 0) {
                    console.log('[Teacher] GitHub returned empty, trying HuggingFace...');
                    repos = await this._searchHuggingFace();
                }
            }

            let studied = 0;
            for (const repo of repos) {
                const fullName = repo.isHuggingFace ? repo.name : repo.full_name;
                if (this.studiedRepos.has(fullName)) {
                    continue;
                }

                if (repo.isHuggingFace) {
                    console.log(`[Teacher] Studying HF model ${fullName} (${repo.stargazers_count} likes)...`);
                    const result = await this._studyHuggingFaceModel(repo);
                    if (result.success) {
                        this.studiedRepos.add(fullName);
                        this.stats.reposStudied++;
                        studied++;
                        this._saveHistory();
                    }
                } else {
                    console.log(`[Teacher] Studying ${fullName} (${repo.stargazers_count} stars)...`);
                    const result = await this._studyRepo(repo);
                    if (result.success) {
                        this.studiedRepos.add(fullName);
                        this.stats.reposStudied++;
                        studied++;
                        this._saveHistory();
                    }
                }

                if (studied >= this.maxReposPerCycle) break;
            }

            if (studied === 0 && repos.length === 0) {
                console.log('[Teacher] No new repos/models found. Will retry next cycle.');
            }

            return {
                status: 'complete',
                searched: repos.length,
                studied,
                totalStudied: this.studiedRepos.size,
            };
        } catch (e) {
            this.stats.errors++;
            console.log(`[Teacher] Cycle error: ${e.message}`);
            return { status: 'error', error: e.message };
        } finally {
            this.isRunning = false;
        }
    }

    async _studyHuggingFaceModel(model) {
        try {
            const knowledge = {
                topic: `huggingface:${model.name}`,
                source: 'web',
                abstract: `${model.description || 'No description'} (${model.stargazers_count} likes, ${model.language})`,
                related: [{ title: model.name, url: model.html_url }],
                timestamp: new Date().toISOString(),
            };
            await this._storeKnowledge(knowledge);

            if (this.memory) {
                await this.memory.witness({
                    type: 'teacher_study',
                    weight: 0.8,
                    tags: ['teacher', 'huggingface', model.language],
                    content: `Studied HF model ${model.name}: ${model.description || ''}`,
                    meta: { model: model.name, likes: model.stargazers_count },
                });
            }

            if (this.selfGrowingBrain) {
                await this.selfGrowingBrain.learnFromExperience({
                    input: `Studied HuggingFace model: ${model.name}`,
                    output: `Model type: ${model.language}. Description: ${model.description || 'N/A'}`,
                    type: 'huggingface_study',
                    source: 'web',
                    metadata: { relatedTo: [model.language, 'machine-learning'] },
                });
                await this.selfGrowingBrain.generateTrainingData();
            }

            this.stats.learningsFed++;
            console.log(`[Teacher] Studied HF model ${model.name}`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async _studyRepo(repo) {
        const cloneUrl = repo.clone_url;
        const fullName = repo.full_name;
        const tmpDir = path.join(require('os').tmpdir(), `teacher-${fullName.replace('/', '-')}-${Date.now()}`);

        try {
            console.log(`[Teacher] Cloning ${fullName}...`);
            execSync(`git clone --depth 1 "${cloneUrl}" "${tmpDir}"`, {
                timeout: 120000,
                encoding: 'utf-8',
                stdio: 'pipe',
            });

            const files = this._walkDir(tmpDir);
            this.stats.filesAnalyzed += files.length;

            const learnings = this._extractLearnings(files, tmpDir, repo);

            if (learnings.length > 0) {
                await this._feedToBrain(learnings, repo);
            }

            const readmePath = path.join(tmpDir, 'README.md');
            if (fs.existsSync(readmePath)) {
                const readmeContent = fs.readFileSync(readmePath, 'utf-8').substring(0, 10000);
                const readmeKnowledge = {
                    topic: `github:${fullName}/README.md`,
                    source: 'git',
                    abstract: readmeContent.substring(0, 2000),
                    related: [{ title: `${fullName} README`, url: repo.html_url }],
                    timestamp: new Date().toISOString(),
                };
                await this._storeKnowledge(readmeKnowledge);
            }

            console.log(`[Teacher] Successfully studied ${fullName}: ${files.length} files, ${learnings.length} learnings`);

            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}

            return { success: true, files: files.length, learnings: learnings.length };
        } catch (e) {
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e2) {}
            console.log(`[Teacher] Failed to study ${fullName}: ${e.message}`);
            return { success: false, error: e.message };
        }
    }

    _walkDir(dir) {
        let results = [];
        try {
            const list = fs.readdirSync(dir);
            for (const file of list) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== '__pycache__') {
                    results = results.concat(this._walkDir(fullPath));
                } else if (stat.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    if (['.js', '.ts', '.py', '.md', '.json', '.yaml', '.yml', '.txt', '.html', '.css', '.mjs', '.cjs', '.rs', '.go', '.rb', '.java', '.cpp', '.h', '.c', '.tsx', '.jsx'].includes(ext)) {
                        results.push(fullPath);
                    }
                }
            }
        } catch (e) {}
        return results;
    }

    _extractLearnings(files, baseDir, repo) {
        const learnings = [];
        const keyFiles = files.filter(f => {
            const name = path.basename(f).toLowerCase();
            return name === 'readme.md' || name === 'package.json' || name === 'index.js' ||
                   name === 'main.py' || name.endsWith('.md') || name === 'config.json' ||
                   name === 'setup.py' || name === 'requirements.txt';
        });

        for (const filePath of [...keyFiles, ...files.slice(0, 30)]) {
            try {
                const relPath = path.relative(baseDir, filePath);
                const content = fs.readFileSync(filePath, 'utf-8').substring(0, 3000);
                const ext = path.extname(filePath).toLowerCase();

                let learning = null;
                if (ext === '.md') {
                    const title = content.split('\n')[0]?.replace(/^#+\s*/, '').trim();
                    if (title) {
                        learning = {
                            type: 'documentation',
                            content: `${repo.full_name}/${relPath}: ${title} — ${content.substring(0, 500)}`,
                            insight: `Documentation from ${repo.full_name}: ${title}`,
                            source: 'git',
                            metadata: { repo: repo.full_name, file: relPath, stars: repo.stargazers_count },
                        };
                    }
                } else {
                    const imports = (content.match(/(?:import|require|from)\s+['"][^'"]+['"]/g) || []).slice(0, 5);
                    const functions = (content.match(/(?:function|def|const\s+\w+\s*=\s*\(|async\s+function)\s+(\w+)/g) || []).slice(0, 5);
                    if (functions.length > 0 || imports.length > 0) {
                        learning = {
                            type: 'code',
                            content: `${repo.full_name}/${relPath}: ${functions.join(', ')}`,
                            insight: `Code pattern from ${repo.full_name} (${repo.stargazers_count}★): ${functions.join(', ')}`,
                            source: 'git',
                            metadata: { repo: repo.full_name, file: relPath, stars: repo.stargazers_count },
                        };
                    }
                }

                if (learning) {
                    learnings.push(learning);
                }
            } catch (e) {}
        }

        return learnings;
    }

    async _feedToBrain(learnings, repo) {
        const repoSummary = `${repo.full_name}: ${repo.description || 'No description'} (${repo.stargazers_count}★, language: ${repo.language || 'unknown'})`;

        if (this.memory) {
            await this.memory.witness({
                type: 'teacher_study',
                weight: 0.9,
                tags: ['teacher', 'github', 'study', repo.language || 'code'],
                content: `Studied ${repoSummary}. Analyzed files: extracted ${learnings.length} learnings.`,
                meta: { repo: repo.full_name, stars: repo.stargazers_count, learnings: learnings.length },
            });
        }

        if (this.selfGrowingBrain) {
            for (const learning of learnings.slice(0, 10)) {
                try {
                    await this.selfGrowingBrain.learnFromExperience(learning);
                    this.stats.learningsFed++;
                } catch (e) {}
            }

            const summaryExperience = {
                input: `Studied GitHub repo: ${repoSummary}`,
                output: `Key learnings: ${learnings.slice(0, 5).map(l => l.insight).join(' | ')}`,
                type: 'github_study',
                source: 'git',
                metadata: { relatedTo: [repo.language || 'programming', repo.full_name] },
            };
            await this.selfGrowingBrain.learnFromExperience(summaryExperience);
            this.stats.learningsFed++;

            await this.selfGrowingBrain.generateTrainingData();
        }

        const knowledgePath = path.join(this.dataDir, 'knowledge.jsonl');
        const knowledgeEntry = {
            topic: `github:${repo.full_name}`,
            source: 'git',
            abstract: repoSummary,
            related: learnings.slice(0, 5).map(l => ({
                title: l.content.substring(0, 100),
                url: `https://github.com/${repo.full_name}/blob/main/${l.metadata.file}`,
            })),
            timestamp: new Date().toISOString(),
        };
        try {
            fs.appendFileSync(knowledgePath, JSON.stringify(knowledgeEntry) + '\n');
        } catch (e) {}
    }

    _storeKnowledge(knowledge) {
        const knowledgePath = path.join(this.dataDir, 'knowledge.jsonl');
        try {
            if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
            fs.appendFileSync(knowledgePath, JSON.stringify(knowledge) + '\n');
        } catch (e) {}
    }

    getStats() {
        return {
            ...this.stats,
            reposStudiedTotal: this.studiedRepos.size,
            studiedRepos: [...this.studiedRepos].slice(-10),
            isRunning: this.isRunning,
        };
    }

    getStatus() {
        return {
            studied: this.studiedRepos.size,
            lastBatch: this.stats.reposStudied,
            errors: this.stats.errors,
            running: this.isRunning,
        };
    }
}

module.exports = { TeacherAgent };
