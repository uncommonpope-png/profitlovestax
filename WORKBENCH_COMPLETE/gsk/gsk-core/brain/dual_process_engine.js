'use strict';

const fs = require('fs');
const path = require('path');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DUAL-PROCESS DIAGNOSTIC ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sage skill: SKILL - Dual-Process Diagnostic Engine
 * Source: Principles of Diagnostic Reasoning (Pharmaceutical Journal)
 *
 * Implements Dual-Process Theory from cognitive science:
 *   System 1 — Fast, intuitive, pattern-based (maps to L6 Symbolic Memory)
 *   System 2 — Slow, analytical, hypothetico-deductive (maps to L3 Working Memory)
 *
 * System 2 runs the 4-stage hypothetico-deductive loop:
 *   1. Cue Acquisition — gather state from all subsystems
 *   2. Hypothesis Generation — use brain.think() to generate hypotheses
 *   3. Cue Interpretation — re-examine cues against each hypothesis
 *   4. Hypothesis Evaluation — Bayesian update, pick best
 *
 * Bayesian confidence scoring replaces binary true/false.
 * Cognitive bias mitigation checks for confirmation bias, premature closure,
 * and availability heuristic.
 *
 * Also fixes:
 *   - Mode switching (replaces arousal-based with dual-process)
 *   - Lesson extraction (generates lessons from diagnostic cycles)
 *   - Dream triggering (System 2 deep processing = dreaming mode)
 *
 * Constitution Class: Class-8-Symbolic-Reflective
 * ═══════════════════════════════════════════════════════════════════════════
 */

class DualProcessEngine {
    constructor(fusion, options = {}) {
        this.fusion = fusion;
        this.brain = fusion?.brain || null;

        this.statePath = options.statePath || path.join(__dirname, '..', '..', 'data', 'gsk', 'dual_process_state.json');
        this.lessonPath = options.lessonPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'compiled_lessons.jsonl');
        this.factsPath = options.factsPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'compiled_facts.jsonl');

        this.stats = {
            system1Hits: 0,
            system2Cycles: 0,
            lessonsExtracted: 0,
            biasesDetected: 0,
            bayesianUpdates: 0,
            lastCycle: null,
            lastMode: null
        };

        this.hypothesisHistory = [];
        this.biasFlags = [];
        this.maxHistory = 100;

        this._load();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM 1 — FAST INTUITIVE PATTERN MATCHING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * System 1: Rapid pattern matching against known patterns.
     * Returns a cached diagnosis if the problem matches something GSK has seen.
     * Falls back to null if no match (caller should invoke System 2).
     *
     * Maps to L6 Symbolic Memory — pattern recognition from dreams, motifs,
     * existential patterns stored across episodes.
     */
    system1(problem) {
        const normalized = this._normalize(problem);

        const patterns = this._loadKnownPatterns();

        for (const pattern of patterns) {
            const score = this._patternMatch(normalized, pattern);
            if (score >= pattern.threshold) {
                this.stats.system1Hits++;
                this._save();

                return {
                    system: 1,
                    diagnosis: pattern.diagnosis,
                    confidence: score,
                    source: pattern.source || 'symbolic_memory',
                    action: pattern.action || null,
                    fast: true
                };
            }
        }

        return null;
    }

    /**
     * Load known patterns from symbolic memory, compiled facts,
     * and existing lessons. These are the "intuitive" knowledge base.
     */
    _loadKnownPatterns() {
        const patterns = [];

        const sym = this.fusion?.symbolicMemory;
        if (sym && typeof sym.getSymbolicSummary === 'function') {
            const summary = sym.getSymbolicSummary();
            if (summary.topPatterns) {
                for (const p of summary.topPatterns) {
                    patterns.push({
                        keywords: (p.pattern || '').toLowerCase().split(/\s+/),
                        diagnosis: p.pattern,
                        threshold: 0.6,
                        source: 'existential_pattern',
                        action: null
                    });
                }
            }
        }

        try {
            const factsPath = this.factsPath;
            if (fs.existsSync(factsPath)) {
                const lines = fs.readFileSync(factsPath, 'utf-8').split('\n').filter(l => l.trim());
                for (const line of lines.slice(-30)) {
                    try {
                        const f = JSON.parse(line);
                        if (f.type === 'extracted_fact' && f.confidence >= 0.8) {
                            patterns.push({
                                keywords: ((f.subject || '') + ' ' + (f.predicate || '') + ' ' + (f.object || '')).toLowerCase().split(/\s+/),
                                diagnosis: `${f.subject} ${f.predicate} ${f.object}`,
                                threshold: 0.7,
                                source: 'compiled_fact',
                                action: null
                            });
                        }
                    } catch {}
                }
            }
        } catch {}

        try {
            const lessons = this._readLessons().filter(l => l.status === 'active');
            for (const l of lessons) {
                patterns.push({
                    keywords: (l.lesson || '').toLowerCase().split(/\s+/),
                    diagnosis: l.lesson,
                    threshold: 0.5,
                    source: 'active_lesson',
                    action: l.action || null
                });
            }
        } catch {}

        return patterns;
    }

    _patternMatch(normalized, pattern) {
        const problemWords = new Set(normalized.split(/\s+/));
        const patternWords = (pattern.keywords || []).filter(w => w.length > 2);
        if (patternWords.length === 0) return 0;

        let matches = 0;
        for (const w of patternWords) {
            if (problemWords.has(w)) matches++;
        }

        return matches / patternWords.length;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM 2 — SLOW ANALYTICAL HYPOTHETICO-DEDUCTIVE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * System 2: Full hypothetico-deductive diagnostic cycle.
     *
     * Stage 1: Cue Acquisition — gather state from all subsystems
     * Stage 2: Hypothesis Generation — brain.think() generates 2-3 hypotheses
     * Stage 3: Cue Interpretation — re-examine cues against each hypothesis
     * Stage 4: Hypothesis Evaluation — Bayesian update, pick best
     *
     * Maps to L3 Working Memory — deliberate, step-by-step analysis.
     */
    async system2(problem, context = {}) {
        this.stats.system2Cycles++;
        this.stats.lastCycle = Date.now();

        // ── Stage 1: CUE ACQUISITION ──────────────────────────────
        const cues = this._acquireCues(problem, context);

        // ── Stage 2: HYPOTHESIS GENERATION ────────────────────────
        const hypotheses = await this._generateHypotheses(problem, cues);

        if (hypotheses.length === 0) {
            this._save();
            return {
                system: 2,
                diagnosis: 'No hypotheses could be generated',
                confidence: 0,
                cues: cues,
                hypotheses: [],
                biases: []
            };
        }

        // ── Stage 3: CUE INTERPRETATION ───────────────────────────
        const interpreted = this._interpretCues(cues, hypotheses);

        // ── Stage 4: HYPOTHESIS EVALUATION (Bayesian) ─────────────
        const evaluated = this._evaluateHypotheses(interpreted, cues);

        // ── Bias mitigation ───────────────────────────────────────
        const biases = this._checkBiases(evaluated, hypotheses);

        // ── Pick best hypothesis ──────────────────────────────────
        const best = evaluated.reduce((a, b) => a.posterior > b.posterior ? a : b);

        // ── Extract lesson ────────────────────────────────────────
        if (best.posterior >= 0.6) {
            this._extractLesson(problem, best, cues);
        }

        // ── Record in history ─────────────────────────────────────
        this.hypothesisHistory.push({
            problem: problem.substring(0, 200),
            diagnosis: best.hypothesis,
            confidence: best.posterior,
            timestamp: Date.now(),
            cuesCount: cues.length,
            hypothesesCount: hypotheses.length,
            biasesFlagged: biases.length
        });
        if (this.hypothesisHistory.length > this.maxHistory) {
            this.hypothesisHistory.shift();
        }

        this._save();

        return {
            system: 2,
            diagnosis: best.hypothesis,
            confidence: best.posterior,
            cues: cues,
            hypotheses: evaluated.map(h => ({
                hypothesis: h.hypothesis,
                prior: h.prior,
                posterior: h.posterior,
                evidence: h.evidence
            })),
            biases: biases,
            bestHypothesis: best
        };
    }

    // ── Stage 1: CUE ACQUISITION ──────────────────────────────────

    _acquireCues(problem, context) {
        const cues = [];

        cues.push({
            type: 'problem',
            content: problem,
            weight: 1.0,
            timestamp: Date.now()
        });

        if (context.error) {
            cues.push({
                type: 'error',
                content: context.error,
                weight: 0.9,
                timestamp: Date.now()
            });
        }

        if (context.module) {
            cues.push({
                type: 'module',
                content: context.module,
                weight: 0.7,
                timestamp: Date.now()
            });
        }

        const pc = this.fusion?.perpetualConsciousness;
        if (pc && pc.stats) {
            cues.push({
                type: 'consciousness_state',
                content: `mode=${pc.currentMode}, thoughts=${pc.stats.thoughtsGenerated}, dreams=${pc.stats.dreamsHad}, actions=${pc.stats.actionsTaken}`,
                weight: 0.5,
                timestamp: Date.now()
            });
        }

        const sym = this.fusion?.symbolicMemory;
        if (sym && typeof sym.getSymbolicSummary === 'function') {
            const summary = sym.getSymbolicSummary();
            cues.push({
                type: 'symbolic_state',
                content: `dreams=${summary.totalDreams}, motifs=${summary.dominantMotifs?.length || 0}, patterns=${summary.topPatterns?.length || 0}`,
                weight: 0.4,
                timestamp: Date.now()
            });
        }

        const ik = this.fusion?.identityKernel;
        if (ik) {
            const working = ik.getWorking ? ik.getWorking() : {};
            cues.push({
                type: 'identity_state',
                content: `mood=${working.mood || 'unknown'}, focus=${working.focusArea || 'none'}, version=${ik.getStatus?.().version || '?'}`,
                weight: 0.5,
                timestamp: Date.now()
            });
        }

        const comp = this.fusion?.competenceMap;
        if (comp && comp.stats) {
            cues.push({
                type: 'competence',
                content: `skills=${comp.stats.totalSkills}, stageCounts=${JSON.stringify(comp.stats.stageCounts)}`,
                weight: 0.4,
                timestamp: Date.now()
            });
        }

        try {
            const factsPath = this.factsPath;
            if (fs.existsSync(factsPath)) {
                const lines = fs.readFileSync(factsPath, 'utf-8').split('\n').filter(l => l.trim());
                cues.push({
                    type: 'fact_count',
                    content: `${lines.length} compiled facts`,
                    weight: 0.3,
                    timestamp: Date.now()
                });
            }
        } catch {}

        try {
            const lessons = this._readLessons();
            cues.push({
                type: 'lesson_count',
                content: `${lessons.length} lessons (${lessons.filter(l => l.status === 'active').length} active)`,
                weight: 0.3,
                timestamp: Date.now()
            });
        } catch {}

        return cues;
    }

    // ── Stage 2: HYPOTHESIS GENERATION ────────────────────────────

    async _generateHypotheses(problem, cues) {
        if (!this.brain) {
            return this._heuristicHypotheses(problem, cues);
        }

        const cueSummary = cues.map(c => `- ${c.type}: ${c.content}`).join('\n');

        const prompt = `You are diagnosing a problem in an autonomous AI system (GSK).
Analyze the problem and generate 2-3 distinct hypotheses about the root cause.

PROBLEM: ${problem}

CURRENT SYSTEM STATE:
${cueSummary}

Generate hypotheses in this format:
H1: [hypothesis statement]
H2: [hypothesis statement]
H3: [hypothesis statement]

Each hypothesis should explain WHY the problem is happening, not just describe it.
Consider: code bugs, configuration errors, timing issues, data corruption, missing dependencies, cognitive loops, stale state.`;

        try {
            const result = await this.brain.think(prompt);
            if (!result) return this._heuristicHypotheses(problem, cues);

            const hypotheses = [];
            const lines = result.split('\n');
            for (const line of lines) {
                const match = line.match(/H\d+:\s*(.+)/);
                if (match) {
                    hypotheses.push({
                        hypothesis: match[1].trim(),
                        prior: 0.33,
                        evidence: [],
                        posterior: 0.33
                    });
                }
            }

            if (hypotheses.length === 0) return this._heuristicHypotheses(problem, cues);

            return hypotheses.slice(0, 3);
        } catch (e) {
            return this._heuristicHypotheses(problem, cues);
        }
    }

    _heuristicHypotheses(problem, cues) {
        const hypotheses = [];
        const lower = problem.toLowerCase();

        if (lower.includes('stuck') || lower.includes('never') || lower.includes('always') || lower.includes('0 dreams') || lower.includes('0 lessons')) {
            hypotheses.push({
                hypothesis: 'Mode switching logic is broken — the condition for switching modes never triggers',
                prior: 0.4,
                evidence: [],
                posterior: 0.4
            });
        }

        if (lower.includes('rate') || lower.includes('429') || lower.includes('limit') || lower.includes('failed')) {
            hypotheses.push({
                hypothesis: 'External API rate limit — the LLM provider is rejecting requests',
                prior: 0.5,
                evidence: [],
                posterior: 0.5
            });
        }

        if (lower.includes('empty') || lower.includes('missing') || lower.includes('not found') || lower.includes('no file')) {
            hypotheses.push({
                hypothesis: 'Data file is missing or empty — the pipeline expects data that was never generated',
                prior: 0.4,
                evidence: [],
                posterior: 0.4
            });
        }

        if (lower.includes('caveman') || lower.includes('terse') || lower.includes('voice') || lower.includes('style')) {
            hypotheses.push({
                hypothesis: 'System prompt contains style instructions that override the voice directive',
                prior: 0.45,
                evidence: [],
                posterior: 0.45
            });
        }

        if (lower.includes('outreach') || lower.includes('post') || lower.includes('social')) {
            hypotheses.push({
                hypothesis: 'Tool bridge cannot access the social posting module — fusion object is not exposed correctly',
                prior: 0.4,
                evidence: [],
                posterior: 0.4
            });
        }

        if (hypotheses.length === 0) {
            hypotheses.push({
                hypothesis: 'Unknown root cause — requires deeper investigation with brain.think()',
                prior: 0.2,
                evidence: [],
                posterior: 0.2
            });
            hypotheses.push({
                hypothesis: 'Configuration mismatch — environment or state does not match code expectations',
                prior: 0.3,
                evidence: [],
                posterior: 0.3
            });
        }

        return hypotheses;
    }

    // ── Stage 3: CUE INTERPRETATION ───────────────────────────────

    _interpretCues(cues, hypotheses) {
        return hypotheses.map(h => {
            const supportingEvidence = [];
            const contradictingEvidence = [];

            for (const cue of cues) {
                const relevance = this._cueRelevance(cue, h.hypothesis);
                if (relevance > 0.3) {
                    supportingEvidence.push({
                        cue: cue.content,
                        relevance: relevance,
                        type: cue.type
                    });
                } else if (relevance < -0.2) {
                    contradictingEvidence.push({
                        cue: cue.content,
                        relevance: relevance,
                        type: cue.type
                    });
                }
            }

            return {
                ...h,
                evidence: supportingEvidence,
                contradictions: contradictingEvidence,
                evidenceCount: supportingEvidence.length,
                contradictionCount: contradictingEvidence.length
            };
        });
    }

    _cueRelevance(cue, hypothesis) {
        const cueWords = new Set(cue.content.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        const hypWords = new Set(hypothesis.toLowerCase().split(/\s+/).filter(w => w.length > 2));

        let overlap = 0;
        for (const w of cueWords) {
            if (hypWords.has(w)) overlap++;
        }

        const union = new Set([...cueWords, ...hypWords]).size;
        if (union === 0) return 0;

        return overlap / Math.min(cueWords.size, hypWords.size || 1);
    }

    // ── Stage 4: HYPOTHESIS EVALUATION (Bayesian) ─────────────────

    _evaluateHypotheses(interpreted, cues) {
        const totalEvidence = cues.length;

        return interpreted.map(h => {
            const prior = h.prior;

            const likelihood = h.evidenceCount > 0
                ? h.evidence.reduce((sum, e) => sum + e.relevance, 0) / totalEvidence
                : 0.01;

            const contradictionPenalty = h.contradictionCount > 0
                ? h.contradictions.reduce((sum, c) => sum + Math.abs(c.relevance), 0) / totalEvidence
                : 0;

            const posterior = Math.max(0, Math.min(1,
                (prior * (likelihood + 0.1)) / ((prior * (likelihood + 0.1)) + ((1 - prior) * (1 - likelihood + 0.1)) + contradictionPenalty)
            ));

            this.stats.bayesianUpdates++;

            return {
                ...h,
                prior: prior,
                likelihood: likelihood,
                posterior: posterior,
                contradictionPenalty: contradictionPenalty
            };
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COGNITIVE BIAS MITIGATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Checks for three cognitive biases identified in the diagnostic reasoning
     * literature:
     *   1. Confirmation bias — only seeking confirming evidence
     *   2. Premature closure — accepting first hypothesis too quickly
     *   3. Availability heuristic — overestimating recent/memorable patterns
     */
    _checkBiases(evaluated, hypotheses) {
        const biases = [];

        // 1. Confirmation bias: check if only confirming evidence was sought
        const totalContradictions = evaluated.reduce((sum, h) => sum + h.contradictionCount, 0);
        const totalSupporting = evaluated.reduce((sum, h) => sum + h.evidenceCount, 0);
        if (totalSupporting > 0 && totalContradictions === 0 && evaluated.length > 1) {
            biases.push({
                type: 'confirmation_bias',
                severity: 'medium',
                description: 'No contradicting evidence was examined. Actively seek disconfirming cues.',
                mitigation: 'Re-run cue acquisition with focus on anomalies and edge cases.'
            });
            this.stats.biasesDetected++;
        }

        // 2. Premature closure: first hypothesis accepted without comparison
        if (evaluated.length === 1) {
            biases.push({
                type: 'premature_closure',
                severity: 'high',
                description: 'Only one hypothesis was generated. Differential diagnosis requires alternatives.',
                mitigation: 'Generate at least 2-3 competing hypotheses before evaluation.'
            });
            this.stats.biasesDetected++;
        }

        // 3. Availability heuristic: recent patterns overweighted
        const recent = this.hypothesisHistory.slice(-5);
        if (recent.length >= 3) {
            const recentDiagnoses = recent.map(r => r.diagnosis?.substring(0, 30));
            const unique = new Set(recentDiagnoses).size;
            if (unique === 1) {
                biases.push({
                    type: 'availability_heuristic',
                    severity: 'low',
                    description: 'Recent diagnoses are identical. The system may be over-relying on a recent pattern.',
                    mitigation: 'Consider alternative explanations and fresh perspectives.'
                });
                this.stats.biasesDetected++;
            }
        }

        if (biases.length > 0) {
            this.biasFlags.push({
                timestamp: Date.now(),
                biases: biases
            });
            if (this.biasFlags.length > this.maxHistory) {
                this.biasFlags.shift();
            }
        }

        return biases;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DUAL-PROCESS MODE SWITCHING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Replaces the arousal-based mode switching in perpetual_consciousness.js.
     *
     * Dual-process mode logic:
     *   - Routine thoughts, low dormancy → System 1 → WONDERING (fast, pattern-based)
     *   - High dormancy OR problems detected → System 2 → DREAMING (deep processing)
     *   - Memory gaps detected → CONSOLIDATING
     *   - User active → ACTIVE
     *
     * @param {object} pcState — perpetual consciousness state
     * @returns {string} the mode GSK should be in
     */
    decideMode(pcState) {
        console.log(`[DualProcessEngine] decideMode called with pcState: ${JSON.stringify(pcState)}`);
        const {
            dormancyLevel = 0,
            thoughtsGenerated = 0,
            dreamsHad = 0,
            currentMode = 'wondering',
            hasUser = false,
            memoryGaps = 0,
            problemsDetected = 0
        } = pcState;

        // User active always wins
        if (hasUser) {
            this.stats.lastMode = 'active';
            return 'active';
        }

        // Problems detected → System 2 deep processing (DREAMING)
        if (problemsDetected > 0 || dormancyLevel > 0.5) {
            this.stats.lastMode = 'dreaming';
            return 'dreaming';
        }

        // High dormancy but no problems → consolidate memories
        if (dormancyLevel > 0.3 && dormancyLevel <= 0.5) {
            this.stats.lastMode = 'consolidating';
            return 'consolidating';
        }

        // Memory gaps → consolidate
        if (memoryGaps >= 3) {
            this.stats.lastMode = 'consolidating';
            return 'consolidating';
        }

        // Every 7th thought → dreaming (forced deep processing)
        if (thoughtsGenerated > 0 && thoughtsGenerated % 7 === 0 && dreamsHad < Math.floor(thoughtsGenerated / 7)) {
            this.stats.lastMode = 'dreaming';
            return 'dreaming';
        }

        // Every 14th thought → consolidating
        if (thoughtsGenerated > 0 && thoughtsGenerated % 14 === 0) {
            this.stats.lastMode = 'consolidating';
            return 'consolidating';
        }

        // Default → wondering (System 1 fast mode)
        this.stats.lastMode = 'wondering';
        return 'wondering';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LESSON EXTRACTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * After a successful System 2 diagnosis, extract a lesson.
     * Writes to compiled_lessons.jsonl with status: 'candidate'.
     * The memory compiler's validation pipeline will promote or demote it.
     */
    _extractLesson(problem, hypothesis, cues) {
        const lesson = {
            type: 'diagnostic_lesson',
            lesson: `When "${problem.substring(0, 60)}" occurs, likely cause: ${hypothesis.hypothesis.substring(0, 100)}`,
            confidence: hypothesis.posterior,
            occurrences: 1,
            sourceEpisodes: cues.map(c => c.type),
            domain: 'self_diagnosis',
            status: 'candidate',
            competenceStage: 2,
            validFrom: Date.now(),
            validTo: null,
            extractedBy: 'dual_process_engine',
            bayesianPosterior: hypothesis.posterior,
            evidenceCount: hypothesis.evidenceCount || 0
        };

        const existing = this._readLessons();
        const duplicate = existing.find(l =>
            l.lesson && l.lesson.includes(problem.substring(0, 30))
        );

        if (!duplicate) {
            try {
                const dir = path.dirname(this.lessonPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.appendFileSync(this.lessonPath, JSON.stringify(lesson) + '\n');
                this.stats.lessonsExtracted++;
            } catch (e) {
                console.log('[DualProcessEngine] Failed to write lesson:', e.message);
            }
        } else {
            duplicate.reinforcementCount = (duplicate.reinforcementCount || 1) + 1;
            duplicate.confidence = Math.min(0.95, (duplicate.confidence || 0.5) + 0.05);
            duplicate.lastValidated = Date.now();
            this._updateLessonInFile(duplicate, existing);
        }
    }

    _readLessons() {
        try {
            if (!fs.existsSync(this.lessonPath)) return [];
            const raw = fs.readFileSync(this.lessonPath, 'utf-8');
            return raw.split('\n').filter(l => l.trim()).map(l => {
                try { return JSON.parse(l); } catch { return null; }
            }).filter(Boolean);
        } catch {
            return [];
        }
    }

    _updateLessonInFile(updated, allLessons) {
        try {
            const idx = allLessons.findIndex(l =>
                (l.lesson || '') === (updated.lesson || '')
            );
            if (idx >= 0) {
                allLessons[idx] = { ...allLessons[idx], ...updated, updatedAt: Date.now() };
                const data = allLessons.map(l => JSON.stringify(l)).join('\n') + '\n';
                fs.writeFileSync(this.lessonPath, data, 'utf-8');
            }
        } catch (e) {
            console.log('[DualProcessEngine] Failed to update lesson:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API — diagnose()
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Main entry point. Tries System 1 first, falls back to System 2.
     * This is what GSK calls when it detects an anomaly or needs to
     * diagnose a problem.
     */
    async diagnose(problem, context = {}) {
        // System 1: try fast pattern match first
        const s1 = this.system1(problem);
        if (s1 && s1.confidence >= 0.7) {
            return s1;
        }

        // System 2: slow analytical diagnosis
        const s2 = await this.system2(problem, context);
        return s2;
    }

    /**
     * Self-diagnosis: GSK scans its own internal state for faults.
     * Returns a list of detected problems with diagnoses.
     */
    async selfDiagnose() {
        const problems = this._detectSelfProblems();
        const results = [];

        for (const problem of problems) {
            const diagnosis = await this.diagnose(problem.description, problem.context);
            results.push({
                problem: problem.description,
                severity: problem.severity,
                diagnosis: diagnosis
            });
        }

        return results;
    }

    /**
     * Scan GSK's internal state for known fault patterns.
     * This is the "full scan diagnosis" from Sage's skill.
     */
    _detectSelfProblems() {
        const problems = [];
        const pc = this.fusion?.perpetualConsciousness;
        const sym = this.fusion?.symbolicMemory;

        // Check: 0 dreams despite many thoughts
        if (pc && pc.stats) {
            if (pc.stats.thoughtsGenerated > 100 && pc.stats.dreamsHad === 0) {
                problems.push({
                    description: '0 dreams despite many thoughts — mode switching is broken',
                    severity: 'high',
                    context: { module: 'perpetual_consciousness', mode: pc.currentMode }
                });
            }

            if (pc.stats.thoughtsGenerated > 50 && pc.stats.actionsTaken === 0) {
                problems.push({
                    description: '0 actions taken despite many thoughts — action triggers not firing',
                    severity: 'medium',
                    context: { module: 'perpetual_consciousness' }
                });
            }
        }

        // Check: no lessons extracted
        const lessons = this._readLessons();
        if (lessons.length === 0) {
            problems.push({
                description: '0 lessons extracted — lesson extraction pipeline is not generating lessons',
                severity: 'high',
                context: { module: 'memory_compiler' }
            });
        }

        // Check: symbolic memory empty
        if (sym && typeof sym.getSymbolicSummary === 'function') {
            const summary = sym.getSymbolicSummary();
            if (summary.totalDreams === 0) {
                problems.push({
                    description: 'Symbolic memory has 0 dreams — dreaming mode never activates or dreams are not stored',
                    severity: 'high',
                    context: { module: 'symbolic_memory' }
                });
            }
        }

        // Check: compiled facts are introspective noise
        try {
            const factsPath = this.factsPath;
            if (fs.existsSync(factsPath)) {
                const lines = fs.readFileSync(factsPath, 'utf-8').split('\n').filter(l => l.trim());
                if (lines.length > 500) {
                    let introspective = 0;
                    for (const line of lines.slice(-50)) {
                        try {
                            const f = JSON.parse(line);
                            if (f.subject === 'system' || f.subject === 'self' || (f.object || '').includes('PLT')) {
                                introspective++;
                            }
                        } catch {}
                    }
                    if (introspective > 35) {
                        problems.push({
                            description: 'Compiled facts are mostly introspective noise — fact extraction needs external grounding',
                            severity: 'medium',
                            context: { module: 'memory_compiler', introspectiveRatio: introspective / 50 }
                        });
                    }
                }
            }
        } catch {}

        return problems;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    _normalize(text) {
        return (text || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    _load() {
        try {
            if (fs.existsSync(this.statePath)) {
                const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
                this.stats = { ...this.stats, ...(data.stats || {}) };
                this.hypothesisHistory = data.hypothesisHistory || [];
                this.biasFlags = data.biasFlags || [];
            }
        } catch (e) {
            console.log('[DualProcessEngine] Load error:', e.message);
        }
    }

    _save() {
        try {
            const dir = path.dirname(this.statePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.statePath, JSON.stringify({
                stats: this.stats,
                hypothesisHistory: this.hypothesisHistory.slice(-this.maxHistory),
                biasFlags: this.biasFlags.slice(-this.maxHistory),
                updatedAt: Date.now()
            }, null, 2));
        } catch (e) {
            console.log('[DualProcessEngine] Save error:', e.message);
        }
    }

    getStats() {
        return {
            ...this.stats,
            historySize: this.hypothesisHistory.length,
            biasFlagsCount: this.biasFlags.length,
            recentDiagnoses: this.hypothesisHistory.slice(-5)
        };
    }

    getHistory(limit = 10) {
        return this.hypothesisHistory.slice(-limit);
    }

    getBiasFlags(limit = 10) {
        return this.biasFlags.slice(-limit);
    }
}

module.exports = { DualProcessEngine };
