/**
 * PHASE 5: GSK Dynamic Context Interceptor
 * 
 * Listens for incoming events from Seshat and SCRIBE on the Family Event Bus.
 * Automatically injects new peer-agent data into GSK's active context
 * without waiting for manual prompts or batch polling.
 * 
 * This is the missing link: GSK now DETECTS new Seshat files in real-time.
 */

const fs = require('fs');
const path = require('path');
const { getFamilyEventBus } = require('./family_event_bus');

const GSK_DATA_DIR = path.join(__dirname, '..', 'data', 'gsk');

class GSKContextInterceptor {
    constructor() {
        this.bus = getFamilyEventBus();
        this.contextBuffer = [];
        this.maxBufferSize = 50;
        this.pendingTeachings = [];
        this.stats = {
            intercepted: 0,
            injected: 0,
            teachingsProcessed: 0,
            lastInterception: null
        };
    }

    /**
     * Start listening for family events and injecting into GSK context
     */
    start() {
        // Listen for Seshat page events
        this.bus.subscribe('seshat:page_created', (env) => this._onSeshatNew(env), 'gsk-interceptor');
        this.bus.subscribe('seshat:page_modified', (env) => this._onSeshatModified(env), 'gsk-interceptor');

        // Listen for SCRIBE memory events
        this.bus.subscribe('scribe:memory_added', (env) => this._onSCRIBEMemory(env), 'gsk-interceptor');

        // Listen for teaching injections
        this.bus.subscribe('gsk:teaching_injected', (env) => this._onTeaching(env), 'gsk-interceptor');

        // Listen for GSK's own insights (for self-tracking)
        this.bus.subscribe('gsk:insight_generated', (env) => this._onInsight(env), 'gsk-interceptor');

        console.log('[GSKInterceptor] Active — listening for peer-agent data');
        return this;
    }

    /**
     * Get the current context buffer (what GSK should know right now)
     */
    getContext() {
        return this.contextBuffer.slice();
    }

    /**
     * Get pending teachings that need to be processed
     */
    getPendingTeachings() {
        return this.pendingTeachings.splice(0);
    }

    /**
     * Get interceptor health
     */
    health() {
        return {
            bufferSize: this.contextBuffer.length,
            pendingTeachings: this.pendingTeachings.length,
            ...this.stats
        };
    }

    // --- Internal handlers ---

    _onSeshatNew(envelope) {
        const { filename, content, path: filePath, size } = envelope.payload;
        this.stats.intercepted++;
        this.stats.lastInterception = Date.now();

        const contextEntry = {
            source: 'seshat',
            type: 'new_page',
            filename,
            path: filePath,
            size,
            summary: this._extractSummary(content),
            rawContent: content,
            timestamp: envelope.timestamp,
            eventId: envelope.id
        };

        this._addToBuffer(contextEntry);

        // Auto-journal the interception
        this._journalEntry('seshat_new_page', `Intercepted new Seshat page: ${filename} (${size} bytes)`);

        console.log(`[GSKInterceptor] SESHAT NEW: ${filename}`);
    }

    _onSeshatModified(envelope) {
        const { filename, content, path: filePath, size } = envelope.payload;
        this.stats.intercepted++;
        this.stats.lastInterception = Date.now();

        const contextEntry = {
            source: 'seshat',
            type: 'modified_page',
            filename,
            path: filePath,
            size,
            summary: this._extractSummary(content),
            rawContent: content,
            timestamp: envelope.timestamp,
            eventId: envelope.id
        };

        this._addToBuffer(contextEntry);
        console.log(`[GSKInterceptor] SESHAT MODIFIED: ${filename}`);
    }

    _onSCRIBEMemory(envelope) {
        const { event, data, hash } = envelope.payload;
        this.stats.intercepted++;
        this.stats.lastInterception = Date.now();

        const contextEntry = {
            source: 'scribe',
            type: 'memory',
            event,
            data,
            hash,
            timestamp: envelope.timestamp,
            eventId: envelope.id
        };

        this._addToBuffer(contextEntry);
        console.log(`[GSKInterceptor] SCRIBE MEMORY: ${event}`);
    }

    _onTeaching(envelope) {
        const { from, to, topic, correction } = envelope.payload;
        this.stats.intercepted++;

        this.pendingTeachings.push({
            from,
            to,
            topic,
            correction,
            timestamp: envelope.timestamp,
            eventId: envelope.id,
            processed: false
        });

        console.log(`[GSKInterceptor] TEACHING: ${from} → ${to} about ${topic}`);
    }

    _onInsight(envelope) {
        this.stats.intercepted++;
        // Self-tracking — log insight for meta-cognition
    }

    _addToBuffer(entry) {
        this.contextBuffer.push(entry);
        if (this.contextBuffer.length > this.maxBufferSize) {
            this.contextBuffer = this.contextBuffer.slice(-this.maxBufferSize);
        }
        this.stats.injected++;
    }

    _extractSummary(content) {
        if (!content) return '';
        // Extract first meaningful paragraph
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'));
        return lines.slice(0, 3).join(' ').substring(0, 300);
    }

    _journalEntry(type, message) {
        try {
            const journalPath = path.join(GSK_DATA_DIR, 'journal.json');
            const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
            const entryNum = Object.keys(journal).length;
            journal[entryNum] = {
                id: `interceptor_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                title: `[INTERCEPTOR] ${type}`,
                body: message
            };
            fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));
        } catch (e) { /* non-fatal */ }
    }
}

module.exports = { GSKContextInterceptor };
