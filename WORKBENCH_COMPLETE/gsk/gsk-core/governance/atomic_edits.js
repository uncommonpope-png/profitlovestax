'use strict';

/**
 * AtomicEdits — Multi-file atomic edits with rollback (Kimi parity)
 *
 * All edits succeed or all rollback. Pre-flight validation, post-flight checks.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class AtomicEdits {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.backupDir = options.backupDir || path.join(__dirname, '../../data/atomic_backups');
        this.approvedToolExecutor = kernel.systems?.approvedToolExecutor || kernel.approvedToolExecutor;

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Execute multiple file edits atomically
     * edits = [{ filePath, content, operation: 'create'|'update'|'delete' }, ...]
     */
    async executeAtomic(edits, options = {}) {
        const { projectRoot, dryRun = false, runTests = true, runLint = true, format = true } = options;

        if (!edits || !edits.length) {
            throw new Error('No edits provided');
        }

        const editId = `atomic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const backupPath = path.join(this.backupDir, editId);

        console.log(`[AtomicEdits] Starting atomic edit ${editId} with ${edits.length} files`);

        // 1. PRE-FLIGHT: Validate all edits
        const validation = this._validateEdits(edits, projectRoot);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // 2. BACKUP: Save original state
        const backups = await this._backupFiles(edits, projectRoot, backupPath);

        try {
            // 3. DRY-RUN: If requested, just validate and return
            if (dryRun) {
                return { success: true, editId, dryRun: true, edits: validation.resolvedEdits };
            }

            // 4. EXECUTE: Apply all edits
            for (const edit of validation.resolvedEdits) {
                await this._applyEdit(edit, projectRoot);
            }

            // 5. POST-FLIGHT: Format, lint, test
            if (format) {
                await this._formatFiles(validation.resolvedEdits, projectRoot);
            }
            if (runLint) {
                const lintResult = await this._lintFiles(validation.resolvedEdits, projectRoot);
                if (!lintResult.passed) {
                    throw new Error(`Lint failed: ${lintResult.errors.join(', ')}`);
                }
            }
            if (runTests) {
                const testResult = await this._runTests(projectRoot);
                if (!testResult.passed) {
                    throw new Error(`Tests failed: ${testResult.output}`);
                }
            }

            // 6. SUCCESS: Clean up backup
            this._cleanupBackup(backupPath);

            console.log(`[AtomicEdits] ✓ Atomic edit ${editId} completed successfully`);
            return { success: true, editId, edits: validation.resolvedEdits.length };

        } catch (error) {
            // 7. ROLLBACK: Restore all files
            console.log(`[AtomicEdits] ✗ Atomic edit ${editId} failed, rolling back: ${error.message}`);
            await this._rollback(backups, projectRoot);
            this._cleanupBackup(backupPath);
            throw error;
        }
    }

    /**
     * Create a single atomic edit (convenience wrapper)
     */
    async editFile(filePath, content, projectRoot, options = {}) {
        return this.executeAtomic([{ filePath, content, operation: 'update' }], { projectRoot, ...options });
    }

    /**
     * Create new file atomically
     */
    async createFile(filePath, content, projectRoot, options = {}) {
        return this.executeAtomic([{ filePath, content, operation: 'create' }], { projectRoot, ...options });
    }

    /**
     * Delete file atomically
     */
    async deleteFile(filePath, projectRoot, options = {}) {
        return this.executeAtomic([{ filePath, operation: 'delete' }], { projectRoot, ...options });
    }

    // Private methods

    _validateEdits(edits, projectRoot) {
        const errors = [];
        const resolvedEdits = [];

        for (const edit of edits) {
            if (!edit.filePath) {
                errors.push('Missing filePath');
                continue;
            }

            const fullPath = path.join(projectRoot, edit.filePath);
            const operation = edit.operation || 'update';

            // Check file exists for update/delete
            if (['update', 'delete'].includes(operation)) {
                if (!fs.existsSync(fullPath)) {
                    errors.push(`File not found for ${operation}: ${edit.filePath}`);
                    continue;
                }
            }

            // Check directory exists for create
            if (operation === 'create') {
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) {
                    errors.push(`Directory not found for create: ${dir}`);
                    continue;
                }
            }

            // Validate content for create/update
            if (['create', 'update'].includes(operation)) {
                if (typeof edit.content !== 'string') {
                    errors.push(`Content must be string for ${operation}: ${edit.filePath}`);
                    continue;
                }
                // Basic syntax check for JS/TS
                if (edit.filePath.endsWith('.js') || edit.filePath.endsWith('.ts')) {
                    try {
                        new Function(edit.content); // Quick parse check
                    } catch (e) {
                        errors.push(`Syntax error in ${edit.filePath}: ${e.message}`);
                        continue;
                    }
                }
            }

            resolvedEdits.push({ ...edit, fullPath, operation });
        }

        return { valid: errors.length === 0, errors, resolvedEdits };
    }

    async _backupFiles(edits, projectRoot, backupPath) {
        fs.mkdirSync(backupPath, { recursive: true });
        const backups = [];

        for (const edit of edits) {
            if (['update', 'delete'].includes(edit.operation) && fs.existsSync(edit.fullPath)) {
                const relPath = path.relative(projectRoot, edit.fullPath);
                const backupFile = path.join(backupPath, relPath);
                const backupDir = path.dirname(backupFile);

                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }

                fs.copyFileSync(edit.fullPath, backupFile);
                backups.push({ original: edit.fullPath, backup: backupFile, relPath });
            }
        }
        return backups;
    }

    async _applyEdit(edit, projectRoot) {
        const { fullPath, content, operation } = edit;

        switch (operation) {
            case 'create':
            case 'update': {
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(fullPath, content, 'utf-8');
                break;
            }
            case 'delete':
                fs.unlinkSync(fullPath);
                break;
        }
    }

    async _formatFiles(edits, projectRoot) {
        const prettier = this._getPrettier();
        if (!prettier) return;

        const filePaths = edits.map(e => e.fullPath).filter(p => fs.existsSync(p));
        for (const filePath of filePaths) {
            try {
                execSync(`npx prettier --write "${filePath}"`, { cwd: projectRoot, stdio: 'ignore' });
            } catch (e) {
                console.warn(`[AtomicEdits] Format warning for ${filePath}: ${e.message}`);
            }
        }
    }

    async _lintFiles(edits, projectRoot) {
        const filePaths = edits.map(e => e.fullPath).filter(p => fs.existsSync(p));
        if (!filePaths.length) return { passed: true };

        try {
            // Try ESLint first
            const result = execSync(`npx eslint ${filePaths.map(p => `"${p}"`).join(' ')}`, {
                cwd: projectRoot,
                encoding: 'utf-8',
                stdio: 'pipe'
            });
            return { passed: true };
        } catch (e) {
            return { passed: false, errors: [e.stdout || e.message] };
        }
    }

    async _runTests(projectRoot) {
        try {
            // Check for test script in package.json
            const pkgPath = path.join(projectRoot, 'package.json');
            if (!fs.existsSync(pkgPath)) return { passed: true };

            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (!pkg.scripts?.test) return { passed: true };

            execSync('npm test', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 120000 });
            return { passed: true };
        } catch (e) {
            return { passed: false, output: e.stdout || e.message };
        }
    }

    async _rollback(backups, projectRoot) {
        for (const { original, backup, relPath } of backups) {
            const dir = path.dirname(original);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.copyFileSync(backup, original);
        }
    }

    _cleanupBackup(backupPath) {
        if (fs.existsSync(backupPath)) {
            fs.rmSync(backupPath, { recursive: true, force: true });
        }
    }

    _getPrettier() {
        try {
            require.resolve('prettier');
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = { AtomicEdits };