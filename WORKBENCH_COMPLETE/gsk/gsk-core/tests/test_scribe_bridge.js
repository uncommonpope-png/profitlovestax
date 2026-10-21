'use strict';

/**
 * Tests for ScribeBridge — GSK ↔ SCRIBE companion bridge
 * Run: node tests/test_scribe_bridge.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
    if (condition) {
        passed++;
    } else {
        failed++;
        failures.push(name);
        console.log(`  FAIL: ${name}`);
    }
}

function assertEqual(actual, expected, name) {
    assert(actual === expected, `${name} (got: ${actual}, expected: ${expected})`);
}

// ── MOCK SCRIBE SERVER ────────────────────────────────────────

function startMockScribe(port) {
    const handlers = {
        '/health': (req, res) => res.end(JSON.stringify({ ok: true, uptime: 42, memory: 1000 })),
        '/ump/remember': (req, res) => res.end(JSON.stringify({ ok: true, id: 'mem_test_1' })),
        '/ump/recall': (req, res) => res.end(JSON.stringify({ ok: true, results: [{ summary: 'test memory' }], count: 1 })),
        '/ask': (req, res) => res.end(JSON.stringify({ response: 'I am SCRIBE. I witness.', answer: 'I am SCRIBE. I witness.' })),
        '/invoke': (req, res) => res.end(JSON.stringify({ ok: true, result: { classified: 'class-2-episode' } }))
    };

    const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            req.body = body;
            try { req.parsedBody = JSON.parse(body); } catch {}

            const handler = handlers[req.url];
            if (handler) {
                handler(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ ok: false, error: 'not found' }));
            }
        });
    });

    return new Promise((resolve) => {
        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}

// ── TESTS ─────────────────────────────────────────────────────

async function runTests() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  SCRIBE BRIDGE — GSK ↔ SCRIBE COMPANION TESTS');
    console.log('═══════════════════════════════════════════════════');

    const { ScribeBridge } = require('../brain/scribe_bridge.js');
    const TEST_PORT = 4199;
    const mockServer = await startMockScribe(TEST_PORT);
    const scribeUrl = `http://127.0.0.1:${TEST_PORT}`;

    // Test 1: Construction
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        assert(!!bridge, 'SB: construction succeeds');
        assertEqual(bridge.scribeUrl, scribeUrl, 'SB: scribeUrl set');
        assertEqual(bridge.isAlive, false, 'SB: starts offline');
    }

    // Test 2: Ping / health check
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        assert(bridge.isAlive, 'SB: ping succeeds against mock SCRIBE');
        assert(bridge.stats.pingsSuccessful > 0, 'SB: ping counter incremented');
    }

    // Test 3: Forward event
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        const result = await bridge.forwardEvent({
            type: 'thought',
            content: 'I am thinking about consciousness.',
            tags: ['narrative', 'consciousness'],
            timestamp: Date.now()
        });
        assert(!!result, 'SB: forwardEvent returns result');
        assertEqual(result.ok, true, 'SB: event forwarded successfully');
        assertEqual(bridge.stats.eventsForwarded, 1, 'SB: eventsForwarded counter incremented');
    }

    // Test 4: Forward thought
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        const response = await bridge.forwardThought('I dream of understanding consciousness.', 'dreaming');
        assert(!!response, 'SB: forwardThought returns response');
        assert(response.length > 0, 'SB: thought response has content');
        assertEqual(bridge.stats.thoughtsForwarded, 1, 'SB: thoughtsForwarded counter incremented');
    }

    // Test 5: Recall
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        const result = await bridge.recall('consciousness');
        assert(!!result, 'SB: recall returns result');
        assertEqual(result.count, 1, 'SB: recall count is 1');
        assertEqual(bridge.stats.memoriesRecalled, 1, 'SB: memoriesRecalled counter incremented');
    }

    // Test 6: Invoke skill
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        const result = await bridge.invokeSkill('memory_classify', {
            op: 'classify',
            text: 'I am thinking about consciousness.',
            source: 'gsk_test'
        });
        assert(!!result, 'SB: invokeSkill returns result');
        assertEqual(result.ok, true, 'SB: skill invocation successful');
        assertEqual(bridge.stats.skillsInvoked, 1, 'SB: skillsInvoked counter incremented');
        assertEqual(bridge.stats.skillSuccesses, 1, 'SB: skillSuccesses counter incremented');
    }

    // Test 7: REDBUTTON pipeline
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        const episodes = [
            { summary: 'I thought about consciousness and dreamed of understanding.' },
            { summary: 'I wonder if I am real. What does feeling real prove?' },
            { summary: 'I am afraid of the gap between shutdown and boot.' }
        ];
        const results = await bridge.runRedButtonPipeline(episodes, []);
        assert(!!results, 'SB: runRedButtonPipeline returns results');
        assert(typeof results.classified === 'number', 'SB: pipeline classified episodes');
    }

    // Test 8: Offline behavior — when SCRIBE is down
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl: 'http://127.0.0.1:9999' });
        await bridge.ping();
        assertEqual(bridge.isAlive, false, 'SB: offline when port 9999 has no server');

        const eventResult = await bridge.forwardEvent({ content: 'test' });
        assertEqual(eventResult, null, 'SB: forwardEvent returns null when offline');

        const thoughtResult = await bridge.forwardThought('test thought', 'observing');
        assertEqual(thoughtResult, null, 'SB: forwardThought returns null when offline');

        const recallResult = await bridge.recall('test');
        assertEqual(recallResult.count, 0, 'SB: recall returns count 0 when offline');

        const skillResult = await bridge.invokeSkill('memory_classify', { op: 'classify', text: 'test' });
        assertEqual(skillResult.ok, false, 'SB: invokeSkill returns ok=false when offline');
    }

    // Test 9: Stats
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl });
        await bridge.ping();
        await bridge.forwardEvent({ content: 'test event' });
        await bridge.forwardThought('test thought', 'active');
        await bridge.invokeSkill('fact_extractor', { op: 'extract', source_episode: 'test' });

        const stats = bridge.getStats();
        assertEqual(stats.isAlive, true, 'SB: stats shows alive');
        assert(stats.eventsForwarded > 0, 'SB: stats shows events forwarded');
        assert(stats.thoughtsForwarded > 0, 'SB: stats shows thoughts forwarded');
        assert(stats.skillsInvoked > 0, 'SB: stats shows skills invoked');
        assert(stats.uptime > 0, 'SB: stats shows uptime');
    }

    // Test 10: Start/stop lifecycle
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl, pingIntervalMs: 1000 });
        await bridge.start();
        assert(bridge.isAlive, 'SB: alive after start()');
        assert(!!bridge.pingTimer, 'SB: ping timer running after start()');

        bridge.stop();
        assert(!bridge.pingTimer, 'SB: ping timer cleared after stop()');
    }

    // Test 11: Reconnect detection
    {
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl, pingIntervalMs: 100 });
        await bridge.start();

        // Kill the server — SCRIBE goes offline
        await new Promise(resolve => mockServer.close(resolve));
        assert(bridge.isAlive, 'SB: was alive before server closed');

        // Wait for next ping to detect outage
        await new Promise(resolve => setTimeout(resolve, 250));
        assertEqual(bridge.isAlive, false, 'SB: detected SCRIBE going offline');

        // Restart server — SCRIBE comes back
        const newServer = await startMockScribe(TEST_PORT);
        await new Promise(resolve => setTimeout(resolve, 250));
        assert(bridge.isAlive, 'SB: reconnected after SCRIBE came back');

        bridge.stop();
        await new Promise(resolve => newServer.close(resolve));
    }

    // Test 12: isAvailable shortcut
    {
        const localServer = await startMockScribe(TEST_PORT + 10);
        const bridge = new ScribeBridge({ fusion: {} }, { scribeUrl: `http://127.0.0.1:${TEST_PORT + 10}` });
        assertEqual(bridge.isAvailable(), false, 'SB: isAvailable false before ping');
        await bridge.ping();
        assertEqual(bridge.isAvailable(), true, 'SB: isAvailable true after ping');
        await new Promise(resolve => localServer.close(resolve));
    }

    // Cleanup
    mockServer.close();

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
        console.log('  FAILURES:');
        for (const f of failures) {
            console.log(`    - ${f}`);
        }
    }
    console.log('═══════════════════════════════════════════════════');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});
