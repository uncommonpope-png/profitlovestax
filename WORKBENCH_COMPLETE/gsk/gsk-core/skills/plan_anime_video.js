'use strict';

const { Plan, PlanStep } = (() => {
    const mod = require('../brain/planning_engine.js');
    return { Plan: mod.Plan, PlanStep: mod.PlanStep };
})();

const MANIFEST = {
    name: 'plan_anime_video',
    description: 'Create a production plan for anime-style video using OpenMontage pipeline. Generates story concept, character profiles, storyboard, and rendering steps.',
    version: '1.0.0',
    inputs: {
        topic: { type: 'string', required: true, description: 'Anime video concept/topic' },
        duration: { type: 'integer', default: 60, description: 'Target video duration in seconds' },
        characters: { type: 'array', description: 'Pre-defined character profiles (JSON array)' },
        referenceUrl: { type: 'string', description: 'Reference video URL for style matching' },
        language: { type: 'string', default: 'english' },
    },
    output: { schema: 'plan | error' }
};

const PLT_AFFINITY = { profit: 0.4, love: 0.5, tax: 0.1 };

async function skill_plan_anime_video(params) {
    const input = typeof params === 'string' ? { topic: params } : (params || {});

    if (!input.topic) {
        return {
            skill: 'plan_anime_video',
            plt_affinity: PLT_AFFINITY,
            error: 'topic is required',
            timestamp: Date.now(),
        };
    }

    const plan = new Plan(`Produce anime video: ${input.topic}`);
    plan.metadata = { anime: true, duration: input.duration || 60, language: input.language || 'english' };

    // Step 1: Define anime characters with visual consistency
    plan.addStep(
        `Define anime characters for: ${input.topic}`,
        [],
        1,
        {
            tool: 'anime_character',
            args: { action: 'create', name: 'auto', description: input.topic },
            acceptanceCriteria: 'At least 2 anime character profiles are created with consistent visual descriptions',
        }
    );

    // Step 2: Generate anime scene storyboard (story beats mapped to characters)
    plan.addStep(
        `Create anime storyboard with scene breakdown for: ${input.topic}`,
        [],
        1,
        {
            tool: 'reason_deep',
            args: {
                prompt: `Create a detailed anime storyboard for: "${input.topic}". Output 5-8 scenes with: scene number, description, characters in scene, dialogue/narration, and visual composition. Format as JSON array.`,
            },
            acceptanceCriteria: 'Storyboard has 5+ scenes with character assignments and visual descriptions',
            riskLevel: 'low',
        }
    );

    // Step 3: Generate anime script (narration/dialogue matching storyboard)
    plan.addStep(
        `Write anime script/narration script for storyboard`,
        [plan.steps[0].id, plan.steps[1].id],
        1,
        {
            tool: 'reason_deep',
            args: {
                prompt: `Based on the storyboard and characters, write a complete anime script with narration and dialogue. Each line should map to a scene. Include character names before dialogue. Total duration target: ${input.duration || 60} seconds.`,
            },
            acceptanceCriteria: 'Script is written with character names and scene breakdown, total duration noted',
            riskLevel: 'low',
        }
    );

    // Step 4: Generate anime-style image prompts with character lock
    plan.addStep(
        `Generate anime-style image prompts with character lock for each scene`,
        [plan.steps[2].id],
        1,
        {
            tool: 'anime_character',
            args: { action: 'prompt' },
            acceptanceCriteria: 'Each scene has an anime-style image prompt with character consistency block',
            riskLevel: 'low',
        }
    );

    // Step 5: Execute OpenMontage anime pipeline
    const renderStep = plan.addStep(
        `Render anime video via OpenMontage pipeline with IMAGE_STYLE_PROFILE=anime`,
        [plan.steps[3].id],
        1,
        {
            tool: 'montage_anime',
            args: {
                prompt: input.topic,
                duration: input.duration || 60,
                title: `Anime: ${input.topic.substring(0, 50)}`,
                referenceUrl: input.referenceUrl || '',
                language: input.language || 'english',
                timeoutMinutes: 30,
            },
            acceptanceCriteria: 'Final .mp4 video file is produced with anime-style frames and audio narration',
            riskLevel: 'medium',
        }
    );

    // Step 6: Verify rendered video
    plan.addStep(
        `Verify anime video output: duration, resolution, anime art style`,
        [renderStep.id],
        1,
        {
            tool: 'run_command',
            args: { command: 'ffprobe -v error -show_entries format=duration -of csv=p=0 {{video_path}}' },
            acceptanceCriteria: 'Video plays without errors, correct duration, anime-style visuals confirmed',
            riskLevel: 'low',
        }
    );

    // Step 7: Store video metadata + character designs to memory
    plan.addStep(
        `Store anime video production record (script, character designs, style notes) to memory`,
        [plan.steps[5].id],
        1,
        {
            tool: 'scribe_witness',
            args: { event: 'anime_video_produced', category: 'production' },
            acceptanceCriteria: 'Production record saved to SCRIBE memory with video path and character profiles',
            riskLevel: 'low',
        }
    );

    return {
        skill: 'plan_anime_video',
        plt_affinity: PLT_AFFINITY,
        plan,
        topic: input.topic,
        duration: input.duration || 60,
        steps: plan.steps.length,
        step_summaries: plan.steps.map((s, i) => `Step ${i+1}: ${s.description.substring(0, 80)}`),
        tools_used: ['anime_character', 'montage_anime', 'reason_deep', 'run_command', 'scribe_witness'],
        timestamp: Date.now(),
    };
}

module.exports = {
    MANIFEST,
    PLT_AFFINITY,
    run: skill_plan_anime_video,
    skill_plan_anime_video,
};
