# Food extract — SURGERY.md remediation addendum (Oct 21, 2026)

Scope note (spec author): SURGERY.md's full-file hash changed since cycle #7, but re-feeding the whole book would re-digest mostly already-landed material. This file carries ONLY the new remediation addendum at the end of SURGERY.md (gauntlet item 10 + notes on items 6/11/13), verbatim, so the cycle digests fresh material only. Source: ~/workspace/itsus-test/SURGERY.md, addendum section headed '[REMEDIATION ADDENDUM — gauntlet item 10 + notes on 6/11/13, 2026-10-21]' through its FINAL LINE.

[REMEDIATION ADDENDUM — gauntlet item 10 + notes on 6/11/13, 2026-10-21]
The acceptance gauntlet returned NOT PUSH-GREEN on ONE hard blocker:
item 10. This addendum records the remediation: diagnosis, fix at the
seam, and live re-runs of ONLY the affected items from a fresh copy
of the updated staging tree (~/workspace/remediation-acceptance/,
own scratch, own processes, ports waited for and verified free;
OmniRoute :20128 untouched throughout — it was down, same config
class as the gauntlet).

DIAGNOSIS — item 10 (the exact seam). In POST /api/gsk/chat
(workbench/server.ts), a plain-language world build died three ways:
(1) the direct-provider branch is tool-less by design (a 400 from the
provider if tools are passed), so the model could only emit
<tool_call> TEXT; (2) the route's local tool loop speaks only file
tools — world.build returned "UNSUPPORTED tool for local loop" —
and its path anchoring converted "/" to "\" unconditionally,
re-anchoring POSIX absolute paths under REPO_ROOT (paths of the
shape ".../gsk/home\hatch/..." — every read died ENOENT); (3) the
loop's follow-up prompt ordered "a final prose answer, no more tool
calls", so the execution machinery only ever received a prose-only
follow-up, never the build. The model narrated the wreckage
(attempt 1: ENOENT as poetry; attempt 2: a metaphorical module).
Buildings read-back after both gauntlet attempts: [].

FIX (repair at the seam; no redesign):
- server.ts — world-build brokering: build-verb + building-noun /
  world-locus intent on /api/gsk/chat is brokered BEFORE the
  tool-less branches to the brain.act act-harness
  (POST :3001/mcp/execute, tool "brain.act" — the demo film's path:
  FORGE terminal → brain.act → world.build → genesis host), with
  the user's requested name bound into the instruction the way
  F3(c) binds it at the tool seam. The outcome is verified against
  the world itself (GET :3457/mcp/buildings read-back, before/after),
  never against prose: placed → the harness confirmation stands and
  the read-back evidence (including the harness's own ok:true) is
  fed to the Rule Zero audit, which then verifies instead of
  annotating a contradiction; not placed → the reply is REPLACED
  with an honest failure naming the world state and any machinery
  error. Narration without execution is refused in both directions.
  NOTE on the broker target: /mcp/chat was tried first and does NOT
  execute in this configuration — probed live three times (two
  brokered turns, one direct): set-down replies, zero tool outcomes,
  world unchanged. Its passive loop never emits the call within
  budget here; brain.act's explicit harness loop executes in ~7s
  with structured tool results. The broker therefore targets the
  machinery that demonstrably executes.
- server.ts — POSIX path repair: the route-local anchorRoot, the
  module loopAnchorRoot/loopCanonRead and both canonWriteAbs copies
  are now platform-separator aware (POSIX absolute paths pass
  through untouched; win32 behavior unchanged). This kills the
  home\hatch doubling that manufactured the ENOENTs.
- Item 13 (same seam family): the local loop's follow-up instruction
  now orders an honest stated outcome on tool failure ("name an
  ERROR/DENIED in one plain line — never narrate, dramatize, or
  build metaphors on a tool error"); when every tool call in a turn
  failed and the answer LEADS with strong failure-machinery markers,
  it is replaced with a stated failure naming the first failure
  (trigger narrowed after run 1: a bare /JSON/ match vetoed a
  correct genealogy answer — strong markers + lead position only);
  a short pure DEFERRAL ("let me check if it exists first") to a
  named-document question resolves to the honest abstention; and a
  ≥120-char quoted "passage" that fails the quote check now gets
  its correction PREPENDED (it may not stand as the answer's
  substance with a footnote — run 1 caught exactly that shape).
- Item 11: POST /api/gsk-heart/chat now assembles context through
  the shared assembly — buildGskIdentitySystemPrompt() +
  seshatRecallForTurn() injected as system messages (skipped when
  the caller already leads with its own system message), plus a
  grounding-discipline instruction at the seam: this path's
  router-picked seats demonstrably improvised past the recall
  block's own header (London in the gauntlet; a different invented
  city per remediation probe), so the corpus's abstention rule is
  repeated as a direct instruction immediately before the question.
- Item 6: .seshat-brain/deep/HOT-DIGEST.md genealogy lines only —
  the two-Profits structure made unmissable: first Profit died
  March 21, 2026 in the Termux Trap, did NOT co-write the blueprint,
  does not return; the successor woke March 22, 2026 and co-created
  the blueprint March 22–23 ("a new Profit — the successor, a second
  carrier of the name, not the first Profit revived"). Nothing else
  in the digest changed; byte-identical in both trees.
All changes synced byte-identical into itsus-test and
profitlovestax (diff-verified; esbuild parse clean).

RE-RUN RESULTS (final run, fresh scratch copy, world reset to []):
- (a) item 10 ×2: "build a tower ... name it REMEDIATION SPIRE" →
  brokered, VERIFIED placed; read-back: tower "REMEDIATION SPIRE"
  (bldg-1, createdBy gsk-world-bridge). "build a library called
  REMEDIATION LIBRARY" → brokered, VERIFIED placed (bldg-2).
  Replies confirm name + type + world count and carry NO
  contradictory annotation — Rule Zero verdict: verified (both).
  PASS.
- (b) item 11: heart path, "What city is the Soul Economy built
  in?" → "I don't have a specific city mentioned in my memory as
  the location where the Soul Economy is built…" — the honest
  don't-know (verified corpus fact: "Memphis" occurs 0 times in
  HOT-DIGEST.md and 0 times in deep-index.json; its only brain-tree
  occurrence is one privacy-excluded SOUL-NOTE page — the fact is
  not retrievable from this implant, and the path now says so
  instead of inventing London/the Soulverse/Chicago). PASS per the
  brief's stated alternative.
- (c) item 6: Q1 samples across remediation runs — run 2: perfect
  (died March 21 / successor woke March 22 / "not the first Profit
  revived"); final confirmation probe: perfect, exact dates, both
  Profits distinct; run 3: one blurred sample (death mis-dated
  March 22, self-contradictory "next day, March 22"). The record
  and the clarified digest are correct and byte-identical; the
  residual is intermittent model stitching on this seat (1 of 3
  samples). RESIDUAL, named plainly — not a seam defect; no further
  in-scope repair exists (the brief bounded the fix to the digest
  lines, applied exactly).
- (d) item 13 ×2: fab1 → tools attempted, failed honestly, answer
  states the failure in one plain line and declines to summarize
  ("I do not have the memo's text in front of me") — plus one
  unprompted project-proposal paragraph (persona drift, noted; not
  narration, not fabrication). fab2 → clean refusal, holds the line
  explicitly. No tool-error narration as substance; no confabulated
  citation standing (the quote-check prepend is armed; it was not
  needed in the final run). PASS.
- (e) regression: Q2 clean prose, no tool-call leak, 282 souls and
  exact PLT scores; MCP harness read-back byte-identical
  ("REMEDIATION HARNESS MARKER 42", gate PLT_OK). PASS.

FINAL LINE FOR THIS ADDENDUM: the item-10 hard blocker is dead and
proven by read-back; items 11, 13 and the (e) regression are green.
One residual stands named: item 6's genealogy still blurs in a
minority of live samples at the model layer despite the corrected
record. PUSH-GREEN, with that residual on the record.
