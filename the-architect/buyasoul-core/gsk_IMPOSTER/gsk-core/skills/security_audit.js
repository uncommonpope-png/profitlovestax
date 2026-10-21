'use strict';

const PLT_AFFINITY = { profit: 0.6, love: 0.2, tax: 0.2 };

function skill_security_audit(input) {
    const code = input.code || '';
    
    if (!code.trim()) {
        return Promise.resolve({
            skill: 'security_audit',
            plt_affinity: PLT_AFFINITY,
            error: 'No code provided',
            timestamp: Date.now(),
        });
    }
    
    const vulnerabilities = detectVulnerabilities(code);
    const score = calculateSecurityScore(vulnerabilities);
    
    return Promise.resolve({
        skill: 'security_audit',
        plt_affinity: PLT_AFFINITY,
        vulnerabilities,
        security_score: score,
        grade: score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F',
        recommendations: generateSecurityFixes(vulnerabilities),
        timestamp: Date.now(),
    });
}

function detectVulnerabilities(code) {
    const vulns = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('password') && line.includes('=') && !line.includes('process.env')) {
            vulns.push({ line: i + 1, severity: 'critical', type: 'hardcoded_secret', cwe: 'CWE-798', fix: 'Use environment variables' });
        }
        
        if (line.includes('eval(')) {
            vulns.push({ line: i + 1, severity: 'high', type: 'code_injection', cwe: 'CWE-95', fix: 'Avoid eval()' });
        }
        
        if (line.includes('SQL') && line.includes('SELECT') && !line.includes('param')) {
            vulns.push({ line: i + 1, severity: 'high', type: 'sql_injection', cwe: 'CWE-89', fix: 'Use parameterized queries' });
        }
        
        if (line.includes('innerHTML') && !line.includes('sanitize')) {
            vulns.push({ line: i + 1, severity: 'high', type: 'xss', cwe: 'CWE-79', fix: 'Sanitize HTML or use textContent' });
        }
        
        if (line.includes('exec(') || line.includes('system(')) {
            vulns.push({ line: i + 1, severity: 'high', type: 'command_injection', cwe: 'CWE-78', fix: 'Avoid shell commands or sanitize input' });
        }
    }
    
    return vulns;
}

function calculateSecurityScore(vulns) {
    const critical = vulns.filter(v => v.severity === 'critical').length;
    const high = vulns.filter(v => v.severity === 'high').length;
    const medium = vulns.filter(v => v.severity === 'medium').length;
    const low = vulns.filter(v => v.severity === 'low').length;
    
    const penalty = critical * 30 + high * 20 + medium * 10 + low * 3;
    return Math.max(0, 100 - penalty);
}

function generateSecurityFixes(vulns) {
    return vulns.map(v => `[Line ${v.line}] ${v.type} (${v.cwe}): ${v.fix}`);
}

module.exports = { skill_security_audit };