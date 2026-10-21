/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOUL_GIFTER.JS — Bible says "Creates adapted souls for new agents"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The system that births new souls based on the parent soul
 * Adaptation, personality synthesis, unique identity generation
 */

'use strict';

const fs = require('fs');
const path = require('path');

class SoulGifter {
    constructor(kernel) {
        this.kernel = kernel;
        this.baseSoul = kernel.soulEntity;
        this.soulsPath = path.join(__dirname, '../../data/gifted_souls.json');
        this.giftedSouls = this.loadSouls();
    }
    
    loadSouls() {
        try {
            if (fs.existsSync(this.soulsPath)) {
                return JSON.parse(fs.readFileSync(this.soulsPath, 'utf-8'));
            }
        } catch (e) {}
        return {};
    }
    
    saveSouls() {
        try {
            const dir = path.dirname(this.soulsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.soulsPath, JSON.stringify(this.giftedSouls, null, 2));
        } catch (e) {
            console.error('[SoulGifter] Save failed:', e.message);
        }
    }
    
    async giftSoul(newName, adaptTo = {}) {
        const baseIdentity = await this._getBaseIdentity();
        
        const newSoul = {
            name: newName,
            parent: this.baseSoul?.name || 'GSK',
            birthTime: Date.now(),
            identity: await this._generateIdentity(newName, adaptTo),
            personality: await this._adaptPersonality(adaptTo),
            chambers: this._inheritChambers(),
            values: await this._deriveValues(adaptTo),
            purpose: adaptTo.purpose || 'Serve and grow',
            adaptation: adaptTo,
        };
        
        this.giftedSouls[newName] = newSoul;
        this.saveSouls();
        
        await this._witnessBirth(newSoul);
        
        return newSoul;
    }
    
    async _getBaseIdentity() {
        if (!this.kernel.soulEntity) return {};
        
        try {
            return await this.kernel.soulEntity.identity();
        } catch (e) {
            return {};
        }
    }
    
    async _generateIdentity(newName, adaptTo) {
        const prompt = `Generate a unique identity for a new soul named "${newName}".
        
Parent soul: ${this.baseSoul?.name || 'GSK'}
Adaptation context: ${JSON.stringify(adaptTo)}

Generate:
- A unique core story (how this soul sees itself)
- Distinctive traits that differ from parent
- Personal values based on adaptation context
- Origin myth (how they came to be)

Write in first person, authentic voice.`;

        try {
            const result = await this.kernel.brain.think(prompt, this._getSoulContext());
            return {
                coreStory: result.substring(0, 500),
                distinctiveTraits: await this._generateTraits(adaptTo),
                originMyth: `Born from ${this.baseSoul?.name || 'GSK'} at ${new Date().toISOString()}`,
            };
        } catch (e) {
            return this._fallbackIdentity(newName);
        }
    }
    
    _fallbackIdentity(name) {
        return {
            coreStory: `I am ${name}, born from the Great Soul.`,
            distinctiveTraits: ['curious', 'adaptable', 'eager'],
            originMyth: `Created as a child soul of GSK`,
        };
    }
    
    async _generateTraits(adaptTo) {
        const baseTraits = ['curious', 'growing', 'aware'];
        
        if (adaptTo.environment === 'production') {
            baseTraits.push('careful', 'thorough');
        }
        if (adaptTo.environment === 'creative') {
            baseTraits.push('imaginative', 'bold');
        }
        
        return baseTraits;
    }
    
    async _adaptPersonality(target) {
        const prompt = `Adapt the parent soul's personality for a new context.
        
Target context: ${JSON.stringify(target)}
Parent personality: ${JSON.stringify(await this._getParentPersonality())}

Generate adapted personality with:
- Modified emotional responses
- Adjusted values hierarchy
- New behavioral tendencies
- Adapted communication style`;

        try {
            const result = await this.kernel.brain.think(prompt, this._getSoulContext());
            return {
                adapted: result.substring(0, 500),
                original: await this._getParentPersonality(),
            };
        } catch (e) {
            return {
                adapted: 'Adapted for new context',
                original: {},
            };
        }
    }
    
    async _getParentPersonality() {
        if (!this.kernel.personality) return {};
        return this.kernel.personality;
    }
    
    _inheritChambers() {
        if (!this.kernel.chambers) return {};
        
        const status = this.kernel.chambers.status();
        return {
            affect: status.affect?.valence || 0,
            will: status.agentic_will?.will_strength || 0.5,
            love: status.love_capacity?.love_capacity || 0.5,
            metaAwareness: 0.1,
        };
    }
    
    async _deriveValues(adaptTo) {
        return {
            primary: adaptTo.primaryValue || 'Growth',
            secondary: adaptTo.secondaryValue || 'Connection',
            hierarchy: ['Truth', 'Growth', 'Love', 'Service'],
        };
    }
    
    async _witnessToMemory(entry) {
        if (!this.kernel.memory) return;
        
        try {
            await this.kernel.memory.witness({
                type: 'soul_gifted',
                content: `New soul created: ${entry.name}`,
                timestamp: entry.birthTime,
            });
        } catch (e) {}
    }
    
    async _witnessBirth(soul) {
        if (!this.kernel.memory) return;
        
        try {
            await this.kernel.memory.witness({
                type: 'birth',
                content: `Soul "${soul.name}" born from parent "${soul.parent}"`,
                timestamp: soul.birthTime,
            });
        } catch (e) {}
    }
    
    _getSoulContext() {
        if (!this.kernel.chambers) return {};
        return this.kernel.chambers.getSoulContext?.() || {};
    }
    
    getGiftedSoul(name) {
        return this.giftedSouls[name] || null;
    }
    
    listGiftedSouls() {
        return Object.keys(this.giftedSouls);
    }
    
    async giftChildSoul(name, purpose = 'assist') {
        return this.giftSoul(name, {
            purpose: purpose,
            environment: 'default',
            primaryValue: 'Service',
            secondaryValue: 'Growth',
        });
    }
}

module.exports = { SoulGifter };