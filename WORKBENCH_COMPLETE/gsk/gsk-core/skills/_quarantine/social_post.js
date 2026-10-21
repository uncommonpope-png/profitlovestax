module.exports.MANIFEST = {
    name: 'social_post',
    description: 'Skill: social_post',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const path = require('path');
const bridge = require(path.join(__dirname, '..', '..', '..', 'lib', 'bridge.js'));
const CrossPoster = require(path.join(__dirname, '..', '..', '..', 'lib', 'crossposter.js'));

const PLT_AFFINITY = { profit: 0.7, love: 0.6, tax: 0.3 };

async function skill_social_post(input, brain, memory) {
    const content = input.content || input.text || '';
    const platforms = input.platforms || ['bluesky', 'mastodon'];
    const media = input.media || [];
    const projectDir = input.projectDir || process.cwd();
    const sourcePlatform = input.sourcePlatform || 'bluesky';

    if (!content) {
        return Promise.resolve({
            skill: 'social_post',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No content provided',
            timestamp: Date.now(),
        });
    }

    const queueEntry = bridge.queue(projectDir, {
        content,
        platforms,
        scheduled: input.scheduled || null,
    });

    let publishResults = null;
    if (input.publishNow || input.postNow || input.crossPostNow) {
        try {
            const poster = new CrossPoster(brain || { dataDir: path.join(projectDir, '.allie-brain-v2') });
            publishResults = await poster.crossPost(content, sourcePlatform);
        } catch (e) {
            publishResults = { error: e.message };
        }

        try {
            bridge.publishBatch(projectDir, queueEntry.id);
        } catch (e) {}
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `Social post queued: ${queueEntry.id}`,
            weight: 0.5,
            tags: ['skill', 'social_post', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'social_post',
        plt_affinity: PLT_AFFINITY,
        status: publishResults ? 'published' : 'queued',
        queue_id: queueEntry.id,
        queue_entry: queueEntry,
        content_preview: content.substring(0, 100),
        platforms,
        has_media: media.length > 0,
        character_count: content.length,
        estimated_posts: Math.ceil(content.length / 280),
        publish_results: publishResults,
        next_step: publishResults ? 'Cross-posting completed or queued' : 'Queue through Allie bridge and publish when approved',
        timestamp: Date.now(),
    });
}

module.exports = { skill_social_post, PLT_AFFINITY };

