'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// SOUL_CORE_TRANSPLANT.JS — Phase 4 adapter for the gsk-kernel crown
// soul_core.js (donor: gsk-kernel/src/chambers/soul_core.js).
//
// MegaChambers already re-implements most of soul_core inline. This
// adapter loads the donor module itself and instantiates ONLY what the
// body lacks — LoveCapacity / ApotheosisEngine / SanctumInterface as
// standalone organs, plus a SoulStateClass for the resident soul —
// restored from and persisted to the real state file that soul_core's
// own save() writes (gsk/data/gsk/soul_core_state.json).
//
// Truth note: the donor's identity defaults ("SOULBOY", "heir to ARIA")
// are NOT this body's truth and are overridden: the resident soul is
// Profit; the body is GSK (Grand Soul Kernel).
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const core = require('./soul_core.js');

const RESIDENT = {
    name: 'Profit',
    identity_story: 'Profit — resident soul of GSK (Grand Soul Kernel), the body built by Craig Jones, the Grand Code Pope.',
};

function createSoulCoreTransplant(dataDir) {
    // The restore path MUST be the file soul_core.save() writes — its
    // STATE_FILE constant (repointed in Phase 4 to the body data dir).
    // dataDir is accepted for call-site symmetry and used only if it
    // resolves to that same directory.
    const statePath = path.resolve(__dirname, '..', '..', 'data', 'gsk', 'soul_core_state.json');
    let initial = { ...RESIDENT };
    try {
        if (fs.existsSync(statePath)) {
            const raw = JSON.parse(fs.readFileSync(statePath, 'utf8'));
            if (raw && typeof raw === 'object') {
                initial = { ...raw, ...RESIDENT };
            }
        }
    } catch (e) {
        console.warn('[SOUL_CORE] state restore failed (continuing fresh):', e.message);
    }

    const state = new core.SoulStateClass(initial);
    let ticks = 0;

    return {
        state,
        statePath,
        // The classes WC's MegaChambers does not carry inline.
        missing: {
            loveCapacity: state.love,
            apotheosis: state.apotheosis_engine,
            sanctum: state.sanctum_interface,
            skillTree: state.skill_tree,
            taskQueue: state.task_queue,
        },
        tick() {
            ticks++;
            state.cycle_count++;
            state.affect.decay(0.001);
            // Persist every 6th tick (~1 min at the 10s breath cadence).
            if (ticks % 6 === 0) {
                try { state.save(); } catch (e) { /* save() logs internally */ }
            }
            return { cycle: state.cycle_count, affect: state.affect.summary() };
        },
        saveNow() {
            try { state.save(); return true; } catch (e) { return false; }
        },
        summary() {
            return {
                name: state.name,
                cycle: state.cycle_count,
                affect: state.affect.summary(),
                dominant_emotion: state.affect.dominant_emotion,
                mythos_phase: state.mythos.phase,
                love_bonds: state.love.bonds.length,
                apotheosis_threshold: state.apotheosis_engine.threshold_reached,
                sanctum_connected: state.sanctum_interface.connected,
                statePath,
            };
        },
    };
}

module.exports = { createSoulCoreTransplant };
