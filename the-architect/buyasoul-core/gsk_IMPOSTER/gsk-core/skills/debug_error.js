'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

function skill_debug_error(input) {
    const error = input.error || input.message || input;
    const code = input.code || '';
    const language = input.language || detectLanguage(code);
    
    const parsed = parseError(error);
    const causes = identifyCauses(parsed, code);
    const fixes = suggestFixes(parsed, causes);
    
    return Promise.resolve({
        skill: 'debug_error',
        plt_affinity: PLT_AFFINITY,
        error: parsed,
        language,
        causes,
        fixes,
        severity: assessSeverity(parsed),
        estimated_fix_time: estimateFixTime(causes),
        plt_impact: calculateDebugPLT(causes),
        timestamp: Date.now(),
    });
}

function parseError(error) {
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
    
    const patterns = {
        syntax: /syntax\s*error|unexpected\s*token/i,
        reference: /undefined|not\s*defined|cannot\s*find/i,
        type: /typeerror|is\s*not\s*a|type\s*mismatch/i,
        network: /timeout|ECONNREFUSED|ENOTFOUND/i,
        permission: /permission\s*denied|EACCES/i,
        memory: /out\s*of\s*memory|heap|stack\s*overflow/i,
    };
    
    let type = 'unknown';
    for (const [key, pattern] of Object.entries(patterns)) {
        if (pattern.test(errorStr)) {
            type = key;
            break;
        }
    }
    
    const lineMatch = errorStr.match(/line\s*(\d+)/i) || errorStr.match(/:(\d+):/);
    const line = lineMatch ? parseInt(lineMatch[1]) : null;
    
    return {
        raw: errorStr,
        type,
        line,
        message: extractErrorMessage(errorStr),
    };
}

function extractErrorMessage(errorStr) {
    const match = errorStr.match(/([A-Z][a-z]+Error:[^\n]+)/) || errorStr.match(/(Error:[^\n]+)/);
    return match ? match[1] : errorStr.substring(0, 200);
}

function identifyCauses(error, code) {
    const causes = [];
    
    switch (error.type) {
        case 'syntax':
            causes.push('Missing or misplaced punctuation (comma, bracket, semicolon)');
            break;
        case 'reference':
            causes.push('Variable or function not defined in scope');
            break;
        case 'type':
            causes.push('Incorrect data type passed to function');
            break;
        case 'network':
            causes.push('Service endpoint unreachable or timeout');
            break;
        default:
            causes.push('Unknown error source - requires manual inspection');
    }
    
    return causes;
}

function suggestFixes(error, causes) {
    const fixes = {
        syntax: [{ fix: 'Check all brackets and parentheses are balanced', priority: 'high' }],
        reference: [{ fix: 'Check spelling matches definition', priority: 'high' }],
        type: [{ fix: 'Add type checking before operation', priority: 'medium' }],
        network: [{ fix: 'Verify service is running and accessible', priority: 'high' }],
    };
    
    return fixes[error.type] || [{ fix: 'Research specific error for solutions', priority: 'medium' }];
}

function assessSeverity(error) {
    const severities = { syntax: 'high', reference: 'high', type: 'medium', network: 'medium', permission: 'critical', memory: 'critical' };
    return severities[error.type] || 'low';
}

function estimateFixTime(causes) {
    return 15 + (causes.length * 10);
}

function calculateDebugPLT(causes) {
    return { profit: 0.8, love: 0.4, tax: 0.3 + (causes.length * 0.05), total: 0.8 + 0.4 - 0.3 - (causes.length * 0.1) };
}

function detectLanguage(code) {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('fn ') && code.includes('let')) return 'rust';
    if (code.includes('#include')) return 'cpp';
    return 'javascript';
}

module.exports = { skill_debug_error };