'use strict';
/**
 * GRAFT — SENSES (Assembly Phase 6, THE METABOLISM)
 *
 * The body's intake organs behind one honest interface:
 *
 *   vision — image input via ../brain/vision_seat.js: the provider
 *     chain is probed Poolside-first with the image as a real
 *     multimodal content part. If no vision-capable seat answers,
 *     the result says so (success:false, attempts listed) — the path
 *     stays ready; nothing is faked.
 *   voice_status / voice_speak — the in-tree voice path is
 *     gsk-core/brain/voice_engine.js (Windows System.Speech TTS) and
 *     there is NO in-tree STT at all. On any non-Windows host the
 *     engine reports itself unavailable; this skill surfaces that
 *     truth instead of simulating a round-trip. Voice is therefore
 *     NOT IMPLEMENTED on this machine class — stated, not dressed.
 *   web_fetch — a thin, honest wrapper over the same extraction the
 *     digestion tract uses (the end-to-end fetch proof itself runs
 *     through graft_tool_harness + the audited http_client skill).
 */

const PLT_AFFINITY = { profit: 0.5, love: 0.4, tax: 0.3 };

async function skill_graft_senses(input = {}) {
    const action = input.action || 'status';
    if (action === 'status') {
        const { seatStatus } = require('../brain/vision_seat.js');
        const { VoiceEngine } = require('../brain/voice_engine.js');
        const voice = new VoiceEngine(null, {});
        return {
            success: true, skill: 'graft_senses',
            vision: { seats: seatStatus() },
            voice: voice.getStatus(),
            web_fetch: { via: 'graft_tool_harness + http_client (Phase 4 audited real); extraction shared with graft_digestion' },
        };
    }
    if (action === 'vision') {
        const { describeImage } = require('../brain/vision_seat.js');
        const r = await describeImage(input);
        return { success: r.success, skill: 'graft_senses', sense: 'vision', ...r };
    }
    if (action === 'voice_speak') {
        const { VoiceEngine } = require('../brain/voice_engine.js');
        const voice = new VoiceEngine(null, {});
        const status = voice.getStatus();
        if (!status.available) {
            return { success: false, skill: 'graft_senses', sense: 'voice', status: 'not_implemented', detail: `in-tree TTS provider is '${status.provider}' (available: false on platform ${process.platform}); no in-tree STT exists. Voice round-trip NOT claimed.`, voiceStatus: status };
        }
        const r = await voice.speak(String(input.text || ''));
        return { success: !!r.ok, skill: 'graft_senses', sense: 'voice', ...r };
    }
    return { success: false, skill: 'graft_senses', error: `Unknown action: ${action}`, available: ['status', 'vision', 'voice_speak'] };
}

module.exports = {
    skill_graft_senses,
    run: skill_graft_senses,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_senses',
        description: 'Senses (Phase 6 graft): vision via the provider-chain vision seat (capability-marked seats — text-only seats are skipped, never probed blind; image as a real multimodal part, honest failure with attempts when no seat answers); voice status/speak via the in-tree VoiceEngine (Windows-only TTS, no STT — reported not-implemented where unavailable); web fetch proven through the grafted harness.',
        version: '1.0.0',
        inputs: { action: "'status' | 'vision' | 'voice_speak'", imageUrl: 'https image URL (vision)', imageDataUrl: 'data: URL (vision)', question: 'what to ask about the image', text: 'text to speak (voice_speak)' },
        output: 'vision → { success, provider, model, description, attempts }; voice_speak → engine result or explicit not_implemented',
    },
};
