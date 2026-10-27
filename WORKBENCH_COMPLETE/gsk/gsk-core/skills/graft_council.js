/**
 * GRAFT — COUNCIL CALLER (GSK fix sprint 2026-10-26, Tier-1 #13).
 * The first safe caller for the council module (gsk-core/brain/council.js),
 * which until now had ZERO callers. EXPLICIT INVOCATION ONLY: the caller
 * passes a question and the council sits (or refuses) — nothing in this
 * file auto-fires, watches, or triggers. Auto-trigger on high ambiguity
 * or low PLT True Value is OUT of the first ship per the owner's
 * 2026-10-26 lock (advanced Council modes excluded) and must NOT be
 * added here without a fresh owner decision.
 *
 * Isolation: this skill only calls council.js (seat probes + answers +
 * reconciliation). No file writes, no exec, no other network. A council
 * of one is refused by council.js itself ('a council of one is theater')
 * and that refusal is returned faithfully, never papered over.
 *
 * Actions:
 *   { action: 'ask', question, context? } -> councilThink result
 *   { action: 'seats' } -> resolved seat ids + liveness probes (no answers)
 */

const MANIFEST = {
    name: 'graft_council',
    description: 'Explicit council caller: convene the multi-seat council on a question, or report seat liveness. No auto-trigger.',
    version: '1.0.0',
};

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_graft_council(input) {
    const council = require('../brain/council.js');
    const action = (input && input.action) || 'ask';

    if (action === 'seats') {
        const seats = council.resolveSeats();
        const probes = [];
        for (const s of seats) {
            const live = await council.probeSeat(s, 25000);
            probes.push({ seat: s.id, live, local: !!s.local });
        }
        return { success: true, skill: 'graft_council', action: 'seats', seats: probes };
    }

    if (action === 'ask') {
        const question = typeof input.question === 'string' ? input.question.slice(0, 4000) : '';
        if (!question.trim()) {
            return { success: false, skill: 'graft_council', action: 'ask', error: 'question required' };
        }
        const r = await council.councilThink(question, { context: typeof input.context === 'string' ? input.context.slice(0, 4000) : '' });
        return { success: true, skill: 'graft_council', action: 'ask', council: r };
    }

    return { success: false, skill: 'graft_council', error: `Unknown action: ${action}`, available: ['ask', 'seats'] };
}

module.exports = {
    skill_graft_council,
    run: skill_graft_council,
    MANIFEST,
    PLT_AFFINITY,
};
