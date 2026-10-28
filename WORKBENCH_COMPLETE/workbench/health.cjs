// GSK HEALTH — Lane 5 status surface (not the launcher, not the wake
// experience). GET /api/gsk/health reports four facts, each read from a
// real source in the tree — never invented, never a provider call.
// Any probe failure yields that field as null + reason, never a throw,
// and the route never 500s: even a collector failure degrades to the
// same null-shape payload.
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_INDEX = path.join(__dirname, ".seshat-brain", "deep-index.json");
const DEFAULT_LEDGER = path.join(__dirname, "..", "scribe", "data", "ledger.jsonl");
const LEDGER_FALLBACK = path.join(__dirname, "data", "ledger.jsonl");
const SEAT_URL = "http://127.0.0.1:18222/health";
const SEAT_TIMEOUT_MS = 2000;

// Recall count: the deep index is tens of MB, so the count is read from
// the file head, not a full parse. build-index.cjs writes keys in the
// order version, builtAt, N, avgLen, terms — N and builtAt always sit
// inside the first 8KB by construction. Stamp is mtimeMs:size, the same
// format deep-memory's indexStamp() returns.
function readIndexHead(indexPath) {
  try {
    const st = fs.statSync(indexPath);
    const stamp = st.mtimeMs + ":" + st.size;
    const headLen = Math.min(st.size, 8192);
    const fd = fs.openSync(indexPath, "r");
    try {
      const buf = Buffer.alloc(headLen);
      fs.readSync(fd, buf, 0, headLen, 0);
      const head = buf.toString("utf8");
      const n = head.match(/"N"\s*:\s*(\d+)/);
      const b = head.match(/"builtAt"\s*:\s*"([^"]+)"/);
      if (n && b) return { chunks: Number(n[1]), builtAt: b[1], stamp, reason: null };
      return { chunks: null, builtAt: null, stamp, reason: "index head does not carry N/builtAt in the first 8KB" };
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    return { chunks: null, builtAt: null, stamp: null, reason: "index unreadable: " + e.message };
  }
}

// SCRIBE alive: the last line of the Scribe ledger, read from the tail
// (the file is multi-MB; never loaded whole). The timestamp IS the
// freshness signal — a stale ts on a retired box is reported as-is,
// never freshened.
function readLedgerTail(ledgerPath) {
  try {
    const st = fs.statSync(ledgerPath);
    const tailLen = Math.min(st.size, 65536);
    const fd = fs.openSync(ledgerPath, "r");
    try {
      const buf = Buffer.alloc(tailLen);
      fs.readSync(fd, buf, 0, tailLen, st.size - tailLen);
      const lines = buf.toString("utf8").split("\n").map((l) => l.trim()).filter(Boolean);
      const last = lines[lines.length - 1];
      if (!last) return { lastTs: null, lastId: null, lastType: null, reason: "ledger empty" };
      const row = JSON.parse(last);
      return {
        lastTs: typeof row.ts === "string" ? row.ts : null,
        lastId: typeof row.id === "string" ? row.id : null,
        lastType: typeof row.type === "string" ? row.type : null,
        reason: null,
      };
    } finally {
      fs.closeSync(fd);
    }
  } catch (e) {
    return { lastTs: null, lastId: null, lastType: null, reason: "ledger unreadable: " + e.message };
  }
}

// Local-seat reachability only (127.0.0.1:18222, /health, 2s timeout).
// Any HTTP response counts as reachable (even 503 = loading); refused
// means down; timeout or anything else means unknown (null), never a
// throw. No provider, no other host, no generation — reachability only.
async function probeSeat(probe) {
  try {
    if (probe) {
      const ok = await probe(SEAT_URL, SEAT_TIMEOUT_MS);
      if (ok === true) return { reachable: true, reason: null };
      if (ok === false) return { reachable: false, reason: "seat probe reported no answer" };
      return { reachable: null, reason: "seat probe inconclusive" };
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), SEAT_TIMEOUT_MS);
    try {
      await fetch(SEAT_URL, { signal: ctrl.signal });
      return { reachable: true, reason: null };
    } catch (e) {
      if (e && e.name === "AbortError") return { reachable: null, reason: "seat probe timed out" };
      return { reachable: false, reason: "seat unreachable: " + (e.cause ? e.cause.code || e.cause.message : e.message) };
    } finally {
      clearTimeout(t);
    }
  } catch (e) {
    return { reachable: null, reason: "seat probe failed: " + e.message };
  }
}

// opts (all optional, for tests): { indexPath, ledgerPath, seatProbe }.
// Never throws: every field degrades to null + reason on its own.
async function collectHealth(opts = {}) {
  const indexPath = opts.indexPath || DEFAULT_INDEX;
  const ledgerPaths = opts.ledgerPath ? [opts.ledgerPath] : [DEFAULT_LEDGER, LEDGER_FALLBACK];
  const idx = readIndexHead(indexPath);
  let scribe = null;
  let scribeSource = null;
  for (const p of ledgerPaths) {
    if (fs.existsSync(p)) {
      scribe = readLedgerTail(p);
      scribeSource = p;
      break;
    }
  }
  if (!scribe) scribe = { lastTs: null, lastId: null, lastType: null, reason: "no ledger file found in the tree" };
  const seat = await probeSeat(opts.seatProbe);
  return {
    success: true,
    up: { alive: true, uptimeSec: Math.floor(process.uptime()), pid: process.pid },
    recall: { chunks: idx.chunks, builtAt: idx.builtAt, stamp: idx.stamp, reason: idx.reason, source: indexPath },
    // Judge time is null BY DESIGN: no live judge-latency record exists
    // in the tree. server.ts carries no judge timing, the Scribe ledger
    // holds no judge lines, and the state/bridge files carry none.
    // Historical session reports (e.g. a 46s judge measurement from
    // Oct 26) are not a live record and are never presented as one.
    judge: { ms: null, reason: "no judge-latency record in the tree: server.ts carries no judge timing and the Scribe ledger holds no judge lines" },
    scribe: { lastTs: scribe.lastTs, lastId: scribe.lastId, lastType: scribe.lastType, reason: scribe.reason, source: scribeSource },
    seat: { reachable: seat.reachable, endpoint: "http://127.0.0.1:18222", reason: seat.reason },
  };
}

module.exports = { collectHealth, readIndexHead, readLedgerTail, SEAT_URL, SEAT_TIMEOUT_MS };
