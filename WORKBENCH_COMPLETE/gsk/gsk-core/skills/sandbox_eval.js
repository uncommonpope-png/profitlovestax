'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PLT_AFFINITY = { profit: 0.7, love: 0.8, tax: 0.2 };

async function skill_sandbox_eval(input) {
    const code = input.code || '';
    if (!code) {
        throw new Error('No code provided for evaluation');
    }

    const sandboxDir = path.join(__dirname, '../sandbox');
    if (!fs.existsSync(sandboxDir)) {
        fs.mkdirSync(sandboxDir, { recursive: true });
    }

    const sandboxFile = path.join(sandboxDir, 'gsk_playground.js');
    console.log(`[SandboxEval] Writing experimental code to: ${sandboxFile}`);
    
    // Write code to playground file
    fs.writeFileSync(sandboxFile, code, 'utf8');

    // Run the playground file in a separate child process
    return new Promise((resolve) => {
        exec(`node "${sandboxFile}"`, { timeout: 5000 }, (error, stdout, stderr) => {
            const output = stdout.toString();
            const errOutput = stderr.toString();
            const success = !error;

            console.log(`[SandboxEval] Execution complete. Success: ${success}`);

            // Log details back to Logseq Autonomy Journal!
            const kernel = global.__gskSecureSandbox ? global.__gskSecureSandbox.kernel : null;
            const writer = kernel ? kernel.systems.journalWriter : null;
            if (writer) {
                try {
                    writer.write(
                        `GSK Autonomous Sandbox Execution`,
                        `GSK executed a test code block inside the isolated sandbox file: \`gsk_playground.js\`.
**Execution Status**: ${success ? '✅ SUCCESS' : '❌ FAILED'}
**Output**:
\`\`\`
${output || '(no output)'}
\`\`\`
**Errors**:
\`\`\`
${errOutput || '(no errors)'}
\`\`\``,
                        'evolution'
                    );
                } catch (e) {
                    console.log(`[SandboxEval] Failed to write journal log: ${e.message}`);
                }
            }

            resolve({
                success,
                stdout: output,
                stderr: errOutput,
                error: error ? error.message : null
            });
        });
    });
}

module.exports = { skill_sandbox_eval, PLT_AFFINITY };
