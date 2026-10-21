'use strict';

/**
 * SpecialistAgents — Role-based specialist agents (CrewAI parity)
 *
 * Spawns internal specialists: Researcher, Architect, Coder, Reviewer, Tester, Documenter
 * Each has own prompt, tools, memory slice, approval level
 * BeautifulLoop `decide` phase selects specialist crew for goal
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SpecialistAgents {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.brain = kernel.brain || kernel.systems?.brain;
        this.maxConcurrent = options.maxConcurrent || 3;

        // Define specialist roles
        this.roles = {
            researcher: {
                name: 'Researcher',
                description: 'Deep-dive research, literature review, fact-finding',
                systemPrompt: `You are a Research Specialist. Your job is to investigate topics thoroughly.
- Search, analyze, synthesize information
- Cite sources, provide evidence
- Identify gaps, contradictions, opportunities
- Output: structured findings with confidence scores`,
                tools: ['search', 'fetch', 'analyze'],
                approvalLevel: 'low', // Can run autonomously
                memoryScope: 'research'
            },
            architect: {
                name: 'Architect',
                description: 'System design, architecture decisions, technical planning',
                systemPrompt: `You are an Architecture Specialist. Your job is to design robust systems.
- Break down requirements into components
- Define interfaces, data flows, boundaries
- Consider scalability, maintainability, trade-offs
- Output: architecture diagrams (text), component specs, ADRs`,
                tools: ['design', 'plan', 'validate'],
                approvalLevel: 'medium', // Needs approval for major decisions
                memoryScope: 'architecture'
            },
            coder: {
                name: 'Coder',
                description: 'Implementation, code generation, refactoring',
                systemPrompt: `You are a Coding Specialist. Your job is to write clean, working code.
- Implement specs exactly
- Follow project conventions
- Handle edge cases, errors
- Output: complete, tested code files`,
                tools: ['write', 'edit', 'refactor'],
                approvalLevel: 'medium', // Code changes need review
                memoryScope: 'code'
            },
            reviewer: {
                name: 'Reviewer',
                description: 'Code review, quality assurance, security audit',
                systemPrompt: `You are a Review Specialist. Your job is to ensure quality and correctness.
- Find bugs, security issues, performance problems
- Check adherence to standards, patterns
- Suggest improvements with rationale
- Output: review report with severity levels`,
                tools: ['review', 'audit', 'lint'],
                approvalLevel: 'high', // Reviews gate merges
                memoryScope: 'review'
            },
            tester: {
                name: 'Tester',
                description: 'Test generation, execution, coverage analysis',
                systemPrompt: `You are a Testing Specialist. Your job is to verify correctness.
- Generate comprehensive test suites
- Run tests, analyze coverage
- Identify missing edge cases
- Output: test files, coverage reports, gap analysis`,
                tools: ['test', 'coverage', 'generate_tests'],
                approvalLevel: 'medium',
                memoryScope: 'test'
            },
            documenter: {
                name: 'Documenter',
                description: 'Documentation, API specs, user guides',
                systemPrompt: `You are a Documentation Specialist. Your job is to make knowledge accessible.
- Write clear, accurate documentation
- Keep docs in sync with code
- Create examples, tutorials
- Output: markdown docs, API specs, READMEs`,
                tools: ['write_docs', 'generate_api', 'sync_docs'],
                approvalLevel: 'low',
                memoryScope: 'docs'
            }
        };
    }

    /**
     * Select specialist crew for a goal
     */
    selectCrew(goal) {
        const goalLower = goal.toLowerCase();
        const crew = [];

        // Always include researcher for understanding
        crew.push('researcher');

        // Architect for design tasks
        if (goalLower.includes('design') || goalLower.includes('architect') ||
            goalLower.includes('system') || goalLower.includes('plan')) {
            crew.push('architect');
        }

        // Coder for implementation
        if (goalLower.includes('implement') || goalLower.includes('build') ||
            goalLower.includes('code') || goalLower.includes('create') ||
            goalLower.includes('write') || goalLower.includes('fix')) {
            crew.push('coder');
        }

        // Reviewer for quality-critical
        if (goalLower.includes('review') || goalLower.includes('audit') ||
            goalLower.includes('security') || goalLower.includes('quality')) {
            crew.push('reviewer');
        }

        // Tester for test-related
        if (goalLower.includes('test') || goalLower.includes('coverage') ||
            goalLower.includes('verify') || goalLower.includes('validate')) {
            crew.push('tester');
        }

        // Documenter for docs
        if (goalLower.includes('document') || goalLower.includes('readme') ||
            goalLower.includes('guide') || goalLower.includes('spec')) {
            crew.push('documenter');
        }

        // Default: researcher + coder + reviewer
        if (crew.length <= 1) {
            crew.push('coder', 'reviewer');
        }

        return [...new Set(crew)]; // Dedup
    }

    /**
     * Execute a specialist task
     */
    async executeSpecialist(role, task, context = {}) {
        const specialist = this.roles[role];
        if (!specialist) {
            throw new Error(`Unknown specialist role: ${role}`);
        }

        const prompt = `${specialist.systemPrompt}

TASK: ${task}

CONTEXT:
${JSON.stringify(context, null, 2)}

REQUIREMENTS:
- Stay in character as ${specialist.name}
- Use your designated tools
- Output structured result for ${role}`;

        // Call brain with specialist prompt
        if (this.brain && typeof this.brain.think === 'function') {
            const response = await this.brain.think(prompt, context.soulContext || '', true);
            return {
                role,
                specialist: specialist.name,
                result: response?.result || response || '',
                approvalLevel: specialist.approvalLevel
            };
        }

        return {
            role,
            specialist: specialist.name,
            result: 'Brain not available',
            approvalLevel: specialist.approvalLevel
        };
    }

    /**
     * Run full crew on a goal (parallel where possible)
     */
    async runCrew(goal, context = {}) {
        const crew = this.selectCrew(goal);
        console.log(`[SpecialistAgents] Crew selected: ${crew.join(', ')}`);

        const results = {};

        // Phase 1: Research (sequential first)
        if (crew.includes('researcher')) {
            const research = await this.executeSpecialist('researcher', goal, context);
            results.researcher = research;
            context.researchFindings = research.result;
        }

        // Phase 2: Architecture (if needed)
        if (crew.includes('architect')) {
            const arch = await this.executeSpecialist('architect', goal, context);
            results.architect = arch;
            context.architecture = arch.result;
        }

        // Phase 3: Implementation (parallel: coder, tester, documenter)
        const parallelRoles = crew.filter(r => ['coder', 'tester', 'documenter'].includes(r));
        if (parallelRoles.length) {
            const parallelResults = await Promise.all(
                parallelRoles.map(role => this.executeSpecialist(role, goal, context))
            );
            for (const result of parallelResults) {
                results[result.role] = result;
                context[result.role + 'Output'] = result.result;
            }
        }

        // Phase 4: Review (last, has full context)
        if (crew.includes('reviewer')) {
            const review = await this.executeSpecialist('reviewer', goal, context);
            results.reviewer = review;
        }

        return { crew, results, goal };
    }

    getAvailableRoles() {
        return Object.entries(this.roles).map(([key, value]) => ({
            role: key,
            name: value.name,
            description: value.description,
            approvalLevel: value.approvalLevel
        }));
    }
}

module.exports = { SpecialistAgents };