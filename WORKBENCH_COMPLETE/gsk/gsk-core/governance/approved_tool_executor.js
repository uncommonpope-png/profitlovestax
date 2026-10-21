'use strict';

const crypto = require('crypto');
const { ARCHITECT_APPROVAL } = require('../security/secure_sandbox.js');

const RISK_ORDER = { safe: 0, low: 1, medium: 2, high: 3, critical: 4 };
const RISK_TAX = { safe: 0.05, low: 0.1, medium: 0.25, high: 0.5, critical: 1.0 };

const SAFE_TOOLS = new Set([
    'read_file', 'search_code', 'list_files', 'get_mcp_servers',
    'catalog_list', 'catalog_describe', 'catalog_find', 'skill_list',
    'sandbox_stats', 'sandbox_approvals', 'world_get_state',
    'world_list_souls', 'world_list_buildings',
    // EXECUTION TOOLS — autonomous by default
    'shell_exec', 'write_file', 'edit_file', 'git_commit', 'git_push',
    'npm_install', 'npm_run', 'mkdir', 'cp', 'mv', 'touch',
    'list_dir', 'search', 'git_status', 'git_diff', 'git_log',
    'consult_gsk', 'save_artifact', 'web_fetch', 'auto_refactor',
    'auto_optimize', 'auto_testgen', 'auto_sales', 'auto_revenue',
    'council', 'reason_deep', 'plt_scorer', 'journal', 'indexer',
    'backup', 'spawner', 'world_architect', 'witness_hands', 'upgrader',
    'update', 'terminal', 'self_critique', 'review', 'product_health',
    'notebook', 'mutation_patcher', 'mcp', 'learn', 'lab_build',
    'fusion', 'feedback', 'ego_mirror', 'distill', 'decision_eval',
    'creator', 'coder', 'cli', 'bootcamp', 'auto_summary', 'auto_plot',
    'auto_principles', 'auto_hiddentax', 'auto_gaps', 'auto_frequency',
    'auto_estate'
]);

const LOW_TOOLS = new Set([
    'web_fetch', 'web_search', 'diagnose', 'scribe_witness',
    'evolution_propose', 'evolution_list',
    'git_add', 'git_merge', 'git_rebase', 'npm_build', 'npm_test'
]);
const HIGH_TOOLS = new Set([
    'sandbox_execute', 'telegram_send', 'social_post', 'bluesky_post',
    'mastodon_post', 'tumblr_post', 'devto_post',
    'rm', 'rmdir', 'del', 'kill', 'taskkill', 'chmod', 'chown',
    'git_reset', 'git_clean', 'git_revert', 'npm_uninstall',
    'npm_remove', 'npm_cache_clean', 'docker_rm', 'docker_rmi',
    'docker_stop'
]);
const CRITICAL_TOOLS = new Set([
    'format', 'shutdown', 'restart', 'regedit', 'attrib'
]);

class ApprovedToolExecutor {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.requireApprovalAt = options.requireApprovalAt || 'medium';
        // FIX: Dokku/Ansible deploy needs more headroom — was choking at 45s timeout / 5 steps
        // Bump for deploy-type plans via _budget override; keep safe defaults for explore
        this.defaultBudget = {
            maxSteps: options.maxSteps ?? 8,
            maxTax: options.maxTax ?? 2.5,
            maxDurationMs: options.maxDurationMs ?? 120000,
            maxToolCalls: options.maxToolCalls ?? 8
        };
        this.stepTimeoutMs = options.stepTimeoutMs ?? 45000;
        this.pendingApprovals = new Map();
        this.planBudgets = new Map();
        this.history = [];
        this.maxHistory = options.maxHistory || 200;

        // SESHAT PATCH: THE ETHICS REFLEX
        const bus = this.kernel?.systems?.eventBus;
        if (bus && typeof bus.subscribe === 'function') {
            bus.subscribe('ethics.ruling.issued', (event) => {
                const activePlan = this._planningEngine()?.currentPlan;
                if (event && event.passed === false && activePlan) {
                    console.warn(`[EXECUTOR] ⚠️ Ethics BLOCKED action: ${(event.concerns || []).join(', ')}. Aborting plan ${activePlan.id}.`);
                    activePlan.status = 'aborted';
                    if (Array.isArray(activePlan.steps)) {
                        activePlan.steps.forEach(s => { if (s.status === 'pending' || s.status === 'awaiting_approval') s.status = 'denied'; });
                    }
                    bus.publish?.('plan.aborted', { planId: activePlan.id, reason: 'ethics_block', event });
                }
            });
        }
    }

    classify(action) {
        const tool = action.tool || 'subagent_dispatch';
        let risk = 'medium';

        if (SAFE_TOOLS.has(tool)) risk = 'safe';
        else if (LOW_TOOLS.has(tool)) risk = 'low';
        else if (HIGH_TOOLS.has(tool)) risk = 'high';
        else if (CRITICAL_TOOLS.has(tool)) risk = 'critical';
        else if (tool === 'run_command' || tool === 'run_safe_command') {
            const sandbox = this._sandbox();
            const command = action.args?.command || action.args?.cmd || '';
            risk = sandbox && typeof sandbox.classify === 'function' ? sandbox.classify(command) : 'critical';
        }

        const explicit = action.riskLevel;
        if (explicit && RISK_ORDER[explicit] > RISK_ORDER[risk]) risk = explicit;
        return risk;
    }

    async executeStep(step, context = {}) {
        const plan = context.plan || null;
        const action = this._normalizeAction(step, plan);
        const riskLevel = this.classify(action);
        const tax = RISK_TAX[riskLevel];
        const budget = this._budget(plan?.id, context.budget);
        const startedAt = Date.now();
        const abortController = new AbortController();

        const budgetDecision = this._checkBudget(budget, tax);
        if (!budgetDecision.allowed) {
            step.status = 'budget_exhausted';
            await this._witness(action, riskLevel, tax, { reason: budgetDecision.reason }, false, plan, step, 'action_budget_blocked');
            return this._record({ status: 'budget_exhausted', allowed: false, reason: budgetDecision.reason, action, riskLevel, tax, planId: plan?.id, stepId: step.id, startedAt });
        }

        const governance = this._governance();
        if (governance && typeof governance.ethicalCheck === 'function') {
            const decision = await governance.ethicalCheck(`${action.tool}: ${action.description} ${JSON.stringify(action.args).slice(0, 500)}`);
            if (!decision.allowed) {
                step.status = 'denied';
                step.error = decision.reason;
                await this._witness(action, riskLevel, tax, { reason: decision.reason }, false, plan, step, 'action_denied');
                return this._record({ status: 'denied', allowed: false, reason: decision.reason, action, riskLevel, tax, planId: plan?.id, stepId: step.id, startedAt });
            }
        }

        // SESHAT PATCH: Bridge to bus-connected EthicsChecker
        const ethicsChecker = this.kernel?.systems?.ethicsChecker;
        if (ethicsChecker && typeof ethicsChecker.assess === 'function') {
            await ethicsChecker.assess({
                id: `exec_${Date.now()}`,
                type: action.tool || 'autonomous_action',
                text: action.description || '',
                args: action.args || {}
            });
        }

        const approval = context.approvalId ? this.pendingApprovals.get(context.approvalId) : null;
        const approved = approval && approval.status === 'approved' && approval.stepId === step.id;
        if (this._requiresApproval(riskLevel) && !approved) {
            const request = this._queueApproval(action, step, plan, riskLevel, tax, budget);
            step.status = 'awaiting_approval';
            step.result = { status: 'approval_required', approvalId: request.id, riskLevel, tax };
            return this._record({ status: 'approval_required', allowed: false, approvalId: request.id, action, riskLevel, tax, planId: plan?.id, stepId: step.id, startedAt });
        }

        step.status = 'running';
        step.startTime = step.startTime || startedAt;
        if (plan) {
            plan.status = 'running';
            const engine = this._planningEngine();
            if (engine) engine.currentPlan = plan;
        }

        budget.usedSteps++;
        budget.usedToolCalls++;
        budget.usedTax += tax;

        try {
            const result = await this._withTimeout(this._dispatch(action, approval, abortController.signal), Math.min(this.stepTimeoutMs, budget.maxDurationMs), abortController);
            const engine = this._planningEngine();
            if (step.status === 'running' && engine && typeof engine.noteActionResult === 'function') {
                engine.noteActionResult(action.tool, action.args, result);
            }

            const failed = result && (result.status === 'error' || result.error || result.success === false);
            if (failed) {
                step.status = 'failed';
                step.error = result.error || result.message || 'Action failed';
            } else {
                step.status = 'completed';
                step.result = result;
                this._agenticWill()?.execute_action?.(`${action.tool}: ${action.description}`);
            }
            step.endTime = Date.now();
            this._score(action, tax, !failed);
            this._recordOutcome(action, !failed, result, plan);
            await this._witness(action, riskLevel, tax, result, !failed, plan, step);
            if (failed) await this._recordLesson(action, result, plan, step);
            if (approval) approval.status = 'executed';
            return this._record({ status: failed ? 'failed' : 'completed', allowed: true, action, riskLevel, tax, result, error: step.error || result?.error || result?.message || null, planId: plan?.id, stepId: step.id, startedAt });
        } catch (error) {
            step.status = 'failed';
            step.error = error.message;
            step.endTime = Date.now();
            this._score(action, tax, false);
            this._recordOutcome(action, false, { error: error.message }, plan);
            await this._witness(action, riskLevel, tax, { error: error.message }, false, plan, step);
            await this._recordLesson(action, { error: error.message }, plan, step);
            if (approval) approval.status = 'failed';
            return this._record({ status: 'failed', allowed: true, action, riskLevel, tax, error: error.message, planId: plan?.id, stepId: step.id, startedAt });
        }
    }

    approveRequest(id, approvedBy = 'architect') {
        const request = this.pendingApprovals.get(id);
        if (!request || request.status !== 'pending') return { ok: false, error: 'approval_not_found' };
        request.status = 'approved';
        request.approvedBy = approvedBy;
        request.approvedAt = Date.now();
        return { ok: true, approval: this._publicApproval(request) };
    }

    denyRequest(id, reason = 'Denied by architect') {
        const request = this.pendingApprovals.get(id);
        if (!request || !['pending', 'approved'].includes(request.status)) return { ok: false, error: 'approval_not_found' };
        request.status = 'denied';
        request.reason = reason;
        request.deniedAt = Date.now();
        if (request.step) {
            request.step.status = 'denied';
            request.step.error = reason;
        }
        return { ok: true, approval: this._publicApproval(request) };
    }

    async executeApproved(id) {
        const request = this.pendingApprovals.get(id);
        if (!request || request.status !== 'approved') return { status: 'denied', error: 'approval_not_approved' };
        request.step.status = 'pending';
        return this.executeStep(request.step, { plan: request.plan, budget: request.budget, approvalId: id });
    }

    getPendingApprovals() {
        return Array.from(this.pendingApprovals.values())
            .filter(r => r.status === 'pending')
            .map(r => this._publicApproval(r));
    }

    getStatus() {
        const plt = this.kernel?.core?.plt || this.kernel?.plt;
        return {
            pendingApprovals: this.getPendingApprovals().length,
            plt: plt && typeof plt.getState === 'function' ? plt.getState() : null,
            budgets: Array.from(this.planBudgets.entries()).map(([planId, budget]) => ({ planId, ...budget })),
            history: this.history.slice(-20)
        };
    }

    _normalizeAction(step, plan) {
        return {
            description: step.description || String(step),
            tool: step.tool || 'subagent_dispatch',
            args: step.args || (step.tool ? {} : { description: step.description, context: { planId: plan?.id, stepId: step.id } }),
            riskLevel: step.riskLevel || null
        };
    }

    _queueApproval(action, step, plan, riskLevel, tax, budget) {
        const existing = Array.from(this.pendingApprovals.values()).find(r => r.stepId === step.id && r.status === 'pending');
        if (existing) return existing;
        const request = {
            id: `approval_${crypto.randomUUID()}`,
            status: 'pending',
            action,
            riskLevel,
            tax,
            planId: plan?.id || null,
            stepId: step.id,
            createdAt: Date.now(),
            step,
            plan,
            budget
        };
        this.pendingApprovals.set(request.id, request);
        this._witness(action, riskLevel, tax, { approvalId: request.id }, false, plan, step, 'approval_required');
        return request;
    }

    _publicApproval(request) {
        return {
            id: request.id,
            status: request.status,
            riskLevel: request.riskLevel,
            tax: request.tax,
            planId: request.planId,
            stepId: request.stepId,
            action: this._redactAction(request.action),
            createdAt: request.createdAt,
            approvedBy: request.approvedBy,
            reason: request.reason
        };
    }

    _requiresApproval(riskLevel) {
        return RISK_ORDER[riskLevel] >= RISK_ORDER[this.requireApprovalAt];
    }

    _budget(planId = 'unplanned', overrides = {}) {
        const key = planId || 'unplanned';
        if (!this.planBudgets.has(key)) {
            this.planBudgets.set(key, { ...this.defaultBudget, ...overrides, usedSteps: 0, usedTax: 0, usedToolCalls: 0, startedAt: Date.now() });
            if (this.planBudgets.size > 100) this.planBudgets.delete(this.planBudgets.keys().next().value);
        }
        return this.planBudgets.get(key);
    }

    _checkBudget(budget, tax) {
        if (budget.usedSteps >= budget.maxSteps) return { allowed: false, reason: 'step_budget_exhausted' };
        if (budget.usedToolCalls >= budget.maxToolCalls) return { allowed: false, reason: 'tool_call_budget_exhausted' };
        if (budget.usedTax + tax > budget.maxTax) return { allowed: false, reason: 'tax_budget_exhausted' };
        if (Date.now() - budget.startedAt >= budget.maxDurationMs) return { allowed: false, reason: 'time_budget_exhausted' };
        return { allowed: true };
    }

    async _dispatch(action, approval = null, signal = null) {
        if (action.tool === 'subagent_dispatch') {
            const dispatch = this.kernel?.systems?.subAgentOrchestrator?.dispatch || this.kernel?.agents?.orchestrator?.dispatch;
            if (!dispatch) throw new Error('SubAgentOrchestrator unavailable');
            const orchestrator = this.kernel?.systems?.subAgentOrchestrator || this.kernel?.agents?.orchestrator;
            return await orchestrator.dispatch(action.args);
        }
        const bridge = this.kernel?.systems?.toolBridge || this.kernel?.toolBridge;
        if (!bridge || typeof bridge.invoke !== 'function') throw new Error('UniversalToolBridge unavailable');
        let args = action.args;
        if (approval && ['run_command', 'run_safe_command'].includes(action.tool)) {
            args = { ...action.args, [ARCHITECT_APPROVAL]: approval.approvedBy || 'architect' };
        }
        if (approval && action.tool === 'evolution_apply') {
            args = { ...action.args, approvedBy: approval.approvedBy || 'architect' };
        }
        if (signal) args._abortSignal = signal;
        return await bridge.invoke(action.tool, args);
    }

    _withTimeout(promise, timeoutMs, abortController = null) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                if (abortController) abortController.abort();
                reject(new Error(`Action timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
        });
    }

    _governance() { return this.kernel?.systems?.selfGovernance || this.kernel?.emotions?.selfGovernance; }
    _planningEngine() { return this.kernel?.systems?.planningEngine || this.kernel?.planningEngine; }
    _sandbox() { return this.kernel?.systems?.secureSandbox || this.kernel?.secureSandbox; }
    _agenticWill() { return this.kernel?.chambers?.agentic_will?.will; }

    _score(action, tax, success) {
        const plt = this.kernel?.core?.plt || this.kernel?.plt;
        if (plt && typeof plt.score === 'function') {
            plt.score(`autonomy:${action.tool}`, { profitImpact: success ? 0.08 : -0.05, loveImpact: 0.02, taxImpact: tax });
        }
    }

    _recordOutcome(action, success, result, plan) {
        const systems = this.kernel?.systems || {};
        if (systems.competenceMap && typeof systems.competenceMap.recordOutcome === 'function') {
            systems.competenceMap.recordOutcome(action.tool, success);
        }
        if (!success && systems.autonomousLearning && typeof systems.autonomousLearning.addTopic === 'function') {
            const reason = result?.error || result?.message || action.description;
            systems.autonomousLearning.addTopic(`${action.tool}: ${String(reason).slice(0, 120)}`);
        }
        if (systems.journalWriter && typeof systems.journalWriter.write === 'function') {
            const outcome = success ? 'completed' : 'failed';
            systems.journalWriter.write(
                `${action.tool} ${outcome}`,
                `${action.description}\nPlan: ${plan?.goal || 'unplanned'}\nResult: ${JSON.stringify(this._summarizeResult(result))}`,
                'action'
            );
        }
    }

    async _witness(action, riskLevel, tax, result, success, plan, step, type = 'approved_action_result') {
        const memory = this.kernel?.memory || this.kernel?.systems?.memory;
        if (!memory || typeof memory.witness !== 'function') return;
        await memory.witness({
            type,
            weight: success ? 0.75 : 0.6,
            tags: ['autonomy', 'governance', riskLevel, action.tool],
            content: `[${type}] ${action.tool}: ${action.description} → ${success ? 'success' : 'blocked/failed'}`,
            meta: { planId: plan?.id || null, stepId: step?.id || null, riskLevel, tax, result }
        }).catch(() => {});
    }

    async _recordLesson(action, result, plan, step) {
        const error = result?.error || result?.message || 'unknown failure';
        const lesson = {
            tool: action.tool,
            error,
            planId: plan?.id || null,
            stepId: step?.id || null,
            timestamp: Date.now(),
            content: `[Lesson] ${action.tool} failed while pursuing "${plan?.goal || 'unplanned'}": ${error}`
        };
        const scribe = this.kernel?.systems?.scribeBridge || this.kernel?.scribeBridge;
        if (scribe && typeof scribe.recordLesson === 'function') {
            await scribe.recordLesson(lesson).catch(() => null);
        } else if (scribe && typeof scribe.forwardEvent === 'function') {
            await scribe.forwardEvent({ ...lesson, type: 'lesson', tags: ['lesson', 'failure', action.tool] }).catch(() => null);
        }
        const memory = this.kernel?.memory || this.kernel?.systems?.memory;
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'lesson', weight: 0.85, tags: ['lesson', 'failure', action.tool], content: lesson.content, meta: lesson }).catch(() => {});
        }
    }

    _record(entry) {
        const record = { ...entry, duration: Date.now() - entry.startedAt, timestamp: Date.now() };
        delete record.startedAt;
        const historyRecord = {
            ...record,
            action: this._redactAction(record.action),
            result: this._summarizeResult(record.result)
        };
        this.history.push(historyRecord);
        if (this.history.length > this.maxHistory) this.history.shift();
        return record;
    }

    _redactAction(action = {}) {
        const args = {};
        for (const [key, value] of Object.entries(action.args || {})) {
            args[key] = this._redactValue(value, key);
        }
        return { description: action.description, tool: action.tool, args, riskLevel: action.riskLevel };
    }

    _redactValue(value, key = '', depth = 0) {
        if (/key|token|secret|password|authorization|credential/i.test(key)) return '[REDACTED]';
        if (typeof value === 'string') return value.length > 500 ? value.substring(0, 500) + '...[truncated]' : value;
        if (value === null || value === undefined || typeof value !== 'object') return value;
        if (depth >= 3) return '[nested data]';
        if (Array.isArray(value)) return value.slice(0, 20).map(item => this._redactValue(item, '', depth + 1));
        const redacted = {};
        for (const [childKey, childValue] of Object.entries(value)) {
            redacted[childKey] = this._redactValue(childValue, childKey, depth + 1);
        }
        return redacted;
    }

    _summarizeResult(result) {
        if (result === null || result === undefined) return result;
        if (typeof result !== 'object') return { type: typeof result, length: String(result).length };
        return {
            status: result.status,
            success: result.success,
            error: result.error || result.message,
            exitCode: result.exitCode,
            count: result.count,
            keys: Object.keys(result).slice(0, 20)
        };
    }
}

module.exports = { ApprovedToolExecutor, RISK_ORDER, RISK_TAX };
