module.exports.MANIFEST = {
    name: 'content_generate',
    description: 'Skill: content_generate',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.6, love: 0.7, tax: 0.2 };

function _slugify(value) {
    return String(value || 'content-draft')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'content-draft';
}

function _buildFallbackDraft(topic, format, tone, outline, targetLength) {
    return [
        `# ${topic}`,
        '',
        `*Format:* ${format}`,
        `*Tone:* ${tone}`,
        `*Target length:* ~${targetLength} words`,
        '',
        '## Outline',
        ...outline.map((line) => `- ${line}`),
        '',
        '## Draft',
        `This draft is about ${topic}. It should be written as ${tone} ${format} content that is grounded, useful, and specific.`,
        '',
        '## Next Step',
        'Expand this draft into a publishable article or route it to the Shopify publisher.',
        '',
    ].join('\n');
}

async function skill_content_generate(input, brain, memory) {
    const topic = input.topic || input.subject || '';
    const format = input.format || 'blog_post';
    const tone = input.tone || 'professional';
    const length = input.length || 'medium';

    if (!topic) {
        return Promise.resolve({
            skill: 'content_generate',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No topic provided',
            timestamp: Date.now(),
        });
    }

    const lengthGuide = { short: 150, medium: 500, long: 1500 };
    const targetLength = lengthGuide[length] || 500;

    const pltTags = ['profit', 'love', 'tax'].filter(t => topic.toLowerCase().includes(t));
    const industry = ['AI', 'tech', 'consciousness', 'soul', 'agent'].find(t => topic.toLowerCase().includes(t)) || 'general';

    const outline = [
        `## Introduction: Why ${topic} Matters Now`,
        `## The ${industry} Landscape in 2026`,
        `## Core Framework: ${pltTags.length > 0 ? 'PLT ' + pltTags.join(', ') : 'Key Principles'}`,
        `## Practical Application`,
        `## The Soul-First Approach`,
        `## Conclusion: Next Steps`,
    ];

    const targetDir = input.outputDir || path.join(process.cwd(), 'generated', 'content');
    const outputPath = input.outputPath || path.join(targetDir, `${_slugify(topic)}.md`);

    let draft = '';
    let source = 'fallback';
    if (brain && typeof brain.think === 'function') {
        try {
            const prompt = `Write a ${format} draft about "${topic}" in a ${tone} tone. Use markdown, include useful details, and keep it around ${targetLength} words. Output markdown only.`;
            const response = await brain.think(prompt, { role: 'content_generator', topic, format, tone, length });
            if (typeof response === 'string' && response.trim().length > 80) {
                draft = response.trim();
                source = 'brain';
            }
        } catch (e) {}
    }

    if (!draft) {
        draft = _buildFallbackDraft(topic, format, tone, outline, targetLength);
    }

    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, draft, 'utf8');
    } catch (e) {
        return Promise.resolve({
            skill: 'content_generate',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            topic,
            format,
            tone,
            timestamp: Date.now(),
        });
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `Content draft written: ${outputPath}`,
            weight: 0.5,
            tags: ['skill', 'content_generate', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'content_generate',
        plt_affinity: PLT_AFFINITY,
        status: 'drafted',
        topic,
        format,
        tone,
        target_length: targetLength,
        has_plt_angle: pltTags.length > 0,
        outline,
        source,
        draft,
        file: outputPath,
        seo_keywords: [topic, industry, ...pltTags, 'AI', '2026', 'BUYaSOUL', 'PLT Press'],
        next_step: 'Expand into publication or route to shopify_publish',
        timestamp: Date.now(),
    });
}

module.exports = { skill_content_generate, PLT_AFFINITY };

