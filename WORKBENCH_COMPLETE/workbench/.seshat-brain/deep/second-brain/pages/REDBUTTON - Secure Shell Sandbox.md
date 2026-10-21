# REDBUTTON — Secure Shell Sandbox (Dark City Protocol)

## Date
2026-07-05

## Purpose
Prevent "loss of mind" from rogue `ACTION: shell` commands by routing all shell execution through a risk-classified sandbox with Architect approval.

## Implementation

### New Module: `gsk-core/security/secure_sandbox.js`
- **SecureShellSandbox** class that intercepts all shell commands
- **Risk Classification** — 5 levels:
  - `safe` — read-only (ls, dir, cat, git status, npm list)
  - `low` — reads with minor risk (git clone, curl, npm view)
  - `medium` — writes within project (touch, mkdir, npm install, git add)
  - `high` — destructive (rm, del, kill, chmod, git reset)
  - `critical` — system-level (format, shutdown, sudo, reg delete)
- **Architect Approval** — high/critical commands require explicit approval callback
- **Policy Enforcement** — integrates with existing `axiomEnforcer`
- **Audit Logging** — all executions logged to memory/scribe
- **Pending Approval Queue** — commands can be approved/denied via `approveRequest()` / `denyRequest()`

### Modified: `gsk/gsk-core/tools/universal_tool_bridge.js`
- `_runCommand()` now routes through SecureShellSandbox when available
- New tools registered:
  - `run_safe_command` — explicit sandbox execution from agents
  - `sandbox_approvals` — check pending approvals
  - `sandbox_stats` — get sandbox usage statistics

### Modified: `gsk/gsk-core/skills/shell_exec.js`
- Now routes through SecureShellSandbox (auto-approves safe/low/medium/high, blocks critical)

### Modified: `gsk/fusion-loader.js`
- SecureShellSandbox instantiated with Architect callback (logs pending, requires manual approval)
- Added to `this.systems.secureSandbox` and `this.anatomy.homeostatic`

## Risk Classification Patterns

| Level | Example Commands |
|-------|-----------------|
| safe | ls, dir, cat, type, echo, git status, npm list |
| low | git clone, curl, wget, npm view |
| medium | touch, mkdir, cp, npm install, git add, git commit |
| high | rm, rmdir, del, kill, chmod, git reset, npm uninstall |
| critical | format, shutdown, sudo, reg delete, del /s, rm -rf / |

## Usage

```js
// From an agent or tool:
const result = await fusion.secureSandbox.execute('rm -rf ./temp', { timeout: 30000 });
// If risk level is 'high' or 'critical', result.error will indicate pending approval

// Check pending approvals:
const pending = fusion.secureSandbox.getPendingApprovals();

// Approve a pending command:
fusion.secureSandbox.approveRequest('approval_123456_abc');

// Get stats:
fusion.secureSandbox.getStats();
```

## Next Steps
- Integrate with Sanctum/Soulverse simulation — run dangerous commands in simulation first before real execution
- Add `dark-city-controller` behavior integration — map shell commands to Soulverse entity actions
- Wire Architect callback to actually dispatch a sub-agent for interactive approval
