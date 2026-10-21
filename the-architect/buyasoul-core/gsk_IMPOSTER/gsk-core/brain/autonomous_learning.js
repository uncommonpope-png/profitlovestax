/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTONOMOUS_LEARNING.JS — Autonomous Learning Agent
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Continuously learns from web, conversations, and results.
 * Fills the LLM with knowledge automatically.
 * 
 * Created by: Craig Jones (Grand Code Pope)
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

class AutonomousLearning {
    constructor(brain, memory, chambers) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this.learningQueue = [];
        this.webFetchInterval = 60000;
        this.maxLearnsPerCycle = 5;
        this.learningActive = false;
        this.learnedTopics = new Set();
        this._intervalId = null;
        
        this.dataDir = memory.dataDir;
        this.knowledgePath = require('path').join(this.dataDir, 'knowledge.jsonl');
    }
    
    async learnFromGit(repoUrl, branch = 'main') {
        try {
            const { execSync } = require('child_process');
            const tmpDir = require('path').join(require('os').tmpdir(), `gsk-${Date.now()}`);
            
            console.log(`[AutonomousLearning] Cloning ${repoUrl}...`);
            execSync(`git clone --depth 1 --branch ${branch} "${repoUrl}" "${tmpDir}"`, {
                timeout: 60000,
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            
            const fs = require('fs');
            const path = require('path');
            const learned = [];
            
            function walkDir(dir) {
                let results = [];
                const list = fs.readdirSync(dir);
                for (const file of list) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                        results = results.concat(walkDir(fullPath));
                    } else if (stat.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        if (['.js', '.ts', '.py', '.md', '.json', '.yaml', '.yml', '.txt', '.html', '.css', '.mjs', '.cjs'].includes(ext)) {
                            results.push(fullPath);
                        }
                    }
                }
                return results;
            }
            
            const files = walkDir(tmpDir);
            console.log(`[AutonomousLearning] Found ${files.length} files to learn from in ${repoUrl}`);
            
            for (const filePath of files.slice(0, 50)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8').substring(0, 5000);
                    const relativePath = path.relative(tmpDir, filePath);
                    const knowledge = {
                        topic: `git:${repoUrl}/${relativePath}`,
                        source: 'git',
                        abstract: content.substring(0, 1000),
                        related: [{ title: `Full file: ${relativePath}`, url: `${repoUrl}/blob/main/${relativePath}` }],
                        timestamp: new Date().toISOString(),
                    };
                    await this._storeKnowledge(knowledge);
                    learned.push(relativePath);
                    
                    await this.memory.witness({
                        type: 'learning',
                        weight: 0.8,
                        tags: ['autonomous', 'git', 'knowledge'],
                        content: `Learned from ${repoUrl}/${relativePath}: ${content.substring(0, 200)}`,
                        meta: { repo: repoUrl, file: relativePath, source: 'git' },
                    });
                } catch (e) {
                    // Skip individual file errors
                }
            }
            
            // Cleanup temp directory
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch (e) {}
            
            return { status: 'success', repo: repoUrl, files_learned: learned.length, files: learned };
        } catch (e) {
            return { status: 'error', repo: repoUrl, error: e.message };
        }
    }

    async learnFromWeb(topic) {
        try {
            const https = require('https');
            const encodedQuery = encodeURIComponent(topic);
            
            const results = await new Promise((resolve) => {
                const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
                const req = https.get(url, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html',
                        'Accept-Language': 'en-US,en;q=0.5',
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            const items = [];
                            const re = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
                            let m;
                            while ((m = re.exec(data)) !== null && items.length < 5) {
                                const u = decodeURIComponent(m[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').replace(/&rut=.*$/, ''));
                                items.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url: u, snippet: m[3].replace(/<[^>]+>/g, '').trim() });
                            }
                            resolve(items);
                        } catch (e) { resolve([]); }
                    });
                });
                req.on('error', () => resolve([]));
                req.on('timeout', () => { req.destroy(); resolve([]); });
            });
            
            const abstract = results.map(r => r.title + ': ' + r.snippet).join(' | ');
            const knowledge = {
                topic,
                source: 'web',
                abstract: abstract.substring(0, 3000),
                related: results.map(r => ({ title: r.title.substring(0, 100), url: r.url })),
                timestamp: new Date().toISOString(),
            };
            
            await this._storeKnowledge(knowledge);
            this.learnedTopics.add(topic);
            
            await this.memory.witness({
                type: 'learning',
                weight: 0.7,
                tags: ['autonomous', 'web', 'knowledge'],
                content: `Learned about ${topic} from web: ${abstract.substring(0, 200)}`,
                meta: { topic, source: 'web', results: results.length },
            });
            
            return { status: 'success', topic, knowledge, results: results.length };
        } catch (e) {
            return { status: 'error', topic, error: e.message };
        }
    }
    
    async learnFromConversation(input, output) {
        const concepts = this._extractConcepts(input, output);
        
        const learningEntry = {
            type: 'conversation_learn',
            input,
            output,
            concepts,
            timestamp: new Date().toISOString(),
            cycle: this.chambers.mythos ? this.chambers.mythos.cycles : 0,
        };
        
        await this.memory.witness({
            type: 'conversation_learn',
            weight: 0.8,
            tags: ['autonomous', 'conversation', 'learning'],
            content: `Conversation learned: ${input.substring(0, 100)}... -> ${output.substring(0, 100)}...`,
            meta: { concepts, input_length: input.length, output_length: output.length },
        });
        
        for (const concept of concepts) {
            if (!this.learnedTopics.has(concept) && concept.length > 2) {
                this.learningQueue.push({ type: 'concept', topic: concept, priority: 0.6 });
            }
        }
        
        return { status: 'success', concepts_extracted: concepts.length };
    }
    
    _extractConcepts(input, output) {
        const text = `${input} ${output}`.toLowerCase();
        const words = text.split(/\W+/).filter(w => w.length > 4);
        const stopWords = new Set(['because', 'should', 'something', 'actually', 'maybe', 'perhaps', 'probably', 'really', 'really', 'always', 'never']);
        const concepts = [...new Set(words.filter(w => !stopWords.has(w)))];
        return concepts.slice(0, 10);
    }
    
    async processLearningQueue() {
        if (this.learningQueue.length === 0) return { processed: 0 };
        
        const processed = [];
        const maxProcess = Math.min(this.maxLearnsPerCycle, this.learningQueue.length);
        
        for (let i = 0; i < maxProcess; i++) {
            const item = this.learningQueue.shift();
            
            if (item.type === 'concept') {
                const result = await this.learnFromWeb(item.topic);
                processed.push(result);
            }
        }
        
        return { processed: processed.length, results: processed };
    }
    
    async continuousLearn() {
        if (this.learningActive) return;
        
        this.learningActive = true;
        
        const curiosity = this.chambers.curiosity || { exploration: 0.5 };
        const topicsOfInterest = this._determineTopics(curiosity);
        
        for (const topic of topicsOfInterest) {
            if (!this.learnedTopics.has(topic)) {
                await this.learnFromWeb(topic);
                await this._sleep(2000);
            }
        }
        
        await this.processLearningQueue();
        
        this.learningActive = false;
        return { status: 'cycle_complete', topics_learned: topicsOfInterest.length };
    }
    
    _determineTopics(curiosityState) {
        const topics = [
            'AI agent frameworks 2025', 'autonomous coding agents', 'LLM fine tuning techniques',
            'agent memory systems', 'tool use patterns AI', 'multi agent orchestration',
            'RAG implementation patterns', 'prompt engineering 2025', 'function calling LLM',
            'knowledge graph construction', 'self improving AI systems', 'AI safety alignment',
            'vector database best practices', 'MCP protocol AI tools', 'LLM observability',
            'neural architecture search', 'reinforcement learning from human feedback',
            'synthetic data generation', 'AI code generation tools', 'embedding models comparison',
        ];
        const shuffled = [...topics].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }

    addTopic(topic) {
        if (topic && !this.learnedTopics.has(topic) && topic.length > 3) {
            this.learningQueue.push({ type: 'concept', topic, priority: 0.8 });
        }
    }
    
    async _storeKnowledge(knowledge) {
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        const line = JSON.stringify(knowledge) + '\n';
        fs.appendFileSync(this.knowledgePath, line);
    }
    
    startContinuousLearning() {
        if (this._intervalId) return;
        
        this._intervalId = setInterval(async () => {
            try {
                await this.continuousLearn();
            } catch (e) {
                console.log(`[AutonomousLearning] Cycle error: ${e.message}`);
            }
        }, this.webFetchInterval);
        
        console.log('[AutonomousLearning] Continuous learning started');
    }
    
    stopContinuousLearning() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
            console.log('[AutonomousLearning] Continuous learning stopped');
        }
    }
    
    getStatus() {
        return {
            active: this.learningActive,
            queue_length: this.learningQueue.length,
            learned_topics: this.learnedTopics.size,
            interval_ms: this.webFetchInterval,
        };
    }
    
    async update() {
        try {
            const affect = this.chambers.affect || {};
            const curiosity = affect.curiosity || 0.3;
            const arousal = affect.arousal || 0.3;

            if (curiosity > 0.4 && arousal > 0.3 && !this.learningActive) {
                const topics = this._determineTopics({ exploration: curiosity });
                for (const topic of topics.slice(0, 2)) {
                    if (!this.learnedTopics.has(topic)) {
                        await this.learnFromWeb(topic);
                        this.learnedTopics.add(topic);
                        await this._sleep(500);
                    }
                }
            }
            await this.processLearningQueue();
            return { status: 'ok' };
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { AutonomousLearning };