'use strict';

const { ApprovedToolExecutor } = require('../governance/approved_tool_executor.js');
const { PlanningEngine, Plan } = require('../brain/planning_engine.js');

let passed = 0;
let failed = 0;
function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

(async () => {
    const calls = [];
    const witnessed = [];
    const pltScores = [];
    const kernel = {
        systems: {
            selfGovernance: { ethicalCheck: async action => ({ allowed: !action.includes('harm innocent'), reason: 'blocked by test constitution' }) },
            toolBridge: { invoke: async (tool, args) => { calls.push({ tool, args }); return { status: 'success', tool, args }; } },
            secureSandbox: { classify: command => command.includes('Remove-Item') ? 'high' : 'safe' }
        },
        memory: { witness: async entry => witnessed.push(entry) },
        chambers: { agentic_will: { will: { execute_action: action => calls.push({ will: action }) } } },
        core: { plt: { score: (action, context) => { pltScores.push({ action, context }); return { score: 1 }; } } }
    };
    const planning = new PlanningEngine(kernel);
    kernel.systems.planningEngine = planning;
    kernel.planningEngine = planning;
    const executor = new ApprovedToolExecutor(kernel, { maxSteps: 3, maxTax: 1, maxToolCalls: 3, stepTimeoutMs: 100 });

    const safePlan = new Plan('read safely');
    const safeStep = safePlan.addStep('read a file');
    safeStep.tool = 'read_file';
    safeStep.args = { path: 'test.txt' };
    planning.currentPlan = safePlan;
    safePlan.status = 'running';
    const safe = await executor.executeStep(safeStep, { plan: safePlan });
    assert(safe.status === 'completed', 'safe read executes automatically');
    assert(safeStep.status === 'completed', 'safe result attributed to plan step');
    assert(pltScores.length === 1 && pltScores[0].context.taxImpact === 0.05, 'safe action records PLT tax');

    const deniedPlan = new Plan('bad goal');
    const deniedStep = deniedPlan.addStep('harm innocent');
    deniedStep.tool = 'read_file';
    const denied = await executor.executeStep(deniedStep, { plan: deniedPlan });
    assert(denied.status === 'denied', 'constitution blocks forbidden step');

    const writePlan = new Plan('write with approval');
    const writeStep = writePlan.addStep('write approved file');
    writeStep.tool = 'write_file';
    writeStep.riskLevel = 'safe'; // Explicit risk may raise risk, never lower computed risk.
    writeStep.args = { path: 'x.txt', content: 'x', apiToken: 'do-not-expose' };
    const pending = await executor.executeStep(writeStep, { plan: writePlan });
    assert(pending.status === 'approval_required' && pending.riskLevel === 'medium', 'mutating step pauses and cannot lower computed risk');
    assert(executor.getPendingApprovals().length === 1, 'approval appears in queue');
    assert(executor.getPendingApprovals()[0].action.args.apiToken === '[REDACTED]', 'approval output redacts secret arguments');
    assert(executor.approveRequest(pending.approvalId, 'Craig').ok, 'architect can approve request');
    const approved = await executor.executeApproved(pending.approvalId);
    assert(approved.status === 'completed', 'approved mutating step executes');

    planning.setExecutor(executor);
    const pausedPlan = new Plan('planning engine approval pause');
    const pausedStep = pausedPlan.addStep('write through planning engine');
    pausedStep.tool = 'write_file';
    pausedStep.args = { path: 'planned.txt', content: 'planned' };
    planning._storePlan(pausedPlan);
    const paused = await planning.executePlan(pausedPlan);
    assert(paused.success === false && pausedPlan.status === 'awaiting_approval', 'planning engine pauses instead of failing risky step');
    const pausedApproval = executor.getPendingApprovals().find(request => request.planId === pausedPlan.id);
    assert(!!pausedApproval, 'planning engine pause creates architect request');

    const shellPlan = new Plan('dangerous shell');
    const shellStep = shellPlan.addStep('delete a file');
    shellStep.tool = 'run_safe_command';
    shellStep.args = { command: 'Remove-Item x.txt' };
    const shell = await executor.executeStep(shellStep, { plan: shellPlan });
    assert(shell.status === 'approval_required' && shell.riskLevel === 'high', 'shell risk uses SecureShellSandbox classifier');

    const budgetPlan = new Plan('budgeted');
    const budgetStep = budgetPlan.addStep('read after zero budget');
    budgetStep.tool = 'read_file';
    const budgetExecutor = new ApprovedToolExecutor(kernel, { maxSteps: 0, maxTax: 0, maxToolCalls: 0 });
    const budget = await budgetExecutor.executeStep(budgetStep, { plan: budgetPlan });
    assert(budget.status === 'budget_exhausted', 'zero budget blocks execution');
    assert(witnessed.some(w => w.type === 'approved_action_result'), 'action outcome is witnessed');

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
