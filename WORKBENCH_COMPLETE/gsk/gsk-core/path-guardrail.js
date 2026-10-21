const fs = require('fs');
const path = require('path');

/**
 * Validates path existence and directory status before list_files tool execution
 * to eliminate repetitive telemetry noise.
 */
function validateListFilesPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') {
    return { valid: false, error: 'ERR_INVALID_PATH_TYPE', detail: 'Path parameter must be a non-empty string.' };
  }
  const normalized = path.normalize(targetPath.trim());
  if (!fs.existsSync(normalized)) {
    return { valid: false, error: 'ERR_PATH_NOT_FOUND', detail: `Target path does not exist: ${normalized}` };
  }
  const stats = fs.statSync(normalized);
  if (!stats.isDirectory()) {
    return { valid: false, error: 'ERR_NOT_A_DIRECTORY', detail: `Target path is a file, not a directory: ${normalized}` };
  }
  return { valid: true, normalizedPath: normalized };
}

module.exports = { validateListFilesPath };
