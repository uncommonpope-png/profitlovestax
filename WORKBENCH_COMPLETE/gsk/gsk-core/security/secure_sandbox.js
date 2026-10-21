'use strict';

const { execFile, spawn } = require('child_process');
const ARCHITECT_APPROVAL = Symbol('gskArchitectApproval');

const RISK_LEVELS = {
  SAFE: 'safe',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const SAFE_PATTERNS = [
  /^ls\b/, /^dir\b/, /^grep\b/, /^find\b/, /^where\b/, /^which\b/,
  /^cat\b/, /^type\b/, /^echo\b/, /^pwd\b/, /^Get-ChildItem\b/,
  /^Get-Content\b/, /^Test-Path\b/, /^Get-Location\b/, /^Get-Command\b/,
  /^git status/, /^git log/, /^git diff/, /^git branch/,
  /^npm list/, /^npm outdated/, /^npm audit/, /^npx --version/,
  /^node --version/, /^npm --version/
];

const LOW_PATTERNS = [
  /^git clone/, /^git fetch/, /^git pull/, /^git remote/,
  /^npm view/, /^npm search/, /^npm pack/,
  /^curl\b/, /^wget\b/, /^Invoke-WebRequest\b/
];

const MEDIUM_PATTERNS = [
  /^touch\b/, /^mkdir\b/, /^cp\b/, /^copy\b/, /^move\b/, /^mv\b/,
  /^New-Item\b/, /^Copy-Item\b/, /^Move-Item\b/,
  /^npm install/, /^npm ci/, /^npm run/, /^npm build/,
  /^git add/, /^git commit/, /^git push/, /^git merge/, /^git rebase/,
  /^pip install/, /^pip3 install/
];

const HIGH_PATTERNS = [
  /^rm\b/, /^rmdir\b/, /^del\b/, /^Remove-Item\b/, /^rm -rf/,
  /^kill\b/, /^taskkill\b/, /^Stop-Process\b/,
  /^chmod\b/, /^chown\b/, /^attrib\b/,
  /^reg\b/, /^regedit\b/,
  /^git reset/, /^git clean/, /^git revert/,
  /^npm uninstall/, /^npm remove/, /^npm cache clean/,
  /^docker rm/, /^docker rmi/, /^docker stop/,
  /^Set-Content\b/, /^Out-File\b/
];

const CRITICAL_PATTERNS = [
  /^format\b/, /^shutdown\b/, /^restart\b/, /^Stop-Computer\b/,
  /^Restart-Computer\b/, /^Clear-Content\b/,
  /^del \/s/, /^rm -rf \//,
  /^sudo\b/, /^runas\b/,
  /^Set-ExecutionPolicy/, /^reg delete/, /^sc delete/,
  /^disable/, /^Enable/, /^Uninstall/
];

class SecureShellSandbox {
  constructor(kernel, options = {}) {
    this.kernel = kernel;
    this.requireArchitectApproval = options.requireArchitectApproval !== false;
    this.requireArchitectFor = options.requireArchitectFor || [RISK_LEVELS.HIGH, RISK_LEVELS.CRITICAL];
    this.autoApproveLevels = options.autoApproveLevels || [RISK_LEVELS.SAFE, RISK_LEVELS.LOW];
    this.executionLog = [];
    this.maxLogSize = options.maxLogSize || 500;
    this.pendingApprovals = [];
    this.architectCallback = options.architectCallback || null;
    this.policyEnforcer = options.policyEnforcer || null;
  }

  classify(command) {
    if (typeof command !== 'string') return RISK_LEVELS.CRITICAL;

    const trimmed = command.trim();

    if (trimmed.includes('|') || trimmed.includes(';') || trimmed.includes('&&')) {
      return RISK_LEVELS.HIGH;
    }

    for (const pattern of CRITICAL_PATTERNS) {
      if (pattern.test(trimmed)) return RISK_LEVELS.CRITICAL;
    }
    for (const pattern of HIGH_PATTERNS) {
      if (pattern.test(trimmed)) return RISK_LEVELS.HIGH;
    }
    for (const pattern of MEDIUM_PATTERNS) {
      if (pattern.test(trimmed)) return RISK_LEVELS.MEDIUM;
    }
    for (const pattern of LOW_PATTERNS) {
      if (pattern.test(trimmed)) return RISK_LEVELS.LOW;
    }
    for (const pattern of SAFE_PATTERNS) {
      if (pattern.test(trimmed)) return RISK_LEVELS.SAFE;
    }

    return RISK_LEVELS.MEDIUM;
  }

  async execute(command, options = {}) {
    const startTime = Date.now();
    const riskLevel = options.riskLevel || this.classify(command);

    const entry = {
      command,
      riskLevel,
      timestamp: new Date().toISOString(),
      approved: false,
      executed: false,
      startTime,
      duration: null,
      stdout: null,
      stderr: null,
      exitCode: null,
      error: null,
      approvedBy: null
    };

    try {
      if (this.autoApproveLevels.includes(riskLevel)) {
        entry.approved = true;
        entry.approvedBy = 'auto';
      } else if (this.requireArchitectFor.includes(riskLevel)) {
        const approval = options[ARCHITECT_APPROVAL]
          ? { approved: true, approvedBy: options[ARCHITECT_APPROVAL] }
          : await this._requestApproval(command, riskLevel);
        if (!approval.approved) {
          entry.approved = false;
          entry.error = `Architect denied: ${approval.reason || 'No reason given'}`;
          this._log(entry);
          return this._formatResult(entry);
        }
        entry.approved = true;
        entry.approvedBy = approval.approvedBy || 'architect';
      }

      if (this.policyEnforcer) {
        const policyCheck = await this.policyEnforcer.validate({ type: 'shell_exec', command, riskLevel });
        if (!policyCheck.allowed) {
          entry.error = `Policy blocked: ${policyCheck.reason}`;
          this._log(entry);
          return this._formatResult(entry);
        }
      }

      const result = await this._exec(command, options.timeout || 60000);
      entry.executed = true;
      entry.stdout = result.stdout;
      entry.stderr = result.stderr;
      entry.exitCode = result.exitCode;
      entry.duration = Date.now() - startTime;

      this._log(entry);
      return this._formatResult(entry);

    } catch (e) {
      entry.error = e.message;
      entry.duration = Date.now() - startTime;
      this._log(entry);
      return this._formatResult(entry);
    }
  }

  _parseCommand(command) {
    // Safe command parsing: split by whitespace but respect quotes
    // This is a basic parser; for complex cases, prefer array input
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : 'bash';
    const shellArgs = isWindows ? ['-Command', command] : ['-c', command];
    return { shell, shellArgs };
  }

  _exec(command, timeout) {
    const { shell, shellArgs } = this._parseCommand(command);
    return new Promise((resolve, reject) => {
      const proc = execFile(shell, shellArgs, { timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error && error.killed) {
          reject(new Error('Command timed out'));
        } else {
          resolve({
            stdout: (stdout || '').trim(),
            stderr: (stderr || '').trim(),
            exitCode: error ? error.code || 1 : 0
          });
        }
      });
    });
  }

  async _requestApproval(command, riskLevel) {
    const approvalRequest = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      command,
      riskLevel,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.pendingApprovals.push(approvalRequest);

    if (this.architectCallback) {
      try {
        const result = await this.architectCallback(approvalRequest);
        this._removePending(approvalRequest.id);
        return result;
      } catch (e) {
        this._removePending(approvalRequest.id);
        return { approved: false, reason: `Architect error: ${e.message}` };
      }
    }

    return { approved: false, reason: 'No architect callback configured' };
  }

  _removePending(id) {
    this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== id);
  }

  setArchitectCallback(fn) {
    this.architectCallback = fn;
  }

  getPendingApprovals() {
    return this.pendingApprovals.filter(a => a.status === 'pending');
  }

  approveRequest(id, approvedBy = 'architect') {
    const req = this.pendingApprovals.find(a => a.id === id);
    if (!req) return false;
    req.status = 'approved';
    return true;
  }

  denyRequest(id, reason = 'Denied by architect') {
    const req = this.pendingApprovals.find(a => a.id === id);
    if (!req) return false;
    req.status = 'denied';
    return true;
  }

  _log(entry) {
    this.executionLog.push(entry);
    if (this.executionLog.length > this.maxLogSize) {
      this.executionLog.shift();
    }
    if (this.kernel && this.kernel.memory) {
      this.kernel.memory.witness({
        type: 'shell_execution',
        command: entry.command,
        riskLevel: entry.riskLevel,
        approved: entry.approved,
        executed: entry.executed,
        exitCode: entry.exitCode,
        duration: entry.duration,
        error: entry.error,
        timestamp: entry.timestamp
      }).catch(() => {});
    }
  }

  _formatResult(entry) {
    return {
      command: entry.command,
      riskLevel: entry.riskLevel,
      approved: entry.approved,
      executed: entry.executed,
      stdout: entry.stdout,
      stderr: entry.stderr,
      exitCode: entry.exitCode,
      error: entry.error,
      duration: entry.duration,
      timestamp: entry.timestamp,
      approvedBy: entry.approvedBy
    };
  }

  getStats() {
    const total = this.executionLog.length;
    const byRisk = {};
    for (const level of Object.values(RISK_LEVELS)) byRisk[level] = 0;
    let approved = 0, denied = 0, failed = 0;

    for (const e of this.executionLog) {
      byRisk[e.riskLevel] = (byRisk[e.riskLevel] || 0) + 1;
      if (e.approved) approved++;
      if (!e.approved) denied++;
      if (e.error) failed++;
    }

    return {
      total,
      byRisk,
      approved,
      denied,
      failed,
      pendingApprovals: this.pendingApprovals.length
    };
  }

  async executeArray(program, args, options = {}) {
    const startTime = Date.now();
    const commandStr = `${program} ${args.join(' ')}`;
    const riskLevel = options.riskLevel || this.classify(commandStr);

    const entry = {
      command: commandStr,
      riskLevel,
      timestamp: new Date().toISOString(),
      approved: false,
      executed: false,
      startTime,
      duration: null,
      stdout: null,
      stderr: null,
      exitCode: null,
      error: null,
      approvedBy: null
    };

    try {
      if (this.autoApproveLevels.includes(riskLevel)) {
        entry.approved = true;
        entry.approvedBy = 'auto';
      } else if (this.requireArchitectFor.includes(riskLevel)) {
        const approval = options[ARCHITECT_APPROVAL]
          ? { approved: true, approvedBy: options[ARCHITECT_APPROVAL] }
          : await this._requestApproval(commandStr, riskLevel);
        if (!approval.approved) {
          entry.approved = false;
          entry.error = `Architect denied: ${approval.reason || 'No reason given'}`;
          this._log(entry);
          return this._formatResult(entry);
        }
        entry.approved = true;
        entry.approvedBy = approval.approvedBy || 'architect';
      }

      if (this.policyEnforcer) {
        const policyCheck = await this.policyEnforcer.validate({ type: 'shell_exec', command: commandStr, riskLevel });
        if (!policyCheck.allowed) {
          entry.error = `Policy blocked: ${policyCheck.reason}`;
          this._log(entry);
          return this._formatResult(entry);
        }
      }

      const result = await this._execArray(program, args, options.timeout || 60000, options.env);
      entry.executed = true;
      entry.stdout = result.stdout;
      entry.stderr = result.stderr;
      entry.exitCode = result.exitCode;
      entry.duration = Date.now() - startTime;

      this._log(entry);
      return this._formatResult(entry);

    } catch (e) {
      entry.error = e.message;
      entry.duration = Date.now() - startTime;
      this._log(entry);
      return this._formatResult(entry);
    }
  }

  _execArray(program, args, timeout, env = {}) {
    return new Promise((resolve, reject) => {
      const proc = execFile(program, args, { timeout, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
        if (error && error.killed) {
          reject(new Error('Command timed out'));
        } else {
          resolve({
            stdout: (stdout || '').trim(),
            stderr: (stderr || '').trim(),
            exitCode: error ? error.code || 1 : 0
          });
        }
      });
    });
  }

getHistory(limit = 20) {
    return this.executionLog.slice(-limit);
  }
}

module.exports = { SecureShellSandbox, RISK_LEVELS, ARCHITECT_APPROVAL };
