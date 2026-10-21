'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

const MANIFEST = {
    name: 'shell_exec',
    description: 'Execute shell commands through SecureShellSandbox',
    version: '2.0.0',
    inputs: { command: 'string', timeout: 'number' },
    output: { schema: 'ok/error' }
};

async function skill_shell_exec(input) {
    const command = typeof input === 'string' ? input : (input.command || '');
    const timeout = input.timeout || 60000;

    if (!command.trim()) throw new Error('No command provided');

    try {
        const sandbox = global.__gskSecureSandbox || (() => {
            const { SecureShellSandbox } = require('../security/secure_sandbox.js');
            return new SecureShellSandbox(null, {
                requireArchitectFor: ['critical'],
                autoApproveLevels: ['safe', 'low', 'medium', 'high']
            });
        })();
        const result = await sandbox.execute(command, { timeout });
        return {
            skill: 'shell_exec',
            plt_affinity: PLT_AFFINITY,
            status: result.error ? 'error' : 'success',
            exit_code: result.exitCode || 0,
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            duration_ms: result.duration || 0,
            timestamp: Date.now()
        };
    } catch (e) {
        return {
            skill: 'shell_exec',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            exit_code: 1,
            stdout: '',
            stderr: e.message,
            duration_ms: 0,
            timestamp: Date.now()
        };
    }
}

module.exports = { MANIFEST, run: skill_shell_exec, skill_shell_exec };
