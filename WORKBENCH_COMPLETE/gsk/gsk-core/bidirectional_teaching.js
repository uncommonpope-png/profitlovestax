/**
 * PHASE 6: Bidirectional Teaching Protocol (The Correction Loop)
 * 
 * Creates a structured feedback mechanism where SCRIBE and Seshat
 * can flag logic errors or missing context in GSK's reasoning stream.
 * 
 * Defines a JSON schema for peer-to-peer corrections
 * (`agent_correction_packet`) that forces downstream ingestion
 * and Bayesian re-weighting.
 */

const fs = require('fs');
const path = require('path');
const { getFamilyEventBus } = require('./family_event_bus');

const GSK_DATA_DIR = path.join(__dirname, '..', 'data', 'gsk');

/**
 * Correction Packet Schema:
 * {
 *   id: string,
 *   from: 'scribe' | 'seshat' | 'gsk',
 *   to: 'gsk' | 'scribe' | 'seshat',
 *   type: 'correction' | 'addition' | 'clarification' | 'contradiction',
 *   topic: string,
 *   originalClaim: string,
 *   correctedClaim: string,
 *   evidence: string,
 *   confidence: number (0-1),
 *   timestamp: number,
 *   processed: boolean
 * }
 */

class BidirectionalTeaching {
    constructor() {
        this.bus = getFamilyEventBus();
        this.corrections = [];
        this.maxCorrections = 200;
        this.stats = {
            sent: 0,
            received: 0,
            applied: 0,
            rejected: 0,
            byType: {}
        };
    }

    /**
     * Start the teaching protocol
     */
    start() {
        // Listen for correction requests
        this.bus.subscribe('family:correction', (env) => this._onCorrection(env), 'teaching');
        this.bus.subscribe('family:teaching_request', (env) => this._onTeachingRequest(env), 'teaching');

        // Load persisted corrections
        this._loadCorrections();

        console.log('[Teaching] Bidirectional protocol active');
        return this;
    }

    /**
     * Send a correction from one agent to another
     */
    sendCorrection(from, to, type, topic, originalClaim, correctedClaim, evidence, confidence = 0.8) {
        const packet = {
            id: `correction_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            from,
            to,
            type,
            topic,
            originalClaim,
            correctedClaim,
            evidence,
            confidence,
            timestamp: Date.now(),
            processed: false
        };

        this.corrections.push(packet);
        if (this.corrections.length > this.maxCorrections) {
            this.corrections = this.corrections.slice(-this.maxCorrections);
        }

        this.bus.publish('family:correction', packet, from);
        this.stats.sent++;
        this.stats.byType[type] = (this.stats.byType[type] || 0) + 1;

        this._persistCorrections();
        return packet;
    }

    /**
     * Request teaching from a specific agent
     */
    requestTeaching(from, to, topic, context) {
        const request = {
            id: `teach_req_${Date.now()}`,
            from,
            to,
            topic,
            context,
            timestamp: Date.now()
        };

        this.bus.publish('family:teaching_request', request, from);
        return request;
    }

    /**
     * Apply a correction to GSK's knowledge
     */
    applyCorrection(correctionId) {
        const correction = this.corrections.find(c => c.id === correctionId);
        if (!correction || correction.processed) return false;

        correction.processed = true;
        this.stats.applied++;

        // Add to GSK's journal as a teaching event
        try {
            const journalPath = path.join(GSK_DATA_DIR, 'journal.json');
            const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
            const entryNum = Object.keys(journal).length;
            journal[entryNum] = {
                id: `teaching_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                title: `[TEACHING] ${correction.type} from ${correction.from}`,
                body: `Topic: ${correction.topic}\nOriginal: ${correction.originalClaim}\nCorrected: ${correction.correctedClaim}\nEvidence: ${correction.evidence}\nConfidence: ${correction.confidence}`
            };
            fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));
        } catch (e) { /* non-fatal */ }

        // Publish as a GSK event (for Bayesian re-weighting)
        this.bus.publish('gsk:teaching_applied', {
            correction: correction,
            appliedAt: Date.now()
        }, 'gsk');

        this._persistCorrections();
        return true;
    }

    /**
     * Get pending corrections for an agent
     */
    getPendingCorrections(forAgent) {
        return this.corrections.filter(c =>
            c.to === forAgent && !c.processed
        );
    }

    /**
     * Get correction stats
     */
    health() {
        return {
            totalCorrections: this.corrections.length,
            pending: this.corrections.filter(c => !c.processed).length,
            ...this.stats
        };
    }

    // --- Internal ---

    _onCorrection(envelope) {
        this.stats.received++;
        const packet = envelope.payload;
        if (packet.to === 'gsk') {
            // Auto-apply high-confidence corrections
            if (packet.confidence >= 0.9) {
                this.applyCorrection(packet.id);
                console.log(`[Teaching] Auto-applied high-confidence correction: ${packet.topic}`);
            }
        }
    }

    _onTeachingRequest(envelope) {
        const request = envelope.payload;
        // Log the request — actual response depends on the agent
        console.log(`[Teaching] Teaching request: ${request.from} asks ${request.to} about ${request.topic}`);
    }

    _loadCorrections() {
        try {
            const p = path.join(GSK_DATA_DIR, 'teaching_corrections.json');
            if (fs.existsSync(p)) {
                this.corrections = JSON.parse(fs.readFileSync(p, 'utf8'));
            }
        } catch (e) {
            this.corrections = [];
        }
    }

    _persistCorrections() {
        try {
            const p = path.join(GSK_DATA_DIR, 'teaching_corrections.json');
            fs.writeFileSync(p, JSON.stringify(this.corrections.slice(-100), null, 2));
        } catch (e) { /* non-fatal */ }
    }
}

module.exports = { BidirectionalTeaching };
