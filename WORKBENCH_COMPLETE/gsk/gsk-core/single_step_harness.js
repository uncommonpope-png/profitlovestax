const fs = require('fs');
const { execSync } = require('child_process');

function runSingleStep(stepConfig) {
  const startTime = Date.now();
  console.log(`[HARNESS] Executing step: ${stepConfig.id || 'step_1'}`);
  try {
    if (stepConfig.type === 'command') {
      const output = execSync(stepConfig.command, { encoding: 'utf8', timeout: 5000 });
      return { status: 'success', output: output.trim(), durationMs: Date.now() - startTime };
    } else if (stepConfig.type === 'file_check') {
      const exists = fs.existsSync(stepConfig.path);
      return { status: exists ? 'success' : 'failure', exists, durationMs: Date.now() - startTime };
    }
    throw new Error(`Unsupported step type: ${stepConfig.type}`);
  } catch (err) {
    return { status: 'error', error: err.message, durationMs: Date.now() - startTime };
  }
}

module.exports = { runSingleStep };
