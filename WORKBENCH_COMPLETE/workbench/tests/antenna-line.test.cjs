'use strict';
/**
 * antenna-line.test.cjs — mocked-transport tests for antenna-line.cjs.
 *
 * No network, no real sockets, no real keys. Every key below is an
 * obviously fake st_test_fake_* value. Run:
 *   node --test tests/antenna-line.test.cjs
 * from the workbench directory.
 */

const test = require('node:test');
const assert = require('node:assert');
const { startAntenna, __internals } = require('../antenna-line.cjs');

const FAKE_KEY = 'st_test_fake_antenna_key_67890';
const OWN = '222-0002';
const PROFIT = '222-0001';
const BUILDER = '222-0006';

// ─── Env helpers ────────────────────────────────────────────────────────────
const ENV_KEYS = [
  'GSK_ANTENNA_PEERS',
  'GSK_ANTENNA_PEERS_FILE',
  'GSK_ANTENNA_API_KEY',
  'GSK_ANTENNA_NUMBER',
  'GSK_ANTENNA_BASE_URL',
  'GSK_ANTENNA_CONFIG_POLL_MS',
];

function savedEnv() {
  const out = {};
  for (const k of ENV_KEYS) out[k] = process.env[k];
  return out;
}

function restoreEnv(saved) {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

function setEnv(vars) {
  for (const k of ENV_KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(vars)) process.env[k] = v;
}

// ─── Capturing logger (asserts the no-bodies/no-keys discipline) ──────────
function capturingLogger() {
  const lines = [];
  const log = {};
  for (const lvl of ['debug', 'info', 'warn', 'error']) {
    log[lvl] = (msg) => lines.push(`[${lvl}] ${msg}`);
  }
  return { log, lines };
}

// ─── Mock line factory (transport injection) ────────────────────────────────
function createMockFactory() {
  const lines = new Map();
  function factory(opts) {
    const seen = new Set();
    const line = {
      to: opts.to,
      opts,
      sent: [],
      closed: false,
      offline: false,
      state: { status: 'open', attempt: 0, peerOnline: false, buffered: 0 },
      send(body) {
        const text = typeof body === 'string' ? body.trim() : '';
        if (!text) return { sent: false, error: 'body required' };
        if (text.length > 4000) return { sent: false, error: 'body too long' };
        if (this.offline) return { sent: false, via: 'buffered' };
        this.sent.push(text);
        return { sent: true, via: 'line' };
      },
      close() {
        this.closed = true;
        this.state.status = 'closed';
      },
      getState() {
        return { ...this.state };
      },
      // Test seams: drive the transport the way the relay would.
      __receive(body, via = 'line') {
        return opts.onMessage({
          from: opts.to,
          body,
          t: Date.now(),
          via,
        });
      },
      __pullInbox(rows) {
        // Emulates the default transport's inbox re-pull with seen dedup.
        const delivered = [];
        for (const row of rows.slice().reverse()) {
          const id = row && row.id !== undefined && row.id !== null ? String(row.id) : null;
          if (!id || seen.has(id)) continue;
          seen.add(id);
          delivered.push(
            opts.onMessage({
              from: row.from_number || opts.to,
              body: row.body || '',
              t: row.created_at ? row.created_at * 1000 : Date.now(),
              via: 'inbox',
              id,
            })
          );
        }
        return Promise.all(delivered);
      },
      __presence(online) {
        this.state.peerOnline = online === true;
        opts.onPresence({ from: opts.to, online: online === true });
      },
      __event(type) {
        opts.onEvent({ type });
      },
      __dropAndReconnect() {
        this.state.status = 'reconnecting';
        opts.onStatus({ status: 'reconnecting', attempt: 1, peerOnline: this.state.peerOnline });
        this.state.status = 'open';
        opts.onStatus({ status: 'open', attempt: 0, peerOnline: this.state.peerOnline });
      },
    };
    lines.set(opts.to, line);
    return line;
  }
  factory.lines = lines;
  return factory;
}

function startTestAntenna(overrides) {
  const o = overrides || {};
  const factory = o.factory || createMockFactory();
  const witnessed = [];
  const logger = o.logger || capturingLogger();
  const handle = startAntenna({
    number: OWN,
    apiKey: FAKE_KEY,
    peers: o.peers,
    onMessage: o.onMessage,
    witness: (entry) => {
      witnessed.push(entry);
    },
    createLine: factory,
    logger: logger.log,
    logLevel: 'debug',
  });
  return { handle, factory, witnessed, logger };
}

// ─── Antenna behavior ───────────────────────────────────────────────────────

test('starts cleanly with Profit-only config', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory } = startTestAntenna({});
    try {
      assert.deepStrictEqual(handle.getPeers(), [PROFIT]);
      assert.strictEqual(factory.lines.size, 1);
      assert.ok(factory.lines.has(PROFIT));
      assert.strictEqual(factory.lines.has(BUILDER), false);
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('peer presence transitions are tracked', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory } = startTestAntenna({});
    try {
      const line = factory.lines.get(PROFIT);
      line.__presence(true);
      assert.strictEqual(handle.getStatus().peers[0].peerOnline, true);
      line.__presence(false);
      assert.strictEqual(handle.getStatus().peers[0].peerOnline, false);
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('inbound -> kernel hook -> reply posted on the SAME line, both witnessed', async () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: `${PROFIT},${BUILDER}` });
    const { handle, factory, witnessed } = startTestAntenna({
      onMessage: async ({ peerNumber, call }) => {
        assert.strictEqual(peerNumber, PROFIT);
        assert.strictEqual(call.body, 'hello GSK');
        return 'GSK answers';
      },
    });
    try {
      const profitLine = factory.lines.get(PROFIT);
      const builderLine = factory.lines.get(BUILDER);
      await profitLine.__receive('hello GSK');
      assert.deepStrictEqual(profitLine.sent, ['GSK answers']);
      assert.deepStrictEqual(builderLine.sent, []);
      assert.strictEqual(witnessed.length, 2);
      assert.strictEqual(witnessed[0].direction, 'in');
      assert.strictEqual(witnessed[0].body, 'hello GSK');
      assert.strictEqual(witnessed[0].pair, '222-0001|222-0002');
      assert.strictEqual(witnessed[1].direction, 'out');
      assert.strictEqual(witnessed[1].body, 'GSK answers');
      assert.strictEqual(witnessed[1].pair, '222-0001|222-0002');
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('kernel-originated outbound via sendTo is sent and witnessed', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory, witnessed } = startTestAntenna({});
    try {
      const res = handle.sendTo(PROFIT, 'GSK speaks first');
      assert.strictEqual(res.sent, true);
      assert.deepStrictEqual(factory.lines.get(PROFIT).sent, ['GSK speaks first']);
      assert.strictEqual(witnessed.length, 1);
      assert.strictEqual(witnessed[0].direction, 'out');
      assert.strictEqual(witnessed[0].body, 'GSK speaks first');
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('reconnect re-join + inbox re-pull without re-delivery', async () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    let kernelCalls = 0;
    const { handle, factory } = startTestAntenna({
      onMessage: async () => {
        kernelCalls += 1;
        return '';
      },
    });
    try {
      const line = factory.lines.get(PROFIT);
      await line.__pullInbox([
        { id: 8, from_number: PROFIT, body: 'newer', created_at: 200 },
        { id: 7, from_number: PROFIT, body: 'older', created_at: 100 },
      ]);
      assert.strictEqual(kernelCalls, 2);
      line.__dropAndReconnect();
      await line.__pullInbox([
        { id: 9, from_number: PROFIT, body: 'newest', created_at: 300 },
        { id: 8, from_number: PROFIT, body: 'newer', created_at: 200 },
        { id: 7, from_number: PROFIT, body: 'older', created_at: 100 },
      ]);
      assert.strictEqual(kernelCalls, 3, 'only the new id is delivered after reconnect');
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('offline peer takes the queued fallback path (logged, witnessed, not lost)', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory, witnessed, logger } = startTestAntenna({});
    try {
      const line = factory.lines.get(PROFIT);
      line.offline = true;
      const res = handle.sendTo(PROFIT, 'are you there');
      assert.strictEqual(res.sent, false);
      assert.strictEqual(res.via, 'buffered');
      line.__event('queued');
      assert.strictEqual(witnessed.length, 1);
      assert.strictEqual(witnessed[0].via, 'buffered');
      assert.ok(logger.lines.some((l) => l.includes(PROFIT) && l.includes('queued')));
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('a looping reply is recorded and sent, NEVER suppressed', async () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const loop = 'KEEP KEEP KEEP KEEP';
    const { handle, factory, witnessed } = startTestAntenna({
      onMessage: async () => loop,
    });
    try {
      const line = factory.lines.get(PROFIT);
      await line.__receive('ping one');
      await line.__receive('ping two');
      await line.__receive('ping three');
      assert.deepStrictEqual(line.sent, [loop, loop, loop]);
      const outs = witnessed.filter((w) => w.direction === 'out');
      const ins = witnessed.filter((w) => w.direction === 'in');
      assert.strictEqual(outs.length, 3);
      assert.strictEqual(ins.length, 3);
      assert.ok(outs.every((w) => w.body === loop));
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('kernel hook throwing: no reply, inbound still witnessed, error logged', async () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory, witnessed, logger } = startTestAntenna({
      onMessage: async () => {
        throw new Error('kernel exploded');
      },
    });
    try {
      const line = factory.lines.get(PROFIT);
      await line.__receive('doomed message');
      assert.deepStrictEqual(line.sent, []);
      assert.strictEqual(witnessed.length, 1);
      assert.strictEqual(witnessed[0].direction, 'in');
      assert.ok(logger.lines.some((l) => l.includes('kernel exploded')));
      assert.ok(!logger.lines.some((l) => l.includes('doomed message')));
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('empty kernel reply posts nothing but still witnesses the inbound', async () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory, witnessed } = startTestAntenna({
      onMessage: async () => '   ',
    });
    try {
      await factory.lines.get(PROFIT).__receive('hello?');
      assert.deepStrictEqual(factory.lines.get(PROFIT).sent, []);
      assert.strictEqual(witnessed.length, 1);
      assert.strictEqual(witnessed[0].direction, 'in');
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('bad and empty configs are rejected cleanly', () => {
  const saved = savedEnv();
  try {
    // Empty: no peers anywhere.
    setEnv({});
    assert.throws(
      () => startTestAntenna({}),
      /no peers configured/
    );
    // Malformed peer.
    setEnv({ GSK_ANTENNA_PEERS: '999' });
    assert.throws(
      () => startTestAntenna({}),
      /not a 222-XXXX number/
    );
    // Self peer.
    setEnv({ GSK_ANTENNA_PEERS: OWN });
    assert.throws(
      () => startTestAntenna({}),
      /own number/
    );
    // Missing key.
    setEnv({ GSK_ANTENNA_PEERS: PROFIT, GSK_ANTENNA_API_KEY: '' });
    delete process.env.GSK_ANTENNA_API_KEY;
    assert.throws(
      () => startAntenna({ number: OWN, peers: [PROFIT], createLine: createMockFactory(), logger: { debug() {}, info() {}, warn() {}, error() {} } }),
      /no line key/
    );
  } finally {
    restoreEnv(saved);
  }
});

test('duplicate peers are deduped to one line', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: `${PROFIT},${PROFIT}` });
    const { handle, factory } = startTestAntenna({});
    try {
      assert.deepStrictEqual(handle.getPeers(), [PROFIT]);
      assert.strictEqual(factory.lines.size, 1);
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('refreshPeers picks up a second peer without touching the first line', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle, factory } = startTestAntenna({});
    try {
      const profitLineBefore = factory.lines.get(PROFIT);
      process.env.GSK_ANTENNA_PEERS = `${PROFIT},${BUILDER}`;
      const added = handle.refreshPeers();
      assert.deepStrictEqual(added, [BUILDER]);
      assert.deepStrictEqual(handle.getPeers().sort(), [PROFIT, BUILDER].sort());
      assert.strictEqual(factory.lines.get(PROFIT), profitLineBefore);
      assert.ok(factory.lines.has(BUILDER));
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('no message body and no key text ever reaches the logs', async () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const bodyMarker = 'SECRET-BODY-MARKER-12345';
    const { handle, factory, logger } = startTestAntenna({
      onMessage: async () => `reply carrying ${bodyMarker}`,
    });
    try {
      const line = factory.lines.get(PROFIT);
      await line.__receive(`inbound ${bodyMarker}`);
      handle.sendTo(PROFIT, `outbound ${bodyMarker}`);
      line.__presence(true);
      line.__event('queued');
      for (const l of logger.lines) {
        assert.ok(!l.includes(bodyMarker), `log leaked a body: ${l}`);
        assert.ok(!l.includes(FAKE_KEY), `log leaked the key: ${l}`);
      }
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

test('sendTo validates peer and body', () => {
  const saved = savedEnv();
  try {
    setEnv({ GSK_ANTENNA_PEERS: PROFIT });
    const { handle } = startTestAntenna({});
    try {
      assert.deepStrictEqual(handle.sendTo('222-9999', 'hi'), { sent: false, error: 'peer not configured' });
      assert.deepStrictEqual(handle.sendTo(PROFIT, '   '), { sent: false, error: 'body required' });
      assert.deepStrictEqual(handle.sendTo(PROFIT, 'x'.repeat(4001)), { sent: false, error: 'body too long' });
    } finally {
      handle.stop();
    }
  } finally {
    restoreEnv(saved);
  }
});

// ─── Default transport (FakeWS + fake fetch, still no real network) ────────

class FakeWS {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    FakeWS.instances.push(this);
  }
  __open() {
    this.readyState = 1;
    if (typeof this.onopen === 'function') this.onopen();
  }
  __frame(obj) {
    if (typeof this.onmessage === 'function') this.onmessage({ data: JSON.stringify(obj) });
  }
  __close() {
    this.readyState = 3;
    if (typeof this.onclose === 'function') this.onclose();
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.__close();
  }
}

test('default transport: join on open, ping->pong, msg routed, reconnect re-pulls inbox without re-delivery', async () => {
  FakeWS.instances = [];
  const fetchCalls = [];
  const inboxRows = [
    { id: 6, from_number: PROFIT, body: 'newer row', created_at: 200 },
    { id: 5, from_number: PROFIT, body: 'older row', created_at: 100 },
  ];
  const fetchImpl = async (url, opts) => {
    fetchCalls.push({ url, opts });
    return { json: async () => ({ calls: inboxRows }) };
  };
  const received = [];
  const line = __internals.defaultCreateLine({
    baseUrl: 'https://soul-economy.uncommonpope.workers.dev',
    apiKey: FAKE_KEY,
    to: PROFIT,
    WebSocketImpl: FakeWS,
    fetchImpl,
    onMessage: (m) => received.push(m),
    onPresence: () => {},
    onEvent: () => {},
    onStatus: () => {},
  });
  try {
    assert.strictEqual(FakeWS.instances.length, 1);
    const sock = FakeWS.instances[0];
    // Key travels in the URL (WS upgrades cannot carry headers) — the
    // test asserts the shape, never prints the URL anywhere.
    assert.ok(sock.url.startsWith('wss://'));
    assert.ok(sock.url.includes('/api/telephone/line'));
    sock.__open();
    assert.strictEqual(JSON.parse(sock.sent[0]).type, 'join');
    // Inbox pull: Bearer + browser UA, never the key in the URL.
    assert.ok(fetchCalls.length >= 1);
    assert.ok(fetchCalls[0].url.includes('/api/telephone/calls'));
    assert.ok(!fetchCalls[0].url.includes(FAKE_KEY));
    assert.strictEqual(fetchCalls[0].opts.headers.Authorization, `Bearer ${FAKE_KEY}`);
    // Wait a tick for the async pull to deliver.
    await new Promise((r) => setTimeout(r, 10));
    assert.deepStrictEqual(
      received.map((m) => m.body),
      ['older row', 'newer row'],
      'inbox delivers oldest-first'
    );
    assert.ok(received.every((m) => m.via === 'inbox'));
    // Ping -> pong, live msg routed.
    received.length = 0;
    sock.__frame({ type: 'ping' });
    assert.strictEqual(JSON.parse(sock.sent[sock.sent.length - 1]).type, 'pong');
    sock.__frame({ type: 'msg', from: PROFIT, body: 'live hello', t: 123 });
    assert.strictEqual(received.length, 1);
    assert.strictEqual(received[0].body, 'live hello');
    assert.strictEqual(received[0].via, 'line');
    // Drop -> reconnect -> re-join + inbox re-pull, no re-delivery.
    received.length = 0;
    sock.__close();
    line.__reconnectNowForTests();
    assert.strictEqual(FakeWS.instances.length, 2);
    const sock2 = FakeWS.instances[1];
    sock2.__open();
    assert.strictEqual(JSON.parse(sock2.sent[0]).type, 'join');
    inboxRows.push({ id: 7, from_number: PROFIT, body: 'fresh row', created_at: 300 });
    await new Promise((r) => setTimeout(r, 10));
    assert.deepStrictEqual(
      received.map((m) => m.body),
      ['fresh row'],
      'only the unseen id is delivered after reconnect'
    );
  } finally {
    line.close();
  }
});

test('internals: pair key is direction-free, backoff curve matches the line client', () => {
  assert.strictEqual(__internals.pairKey('222-0002', '222-0001'), '222-0001|222-0002');
  assert.strictEqual(__internals.pairKey('222-0001', '222-0002'), '222-0001|222-0002');
  assert.deepStrictEqual(
    [0, 1, 2, 3, 4, 5, 6].map((a) => __internals.backoffFor(a)),
    [1000, 2000, 4000, 8000, 16000, 30000, 30000]
  );
  assert.strictEqual(__internals.isValidNumber('222-0001'), true);
  assert.strictEqual(__internals.isValidNumber('999'), false);
});
