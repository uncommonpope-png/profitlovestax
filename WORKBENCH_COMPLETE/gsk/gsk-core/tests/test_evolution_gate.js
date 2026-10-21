'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { SelfEvolution } = require('../brain/self_evolution.js');
const { UniversalToolBridge } = require('../tools/universal_tool_bridge.js');
const { ApprovedToolExecutor } = require('../governance/approved_tool_executor.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
    if (condition) { passed++; console.log('  PASS ' + name); }
    else { failed++; console.log('  FAIL ' + name); }
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gsk-p13-'));
    const skillsDir = path.join(root, 'skills');
    const hubDir = path.join(root, 'hub');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.mkdirSync(path.join(hubDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(hubDir, 'downloads'), { recursive: true });
    fs.writeFileSync(path.join(hubDir, 'data', 'catalog.json'), '[]\n', 'utf8');

    const witnessed = [];
    const generated = {
        name: 'approved_growth',
        filename: 'approved_growth.js',
        description: 'A governed self-evolution proof skill',
        pltAffinity: { profit: 0.8, love: 0.5, tax: 0.3 },
        code: `'use strict';\nexports.skill_approved_growth = async function() { return { skill: 'approved_growth', success: true }; };\nexports.PLT_AFFINITY = { profit: 0.8, love: 0.5, tax: 0.3 };\n`
    };
    const kernel = {
        brain: { think: async () => JSON.stringify(generated) },
        memory: { witness: async event => witnessed.push(event) },
        chambers: {},
        teacherAgent: { getStats: () => ({ studiedRepos: ['proof/governed-evolution'] }) },
        systems: { selfGovernance: { ethicalCheck: async () => ({ allowed: true }) } },
        agents: {},
        core: { plt: { score() { return { score: 1 }; } } }
    };
    const evolution = new SelfEvolution(kernel, {
        skillsDir,
        backupDir: path.join(root, 'backups'),
        evolutionLogPath: path.join(root, 'evolution-log.json'),
        proposalPath: path.join(root, 'evolution-proposals.json'),
        hubDir
    });
    kernel.agents.selfEvolution = evolution;
    kernel.systems.selfEvolution = evolution;
    const bridge = new UniversalToolBridge(kernel);
    bridge._callScribe = async () => ({ ok: true });
    kernel.systems.toolBridge = bridge;
    const executor = new ApprovedToolExecutor(kernel, { requireApprovalAt: 'medium' });
    kernel.systems.approvedToolExecutor = executor;

    const proposal = await evolution.evolve();
    assert(proposal.status === 'approval_required' && evolution.getPendingProposals().length === 1, 'P13 self-evolution reaches the proposal queue');
    assert(!fs.existsSync(path.join(skillsDir, generated.filename)), 'P13 proposal cannot silently write code');
    assert(witnessed.some(event => event.type === 'evolution_proposal'), 'P13 proposal is witnessed');

    const step = { id: 'apply_evolution', description: 'Apply architect-approved evolution', tool: 'evolution_apply', args: { proposalId: proposal.proposalId }, status: 'pending' };
    const pending = await executor.executeStep(step, { plan: { id: 'evolution_plan', goal: 'governed self evolution' } });
    assert(pending.status === 'approval_required', 'P13 applying evolution pauses for architect approval');
    assert(executor.approveRequest(pending.approvalId, 'PLT222').ok, 'P13 architect approves with PLT222');
    const applied = await executor.executeApproved(pending.approvalId);
    assert(applied.status === 'completed' && applied.result.status === 'success', 'P13 approved proposal applies successfully');
    assert(fs.existsSync(path.join(skillsDir, generated.filename)), 'P13 approved evolution writes the verified skill');
    const catalog = JSON.parse(fs.readFileSync(path.join(hubDir, 'data', 'catalog.json'), 'utf8'));
    assert(catalog.some(item => item.file === 'soul-gun-approved_growth.js'), 'P13 approved evolution publishes to the Hub');
    assert(evolution.getPendingProposals().length === 0 && evolution.getStats().proposalsApplied === 1, 'P13 proposal leaves the queue only after apply');

    fs.rmSync(root, { recursive: true, force: true });
    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch(error => {
    console.error(error);
    process.exit(1);
});
