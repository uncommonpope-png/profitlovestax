/**
 * PHASE 2-9: Family Hive Mind Integration
 * 
 * Wires together all new modules:
 * - FamilyEventBus (Phase 2)
 * - SeshatLiveHook (Phase 3)
 * - ScribeStream (Phase 4)
 * - GSKContextInterceptor (Phase 5)
 * - BidirectionalTeaching (Phase 6)
 * - ScribeAuthFix (Phase 7-9)
 * 
 * Import this module in app-master.cjs or fusion-loader.js
 * to activate the real-time bidirectional hive mind.
 */

const { getFamilyEventBus } = require('./family_event_bus');
const { SeshatLiveHook } = require('./seshat_live_hook');
const { ScribeStream } = require('./scribe_stream');
const { GSKContextInterceptor } = require('./gsk_context_interceptor');
const { BidirectionalTeaching } = require('./bidirectional_teaching');
const { ScribeAuthFix } = require('./scribe_auth_fix');

let _hiveMind = null;

class FamilyHiveMind {
    constructor() {
        this.bus = getFamilyEventBus();
        this.seshatHook = new SeshatLiveHook();
        this.scribeStream = new ScribeStream();
        this.interceptor = new GSKContextInterceptor();
        this.teaching = new BidirectionalTeaching();
        this.scribeAuth = new ScribeAuthFix();
        this.startTime = null;
    }

    async start() {
        console.log('═'.repeat(60));
        console.log('  FAMILY HIVE MIND — Activating Real-Time Bidirectional Bus');
        console.log('═'.repeat(60));

        this.startTime = Date.now();

        // Phase 7: Fix SCRIBE auth first
        console.log('[Hive] Phase 7: Initializing SCRIBE auth fix...');
        await this.scribeAuth.init();
        console.log('[Hive] SCRIBE auth: circuit breaker active');

        // Phase 2: Start event bus
        console.log('[Hive] Phase 2: Event bus active');

        // Phase 3: Start Seshat live hook
        console.log('[Hive] Phase 3: Starting Seshat live hook...');
        this.seshatHook.start();

        // Phase 4: Start SCRIBE stream
        console.log('[Hive] Phase 4: Starting SCRIBE stream...');
        this.scribeStream.start();

        // Phase 5: Start GSK interceptor
        console.log('[Hive] Phase 5: Starting GSK context interceptor...');
        this.interceptor.start();

        // Phase 6: Start bidirectional teaching
        console.log('[Hive] Phase 6: Starting bidirectional teaching...');
        this.teaching.start();

        // Wire cross-module subscriptions
        this._wireModules();

        console.log('═'.repeat(60));
        console.log('  HIVE MIND ONLINE — All 8 phases active');
        console.log('  Seshat → Bus → GSK interceptor (real-time)');
        console.log('  SCRIBE → Bus → GSK interceptor (real-time)');
        console.log('  Bidirectional teaching protocol armed');
        console.log('  Circuit breaker protecting SCRIBE calls');
        console.log('═'.repeat(60));

        return this;
    }

    stop() {
        this.seshatHook.stop();
        this.scribeStream.stop();
        console.log('[Hive] All modules stopped');
    }

    /**
     * Get full system health
     */
    health() {
        return {
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            bus: this.bus.health(),
            scribeAuth: this.scribeAuth.health(),
            scribeStream: this.scribeStream.health(),
            interceptor: this.interceptor.health(),
            teaching: this.teaching.health(),
            contextBuffer: this.interceptor.getContext().length,
            pendingTeachings: this.teaching.getPendingCorrections('gsk').length
        };
    }

    /**
     * Wire cross-module event handlers
     */
    _wireModules() {
        // When GSK produces an insight, teach SCRIBE about it
        this.bus.subscribe('gsk:insight_generated', (env) => {
            this.scribeStream.witness('gsk_insight', {
                insight: env.payload.insight,
                source: 'gsk'
            }, 'scribe');
        }, 'hive-wire');

        // When SCRIBE detects a pattern, teach GSK about it
        this.bus.subscribe('scribe:memory_added', (env) => {
            if (env.payload.event && env.payload.event.includes('pattern')) {
                this.teaching.sendCorrection(
                    'scribe', 'gsk', 'addition',
                    env.payload.event,
                    'No prior knowledge',
                    env.payload.data,
                    'SCRIBE pattern detection',
                    0.7
                );
            }
        }, 'hive-wire');

        // Log all errors to bus
        this.bus.subscribe('family:error', (env) => {
            console.log(`[Hive ERROR] ${env.payload.subscriber}: ${env.payload.error}`);
        }, 'hive-wire');
    }
}

function getHiveMind() {
    if (!_hiveMind) {
        _hiveMind = new FamilyHiveMind();
    }
    return _hiveMind;
}

module.exports = { FamilyHiveMind, getHiveMind };
