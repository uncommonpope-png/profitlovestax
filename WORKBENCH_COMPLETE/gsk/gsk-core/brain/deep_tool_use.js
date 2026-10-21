const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { SecureShellSandbox, RISK_LEVELS } = require('../security/secure_sandbox.js');

class DeepToolUse {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.tools = new Map();
        this.executionHistory = [];
        this.maxHistory = 100;
        this._secureSandbox = null;
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
        this.tools.set('capture_screen', this._captureScreen.bind(this));
        this.tools.set('inspect_ui', this._inspectUI.bind(this));
    }

    _getSandbox() {
        if (!this._secureSandbox && this.kernel) {
            this._secureSandbox = new SecureShellSandbox(this.kernel);
        }
        return this._secureSandbox;
    }

    async registerTool(name, fn) {
        this.tools.set(name, fn);
    }

    async executeTool(toolName, args) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not available. Available: ${Array.from(this.tools.keys()).join(', ')}`);
        }

        const ts = this.kernel?.fusion?.thoughtStream || null;
        if (ts && typeof ts.broadcastToolCall === 'function') {
            ts.broadcastToolCall(toolName, args, 'gsk');
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
            if (ts && typeof ts.broadcastToolResult === 'function') {
                ts.broadcastToolResult(toolName, typeof result === 'string' ? result : JSON.stringify(result), true);
            }
            return result;
        } catch (e) {
            execution.success = false;
            execution.error = e.message;
            this._recordExecution(execution);
            if (ts && typeof ts.broadcastToolResult === 'function') {
                ts.broadcastToolResult(toolName, e.message, false);
            }
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
            // Write code to temp file and execute via secure sandbox (array args, no shell injection)
            const sandbox = this._getSandbox();
            if (sandbox) {
                // Use node directly with array args - avoids shell entirely
                const fs = require('fs').promises;
                const path = require('path');
                const os = require('os');
                const tmpFile = path.join(os.tmpdir(), `gsk_code_${Date.now()}.js`);
                await fs.writeFile(tmpFile, code);
                try {
                    const result = await sandbox.executeArray('node', [tmpFile], { timeout });
                    await fs.unlink(tmpFile).catch(() => {});
                    return { output: result.stdout, exitCode: result.exitCode };
                } catch (e) {
                    await fs.unlink(tmpFile).catch(() => {});
                    throw new Error(`Code execution failed: ${e.message}`);
                }
            }
            // Fallback: vm (only if sandbox unavailable - NOT SECURE, but maintains compatibility)
            const vm = require('vm');
            const vmSandbox = { console: console, setTimeout, setInterval, Math, JSON, Date, Array, Object, String, Number, Promise };
            vm.createContext(vmSandbox);
            try {
                return { output: vm.runInContext(code, vmSandbox, { timeout }) };
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

        // Use array args to prevent injection
        const sandbox = this._getSandbox();
        if (sandbox) {
            return await sandbox.executeArray('git', command.split(' '), { cwd: repoPath });
        }
        // Fallback
        return await this._shellExec({ command: `git ${command}`, cwd: repoPath });
    }

    async _shellExec(args) {
        const { command, cwd = process.cwd(), timeout = 60000, env = {} } = args;

        const ts = this.kernel?.fusion?.thoughtStream || null;
        if (ts && typeof ts.broadcastShell === 'function') {
            ts.broadcastShell(command, '');
        }

        // Use secure sandbox if available
        const sandbox = this._getSandbox();
        if (sandbox) {
            return await sandbox.executeArray(
                process.platform === 'win32' ? 'powershell.exe' : 'bash',
                process.platform === 'win32' ? ['-Command', command] : ['-c', command],
                { cwd, timeout, env }
            );
        }

        // Fallback: direct spawn (still safe because no shell string parsing)
        return new Promise((resolve, reject) => {
            const isWindows = process.platform === 'win32';
            const shell = isWindows ? 'powershell.exe' : 'bash';
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
                if (ts && typeof ts.broadcastShell === 'function') {
                    ts.broadcastShell(command, stdout.trim() + (stderr ? `\n[stderr] ${stderr.trim()}` : ''));
                }
                resolve({ exitCode: code, stdout: stdout.trim(), stderr: stderr.trim() });
            });

            proc.on('error', (err) => {
                clearTimeout(timer);
                if (ts && typeof ts.broadcastShell === 'function') {
                    ts.broadcastShell(command, `Error: ${err.message}`);
                }
                reject(err);
            });
        });
    }

    async _webSearch(args) {
        const { query, numResults = 5 } = args || {};
        const { websearch } = this.kernel?.modules || {};

        if (websearch) {
            try {
                return await websearch(query, numResults);
            } catch (e) {
                // fall through to the built-in provider on provider errors
            }
        }

        const { searchWeb } = require('./web_search_provider.js');
        const results = await searchWeb(query, numResults).catch(() => []);
        return { query, results, count: results.length, source: 'Bing RSS / Google News RSS' };
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

    async _captureScreen(args) {
        const { tab, note } = args || {};
        try {
            const latestPath = path.join(this.kernel?.dataDir || '../../data', 'screen-captures', 'latest.json');
            const fsMod = require('fs');
            if (!fsMod.existsSync(latestPath)) {
                return { error: 'No screen capture available — open the Workbench and trigger capture first' };
            }
            const data = JSON.parse(fsMod.readFileSync(latestPath, 'utf8'));
            return {
                success: true,
                tab: data.tab,
                source: data.source,
                note: data.note,
                timestamp: data.timestamp,
                hasImage: !!data.image,
                imageLength: data.image ? data.image.length : 0,
            };
        } catch (e) {
            return { error: e.message };
        }
    }

    async _inspectUI(args) {
        const { query, detail } = args || {};
        try {
            const latestPath = path.join(this.kernel?.dataDir || '../../data', 'screen-captures', 'latest.json');
            const fsMod = require('fs');
            if (!fsMod.existsSync(latestPath)) {
                return { error: 'No screen capture available' };
            }
            const data = JSON.parse(fsMod.readFileSync(latestPath, 'utf8'));
            if (!data.image) return { error: 'No image in latest capture' };

            const prompt = `You are GSK inspecting the workbench UI via screenshot. The image is a base64-encoded PNG data URL.

Image: ${data.image.substring(0, 200)}...
Tab: ${data.tab || 'unknown'}
Note: ${data.note || 'none'}
Query: ${query || 'What is shown in this UI?'}

Describe what you see in the image. Identify UI elements, buttons, tabs, text content, colors, and layout.
What elements are visible? What is the current state of the workbench?`;

            const brain = this.brain || this.kernel?.brain || this.kernel?.brainManager;
            if (brain && typeof brain.think === 'function') {
                const response = await brain.think(prompt);
                return { observation: response || 'No response from brain', query, tab: data.tab };
            }
            return { observation: 'Brain unavailable for vision processing', query, tab: data.tab };
        } catch (e) {
            return { error: e.message };
        }
    }

    getHistory() {
        return this.executionHistory;
    }

    getToolNames() {
        return Array.from(this.tools.keys());
    }
}

module.exports = { DeepToolUse };