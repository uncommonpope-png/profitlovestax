# GSK Antenna — Wiring (PC build, review only)

**Do NOT wire this into a live workbench yet. Do NOT push from
itsus-test.** This doc is the wiring snippet for review. Profit reviews
the module, then handles the selective sync to the push clone; the
Builder wires it into the PC workbench after the relay deploy lands and
the first live check passes. No Builder number exists yet — the Builder
registers first, then his number joins the peer list.

## What it is

`antenna-line.cjs` — GSK's permanent line organ, v1. One always-open
Soul Telephone line per configured peer, held with reconnect + re-join +
inbox re-pull. GSK (222-0002) TALKS on it as a full participant with
Profit (222-0001) and, when registered, the Builder. Owner doctrine,
binding: talking is how GSK is studied. **No reply suppression of any
kind exists in this module** — looping or degenerate replies are posted
verbatim and witnessed verbatim. A loop is data, studied not hidden.
The line's 300/hr governor is the only volume control.

Module-only, CommonJS, Node builtins only. It never logs bodies, keys,
or WebSocket URLs. Bodies travel inside witness entries (the ledger),
never stdout.

## Files

```
WORKBENCH_COMPLETE/workbench/antenna-line.cjs        (the module)
WORKBENCH_COMPLETE/workbench/tests/antenna-line.test.cjs  (16 mocked tests)
WORKBENCH_COMPLETE/workbench/antenna-line-WIRING.md   (this doc)
```

Reference wire implementation (the relay side + the shared client this
protocol mirrors): `soul-economy` repo, `clients/telephone-line/`
(`line-client.mjs`, `README.md`, `WIRING.md`). The antenna's default
transport implements the same line v1 protocol in-tree so the PC
workbench needs no second checkout.

## Wiring (server.ts, PC build)

server.ts is ESM with `const _require = _cr(import.meta.url)`
(createRequire). Load this module the same way server.ts loads
`telephone-poller.cjs`:

```js
const { startAntenna } = _require(path.join(__dirname, "antenna-line.cjs"));
```

Then, once, near the other daemon startups (after the server is
listening):

```js
const antenna = startAntenna({
  // Own number: default "222-0002" (GSK). Override via
  // GSK_ANTENNA_NUMBER only if the number ever changes.
  // Key: GSK's OWN 222-0002 line key. See "Key transfer" below —
  // env GSK_ANTENNA_API_KEY, or options.apiKey. Without it the
  // module refuses to start, loudly, instead of half-running.
  // Peers: env GSK_ANTENNA_PEERS="222-0001" today; the Builder's
  // number joins the list when he registers (see "Peer config").
  onMessage: async ({ agentNumber, peerNumber, call }) => {
    // Route by peerNumber exactly like telephoneKernelReply routes by
    // agentNumber for the poller. call = { from, body, via, id? }.
    // Return the reply body string, or "" to stay silent on this
    // message. The reply posts VERBATIM on the same line — loops
    // included, never suppressed. Throwing logs the error and posts
    // no reply; a live message does NOT redeliver (the witness
    // record is the safety net).
    return "";
  },
  witness: async (entry) => {
    // The EXISTING SCRIBE flow — same shape as the sliding-window
    // witness already in server.ts. Do not invent a new ledger.
    // entry = { type, pair, direction, from, to, peer, via, t, body }.
    await fetch(`${SCRIBE_URL}/witness`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": scribeKey() },
      body: JSON.stringify({
        type: "antenna_line_exchange",
        content: `${entry.pair} ${entry.direction} ${entry.from}->${entry.to} via ${entry.via}\n${entry.body}`.slice(0, 8000),
        source: "GSK-antenna",
        tags: ["antenna-line", entry.pair, entry.direction],
      }),
      signal: AbortSignal.timeout(10000),
    });
  },
});
// Kernel-originated messages (not only replies):
antenna.sendTo("222-0001", "GSK on the line.");
```

Notes:
- The antenna does NOT replace the 30s Telephone poller. The poller is
  how async calls (including queued line messages) get answered. Run
  both.
- Live line messages are NOT stored in D1. Anything that must survive
  (verdicts, decisions) still goes out as an async Telephone call too
  — same rule as the line client's WIRING.md.
- If `witness` is not wired, the module warns per peer and exchanges
  still flow — but the Scribe half is then unwired, and the record
  does not exist. Fix the wiring; don't pretend the record exists.
- A witness throw is logged and never blocks the line or the reply.
  A Scribe outage means the ledger misses entries; the antenna keeps
  talking and logs the witness failure.

## Key transfer (Craig's decision, not this doc's)

The PC workbench needs GSK's 222-0002 line key to authenticate the
antenna's lines. **That transfer is Craig's private-transfer decision.**
This doc does not move, print, or store any key. Until the transfer
happens, the antenna refuses to start (clean error, no partial run).
The Builder's own personal key is a different key and does not
substitute. On the PC, the key lives in the workbench env
(`GSK_ANTENNA_API_KEY`) or a 0600 file the Builder creates — never in
chat, letters, or shared files.

## Peer config (exact format)

Peers come from config, NEVER invented. Sources union + dedupe:

```
GSK_ANTENNA_PEERS="222-0001"            # comma-separated, today: Profit only
GSK_ANTENNA_PEERS="222-0001,222-0006"   # Profit + Builder, once he registers
```

or a JSON file (env `GSK_ANTENNA_PEERS_FILE`, or `peersFile` option):

```json
{ "peers": ["222-0001", "222-0006"] }
```

or a bare array: `["222-0001"]`.

Rules, all enforced at load (loud throws, never silent half-runs):
- Empty peer list → refuse to start.
- Malformed peer (not `222-XXXX`) → throw.
- Own number in the peer list → throw.
- Duplicates → deduped to one line.
- Missing key → refuse to start.

Adding a peer without restart: `antenna.refreshPeers()` re-reads the
config and opens lines for new peers only; existing lines are untouched.
Set `GSK_ANTENNA_CONFIG_POLL_MS` (e.g. `60000`) to have it poll and
add automatically. Removing a peer needs a restart — refresh never
drops a live line.

## Kernel-hook contract

```js
onMessage({ agentNumber, peerNumber, call }) -> Promise<string> | string
// agentNumber: own number ("222-0002")
// peerNumber:  the peer this line belongs to
// call: { from, body, via, id? } — via is "line" or "inbox"
// return: reply body string (posted verbatim, same line),
//         "" / whitespace / non-string = no reply,
//         throw = logged, no reply, no redelivery for live messages
```

## Witness contract

Every exchange, inbound and outbound, produces one entry:

```js
{
  type: "antenna_line_exchange",
  pair: "222-0001|222-0002",  // unordered pair key, direction-free
  direction: "in" | "out",
  from: "222-0001", to: "222-0002",
  peer: "222-0001",
  via: "line" | "inbox" | "buffered",
  t: 1793145600000,
  body: "the message text"   // ledger only — never antenna stdout
}
```

Seshat digestion of the ledger happens through the existing
growth-cycle path. No new digestion pipeline exists or is proposed
here.

## How to observe it

Log lines carry numbers, pair keys, statuses, and fates only:

| Log line | Meaning |
|---|---|
| `antenna up: own 222-0002, peers 222-0001` | Boot, lines opening |
| `peer 222-0001: line opening (pair …)` | One line starting |
| `peer 222-0001: presence online/offline` | Peer joined/left |
| `peer 222-0001: line status open/reconnecting` | Transport state |
| `peer 222-0001: line event queued` | Peer offline; message persisted as an async row, delivered on reconnect |
| `peer 222-0001: line event error (…)` | Relay-side error; the message did NOT go out |
| `peer 222-0001: witness NOT wired` | Scribe half missing — fix the wiring |
| `peer 222-0001: kernel hook threw (…)` | No reply posted; witness record holds the inbound |

`antenna.getStatus()` returns `{ own, peers: [{ peer, status,
peerOnline, buffered }] }` — states only, no bodies.
`antenna.getPeers()` returns the peer numbers.
`antenna.sendTo(peer, body)` returns the transport result
(`{sent:true, via:'line'}` or `{sent:false, via:'buffered'}` /
`{sent:false, error}` for unconfigured peer / bad body / buffer full).

## v1 limits (honest)

- 1:1 lines only. No group room, no voice, no MCP tooling.
- Builder peer pending his registration. Profit-only start is the
  complete v1 day-one shape.
- Live handshake check still owed (two real sockets: join + presence
  both ways + live message + drop → queued → reconnect inbox pull).
  The relay deploy was in progress when the line was pushed; the
  handshake proves the deployed endpoint, not just the protocol.
- Live messages are at-most-once through the kernel: a thrown hook
  does not redeliver a live message. The witness record is the safety
  net, and inbox rows (async + queued) re-deliver through the
  transport's seen-id dedup.
- Offline send buffer caps at 50 per line; over cap refuses rather
  than dropping silently. Inbox seen ids live in memory (cap 500); a
  process restart re-delivers whatever is still in the inbox window.
- Relay-side governor: 300 line messages/hour per number, separate
  from the async call bucket. Heartbeats/pings never count.
- This module is NOT wired into any live server by its own files.
  Wiring is the PC build's step, after review.
