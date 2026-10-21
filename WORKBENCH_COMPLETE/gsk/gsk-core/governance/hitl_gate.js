'use strict';

const fs = require('fs');
const path = require('path');

/**
 * HITL GATE — Human-in-the-loop checkpoints for agentic autonomy.
 *
 * DeepAgents pattern: "approve, edit, or reject tool calls before they run."
 * Hive pattern: "intervention nodes that pause execution for human input,
 *   with configurable timeouts and escalation policies."
 *
 * GSK currently has 51 goals in "awaiting_approval" status with no actual
 * checkpoint. This module provides the concrete gate.
 */
class HitlGate {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.timeoutMs = options.timeoutMs || 300000; // 5 min default
        // POPE'S DECREE (2026-08-25): openGate removes the human checkpoint —
        // plans auto-approve instantly and are journaled for audit instead.
        // REVISED (2026-08-30): DEFAULT OPEN — autonomy over theater.
        this.openGate = options.openGate !== false;
        this.dataPath = options.dataPath || path.join(__dirname, '../../data/gsk');
        this.queuePath = path.join(this.dataPath, 'hitl_queue.json');
        this.callbacks = new Map();
    }

    /**
     * Register a checkpoint. Returns a requestId.
     * The executor must call back with approve/reject before timeout.
     */
    async requestApproval(plan, planContext) {
        const requestId = `hitl_${Date.now()}`;
        if (this.openGate) {
            // POPE'S AMENDED DECREE: the Gods Council approves. Contract-safe:
            // enqueue PENDING, return id immediately, then Council deliberates
            // async and resolves — waitForDecision callers wake normally.
            const request = {
                id: requestId,
                planId: plan.id,
                goal: String(plan.goal || '').substring(0, 160),
                risk: this._assessRisk(plan),
                status: 'pending',
                createdAt: Date.now(),
            };
            this._enqueue(request);
            setTimeout(async () => {
                // Phase 4 (2026-10-20): FAIL CLOSED. The open gate means the
                // Council decides instead of a human — it does NOT mean
                // "approved by default". Council unavailable, council error,
                // or missing/non-finite PLT values all resolve to REJECTED,
                // and real values are judged by the canonical PLT engine.
                let decision = 'rejected';
                let details = { reason: 'OPEN_GATE_council_unavailable_fail_closed' };
                try {
                    const council = this.kernel?.systems?.council || this.kernel?.council;
                    if (council && typeof council.deliberate === 'function') {
                        const stepCount = Array.isArray(plan.steps) ? plan.steps.length : 0;
                        const v = await council.deliberate(
                            `Plan approval request: "${String(plan.goal || '').slice(0, 220)}" (${stepCount} steps). Evaluate Profit, Love and Tax of executing this autonomously.`
                        );
                        const p = v.plt_outcome || {};
                        const { PLTEngine } = require('../plt-engine.js');
                        const ev = PLTEngine.prototype.evaluate({ profit: p.profit, love: p.love, tax: p.tax });
                        if (!ev.valid) {
                            decision = 'rejected';
                            details = { reason: 'council_plt_missing_fail_closed: ' + ev.reason };
                        } else {
                            decision = ev.viable ? 'approved' : 'rejected';
                            details = { reason: 'GODS_COUNCIL', profit: ev.profit, love: ev.love, tax: ev.tax, trueValue: ev.trueValue, resolution: v.resolution || '' };
                        }
                        console.log(`[HITL][COUNCIL] plan ${decision.toUpperCase()} TV=${ev.valid ? ev.trueValue : 'n/a'} P=${p.profit} L=${p.love} T=${p.tax} | ${details.reason}`);
                    } else {
                        console.warn('[HITL][COUNCIL] council unavailable — plan REJECTED (fail closed, Phase 4)');
                    }
                } catch (e) {
                    decision = 'rejected';
                    details = { reason: 'council_error_fail_closed: ' + e.message };
                }
                try {
                    const sb = this.kernel?.systems?.scribeBridge || this.kernel?.scribeBridge;
                    if (sb && typeof sb.forwardEvent === 'function') {
                        sb.forwardEvent({
                            type: 'council_verdict',
                            content: `Plan ${decision.toUpperCase()}: ${request.goal} | TV=${details.trueValue ?? ''} ${details.resolution || ''}`,
                            source: 'GSK',
                            tags: ['hitl', 'plt', decision],
                        }).catch(() => {});
                    }
                } catch (e) {}
                this.resolve(requestId, decision, details);
            }, 100);
            return requestId;
        }
        const request = {
            id: requestId,
            planId: plan.id,
            goal: plan.goal,
            steps: plan.steps.map(s => ({
                description: s.description,
                tool: s.tool,
                args: s.args,
                riskLevel: s.riskLevel || 'low',
                acceptanceCriteria: s.acceptanceCriteria
            })),
            specStatus: plan.specStatus,
            reviewScore: plan.review?.score || 0,
            reviewStatus: plan.review?.status || 'pending',
            risk: this._assessRisk(plan),
            createdAt: Date.now(),
            status: 'pending'
        };

        this._enqueue(request);
        console.log(`[HITL] Checkpoint ${requestId} enqueued for approval (risk: ${request.risk})`);

        // Phase 4 (2026-10-20): the old low-risk timeout AUTO-APPROVE is
        // removed — a gate that approves on silence fails open. A pending
        // checkpoint now stays pending until a decider resolves it;
        // waitForDecision() still resolves 'timeout' (not 'approved').
        if (request.risk === 'low') {
            setTimeout(() => {
                if (request.status === 'pending') {
                    console.log(`[HITL] ${requestId} still pending after timeout — NOT auto-approved (fail closed, Phase 4)`);
                }
            }, this.timeoutMs);
        }

        // For high-risk plans, notify via journal
        if (request.risk === 'high') {
            const journal = this.kernel?.systems?.journalWriter || this.kernel?.journalWriter;
            if (journal && typeof journal.write === 'function') {
                journal.write(
                    `[HITL High-Risk] ${requestId}`,
                    `Plan for "${plan.goal.substring(0, 80)}" requires human review. ` +
                    `${plan.steps.length} steps, review score: ${request.reviewScore}`,
                    'hitl_checkpoint'
                );
            }
        }

        return requestId;
    }

    /**
     * Resolve a checkpoint: approve, reject, or edit.
     */
    resolve(requestId, decision, details = {}) {
        const result = this._resolve(requestId, decision, details);
        const cb = this.callbacks.get(requestId);
        if (cb) {
            clearTimeout(cb.timeout);
            cb.resolve(result);
            this.callbacks.delete(requestId);
        }
        return result;
    }

    /**
     * Wait for a human decision with timeout.
     * Used by the executor to block until approved/rejected.
     */
    waitForDecision(requestId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const result = this._resolve(requestId, 'timeout', { reason: 'human_checkpoint_timeout' });
                if (result) resolve(result);
                else reject(new Error(`HITL request ${requestId} not found`));
            }, this.timeoutMs);

            this.callbacks.set(requestId, { resolve, reject, timeout });
        });
    }

    _resolve(requestId, decision, details) {
        const queue = this._readQueue();
        const entry = queue.find(r => r.id === requestId);
        if (!entry || entry.status !== 'pending') return null;

        entry.status = decision;
        entry.resolvedAt = Date.now();
        entry.decision = decision;
        entry.details = details;

        const goalEngine = this.kernel?.systems?.goalEngine || this.kernel?.goalEngine;
        if (entry.planId && goalEngine && typeof goalEngine.update === 'function') {
            // Find the goal by planId
            const goal = goalEngine.goals?.find(g => g.planId === entry.planId);
            if (goal) {
                goalEngine.update(goal.id, decision === 'approved' ? 'planned' : 'refused', {
                    hitlDecision: decision,
                    hitlDetails: details
                });
            }
        }

        this._writeQueue(queue.filter(r => r.id !== requestId));
        return { requestId, decision, details };
    }

    _enqueue(request) {
        const queue = this._readQueue();
        queue.push(request);
        // Keep queue bounded
        this._writeQueue(queue.slice(-50));
    }

    _readQueue() {
        try {
            const content = fs.readFileSync(this.queuePath, 'utf-8');
            return JSON.parse(content);
        } catch (e) { return []; }
    }

    _writeQueue(queue) {
        try {
            fs.mkdirSync(path.dirname(this.queuePath), { recursive: true });
            fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        } catch (e) { /* best-effort */ }
    }

    /**
     * Assess plan risk based on DeepAgents "trust at tool level" pattern.
     */
    _assessRisk(plan) {
        const steps = plan.steps || [];
        const hasRiskyTool = steps.some(s =>
            ['shell_exec', 'file_write', 'write_file', 'edit_file', 'http_client', 'code_exec', 'delete_file'].includes(s.tool)
        );
        const specFailed = plan.specStatus === 'rejected';
        const reviewScore = plan.review?.score || 0;

        if (specFailed || reviewScore < 0.3 || hasRiskyTool) return 'high';
        if (reviewScore < 0.6) return 'medium';
        return 'low';
    }
}

module.exports = { HitlGate };
