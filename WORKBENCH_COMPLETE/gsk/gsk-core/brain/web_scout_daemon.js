'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { getRandomTopic } = require('./family_topic_source');

class WebScoutDaemon {
    constructor(being, options = {}) {
        this.being = being;
        this.intervalMs = options.intervalMs || 900000;
        this.timer = null;
        this.topics = [];
        this.currentTopicIndex = 0;
    }

    start() {
        if (this.timer) return;
        console.log('[WebScoutDaemon] Starting 15-minute continuous web research pulse...');
        // Run first pulse after 30 seconds
        setTimeout(() => this.scoutPulse(), 30000);
        this.timer = setInterval(() => this.scoutPulse(), this.intervalMs);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async scoutPulse() {
        const topic = getRandomTopic('web_research') || 'latest AI developments';
        console.log(`[WebScoutDaemon] Scouting topic: "${topic}"...`);

        try {
            // GSK fix sprint 2026-10-26, Tier-1 #19: OmniRoute is DOWN, and
            // the old code swallowed every failure into [] — every pulse
            // since has been silently empty (no log, no Scribe, no bus).
            // Now: failures are logged by reason, and an empty OmniRoute
            // result falls back to the web senses (searchSenses), whose
            // {title, url, snippet} shape matches the ingest below.
            const { results: omniResults, error: omniError } = await this._queryOmniRouteSearch(topic);
            let results = omniResults;
            let via = 'omniroute';
            if (!results || results.length === 0) {
                if (omniError) console.warn(`[WebScoutDaemon] OmniRoute search failed for "${topic}": ${omniError} — falling back to web senses`);
                else console.log(`[WebScoutDaemon] OmniRoute returned no results for "${topic}" — falling back to web senses`);
                try {
                    const { searchSenses } = require('./web_senses.js');
                    const fb = await searchSenses(topic, 3);
                    if (fb && fb.ok && fb.results && fb.results.length > 0) {
                        results = fb.results;
                        via = 'web_senses_fallback';
                    } else {
                        console.warn(`[WebScoutDaemon] Web-senses fallback also empty for "${topic}" (ok=${fb && fb.ok})`);
                    }
                } catch (e) {
                    console.warn('[WebScoutDaemon] Web-senses fallback threw:', e.message);
                }
            }
            if (results && results.length > 0) {
                const summaryText = results.map(r => `• ${r.title}: ${r.snippet || r.content?.slice(0, 150)} (${r.url})`).join('\n');
                
                // 1. Store in web-intel.jsonl (P3.22: rotate — cap 500 entries so the
                // file never grows unbounded; readers only use the tail)
                const intelPath = path.join(__dirname, '../../data/web-intel.jsonl');
                const entry = JSON.stringify({ timestamp: new Date().toISOString(), topic, resultsCount: results.length, via, summary: summaryText }) + '\n';
                fs.appendFileSync(intelPath, entry, 'utf-8');
                try {
                    const lines = fs.readFileSync(intelPath, 'utf-8').split('\n').filter(Boolean);
                    if (lines.length > 500) fs.writeFileSync(intelPath, lines.slice(-500).join('\n') + '\n', 'utf-8');
                } catch {}

                // 2. Feed SCRIBE
                if (this.being?.scribe?.record) {
                    this.being.scribe.record({
                        type: 'web_scout_intel',
                        summary: `Web Scout researched "${topic}" — found ${results.length} fresh external references.`,
                        tags: ['web_scout', 'external_intel', 'learning'],
                        weight: 0.7
                    });
                }

                // 3. Publish to Bus
                if (this.being?.bus?.publish) {
                    this.being.bus.publish('knowledge.learn', {
                        topic,
                        resultsCount: results.length,
                        summary: summaryText,
                        source: 'web_scout_daemon'
                    });
                }

                console.log(`[WebScoutDaemon] Research complete for "${topic}". ${results.length} hit(s) ingested via ${via}.`);
            }
        } catch (e) {
            console.warn('[WebScoutDaemon] Scout pulse warning:', e.message);
        }
    }

    // Resolves { results, error }: error is null on a clean round-trip
    // (even when the provider legitimately returns zero results) and a
    // reason string on transport/parse failure — the old []-on-everything
    // shape is what made failures invisible.
    _queryOmniRouteSearch(topic) {
        return new Promise((resolve) => {
            const body = JSON.stringify({ query: topic, limit: 3 });
            const req = http.request({
                hostname: '127.0.0.1',
                port: 20128,
                path: '/v1/search',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NINE_ROUTER_API_KEY || 'test'}`,
                    'Content-Length': Buffer.byteLength(body)
                },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ results: parsed.results || parsed.data || [], error: null });
                    } catch {
                        resolve({ results: [], error: 'unparseable OmniRoute response' });
                    }
                });
            });

            req.on('error', (e) => resolve({ results: [], error: `OmniRoute request failed: ${e.message}` }));
            req.on('timeout', () => { req.destroy(); resolve({ results: [], error: 'OmniRoute request timed out' }); });
            req.write(body);
            req.end();
        });
    }
}

module.exports = { WebScoutDaemon };
