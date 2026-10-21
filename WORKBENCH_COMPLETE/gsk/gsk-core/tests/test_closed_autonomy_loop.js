'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { GoalEngine } = require('../brain/goal_engine.js');
const { JournalWriter } = require('../brain/journal_writer.js');
const { PlanningEngine } = require('../brain/planning_engine.js');
const { SovereignAutonomyLoop } = require('../brain/sovereign_autonomy_loop.js');
const { ApprovedToolExecutor } = require('../governance/approved_tool_executor.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-p5-p6-'));
    const calls = [];
    const witnessed = [];
    const lessons = [];
    const kernel = {
        systems: {
            toolBridge: {
                invoke: async (tool, args) => {
                    calls.push({ tool, args });
                    if (args.fail) return { status: 'error', error: 'deterministic tool failure' };
                    return { status: 'success', data: { observed: true, cycle: args.cycle } };
                }
            },
            selfGovernance: { ethicalCheck: async () => ({ allowed: true }) },
            scribeBridge: {
                recordLesson: async lesson => { lessons.push(lesson); return { ok: true }; },
                recallLessons: async query => ({ count: lessons.filter(lesson => lesson.content.includes(query)).length, results: lessons })
            }
        },
        memory: { witness: async entry => witnessed.push(entry) },
        chambers: { agentic_will: { will: { execute_action() {} } } },
        core: { plt: { score() { return { score: 1 }; } } },
        prompt: async prompt => {
            const cycle = Number(prompt.match(/cycle (\d+)/i)?.[1] || 1);
            return JSON.stringify([{ description: `observe cycle ${cycle}`, tool: 'world_get_state', args: { cycle }, acceptanceCriteria: 'real tool result returned' }]);
        },
        toolCatalog: { describe: tool => tool === 'world_get_state' ? { name: tool } : null }
    };

    const goalEngine = new GoalEngine({ goalsPath: path.join(root, 'goals.json'), memoryStore: async entry => witnessed.push(entry) });
    const journalWriter = new JournalWriter({ journalPath: path.join(root, 'journal.json') });
    const planningEngine = new PlanningEngine(kernel);
    const executor = new ApprovedToolExecutor(kernel, { requireApprovalAt: 'medium', maxSteps: 20, maxTax: 5, maxToolCalls: 20 });
    planningEngine.setExecutor(executor);
    kernel.goalEngine = goalEngine;
    kernel.planningEngine = planningEngine;
    kernel.systems.goalEngine = goalEngine;
    kernel.systems.planningEngine = planningEngine;
    kernel.systems.approvedToolExecutor = executor;
    kernel.systems.journalWriter = journalWriter;

    const failingStep = { id: 'failure', description: 'prove lesson capture', tool: 'world_get_state', args: { fail: true }, status: 'pending' };
    const failedAction = await executor.executeStep(failingStep, { plan: { id: 'failure_plan', goal: 'replayable failure' } });
    assert(failedAction.status === 'failed', 'P5 failed action is detected');
    assert(lessons.some(lesson => lesson.error === 'deterministic tool failure' && lesson.content.includes('replayable failure')), 'P5 failed action becomes a SCRIBE lesson');
    const replay = await kernel.systems.scribeBridge.recallLessons('replayable failure');
    assert(replay.count === 1, 'P5 SCRIBE replays the lesson by goal context');
    assert(witnessed.some(entry => entry.type === 'lesson'), 'P5 lesson is also witnessed locally');

    const loop = new SovereignAutonomyLoop(kernel, {
        perceive: async ({ cycle }) => ({ source: 'test_sensor', content: `Observed real cycle ${cycle}`, cycle })
    });
    const run = await loop.runCycles(3, index => ({ cycle: index + 1, goal: `Complete verified cycle ${index + 1}` }));
    assert(run.completed === 3, 'P6 completes three unattended verified cycles');
    assert(calls.filter(call => !call.args.fail).length === 3, 'P6 performs one real tool action per cycle');
    assert(journalWriter.getAll().filter(entry => entry.type === 'autonomy_cycle').length === 3, 'P6 journals every goal-to-action cycle');
    assert(witnessed.filter(entry => entry.type === 'autonomy_cycle' && entry.meta?.verified).length === 3, 'P6 learns from every verified outcome');
    assert(loop.getStats().currentStreak === 3 && loop.getStats().maxStreak === 3, 'P6 maintains a verified autonomy streak');

    const sovereignLoop = new SovereignAutonomyLoop(kernel, {
        perceive: async ({ cycle }) => ({ source: 'sovereign_sensor', content: `Sovereign observation cycle ${cycle}`, cycle })
    });
    const sovereignRun = await sovereignLoop.runCycles(10, index => ({ cycle: index + 101, goal: `Sovereign verified cycle ${index + 1}` }));
    assert(sovereignRun.completed === 10, 'P8 completes ten unattended verified cycles');
    assert(sovereignLoop.getStats().currentStreak === 10 && sovereignLoop.getStats().maxStreak === 10, 'P8 records the required 10-cycle sovereignty streak');
    assert(sovereignLoop.getStats().approvalPauses === 0, 'P8 safe cycles run without governance bypass or false approval');

    fs.rmSync(root, { recursive: true, force: true });
    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
