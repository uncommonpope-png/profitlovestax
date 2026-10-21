'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

function skill_code_review(input) {
    const code = input.code || '';
    const language = input.language || detectLanguage(code);
    
    if (!code.trim()) {
        return Promise.resolve({
            skill: 'code_review',
            plt_affinity: PLT_AFFINITY,
            error: 'No code provided',
            timestamp: Date.now(),
        });
    }
    
    const issues = detectIssues(code, language);
    const score = calculateQualityScore(issues);
    
    return Promise.resolve({
        skill: 'code_review',
        plt_affinity: PLT_AFFINITY,
        language,
        lines: code.split('\n').length,
        issues,
        quality_score: score,
        verdict: score >= 80 ? 'production_ready' : score >= 50 ? 'needs_work' : 'not_production',
        recommendations: generateRecommendations(issues),
        timestamp: Date.now(),
    });
}

function detectIssues(code, language) {
    const issues = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.length > 120 && !line.trim().startsWith('//')) {
            issues.push({ line: i + 1, severity: 'low', type: 'line_length', fix: 'Split long line' });
        }
        
        if (line.includes('console.log') && !line.includes('//')) {
            issues.push({ line: i + 1, severity: 'medium', type: 'debug_code', fix: 'Remove console.log' });
        }
        
        if (line.includes('TODO') || line.includes('FIXME')) {
            issues.push({ line: i + 1, severity: 'info', type: 'todo', fix: 'Address TODO' });
        }
        
        if (/var\s+[a-z]/.test(line)) {
            issues.push({ line: i + 1, severity: 'medium', type: 'deprecated_var', fix: 'Use const/let' });
        }
    }
    
    return issues;
}

function calculateQualityScore(issues) {
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;
    
    const penalty = critical * 20 + high * 15 + medium * 8 + low * 2;
    return Math.max(0, 100 - penalty);
}

function generateRecommendations(issues) {
    return issues.map(i => `[Line ${i.line}] ${i.type}: ${i.fix}`);
}

function detectLanguage(code) {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('fn ') && code.includes('let')) return 'rust';
    if (code.includes('#include')) return 'cpp';
    return 'javascript';
}

module.exports = { skill_code_review };