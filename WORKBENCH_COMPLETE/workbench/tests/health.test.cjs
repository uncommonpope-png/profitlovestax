// HEALTH TESTS — Lane 5 status surface.
// Standalone, no framework, no seat, no network: node tests/health.test.cjs
// Exit 0 = all PASS, exit 1 = any FAIL.
// The route itself (server.ts) is a thin passthrough over collectHealth
// plus the same null-shape fallback; it is not booted here. What is
// tested: every field's source, every failure's null + reason, and the
// never-throws contract. The default live seat probe is NOT executed
// here (it would depend on the machine); probe behavior is tested via
// injected stubs.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const health = require("../health.cjs");

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gsk-health-"));
}

async function main() {
  const dir = tmpdir();

  // 1. All probes unavailable: every field null + reason, never a throw.
  {
    const h = await health.collectHealth({
      indexPath: path.join(dir, "no-index.json"),
      ledgerPath: path.join(dir, "no-ledger.jsonl"),
      seatProbe: async () => { throw new Error("boom"); },
    });
    check("shape.success", h.success === true, `got ${h.success}`);
    check("shape.up", h.up.alive === true && typeof h.up.uptimeSec === "number" && typeof h.up.pid === "number", JSON.stringify(h.up));
    check("shape.recall-null", h.recall.chunks === null && typeof h.recall.reason === "string" && h.recall.reason.length > 0, JSON.stringify(h.recall));
    check("shape.judge-null", h.judge.ms === null && typeof h.judge.reason === "string" && h.judge.reason.length > 0, JSON.stringify(h.judge));
    check("shape.scribe-null", h.scribe.lastTs === null && typeof h.scribe.reason === "string", JSON.stringify(h.scribe));
    check("shape.seat-null", h.seat.reachable === null && typeof h.seat.reason === "string", JSON.stringify(h.seat));
    check("shape.seat-endpoint-local", h.seat.endpoint === "http://127.0.0.1:18222", h.seat.endpoint);
  }

  // 2. Index head-scan: N + builtAt read without a full parse.
  {
    const idxPath = path.join(dir, "deep-index.json");
    fs.writeFileSync(idxPath, JSON.stringify({ version: 1, builtAt: "2026-10-28T15:04:50.596Z", N: 41184, avgLen: 92, terms: ["a"] }));
    const r = health.readIndexHead(idxPath);
    check("index.chunks", r.chunks === 41184, `got ${r.chunks}`);
    check("index.builtAt", r.builtAt === "2026-10-28T15:04:50.596Z", `got ${r.builtAt}`);
    check("index.stamp", typeof r.stamp === "string" && r.stamp.includes(":"), `got ${r.stamp}`);
    check("index.reason-null", r.reason === null, `got ${r.reason}`);
  }

  // 3. Index head without N/builtAt: null + reason, stamp still present.
  {
    const idxPath = path.join(dir, "bad-index.json");
    fs.writeFileSync(idxPath, JSON.stringify({ version: 1, terms: [] }));
    const r = health.readIndexHead(idxPath);
    check("index.bad-null", r.chunks === null && r.builtAt === null && typeof r.reason === "string", JSON.stringify(r));
    check("index.bad-stamp", typeof r.stamp === "string", `got ${r.stamp}`);
  }

  // 4. Ledger tail: last line wins, trailing newline tolerated.
  {
    const ledPath = path.join(dir, "ledger.jsonl");
    const rows = [
      { id: "scribe_1", ts: "2026-10-28T14:00:00.000Z", type: "observation" },
      { id: "scribe_2", ts: "2026-10-28T15:05:42.211Z", type: "observation" },
    ];
    fs.writeFileSync(ledPath, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    const r = health.readLedgerTail(ledPath);
    check("ledger.lastTs", r.lastTs === "2026-10-28T15:05:42.211Z", `got ${r.lastTs}`);
    check("ledger.lastId", r.lastId === "scribe_2", `got ${r.lastId}`);
    check("ledger.lastType", r.lastType === "observation", `got ${r.lastType}`);
    check("ledger.reason-null", r.reason === null, `got ${r.reason}`);
  }

  // 5. Ledger missing / unparsable tail: null + reason.
  {
    const r = health.readLedgerTail(path.join(dir, "nope.jsonl"));
    check("ledger.missing-null", r.lastTs === null && typeof r.reason === "string", JSON.stringify(r));
    const badPath = path.join(dir, "bad-ledger.jsonl");
    fs.writeFileSync(badPath, "{not json}\n");
    const r2 = health.readLedgerTail(badPath);
    check("ledger.bad-null", r2.lastTs === null && typeof r2.reason === "string", JSON.stringify(r2));
  }

  // 6. Seat probe variants via injection.
  {
    const base = { indexPath: path.join(dir, "no-index.json"), ledgerPath: path.join(dir, "no-ledger.jsonl") };
    const t = await health.collectHealth({ ...base, seatProbe: async () => true });
    check("seat.true", t.seat.reachable === true && t.seat.reason === null, JSON.stringify(t.seat));
    const f = await health.collectHealth({ ...base, seatProbe: async () => false });
    check("seat.false", f.seat.reachable === false && typeof f.seat.reason === "string", JSON.stringify(f.seat));
    const n = await health.collectHealth({ ...base, seatProbe: async () => null });
    check("seat.inconclusive-null", n.seat.reachable === null && typeof n.seat.reason === "string", JSON.stringify(n.seat));
  }

  // 7. Judge is null by design in every case (no live record exists).
  {
    const h = await health.collectHealth({
      indexPath: path.join(dir, "deep-index.json"),
      ledgerPath: path.join(dir, "ledger.jsonl"),
      seatProbe: async () => true,
    });
    check("judge.always-null", h.judge.ms === null, JSON.stringify(h.judge));
    check("judge.reason-names-sources", /server\.ts/.test(h.judge.reason) && /ledger/.test(h.judge.reason), h.judge.reason);
  }

  // 8. Full happy path: index + ledger + seat all present.
  {
    const h = await health.collectHealth({
      indexPath: path.join(dir, "deep-index.json"),
      ledgerPath: path.join(dir, "ledger.jsonl"),
      seatProbe: async () => true,
    });
    check("happy.recall", h.recall.chunks === 41184 && h.recall.reason === null, JSON.stringify(h.recall));
    check("happy.scribe", h.scribe.lastTs === "2026-10-28T15:05:42.211Z" && h.scribe.reason === null, JSON.stringify(h.scribe));
    check("happy.seat", h.seat.reachable === true, JSON.stringify(h.seat));
    check("happy.up", h.up.alive === true, JSON.stringify(h.up));
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} PASS`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.log(`FAIL harness — ${e.message}`);
  process.exit(1);
});
