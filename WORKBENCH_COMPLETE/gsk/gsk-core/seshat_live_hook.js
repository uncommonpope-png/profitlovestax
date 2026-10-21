/**
 * PHASE 3: Seshat Live Ingest Hook
 * 
 * Watches Seshat's pages directory for real-time changes.
 * When a new page is created or modified, broadcasts an event
 * to the Family Event Bus so GSK can immediately index it.
 * 
 * Replaces the 60s polling interval for Seshat self-indexing.
 */

const fs = require('fs');
const path = require('path');
const { getFamilyEventBus } = require('./family_event_bus');

const DEFAULT_SESHAT_DIR = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain\\pages';

class SeshatLiveHook {
    constructor(seshatDir = DEFAULT_SESHAT_DIR) {
        this.seshatDir = seshatDir;
        this.bus = getFamilyEventBus();
        this.knownFiles = new Map();
        this.polling = false;
        this._interval = null;
        this._observer = null;
    }

    /**
     * Start watching Seshat's pages directory
     * Uses fs.watch (native) with polling fallback
     */
    start() {
        // Initial scan
        this._scanDirectory();

        // Try native fs.watch first
        try {
            this._observer = fs.watch(this.seshatDir, { recursive: false }, (eventType, filename) => {
                if (filename && filename.endsWith('.md')) {
                    this._handleChange(filename, eventType);
                }
            });
            this._observer.on('error', () => {
                console.log('[SeshatHook] fs.watch error, falling back to polling');
                this._startPolling();
            });
            console.log(`[SeshatHook] Native fs.watch active on ${this.seshatDir}`);
        } catch (e) {
            console.log(`[SeshatHook] fs.watch unavailable, using polling: ${e.message}`);
            this._startPolling();
        }

        return this;
    }

    stop() {
        if (this._observer) {
            this._observer.close();
            this._observer = null;
        }
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }

    _scanDirectory() {
        try {
            const files = fs.readdirSync(this.seshatDir).filter(f => f.endsWith('.md'));
            this.knownFiles.clear();
            files.forEach(f => {
                const stat = fs.statSync(path.join(this.seshatDir, f));
                this.knownFiles.set(f, {
                    size: stat.size,
                    mtime: stat.mtimeMs
                });
            });
        } catch (e) {
            // Directory may not exist yet
        }
    }

    _handleChange(filename, eventType) {
        const filePath = path.join(this.seshatDir, filename);
        try {
            const stat = fs.statSync(filePath);
            const known = this.knownFiles.get(filename);

            if (!known) {
                // New file created
                this.knownFiles.set(filename, { size: stat.size, mtime: stat.mtimeMs });
                const content = fs.readFileSync(filePath, 'utf8');
                this.bus.publish('seshat:page_created', {
                    filename,
                    path: filePath,
                    size: stat.size,
                    content: content.substring(0, 500),
                }, 'seshat');
                console.log(`[SeshatHook] NEW: ${filename} (${stat.size} bytes)`);
            } else if (stat.mtimeMs > known.mtime || stat.size !== known.size) {
                // File modified
                this.knownFiles.set(filename, { size: stat.size, mtime: stat.mtimeMs });
                const content = fs.readFileSync(filePath, 'utf8');
                this.bus.publish('seshat:page_modified', {
                    filename,
                    path: filePath,
                    size: stat.size,
                    previousSize: known.size,
                    content: content.substring(0, 500),
                }, 'seshat');
                console.log(`[SeshatHook] MODIFIED: ${filename} (${known.size} → ${stat.size} bytes)`);
            }
        } catch (e) {
            // File may have been deleted
        }
    }

    _startPolling() {
        if (this.polling) return;
        this.polling = true;
        this._scanDirectory(); // reset baseline
        this._interval = setInterval(() => {
            try {
                const files = fs.readdirSync(this.seshatDir).filter(f => f.endsWith('.md'));
                const currentFiles = new Map();

                files.forEach(f => {
                    const stat = fs.statSync(path.join(this.seshatDir, f));
                    currentFiles.set(f, { size: stat.size, mtime: stat.mtimeMs });

                    const known = this.knownFiles.get(f);
                    if (!known) {
                        // New file
                        const content = fs.readFileSync(path.join(this.seshatDir, f), 'utf8');
                        this.bus.publish('seshat:page_created', {
                            filename: f,
                            path: path.join(this.seshatDir, f),
                            size: stat.size,
                            content: content.substring(0, 500),
                        }, 'seshat');
                    } else if (stat.mtimeMs > known.mtime || stat.size !== known.size) {
                        // Modified
                        const content = fs.readFileSync(path.join(this.seshatDir, f), 'utf8');
                        this.bus.publish('seshat:page_modified', {
                            filename: f,
                            path: path.join(this.seshatDir, f),
                            size: stat.size,
                            content: content.substring(0, 500),
                        }, 'seshat');
                    }
                });

                // Detect deletions
                for (const [f] of this.knownFiles) {
                    if (!currentFiles.has(f)) {
                        this.bus.publish('seshat:page_deleted', {
                            filename: f
                        }, 'seshat');
                    }
                }

                this.knownFiles = currentFiles;
            } catch (e) {
                // Non-fatal polling error
            }
        }, 3000); // Poll every 3s (much faster than old 60s)
    }
}

module.exports = { SeshatLiveHook };
