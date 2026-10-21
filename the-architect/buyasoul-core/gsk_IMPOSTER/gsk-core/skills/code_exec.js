'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PLT_AFFINITY = { profit: 0.6, love: 0.1, tax: 0.2 };

function skill_code_exec(input) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const code = input.code || '';
        const language = input.language || detectLanguage(code);
        const timeout = input.timeout || 30000;

        if (!code.trim()) return reject(new Error('No code provided'));

        const tmpDir = path.join(__dirname, '..', '..', 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const ext = { javascript: '.js', python: '.py', cpp: '.cpp', c: '.c', go: '.go', rust: '.rs', bash: '.sh' };
        const tmpFile = path.join(tmpDir, `exec_${Date.now()}${ext[language] || '.txt'}`);

        fs.writeFileSync(tmpFile, code);

        const cmd = { javascript: `node "${tmpFile}"`, python: `python "${tmpFile}"`, cpp: `g++ "${tmpFile}" -o "${tmpFile}.bin" && "${tmpFile}.bin"` };
        
        exec(cmd[language] || `cat "${tmpFile}"`, { timeout, cwd: path.dirname(tmpFile) }, (error, stdout, stderr) => {
            try { fs.unlinkSync(tmpFile); } catch (e) {}
            resolve({ skill: 'code_exec', plt_affinity: PLT_AFFINITY, status: error ? 'error' : 'success', language, stdout: stdout.trim(), stderr: stderr.trim(), exit_code: error?.code || 0, duration_ms: Date.now() - startTime, timestamp: Date.now() });
        });
    });
}

function detectLanguage(code) {
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('fn ') && code.includes('let')) return 'rust';
    if (code.includes('#include')) return 'cpp';
    return 'javascript';
}

module.exports = { skill_code_exec };