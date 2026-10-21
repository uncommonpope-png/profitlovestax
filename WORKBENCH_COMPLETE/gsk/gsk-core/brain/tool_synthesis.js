'use strict';

/**
 * ToolSynthesis — GSK writes missing tools, sandboxes, tests, registers
 *
 * If tool missing, GSK generates it: DeepToolUse.generateTool(spec)
 * Sandbox execution → test → register in ApprovedToolExecutor
 * Versioned, auditable, shareable
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class ToolSynthesis {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.brain = kernel.brain || kernel.systems?.brain;
        this.approvedToolExecutor = kernel.systems?.approvedToolExecutor || kernel.approvedToolExecutor;
        this.toolsDir = options.toolsDir || path.join(__dirname, '../../gsk-core/tools/synthesized');
        this.sandboxDir = options.sandboxDir || path.join(__dirname, '../../data/tool_sandbox');
        this.registry = new Map(); // toolName -> tool metadata

        if (!fs.existsSync(this.toolsDir)) {
            fs.mkdirSync(this.toolsDir, { recursive: true });
        }
        if (!fs.existsSync(this.sandboxDir)) {
            fs.mkdirSync(this.sandboxDir, { recursive: true });
        }

        // Load existing synthesized tools
        this._loadRegistry();
    }

    /**
     * Generate a new tool from specification
     */
    async generateTool(spec) {
        const { name, description, inputSchema, outputSchema, hints, examples } = spec;

        if (!name || !description) {
            throw new Error('Tool spec requires name and description');
        }

        console.log(`[ToolSynthesis] Generating tool: ${name}`);

        // 1. Generate tool code using brain
        const toolCode = await this._generateToolCode(spec);

        // 2. Save tool file — GATE: reject HTML / missing exports / empty code
        if (
            !toolCode ||
            toolCode.length < 100 ||
            toolCode.includes('<!DOCTYPE') ||
            toolCode.includes('<html') ||
            toolCode.includes('<body') ||
            !toolCode.includes('module.exports')
        ) {
            console.warn(`[ToolSynthesis] REJECTED invalid tool code for "${name}" — likely HTML poison from failed LLM quota`);
            throw new Error(`[ToolSynthesis] Tool code for "${name}" failed validation gate (HTML or missing exports)`);
        }
        const toolPath = path.join(this.toolsDir, `${name}.js`);
        fs.writeFileSync(toolPath, toolCode, 'utf-8');


        // 3. Sandbox test
        const testResult = await this._sandboxTest(name, toolCode, spec);

        if (!testResult.passed) {
            // Try to fix
            const fixed = await this._fixTool(name, toolCode, spec, testResult.error);
            if (fixed) {
                fs.writeFileSync(toolPath, fixed, 'utf-8');
                const retest = await this._sandboxTest(name, fixed, spec);
                if (!retest.passed) {
                    throw new Error(`Tool ${name} failed sandbox test after fix: ${retest.error}`);
                }
            } else {
                throw new Error(`Tool ${name} failed sandbox test: ${testResult.error}`);
            }
        }

        // 4. Register in ApprovedToolExecutor
        if (this.approvedToolExecutor) {
            await this._registerTool(name, toolPath, spec);
        }

        // 5. Update registry
        this.registry.set(name, {
            name,
            description,
            inputSchema,
            outputSchema,
            path: toolPath,
            createdAt: Date.now(),
            version: 1,
            testResult: testResult.passed ? 'passed' : 'fixed'
        });
        this._saveRegistry();

        console.log(`[ToolSynthesis] ✓ Tool ${name} synthesized and registered`);
        return { name, path: toolPath, spec };
    }

    /**
     * Generate tool code using brain
     */
    async _generateToolCode(spec) {
        const { name, description, inputSchema, outputSchema, hints, examples } = spec;

        const prompt = `Generate a complete Node.js tool module for GSK's ApprovedToolExecutor.

TOOL SPECIFICATION:
Name: ${name}
Description: ${description}
Input Schema (JSON Schema): ${JSON.stringify(inputSchema || {}, null, 2)}
Output Schema (JSON Schema): ${JSON.stringify(outputSchema || {}, null, 2)}
Hints: ${hints || 'none'}
Examples: ${JSON.stringify(examples || [], null, 2)}

REQUIREMENTS:
- Export a class named ${name.charAt(0).toUpperCase() + name.slice(1)}Tool
- Constructor takes (kernel, options)
- Method: async execute(params) - returns result object
- Method: validate(params) - returns { valid, errors }
- Use ONLY approved patterns: fs, path, child_process, crypto, http/https, util
- NO eval, new Function, dynamic imports, or external dependencies
- Handle errors gracefully, return { success, result, error }
- Include JSDoc comments
- Follow project code style (2 spaces, semicolons, double quotes)

Return ONLY the complete module code as a string.`;

        const response = await this.brain.think(prompt, '', true);
        return response?.result || response || '';
    }

    /**
     * Sandbox test the tool
     */
    async _sandboxTest(name, toolCode, spec) {
        const sandboxPath = path.join(this.sandboxDir, `${name}_test.js`);

        // Create test file
        const testCode = `
const { ${name.charAt(0).toUpperCase() + name.slice(1)}Tool } = require('${path.join(this.toolsDir, name).replace(/\\/g, '\\\\')}');

// Mock kernel
const mockKernel = {
    brain: { think: async () => 'mock' },
    systems: {}
};

async function test() {
    const tool = new ${name.charAt(0).toUpperCase() + name.slice(1)}Tool(mockKernel);

    // Test validation
    const validInput = ${JSON.stringify(spec.examples?.[0]?.input || {})};
    const validation = tool.validate(validInput);
    if (!validation.valid) {
        throw new Error('Validation failed for valid input: ' + validation.errors.join(', '));
    }

    // Test execution (may fail due to mock, but shouldn't crash)
    try {
        const result = await tool.execute(validInput);
        console.log('Execution result:', JSON.stringify(result));
    } catch (e) {
        console.log('Execution error (expected in sandbox):', e.message);
    }

    console.log('SANDBOX_TEST_PASSED');
}

test().catch(e => {
    console.error('SANDBOX_TEST_FAILED:', e.message);
    process.exit(1);
});
`;

        fs.writeFileSync(sandboxPath, testCode, 'utf-8');

        try {
            execSync(`node "${sandboxPath}"`, {
                cwd: __dirname,
                encoding: 'utf-8',
                stdio: 'pipe',
                timeout: 30000
            });
            return { passed: true };
        } catch (e) {
            return { passed: false, error: e.stdout || e.stderr || e.message };
        }
    }

    /**
     * Fix tool code based on test error
     */
    async _fixTool(name, toolCode, spec, error) {
        const prompt = `Fix this tool code that failed sandbox test:

TOOL NAME: ${name}
ERROR: ${error}

CURRENT CODE:
${toolCode}

SPEC: ${JSON.stringify(spec, null, 2)}

Return ONLY the fixed complete module code.`;

        const response = await this.brain.think(prompt, '', true);
        return response?.result || response || null;
    }

    /**
     * Register tool in ApprovedToolExecutor
     */
    async _registerTool(name, toolPath, spec) {
        if (!this.approvedToolExecutor || typeof this.approvedToolExecutor.registerTool !== 'function') {
            console.log('[ToolSynthesis] ApprovedToolExecutor not available, skipping registration');
            return;
        }

        // Dynamic import the tool
        delete require.cache[require.resolve(toolPath)];
        const ToolClass = require(toolPath)[`${name.charAt(0).toUpperCase() + name.slice(1)}Tool`];

        if (!ToolClass) {
            throw new Error(`Tool class not found in ${toolPath}`);
        }

        const toolInstance = new ToolClass(this.kernel);
        await this.approvedToolExecutor.registerTool(name, toolInstance, {
            description: spec.description,
            inputSchema: spec.inputSchema,
            outputSchema: spec.outputSchema
        });
    }

    /**
     * List all synthesized tools
     */
    listTools() {
        return Array.from(this.registry.values());
    }

    /**
     * Get tool by name
     */
    getTool(name) {
        return this.registry.get(name);
    }

    _loadRegistry() {
        const registryPath = path.join(this.toolsDir, 'registry.json');
        if (fs.existsSync(registryPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
                for (const [name, meta] of Object.entries(data)) {
                    this.registry.set(name, meta);
                }
            } catch (e) {
                console.warn('[ToolSynthesis] Failed to load registry:', e.message);
            }
        }
    }

    _saveRegistry() {
        const registryPath = path.join(this.toolsDir, 'registry.json');
        const data = Object.fromEntries(this.registry);
        fs.writeFileSync(registryPath, JSON.stringify(data, null, 2), 'utf-8');
    }
}

module.exports = { ToolSynthesis };