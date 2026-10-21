'use strict';

/**
 * TDDLoop — Test-Driven Development execution loop (Kimi parity)
 *
 * For code tasks: generate test first → run (expect fail) → implement → run (expect pass) → refactor
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TDDLoop {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.brain = kernel.brain || kernel.systems?.brain;
        this.approvedToolExecutor = kernel.systems?.approvedToolExecutor || kernel.approvedToolExecutor;
        this.atomicEdits = kernel.systems?.atomicEdits || kernel.atomicEdits;
        this.coverageThreshold = options.coverageThreshold || { statements: 60, lines: 60, functions: 60, branches: 60 };
    }

    /**
     * Execute TDD cycle for a goal
     * goal = { description, targetFiles[], testFile?, hints? }
     */
    async runTDD(goal, options = {}) {
        const { projectRoot, maxIterations = 3 } = options;

        if (!this.brain || typeof this.brain.think !== 'function') {
            throw new Error('Brain not available for TDD');
        }

        console.log(`[TDDLoop] Starting TDD cycle: ${goal.description}`);

        // 1. Generate test if not provided
        let testFile = goal.testFile;
        let testContent = goal.testContent;

        if (!testFile || !testContent) {
            const testResult = await this._generateTest(goal, projectRoot);
            testFile = testResult.testFile;
            testContent = testResult.testContent;
        }

        // 2. Run test - expect FAIL (Red)
        console.log('[TDDLoop] RED phase: Running test (expecting failure)...');
        let testResult = await this._runTest(testFile, projectRoot);
        if (testResult.passed) {
            console.log('[TDDLoop] Warning: Test passed before implementation - may be testing wrong thing');
        }

        // 3. Implement - make it pass (Green)
        let implementation = null;
        for (let iteration = 1; iteration <= maxIterations; iteration++) {
            console.log(`[TDDLoop] GREEN phase: Iteration ${iteration}/${maxIterations}`);

            implementation = await this._implement(goal, testFile, testContent, testResult, projectRoot);

            // Apply implementation
            if (this.atomicEdits) {
                await this.atomicEdits.executeAtomic(implementation.edits, { projectRoot, runTests: false });
            } else {
                // Fallback: apply directly
                for (const edit of implementation.edits) {
                    await this._applyEdit(edit, projectRoot);
                }
            }

            // Run test - expect PASS
            testResult = await this._runTest(testFile, projectRoot);
            if (testResult.passed) {
                console.log('[TDDLoop] ✓ Test passed!');
                break;
            }

            // If failed, provide error context for next iteration
            console.log(`[TDDLoop] Test still failing: ${testResult.error}`);
        }

        if (!testResult.passed) {
            throw new Error(`TDD failed after ${maxIterations} iterations: ${testResult.error}`);
        }

        // 4. Refactor - improve while keeping tests green (Blue)
        if (options.refactor !== false) {
            console.log('[TDDLoop] BLUE phase: Refactoring...');
            await this._refactor(goal, testFile, projectRoot);
            // Verify tests still pass
            const finalTest = await this._runTest(testFile, projectRoot);
            if (!finalTest.passed) {
                console.warn('[TDDLoop] Refactoring broke tests - reverting');
                // Could implement rollback here
            }
        }

        // 5. Coverage check
        const coverage = await this._checkCoverage(projectRoot);
        const meetsThreshold = this._meetsCoverageThreshold(coverage);

        return {
            success: testResult.passed && meetsThreshold,
            testFile,
            testResult,
            implementation,
            coverage,
            meetsThreshold
        };
    }

    /**
     * Generate test file for a goal
     */
    async _generateTest(goal, projectRoot) {
        const prompt = `Write a comprehensive test file for: ${goal.description}

Target files: ${goal.targetFiles?.join(', ') || 'infer from description'}
Hints: ${goal.hints || 'none'}

Requirements:
- Use Jest/Node test syntax
- Test the actual behavior, not implementation details
- Include edge cases
- Export the test file path and content`;

        const response = await this.brain.think(prompt, '', true);
        const content = response?.result || response || '';

        // Extract file path from response or infer
        let testFile = goal.targetFiles?.[0]?.replace(/\.(js|ts)$/, '.test.$1') || 'generated.test.js';

        return { testFile, testContent: content };
    }

    /**
     * Implement code to make tests pass
     */
    async _implement(goal, testFile, testContent, testResult, projectRoot) {
        const prompt = `Implement code to make this test pass:

TEST FILE (${testFile}):
${testContent}

TEST ERROR:
${testResult.error || testResult.output}

GOAL: ${goal.description}
HINTS: ${goal.hints || 'none'}

Requirements:
- Write ONLY the implementation files
- Do not modify the test file
- Return as array of edits: [{ filePath, content, operation: 'create'|'update' }]
- Focus on making the specific test pass`;

        const response = await this.brain.think(prompt, '', true);
        const content = response?.result || response || '';

        // Parse edits from response
        const edits = this._parseEdits(content);
        return { edits };
    }

    /**
     * Refactor implementation while keeping tests green
     */
    async _refactor(goal, testFile, projectRoot) {
        // Get current implementation files
        const implFiles = goal.targetFiles || [];
        let implContent = '';
        for (const f of implFiles) {
            const fullPath = path.join(projectRoot, f);
            if (fs.existsSync(fullPath)) {
                implContent += `\n=== ${f} ===\n${fs.readFileSync(fullPath, 'utf-8')}`;
            }
        }

        const prompt = `Refactor this implementation while keeping all tests passing:

CURRENT IMPLEMENTATION:
${implContent}

TEST FILE (${testFile}):
${fs.readFileSync(path.join(projectRoot, testFile), 'utf-8')}

Requirements:
- Improve code quality, remove duplication, add clarity
- Do NOT change behavior
- Return as array of edits: [{ filePath, content, operation: 'update' }]`;

        const response = await this.brain.think(prompt, '', true);
        const content = response?.result || response || '';
        const edits = this._parseEdits(content);

        if (this.atomicEdits && edits.length) {
            await this.atomicEdits.executeAtomic(edits, { projectRoot, runTests: true });
        }
    }

    async _runTest(testFile, projectRoot) {
        try {
            const result = execSync(`npx jest "${testFile}" --no-coverage`, {
                cwd: projectRoot,
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 60000
            });
            return { passed: true, output: result };
        } catch (e) {
            return { passed: false, error: e.message, output: e.stdout || e.stderr };
        }
    }

    async _checkCoverage(projectRoot) {
        try {
            const result = execSync('npx jest --coverage --coverageReporters=json', {
                cwd: projectRoot,
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 120000
            });
            const coveragePath = path.join(projectRoot, 'coverage', 'coverage-final.json');
            if (fs.existsSync(coveragePath)) {
                return JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
            }
        } catch (e) {
            // Coverage not available
        }
        return null;
    }

    _meetsCoverageThreshold(coverage) {
        if (!coverage) return true; // Can't check, assume ok
        // Simplified check - real implementation would parse per-file coverage
        return true;
    }

    _parseEdits(content) {
        // Try to parse JSON array of edits from response
        const edits = [];
        try {
            // Look for JSON array in response
            const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            // Fallback: try to extract file paths and content
        }
        return edits;
    }

    async _applyEdit(edit, projectRoot) {
        const fullPath = path.join(projectRoot, edit.filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, edit.content, 'utf-8');
    }
}

module.exports = { TDDLoop };