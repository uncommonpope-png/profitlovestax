const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class DeepToolUse {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.tools = new Map();
        this.executionHistory = [];
        this.maxHistory = 100;
        this._registerDefaultTools();
    }

    _registerDefaultTools() {
        this.tools.set('code_exec', this._codeExec.bind(this));
        this.tools.set('git_ops', this._gitOps.bind(this));
        this.tools.set('shell_exec', this._shellExec.bind(this));
        this.tools.set('web_search', this._webSearch.bind(this));
        this.tools.set('file_read', this._fileRead.bind(this));
        this.tools.set('file_write', this._fileWrite.bind(this));
        this.tools.set('file_list', this._fileList.bind(this));
    }

    async registerTool(name, fn) {
        this.tools.set(name, fn);
    }

    async executeTool(toolName, args) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not available. Available: ${Array.from(this.tools.keys()).join(', ')}`);
        }

        const execution = {
            tool: toolName,
            args,
            startTime: Date.now()
        };

        try {
            const result = await tool(args);
            execution.success = true;
            execution.result = result;
            this._recordExecution(execution);
            return result;
        } catch (e) {
            execution.success = false;
            execution.error = e.message;
            this._recordExecution(execution);
            throw e;
        }
    }

    async executePlan(steps, options = {}) {
        const { stopOnError = true, gatherResults = true } = options;
        const results = [];
        const state = {};

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            try {
                const result = await this.executeTool(step.tool, {
                    ...step.args,
                    _state: state,
                    _stepIndex: i
                });

                if (gatherResults) {
                    results.push({ step: i, tool: step.tool, success: true, result });
                }

                if (result && typeof result === 'object' && result._state) {
                    Object.assign(state, result._state);
                }

                if (this.kernel && this.kernel.onPlanStep) {
                    await this.kernel.onPlanStep(i, step, result);
                }
            } catch (e) {
                if (stopOnError) {
                    return { success: false, step: i, error: e.message, partialResults: results };
                }
                results.push({ step: i, tool: step.tool, success: false, error: e.message });
            }
        }

        return { success: true, steps: results, finalState: state };
    }

    async validateResult(tool, result) {
        if (!result) return { valid: false, reason: 'No result returned' };

        if (result.error) return { valid: false, reason: result.error };

        if (typeof result === 'string') {
            const lower = result.toLowerCase();
            if (lower.includes('error') || lower.includes('failed') || lower.includes('exception')) {
                return { valid: false, reason: 'Result contains error indicators' };
            }
        }

        return { valid: true };
    }

    _recordExecution(execution) {
        execution.endTime = Date.now();
        execution.duration = execution.endTime - execution.startTime;
        this.executionHistory.push(execution);
        if (this.executionHistory.length > this.maxHistory) {
            this.executionHistory.shift();
        }
    }

    async _codeExec(args) {
        const { code, language = 'javascript', timeout = 30000 } = args;

        if (language === 'javascript' || language === 'js') {
            const vm = require('vm');
            const sandbox = { console: console, setTimeout, setInterval, Math, JSON, Date, Array, Object, String, Number, Promise };
            vm.createContext(sandbox);
            try {
                return { output: vm.runInContext(code, sandbox, { timeout }) };
            } catch (e) {
                throw new Error(`Code execution failed: ${e.message}`);
            }
        }

        throw new Error(`Language ${language} not supported for direct execution`);
    }

    async _gitOps(args) {
        const { command, repoPath = '.' } = args;
        const gitCommands = ['status', 'log', 'diff', 'branch', 'commit', 'push', 'pull'];

        const validCmd = gitCommands.find(c => command.startsWith(c));
        if (!validCmd) {
            throw new Error(`Git command must start with: ${gitCommands.join(', ')}`);
        }

        return await this._shellExec({ command: `git ${command}`, cwd: repoPath });
    }

    async _shellExec(args) {
        const { command, cwd = process.cwd(), timeout = 60000, env = {} } = args;

        return new Promise((resolve, reject) => {
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'powershell' : 'bash';
            const shellArgs = isWindows ? ['-Command', command] : ['-c', command];

            const proc = spawn(shell, shellArgs, { cwd, env: { ...process.env, ...env } });
            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', d => stdout += d);
            proc.stderr.on('data', d => stderr += d);

            const timer = setTimeout(() => {
                proc.kill();
                reject(new Error('Command timed out'));
            }, timeout);

            proc.on('close', code => {
                clearTimeout(timer);
                resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() });
            });

            proc.on('error', reject);
        });
    }

    async _webSearch(args) {
        const { query, numResults = 5 } = args;
        const { websearch } = this.kernel?.modules || {};

        if (websearch) {
            return await websearch(query, numResults);
        }

        return { query, results: [], note: 'Web search not configured' };
    }

    async _fileRead(args) {
        const { path: filePath, encoding = 'utf8' } = args;
        try {
            const content = await fs.readFile(filePath, encoding);
            return { content, path: filePath, size: content.length };
        } catch (e) {
            throw new Error(`Failed to read ${filePath}: ${e.message}`);
        }
    }

    async _fileWrite(args) {
        const { path: filePath, content, encoding = 'utf8' } = args;
        try {
            await fs.writeFile(filePath, content, encoding);
            return { success: true, path: filePath, size: content.length };
        } catch (e) {
            throw new Error(`Failed to write ${filePath}: ${e.message}`);
        }
    }

    async _fileList(args) {
        const { path: dirPath, pattern = '*' } = args;
        const { glob } = await import('glob');
        const files = await glob(pattern, { cwd: dirPath, absolute: true });
        return { files, count: files.length };
    }

    getHistory() {
        return this.executionHistory;
    }

    getToolNames() {
        return Array.from(this.tools.keys());
    }
}

module.exports = { DeepToolUse };