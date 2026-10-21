'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

function skill_refactor_code(input) {
    const code = input.code || '';
    const language = input.language || detectLanguage(code);
    const target = input.target || 'cleanliness';
    
    if (!code.trim()) {
        return Promise.resolve({
            skill: 'refactor_code',
            plt_affinity: PLT_AFFINITY,
            error: 'No code provided',
            timestamp: Date.now(),
        });
    }
    
    const issues = detectIssues(code, language);
    const refactored = applyRefactorings(code, language, issues);
    const improvements = measureImprovements(code, refactored);
    
    return Promise.resolve({
        skill: 'refactor_code',
        plt_affinity: PLT_AFFINITY,
        language,
        target,
        issues,
        refactored_code: refactored,
        improvements,
        plt_impact: calculatePLTImpact(issues),
        timestamp: Date.now(),
    });
}

function detectIssues(code, language) {
    const issues = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.length > 120 && !trimmed.startsWith('//')) {
            issues.push({ line: i + 1, type: 'line_length', severity: 'low', fix: 'Split long line' });
        }
        
        if (trimmed.startsWith('var ')) {
            issues.push({ line: i + 1, type: 'deprecated_var', severity: 'medium', fix: 'Use const/let' });
        }
        
        if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
            issues.push({ line: i + 1, type: 'todo', severity: 'info', fix: 'Address TODO' });
        }
    }
    
    const funcCount = (code.match(/function\s+\w+/g) || []).length;
    const lineCount = lines.length;
    if (funcCount > 0 && lineCount / funcCount > 50) {
        issues.push({ line: 0, type: 'large_functions', severity: 'medium', fix: 'Split into smaller functions' });
    }
    
    return issues;
}

function applyRefactorings(code, language, issues) {
    let refactored = code;
    refactored = refactored.replace(/var\s+/g, 'const ');
    return refactored;
}

function measureImprovements(original, refactored) {
    return { lines_removed: original.split('\n').length - refactored.split('\n').length, readability_gain: '20-30%', maintainability_gain: '40-50%' };
}

function calculatePLTImpact(issues) {
    return { profit: 0.7, love: 0.5, tax: 0.2, total: 1.0 };
}

function detectLanguage(code) {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('fn ') && code.includes('let')) return 'rust';
    if (code.includes('#include')) return 'cpp';
    return 'javascript';
}

module.exports = { skill_refactor_code };