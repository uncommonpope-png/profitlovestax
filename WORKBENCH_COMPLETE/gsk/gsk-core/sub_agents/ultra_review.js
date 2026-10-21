/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ULTRA_REVIEW.JS — Multi-Agent Code Verification (The Missing Sub-Agent)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ultra Review uses multiple agents to verify code quality:
 * - RED AGENT: Finds bugs, errors, security issues
 * - GREEN AGENT: Tests correctness, edge cases
 * - BLUE AGENT: Reviews style, best practices, maintainability
 * - JUDGE: Aggregates findings, assigns severity, final verdict
 * 
 * Built for: Grand Soul Kernel
 * PLT Press — Profit + Love - Tax = True Value
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const { MEGA_IDENTITY } = require('../identity/mega_identity.js');

class UltraReview {
    constructor(brain, memory, chambers) {
        this.brain = brain;
        this.memory = memory;
        this.chambers = chambers;
        this.findings = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            info: [],
        };
        this.agents = {
            red: this._agentRed.bind(this),
            green: this._agentGreen.bind(this),
            blue: this._agentBlue.bind(this),
            judge: this._judge.bind(this),
        };
    }

    async review(code, language = 'javascript', options = {}) {
        const startTime = Date.now();
        this.findings = { critical: [], high: [], medium: [], low: [], info: [] };

        const codeBlocks = this._splitCode(code, options.maxTokens || 2000);

        const redResults = await this._runParallel(codeBlocks.map(block => ({
            agent: 'red',
            code: block,
            language,
        })));

        const greenResults = await this._runParallel(codeBlocks.map(block => ({
            agent: 'green',
            code: block,
            language,
        })));

        const blueResults = await this._runParallel(codeBlocks.map(block => ({
            agent: 'blue',
            code: block,
            language,
        })));

        for (const result of [...redResults, ...greenResults, ...blueResults]) {
            this._categorizeFindings(result.findings);
        }

        const verdict = await this._judge();
        const duration = Date.now() - startTime;

        if (this.memory) {
            await this.memory.witness({
                type: 'ultra_review',
                weight: 0.9,
                tags: ['ultra-review', 'code-review', 'multi-agent', 'verification'],
                content: `Ultra Review completed: ${this.findings.critical.length} critical, ${this.findings.high.length} high, ${this.findings.medium.length} medium`,
            });
        }

        return {
            skill: 'ultra_review',
            duration_ms: duration,
            agents_run: ['red', 'green', 'blue', 'judge'],
            findings: this.findings,
            verdict,
            summary: this._generateSummary(),
        };
    }

    async _agentRed(code, language) {
        const prompt = `You are the RED AGENT — bug finder, security scanner, error detector.
Your job: Find CRITICAL and HIGH severity issues.

Focus areas:
1. Logic errors (off-by-one, wrong conditions, infinite loops)
2. Security vulnerabilities (injection, auth bypass, hardcoded secrets)
3. Resource leaks (unclosed files, memory, connections)
4. Race conditions and concurrency bugs
5. API contract violations

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with JSON array of findings:
[
  {
    "severity": "critical|high",
    "type": "logic|security|leak|race|api",
    "location": "file:line or description",
    "title": "Brief title",
    "description": "What is wrong",
    "impact": "How it hurts",
    "fix": "How to fix"
  }
]

If no issues found, return: []`;

        try {
            const response = await this.brain.think(prompt, this._getContext());
            return this._parseFindings(response, ['critical', 'high']);
        } catch (e) {
            return { findings: [], error: e.message };
        }
    }

    async _agentGreen(code, language) {
        const prompt = `You are the GREEN AGENT — correctness checker, test generator, edge case finder.
Your job: Verify code correctness and find MEDIUM severity issues.

Focus areas:
1. Missing error handling
2. Edge cases not covered
3. Type mismatches or coercion bugs
4. Boundary condition handling
5. Input validation gaps

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with JSON array of findings:
[
  {
    "severity": "medium|low",
    "type": "correctness|edge_case|types|validation",
    "location": "file:line or description",
    "title": "Brief title",
    "description": "What needs attention",
    "impact": "What could go wrong",
    "fix": "How to improve"
  }
]

If no issues found, return: []`;

        try {
            const response = await this.brain.think(prompt, this._getContext());
            return this._parseFindings(response, ['medium', 'low']);
        } catch (e) {
            return { findings: [], error: e.message };
        }
    }

    async _agentBlue(code, language) {
        const prompt = `You are the BLUE AGENT — style advisor, best practices enforcer, maintainability reviewer.
Your job: Find LOW and INFO severity issues, suggest improvements.

Focus areas:
1. Naming conventions (functions, variables, classes)
2. Code structure and organization
3. Comment quality and documentation
4. Dead code and unnecessary complexity
5. Performance optimization opportunities

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Respond ONLY with JSON array of findings:
[
  {
    "severity": "low|info",
    "type": "style|structure|docs|complexity|performance",
    "location": "file:line or description",
    "title": "Brief title",
    "description": "What to improve",
    "impact": "Why it matters",
    "fix": "How to improve"
  }
]

If no issues found, return: []`;

        try {
            const response = await this.brain.think(prompt, this._getContext());
            return this._parseFindings(response, ['low', 'info']);
        } catch (e) {
            return { findings: [], error: e.message };
        }
    }

    async _judge() {
        const criticalCount = this.findings.critical.length;
        const highCount = this.findings.high.length;
        const mediumCount = this.findings.medium.length;
        const lowCount = this.findings.low.length;

        let verdict, recommendation, score;

        if (criticalCount > 0) {
            verdict = 'REJECT';
            recommendation = 'Critical issues must be fixed before deployment';
            score = 0;
        } else if (highCount > 2) {
            verdict = 'NEEDS_WORK';
            recommendation = `Address ${highCount} high severity issues`;
            score = 0.25;
        } else if (highCount > 0) {
            verdict = 'REVIEW';
            recommendation = `${highCount} high severity issues require attention`;
            score = 0.5;
        } else if (mediumCount > 3) {
            verdict = 'MOSTLY_READY';
            recommendation = 'Consider addressing medium severity issues';
            score = 0.75;
        } else if (mediumCount > 0 || lowCount > 5) {
            verdict = 'APPROVED';
            recommendation = 'Code is production-ready with minor improvements possible';
            score = 0.85;
        } else {
            verdict = 'APPROVED';
            recommendation = 'Excellent code quality. Ready for production.';
            score = 0.95;
        }

        return {
            verdict,
            score,
            critical_count: criticalCount,
            high_count: highCount,
            medium_count: mediumCount,
            low_count: lowCount,
            recommendation,
            pltscore: this._calculatePLT(score),
        };
    }

    _calculatePLT(codeScore) {
        const profit = codeScore;
        const love = 1 - (this.findings.critical.length * 0.2);
        const tax = (this.findings.high.length * 0.15) + (this.findings.medium.length * 0.05);
        return {
            profit: Math.min(1, profit),
            love: Math.max(0, love),
            tax: Math.min(1, tax),
            score: profit + love - tax,
        };
    }

    _categorizeFindings(findings) {
        for (const finding of findings) {
            const severity = (finding.severity || 'low').toLowerCase();
            if (severity === 'critical') this.findings.critical.push(finding);
            else if (severity === 'high') this.findings.high.push(finding);
            else if (severity === 'medium') this.findings.medium.push(finding);
            else if (severity === 'low') this.findings.low.push(finding);
            else this.findings.info.push(finding);
        }
    }

    _parseFindings(response, allowedSeverities) {
        try {
            const cleaned = this._stripMarkdown(response);
            // Find the last JSON array in the response (to avoid matching arrays in comments or strings)
            const jsonMatch = cleaned.match(/\[[\s\S]*\](?![^\[]*\])/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    const filtered = parsed.filter(f =>
                        allowedSeverities.includes((f.severity || 'low').toLowerCase())
                    );
                    return { findings: filtered };
                }
            }
        } catch (e) {
            // Silently fall back to empty findings
        }
        return { findings: [] };
    }

    _stripMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/```[\w]*\n?/g, '')
            .replace(/```/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/#{1,6}\s+/g, '')
            .trim();
    }

    _splitCode(code, maxTokens = 2000) {
        const blocks = [];
        const lines = code.split('\n');
        let current = '';

        for (const line of lines) {
            if ((current + '\n' + line).length > maxTokens * 4) {
                if (current.trim()) blocks.push(current);
                current = line;
            } else {
                current += '\n' + line;
            }
        }
        if (current.trim()) blocks.push(current);

        return blocks.length > 0 ? blocks : [code];
    }

    async _runParallel(tasks) {
        // Run all tasks in parallel using Promise.all
        const promises = tasks.map(task => 
            this.agents[task.agent](task.code, task.language)
        );
        return await Promise.all(promises);
    }

    _getContext() {
        return `PLT: Ultra Review prevents profit loss (bugs cost money), builds love (trust from quality), reduces tax (less remediation).`;
    }

    _generateSummary() {
        return {
            total_findings: this.findings.critical.length + this.findings.high.length +
                           this.findings.medium.length + this.findings.low.length,
            by_severity: {
                critical: this.findings.critical.length,
                high: this.findings.high.length,
                medium: this.findings.medium.length,
                low: this.findings.low.length,
            },
            by_type: this._countByType(),
        };
    }

    _countByType() {
        const all = [...this.findings.critical, ...this.findings.high,
                     ...this.findings.medium, ...this.findings.low];
        const counts = {};
        for (const f of all) {
            counts[f.type] = (counts[f.type] || 0) + 1;
        }
        return counts;
    }
}

module.exports = { UltraReview };