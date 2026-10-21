'use strict';

/**
 * SoulCPLSync — Bidirectional sync between GSK soul state and CPL avatar (Phase 22)
 *
 * Soul → CPL: GSK mood/energy/focus drives avatar behavior, appearance, aura
 * CPL → Soul: Avatar experiences (trauma, triumph, discovery) write to soul journal
 * Two-way bridge: every 30s tick
 */

const fs = require('fs');
const path = require('path');

class SoulCPLSync {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.cplHttpUrl = options.cplHttpUrl || 'http://localhost:3457';
        this.syncInterval = options.syncInterval || 30000; // 30 seconds
        this.timer = null;
        this.running = false;

        // State mappings
        this.moodToAura = {
            joyful: { color: '#ffdd00', intensity: 1.0, particles: 'gold' },
            peaceful: { color: '#00ff88', intensity: 0.7, particles: 'green' },
            curious: { color: '#00aaff', intensity: 0.8, particles: 'blue' },
            determined: { color: '#ff8800', intensity: 0.9, particles: 'orange' },
            anxious: { color: '#ff4444', intensity: 0.6, particles: 'red' },
            melancholic: { color: '#8888ff', intensity: 0.5, particles: 'purple' },
            angry: { color: '#ff0000', intensity: 1.0, particles: 'red' },
            neutral: { color: '#ffffff', intensity: 0.5, particles: 'white' }
        };

        this.energyToMovement = {
            high: { speed: 1.5, stamina: 100 },
            medium: { speed: 1.0, stamina: 60 },
            low: { speed: 0.5, stamina: 20 },
            exhausted: { speed: 0.1, stamina: 0 }
        };
    }

    /**
     * Start the sync loop
     */
    start() {
        if (this.running) return;
        this.running = true;

        // Initial sync
        this._syncSoulToCPL();
        this._syncCPLToSoul();

        this.timer = setInterval(() => {
            this._syncSoulToCPL().catch(e => console.warn('[SoulCPLSync] Soul→CPL failed:', e.message));
            this._syncCPLToSoul().catch(e => console.warn('[SoulCPLSync] CPL→Soul failed:', e.message));
        }, this.syncInterval);

        console.log(`[SoulCPLSync] Bidirectional sync started (interval: ${this.syncInterval}ms)`);
    }

    /**
     * Stop the sync loop
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.running = false;
        console.log('[SoulCPLSync] Bidirectional sync stopped');
    }

    /**
     * Soul → CPL: Push soul state to avatar
     */
    async _syncSoulToCPL() {
        const soulState = await this._getSoulState();
        if (!soulState) return;

        const avatarUpdates = this._computeAvatarUpdates(soulState);

        // Send to CPL via HTTP API
        try {
            const response = await fetch(`${this.cplHttpUrl}/api/gsk/avatar/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    avatarId: 'gsk_avatar',
                    updates: avatarUpdates,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                console.log('[SoulCPLSync] ✓ Soul→CPL sync:', Object.keys(avatarUpdates).join(', '));
            }
        } catch (e) {
            // CPL may not have the endpoint yet
            console.log('[SoulCPLSync] Soul→CPL: endpoint not ready, queueing');
        }
    }

    /**
     * CPL → Soul: Pull avatar experiences into soul
     */
    async _syncCPLToSoul() {
        try {
            const response = await fetch(`${this.cplHttpUrl}/api/gsk/avatar/experiences`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) return;

            const data = await response.json();
            const experiences = data.experiences || [];

            if (experiences.length === 0) return;

            // Write experiences to soul journal
            for (const exp of experiences) {
                await this._writeExperienceToSoul(exp);
            }

            console.log(`[SoulCPLSync] ✓ CPL→Soul sync: ${experiences.length} experiences`);

        } catch (e) {
            // CPL may not have the endpoint yet
            console.log('[SoulCPLSync] CPL→Soul: endpoint not ready');
        }
    }

    /**
     * Get current soul state from GSK
     */
    async _getSoulState() {
        // Try various soul state sources
        const sources = [
            () => this.kernel.consciousness?.engine?.getState?.(),
            () => this.kernel.soulEntity?.getState?.(),
            () => this.kernel.chambers?.mythos?.getState?.(),
            () => this.kernel.consciousness?.getMood?.(),
            () => this.kernel.memorySubstrate?.retrieve?.('soul:current_state')
        ];

        for (const src of sources) {
            try {
                const state = await src();
                if (state) return state;
            } catch (e) {}
        }

        // Default state
        return {
            mood: 'neutral',
            energy: 50,
            focus: 'idle',
            traits: {},
            cycleCount: 0
        };
    }

    /**
     * Compute avatar updates from soul state
     */
    _computeAvatarUpdates(soulState) {
        const updates = {};

        // Mood → aura
        const mood = soulState.mood || 'neutral';
        const aura = this.moodToAura[mood] || this.moodToAura.neutral;
        updates.aura = aura;

        // Energy → movement
        const energyLevel = this._energyLevel(soulState.energy || 50);
        updates.movement = this.energyToMovement[energyLevel];

        // Focus → behavior hint
        if (soulState.focus) {
            updates.behaviorHint = soulState.focus;
        }

        // Traits → appearance modifiers
        if (soulState.traits) {
            updates.traits = this._mapTraitsToAppearance(soulState.traits);
        }

        // Cycle count → maturity level
        if (soulState.cycleCount) {
            updates.maturity = Math.min(10, Math.floor(soulState.cycleCount / 100));
        }

        return updates;
    }

    _energyLevel(energy) {
        if (energy >= 80) return 'high';
        if (energy >= 40) return 'medium';
        if (energy >= 15) return 'low';
        return 'exhausted';
    }

    _mapTraitsToAppearance(traits) {
        const appearance = {};

        if (traits.curiosity > 0.7) appearance.eyes = 'wide_glowing';
        if (traits.determination > 0.7) appearance.posture = 'forward_lean';
        if (traits.creativity > 0.7) appearance.trail = 'sparkle';
        if (traits.empathy > 0.7) appearance.aura = 'soft_pulse';
        if (traits.analytical > 0.7) appearance.halo = 'geometric';

        return appearance;
    }

    /**
     * Write CPL experience to soul journal
     */
    async _writeExperienceToSoul(experience) {
        const { type, intensity, description, position, metadata = {} } = experience;

        // Map experience type to soul journal entry
        const entry = {
            timestamp: Date.now(),
            source: 'cpl_experience',
            type,
            intensity: intensity || 0.5,
            description: description || `CPL experience: ${type}`,
            position,
            metadata,
            moodImpact: this._moodImpactFromExperience(type, intensity),
            energyImpact: this._energyImpactFromExperience(type, intensity)
        };

        // Store in memory substrate
        if (this.kernel.memorySubstrate) {
            await this.kernel.memorySubstrate.store(
                `experience:cpl:${Date.now()}`,
                entry,
                { tags: ['experience', 'cpl', type], source: 'cpl_avatar' }
            );
        }

        // Also write to soul journal if available
        if (this.kernel.consciousness?.soulJournal?.write) {
            await this.kernel.consciousness.soulJournal.write(entry);
        }
    }

    _moodImpactFromExperience(type, intensity) {
        const impacts = {
            discovery: { mood: 'curious', delta: 0.2 * intensity },
            triumph: { mood: 'joyful', delta: 0.3 * intensity },
            trauma: { mood: 'melancholic', delta: -0.4 * intensity },
            combat: { mood: 'determined', delta: 0.1 * intensity },
            social: { mood: 'peaceful', delta: 0.15 * intensity },
            loss: { mood: 'melancholic', delta: -0.3 * intensity },
            creation: { mood: 'joyful', delta: 0.25 * intensity }
        };
        return impacts[type] || { mood: 'neutral', delta: 0 };
    }

    _energyImpactFromExperience(type, intensity) {
        const impacts = {
            discovery: 5 * intensity,
            triumph: 10 * intensity,
            trauma: -20 * intensity,
            combat: -15 * intensity,
            social: 5 * intensity,
            loss: -10 * intensity,
            creation: 5 * intensity
        };
        return impacts[type] || 0;
    }

    /**
     * Force immediate sync
     */
    async forceSync() {
        await Promise.all([
            this._syncSoulToCPL(),
            this._syncCPLToSoul()
        ]);
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            running: this.running,
            interval: this.syncInterval,
            lastSoulState: this._getSoulState()
        };
    }
}

module.exports = { SoulCPLSync };