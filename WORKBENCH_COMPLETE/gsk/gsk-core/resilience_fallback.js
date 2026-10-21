/**
 * Automated retry mechanism and fallback handlers for web_fetch and list_files.
 */
const fs = require('fs');
const path = require('path');

async function executeWithRetry(operationFn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 500;
  const fallback = options.fallback || null;
  
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operationFn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const backoff = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, backoff));
      }
    }
  }
  
  if (typeof fallback === 'function') {
    return await fallback(lastError);
  }
  throw lastError;
}

module.exports = { executeWithRetry };
