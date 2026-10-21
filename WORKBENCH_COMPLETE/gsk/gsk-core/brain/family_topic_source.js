'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const GSK_DIR = path.join(DATA_DIR, 'gsk');

let _cache = null;
let _lastRefresh = 0;
const REFRESH_INTERVAL = 120000;

function _readJsonl(filePath, limit = 50) {
    try {
        if (!fs.existsSync(filePath)) return [];
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).slice(-limit);
        return lines.map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
    } catch { return []; }
}

function _readJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const stats = fs.statSync(filePath);
        if (stats.size > 1048576) {
            const fd = fs.openSync(filePath, 'r');
            const startPos = stats.size - 1048576;
            const buf = Buffer.alloc(1048576);
            fs.readSync(fd, buf, 0, 1048576, startPos);
            fs.closeSync(fd);
            let content = buf.toString('utf8');
            const openBr = content.indexOf('[');
            const closeBr = content.lastIndexOf(']');
            if (openBr >= 0 && closeBr > openBr) {
                content = '[' + content.substring(openBr + 1, closeBr) + ']';
            }
            return JSON.parse(content);
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch { return null; }
}

function _extractTopics() {
    const topics = new Set();

    // 1. FAILED GOALS → evolve them
    const goals = _readJson(path.join(GSK_DIR, 'goals.json'));
    if (goals && Array.isArray(goals)) {
        const failed = goals.filter(g => g.status === 'failed').slice(-10);
        for (const g of failed) {
            if (g.title) topics.add(`Fix: ${g.title.substring(0, 60)} — ${g.error || 'unknown error'}`);
        }
        const stalled = goals.filter(g => g.status === 'active' && g.updatedAt && Date.now() - g.updatedAt > 86400000).slice(-5);
        for (const g of stalled) {
            if (g.title) topics.add(`Unblock: ${g.title.substring(0, 60)} — stalled ${Math.round((Date.now() - g.updatedAt)/86400000)}d`);
        }
    }

    // 2. MISSING TOOLS from catalog
    try {
        const catalog = _readJson(path.join(GSK_DIR, 'tool_catalog.json'));
        if (catalog?.tools) {
            const missing = catalog.tools.filter(t => !t.implemented).slice(-5);
            for (const t of missing) {
                topics.add(`Implement tool: ${t.name} — ${t.description?.substring(0, 60) || 'no description'}`);
            }
        }
    } catch {}

    // 3. PROFIT DIRECTIVES from bus (PRIORITY 0)
    const events = _readJson(path.join(GSK_DIR, 'family_event_log.json'));
    if (events && Array.isArray(events)) {
        const recent = events.filter(e => e.timestamp > Date.now() - 3600000); // last hour
        for (const e of recent) {
            if (e.event === 'profit_directive' && e.payload?.action) {
                topics.add(`Execute: ${e.payload.action}`);
            }
            if (e.event === 'agent.chat' && e.from === 'profit' && e.payload?.message) {
                topics.add(`Profit asks: ${e.payload.message.substring(0, 80)}`);
            }
        }
    }

    // 4. SYSTEM GAPS from project analysis
    try {
        const project = _readJson(path.join(GSK_DIR, 'project_analysis.json'));
        if (project?.gaps) {
            for (const gap of project.gaps.slice(-5)) {
                topics.add(`Close gap: ${gap}`);
            }
        }
        if (project?.testCoverage !== undefined && project.testCoverage < 0.8) {
            topics.add(`Increase test coverage from ${Math.round(project.testCoverage*100)}% to 80%+`);
        }
        if (project?.buildStatus === 'failing') {
            topics.add('Fix failing build');
        }
    } catch {}

    // 5. KNOWLEDGE GAPS — topics mentioned but not implemented
    const knowledge = _readJsonl(path.join(DATA_DIR, 'knowledge.jsonl'), 50);
    const mentioned = new Set();
    const implemented = new Set();
    for (const e of knowledge) {
        if (e.topic) mentioned.add(e.topic.toLowerCase());
        if (e.implemented) implemented.add(e.topic.toLowerCase());
    }
    for (const m of mentioned) {
        if (!implemented.has(m)) {
            topics.add(`Implement: ${m}`);
        }
    }

    // 6. RECURSIVE SELF-IMPROVEMENT
    const self = _readJsonl(path.join(GSK_DIR, 'self_improvement_log.jsonl'), 20);
    for (const e of self) {
        if (e.nextStep) topics.add(e.nextStep);
    }

    return [...topics].slice(0, 20);
}

function _extractKeywords() {
    const keywords = new Set();
    const topics = _extractTopics();
    for (const t of topics) {
        const words = t.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        for (const w of words) keywords.add(w);
    }
    return [...keywords];
}

function _extractGitHubTopics() {
    const githubTopics = new Set();
    const knowledge = _readJsonl(path.join(DATA_DIR, 'knowledge.jsonl'), 30);
    for (const e of knowledge) {
        if (e.topic && e.topic.includes('github')) {
            const parts = e.topic.split('/');
            if (parts.length >= 2) githubTopics.add(parts[1]);
        }
    }
    const webIntel = _readJsonl(path.join(DATA_DIR, 'web-intel.jsonl'), 20);
    for (const e of webIntel) {
        if (e.topic) {
            const words = e.topic.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
            for (const w of words) githubTopics.add(w);
        }
    }
    return [...githubTopics].slice(0, 30);
}

function getTopics() {
    if (_cache && Date.now() - _lastRefresh < REFRESH_INTERVAL) return _cache;
    _cache = _extractTopics();
    _lastRefresh = Date.now();
    return _cache;
}

function getKeywords() {
    return _extractKeywords();
}

function getGitHubTopics() {
    return _extractGitHubTopics();
}

function getRandomTopic(prefix = '') {
    const topics = getTopics();
    if (topics.length === 0) return null;
    const t = topics[Math.floor(Math.random() * topics.length)];
    return prefix ? prefix + ': ' + t : t;
}

function getRandomTopics(count = 5, prefix = '') {
    const all = getTopics();
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(t => prefix ? prefix + ': ' + t : t);
}

function getNovelKeywords() {
    const existing = new Set(_extractKeywords());
    const novel = [];
    const potentialNovel = [
        'quantum', 'bio', 'swarm', 'federated', 'adversarial', 'neuro',
        'genetic', 'evolutionary', 'topology', 'manifold', 'bayesian',
        'causal', 'counterfactual', 'metamorphic', 'holographic', 'fractal',
        'reservoir', 'spiking', 'morphogenetic', 'morphological', 'allostatic',
        'homeostatic', 'cybernetic', 'autopoietic', 'enactivism', 'umwelt',
        'affordance', 'stigmergy', 'superorganism', 'holobiont', 'symbiogenesis'
    ];
    for (const w of potentialNovel) {
        if (!existing.has(w)) novel.push(w);
    }
    return novel.length > 0 ? novel : potentialNovel;
}

module.exports = {
    getTopics,
    getKeywords,
    getGitHubTopics,
    getRandomTopic,
    getRandomTopics,
    getNovelKeywords,
    _readJsonl,
    _readJson,
};
