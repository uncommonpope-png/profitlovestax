'use strict';

const { chromium } = require('playwright');

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_webapp_testing(input) {
    const action = input.action || 'test';
    const target = input.target || input.url || '';

    if (action === 'test') {
        return runTests(target, input.test_types || ['functional'], input.options || {});
    }

    if (action === 'screenshot') {
        return takeScreenshots(target, input.pages || []);
    }

    if (action === 'health') {
        return checkHealth(target);
    }

    if (action === 'report') {
        return generateReport(input.test_run_id);
    }

    return {
        skill: 'webapp_testing',
        plt_affinity: PLT_AFFINITY,
        error: `Unknown action: ${action}`,
        available: ['test', 'screenshot', 'health', 'report'],
        timestamp: Date.now(),
    };
}

async function launchBrowser() {
    return await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
}

async function runTests(target, testTypes, options) {
    const results = [];
    const errors = [];
    const startTime = Date.now();

    if (!target) {
        return {
            skill: 'webapp_testing',
            plt_affinity: PLT_AFFINITY,
            action: 'test',
            error: 'No target URL provided',
            timestamp: Date.now(),
        };
    }

    let browser;
    try {
        browser = await launchBrowser();
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
        });
        const page = await context.newPage();

        for (const type of testTypes) {
            try {
                if (type === 'functional') {
                    const result = await runFunctionalTests(page, target, options);
                    results.push(result);
                } else if (type === 'performance') {
                    const result = await runPerformanceTest(page, target);
                    results.push(result);
                } else if (type === 'accessibility') {
                    const result = await runAccessibilityCheck(page, target);
                    results.push(result);
                } else if (type === 'seo') {
                    const result = await runSEOCheck(page, target);
                    results.push(result);
                } else {
                    results.push({
                        type,
                        passed: 0,
                        failed: 1,
                        errors: [`Unknown test type: ${type}`],
                        duration_ms: 0,
                    });
                }
            } catch (e) {
                errors.push(`${type}: ${e.message}`);
                results.push({ type, passed: 0, failed: 1, errors: [e.message], duration_ms: 0 });
            }
        }

        await context.close();
    } catch (e) {
        errors.push(`browser: ${e.message}`);
    } finally {
        if (browser) await browser.close();
    }

    const totalPassed = results.reduce((s, r) => s + (r.passed || 0), 0);
    const totalFailed = results.reduce((s, r) => s + (r.failed || 0), 0);

    return {
        skill: 'webapp_testing',
        plt_affinity: PLT_AFFINITY,
        action: 'test',
        target,
        test_run_id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        results,
        total_passed: totalPassed,
        total_failed: totalFailed,
        duration_ms: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: Date.now(),
    };
}

async function runFunctionalTests(page, target, options) {
    const checks = options.checks || ['load', 'title', 'status'];
    let passed = 0;
    let failed = 0;
    const details = [];

    try {
        const resp = await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
        const status = resp ? resp.status() : 0;

        details.push({ check: 'page_load', passed: status >= 200 && status < 400, detail: `HTTP ${status}` });
        if (status >= 200 && status < 400) passed++; else failed++;

        if (checks.includes('title')) {
            const title = await page.title();
            const hasTitle = title && title.length > 0;
            details.push({ check: 'title', passed: hasTitle, detail: `"${title || 'empty'}"` });
            if (hasTitle) passed++; else failed++;
        }

        if (checks.includes('content')) {
            const bodyText = await page.evaluate(() => document.body?.innerText?.length || 0);
            const hasContent = bodyText > 50;
            details.push({ check: 'content', passed: hasContent, detail: `${bodyText} chars` });
            if (hasContent) passed++; else failed++;
        }

        if (checks.includes('links')) {
            const links = await page.evaluate(() => document.querySelectorAll('a[href]').length);
            const hasLinks = links > 0;
            details.push({ check: 'links', passed: hasLinks, detail: `${links} links found` });
            if (hasLinks) passed++; else failed++;
        }

        if (checks.includes('console')) {
            const consoleErrors = [];
            page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
            await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
            const clean = consoleErrors.length === 0;
            details.push({ check: 'console_errors', passed: clean, detail: `${consoleErrors.length} errors` });
            if (clean) passed++; else failed++;
        }
    } catch (e) {
        details.push({ check: 'navigation', passed: false, detail: e.message });
        failed++;
    }

    return {
        type: 'functional',
        passed,
        failed,
        checks: details,
        duration_ms: 0,
    };
}

async function runPerformanceTest(page, target) {
    const metrics = {};
    try {
        await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
        const perf = await page.evaluate(() => {
            const p = performance;
            return {
                domContentLoaded: p.timing ? p.timing.domContentLoadedEventEnd - p.timing.navigationStart : 0,
                load: p.timing ? p.timing.loadEventEnd - p.timing.navigationStart : 0,
                domInteractive: p.timing ? p.timing.domInteractive - p.timing.navigationStart : 0,
            };
        });
        Object.assign(metrics, perf);
    } catch (e) {
        return { type: 'performance', passed: 0, failed: 1, errors: [e.message], duration_ms: 0 };
    }

    const loadOK = metrics.load < 5000;
    const domOK = metrics.domContentLoaded < 3000;

    return {
        type: 'performance',
        passed: (loadOK ? 1 : 0) + (domOK ? 1 : 0),
        failed: (loadOK ? 0 : 1) + (domOK ? 0 : 1),
        metrics,
        duration_ms: metrics.load || 0,
    };
}

async function runAccessibilityCheck(page, target) {
    try {
        await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
        const issues = await page.evaluate(() => {
            const issues = [];
            const imgs = document.querySelectorAll('img:not([alt])');
            if (imgs.length > 0) issues.push(`${imgs.length} images missing alt text`);
            const headings = document.querySelectorAll('h1, h2, h3');
            if (headings.length === 0) issues.push('No heading structure found');
            const lang = document.documentElement.lang;
            if (!lang) issues.push('No lang attribute on <html>');
            return issues;
        });
        return {
            type: 'accessibility',
            passed: Math.max(0, 3 - issues.length),
            failed: issues.length,
            issues,
            duration_ms: 0,
        };
    } catch (e) {
        return { type: 'accessibility', passed: 0, failed: 1, errors: [e.message], duration_ms: 0 };
    }
}

async function runSEOCheck(page, target) {
    try {
        await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });
        const seo = await page.evaluate(() => {
            const meta = {};
            document.querySelectorAll('meta').forEach(m => {
                const name = m.getAttribute('name') || m.getAttribute('property') || '';
                const content = m.getAttribute('content') || '';
                if (name) meta[name] = content;
            });
            return {
                title: document.title,
                description: meta.description || '',
                ogTitle: meta['og:title'] || '',
                ogDescription: meta['og:description'] || '',
                viewport: meta.viewport || '',
                hasRobots: !!meta.robots,
                canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
            };
        });
        let passed = 0;
        const checks = [];
        if (seo.title) { passed++; checks.push({ check: 'title', passed: true }); } else { checks.push({ check: 'title', passed: false }); }
        if (seo.description) { passed++; checks.push({ check: 'description', passed: true }); } else { checks.push({ check: 'description', passed: false }); }
        if (seo.ogTitle) { passed++; checks.push({ check: 'og_title', passed: true }); } else { checks.push({ check: 'og_title', passed: false }); }
        return {
            type: 'seo',
            passed,
            failed: 3 - passed,
            seo,
            checks,
            duration_ms: 0,
        };
    } catch (e) {
        return { type: 'seo', passed: 0, failed: 1, errors: [e.message], duration_ms: 0 };
    }
}

async function takeScreenshots(target, pages) {
    if (!target) {
        return {
            skill: 'webapp_testing',
            plt_affinity: PLT_AFFINITY,
            action: 'screenshot',
            error: 'No target URL provided',
            timestamp: Date.now(),
        };
    }

    const allPages = pages.length > 0 ? pages : ['/'];
    const screenshots = [];
    let browser;

    try {
        browser = await launchBrowser();
        const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();

        for (const route of allPages) {
            const url = route.startsWith('http') ? route : target.replace(/\/+$/, '') + '/' + route.replace(/^\//, '');
            try {
                await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
                const fileName = `screenshot_${route.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                const filePath = require('path').join(__dirname, '../../data/screenshots', fileName);
                require('fs').mkdirSync(require('path').join(__dirname, '../../data/screenshots'), { recursive: true });
                await page.screenshot({ path: filePath, fullPage: true });
                screenshots.push({
                    page: route,
                    file: filePath,
                    width: 1280,
                    height: 720,
                    timestamp: Date.now(),
                });
            } catch (e) {
                screenshots.push({ page: route, error: e.message });
            }
        }

        await context.close();
    } catch (e) {
        return {
            skill: 'webapp_testing',
            plt_affinity: PLT_AFFINITY,
            action: 'screenshot',
            target,
            error: e.message,
            screenshots,
            timestamp: Date.now(),
        };
    } finally {
        if (browser) await browser.close();
    }

    return {
        skill: 'webapp_testing',
        plt_affinity: PLT_AFFINITY,
        action: 'screenshot',
        target,
        screenshots,
        count: screenshots.length,
        timestamp: Date.now(),
    };
}

async function checkHealth(target) {
    if (!target) {
        return {
            skill: 'webapp_testing',
            plt_affinity: PLT_AFFINITY,
            action: 'health',
            error: 'No target URL provided',
            timestamp: Date.now(),
        };
    }

    let browser;
    try {
        browser = await launchBrowser();
        const context = await browser.newContext();
        const page = await context.newPage();

        const start = Date.now();
        const resp = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const loadTime = Date.now() - start;
        const status = resp ? resp.status() : 0;
        const contentType = resp ? resp.headers()['content-type'] || '' : '';

        await context.close();

        return {
            skill: 'webapp_testing',
            plt_affinity: PLT_AFFINITY,
            action: 'health',
            target,
            status,
            content_type: contentType,
            load_time_ms: loadTime,
            online: status >= 200 && status < 500,
            timestamp: Date.now(),
        };
    } catch (e) {
        return {
            skill: 'webapp_testing',
            plt_affinity: PLT_AFFINITY,
            action: 'health',
            target,
            online: false,
            error: e.message,
            timestamp: Date.now(),
        };
    } finally {
        if (browser) await browser.close();
    }
}

async function generateReport(testRunId) {
    return {
        skill: 'webapp_testing',
        plt_affinity: PLT_AFFINITY,
        action: 'report',
        test_run_id: testRunId,
        summary: {
            total_tests: 0,
            passed: 0,
            failed: 0,
            duration_seconds: 0,
            coverage: 'N/A',
        },
        note: 'Full report requires a completed test run. Use action "test" first.',
        timestamp: Date.now(),
    };
}

module.exports = { skill_webapp_testing };
