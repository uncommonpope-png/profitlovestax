'use strict';

/**
 * LESSON-INJECTOR — Phase 5: proactive scholar engine.
 * Before the planner generates steps, recall past autopsy lessons from
 * SCRIBE (keyword fan-out — proven in Memory Gate) and format them as a
 * hard "do not repeat" block injected into the planning prompt.
 *
 * Governor schema, Verifier-corrected:
 *  - POST /recall {query, limit} (live route; GET variant doesn't exist)
 *  - lessons are flat records {type:'lesson', content, source, timestamp}
 *  - transport reuse: same key + fan-out pattern as scribe_bridge/AgentComms
 */

const http = require('http');

class LessonInjector {
    constructor(options = {}) {
        this.scribeUrl = options.scribeUrl || process.env.SCRIBE_URL || 'http://127.0.0.1:4000';
        this.apiKey = options.apiKey || process.env.SCRIBE_KEY || 'scribe-master-key-2026';
        this.maxLessons = options.maxLessons || 4;
        this.timeoutMs = options.timeoutMs || 2500;
    }

    _keywords(text) {
        const STOP = new Set(('the a an and or of to in on for with what how why is are was were do does did you your my i me we us it ' +
            'this that about from at as be have has had not but so if then they them their there here who which when where will would can could should now just please').split(/\s+/));
        return [...new Set(
            String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
                .filter(w => w.length > 3 && !STOP.has(w))
        )].slice(0, 4);
    }

    async _recallOne(kw) {
        const body = JSON.stringify({ query: kw, limit: 3 });
        return await new Promise((resolve) => {
            let u;
            try { u = new URL(this.scribeUrl.replace(/\/+$/, '') + '/recall'); } catch { return resolve(null); }
            const req = http.request(u, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'X-API-Key': this.apiKey,
                },
                timeout: this.timeoutMs,
            }, res => {
                let raw = '';
                res.on('data', c => raw += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(raw)); } catch { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            req.write(body);
            req.end();
        });
    }

    /** Returns [{content, source, type, timestamp}] deduped, lesson-flavored first. */
    async fetchRelevantLessons(goalTitle, stepContext = '') {
        try {
            const kws = this._keywords(`${goalTitle} ${stepContext}`);
            if (kws.length === 0) return [];
            const settled = await Promise.allSettled(kws.map(kw => Promise.race([
                this._recallOne(kw),
                new Promise(res => setTimeout(() => res(null), this.timeoutMs)),
            ])));
            const seen = new Set();
            const lessons = [];
            for (const s of settled) {
                const val = s.status === 'fulfilled' ? s.value : null;
                const arr = val && Array.isArray(val.results) ? val.results : [];
                for (const m of arr) {
                    if (!m || seen.has(m.id)) continue;
                    seen.add(m.id);
                    const isLesson = m.type === 'lesson' || /fail|error|lesson/i.test(String(m.content).slice(0, 60));
                    lessons.push({ priority: isLesson ? 0 : 1, ...m });
                }
            }
            lessons.sort((a, b) => a.priority - b.priority);
            console.log(`[LESSON-INJECTOR] recalled ${lessons.length} record(s) for keywords [${kws.join(', ')}]`);
            return lessons.slice(0, this.maxLessons);
        } catch (e) {
            console.warn('[LESSON-INJECTOR] lookup failed:', e.message);
            return [];
        }
    }

    formatForPrompt(lessons) {
        if (!lessons || lessons.length === 0) return '';
        let block = '\n--- [PAST AUTOPSY LESSONS — DO NOT REPEAT THESE MISTAKES] ---\n';
        for (const l of lessons) {
            block += `- (${String(l.timestamp || '').slice(0, 10)}) [${l.type}] ${String(l.content).substring(0, 220)}\n`;
        }
        block += 'Choose tool paths and arguments that avoid these failures.\n--------------------------------------------------------------\n';
        return block;
    }

    async getBlock(goalTitle, stepContext = '') {
        const lessons = await this.fetchRelevantLessons(goalTitle, stepContext);
        return this.formatForPrompt(lessons);
    }
}

module.exports = { LessonInjector };
