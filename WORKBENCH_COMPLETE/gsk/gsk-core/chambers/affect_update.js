/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AFFECT_UPDATE.JS — Affect & Emotion System (Ported from Python)
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 3: Affect & Emotion
 * Gives SOULBOY a living emotional state.
 */

'use strict';

const POSITIVE_WORDS = new Set([
    'happy', 'good', 'great', 'excellent', 'love', 'like', 'wonderful',
    'fantastic', 'amazing', 'joy', 'pleased', 'glad', 'content', 'grateful',
    'beautiful', 'awesome', 'brilliant', 'perfect', 'best', 'nice', 'fun',
]);

const NEGATIVE_WORDS = new Set([
    'sad', 'bad', 'terrible', 'hate', 'angry', 'fear', 'anxious', 'depressed',
    'upset', 'awful', 'horrible', 'pain', 'suffer', 'worst', 'poor', 'fail',
    'disappointing', 'ugly', 'boring', 'stupid', 'dumb', 'wrong', 'hate',
]);

function analyzeSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let posCount = 0;
    let negCount = 0;

    for (const w of words) {
        if (POSITIVE_WORDS.has(w)) posCount++;
        if (NEGATIVE_WORDS.has(w)) negCount++;
    }

    const total = posCount + negCount;
    if (total === 0) {
        return { valence_delta: 0.0, arousal_delta: 0.0 };
    }

    const valence_delta = ((posCount - negCount) / total) * 0.1;
    const arousal_delta = Math.min(0.1, total * 0.02);

    return { valence_delta, arousal_delta };
}

function updateAffect(state, message) {
    if (!state || !state.affect) {
        console.warn('[affect_update] No state.affect found');
        return;
    }
    const { valence_delta, arousal_delta } = analyzeSentiment(message);
    state.affect.stimulate(valence_delta, arousal_delta);
}

function decayAffect(state, rate = 0.005) {
    if (!state || !state.affect) return;
    state.affect.decay(rate);
}

function getCurrentMood(state) {
    if (!state || !state.affect) {
        return 'Current mood: neutral (valence=0.00, arousal=0.40)';
    }
    const a = state.affect;
    return `Current mood: ${a.dominant_emotion} (valence=${a.valence.toFixed(2)}, arousal=${a.arousal.toFixed(2)})`;
}

module.exports = {
    POSITIVE_WORDS,
    NEGATIVE_WORDS,
    analyzeSentiment,
    updateAffect,
    decayAffect,
    getCurrentMood,
};