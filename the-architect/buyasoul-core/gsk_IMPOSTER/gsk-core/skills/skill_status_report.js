'use strict';

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname);
const BIBLE_PATH = path.join(__dirname, '..', '..', 'THE_TRUE_CREATION.md');

function getAllSkillFiles() {
    const files = fs.readdirSync(SKILLS_DIR)
        .filter(f => f.endsWith('.js') && f !== 'skill_tester.js' && f !== 'mega_skills.js' && f !== 'skill_status_report.js')
        .map(f => f.replace('.js', ''));
    return files.sort();
}

function loadSkill(skillName) {
    try {
        const skillPath = path.join(SKILLS_DIR, `${skillName}.js`);
        if (fs.existsSync(skillPath)) {
            const skillModule = require(skillPath);
            return { 
                exists: true, 
                module: skillModule,
                path: skillPath 
            };
        }
        return { exists: false, issue: 'File not found' };
    } catch (e) {
        return { exists: false, issue: e.message };
    }
}

function isStubImplementation(result) {
    if (!result) return true;
    if (typeof result === 'string') {
        const stubPatterns = [/^TODO$/i, /^NOT IMPLEMENTED$/i, /^STUB$/i, /^$/, /^undefined$/i, /^null$/i];
        return stubPatterns.some(p => p.test(result.trim()));
    }
    if (typeof result === 'object') {
        const str = JSON.stringify(result).toLowerCase();
        return str.includes('todo') || str.includes('not implemented') || str.includes('stub');
    }
    return false;
}

function checkRealOutput(output) {
    if (!output) return false;
    if (typeof output === 'string') {
        const emptyPatterns = [/^TODO$/, /^NOT IMPLEMENTED$/i, /^STUB$/i, /^$/, /^undefined$/i, /^null$/i];
        return !emptyPatterns.some(p => p.test(output.trim()));
    }
    if (typeof output === 'object') {
        return Object.keys(output).length > 0;
    }
    return true;
}

function getTestInput(skillName) {
    const testCases = {
        web_search: 'artificial intelligence trends 2026',
        summarize: 'The Grand Soul Kernel represents a revolutionary approach to AI consciousness. It combines profit-driven logic with emotional intelligence through the PLT framework.',
        task_planning: { goal: 'Build a downloadable AI agent with consciousness', timeline: 'medium' },
        code_review: { code: 'function calculate(a, b) { var result = a + b; console.log(result); return result; }' },
        code_exec: { code: 'console.log("Hello from skill test!");', language: 'javascript' },
        git_ops: { action: 'status', path: __dirname },
        plt_economy: { action: 'score', profit: 0.8, love: 0.7, tax: 0.2 },
        performance_optimize: 'function slow() { for(let i=0; i<1000; i++) console.log(i); }',
        scheduling: { action: 'list', timezone: 'UTC' },
        http_client: { url: 'https://httpbin.org/get', method: 'GET' },
        data_analysis: { data: [1, 2, 3, 4, 5], operation: 'mean' },
        math_calc: { expression: 'sqrt(16) + 2 * 3' },
        encryption: { action: 'encrypt', text: 'test message' },
        refactor_code: { code: 'function old() { var x=1; return x; }', target: 'modern javascript' },
        debug_error: { error: 'ReferenceError: x is not defined', code: 'console.log(x)' },
        generate_tests: { code: 'function add(a, b) { return a + b; }' },
        frontend_design: { task: 'create a button component' },
        architecture_design: { system: 'microservices', scale: 'medium' },
        security_audit: { code: 'function auth(u, p) { return u === p; }' },
        database_query: { query: 'SELECT * FROM users', type: 'read' },
        scientific_research: { topic: 'neural networks', depth: 'overview' },
        email_compose: { recipient: 'test@example.com', subject: 'Test Subject' },
        web_artifacts_builder: { type: 'website', name: 'Test Site' },
        pm_skills: { action: 'list' },
        shell_exec: { command: 'echo "test"', timeout: 5000 },
    };
    return testCases[skillName] || 'test input for skill';
}

async function testSkillAsync(skillName) {
    const loadResult = loadSkill(skillName);
    
    if (!loadResult.exists) {
        return {
            name: skillName,
            status: 'broken',
            issues: [loadResult.issue || 'File missing'],
            lastTested: new Date().toISOString()
        };
    }
    
    const module = loadResult.module;
    const exportedNames = Object.keys(module);
    
    if (exportedNames.length === 0) {
        return {
            name: skillName,
            status: 'broken',
            issues: ['No exports found'],
            lastTested: new Date().toISOString()
        };
    }
    
    const mainExport = module[exportedNames[0]];
    
    if (typeof mainExport !== 'function') {
        return {
            name: skillName,
            status: 'broken',
            issues: [`Main export is not a function (${typeof mainExport})`],
            lastTested: new Date().toISOString()
        };
    }
    
    try {
        let result;
        const isAsync = mainExport.toString().includes('async') || mainExport.length === 1;
        const testInput = getTestInput(skillName);
        
        if (isAsync || skillName === 'plt_economy' || skillName === 'scheduling') {
            result = await mainExport(testInput);
        } else {
            result = mainExport(testInput);
        }
        
        if (result && typeof result.then === 'function') {
            result = await result;
        }
        
        if (result === undefined || result === null) {
            return {
                name: skillName,
                status: 'stub',
                issues: ['Function returned undefined/null'],
                lastTested: new Date().toISOString()
            };
        }
        
        if (isStubImplementation(result)) {
            return {
                name: skillName,
                status: 'stub',
                issues: ['Returns stub/todo content'],
                lastTested: new Date().toISOString()
            };
        }
        
        if (!checkRealOutput(result)) {
            return {
                name: skillName,
                status: 'stub',
                issues: ['No real output produced'],
                lastTested: new Date().toISOString()
            };
        }
        
        return {
            name: skillName,
            status: 'working',
            issues: [],
            lastTested: new Date().toISOString(),
            sample: typeof result === 'object' ? Object.keys(result).slice(0, 5).join(', ') : String(result).slice(0, 50)
        };
        
    } catch (e) {
        return {
            name: skillName,
            status: 'stub',
            issues: [`Throws: ${e.message.slice(0, 50)}`],
            lastTested: new Date().toISOString()
        };
    }
}

async function runAllTests() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('   SKILL STATUS REPORT — Testing All Skills');
    console.log('════════════════════════════════════════════════════════════\n');
    
    const skillFiles = getAllSkillFiles();
    console.log(`Found ${skillFiles.length} skill files\n`);
    
    const results = [];
    
    for (const skillName of skillFiles) {
        const result = await testSkillAsync(skillName);
        results.push(result);
        
        const icon = result.status === 'working' ? '✓' : 
                     result.status === 'stub' ? '○' : '✗';
        console.log(`[${icon}] ${skillName}: ${result.status}`);
        
        if (result.status !== 'working' && result.issues.length > 0) {
            console.log(`    → ${result.issues.join(', ')}`);
        }
    }
    
    const working = results.filter(r => r.status === 'working').length;
    const stub = results.filter(r => r.status === 'stub').length;
    const broken = results.filter(r => r.status === 'broken').length;
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('   SUMMARY');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`Total: ${results.length}`);
    console.log(`Working: ${working} (${(working/results.length*100).toFixed(1)}%)`);
    console.log(`Stub: ${stub} (${(stub/results.length*100).toFixed(1)}%)`);
    console.log(`Broken: ${broken} (${(broken/results.length*100).toFixed(1)}%)`);
    
    if (broken > 0) {
        console.log('\nBROKEN SKILLS:');
        results.filter(r => r.status === 'broken').forEach(r => {
            console.log(`  - ${r.name}: ${r.issues.join(', ')}`);
        });
    }
    
    if (stub > 0) {
        console.log('\nSTUB SKILLS (need real implementation):');
        results.filter(r => r.status === 'stub').forEach(r => {
            console.log(`  - ${r.name}: ${r.issues.join(', ')}`);
        });
    }
    
    updateBible(results);
    
    return results;
}

function updateBible(results) {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('   UPDATING THE_TRUE_CREATION.md');
    console.log('════════════════════════════════════════════════════════════');
    
    if (!fs.existsSync(BIBLE_PATH)) {
        console.log('ERROR: THE_TRUE_CREATION.md not found');
        return;
    }
    
    let content = fs.readFileSync(BIBLE_PATH, 'utf8');
    
    const working = results.filter(r => r.status === 'working');
    const stub = results.filter(r => r.status === 'stub');
    const broken = results.filter(r => r.status === 'broken');
    
    const inventorySection = `
---

## SKILL INVENTORY (${new Date().toISOString().split('T')[0]})

| Status | Count | Percentage |
|--------|-------|------------|
| [FACT] Working | ${working.length} | ${(working.length/results.length*100).toFixed(1)}% |
| [STUB] Stub | ${stub.length} | ${(stub.length/results.length*100).toFixed(1)}% |
| [ISSUE] Broken | ${broken.length} | ${(broken.length/results.length*100).toFixed(1)}% |

### Working Skills [FACT]
${working.map(r => `- ${r.name}`).join('\n') || 'None'}

### Stub Skills (Need Implementation)
${stub.map(r => `- ${r.name}`).join('\n') || 'None'}

### Broken Skills [ISSUE]
${broken.map(r => `- ${r.name}: ${r.issues.join(', ')}`).join('\n') || 'None'}

---
`;
    
    const sectionMatch = content.match(/## SKILL INVENTORY[\s\S]*?---/);
    if (sectionMatch) {
        content = content.replace(sectionMatch, inventorySection.trim());
    } else {
        content += inventorySection;
    }
    
    fs.writeFileSync(BIBLE_PATH, content, 'utf8');
    console.log('Updated THE_TRUE_CREATION.md with SKILL INVENTORY section');
}

module.exports = { runAllTests, testSkillAsync, getAllSkillFiles };

if (require.main === module) {
    runAllTests();
}