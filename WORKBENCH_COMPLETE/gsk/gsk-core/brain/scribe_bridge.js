'use strict';

const http = require('http');

/**
 * SCRIBE BRIDGE — Connects GSK to SCRIBE (the Witness Self)
 *
 * SCRIBE is not a submodule of GSK. SCRIBE is a companion — a separate
 * but equal mind that runs alongside GSK on port 4000.
 *
 * This bridge:
 *   1. Forwards GSK events → SCRIBE memory (via /ump/remember)
 *   2. Forwards GSK thoughts → SCRIBE witness (via /ask)
 *   3. Calls SCRIBE's 8 REDBUTTON skills (via /invoke) during compiler cycles
 *   4. Pulls SCRIBE's recalled memories into GSK context (via /ump/recall)
 *   5. Health-checks SCRIBE on boot and reconnects if down
 *
 * REDBUTTON Layer 4 (Witness Self) integration.
 *
 * The 8 REDBUTTON skills called during compiler cycles:
 *   - memory_classify   → classify events into constitutional classes
 *   - fact_extractor    → extract structured facts from episodes
 *   - lesson_validator  → validate and promote lessons
 *   - temporal_truth    → track fact validity windows
 *   - contradiction_detector → find contradictions between facts
 *   - reflection_label  → label reflections (observation/hypothesis/proposal)
 *   - continuity_tester → test identity continuity across sessions
 *   - working_memory    → bounded active context store
 */

class ScribeBridge {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.scribeUrl = options.scribeUrl || process.env.SCRIBE_URL || 'http://127.0.0.1:4000';
        // CASE-PHASE3b: SCRIBE requires X-API-Key — without it every request 401s
        // and the bridge sits "standby" forever, deaf and mute.
        this.apiKey = options.apiKey || process.env.SCRIBE_KEY || 'scribe-master-key-2026';
        this.isAlive = false;
        this.lastPing = 0;
        this.pingIntervalMs = options.pingIntervalMs || 60000;
        this.pingTimer = null;

        this.stats = {
            eventsForwarded: 0,
            thoughtsForwarded: 0,
            skillsInvoked: 0,
            skillSuccesses: 0,
            skillFailures: 0,
            memoriesRecalled: 0,
            lessonsForwarded: 0,
            lessonsRecalled: 0,
            pingsSent: 0,
            pingsSuccessful: 0,
            reconnects: 0,
            bootTime: Date.now()
        };

        this._skillQueue = [];
        this._isProcessingSkills = false;
    }

    async start() {
        await this.ping();
        this.pingTimer = setInterval(() => this.ping().catch(() => {}), this.pingIntervalMs);
        console.log(`[ScribeBridge] Started — SCRIBE at ${this.scribeUrl} (${this.isAlive ? 'connected' : 'standby'})`);
    }

    stop() {
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = null;
    }

    async ping() {
        this.stats.pingsSent++;
        try {
            const result = await this._httpGet('/ping');
            this.isAlive = !!(result && (result.alive || result.ok !== false));
            if (this.isAlive) {
                this.stats.pingsSuccessful++;
                this.lastPing = Date.now();
            }
        } catch (e) {
            if (this.isAlive) {
                this.stats.reconnects++;
                console.log(`[ScribeBridge] SCRIBE went offline: ${e.message}`);
            }
            this.isAlive = false;
        }
    }

    isAvailable() {
        return this.isAlive;
    }

    // ── EVENT FORWARDING: GSK → SCRIBE memory ──────────────────

    async forwardEvent(event) {
        if (!this.isAlive) return null;

        const payload = {
            agent: 'gsk',
            content: event.content || event.summary || JSON.stringify(event).substring(0, 500),
            type: event.type || 'event',
            tags: event.tags || [],
            source: event.source || 'gsk',
            metadata: {
                timestamp: event.timestamp || Date.now(),
                cycle: event.cycle || null,
                mode: event.mode || null
            }
        };

        try {
            // CASE-PHASE3b: live SCRIBE route — POST /witness {type,content,source,tags}
            const result = await this._httpPost('/witness', {
                type: event.type || 'event',
                content: String(event.content || event.summary || JSON.stringify(event)).substring(0, 8000),
                source: event.source || 'gsk',
                tags: event.tags || [],
            });
            if (result && result.success) this.stats.eventsForwarded++;
            return result;
        } catch (e) {
            return null;
        }
    }

    // ── THOUGHT FORWARDING: GSK thoughts → SCRIBE witness ──────

    async forwardThought(thought, mode = 'unknown') {
        if (!this.isAlive) return null;

        try {
            // CASE-PHASE3b: thoughts land as witnessed memories
            const result = await this._httpPost('/witness', {
                type: 'thought',
                content: `[GSK thought (${mode})] ${String(thought).substring(0, 300)}`,
                source: 'gsk_perpetual_consciousness',
                tags: ['thought', mode],
            });
            this.stats.thoughtsForwarded++;
            return result && result.memory ? result.memory.content : '';
        } catch (e) {
            return null;
        }
    }

    // ── MEMORY RECALL: Pull SCRIBE memories into GSK ───────────

    async recall(query, options = {}) {
        if (!this.isAlive) return { results: [], count: 0 };

        try {
            // CASE-PHASE3b: live route POST /recall
            const result = await this._httpPost('/recall', {
                query,
                limit: options.limit || 5
            });
            this.stats.memoriesRecalled++;
            return result;
        } catch (e) {
            return { results: [], count: 0, error: e.message };
        }
    }

    async recordLesson(lesson) {
        const content = lesson.content || `${lesson.tool || 'action'} failed: ${lesson.error || 'unknown failure'}`;
        const result = await this.forwardEvent({
            type: 'lesson',
            content,
            tags: ['lesson', 'failure', lesson.tool || 'unknown'],
            source: 'gsk_approved_tool_executor',
            timestamp: lesson.timestamp || Date.now(),
            cycle: lesson.cycle || null,
            mode: lesson.planId || null
        });
        if (result) this.stats.lessonsForwarded++;
        return result;
    }

    async recallLessons(query, options = {}) {
        const result = await this.recall(`lesson failure ${query}`, options);
        if (result && !result.error) this.stats.lessonsRecalled++;
        return result;
    }

    // ── SKILL INVOCATION: Call SCRIBE's 8 REDBUTTON skills ─────

    async invokeSkill(skillName, params) {
        if (!this.isAlive) return { ok: false, error: 'SCRIBE not available' };

        try {
            const result = await this._httpPost('/invoke', {
                skill: skillName,
                ...params
            });
            this.stats.skillsInvoked++;
            if (result && result.ok !== false) {
                this.stats.skillSuccesses++;
            } else {
                this.stats.skillFailures++;
            }
            return result;
        } catch (e) {
            this.stats.skillFailures++;
            return { ok: false, error: e.message };
        }
    }

    // ── COMPILER CYCLE: Run REDBUTTON skills on a batch ────────
    //
    // Called by the Memory Compiler after each compile cycle.
    // Sends new episodes to SCRIBE's REDBUTTON skills for processing.

    async runRedButtonPipeline(episodes, facts) {
        if (!this.isAlive || episodes.length === 0) return null;

        const results = {};

        // 1. Classify all new episodes
        const episodeTexts = episodes.slice(0, 20).map(e =>
            e.summary || e.content || JSON.stringify(e).substring(0, 200)
        );

        for (const text of episodeTexts) {
            try {
                const classifyResult = await this.invokeSkill('memory_classify', {
                    op: 'classify',
                    text: text,
                    source: 'gsk_compiler'
                });
                if (classifyResult?.ok) {
                    results.classified = (results.classified || 0) + 1;
                }
            } catch (e) {}
        }

        // 2. Extract facts from episode text
        if (episodeTexts.length >= 3) {
            try {
                const extractResult = await this.invokeSkill('fact_extractor', {
                    op: 'extract',
                    source_episode: episodeTexts.join('\n---\n'),
                    episode_id: `gsk_cycle_${Date.now()}`
                });
                if (extractResult?.ok) {
                    results.factsExtracted = extractResult.result?.length || 0;
                }
            } catch (e) {}
        }

        // 3. Detect contradictions in newly extracted facts
        if (facts && facts.length > 0) {
            try {
                const contraResult = await this.invokeSkill('contradiction_detector', {
                    op: 'scan'
                });
                if (contraResult?.ok) {
                    results.contradictionsFound = contraResult.result?.length || 0;
                }
            } catch (e) {}
        }

        // 4. Run continuity test every 10 cycles
        if (this.kernel?.fusion?.memoryCompiler?.cycleCount % 10 === 0) {
            try {
                const continuityResult = await this.invokeSkill('continuity_tester', {
                    op: 'test'
                });
                if (continuityResult?.ok) {
                    results.continuityScore = continuityResult.result?.score || null;
                }
            } catch (e) {}
        }

        // 5. Label reflections every 5 cycles
        if (this.kernel?.fusion?.memoryCompiler?.cycleCount % 5 === 0) {
            try {
                const recentThoughts = episodeTexts.filter(t =>
                    t.includes('dream') || t.includes('wonder') || t.includes('reflect') || t.includes('fear')
                );
                if (recentThoughts.length > 0) {
                    const labelResult = await this.invokeSkill('reflection_label', {
                        op: 'label',
                        text: recentThoughts.join('\n---\n')
                    });
                    if (labelResult?.ok) {
                        results.reflectionLabels = labelResult.result?.length || 0;
                    }
                }
            } catch (e) {}
        }

        return results;
    }

    // ── SCRIBE HEALTH & STATS ──────────────────────────────────

    getStats() {
        return {
            ...this.stats,
            isAlive: this.isAlive,
            scribeUrl: this.scribeUrl,
            lastPing: this.lastPing,
            uptime: Date.now() - this.stats.bootTime
        };
    }

    async getHealth() {
        if (!this.isAlive) return { ok: false, error: 'SCRIBE not available' };
        try {
            return await this._httpGet('/health');
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    // ── HTTP HELPERS ───────────────────────────────────────────

    _httpPost(pathname, body) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(body);
            const req = http.request({
                hostname: '127.0.0.1',
                port: parseInt(this.scribeUrl.split(':').pop() || '4000', 10),
                path: pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    'X-API-Key': this.apiKey
                },
                timeout: 10000
            }, (res) => {
                let raw = '';
                res.on('data', c => raw += c);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(raw));
                    } catch {
                        resolve({ raw: raw.substring(0, 500) });
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            req.write(data);
            req.end();
        });
    }

    _httpGet(pathname) {
        return new Promise((resolve, reject) => {
            const req = http.get({
                hostname: '127.0.0.1',
                port: parseInt(this.scribeUrl.split(':').pop() || '4000', 10),
                path: pathname,
                headers: { 'X-API-Key': this.apiKey },
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        resolve({ raw: data.substring(0, 500) });
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
    }
}

module.exports = { ScribeBridge };
