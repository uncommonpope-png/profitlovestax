'use strict';

const { exec } = require('child_process');

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

function skill_git_ops(input) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const action = input.action || 'status';
        const repoPath = input.path || '.';

        let command;
        switch (action) {
            case 'status': command = `git -C "${repoPath}" status`; break;
            case 'diff': command = `git -C "${repoPath}" diff`; break;
            case 'log': command = `git -C "${repoPath}" log --oneline -n 10`; break;
            case 'branch': command = `git -C "${repoPath}" branch -a`; break;
            default: command = `git -C "${repoPath}" ${action}`;
        }

        exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
            resolve({ skill: 'git_ops', plt_affinity: PLT_AFFINITY, action, status: error && !stdout ? 'error' : 'success', output: stdout.trim(), error: stderr.trim(), duration_ms: Date.now() - startTime, timestamp: Date.now() });
        });
    });
}

module.exports = { skill_git_ops };