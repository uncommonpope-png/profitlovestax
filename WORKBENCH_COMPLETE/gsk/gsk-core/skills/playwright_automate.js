module.exports.MANIFEST = {
    name: 'playwright_automate',
    description: 'Skill: playwright_automate',
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

const PLT_AFFINITY = { profit: 0.6, love: 0.3, tax: 0.4 };

function _slugify(value) {
    return String(value || 'playwright-task')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'playwright-task';
}

function skill_playwright_automate(input, brain, memory) {
    const task = input.task || input.description || '';
    const url = input.url || 'https://example.com';
    const steps = input.steps || [];

    if (!task && steps.length === 0) {
        return Promise.resolve({
            skill: 'playwright_automate',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No automation task or steps provided',
            timestamp: Date.now(),
        });
    }

    const stepCode = steps.map((s, i) => {
        const action = s.action || 'goto';
        const selector = s.selector || '';
        const value = s.value || '';
        switch (action) {
            case 'click': return `  await page.click('${selector}'); // step ${i + 1}`;
            case 'type': return `  await page.fill('${selector}', '${value}'); // step ${i + 1}`;
            case 'wait': return `  await page.waitForSelector('${selector}', { timeout: 5000 }); // step ${i + 1}`;
            case 'screenshot': return `  await page.screenshot({ path: 'screenshot-${i}.png' }); // step ${i + 1}`;
            case 'extract': return `  const text_${i} = await page.textContent('${selector}'); // step ${i + 1}`;
            case 'goto': return `  await page.goto('${value || url}'); // step ${i + 1}`;
            default: return `  // step ${i + 1}: ${action} on ${selector}`;
        }
    }).join('\n');

    const script = steps.length > 0 ? stepCode : `  // Generated from: ${task}\n  await page.goto('${url}');\n  await page.waitForLoadState('networkidle');\n  console.log('Task completed:', await page.title());`;

    const fullScript = `const { chromium } = require('playwright');\n\n(async () => {\n  const browser = await chromium.launch({ headless: true });\n  const page = await browser.newPage();\n\n${script}\n\n  await browser.close();\n})();\n`;

    const outputDir = input.outputDir || path.join(process.cwd(), 'generated', 'automation');
    const outputPath = input.outputPath || path.join(outputDir, `${_slugify(task || url)}.js`);

    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, fullScript, 'utf8');
    } catch (e) {
        return Promise.resolve({
            skill: 'playwright_automate',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            timestamp: Date.now(),
        });
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `Playwright script written: ${outputPath}`,
            weight: 0.5,
            tags: ['skill', 'playwright_automate', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'playwright_automate',
        plt_affinity: PLT_AFFINITY,
        status: 'written',
        task: task || `Automate ${url}`,
        url,
        steps: steps.length,
        script: fullScript,
        file: outputPath,
        lines: fullScript.split('\n').length,
        next_step: 'Run the generated script with Playwright installed',
        timestamp: Date.now(),
    });
}

module.exports = { skill_playwright_automate, PLT_AFFINITY };

