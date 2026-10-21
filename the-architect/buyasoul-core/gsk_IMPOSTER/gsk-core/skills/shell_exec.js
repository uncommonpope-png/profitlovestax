'use strict';

const { exec } = require('child_process');

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

function skill_shell_exec(input) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const command = typeof input === 'string' ? input : (input.command || '');
        const timeout = input.timeout || 60000;

        if (!command.trim()) return reject(new Error('No command provided'));

        exec(command, { timeout }, (error, stdout, stderr) => {
            resolve({ skill: 'shell_exec', plt_affinity: PLT_AFFINITY, status: error ? 'partial' : 'success', exit_code: error?.code || 0, stdout: stdout.trim(), stderr: stderr.trim(), duration_ms: Date.now() - startTime, timestamp: Date.now() });
        });
    });
}

module.exports = { skill_shell_exec };