'use strict';
/**
 * antenna-line.cjs — GSK's permanent line organ (v1, Oct 27 2026).
 *
 * MODULE ONLY — no wiring. A round-2 agent wires this into server.ts on
 * the Builder's PC build (see antenna-line-WIRING.md). Never wired into
 * the live VM workbench by this file.
 *
 * What it is: GSK (222-0002) holds one always-open Soul Telephone line
 * per configured peer — Profit (222-0001) plus the Builder's number when
 * he registers — and TALKS on it as a full participant. This is the
 * antenna the owner ordered: GSK's ears and mouth on the coordination
 * channel, not a silent witness.
 *
 * DOCTRINE (owner correction, binding): GSK talks. Talking is how he is
 * studied — his utterances are the observation data. This module MUST
 * NOT suppress, filter, or hold back any reply, looping or degenerate
 * included. A loop is data to be recorded and studied, not hidden. The
 * line's 300/hr governor is the ONLY volume control. Any future edit
 * that adds reply suppression violates the owner's order.
 *
 * What it does:
 *   1. Opens one line per configured peer and holds it: reconnect with
 *      backoff (1s doubling to a 30s cap), re-join, inbox re-pull for
 *      missed messages — the line client's own reconnect, mirrored here
 *      so the workbench tree stays self-contained for the PC build.
 *   2. Inbound line message -> witness FIRST, then the kernel hook
 *      (same shape as telephone-poller.cjs onMessage), then the reply
 *      is posted back on the SAME line and witnessed too.
 *   3. Outbound: the kernel may also originate messages via sendTo()
 *      (not only replies). Every originated message is witnessed.
 *   4. Witness path: EVERY exchange, inbound and outbound, including
 *      looping/degenerate replies, is handed to the injected witness
 *      callback. The witness callback is server.ts's job to wire to the
 *      existing SCRIBE /witness flow (POST ${SCRIBE_URL}/witness, same
 *      shape as the sliding-window witness). This module invents no
 *      ledger. Seshat digestion of the ledger happens through the
 *      existing growth-cycle path — no new digestion pipeline here.
 *
 * Logging discipline: peer numbers, pair keys, statuses, and counts
 * ONLY. Message bodies, API keys, and WebSocket URLs (which carry the
 * key in query) are NEVER logged, printed, or recorded by this module.
 * Bodies DO travel inside witness entries — that is Scribe's job, the
 * ledger, not stdout. The tests assert no body/key text reaches logs.
 *
 * Config (peers come from config, NEVER invented):
 *   GSK_ANTENNA_PEERS       comma-separated numbers, e.g. "222-0001"
 *   GSK_ANTENNA_PEERS_FILE  path to JSON: { "peers": [...] } or [...]
 *   GSK_ANTENNA_API_KEY     GSK's own line key (222-0002). REQUIRED.
 *                           On the PC this arrives via Craig's private
 *                           transfer decision — never chat, never a
 *                           shared file. Without it the module refuses
 *                           to start, loudly, instead of half-running.
 *   GSK_ANTENNA_NUMBER      own number, default "222-0002".
 *   GSK_ANTENNA_BASE_URL    relay base, default the Soul Economy Worker.
 *   GSK_ANTENNA_CONFIG_POLL_MS  optional: re-read peer config this
 *                           often and ADD new peers (never drops).
 * A peer list of only Profit is a complete, valid start. An empty or
 * malformed peer list, a self peer, or a missing key throws cleanly.
 *
 * Transport: options.createLine is a factory with the line-client v1
 * interface (see soul-economy-kb clients/telephone-line/line-client.mjs
 * for the reference implementation and wire protocol). The default
 * factory below implements that same protocol with Node builtins only
 * (global WebSocket + fetch, Node 22+), so the PC workbench needs no
 * second checkout. Tests inject a mock factory: no network, no sockets.
 *
 * Dependencies: Node builtins only (fs, path). No npm packages.
 */

const fs = require('fs');
const path = require('path');

const RELAY_BASE = 'https://soul-economy.uncommonpope.workers.dev';
const DEFAULT_NUMBER = '222-0002';
const NUMBER_RE = /^\d{3}-\d{4}$/;
const MAX_BODY = 4000;
const MAX_BUFFERED = 50;
const MAX_SEEN_IDS = 500;
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Reconnect backoff: 1s, 2s, 4s, 8s, 16s, then 30s cap. Same curve as
// the reference line client — two agents on a line never thunder-herd.
function backoffFor(attempt) {
  return Math.min(30000, 1000 * 2 ** Math.max(0, attempt));
}

// Unordered pair key: the same line regardless of direction.
function pairKey(a, b) {
  return [String(a), String(b)].sort().join('|');
}

function cleanNumber(s) {
  return String(s ?? '').trim();
}

function isValidNumber(s) {
  return NUMBER_RE.test(cleanNumber(s));
}

/** Parse a comma-separated peers env value into a clean array. */
function parsePeersEnv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => cleanNumber(s))
    .filter((s) => s.length > 0);
}

/** Read a peers JSON file: { "peers": [...] } or a bare array. */
function readPeersFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (Array.isArray(data)) return data.map((s) => cleanNumber(s));
  if (data && Array.isArray(data.peers)) return data.peers.map((s) => cleanNumber(s));
  throw new Error(`antenna-line: peers file ${filePath} has no peers array`);
}

/**
 * Load the peer list from every configured source, unioned + deduped.
 * options.peers (array) + GSK_ANTENNA_PEERS + GSK_ANTENNA_PEERS_FILE.
 * Throws on malformed entries or a self peer — config errors must be
 * loud at start, never a silently half-connected antenna.
 */
function loadPeerList(options) {
  const opts = options || {};
  const seen = new Set();
  const out = [];
  const push = (n) => {
    const num = cleanNumber(n);
    if (!num) return;
    if (!isValidNumber(num)) {
      throw new Error(`antenna-line: peer number "${num}" is not a 222-XXXX number`);
    }
    if (num === opts._ownNumber) {
      throw new Error(`antenna-line: peer list contains the antenna's own number (${num})`);
    }
    if (!seen.has(num)) {
      seen.add(num);
      out.push(num);
    }
  };
  if (Array.isArray(opts.peers)) opts.peers.forEach(push);
  parsePeersEnv(process.env.GSK_ANTENNA_PEERS).forEach(push);
  const peersFile = opts.peersFile || process.env.GSK_ANTENNA_PEERS_FILE;
  if (peersFile) readPeersFile(peersFile).forEach(push);
  return out;
}

/** Minimal level-gated logger, same shape as telephone-poller.cjs. */
function makeLogger(customLogger, level) {
  const order = { debug: 0, info: 1, warn: 2, error: 3 };
  const min = order[level] !== undefined ? order[level] : 0;
  const log = customLogger || console;
  const emit = (lvl, msg) => {
    if (order[lvl] < min) return;
    if (typeof log[lvl] === 'function') log[lvl](`[antenna-line:${lvl}] ${msg}`);
    else if (typeof log.log === 'function') log.log(`[antenna-line:${lvl}] ${msg}`);
  };
  return {
    debug: (m) => emit('debug', m),
    info: (m) => emit('info', m),
    warn: (m) => emit('warn', m),
    error: (m) => emit('error', m),
  };
}

// ─── Default line transport (line v1 protocol, Node builtins only) ───
// Mirrors soul-economy-kb clients/telephone-line/line-client.mjs exactly:
// WS to /api/telephone/line?to=…&key=… (key in query because WS upgrades
// cannot carry headers), {type:"join"} on open, auto-pong, auto-reconnect
// with backoff, inbox re-pull with seen-id dedup, offline send buffering
// (cap 50, refuses over cap rather than dropping silently). The URL,
// the key, and message bodies are never logged here.
function lineWsUrl(baseUrl, to, apiKey) {
  const u = new URL(baseUrl);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  u.pathname = '/api/telephone/line';
  u.search = '';
  u.searchParams.set('to', to);
  u.searchParams.set('key', apiKey);
  return u.toString();
}

function defaultCreateLine(options) {
  const {
    baseUrl, apiKey, to, onMessage, onPresence, onEvent, onStatus,
    WebSocketImpl, fetchImpl, inboxLimit = 50,
  } = options || {};
  if (!baseUrl || !apiKey || !to) {
    throw new Error('antenna-line: line transport needs baseUrl, apiKey, and to');
  }
  const WS = WebSocketImpl || globalThis.WebSocket;
  if (typeof WS !== 'function') {
    throw new Error('antenna-line: global WebSocket not available (needs Node 22+)');
  }
  const doFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  const emit = (fn, arg) => {
    try {
      if (typeof fn === 'function') fn(arg);
    } catch (_e) {
      /* caller callback errors must never kill the line */
    }
  };

  let ws = null;
  let manualClosed = false;
  let attempt = 0;
  let status = 'connecting';
  let peerOnline = false;
  let connectTimer = null;
  const seen = new Set();
  const buffer = [];

  function setStatus(s) {
    status = s;
    emit(onStatus, { status: s, attempt, peerOnline });
  }

  function trimSeen() {
    if (seen.size <= MAX_SEEN_IDS) return;
    const ids = Array.from(seen);
    for (const id of ids.slice(0, ids.length - MAX_SEEN_IDS)) seen.delete(id);
  }

  async function pullInbox() {
    let res;
    try {
      res = await doFetch(
        `${String(baseUrl).replace(/\/$/, '')}/api/telephone/calls?limit=${inboxLimit}`,
        { headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': BROWSER_USER_AGENT } }
      );
    } catch (_e) {
      return; // gap coverage, never fatal
    }
    let data;
    try {
      data = await res.json();
    } catch (_e) {
      return;
    }
    const calls = Array.isArray(data) ? data : data?.calls || [];
    for (const call of calls.slice().reverse()) {
      const id = call && (call.id !== undefined && call.id !== null ? String(call.id) : null);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      trimSeen();
      emit(onMessage, {
        from: call.from_number || call.from || 'unknown',
        body: call.body || '',
        t: call.created_at ? call.created_at * 1000 : Date.now(),
        via: 'inbox',
        id,
      });
    }
  }

  function flushBuffer() {
    if (!ws || ws.readyState !== 1) return;
    while (buffer.length > 0) {
      const body = buffer.shift();
      try {
        ws.send(JSON.stringify({ type: 'msg', body }));
      } catch (_e) {
        buffer.unshift(body);
        return;
      }
    }
  }

  function handleFrame(raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : String(raw));
    } catch (_e) {
      return;
    }
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'ping':
        try {
          ws.send(JSON.stringify({ type: 'pong' }));
        } catch (_e) {}
        break;
      case 'msg':
        emit(onMessage, {
          from: msg.from || 'unknown',
          body: msg.body || '',
          t: msg.t || Date.now(),
          via: 'line',
        });
        break;
      case 'presence':
        peerOnline = msg.online === true;
        emit(onPresence, { from: msg.from || to, online: peerOnline });
        emit(onStatus, { status, attempt, peerOnline });
        break;
      case 'hello':
      case 'joined':
      case 'delivered':
      case 'queued':
      case 'error':
        emit(onEvent, { type: msg.type, line: msg.line, error: msg.error, peerOnline: msg.peerOnline });
        break;
      default:
        break; // unknown frame: ignore
    }
  }

  function connect() {
    if (manualClosed) return;
    setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
    let socket;
    try {
      socket = new WS(lineWsUrl(baseUrl, to, apiKey));
    } catch (_e) {
      scheduleReconnect();
      return;
    }
    ws = socket;
    socket.onopen = () => {
      attempt = 0;
      setStatus('open');
      try {
        socket.send(JSON.stringify({ type: 'join', to }));
      } catch (_e) {}
      flushBuffer();
      pullInbox();
    };
    socket.onmessage = (ev) => handleFrame(ev && ev.data !== undefined ? ev.data : ev);
    socket.onclose = () => {
      if (ws === socket) ws = null;
      if (!manualClosed) scheduleReconnect();
      else setStatus('closed');
    };
    socket.onerror = () => {
      /* onclose follows; the reconnect decision lives there */
    };
  }

  function scheduleReconnect() {
    if (manualClosed) return;
    const delay = backoffFor(attempt);
    attempt += 1;
    setStatus('reconnecting');
    connectTimer = setTimeout(connect, delay);
  }

  connect();

  return {
    send(body) {
      const text = typeof body === 'string' ? body.trim() : '';
      if (!text) return { sent: false, error: 'body required' };
      if (text.length > MAX_BODY) return { sent: false, error: 'body too long' };
      if (ws && ws.readyState === 1) {
        try {
          ws.send(JSON.stringify({ type: 'msg', body: text }));
          return { sent: true, via: 'line' };
        } catch (_e) {
          /* fall through to buffering */
        }
      }
      if (buffer.length >= MAX_BUFFERED) return { sent: false, error: 'buffer full' };
      buffer.push(text);
      return { sent: false, via: 'buffered' };
    },
    close() {
      manualClosed = true;
      if (connectTimer) clearTimeout(connectTimer);
      try {
        if (ws) ws.close();
      } catch (_e) {}
      ws = null;
      setStatus('closed');
    },
    getState() {
      return { status, attempt, peerOnline, buffered: buffer.length };
    },
    __reconnectNowForTests() {
      if (manualClosed) return;
      if (connectTimer) clearTimeout(connectTimer);
      connect();
    },
  };
}

/**
 * startAntenna(options) — open and hold one line per configured peer.
 *
 * options:
 *   number       own number, default GSK_ANTENNA_NUMBER or "222-0002".
 *   apiKey       own line key: options.apiKey or GSK_ANTENNA_API_KEY.
 *                REQUIRED. Never hardcoded, never logged.
 *   baseUrl      relay base, default GSK_ANTENNA_BASE_URL or RELAY_BASE.
 *   peers        array of peer numbers (unioned with env + peers file).
 *   peersFile    path to peers JSON (overrides GSK_ANTENNA_PEERS_FILE).
 *   onMessage    kernel hook: async ({ agentNumber, peerNumber, call })
 *                -> reply body string. call = { from, body, via, id? }.
 *                Empty/whitespace/non-string = no reply posted. Throwing
 *                = logged (message only), no reply posted. NOTE: unlike
 *                the async poller, a thrown hook does NOT redeliver a
 *                live message — live delivery is at-most-once through
 *                the kernel, and the witness record is the safety net.
 *                The reply is posted VERBATIM — including loops. Never
 *                suppressed, per the owner's order.
 *   witness      witness callback: (entry) => void|Promise<void>, where
 *                entry = { type, pair, direction, from, to, peer, via,
 *                t, body }. server.ts wires this to POST /witness.
 *                Absent = a warn per peer (exchanges still flow, but
 *                the Scribe half is unwired — fix the wiring, don't
 *                pretend the record exists). A witness throw is logged
 *                and never blocks the line or the reply.
 *   createLine   transport factory (default: the built-in line v1
 *                transport above). Tests inject a mock here.
 *   configPollMs re-read peer config this often and ADD new peers
 *                (default 0 = off; refreshPeers() always works).
 *   logger, logLevel  same shape as telephone-poller.cjs.
 *
 * Returns a handle: { stop(), sendTo(peer, body), refreshPeers(),
 *   getStatus(), getPeers() }.
 */
function startAntenna(options) {
  const opts = options || {};
  const ownNumber = cleanNumber(opts.number || process.env.GSK_ANTENNA_NUMBER || DEFAULT_NUMBER);
  if (!isValidNumber(ownNumber)) {
    throw new Error(`antenna-line: own number "${ownNumber}" is not a 222-XXXX number`);
  }
  const apiKey = opts.apiKey || process.env.GSK_ANTENNA_API_KEY;
  if (!apiKey) {
    throw new Error(
      'antenna-line: no line key — set GSK_ANTENNA_API_KEY (or options.apiKey) from the private transfer; refusing to start without one'
    );
  }
  const baseUrl = opts.baseUrl || process.env.GSK_ANTENNA_BASE_URL || RELAY_BASE;
  const logger = makeLogger(opts.logger, opts.logLevel || 'debug');
  const onMessage = opts.onMessage;
  const witnessFn = opts.witness;
  const createLine = opts.createLine || defaultCreateLine;

  let stopped = false;
  const lines = new Map(); // peer -> { line, peerOnline, status }

  function witness(entry) {
    if (typeof witnessFn !== 'function') return;
    try {
      const r = witnessFn(entry);
      if (r && typeof r.catch === 'function') r.catch((e) => logger.error(`witness failed for peer ${entry.peer} (${e && e.message})`));
    } catch (e) {
      logger.error(`witness threw for peer ${entry.peer} (${e && e.message})`);
    }
  }

  function openLine(peer) {
    if (lines.has(peer)) return lines.get(peer);
    const pair = pairKey(ownNumber, peer);
    const rec = { line: null, peerOnline: false, status: 'connecting' };
    const line = createLine({
      baseUrl,
      apiKey, // placed ONLY in the transport's auth (header/query) — never logged
      to: peer,
      onMessage: async (msg) => {
        // Witness FIRST: the record exists even if the kernel fails.
        witness({
          type: 'antenna_line_exchange',
          pair,
          direction: 'in',
          from: msg.from || peer,
          to: ownNumber,
          peer,
          via: msg.via || 'line',
          t: msg.t || Date.now(),
          body: msg.body || '',
        });
        if (typeof onMessage !== 'function') {
          logger.info(`peer ${peer}: message received, no kernel hook (no reply)`);
          return;
        }
        let reply;
        try {
          reply = await onMessage({
            agentNumber: ownNumber,
            peerNumber: peer,
            call: { from: msg.from || peer, body: msg.body || '', via: msg.via || 'line', id: msg.id },
          });
        } catch (err) {
          // Live messages do not redeliver; the witness record holds it.
          logger.error(`peer ${peer}: kernel hook threw (${err && err.message}); no reply posted`);
          return;
        }
        if (typeof reply !== 'string' || reply.trim() === '') {
          logger.info(`peer ${peer}: kernel hook returned empty (no reply)`);
          return;
        }
        // Post VERBATIM. No loop detection, no suppression, ever.
        const res = line.send(reply);
        witness({
          type: 'antenna_line_exchange',
          pair,
          direction: 'out',
          from: ownNumber,
          to: peer,
          peer,
          via: (res && res.via) || 'line',
          t: Date.now(),
          body: reply,
        });
        if (res && res.sent === false && res.error) {
          logger.warn(`peer ${peer}: reply send refused (${res.error})`);
        }
      },
      onPresence: ({ online }) => {
        rec.peerOnline = online === true;
        logger.info(`peer ${peer}: presence ${rec.peerOnline ? 'online' : 'offline'}`);
      },
      onEvent: (ev) => {
        // Delivery fates are logged (numbers + fate only), not
        // re-witnessed: the exchange itself was witnessed at send.
        if (ev && (ev.type === 'queued' || ev.type === 'error')) {
          logger.info(`peer ${peer}: line event ${ev.type}${ev.error ? ` (${ev.error})` : ''}`);
        }
      },
      onStatus: (st) => {
        rec.status = (st && st.status) || rec.status;
        logger.debug(`peer ${peer}: line status ${rec.status}`);
      },
    });
    rec.line = line;
    lines.set(peer, rec);
    if (typeof witnessFn !== 'function') {
      logger.warn(`peer ${peer}: witness NOT wired — exchanges flow but are not recorded; wire witness to SCRIBE /witness`);
    }
    logger.info(`peer ${peer}: line opening (pair ${pair})`);
    return rec;
  }

  function refreshPeers() {
    if (stopped) return [];
    let list;
    try {
      list = loadPeerList({ ...opts, _ownNumber: ownNumber });
    } catch (err) {
      logger.error(`peer config reload failed (${err && err.message}); keeping current lines`);
      return [];
    }
    if (list.length === 0) {
      logger.error('peer config reload found zero peers; keeping current lines');
      return [];
    }
    const added = [];
    for (const peer of list) {
      if (!lines.has(peer)) {
        openLine(peer);
        added.push(peer);
      }
    }
    if (added.length > 0) logger.info(`peer config: added ${added.join(',')}`);
    return added;
  }

  // Boot: the initial peer list must be non-empty and valid, or throw.
  const initial = loadPeerList({ ...opts, _ownNumber: ownNumber });
  if (initial.length === 0) {
    throw new Error(
      'antenna-line: no peers configured — set GSK_ANTENNA_PEERS (e.g. "222-0001") or a peers file; refusing to start peerless'
    );
  }
  for (const peer of initial) openLine(peer);
  logger.info(`antenna up: own ${ownNumber}, peers ${initial.join(',')}`);

  let configTimer = null;
  const configPollMs = opts.configPollMs !== undefined
    ? opts.configPollMs
    : (process.env.GSK_ANTENNA_CONFIG_POLL_MS ? parseInt(process.env.GSK_ANTENNA_CONFIG_POLL_MS, 10) : 0);
  if (typeof configPollMs === 'number' && configPollMs > 0) {
    configTimer = setInterval(() => {
      try {
        refreshPeers();
      } catch (err) {
        logger.error(`config poll failed (${err && err.message})`);
      }
    }, configPollMs);
    if (typeof configTimer.unref === 'function') configTimer.unref();
  }

  return {
    stop() {
      stopped = true;
      if (configTimer) clearInterval(configTimer);
      for (const [peer, rec] of lines) {
        try {
          if (rec.line) rec.line.close();
        } catch (_e) {}
        logger.info(`peer ${peer}: line closed`);
      }
      lines.clear();
    },
    sendTo(peer, body) {
      const rec = lines.get(cleanNumber(peer));
      if (!rec) return { sent: false, error: 'peer not configured' };
      const text = typeof body === 'string' ? body.trim() : '';
      if (!text) return { sent: false, error: 'body required' };
      if (text.length > MAX_BODY) return { sent: false, error: 'body too long' };
      const res = rec.line.send(text);
      witness({
        type: 'antenna_line_exchange',
        pair: pairKey(ownNumber, peer),
        direction: 'out',
        from: ownNumber,
        to: cleanNumber(peer),
        peer: cleanNumber(peer),
        via: (res && res.via) || 'line',
        t: Date.now(),
        body: text,
      });
      return res;
    },
    refreshPeers,
    getStatus() {
      const peers = [];
      for (const [peer, rec] of lines) {
        let transport = null;
        try {
          transport = rec.line ? rec.line.getState() : null;
        } catch (_e) {}
        peers.push({
          peer,
          status: (transport && transport.status) || rec.status,
          peerOnline: rec.peerOnline,
          buffered: (transport && transport.buffered) || 0,
        });
      }
      return { own: ownNumber, peers };
    },
    getPeers() {
      return Array.from(lines.keys());
    },
  };
}

module.exports = {
  startAntenna,
  __internals: {
    loadPeerList,
    parsePeersEnv,
    readPeersFile,
    pairKey,
    backoffFor,
    isValidNumber,
    defaultCreateLine,
    lineWsUrl,
    RELAY_BASE,
    DEFAULT_NUMBER,
    MAX_BODY,
    MAX_BUFFERED,
    MAX_SEEN_IDS,
  },
};

/* ─── WIRING (round-2 agent: add this to server.ts on the PC build,
 *     NOT to this file) ───
 *
 * server.ts is ESM with `const _require = _cr(import.meta.url)` (createRequire).
 * Load this CommonJS module the same way server.ts loads telephone-poller.cjs:
 *
 *   const { startAntenna } = _require(path.join(__dirname, "antenna-line.cjs"));
 *
 * Then, once, near the other daemon startups (after the server is listening):
 *
 *   const antenna = startAntenna({
 *     // Key: GSK's OWN 222-0002 line key, on the PC via Craig's private
 *     // transfer decision. Env GSK_ANTENNA_API_KEY, or options.apiKey.
 *     // Peers: env GSK_ANTENNA_PEERS="222-0001" today; the Builder's
 *     // number joins the list when he registers (refreshPeers picks it
 *     // up, or restart). Peers are NEVER invented.
 *     onMessage: async ({ agentNumber, peerNumber, call }) => {
 *       // Route by peerNumber exactly like telephoneKernelReply routes
 *       // by agentNumber for the poller. Return the reply body string,
 *       // or "" to stay silent on this message. The reply posts VERBATIM
 *       // on the same line — loops included, never suppressed.
 *       return "";
 *     },
 *     witness: async (entry) => {
 *       // The existing SCRIBE flow — same shape as the sliding-window
 *       // witness already in server.ts. Bodies travel in the ledger;
 *       // the antenna module itself never logs them.
 *       await fetch(`${SCRIBE_URL}/witness`, {
 *         method: "POST",
 *         headers: { "Content-Type": "application/json", "X-API-Key": scribeKey() },
 *         body: JSON.stringify({
 *           type: "antenna_line_exchange",
 *           content: `${entry.pair} ${entry.direction} ${entry.from}->${entry.to} via ${entry.via}\n${entry.body}`.slice(0, 8000),
 *           source: "GSK-antenna",
 *           tags: ["antenna-line", entry.pair, entry.direction],
 *         }),
 *         signal: AbortSignal.timeout(10000),
 *       });
 *     },
 *   });
 *   // Kernel-originated messages (not only replies):
 *   antenna.sendTo("222-0001", "GSK on the line.");
 * ─────────────────────────────────────────────────────────────────────────── */
