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
            const results = await this._queryOmniRouteSearch(topic);
            if (results && results.length > 0) {
                const summaryText = results.map(r => `• ${r.title}: ${r.snippet || r.content?.slice(0, 150)} (${r.url})`).join('\n');
                
                // 1. Store in web-intel.jsonl (P3.22: rotate — cap 500 entries so the
                // file never grows unbounded; readers only use the tail)
                const intelPath = path.join(__dirname, '../../data/web-intel.jsonl');
                const entry = JSON.stringify({ timestamp: new Date().toISOString(), topic, resultsCount: results.length, summary: summaryText }) + '\n';
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

                console.log(`[WebScoutDaemon] Research complete for "${topic}". ${results.length} hit(s) ingested.`);
            }
        } catch (e) {
            console.warn('[WebScoutDaemon] Scout pulse warning:', e.message);
        }
    }

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
                        resolve(parsed.results || parsed.data || []);
                    } catch {
                        resolve([]);
                    }
                });
            });

            req.on('error', () => resolve([]));
            req.on('timeout', () => { req.destroy(); resolve([]); });
            req.write(body);
            req.end();
        });
    }
}

module.exports = { WebScoutDaemon };
