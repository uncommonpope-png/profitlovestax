const http = require('http');
const path = require('path');
const fs = require('fs');
let passed = 0, failed = 0;

function assert(cond, name) {
    if (cond) { passed++; console.log(`  ✅ ${name}`); }
    else { failed++; console.log(`  ❌ ${name}`); }
}

function assertEqual(a, b, n) { assert(a === b, `${n} (${a} === ${b})`); }

function httpGet(p, path) {
    return new Promise((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port: p, path, timeout: 15000 },
            (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } }); }
        ).on('error', reject);
    });
}
function httpPost(p, path, body) {
    return new Promise((resolve, reject) => {
        const d = JSON.stringify(body);
        const r = http.request({ hostname: '127.0.0.1', port: p, path, method: 'POST',
            headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
            (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } }); });
        r.on('error', reject); r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
        r.write(d); r.end();
    });
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  COMBO ORCHESTRATOR — E2E INTEGRATION TEST');
    console.log('═══════════════════════════════════════════════════\n');

    // 1. Check GSK and SCRIBE are alive
    console.log('── 1. System Health ──');
    const health = await httpGet(4000, '/health');
    assert(health.status === 'alive', 'SCRIBE alive');
    const gsk = await httpGet(50001, '/api/gsk/status');
    assert(!!gsk, 'GSK bridge up');

    // 2. Test saga skills via GSK bridge command
    console.log('\n── 2. Sage Skills via GSK Bridge ──');
    const skills = [
        'verifiable_goal_definition',
        'design_plan_generation',
        'report_generation',
        'cognitive_reframing_protocol'
    ];
    for (const skill of skills) {
        const result = await httpPost(50001, '/api/gsk/command', {
            route: 'tool',
            tool: skill,
            description: `Test ${skill} via bridge`
        });
        assert(!!result, `${skill} bridge responds`);
    }

    // 3. Test combos — orchestrator list
    console.log('\n── 3. Combo Definitions ──');
    const combosDir = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain\\pages\\combos';
    const fs = require('fs');
    const comboFiles = fs.readdirSync(combosDir).filter(f => f.endsWith('.combo.md'));
    assert(comboFiles.length >= 4, `At least 4 combos loaded (${comboFiles.length})`);

    for (const file of comboFiles) {
        const content = fs.readFileSync(`${combosDir}\\${file}`, 'utf-8');
        assert(content.includes('skills:'), `${file}: has skills section`);
        assert(content.includes('name:'), `${file}: has name`);
    }

    // 4. Test skill name normalization
    console.log('\n── 4. Skill Name Normalization ──');
    const { ComboOrchestrator } = require(path.join(__dirname, '..', 'gsk-core', 'council', 'combo_orchestrator.js'));
    const orch = new ComboOrchestrator({}, { combosDir });
    const tests = {
        'SKILL - Verifiable Goal Definition': 'verifiable_goal_definition',
        'SKILL - Design Plan Generation': 'design_plan_generation',
        'SKILL - Multi-Form Task Distribution': 'multi_form_task_distribution',
        'SKILL - Code Generation and Refinement': 'code_generation_and_refinement',
        'SKILL - Cognitive Reframing Protocol': 'cognitive_reframing_protocol',
        'read_file': 'read_file',
        'verifiable_goal_definition': 'verifiable_goal_definition',
    };
    for (const [input, expected] of Object.entries(tests)) {
        assertEqual(orch._normalizeSkillName(input), expected, `Normalize: "${input.substring(0, 40)}..."`);
    }

    // 5. Test parse combo files
    console.log('\n── 5. Combo Parsing ──');
    orch.scanCombos();
    assert(orch.combos.size >= 4, `Orchestrator loaded ${orch.combos.size} combos`);

    // Check each combo has parsed correctly
    for (const [name, combo] of orch.combos) {
        assert(combo.skills.length > 0, `"${name}": has skills (${combo.skills.length})`);
        assert(!!combo.error_handling, `"${name}": has error_handling`);
        // Check skill names normalize correctly
        for (const skill of combo.skills) {
            const normalized = orch._normalizeSkillName(skill.name);
            assert(normalized.length > 0 && !normalized.includes(' '), `"${name}": skill "${skill.name}" normalizes to "${normalized}"`);
        }
    }

    // 6. Test combo stats
    console.log('\n── 6. Combo Stats ──');
    const stats = orch.getStats();
    assert(stats.combosLoaded >= 4, `combosLoaded: ${stats.combosLoaded}`);
    assert(stats.combosAvailable >= 4, `combosAvailable: ${stats.combosAvailable}`);

    // 7. Test ambient combo listing
    console.log('\n── 7. Combo Listing ──');
    const list = orch.listCombos();
    assert(list.length >= 4, `listCombos: ${list.length}`);
    for (const c of list) {
        assert(c.name, `listed combo has name: "${c.name}"`);
        assert(c.skillCount > 0, `combo "${c.name}" has ${c.skillCount} skills`);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════');
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
