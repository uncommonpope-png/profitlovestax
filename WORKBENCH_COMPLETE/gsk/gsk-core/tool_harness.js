const fs = require('fs');
const { execSync } = require('child_process');

class ToolHarness {
  static verifyExecution(action, fn) {
    try {
      const result = fn();
      return { status: 'success', action, result };
    } catch (err) {
      return { status: 'failed', action, error: err.message };
    }
  }
}
module.exports = ToolHarness;
