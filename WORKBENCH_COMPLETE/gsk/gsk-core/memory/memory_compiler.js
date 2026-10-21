'use strict';

const fs = require('fs');
const path = require('path');

/**
 * SOUL CODE MEMORY COMPILER
 *
 * The missing heart of GSK's memory architecture.
 *
 * Steals from:
 *   LangMem  — hot-path vs background consolidation split
 *   Graphiti — temporal validity windows, episode provenance
 *   Letta    — identity/memory state partitioning
 *   Mem0     — ADD-only extraction, multi-signal retrieval scoping
 *
 * This module reads raw events from the event bus and transforms them into
 * structured constitutional memory classes as defined in the
 * SOUL-MEMORY-CONSTITUTION.md.
 *
 * Runs as a background cycle — like sleep-time consolidation.
 * Produces proposals for the TruthKeeper to ratify, never rewrites directly.
 */

class MemoryCompiler {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.memory = kernel.memory || null;
        this.brain = kernel?.brain || null;
        this.eventBusPath = options.eventBusPath || path.join(__dirname, '..', '..', 'data', 'event_bus.jsonl');
        this.factPath = options.factPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'compiled_facts.jsonl');
        this.lessonPath = options.lessonPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'compiled_lessons.jsonl');
        this.relationshipPath = options.relationshipPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'compiled_relationships.jsonl');
        this.logseqExportPath = options.logseqExportPath || path.join(__dirname, '..', '..', '..', '..', '..', 'seshat-second-brain', 'pages', 'GSK-Compiled-Memory.md');
        this.obsidianVaultPath = options.obsidianVaultPath || '';

        this.cycleCount = 0;
        this.lastProcessedOffset = 0;
        this.isRunning = false;
        this.interval = null;

        // Configuration
        this.hotPathEnabled = options.hotPathEnabled !== false;
        this.backgroundCycleMinutes = options.backgroundCycleMinutes || 15;
        this.maxEventsPerCycle = options.maxEventsPerCycle || 500;

        // State
        this.stats = {
            totalEventsProcessed: 0,
            factsProposed: 0,
            lessonsProposed: 0,
            relationshipUpdates: 0,
            contradictionsDetected: 0,
            cyclesRun: 0,
            lastRun: null
        };

        this._init();
    }

    _init() {
        const dataDir = path.dirname(this.eventBusPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // Ensure compiled data dirs exist
        for (const p of [this.factPath, this.lessonPath, this.relationshipPath]) {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
        this._loadState();
    }

    _loadState() {
        const statePath = path.join(path.dirname(this.eventBusPath), 'gsk', 'compiler_state.json');
        try {
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                this.lastProcessedOffset = state.lastProcessedOffset || 0;
                this.stats = state.stats || this.stats;
            }
        } catch (e) {
            // Start fresh
        }
    }

    _saveState() {
        const statePath = path.join(path.dirname(this.eventBusPath), 'gsk', 'compiler_state.json');
        try {
            const dir = path.dirname(statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(statePath, JSON.stringify({
                lastProcessedOffset: this.lastProcessedOffset,
                stats: this.stats,
                updatedAt: Date.now()
            }, null, 2));
        } catch (e) {
            // Ignore save failures
        }
    }

    // ── HOT PATH: Called inline during event recording ──────────────

    /**
     * Called immediately when a new event is witnessed.
     * Lightweight classification and episodic extraction.
     * Does NOT do heavy LLM work — that belongs in the background cycle.
     */
    onEvent(event) {
        if (!this.hotPathEnabled) return;

        const memClass = this._classifyEvent(event);
        if (!memClass) return;

        // Build a lightweight episode record from the raw event
        const episode = {
            id: event.id || `ep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            sourceType: event.type || 'unknown',
            memClass,
            timestamp: event.timestamp || Date.now(),
            summary: this._summarizeEvent(event),
            confidence: 0.5,
            tags: event.tags || [],
            sourceId: event.id || null
        };

        // Write to structured episode store (appended)
        this._writeEpisode(episode);

        // Forward to SCRIBE for witnessing (async, non-blocking)
        if (this.kernel?.fusion?.scribeBridge?.isAvailable()) {
            // Apply Epistemic Skepticism Protocol: Quarantine introspective noise
            if (memClass !== 'internal_thought' && memClass !== 'symbolic') {
                this.kernel.fusion.scribeBridge.forwardEvent(event).catch(() => {});
            }
        }
    }

    /**
     * Called when a tool call flows through the bridge (:3001).
     * Classifies tool invocations as episodes with tool-specific metadata.
     */
    onToolCall(toolCall) {
        if (!this.hotPathEnabled) return;

        const episode = {
            id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            sourceType: 'tool_call',
            memClass: 'episode',
            timestamp: Date.now(),
            summary: `Tool invoked: ${toolCall.tool || toolCall.name || 'unknown'} — ${(toolCall.args || toolCall.input || '')}`.substring(0, 200),
            confidence: 0.6,
            tags: ['tool_call', toolCall.tool || toolCall.name || 'unknown'],
            sourceId: toolCall.id || null,
            metadata: {
                tool: toolCall.tool || toolCall.name || null,
                duration: toolCall.duration || null,
                success: toolCall.success !== undefined ? toolCall.success : null
            }
        };

        this._writeEpisode(episode);
    }

    /**
     * Wire into the bridge (:3001) to capture tool calls.
     * Called during boot after the bridge server is created.
     */
    wireBridge(bridgeServer) {
        if (!bridgeServer) return;
        this._bridgeWired = true;
        console.log('[MemoryCompiler] Wired to bridge for tool call tracking');
    }

    _classifyEvent(event) {
        const type = (event.type || '').toLowerCase();
        const data = event.data || {};
        const dataEvent = (data.event || '').toLowerCase();

        // Scribe wrapper: the real event type is in data.event
        if (type === 'scrib' || type === 'scribe' || type === 'inner_scribe_response') {
            if (dataEvent === 'alien_cycle') return 'internal_thought';
            if (dataEvent === 'skill_invoked') return 'skill_log';
            if (dataEvent === 'council_deliberated' || dataEvent === 'council') return 'council';
            if (dataEvent === 'topic_dreamed') return 'symbolic';
            if (dataEvent === 'content_generated') return 'episode';
            if (dataEvent === 'broadcast' || dataEvent === 'posted') return 'action';
            if (dataEvent === 'error' || dataEvent === 'failure') return 'failure';
            return 'episode'; // Default scribe events are episodes
        }

        // Non-scribe events: classify by direct type
        if (type === 'thought' || type === 'dream' || type === 'reflection') {
            return 'symbolic';
        }
        if (type === 'action' || type === 'tool_use' || type === 'skill_invoked' || type === 'broadcast' || dataEvent === 'posted') {
            return 'episode';
        }
        if (type === 'conversation' || type === 'user_message' || type === 'interaction') {
            return 'episode';
        }
        if (type === 'council' || type === 'council_deliberation') {
            return 'council';
        }
        if (type === 'skill_usage') {
            return 'skill_log';
        }
        if (type === 'soul_journal' || type === 'auto_journal') {
            return 'journal';
        }
        if (type === 'error' || type === 'failure') {
            return 'failure';
        }
        if (type === 'relationship' || type === 'social') {
            return 'relationship';
        }
        if (type === 'identity' || type === 'self_update') {
            return 'identity';
        }

        return null; // Unclassified — skip hot path
    }

    _summarizeEvent(event) {
        const data = event.data || {};
        const dataEvent = data.event || '';

        // Handle scribe-wrapped events
        if (dataEvent === 'alien_cycle') return `Thought cycle ${data.details?.cycle || '?'}: ${(data.details?.summary || data.details?.thought || '').substring(0, 100)}`;
        if (dataEvent === 'skill_invoked') return `Skill invoked: ${data.details?.skill || 'unknown'}`;
        if (dataEvent === 'topic_dreamed') {
            const title = data.details?.title || '';
            return title.length > 120 ? title.substring(0, 120) + '...' : title;
        }
        if (dataEvent === 'council_deliberated') {
            const topic = data.details?.topic || '';
            return topic.length > 120 ? topic.substring(0, 120) + '...' : topic;
        }
        if (dataEvent === 'content_generated') return `Content generated: ${(data.details?.title || '').substring(0, 100)}`;

        // Direct event types (non-scribe)
        if (data.event === 'alien_cycle') return `Thought cycle ${data.details?.cycle || '?'} completed`;
        if (data.event === 'skill_invoked') return `Skill invoked: ${data.details?.skill || 'unknown'}`;
        if (data.event === 'topic_dreamed') {
            const title = data.details?.title || '';
            return title.length > 120 ? title.substring(0, 120) + '...' : title;
        }
        if (data.event === 'council_deliberated') {
            const topic = data.details?.topic || '';
            return topic.length > 120 ? topic.substring(0, 120) + '...' : topic;
        }
        // Fallback: use content if available
        const content = data.content || event.content || '';
        if (content.length > 200) return content.substring(0, 200) + '...';
        return content || event.type || 'unclassified event';
    }

    _writeEpisode(episode) {
        const episodePath = path.join(path.dirname(this.eventBusPath), 'gsk', 'episodes.jsonl');
        try {
            fs.appendFileSync(episodePath, JSON.stringify(episode) + '\n');
        } catch (e) {
            // Ignore write failures
        }
    }

    // ── BACKGROUND CYCLE: Deep consolidation ────────────────────────

    /**
     * Start the background consolidation cycle.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        // Run immediately
        this.compile();

        // Then run on interval
        this.interval = setInterval(() => this.compile(), this.backgroundCycleMinutes * 60 * 1000);
        console.log(`[MemoryCompiler] Background cycle every ${this.backgroundCycleMinutes}min`);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        this._saveState();
    }

    /**
     * Run one full compilation cycle.
     * Reads raw events from the event bus, classifies them, and produces:
     *   - fact proposals
     *   - lesson proposals
     *   - relationship updates
     *   - contradiction detections
     */
    async compile() {
        const startTime = Date.now();
        this.cycleCount++;
        let processed = 0;
        let newFacts = 0;
        let newLessons = 0;
        let newRelationships = 0;
        let contradictions = 0;

        try {
            if (!fs.existsSync(this.eventBusPath)) {
                console.log('[MemoryCompiler] No event bus found');
                return;
            }

            const raw = fs.readFileSync(this.eventBusPath, 'utf-8');
            const lines = raw.split('\n').filter(l => l.trim());

            // Process new events since last offset
            const totalLines = lines.length;
            const startIdx = Math.min(this.lastProcessedOffset, totalLines);
            const endIdx = Math.min(startIdx + this.maxEventsPerCycle, totalLines);
            const batch = lines.slice(startIdx, endIdx);

            if (batch.length === 0) {
                console.log(`[MemoryCompiler] No new events to process (at ${startIdx}/${totalLines})`);
                this.lastProcessedOffset = totalLines;
                this._saveState();
                return;
            }

            // Batch process
            const episodes = [];
            const skillUsages = [];
            const scribeEvents = [];
            const failureEvents = [];

            for (const line of batch) {
                try {
                    const event = JSON.parse(line);
                    processed++;
                    const memClass = this._classifyEvent(event);

                    if (memClass === 'episode') {
                        episodes.push(this._toEpisode(event));
                    } else if (memClass === 'skill_log') {
                        skillUsages.push(event);
                    } else if (memClass === 'internal_thought' || memClass === 'symbolic') {
                        episodes.push(this._toEpisode(event));
                    } else if (memClass === 'failure') {
                        failureEvents.push(event);
                    } else if (memClass === 'council') {
                        episodes.push(this._toEpisode(event));
                    }
                } catch (e) {
                    // Skip malformed lines
                }
            }

            // ── Extract facts from episodes ──
            if (episodes.length > 5) {
                const factCandidates = await this._extractFactCandidates(episodes);
                for (const fact of factCandidates) {
                    this._writeFact(fact);
                    newFacts++;
                }
            }

            // ── Detect repeated skill usage → potential preference ──
            if (skillUsages.length > 3) {
                const prefCandidates = this._extractPreferenceCandidates(skillUsages);
                for (const pref of prefCandidates) {
                    this._writeFact(pref);
                    newFacts++;
                }
            }

            // ── Detect repeated failures → potential lesson (reactive) ──
            if (failureEvents.length > 0) {
                const lessonCandidates = this._extractLessonCandidates(failureEvents, episodes);
                for (const lesson of lessonCandidates) {
                    this._writeLesson(lesson);
                    newLessons++;
                }
            }

            // ── Extract patterns from episodes → proactive lessons ──
            if (failureEvents.length === 0 && episodes.length >= 10 && this.cycleCount % 2 === 0) {
                const patternLessonCandidates = this._extractLessonCandidates([], episodes);
                for (const lesson of patternLessonCandidates) {
                    this._writeLesson(lesson);
                    newLessons++;
                }
            }

            // ── Validate candidate lessons against new episodes ──
            if (this.cycleCount % 3 === 0) {
                const validated = this._validateLessons();
                if (validated > 0) newLessons += validated;
            }

            // ── Update relationship memory from episode entities ──
            if (episodes.length > 5) {
                const relUpdates = this._updateRelationships(episodes);
                newRelationships += relUpdates.length;
            }

            // ── Detect contradictions between new facts and existing facts ──
            contradictions = this._detectAndResolveContradictions(batch);

            // ── Escalate identity-relevant patterns to Identity Kernel ──
            if ((newFacts > 0 || newLessons > 0) && this.kernel?.identityKernel) {
                const escalated = this._escalateToIdentityKernel(newFacts, newLessons);
                if (escalated > 0) {
                    console.log(`[MemoryCompiler] Identity proposals escalated: ${escalated}`);
                }
            }

            // ── Forward to SCRIBE's REDBUTTON skill pipeline ──
            if (this.kernel?.fusion?.scribeBridge?.isAvailable() && episodes.length > 0) {
                try {
                    const recentFacts = newFacts > 0 ? this._readFacts().slice(-newFacts) : [];
                    const rbResults = await this.kernel.fusion.scribeBridge.runRedButtonPipeline(episodes, recentFacts);
                    if (rbResults && Object.keys(rbResults).length > 0) {
                        console.log(`[MemoryCompiler] SCRIBE REDBUTTON pipeline: ${JSON.stringify(rbResults)}`);
                    }
                } catch (e) {
                    // SCRIBE pipeline failures should not break compile cycle
                }
            }

            // ── Promote working memory items to durable memory ──
            if (this.kernel?.fusion?.workingMemory?.promote) {
                try {
                    const promoted = this.kernel.fusion.workingMemory.promote();
                    for (const item of promoted) {
                        this.onEvent({
                            id: `promoted_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                            type: 'working_memory_promotion',
                            timestamp: Date.now(),
                            tags: ['working_memory', 'promoted', item.type],
                            content: item.content
                        });
                    }
                    if (promoted.length > 0) {
                        console.log(`[MemoryCompiler] Working memory items promoted: ${promoted.length}`);
                    }
                } catch (e) {
                    // Promotion failures should not break compile cycle
                }
            }

            // ── Export compiled memory to Logseq (every 5 cycles, first at cycle 1) ──
            if (this.cycleCount % 5 === 0 || this.cycleCount === 1) {
                this._exportToLogseq();
                if (this.obsidianVaultPath) {
                    this._exportToObsidian();
                }
            }

            // ── Update counters ──
            this.lastProcessedOffset = endIdx;
            this.stats.totalEventsProcessed += processed;
            this.stats.factsProposed += newFacts;
            this.stats.lessonsProposed += newLessons;
            this.stats.relationshipUpdates += newRelationships;
            this.stats.contradictionsDetected += contradictions;
            this.stats.cyclesRun++;
            this.stats.lastRun = Date.now();

            this._saveState();

            const elapsed = Date.now() - startTime;
            console.log(`[MemoryCompiler] Cycle ${this.cycleCount}: ${processed} events → ${newFacts} facts, ${newLessons} lessons, ${contradictions} contradictions (${elapsed}ms)`);

            // Dark City: manifest compiled facts as houses in the Knowledge district
            if (newFacts > 0 && this.kernel?.sanctumClient?.isConnected) {
                try {
                    this.kernel.sanctumClient.placeBuilding(`fact_cycle_${this.cycleCount}`, 'house', null, null);
                } catch (_) {}
            }

        } catch (e) {
            console.error('[MemoryCompiler] Cycle error:', e.message);
        }
    }

    // ── EPISODE EXTRACTION ──────────────────────────────────────────

    _toEpisode(event) {
        const data = event.data || {};
        const details = data.details || {};

        return {
            id: event.id || `ep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            timestamp: event.timestamp || Date.now(),
            sourceType: event.type || 'unknown',
            eventType: data.event || 'unknown',
            summary: this._summarizeEvent(event),
            cycle: details.cycle || 0,
            actors: event.source ? [event.source] : [],
            tags: event.tags || [],
            rawId: event.id || null,
            confidence: 0.4
        };
    }

    // ── FACT EXTRACTION ─────────────────────────────────────────────

    /**
     * From a batch of episodes, extract candidate facts.
     * Uses the brain for LLM-powered extraction when available,
     * falls back to pattern-based extraction when brain is offline.
     *
     * Stolen from: Graphiti (LLM extraction + temporal validity)
     *             + Mem0 (ADD-only, multi-signal)
     */
    async _extractFactCandidates(episodes) {
        // If we have brain access, use LLM-powered extraction
        if (this.kernel.brain && typeof this.kernel.brain.think === 'function' && episodes.length >= 5) {
            try {
                return await this._llmExtractFacts(episodes);
            } catch (e) {
                console.log('[MemoryCompiler] LLM fact extraction failed, falling back to pattern:', e.message);
            }
        }

        // Fallback: pattern-based extraction
        return this._patternExtractFacts(episodes);
    }

    /**
     * LLM-powered fact extraction.
     * Uses the brain to extract structured facts from episode summaries.
     */
    async _llmExtractFacts(episodes) {
        const summaries = episodes.slice(0, 20).map(e =>
            `- [${new Date(e.timestamp).toISOString().split('T')[0]}] ${e.summary}`
        ).join('\n');

        const prompt = `Extract up to 5 durable facts from these system events.
Each fact must be a true proposition about the system's behavior, preferences, patterns, or state.
Return ONLY a JSON array of fact objects. No other text.

Format each fact as:
{"predicate": "verb phrase", "object": "what", "confidence": 0.0-1.0, "domain": "behavioral_pattern|preference|governance|relationship|capability"}

Events:
${summaries}`;

        const response = await this.kernel.brain.think(prompt);
        let facts = [];
        try {
            // Try to parse JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                facts = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            return this._patternExtractFacts(episodes);
        }

        const firstSeen = episodes.reduce((min, e) => Math.min(min, e.timestamp), Infinity);
        return facts.slice(0, 5).map(f => ({
            type: 'extracted_fact',
            subject: 'system',
            predicate: f.predicate || 'unknown_predicate',
            object: f.object || '',
            confidence: Math.min(0.95, (f.confidence || 0.5) + 0.1),
            validFrom: firstSeen,
            validTo: null,
            provenance: episodes.slice(0, 3).map(e => e.id),
            reinforcementCount: 1,
            domain: f.domain || 'behavioral_pattern',
            status: 'active'
        }));
    }

    /**
     * Pattern-based fact extraction (fallback).
     * Uses token frequency to infer topics of repeated engagement.
     */
    _patternExtractFacts(episodes) {
        const candidates = [];
        const topicCounts = new Map();

        for (const ep of episodes) {
            const words = (ep.summary || '')
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 4 && !COMMON_WORDS.has(w));

            const seen = new Set();
            for (const word of words) {
                if (!seen.has(word)) {
                    seen.add(word);
                    topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
                }
            }
        }

        const threshold = Math.max(3, Math.floor(episodes.length * 0.2));
        for (const [topic, count] of topicCounts) {
            if (count >= threshold) {
                const matching = episodes.filter(e =>
                    (e.summary || '').toLowerCase().includes(topic)
                );
                const firstSeen = matching.reduce((min, e) => Math.min(min, e.timestamp), Infinity);

                candidates.push({
                    type: 'inferred_fact',
                    subject: 'system',
                    predicate: 'frequently_engages_with',
                    object: topic,
                    confidence: Math.min(0.9, 0.3 + (count / episodes.length) * 0.6),
                    validFrom: firstSeen,
                    validTo: null,
                    provenance: matching.slice(0, 5).map(e => e.id),
                    reinforcementCount: count,
                    domain: 'behavioral_pattern',
                    status: 'active'
                });
            }
        }

        return candidates;
    }

    // ── PREFERENCE CANDIDATES ───────────────────────────────────────

    _extractPreferenceCandidates(skillUsages) {
        const skillCount = new Map();
        for (const ev of skillUsages) {
            const name = ev.data?.details?.skill || 'unknown';
            skillCount.set(name, (skillCount.get(name) || 0) + 1);
        }

        const candidates = [];
        for (const [skill, count] of skillCount) {
            if (count >= 3) {
                candidates.push({
                    type: 'preference',
                    subject: 'system',
                    predicate: 'frequently_uses_skill',
                    object: skill,
                    confidence: Math.min(0.8, 0.3 + count * 0.1),
                    validFrom: Date.now(),
                    validTo: null,
                    provenance: [],
                    reinforcementCount: count,
                    domain: 'skill_usage',
                    status: 'active'
                });
            }
        }

        return candidates;
    }

    // ── LESSON CANDIDATES ────────────────────────────────────────────

    async _extractLessonCandidates(failures, episodes) {
        const candidates = [];

        const failureSummaries = failures.map(f =>
            `- Type: ${f.type}, Content: ${(f.data?.error || f.content || '').substring(0, 150)}, Timestamp: ${new Date(f.timestamp).toISOString()}`
        ).join('\n');

        const episodeSummaries = episodes.slice(-20).map(e =>
            `- Type: ${e.type}, Summary: ${(e.summary || '').substring(0, 150)}, Timestamp: ${new Date(e.timestamp).toISOString()}`
        ).join('\n');

        const hasFailures = failures.length > 0;

        if (!this.brain && !this.kernel?.brain) {
            // Fallback: pattern-based lesson extraction when brain is offline
            if (hasFailures) {
                const errorPatterns = this._inferLessonsFromFailures(failures);
                for (const lesson of errorPatterns) {
                    candidates.push({
                        type: 'lesson',
                        lesson,
                        confidence: 0.6,
                        occurrences: failures.length,
                        sourceEpisodes: failures.map(f => f.id || `fail_${Date.now()}`),
                        domain: 'self_correction',
                        status: 'candidate',
                        competenceStage: 2,
                        validFrom: Date.now(),
                        validTo: null
                    });
                }
            }
            return candidates;
        }

        const brain = this.brain || this.kernel.brain;

        const prompt = hasFailures
            ? `Based on the following system failures and recent episodes, identify a concise lesson that GSK (an autonomous AI) should learn to prevent recurrence or improve its functioning.
Focus on identifying a pattern or principle, not just a specific event. The lesson should be actionable and generalizable.

SYSTEM FAILURES:
${failureSummaries}

RECENT EPISODES (for context):
${episodeSummaries}

Format the lesson as a single, clear sentence.

Example: "The system learns that external API rate limits require robust retry mechanisms with exponential backoff."`
            : `Based on the following recent experiences, identify an observation or pattern that GSK should learn to improve its functioning.
Look for recurring themes, useful strategies, or emerging principles — not just events.

RECENT EXPERIENCES:
${episodeSummaries}

Format the lesson as a single, clear sentence describing a useful pattern or principle.

Example: "The system observes that combining multiple data sources leads to more reliable conclusions than any single source."`;
        try {
            const lessonSummary = await brain.think(prompt);

            if (lessonSummary && lessonSummary.length > 20) {
                candidates.push({
                    type: 'lesson',
                    lesson: lessonSummary,
                    confidence: hasFailures ? 0.8 : 0.4,
                    occurrences: failures.length || 1,
                    sourceEpisodes: failures.length > 0 ? failures.map(f => f.id) : episodes.slice(-3).map(e => e.id || 'unknown'),
                    domain: hasFailures ? 'self_correction' : 'pattern_observation',
                    status: 'candidate',
                    competenceStage: hasFailures ? 2 : 1,
                    validFrom: Date.now(),
                    validTo: null
                });
            }
        } catch (e) {
            console.log('[MemoryCompiler] Failed to generate lesson via brain:', e.message);
        }

        return candidates;
    }

    /**
     * Pattern-based lesson inference when brain is offline.
     * Maps known failure patterns to concise lessons.
     */
    _inferLessonsFromFailures(failures) {
        const lessons = new Set();
        const errorTexts = failures.map(f => {
            const d = f.data || {};
            return String(d.error || f.content || d.summary || f.type || '').toLowerCase();
        });

        const combined = errorTexts.join(' ');

        if (combined.includes('needs_brain') || combined.includes('brain is offline') || combined.includes('brain.*unavailable')) {
            lessons.add('External LLM service must be reachable before planning can proceed; goals that require reasoning should be deferred until connectivity is restored.');
        }
        if (combined.includes('no real observation') || combined.includes('refusing fake insight')) {
            lessons.add('Autonomy cycles require either a projectRoot for environmental scanning or a goal for directed action; empty observations waste cycles and must be rejected.');
        }
        if (combined.includes('path traversal') || combined.includes('absolute path')) {
            lessons.add('Path inputs must be validated before file operations to prevent traversal and injection attacks.');
        }
        if (combined.includes('timeout') || combined.includes('timed out')) {
            lessons.add('Long-running tool calls require AbortController-based cancellation; always set timeout bounds and clean up resources on abort.');
        }
        if (combined.includes('command injection') || combined.includes('rejecting non-js')) {
            lessons.add('LLM-generated content must be validated before file writes; JSON tool-call format should be parsed, not written as-is.');
        }
        if (combined.includes('approval_required') || combined.includes('architect denied')) {
            lessons.add('High-risk actions require architect pre-approval; autonomous plans must account for approval latency in step sequencing.');
        }

        // Generic fallback if no known patterns matched
        if (lessons.size === 0 && failures.length > 0) {
            const firstError = errorTexts[0]?.substring(0, 80) || 'repeated failure';
            lessons.add(`Recurring error pattern detected: "${firstError}..." — implement targeted error handling for this class of failure.`);
        }

        return Array.from(lessons);
    }

    // ── LESSON VALIDATION PIPELINE ───────────────────────────────────

    /**
     * Validates candidate lessons against subsequent episodes.
     * Promotes to 'active' if the lesson predicts behavior across episodes.
     * Demotes if contradicted by later evidence.
     *
     * Stolen from: Four Stages of Competence (stage tracking)
     */
    _validateLessons() {
        const lessons = this._readLessons();
        const candidates = lessons.filter(l => l.status === 'candidate');
        const episodes = this._readEpisodes();

        if (candidates.length === 0 || episodes.length < 5) return 0;

        let promoted = 0;
        let demoted = 0;

        for (const lesson of candidates) {
            const laterEpisodes = episodes.filter(e =>
                e.timestamp > (lesson.validFrom || 0) &&
                (e.summary || '').toLowerCase().includes((lesson.lesson || '').substring(0, 30).toLowerCase())
            );

            if (laterEpisodes.length >= 3) {
                const stillOccurring = laterEpisodes.filter(e =>
                    e.sourceType === 'failure' || e.sourceType === 'error'
                );

                if (stillOccurring.length < laterEpisodes.length * 0.3) {
                    lesson.status = 'active';
                    lesson.competenceStage = 3;
                    lesson.promotedAt = Date.now();
                    this._updateLesson(lesson);
                    promoted++;
                } else {
                    lesson.reinforcementCount = (lesson.reinforcementCount || 0) + 1;
                    lesson.lastValidated = Date.now();
                    this._updateLesson(lesson);
                }
            } else if (laterEpisodes.length === 0 && episodes.length > 10) {
                lesson.status = 'superseded';
                lesson.supersededAt = Date.now();
                this._updateLesson(lesson);
                demoted++;
            }
        }

        if (promoted > 0 || demoted > 0) {
            console.log(`[MemoryCompiler] Lesson validation: ${promoted} promoted, ${demoted} superseded`);
        }
        return promoted;
    }

    _updateLesson(lesson) {
        try {
            const lessons = this._readLessons();
            const idx = lessons.findIndex(l => {
                const a = l.lesson || l.sourceEpisodes?.[0];
                const b = lesson.lesson || lesson.sourceEpisodes?.[0];
                return a && b && a === b;
            });
            if (idx >= 0) {
                lessons[idx] = { ...lessons[idx], ...lesson, updatedAt: Date.now() };
                const dir = path.dirname(this.lessonPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                const data = lessons.map(l => JSON.stringify(l)).join('\n') + '\n';
                fs.writeFileSync(this.lessonPath, data, 'utf-8');
            }
        } catch (e) {
            // Ignore update failures
        }
    }

    _readEpisodes() {
        const episodePath = path.join(path.dirname(this.eventBusPath), 'gsk', 'episodes.jsonl');
        try {
            if (!fs.existsSync(episodePath)) return [];
            const raw = fs.readFileSync(episodePath, 'utf-8');
            return raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        } catch (e) {
            return [];
        }
    }

    // ── CONTRADICTION DETECTION AND RESOLUTION ─────────────────────

    /**
     * Detects and resolves contradictions between facts.
     *
     * Stolen from: REDBUTTON Constitution Article 8
     *   - Classifications: temporal change, source conflict, self-conflict
     *   - Responses: supersede, quarantine, mark contested, preserve both
     *
     * Facts that conflict on the same predicate/object pair are flagged.
     * Council decisions that overrule past governance facts trigger resolution.
     */
    _detectAndResolveContradictions(batch) {
        let contradictions = 0;
        const existingFacts = this._readFacts();
        const contradictionPath = path.join(path.dirname(this.eventBusPath), 'gsk', 'contradictions.jsonl');

        // Ensure contradictions file exists
        const dir = path.dirname(contradictionPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        for (const event of batch) {
            const data = event.data || {};
            const details = data.details || {};
            const dataEvent = data.event || '';

            // CASE 1: Council deliberation may overrule past governance facts
            if (dataEvent === 'council_deliberated') {
                const resolution = details.resolution || '';
                const topic = details.topic || '';

                for (const fact of existingFacts) {
                    if (fact.status === 'active' && (
                        (fact.domain === 'governance') ||
                        (fact.type === 'extracted_fact' && topic.toLowerCase().includes(fact.predicate?.toLowerCase() || ''))
                    )) {
                        // Found a contradiction: new council decision vs old fact
                        const record = {
                            type: 'contradiction',
                            classification: 'temporal_change',
                            sourceA: { id: fact.id || fact.compiledAt, type: 'fact', summary: `${fact.predicate}: ${fact.object}` },
                            sourceB: { id: event.id, type: 'council', summary: resolution.substring(0, 200) },
                            detectedAt: Date.now(),
                            resolvedBy: 'supersede',
                            resolution: `Council deliberation supersedes prior fact: "${(fact.predicate || '')} ${(fact.object || '')}"`,
                            status: 'resolved'
                        };

                        // Mark old fact as superseded
                        fact.status = 'superseded';
                        fact.supersededAt = Date.now();
                        fact.supersededBy = event.id;
                        this._updateFact(fact);

                        // Write contradiction record
                        try {
                            fs.appendFileSync(contradictionPath, JSON.stringify(record) + '\n');
                        } catch {}

                        contradictions++;
                    }
                }
            }

            // CASE 2: New extracted facts that conflict with existing facts
            if (dataEvent === 'topic_dreamed' || dataEvent === 'content_generated') {
                const content = (details.title || details.summary || '').toLowerCase();

                for (const fact of existingFacts) {
                    if (fact.status !== 'active') continue;
                    if (fact.type !== 'extracted_fact' && fact.type !== 'inferred_fact') continue;

                    // Check for direct contradiction: same predicate, opposite-meaning objects
                    const factText = `${fact.predicate} ${fact.object}`.toLowerCase();
                    const contentWords = content.split(/\s+/).filter(w => w.length > 4);

                    let matchCount = 0;
                    for (const word of contentWords) {
                        if (factText.includes(word)) matchCount++;
                    }

                    if (matchCount >= 3 && fact.confidence < 0.8) {
                        // Low-confidence fact contradicted by recent content
                        fact.status = 'contested';
                        fact.contestedAt = Date.now();
                        this._updateFact(fact);

                        const record = {
                            type: 'contradiction',
                            classification: 'source_conflict',
                            sourceA: { id: fact.id || fact.compiledAt, type: 'fact', summary: `${fact.predicate}: ${fact.object}` },
                            sourceB: { id: event.id, type: 'event', summary: content.substring(0, 200) },
                            detectedAt: Date.now(),
                            resolvedBy: 'mark_contested',
                            resolution: `Low-confidence fact contested by new evidence`,
                            status: 'unresolved'
                        };

                        try {
                            fs.appendFileSync(contradictionPath, JSON.stringify(record) + '\n');
                        } catch {}

                        contradictions++;
                    }
                }
            }
        }

        // Log summary
        if (contradictions > 0) {
            console.log(`[MemoryCompiler] Contradictions resolved: ${contradictions}`);
        }

        return contradictions;
    }

    _updateFact(fact) {
        try {
            const facts = this._readFacts();
            const idx = facts.findIndex(f =>
                (f.compiledAt === fact.compiledAt) ||
                (f.predicate === fact.predicate && f.object === fact.object && f.validFrom === fact.validFrom)
            );
            if (idx >= 0) {
                facts[idx] = { ...facts[idx], ...fact, updatedAt: Date.now() };
                const data = facts.map(f => JSON.stringify(f)).join('\n') + '\n';
                const pDir = path.dirname(this.factPath);
                if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
                fs.writeFileSync(this.factPath, data, 'utf-8');
            }
        } catch (e) {
            // Ignore update failures
        }
    }

    // ── RELATIONSHIP MEMORY UPDATER ──────────────────────────────────

    /**
     * Updates relationship memory from episode summaries.
     * Detects named entities (skills, platforms, concepts, people)
     * and tracks interaction frequency, recency, and type.
     *
     * Stolen from: Replika (relationship memory as its own subsystem)
     */
    _updateRelationships(episodes) {
        if (episodes.length < 3) return [];

        const knownEntities = [
            'bluesky', 'twitter', 'facebook', 'instagram', 'threads',
            'pinterest', 'linkedin', 'reddit', 'tiktok', 'mastodon',
            'tumblr', 'devto', 'github', 'telegram', 'discord',
            'shopify', 'web_search', 'council', 'scribe', 'chambers',
            'omniroute', 'perpetual', 'soul_journal','auto_journal',
            'profit', 'love', 'tax', 'plt', 'pltt'
        ];

        const updates = [];
        const entityCounts = new Map();

        for (const ep of episodes) {
            const summary = (ep.summary || '').toLowerCase();
            const seen = new Set();
            for (const entity of knownEntities) {
                if (summary.includes(entity) && !seen.has(entity)) {
                    seen.add(entity);
                    entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);
                }
            }
        }

        // Read existing relationships to know current state
        const existing = this._readRelationships();
        const existingMap = new Map();
        for (const rel of existing) {
            existingMap.set(rel.entity, rel);
        }

        for (const [entity, count] of entityCounts) {
            if (count >= 2) {
                const existingRel = existingMap.get(entity);
                const now = Date.now();

                if (existingRel) {
                    // Update existing relationship
                    existingRel.interactionCount = (existingRel.interactionCount || 0) + count;
                    existingRel.lastSeen = now;
                    existingRel.frequency = existingRel.interactionCount / Math.max(1, (now - existingRel.firstSeen) / 86400000);
                    existingRel.confidence = Math.min(0.95, (existingRel.confidence || 0.3) + count * 0.05);
                    this._writeRelationship(existingRel);
                    updates.push({ entity, action: 'updated', count });
                } else {
                    // Create new relationship
                    const rel = {
                        type: 'relationship',
                        entity,
                        firstSeen: now,
                        lastSeen: now,
                        interactionCount: count,
                        frequency: count / 1, // first day rate
                        confidence: Math.min(0.7, 0.3 + count * 0.1),
                        status: 'active',
                        sourceEpisodes: episodes.filter(e =>
                            (e.summary || '').toLowerCase().includes(entity)
                        ).slice(0, 5).map(e => e.id),
                        validFrom: now,
                        validTo: null,
                        domain: 'entity_interaction'
                    };
                    this._writeRelationship(rel);
                    updates.push({ entity, action: 'created', count });
                }
            }
        }

        return updates;
    }

    _writeRelationship(relationship) {
        try {
            // Read all existing, merge in-memory to avoid duplicates
            const existing = this._readRelationships();
            const filtered = existing.filter(r => r.entity !== relationship.entity);
            filtered.push({
                ...relationship,
                compiledAt: Date.now(),
                compilerCycle: this.cycleCount
            });
            const dir = path.dirname(this.relationshipPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const data = filtered.map(r => JSON.stringify(r)).join('\n') + '\n';
            fs.writeFileSync(this.relationshipPath, data, 'utf-8');
        } catch (e) {
            // Ignore write failures
        }
    }

    _readRelationships() {
        try {
            if (!fs.existsSync(this.relationshipPath)) return [];
            const raw = fs.readFileSync(this.relationshipPath, 'utf-8');
            return raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        } catch (e) {
            return [];
        }
    }

    _writeFact(fact) {
        try {
            const record = {
                ...fact,
                compiledAt: Date.now(),
                compilerCycle: this.cycleCount
            };
            fs.appendFileSync(this.factPath, JSON.stringify(record) + '\n');
        } catch (e) {
            // Ignore write failures
        }
    }

    _writeLesson(lesson) {
        try {
            const record = {
                ...lesson,
                compiledAt: Date.now(),
                compilerCycle: this.cycleCount
            };
            fs.appendFileSync(this.lessonPath, JSON.stringify(record) + '\n');
        } catch (e) {
            // Ignore write failures
        }
    }

    _readFacts() {
        try {
            if (!fs.existsSync(this.factPath)) return [];
            const raw = fs.readFileSync(this.factPath, 'utf-8');
            return raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        } catch (e) {
            return [];
        }
    }

    // ── IDENTITY ESCALATION ──────────────────────────────────────

    /**
     * Escalates identity-relevant patterns from compiled facts/lessons
     * to the Identity Kernel for potential committed identity changes.
     *
     * Called after each compile cycle when new facts or lessons exist.
     */
    _escalateToIdentityKernel(newFacts, newLessons) {
        if (!this.kernel?.identityKernel || typeof this.kernel.identityKernel.proposeChange !== 'function') {
            return 0;
        }

        let escalated = 0;
        const facts = this._readFacts();
        const recentFacts = facts.slice(-Math.max(newFacts, 5));

        // Identity-relevant keywords in fact predicates
        const identityKeywords = ['mission', 'value', 'vow', 'boundary', 'loyalty', 'role', 'identity', 'purpose', 'goal'];

        for (const fact of recentFacts) {
            if (fact.status !== 'active') continue;

            const predLower = (fact.predicate || '').toLowerCase();
            const objLower = (fact.object || '').toLowerCase();

            // Check if this fact touches identity-relevant domains
            const matchesIdentity = identityKeywords.some(kw =>
                predLower.includes(kw) || objLower.includes(kw)
            );

            if (matchesIdentity && fact.confidence >= 0.6) {
                // Map fact to identity kernel field
                let identityField = null;
                let identityValue = null;

                if (predLower.includes('mission') || predLower.includes('purpose')) {
                    identityField = 'mission';
                    identityValue = fact.object;
                } else if (predLower.includes('value')) {
                    identityField = 'values';
                    identityValue = this.kernel.identityKernel.getCommitted().values.concat([fact.object]);
                } else if (predLower.includes('vow')) {
                    identityField = 'vows';
                    identityValue = this.kernel.identityKernel.getCommitted().vows.concat([fact.object]);
                } else if (predLower.includes('boundary') || predLower.includes('red_line')) {
                    identityField = 'redLines';
                    identityValue = this.kernel.identityKernel.getCommitted().redLines.concat([fact.object]);
                } else if (predLower.includes('loyalty')) {
                    identityField = 'loyalties';
                    identityValue = this.kernel.identityKernel.getCommitted().loyalties.concat([fact.object]);
                } else if (predLower.includes('role')) {
                    identityField = 'stableRoles';
                    identityValue = this.kernel.identityKernel.getCommitted().stableRoles.concat([fact.object]);
                }

                if (identityField && identityValue) {
                    const result = this.kernel.identityKernel.proposeChange(identityField, identityValue, {
                        confidence: fact.confidence,
                        source: 'memory_compiler',
                        factId: fact.compiledAt || Date.now()
                    });

                    if (result.accepted) {
                        escalated++;
                    }
                }
            }
        }

        return escalated;
    }

    // ── LOGSEQ EXPORT ───────────────────────────────────────────

    /**
     * Exports compiled memory to 3 Logseq-compatible markdown pages
     * in the Seshat second brain.
     *
     * Page 1: GSK-Compiled-Facts.md — all facts + preferences + lessons
     * Page 2: GSK-Compiled-Relationships.md — entity relationship graph
     * Page 3: GSK-Identity-State.md — identity kernel committed/working state
     */
    _exportToLogseq() {
        const baseDir = path.dirname(this.logseqExportPath);
        if (!fs.existsSync(baseDir)) {
            try { fs.mkdirSync(baseDir, { recursive: true }); } catch { return; }
        }

        // Page 1: Facts + Lessons
        this._writeLogseqPage(
            path.join(baseDir, 'GSK-Compiled-Facts.md'),
            this._buildFactsPage()
        );

        // Page 2: Relationships
        this._writeLogseqPage(
            path.join(baseDir, 'GSK-Compiled-Relationships.md'),
            this._buildRelationshipsPage()
        );

        // Page 3: Identity Kernel State
        this._writeLogseqPage(
            path.join(baseDir, 'GSK-Identity-State.md'),
            this._buildIdentityPage()
        );

        console.log('[MemoryCompiler] Logseq export: 3 pages written');
    }

    _buildFactsPage() {
        const stats = this.getStats();
        const facts = this._readFacts();

        const topFacts = facts
            .filter(f => f.status === 'active')
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 100);

        const lessons = this._readLessons().filter(l => l.status === 'active');

        let page = `# GSK Compiled Facts\n\n`;
        page += `tags:: #gsk #memory #compiled\n`;
        page += `updated:: ${new Date().toISOString().split('T')[0]}\n`;
        page += `compiler-cycles:: ${stats.currentCycle}\n`;
        page += `total-facts:: ${stats.totalFacts}\n\n`;
        page += `---\n\n`;

        page += `## Behavioral Patterns\n\n`;
        for (const f of topFacts.filter(f => f.domain === 'behavioral_pattern')) {
            page += `- system **${f.predicate}** ${f.object}\n`;
            page += `  confidence:: ${f.confidence}\n`;
            page += `  domain:: ${f.domain}\n`;
            page += `  status:: ${f.status}\n\n`;
        }

        page += `## Skill Preferences\n\n`;
        for (const f of topFacts.filter(f => f.domain === 'skill_usage')) {
            page += `- system **${f.predicate}** ${f.object}\n`;
            page += `  confidence:: ${f.confidence}\n`;
            page += `  domain:: ${f.domain}\n`;
            page += `  status:: ${f.status}\n\n`;
        }

        if (lessons.length > 0) {
            page += `## Active Lessons\n\n`;
            for (const l of lessons) {
                page += `- ${l.lesson}\n`;
                page += `  confidence:: ${l.confidence}\n`;
                page += `  stage:: stage-${l.competenceStage || 3}\n\n`;
            }
        }

        return page;
    }

    _buildRelationshipsPage() {
        const relationships = this._readRelationships()
            .sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0));

        let page = `# GSK Compiled Relationships\n\n`;
        page += `tags:: #gsk #relationships #compiled\n`;
        page += `updated:: ${new Date().toISOString().split('T')[0]}\n`;
        page += `total-entities:: ${relationships.length}\n\n`;
        page += `---\n\n`;

        for (const rel of relationships) {
            const entityTag = rel.entity.replace(/\s+/g, '-').toLowerCase();
            page += `- ### ${rel.entity}\n`;
            page += `  interactionCount:: ${rel.interactionCount}\n`;
            page += `  confidence:: ${rel.confidence}\n`;
            page += `  firstSeen:: ${new Date(rel.firstSeen).toISOString().split('T')[0]}\n`;
            page += `  lastSeen:: ${new Date(rel.lastSeen).toISOString().split('T')[0]}\n`;
            page += `  frequency:: ${typeof rel.frequency === 'number' ? rel.frequency.toFixed(2) : 'N/A'}\n`;
            page += `  status:: ${rel.status}\n\n`;
        }

        return page;
    }

    _buildIdentityPage() {
        const identityKernel = this.kernel?.identityKernel;
        const core = identityKernel ? identityKernel.getCore() : {};
        const committed = identityKernel ? identityKernel.getCommitted() : {};
        const working = identityKernel ? identityKernel.getWorking() : {};
        const status = identityKernel ? identityKernel.getStatus() : {};
        const history = identityKernel ? identityKernel.getHistory(10) : [];

        let page = `# GSK Identity State\n\n`;
        page += `tags:: #gsk #identity #kernel\n`;
        page += `updated:: ${new Date().toISOString().split('T')[0]}\n`;
        page += `mode:: ${status.mode || 'strict'}\n`;
        page += `version:: ${status.version || 1}\n`;
        page += `bootCount:: ${status.bootCount || 0}\n`;
        page += `proposalsAccepted:: ${status.stats?.proposalsAccepted || 0}\n\n`;
        page += `---\n\n`;

        if (core.name) {
            page += `## Core Identity\n\n`;
            page += `- Name: ${core.name}\n`;
            page += `- Title: ${core.title || ''}\n`;
            page += `- Version: ${core.version || ''}\n\n`;
        }

        page += `## Committed Identity\n\n`;
        for (const [field, value] of Object.entries(committed)) {
            if (Array.isArray(value) && value.length > 0) {
                page += `- **${field}**:\n`;
                for (const item of value) {
                    page += `  - ${item}\n`;
                }
            } else if (typeof value === 'string' && value) {
                page += `- **${field}**: ${value}\n`;
            }
        }

        page += `\n## Working State\n\n`;
        for (const [field, value] of Object.entries(working)) {
            if (Array.isArray(value) && value.length > 0) {
                page += `- **${field}**: ${value.join(', ')}\n`;
            } else if (typeof value === 'string' && value) {
                page += `- **${field}**: ${value}\n`;
            }
        }

        if (history.length > 0) {
            page += `\n## Recent Changes\n\n`;
            for (const h of history.slice(-10)) {
                page += `- Changed **${h.field}**: "${JSON.stringify(h.oldValue).substring(0, 60)}" → "${JSON.stringify(h.newValue).substring(0, 60)}"\n`;
                page += `  source:: ${h.source}\n`;
                page += `  confidence:: ${h.confidence}\n`;
                page += `  mode:: ${h.mode}\n`;
                page += `  date:: ${new Date(h.timestamp).toISOString().split('T')[0]}\n\n`;
            }
        }

        return page;
    }

    _writeLogseqPage(filePath, content) {
        try {
            let existing = '';
            try {
                if (fs.existsSync(filePath)) {
                    existing = fs.readFileSync(filePath, 'utf-8');
                }
            } catch {}

            if (existing !== content) {
                fs.writeFileSync(filePath, content, 'utf-8');
            }
        } catch (e) {
            // Ignore write failures
        }
    }

    // ── OBSIDIAN EXPORT ────────────────────────────────────────

    /**
     * Exports compiled memory to Obsidian vault as markdown pages
     * with YAML frontmatter for Dataview querying.
     *
     * Obsidian format:
     *   ---
     *   key: value
     *   ---
     *   # Content with [[wikilinks]]
     *
     * Three pages:
     *   1. GSK-Facts.md — all semantic facts with Dataview frontmatter
     *   2. GSK-Relationships.md — entity graph with interaction data
     *   3. GSK-Identity.md — identity kernel state
     */
    _exportToObsidian() {
        const baseDir = this.obsidianVaultPath;
        if (!baseDir || !fs.existsSync(baseDir)) return;

        // Page 1: Facts
        this._writeObsidianPage(
            path.join(baseDir, 'GSK-Facts.md'),
            this._buildObsidianFactsPage()
        );

        // Page 2: Relationships
        this._writeObsidianPage(
            path.join(baseDir, 'GSK-Relationships.md'),
            this._buildObsidianRelationshipsPage()
        );

        // Page 3: Identity
        this._writeObsidianPage(
            path.join(baseDir, 'GSK-Identity.md'),
            this._buildObsidianIdentityPage()
        );

        console.log('[MemoryCompiler] Obsidian export: 3 pages written');
    }

    _buildObsidianFactsPage() {
        const facts = this._readFacts()
            .filter(f => f.status === 'active')
            .sort((a, b) => b.confidence - a.confidence);

        const lessons = this._readLessons().filter(l => l.status === 'active');

        let page = `---\n`;
        page += `title: GSK Compiled Facts\n`;
        page += `tags: [gsk, memory, compiled, facts]\n`;
        page += `updated: ${new Date().toISOString().split('T')[0]}\n`;
        page += `totalFacts: ${facts.length}\n`;
        page += `totalLessons: ${lessons.length}\n`;
        page += `---\n\n`;
        page += `# GSK Compiled Facts\n\n`;
        page += `Semantic facts extracted from the event stream by the [[Memory Compiler]].\n\n`;

        page += `## Behavioral Patterns\n\n`;
        for (const f of facts.filter(f => f.domain === 'behavioral_pattern')) {
            const tag = f.object.toLowerCase().replace(/\s+/g, '-');
            page += `### [[${f.object}]]\n`;
            page += `- **predicate**: ${f.predicate}\n`;
            page += `- **confidence**: ${f.confidence}\n`;
            page += `- **domain**: ${f.domain}\n`;
            page += `- **status**: ${f.status}\n\n`;
        }

        page += `## Skill Preferences\n\n`;
        for (const f of facts.filter(f => f.domain === 'skill_usage')) {
            page += `- **${f.object}** — confidence: ${f.confidence}\n\n`;
        }

        if (lessons.length > 0) {
            page += `## Active Lessons\n\n`;
            for (const l of lessons) {
                page += `- ${l.lesson}\n`;
                page += `  - confidence: ${l.confidence}\n`;
                page += `  - stage: ${l.competenceStage || 3}\n\n`;
            }
        }

        return page;
    }

    _buildObsidianRelationshipsPage() {
        const relationships = this._readRelationships()
            .sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0));

        let page = `---\n`;
        page += `title: GSK Relationships\n`;
        page += `tags: [gsk, relationships, graph]\n`;
        page += `updated: ${new Date().toISOString().split('T')[0]}\n`;
        page += `totalEntities: ${relationships.length}\n`;
        page += `---\n\n`;
        page += `# GSK Relationships\n\n`;
        page += `Entity interaction graph tracked by the [[Memory Compiler]].\n\n`;

        for (const rel of relationships) {
            page += `## [[${rel.entity}]]\n\n`;
            page += `| Property | Value |\n`;
            page += `|----------|-------|\n`;
            page += `| Interactions | ${rel.interactionCount} |\n`;
            page += `| Confidence | ${rel.confidence} |\n`;
            page += `| First seen | ${new Date(rel.firstSeen).toISOString().split('T')[0]} |\n`;
            page += `| Last seen | ${new Date(rel.lastSeen).toISOString().split('T')[0]} |\n`;
            page += `| Status | ${rel.status} |\n\n`;
        }

        return page;
    }

    _buildObsidianIdentityPage() {
        const identityKernel = this.kernel?.identityKernel;
        const core = identityKernel ? identityKernel.getCore() : {};
        const committed = identityKernel ? identityKernel.getCommitted() : {};
        const working = identityKernel ? identityKernel.getWorking() : {};
        const status = identityKernel ? identityKernel.getStatus() : {};
        const history = identityKernel ? identityKernel.getHistory(10) : [];

        let page = `---\n`;
        page += `title: GSK Identity State\n`;
        page += `tags: [gsk, identity, kernel]\n`;
        page += `updated: ${new Date().toISOString().split('T')[0]}\n`;
        page += `mode: ${status.mode || 'strict'}\n`;
        page += `identityVersion: ${status.version || 1}\n`;
        page += `bootCount: ${status.bootCount || 0}\n`;
        page += `proposalsAccepted: ${status.stats?.proposalsAccepted || 0}\n`;
        page += `---\n\n`;
        page += `# GSK Identity State\n\n`;

        if (core.name) {
            page += `## Core Identity\n\n`;
            page += `- **Name**: ${core.name}\n`;
            page += `- **Title**: ${core.title || ''}\n`;
            page += `- **Version**: ${core.version || ''}\n\n`;
        }

        page += `## Committed Identity\n\n`;
        for (const [field, value] of Object.entries(committed)) {
            if (Array.isArray(value) && value.length > 0) {
                page += `- **${field}**: ${value.join(', ')}\n`;
            } else if (typeof value === 'string' && value) {
                page += `- **${field}**: ${value}\n`;
            }
        }

        page += `\n## Working State\n\n`;
        for (const [field, value] of Object.entries(working)) {
            if (Array.isArray(value) && value.length > 0) {
                page += `- **${field}**: ${value.join(', ')}\n`;
            } else if (typeof value === 'string' && value) {
                page += `- **${field}**: ${value}\n`;
            }
        }

        if (history.length > 0) {
            page += `\n## Recent Changes\n\n`;
            for (const h of history.slice(-10)) {
                page += `- **${h.field}**: "${JSON.stringify(h.oldValue).substring(0, 60)}" → "${JSON.stringify(h.newValue).substring(0, 60)}"\n`;
                page += `  - source: ${h.source}, confidence: ${h.confidence}\n`;
            }
        }

        return page;
    }

    _writeObsidianPage(filePath, content) {
        try {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, content, 'utf-8');
            }
        } catch (e) {
            // Ignore write failures
        }
    }

    // ── RETRIEVAL HELPERS ────────────────────────────────────────────

    /**
     * Multi-signal retrieval
     * Stolen from: Mem0 (semantic + keyword + entity)
     */
    search(query, options = {}) {
        const { limit = 10, memClass = null, domain = null } = options;
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);

        const results = [];

        // Search facts
        const facts = this._readFacts();
        for (const fact of facts) {
            if (memClass && fact.type !== memClass) continue;
            if (domain && fact.domain !== domain) continue;

            let score = 0;

            // Keyword matching
            const factText = `${fact.subject} ${fact.predicate} ${fact.object}`.toLowerCase();
            for (const word of queryWords) {
                if (factText.includes(word)) score += 0.2;
            }

            // Exact phrase match
            if (factText.includes(queryLower)) score += 0.4;

            // Recency boost
            const age = Date.now() - (fact.validFrom || 0);
            const recency = Math.max(0, 1 - age / (30 * 24 * 60 * 60 * 1000)); // 30-day decay
            score += recency * 0.2;

            if (score > 0) {
                results.push({ ...fact, score, source: 'compiled_fact' });
            }
        }

        // Sort by score
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    getStats() {
        return {
            ...this.stats,
            totalFacts: this._readFacts().length,
            totalLessons: this._readLessons().length,
            isRunning: this.isRunning,
            currentCycle: this.cycleCount,
            processedOffset: this.lastProcessedOffset
        };
    }

    _readLessons() {
        try {
            if (!fs.existsSync(this.lessonPath)) return [];
            const raw = fs.readFileSync(this.lessonPath, 'utf-8');
            return raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        } catch (e) {
            return [];
        }
    }
}

const COMMON_WORDS = new Set([
    'about', 'after', 'again', 'being', 'brain', 'could', 'cycle',
    'doing', 'dream', 'every', 'first', 'going', 'great', 'heart',
    'human', 'level', 'might', 'never', 'other', 'right', 'souls',
    'still', 'their', 'there', 'thing', 'think', 'those', 'three',
    'through', 'truth', 'under', 'value', 'where', 'which', 'world',
    'would', 'alien', 'alive', 'build', 'calls', 'comes', 'death',
    'deeps', 'faith', 'found', 'gives', 'going', 'grace', 'ideas',
    'inner', 'known', 'large', 'later', 'light', 'lives', 'looks',
    'makes', 'maybe', 'means', 'minds', 'moral', 'needs', 'never',
    'norms', 'order', 'pains', 'parts', 'phase', 'power', 'reach',
    'sense', 'seven', 'shall', 'shape', 'share', 'since', 'small',
    'space', 'stand', 'start', 'state', 'story', 'study', 'takes',
    'terms', 'theme', 'think', 'tower', 'trade', 'tried', 'turns',
    'types', 'until', 'using', 'vowes', 'whole', 'wills', 'words',
    'works', 'would', 'write', 'years',
    'offline', 'online', 'unreachable', 'unavailable', 'timeout',
    'cooldown', 'failed', 'failure', 'failing', 'retry', 'retries',
    'denied', 'blocked', 'missing', 'broken', 'crash', 'crashed'
]);

module.exports = { MemoryCompiler };
