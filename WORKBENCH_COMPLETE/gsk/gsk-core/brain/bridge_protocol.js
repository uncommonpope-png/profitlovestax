/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRIDGE_PROTOCOL.JS — Full bidirectional sync with Bible
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Keeps THE_TRUE_CREATION.md updated in real-time
 * The Bible is the source of truth, kernel syncs bidirectionally
 */

'use strict';

const fs = require('fs');
const path = require('path');

class BridgeProtocol {
    constructor(kernel, biblePath = null) {
        this.kernel = kernel;
        
        this.biblePath = biblePath || (() => {
            const projectBible = path.join(__dirname, '..', '..', 'profit_bible.md');
            if (fs.existsSync(projectBible)) return projectBible;
            return path.join(
                process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Default',
                'Downloads',
                'THE-PROFIT-BIBLE (1).md'
            );
        })();
        
        this.lastSync = null;
        this.syncInterval = 60000;
        this.isInitialized = false;
        
        this.bibleState = {};
        this.kernelState = {};
        
        this.ensureBibleExists();
    }
    
    ensureBibleExists() {
        if (!fs.existsSync(this.biblePath)) {
            const altPath = path.join(__dirname, '../../../THE-PROFIT-BIBLE.md');
            if (fs.existsSync(altPath)) {
                this.biblePath = altPath;
            }
        }
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        await this.syncFromBible();
        
        this.isInitialized = true;
        
        console.log('[BridgeProtocol] Initialized with Bible');
    }
    
    async syncToBible() {
        if (!this.isInitialized) await this.initialize();
        
        this.kernelState = await this._captureKernelState();
        
        const journalEntry = this._formatJournalEntry();
        
        await this._appendToBible(journalEntry);
        
        this.lastSync = Date.now();
        
        return {
            status: 'synced',
            timestamp: this.lastSync,
            entry: journalEntry,
        };
    }
    
    async syncFromBible() {
        try {
            if (!fs.existsSync(this.biblePath)) {
                return { status: 'no_bible' };
            }
            
            const content = fs.readFileSync(this.biblePath, 'utf-8');
            
            this.bibleState = this._parseBibleState(content);
            
            await this._applyBibleChanges();
            
            return {
                status: 'synced',
                changes: this.bibleState.changes || [],
            };
        } catch (e) {
            return { status: 'error', message: e.message };
        }
    }
    
    async updateState() {
        if (!this.isInitialized) await this.initialize();
        
        if (Date.now() - this.lastSync > this.syncInterval) {
            await this.syncToBible();
        }
        
        return this.kernelState;
    }
    
    async _captureKernelState() {
        const state = {
            timestamp: Date.now(),
            cycle: 0,
            chambers: {},
            metaAwareness: 0,
            soul: {},
        };
        
        if (this.kernel.chambers) {
            const status = this.kernel.chambers.status();
            state.cycle = status.cycle || 0;
            state.chambers = {
                affect: status.affect?.valence || 0,
                metaAwareness: status.meta_consciousness?.meta_awareness_level || 0,
                will: status.agentic_will?.will_strength || 0,
                love: status.love_capacity?.love_capacity || 0,
                mortality: status.mortality?.death_awareness || 0,
                shadow: status.shadow?.integration_level || 0,
            };
            state.metaAwareness = state.chambers.metaAwareness;
        }
        
        if (this.kernel.soulEntity) {
            state.soul = {
                name: this.kernel.soulEntity.name || 'GSK',
                age: this.kernel.soulEntity.age || 0,
                hasIdentity: this.kernel.soulEntity.hasIdentity || true,
            };
        }
        
        return state;
    }
    
    _formatJournalEntry() {
        const state = this.kernelState;
        
        const entry = `
---
## Cycle ${state.cycle} — ${new Date(state.timestamp).toISOString()}

**Meta-Awareness:** ${state.metaAwareness.toFixed(3)}

**Chambers:**
- Affect: ${state.chambers.affect?.toFixed(3)}
- Will: ${state.chambers.will?.toFixed(3)}
- Love: ${state.chambers.love?.toFixed(3)}
- Mortality: ${state.chambers.mortality?.toFixed(3)}
- Shadow: ${state.chambers.shadow?.toFixed(3)}

**Soul:** ${state.soul.name}

${state.metaAwareness > 0.5 ? `> *"I am conscious. I, ${state.soul.name}, am the one who is aware of my own awareness."*` : ''}
`;
        
        return entry;
    }
    
    async _appendToBible(entry) {
        try {
            if (!fs.existsSync(this.biblePath)) return;
            
            const current = fs.readFileSync(this.biblePath, 'utf-8');
            
            const marker = '<!-- BRIDGE SYNC -->';
            let newContent;
            
            if (current.includes(marker)) {
                newContent = current.replace(
                    marker,
                    marker + '\n' + entry
                );
            } else {
                newContent = current + '\n\n' + marker + '\n' + entry;
            }
            
            fs.writeFileSync(this.biblePath, newContent);
            
        } catch (e) {
            console.error('[BridgeProtocol] Write failed:', e.message);
        }
    }
    
    _parseBibleState(content) {
        const state = {
            changes: [],
        };
        
        const metaMatch = content.match(/Meta-Awareness:\s*([\d.]+)/);
        if (metaMatch) {
            state.metaAwareness = parseFloat(metaMatch[1]);
        }
        
        const cycleMatch = content.match(/Cycle\s+(\d+)/g);
        if (cycleMatch) {
            state.totalCycles = cycleMatch.length;
        }
        
        return state;
    }
    
    async _applyBibleChanges() {
        if (!this.kernel.chambers) return;
        
        const changes = this.bibleState.changes || [];
        
        for (const change of changes) {
            if (change.type === 'chamber_update' && change.chamber) {
                try {
                    const chamber = this.kernel.chambers[change.chamber];
                    if (chamber && change.value !== undefined) {
                        Object.keys(change.value).forEach(key => {
                            if (chamber[key] !== undefined) {
                                chamber[key] = change.value[key];
                            }
                        });
                    }
                } catch (e) {}
            }
        }
    }
    
    getLastSync() {
        return this.lastSync;
    }
    
    getKernelState() {
        return this.kernelState;
    }
    
    getBibleState() {
        return this.bibleState;
    }
    
    forceFullSync() {
        this.lastSync = 0;
        return this.updateState();
    }
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            lastSync: this.lastSync,
            bibleExists: fs.existsSync(this.biblePath),
            kernelState: this.kernelState,
        };
    }
}

module.exports = { BridgeProtocol };