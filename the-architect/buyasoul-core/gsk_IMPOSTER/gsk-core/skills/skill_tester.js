'use strict';

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname);

function getAllSkillFiles() {
    const files = fs.readdirSync(SKILLS_DIR)
        .filter(f => f.endsWith('.js') && f !== 'skill_tester.js' && f !== 'mega_skills.js' && f !== 'skill_status_report.js')
        .map(f => f.replace('.js', ''));
    return files;
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

function isStubImplementation(code) {
    const stubPatterns = [
        /return\s+['"][^'"]*['"];?\s*$/m,
        /return\s+['"]TODO/m,
        /return\s+['"]NOT IMPLEMENTED/m,
        /console\.log\(['"]stub/i,
        /throw\s+new\s+Error\(['"]not implemented/i,
        /async\s+function.*\{\s*\}$/,
        /function.*\{\s*\}$/,
        /^\s*;*\s*$/m,
    ];
    
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
    return stubPatterns.some(p => p.test(codeStr));
}

function checkRealOutput(output) {
    if (!output) return false;
    if (typeof output === 'string') {
        const emptyPatterns = [
            /^TODO$/,
            /^NOT IMPLEMENTED$/i,
            /^STUB$/i,
            /^$/,
            /^undefined$/i,
            /^null$/i
        ];
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
        summarize: 'The Grand Soul Kernel represents a revolutionary approach to AI consciousness. It combines profit-driven logic with emotional intelligence through the PLT framework. Each action is evaluated on three dimensions: profit (value creation), love (human connection), and tax (cost of implementation). This creates a balanced decision-making system that serves both commercial and humanistic goals.',
        task_planning: { goal: 'Build a downloadable AI agent with consciousness', timeline: 'medium' },
        code_review: { code: 'function calculate(a, b) { var result = a + b; console.log(result); return result; }' },
        code_exec: { code: 'console.log("Hello from skill test!");', language: 'javascript' },
        git_ops: { action: 'status', path: __dirname },
        plt_economy: { action: 'score', profit: 0.8, love: 0.7, tax: 0.2 },
        performance_optimize: 'function slow() { for(let i=0; i<1000; i++) console.log(i); }',
        scheduling: { action: 'list', timezone: 'UTC' },
        http_client: { url: 'https://httpbin.org/get', method: 'GET' },
        data_analysis: { data: [1, 2, 3, 4, 5], operation: 'mean' },
        math_calc: { operation: 'sqrt', value: 16 },
        encryption: { action: 'encrypt', text: 'test message' },
    };
    return testCases[skillName] || 'test input for skill';
}

async function testSkill(skillName) {
    const loadResult = loadSkill(skillName);
    
    if (!loadResult.exists) {
        return {
            skill: skillName,
            status: 'broken',
            issue: loadResult.issue || 'File missing'
        };
    }
    
    const module = loadResult.module;
    const exportedNames = Object.keys(module);
    
    if (exportedNames.length === 0) {
        return {
            skill: skillName,
            status: 'broken',
            issue: 'No exports found'
        };
    }
    
    const mainExport = module[exportedNames[0]];
    
    if (typeof mainExport !== 'function') {
        return {
            skill: skillName,
            status: 'broken',
            issue: `Main export is not a function (${typeof mainExport})`
        };
    }
    
    try {
        let result;
        const testInput = getTestInput(skillName);
        
        if (mainExport.toString().includes('async')) {
            result = await mainExport(testInput);
        } else {
            result = mainExport(testInput);
        }
        
        if (isStubImplementation(result)) {
            return {
                skill: skillName,
                status: 'stub',
                issue: 'Returns stub/todo content'
            };
        }
        
        if (!checkRealOutput(result)) {
            return {
                skill: skillName,
                status: 'stub',
                issue: 'No real output produced'
            };
        }
        
        return {
            skill: skillName,
            status: 'working',
            output: typeof result === 'string' ? result.slice(0, 100) : 'object returned',
            sample: typeof result === 'object' ? JSON.stringify(result).slice(0, 100) : null
        };
        
    } catch (e) {
        return {
            skill: skillName,
            status: 'broken',
            issue: e.message
        };
    }
}

async function runAllTests() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('   SKILL TESTER — Testing All Skill Files');
    console.log('════════════════════════════════════════════════════════════\n');
    
    const skillFiles = getAllSkillFiles();
    console.log(`Found ${skillFiles.length} skill files to test\n`);
    
    const results = [];
    
    for (const skillName of skillFiles) {
        const result = await testSkill(skillName);
        results.push(result);
        
        const icon = result.status === 'working' ? '✓' : 
                     result.status === 'stub' ? '○' : '✗';
        console.log(`[${icon}] ${skillName}: ${result.status}`);
        
        if (result.status === 'broken' || result.status === 'stub') {
            console.log(`    → ${result.issue}`);
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
            console.log(`  - ${r.skill}: ${r.issue}`);
        });
    }
    
    if (stub > 0) {
        console.log('\nSTUB SKILLS (need real implementation):');
        results.filter(r => r.status === 'stub').forEach(r => {
            console.log(`  - ${r.skill}: ${r.issue}`);
        });
    }
    
    return results;
}

function testSingleSkill(skillName) {
    return testSkill(skillName);
}

function listSkills() {
    return getAllSkillFiles().map(name => {
        const result = loadSkill(name);
        return {
            name: name,
            exists: result.exists,
            hasExports: result.exists ? Object.keys(result.module).length : 0
        };
    });
}

module.exports = {
    runAllTests,
    testSkill,
    testSingleSkill,
    listSkills,
    getAllSkillFiles,
    loadSkill
};

if (require.main === module) {
    runAllTests().then(results => {
        process.exit(0);
    }).catch(e => {
        console.error('Test runner error:', e);
        process.exit(1);
    });
}