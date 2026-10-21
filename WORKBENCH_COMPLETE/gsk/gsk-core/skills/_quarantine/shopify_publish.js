module.exports.MANIFEST = {
    name: 'shopify_publish',
    description: 'Skill: shopify_publish',
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
const ShopifyBlogAgent = require(path.join(__dirname, '..', '..', '..', 'lib', 'shopify-blog.js'));

const PLT_AFFINITY = { profit: 0.8, love: 0.4, tax: 0.2 };

function _slugify(value) {
    return String(value || 'shopify-draft')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'shopify-draft';
}

function _markdownToHtml(markdown) {
    return `<div>${String(markdown || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br>')}</div>`;
}

async function skill_shopify_publish(input, brain, memory) {
    const title = input.title || input.topic || 'Untitled';
    const body = input.body || input.content || input.markdown || '';
    const tags = input.tags || [];
    const publish = input.publish === true || input.autoPublish === true;
    const projectDir = input.projectDir || process.cwd();
    const outputDir = input.outputDir || path.join(projectDir, 'generated', 'shopify');
    const draftBase = _slugify(title);
    const draftPath = input.outputPath || path.join(outputDir, `${draftBase}.md`);

    const agent = new ShopifyBlogAgent(brain, { gsk: brain?.gsk || null });

    let markdown = body;
    let html = input.bodyHtml || '';
    let generated = null;

    if (!markdown) {
        try {
            generated = await agent.generateContent(title);
            markdown = generated?.markdown || generated?.body || '';
            html = generated?.body || html;
        } catch (e) {}
    }

    if (!markdown) {
        return Promise.resolve({
            skill: 'shopify_publish',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No content provided',
            timestamp: Date.now(),
        });
    }

    if (!html) html = _markdownToHtml(markdown);

    try {
        const dir = path.dirname(draftPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(draftPath, markdown, 'utf8');
    } catch (e) {
        return Promise.resolve({
            skill: 'shopify_publish',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            timestamp: Date.now(),
        });
    }

    let publishResult = null;
    if (publish) {
        try {
            publishResult = await agent.post(title, html);
        } catch (e) {
            publishResult = { posted: false, error: e.message };
        }
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `Shopify draft saved: ${draftPath}`,
            weight: 0.6,
            tags: ['skill', 'shopify_publish', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'shopify_publish',
        plt_affinity: PLT_AFFINITY,
        status: publishResult?.posted ? 'published' : 'draft_saved',
        title,
        body_length: markdown.length,
        tags,
        handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        markdown,
        html,
        draft_path: draftPath,
        publish_result: publishResult,
        next_step: publish ? 'Published via ShopifyBlogAgent' : 'Draft saved; publish requires explicit publish flag',
        timestamp: Date.now(),
    });
}

module.exports = { skill_shopify_publish, PLT_AFFINITY };

