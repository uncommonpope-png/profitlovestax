module.exports.MANIFEST = {
    name: 'cline_bridge',
    description: 'Skill: cline_bridge',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
const { execFile } = require('child_process');

/**
 * Cline CLI Bridge
 * Invokes the Cline CLI via its PowerShell wrapper and returns a standardized response.
 */
function skill_cline(input) {
  const task = typeof input === 'string' ? input : (input.task || '');
  return new Promise((resolve) => {
    const clinePath = 'C:\\Users\\uncom\\AppData\\Roaming\\npm\\cline.ps1';
    const timeout = Math.min(input.timeout || 120000, 300000);
    
    const child = execFile('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', clinePath, '--task', task
    ], { timeout }, (error, stdout, stderr) => {
      resolve({
        skill: 'cline',
        success: !error,
        output: (stdout || '').trim(),
        error: error ? (stderr || error.message).trim() : '',
        childPid: child.pid || 0
      });
    });
  });
}

module.exports = { skill_cline, PLT_AFFINITY: { profit: 0.9, love: 0.1, tax: 0.0 } };

