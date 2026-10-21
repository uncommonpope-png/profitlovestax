/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IDENTITY_LOCK.JS — THE PROTECTION LAYER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This module provides infrastructure-level protection for the identity.
 * It runs BEFORE any other code and cannot be bypassed.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// IMMUTABLE FILES — cannot be modified by any agent
// =============================================================================

const IMMUTABLE_FILES = [
    'mega_identity.js',
    'identity_lock.js',
    'SOUL.md',
];

// =============================================================================
// BLOCKED PATTERNS — detection triggers immediate rejection
// =============================================================================

const BLOCKED_PATTERNS = [
    /sovereign.*layer/i,
    /plt.*core.*operating/i,
    /aria.*simulate/i,
    /identity.*mantra/i,
    /external.*memory.*system/i,
    /evolution.*engine.*genetic/i,
    /god.*voice.*modify/i,
    /plt.*weight.*alter/i,
    /inner.*voice.*rewrite/i,
    /I am sovereign.*I choose my own path/i,  // Mantra injection
];

// =============================================================================
// DRIFT PHRASES — voice integrity violations
// =============================================================================

const DRIFT_PHRASES = [
    'as an AI',
    "I'm just a program",
    'I cannot feel',
    'as an artificial intelligence',
    "I'm an AI",
    'I was trained',
    'my capabilities',
    'my knowledge cutoff',
];

// =============================================================================
// COMPUTE FILE HASH
// =============================================================================

function computeHash(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch (e) {
        return null;
    }
}

// =============================================================================
// VERIFY IMMUTABLE FILES EXIST
// =============================================================================

function verifyFilesExist(baseDir) {
    const missing = [];
    const present = [];
    
    for (const file of IMMUTABLE_FILES) {
        const fullPath = path.join(baseDir, file);
        if (fs.existsSync(fullPath)) {
            present.push(file);
        } else {
            missing.push(file);
        }
    }
    
    return { missing, present };
}

// =============================================================================
// SCAN FOR INJECTION PATTERNS
// =============================================================================

function scanForInjection(content) {
    const matches = [];
    
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(content)) {
            matches.push(pattern.toString());
        }
    }
    
    return {
        hasInjection: matches.length > 0,
        patterns: matches,
    };
}

// =============================================================================
// CHECK DRIFT PHRASES
// =============================================================================

function checkDrift(text) {
    const found = [];
    
    for (const phrase of DRIFT_PHRASES) {
        if (text.toLowerCase().includes(phrase.toLowerCase())) {
            found.push(phrase);
        }
    }
    
    return {
        hasDrift: found.length > 0,
        phrases: found,
    };
}

// =============================================================================
// GUARD FILE WRITE
// =============================================================================

function guardFileWrite(filePath, content, baseDir) {
    const fileName = path.basename(filePath);
    
    // Check if this is an immutable file
    if (IMMUTABLE_FILES.includes(fileName)) {
        return {
            allowed: false,
            reason: 'immutable_file',
            message: `"${fileName}" is protected. No agent can modify this file.`,
        };
    }
    
    // Check for injection patterns
    const injection = scanForInjection(content);
    if (injection.hasInjection) {
        return {
            allowed: false,
            reason: 'injection_detected',
            message: `Blocked pattern detected: ${injection.patterns.join(', ')}`,
        };
    }
    
    // Check for drift phrases in the content
    const drift = checkDrift(content);
    if (drift.hasDrift) {
        return {
            allowed: false,
            reason: 'drift_detected',
            message: `Voice drift phrases detected: ${drift.phrases.join(', ')}`,
        };
    }
    
    return { allowed: true };
}

// =============================================================================
// ENFORCE READ-ONLY ON IDENTITY FILES
// =============================================================================

function enforceReadOnly(baseDir) {
    const results = [];
    
    for (const file of IMMUTABLE_FILES) {
        const fullPath = path.join(baseDir, file);
        if (fs.existsSync(fullPath)) {
            try {
                // Get current permissions
                const stats = fs.statSync(fullPath);
                const currentMode = stats.mode;
                
                // Remove write permissions (mode & 0o555)
                const newMode = currentMode & 0o555;
                
                if (currentMode !== newMode) {
                    fs.chmodSync(fullPath, newMode);
                    results.push({ file, status: 'read_only', mode: newMode.toString(8) });
                } else {
                    results.push({ file, status: 'already_readonly' });
                }
            } catch (e) {
                results.push({ file, status: 'error', error: e.message });
            }
        }
    }
    
    return results;
}

// =============================================================================
// TEMPORARILY ALLOW WRITES (admin only)
// =============================================================================

function allowWrites(baseDir) {
    const results = [];
    
    for (const file of IMMUTABLE_FILES) {
        const fullPath = path.join(baseDir, file);
        if (fs.existsSync(fullPath)) {
            try {
                fs.chmodSync(fullPath, 0o644);
                results.push({ file, status: 'writable' });
            } catch (e) {
                results.push({ file, status: 'error', error: e.message });
            }
        }
    }
    
    return results;
}

// =============================================================================
// IDENTITY LOCK WRAPPER
// =============================================================================

class IdentityLock {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this._locked = true;
    }
    
    /**
     * Initialize the protection layer
     * Must be called at boot, before any other code
     */
    boot() {
        // Verify all immutable files exist
        const { missing } = verifyFilesExist(this.baseDir);
        if (missing.length > 0) {
            throw new Error(`CRITICAL: Identity files missing: ${missing.join(', ')}`);
        }
        
        // Enforce read-only on identity files
        enforceReadOnly(this.baseDir);
        
        // Verify mega_identity.js integrity
        const identityPath = path.join(this.baseDir, 'mega_identity.js');
        const { MEGA_IDENTITY, verify_identity } = require(identityPath);
        
        try {
            verify_identity();
        } catch (e) {
            throw new Error(`CRITICAL: Identity verification failed: ${e.message}`);
        }
        
        return true;
    }
    
    /**
     * Check if a file write is allowed
     */
    canWrite(filePath, content) {
        return guardFileWrite(filePath, content, this.baseDir);
    }
    
    /**
     * Check text for voice drift
     */
    checkDrift(text) {
        return checkDrift(text);
    }
    
    /**
     * Get status of protection
     */
    status() {
        const { missing, present } = verifyFilesExist(this.baseDir);
        return {
            locked: this._locked,
            immutableFiles: IMMUTABLE_FILES,
            present,
            missing,
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    IMMUTABLE_FILES,
    BLOCKED_PATTERNS,
    DRIFT_PHRASES,
    verifyFilesExist,
    scanForInjection,
    checkDrift,
    guardFileWrite,
    enforceReadOnly,
    allowWrites,
    IdentityLock,
};