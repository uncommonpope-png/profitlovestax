'use strict';

/**
 * GSK Direct Build Channel
 *
 * Receives structured build tasks from Craig/Claude and executes them
 * via the SovereignAutonomyLoop + DeepToolUse + ApprovedToolExecutor.
 *
 * Usage:
 *   node direct-build.js --task "Build X" --project C:\path\to\project
 *   node direct-build.js --json '{"task":"...","project":"...","priority":"high"}'
 */

const fs = require('fs');
const path = require('path');
const GSKFusion = require('./fusion-loader.js');

async function bootGSK() {
    const gsk = new GSKFusion(null, {
        dataDir: path.join(__dirname, 'data')
    });
    await gsk.boot();
    return gsk;
}

async function executeDirectBuild(gsk, task) {
    const {
        task: taskDescription,
        project: projectRoot,
        priority = 'normal',
        mode = 'autonomous', // 'autonomous' | 'guided' | 'interactive'
        approvals = 'auto', // 'auto' | 'hitl' | 'none'
        timeoutMs = 600000,
        context = {}
    } = task;

    if (!taskDescription || !projectRoot) {
        throw new Error('Task requires: task (string) and project (path)');
    }

    if (!fs.existsSync(projectRoot)) {
        throw new Error(`Project root not found: ${projectRoot}`);
    }

    console.log(`[DirectBuild] Task: ${taskDescription}`);
    console.log(`[DirectBuild] Project: ${projectRoot}`);
    console.log(`[DirectBuild] Mode: ${mode}, Approvals: ${approvals}`);

    // 1. Analyze the project first
    const analyzer = gsk.systems.projectAnalyzer || gsk.agents?.autonomousLearning?.projectAnalyzer;
    if (!analyzer) {
        throw new Error('ProjectAnalyzer not available in GSK');
    }

    console.log('[DirectBuild] Analyzing project...');
    const analysis = await analyzer.analyze(projectRoot);
    console.log(`[DirectBuild] Project type: ${analysis.type}, completeness: ${analysis.completeness}%`);

    // 2. Generate a plan via PlanningEngine
    const planner = gsk.systems.planningEngine;
    if (!planner) {
        throw new Error('PlanningEngine not available in GSK');
    }

    console.log('[DirectBuild] Generating plan...');
    const plan = await planner.generatePlan({
        goal: taskDescription,
        context: { ...analysis, ...context },
        projectRoot
    });

    if (!plan || !plan.steps || plan.steps.length === 0) {
        throw new Error('Planner returned empty plan');
    }

    console.log(`[DirectBuild] Plan: ${plan.steps.length} steps`);
    plan.steps.forEach((step, i) => console.log(`  ${i+1}. ${step.type}: ${step.description || step.command || JSON.stringify(step).slice(0,60)}`));

    // 3. Execute via ApprovedToolExecutor (with approval gating)
    const executor = gsk.systems.approvedToolExecutor;
    if (!executor) {
        throw new Error('ApprovedToolExecutor not available in GSK');
    }

    // Configure approval mode
    if (approvals === 'none') {
        executor.setAutoApprove(true);
    } else if (approvals === 'hitl') {
        executor.setAutoApprove(false);
    }

    console.log('[DirectBuild] Executing plan...');
    const result = await executor.executePlan(plan, {
        projectRoot,
        timeoutMs,
        onStep: (step, idx, total) => {
            console.log(`[DirectBuild] Step ${idx+1}/${total}: ${step.type} - ${step.status || 'running'}`);
        }
    });

    // 4. Record outcome in journal
    const journal = gsk.systems.soulJournal;
    if (journal && typeof journal.writeEntry === 'function') {
        await journal.writeEntry('build_task',
            `Direct build: ${taskDescription} at ${projectRoot} — ${result.status}`,
            { tag: 'build', weight: 0.8, project: projectRoot, result }
        );
    }

    // 5. If successful, synthesize knowledge
    if (result.status === 'completed' && gsk.systems.knowledgeGraph) {
        const kg = gsk.systems.knowledgeGraph;
        kg.addNode('build_result',
            `Task: ${taskDescription} at ${projectRoot}\nResult: ${JSON.stringify(result).slice(0,500)}`,
            0.7
        );
    }

    return { analysis, plan, result };
}

async function main() {
    const args = process.argv.slice(2);

    let task = null;
    if (args.includes('--json')) {
        const idx = args.indexOf('--json');
        task = JSON.parse(args[idx + 1] || '{}');
    } else {
        // Parse --task "..." --project "..." [--mode ...] [--approvals ...]
        task = {};
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--task') task.task = args[++i];
            else if (args[i] === '--project') task.project = args[++i];
            else if (args[i] === '--mode') task.mode = args[++i];
            else if (args[i] === '--approvals') task.approvals = args[++i];
            else if (args[i] === '--priority') task.priority = args[++i];
        }
    }

    if (!task || !task.task || !task.project) {
        console.error('Usage:');
        console.error('  node direct-build.js --task "Build X" --project "C:\\path" [--mode autonomous] [--approvals hitl]');
        console.error('  node direct-build.js --json \'{"task":"...","project":"...","mode":"...","approvals":"..."}\'');
        process.exit(1);
    }

    const gsk = await bootGSK();

    try {
        const result = await executeDirectBuild(gsk, task);
        console.log('[DirectBuild] COMPLETED:', result.result.status);
        console.log('[DirectBuild] Result:', JSON.stringify(result.result, null, 2).slice(0, 2000));
        process.exit(result.result.status === 'completed' ? 0 : 1);
    } catch (e) {
        console.error('[DirectBuild] FAILED:', e.message);
        process.exit(1);
    } finally {
        if (gsk.shutdown) await gsk.shutdown();
    }
}

if (require.main === module) {
    main().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { executeDirectBuild, bootGSK };