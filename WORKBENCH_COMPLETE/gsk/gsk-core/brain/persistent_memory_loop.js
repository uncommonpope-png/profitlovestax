'use strict';

const fs = require('fs');
const path = require('path');

/**
 * PERSISTENT MEMORY LOOP — DeepAgents pattern.
 *
 * Reads back from GSK's own memory stores (knowledge.jsonl, journal.json,
 * goals.json, compiled_lessons.jsonl) and injects a RAG-style context slice
 * into the system prompt via kernelCtx.summaryContext.
 *
 * This closes the gap: GSK writes observations/insights but never reads them back.
 */
class PersistentMemoryLoop {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.dataPath = options.dataPath || path.join(__dirname, '../../data/gsk');
        this.maxContextTokens = options.maxContextTokens || 3000;
        this.rebuildInterval = options.rebuildInterval || 300000; // 5 min
        this.lastSummary = '';
        this.cache = { summary: '', timestamp: 0 };
    }

    /**
     * Build a context summary from all memory stores.
     * This gets injected into the LLM system prompt / kernelCtx.summaryContext.
     */
    async buildSummary() {
        const now = Date.now();
        if (now - this.cache.timestamp < this.rebuildInterval) {
            return this.cache.summary;
        }

        const sections = [];

        // 1. From goals.json — recent completed/failed goals (learning signal)
        const goals = this._readJsonlLines(path.join(this.dataPath, 'goals.json'));
        const recentGoals = goals.slice(-10);
        const completedGoals = recentGoals.filter(g => g.status === 'completed');
        const failedGoals = recentGoals.filter(g => g.status === 'failed' || g.status === 'needs_brain');
        if (completedGoals.length > 0) {
            sections.push('## Recent Completed Work\n' +
                completedGoals.slice(-5).map(g => `- ${g.title || g.description}`).join('\n'));
        }
        if (failedGoals.length > 0) {
            sections.push('## Recent Failures (learning)\n' +
                failedGoals.slice(-5).map(g => `- ${g.title || g.description} [${g.status}]`).join('\n'));
        }

        // 2. From knowledge.jsonl — recent verified web research
        const knowledge = this._readJsonl(path.join(this.dataPath, 'knowledge.jsonl'));
        const recentKnowledge = knowledge.slice(-20);
        const verifiedResearch = recentKnowledge.filter(k => k.verified || k.source === 'steward');
        if (verifiedResearch.length > 0) {
            sections.push('## Verified Research\n' +
                verifiedResearch.slice(-10).map(k => `- ${k.topic || k.title || ''}`).join('\n'));
        }

        // 3. From journal.json — recent reflections
        const journal = this._readJsonl(path.join(this.dataPath, 'journal.json'));
        const recentEntries = journal.slice(-10);
        if (recentEntries.length > 0) {
            sections.push('## Recent Reflections\n' +
                recentEntries.map(j => `- ${j.title || j.topic || ''}`.substring(0, 200)).join('\n'));
        }

        // 4. From compiled_lessons.jsonl — lessons learned
        const lessons = this._readJsonl(path.join(this.dataPath, 'compiled_lessons.jsonl'));
        if (lessons.length > 0) {
            sections.push('## Compiled Lessons\n' +
                lessons.slice(-5).map(l => `- ${l.lesson || l.content || JSON.stringify(l).substring(0, 150)}`).join('\n'));
        }

        // 5. From insights.jsonl — previously surfaced insights (dedup signal)
        const insights = this._readJsonl(path.join(this.dataPath, 'insights.jsonl'));
        if (insights.length > 0) {
            sections.push('## Previously Surfaced Insights (DO NOT REDERIVE)\n' +
                insights.slice(-10).map(i => `- ${i.summary || ''}`).join('\n'));
        }

        // 6. WORKBENCH AWARENESS — break dashboard loop (GSK thinks he must BUILD dashboard, but he HAS one)
        // Workbench IS his live dashboard at :3000 — 511 static HTML files in public/ are redundant ghosts
        sections.push('## YOUR LIVE DASHBOARD ALREADY EXISTS — STOP BUILDING REDUNDANT ONES\n' +
            '- Workbench at http://127.0.0.1:3000 IS your telemetry dashboard (GskMindTab, GskStreamTab, BeingTab, SeshatTab via SSE)\n' +
            '- You have 511 HTML files in gsk/public/ — NONE are live, NONE have WebSocket/API, ALL are dead artifacts\n' +
            '- DO NOT propose new telemetry dashboards. Instead: feed LIVE telemetry via /api/gsk/context and /api/gsk/events (SSE)\n' +
            '- If you must visualize, write to the Workbench API, not to public/*.html — your thoughts already stream live at :3002 thoughtStream.js');

        const summary = sections.join('\n\n---\n');
        this.cache = { summary, timestamp: now };
        return summary;
    }

    /**
     * DeepAgents pattern: offload long tool outputs to disk.
     * When a tool result is too long, summarize and store a reference
     * instead of injecting the full output into context.
     */
    async offloadOutput(toolName, output) {
        const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        if (outputStr.length < 2000) return outputStr; // small enough to keep

        // Summarize + store reference
        const hash = this._hash(outputStr);
        const offloadPath = path.join(this.dataPath, 'offloaded', hash + '.txt');
        try {
            fs.mkdirSync(path.dirname(offloadPath), { recursive: true });
            fs.writeFileSync(offloadPath, outputStr);
        } catch (e) { /* best-effort */ }

        // Use brain to summarize if available
        let summary = `[Output offloaded to ${hash}.txt — ${outputStr.length} chars]`;
        if (this.kernel && this.kernel.brain && typeof this.kernel.brain.think === 'function') {
            try {
                summary = await this.kernel.brain.think(
                    `Summarize this tool output in 3 sentences:\n\n${outputStr.substring(0, 3000)}`,
                    '', 0.3, { isolated: true }
                );
            } catch (e) { /* keep default summary */ }
        }

        return summary || summary;
    }

    _readJsonl(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return content.split('\n').filter(l => l.trim()).map(l => {
                try { return JSON.parse(l); } catch { return null; }
            }).filter(Boolean);
        } catch (e) { return []; }
    }

    _readJsonlLines(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (e) { return []; }
    }

    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
}

module.exports = { PersistentMemoryLoop };
