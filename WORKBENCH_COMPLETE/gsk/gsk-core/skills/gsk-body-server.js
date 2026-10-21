module.exports.MANIFEST = {
    name: 'gsk-body-server',
    description: 'Skill: gsk-body-server',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
const http = require('http');
const { execFile, spawn } = require('child_process');
const path = require('path');

const PORT = process.env.GSK_BODY_PORT || 61004; // Allow configuration to prevent EADDRINUSE conflicts
const PID = process.pid;

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST' && req.url === '/task') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { task, command } = JSON.parse(body);
        console.log(`[BODY:${PID}] Received task: ${task || command}`);

        if (command) {
          const result = await runCommand(command);
          res.end(JSON.stringify({ success: true, pid: PID, childPid: result.childPid, output: result.output, error: result.error }));
        } else if (task) {
          const result = await runCline(task);
          res.end(JSON.stringify({ success: true, pid: PID, childPid: result.childPid, output: result.output, error: result.error }));
        } else {
          res.end(JSON.stringify({ success: false, error: 'No task or command provided' }));
        }
      } catch (e) {
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/status') {
    res.end(JSON.stringify({ alive: true, pid: PID, port: PORT, uptime: process.uptime() }));
  } else if (req.method === 'GET' && req.url === '/processes') {
    execFile('powershell.exe', ['-Command', 'Get-Process | Where-Object { $_.Id -eq ' + PID + ' -or $_.Parent.Id -eq ' + PID + ' } | Format-Table Id, ProcessName, @{N="ParentPid";E={$_.Parent.Id}} -AutoSize | Out-String'], { timeout: 5000 }, (err, stdout) => {
      res.end(JSON.stringify({ pid: PID, tree: stdout || err?.message || '' }));
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  }
});

function runCommand(command) {
  return new Promise((resolve) => {
    const child = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { timeout: 30000 }, (error, stdout, stderr) => {
      resolve({
        childPid: child.pid || 0,
        output: (stdout || '').trim(),
        error: error ? (stderr || error.message).trim() : ''
      });
    });
    console.log(`[BODY:${PID}] Spawned powershell child PID: ${child.pid}`);
  });
}

function runCline(task) {
  return new Promise((resolve) => {
    const clineBin = 'C:\\Users\\uncom\\AppData\\Roaming\\npm\\node_modules\\cline\\bin\\cline';
    const child = spawn('node', [clineBin, task], { timeout: 120000, shell: false });
    let stdout = '', stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', (code) => {
      resolve({
        childPid: child.pid || 0,
        output: stdout.trim(),
        error: stderr.trim() || (code !== 0 ? `Exit code: ${code}` : '')
      });
    });
    child.on('error', (e) => {
      resolve({ childPid: 0, output: '', error: e.message });
    });
    console.log(`[BODY:${PID}] Spawned Cline child PID: ${child.pid}`);
  });
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`[BODY] Port ${PORT} in use — body server disabled (non-fatal)`);
  } else {
    console.log(`[BODY] Server error: ${e.message} (non-fatal)`);
  }
});
server.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    GSK BODY SERVER — Hand-to-Hand Active ║');
  console.log(`║    PID: ${PID}                              ║`);
  console.log(`║    Port: ${PORT}                            ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log(`[BODY] Listening at http://localhost:${PORT}`);
  console.log(`[BODY] POST /task - execute a task`);
  console.log(`[BODY] POST /task with "command" key - run powershell command`);
  console.log(`[BODY] GET  /status - health check`);
});

process.on('SIGINT', () => { console.log('[BODY] Shutting down'); process.exit(0); });

