'use strict';

const { SemanticDeadlockSentry } = require('../governance/deadlock_sentry.js');

/**
 * GOAL RUNNER — the missing organ (Phase 5, Pope decree "GO").
 *
 * Diagnosis that birthed this file: insight-driven goals reached `planned`
 * status and starved — no worker ever claimed them. The autonomy loop only
 * executes its own inline goals. This runner closes the loop:
 *
 *   every tick → claim oldest PLANNED goal with a valid plan
 *              → execute via ApprovedToolExecutor-backed planning engine
 *              → Council pre-flights through the open gate
 *              → goal completes or fails VISIBLY (never silently)
 *              → Semantic Deadlock Sentry monitors for recursive failure loops
 */

class GoalRunner {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.intervalMs = options.intervalMs || 120000; // 2 min
        this.maxExecMinutes = options.maxExecMinutes || 20;
        this.timer = null;
        this.running = false;
        this.stats = {
            startedAt: Date.now(),
            ticks: 0,
            claimed: 0,
            completed: 0,
            failed: 0,
            lastClaim: null,
            lastResult: null,
        };
        this.deadlockSentry = new SemanticDeadlockSentry({
            goalRunner: this,
            scribeBridge: kernel?.systems?.scribeBridge || null,
            onDeadlockDetected: (incident) => {
                if (this.kernel?.emit) this.kernel.emit('deadlock', incident);
            }
        });
    }

    _parts() {
        const s = this.kernel?.systems || {};
        return {
            goalEngine: s.goalEngine || this.kernel?.goalEngine,
            planningEngine: s.planningEngine || this.kernel?.planningEngine,
            scribeBridge: s.scribeBridge || this.kernel?.scribeBridge,
            gskMCPRequest: s.gskMCPRequest || this.kernel?.gskMCPRequest,
        };
    }

    start() {
        if (this.timer) return;
        // First pass shortly after boot so overnight dreams ship fast.
        this.timer = setInterval(() => this.tick().catch(() => {}), this.intervalMs);
        setTimeout(() => this.tick().catch(() => {}), 20000);
        console.log(`[GOAL RUNNER] active — claims PLANNED goals every ${Math.round(this.intervalMs / 1000)}s`);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    async tick() {
        if (this.running) return;
        const { goalEngine, planningEngine } = this._parts();
        if (!goalEngine || !planningEngine) return;
        this.running = true;
        this.stats.ticks++;
        try {
            const { scribeBridge: _sb } = this._parts();
            const goals = Array.isArray(goalEngine.goals) ? goalEngine.goals : [];
            if (this.stats.ticks % 5 === 1) {
                console.log(`[GOAL RUNNER] tick ${this.stats.ticks}: goals=${goals.length} planned=${goals.filter(g => g && g.status === 'planned').length} plannedWithPlan=${goals.filter(g => g && g.status === 'planned' && g.planId).length}`);
            }
            const claimable = goals
                .filter(g => g && g.status === 'planned' && g.planId);

            if (claimable.length === 0) return;

            // Partition: executable (checkpoint alive) vs orphans (pre-Phase5
            // plans whose checkpoints died with an old boot). Purge orphans
            // LOUDLY in one sweep instead of starving a tick at a time.
            let orphans = 0;
            const executable = [];
            for (const g of claimable) {
                const p = planningEngine.getPlan(g.planId);
                if (p) executable.push({ g, p });
                else {
                    orphans++;
                    goalEngine.update(g.id, 'failed', { lastError: 'plan checkpoint lost (pre-Phase5 boot) — superseded by newer dreams' });
                }
            }
            if (orphans > 0) {
                console.log(`[GOAL RUNNER] purged ${orphans} orphaned plan reference(s) — checkpoints lost across reboots`);
            }
            // Newest dreams first: the Pope wants current visions shipped.
            executable.sort((a, b) => (b.g.createdAt || 0) - (a.g.createdAt || 0));
            if (executable.length === 0) return;

            const goal = executable[0].g;
            const plan = executable[0].p;

            this.stats.claimed++;
            this.stats.lastClaim = { goalId: goal.id, title: goal.title, at: Date.now() };
            console.log(`[GOAL RUNNER] claiming PLANNED goal ${goal.id}: "${String(goal.title).substring(0, 90)}"`);

            // PLT Gate: heavy web-scrape intents must pass Council review.
            // Phase 4 (2026-10-20): FAIL CLOSED. Values come from the council
            // advisory and are judged by the ONE canonical PLT engine
            // (gsk-core/plt-engine.js evaluate()). No defaults: missing or
            // non-finite PLT values block the goal, and a gate error blocks
            // the goal — the old "proceeding cautiously" fail-open is gone.
            const intent = JSON.stringify({ title: goal.title, plan });
            if (/web.scr?p|e?scrape|fetch.*doc|research.*web/i.test(intent)) {
                let { gskMCPRequest } = this._parts();
                // PHASE 6 WIRING: no transport was ever bound in the
                // shipped body (the _parts() lookup even carried a
                // 'kskMCPRequest' typo), so the gate could only ever
                // fail closed by absence. Fall back to the in-process
                // MCP server the fusion already runs — the same
                // _executeMethod the HTTP transport dispatches to.
                if (typeof gskMCPRequest !== 'function') {
                    const mcp = this.kernel?.systems?.mcpServer?.server || this.kernel?.systems?.mcpServer || null;
                    if (mcp && typeof mcp._executeMethod === 'function') {
                        gskMCPRequest = async (_endpoint, body) => ({ result: await mcp._executeMethod(body.tool, body.args) });
                    }
                }
                const blockGoal = (reason) => {
                    goalEngine.update(goal.id, 'failed', {
                        lastError: `PLT gate BLOCKED web-scrape intent — ${reason}`,
                        completedAt: null,
                    });
                    console.warn(`[GOAL RUNNER] PLT gate BLOCKED goal ${goal.id} — ${reason}`);
                    this.stats.failed++;
                };
                try {
                    const verdict = await gskMCPRequest('/mcp/execute', {
                        tool: 'consciousness.state',
                        args: { action: 'council_advisory', intent: 'web_scrape', payload: goal.title }
                    }, 10000);
                    const plt = (verdict && verdict.result && verdict.result.plt) || {};
                    const chambersPlt = plt.chambers || {};
                    const values = {
                        profit: (typeof plt.profit === 'number' ? plt.profit : (typeof chambersPlt.profit === 'number' ? chambersPlt.profit : undefined)),
                        love: (typeof plt.love === 'number' ? plt.love : (typeof chambersPlt.love === 'number' ? chambersPlt.love : undefined)),
                        tax: (typeof plt.tax === 'number' ? plt.tax : (typeof chambersPlt.tax === 'number' ? chambersPlt.tax : undefined)),
                    };
                    const { PLTEngine } = require('../plt-engine.js');
                    const ev = PLTEngine.prototype.evaluate(values);
                    if (!ev.valid || !ev.viable) {
                        blockGoal(ev.reason);
                        return; // Cease execution of this single claimed goal
                    }
                    console.log(`[GOAL RUNNER] PLT gate approved web-scrape intent (profit=${values.profit}, love=${values.love}, tax=${values.tax}, trueValue=${ev.trueValue})`);
                } catch (gateErr) {
                    blockGoal(`gate error — failing closed: ${gateErr.message}`);
                    return; // Cease execution of this single claimed goal
                }
            }

            const startedAt = Date.now();
            let execution;
            try {
                execution = await Promise.race([
                    planningEngine.executePlan(plan, { source: 'goal_runner', projectRoot: goal.projectRoot || null }),
                    new Promise(res => setTimeout(() => res({ status: 'timeout', error: `exceeded ${this.maxExecMinutes}min` }), this.maxExecMinutes * 60000)),
                ]);
                // Observe successful/failed action for deadlock detection
                this.deadlockSentry.observe(plan.name || goal.action, goal.target || goal.projectRoot, execution.status === 'failed' ? 'fail' : 'success', goal.sessionId || goal.id);
            } catch (e) {
                execution = { status: 'failed', error: e.message };
                // Observe failed execution for deadlock detection
                this.deadlockSentry.observe(plan.name || goal.action, goal.target || goal.projectRoot, 'fail', goal.sessionId || goal.id);
            }

            const ok = execution && (execution.status === 'completed' || execution.verified === true);
            // POPE FIX 2026-09-16: never record a blank death. 347 failures had
            // empty lastError (silent). Fall back to an execution snapshot.
            let errNote = ok ? null : ((execution && execution.error) || (execution && execution.status) || 'execution failed');
            if (!ok && (!errNote || !String(errNote).trim() || String(errNote).trim() === 'execution failed')) {
                try {
                    const steps = Array.isArray(execution && execution.steps) ? execution.steps : (plan && plan.steps) || [];
                    const stepBits = steps.slice(0, 8).map((s) => `${s.tool || s.name || '?'}:${s.status || '?'}`).join(',');
                    errNote = `status=${(execution && execution.status) || plan.status || '?'} steps=[${stepBits}] plan=${plan.id || plan.name || '?'}`;
                } catch { errNote = 'execution failed (snapshot unavailable)'; }
            }
            goalEngine.update(goal.id, ok ? 'completed' : 'failed', {
                lastError: errNote,
                completedAt: ok ? Date.now() : null,
            });
            if (ok) this.stats.completed++; else this.stats.failed++;
            this.stats.lastResult = { goalId: goal.id, ok, status: execution && execution.status, ms: Date.now() - startedAt };

            const line = `[GOAL RUNNER] ${ok ? 'COMPLETED' : 'FAILED'} "${String(goal.title).substring(0, 70)}" (${Math.round((Date.now() - startedAt) / 1000)}s)`;
            if (ok) console.log(line); else console.warn(line);

            try {
                const { scribeBridge } = this._parts();
                if (scribeBridge && typeof scribeBridge.forwardEvent === 'function') {
                    scribeBridge.forwardEvent({
                        type: 'goal_runner',
                        content: `${ok ? 'COMPLETED' : 'FAILED'}: ${goal.title} | ${(execution && execution.error) || ''}`,
                        source: 'GSK',
                        tags: ['goal-runner', ok ? 'shipped' : 'failed'],
                    }).catch(() => {});
                }
            } catch (e) { /* never block on witnessing */ }
        } catch (e) {
            console.warn('[GOAL RUNNER] tick error:', e.message);
        } finally {
            this.running = false;
        }
    }

    getStatus() {
        return { ...this.stats, intervalMs: this.intervalMs, running: this.running };
    }
}

module.exports = { GoalRunner };
