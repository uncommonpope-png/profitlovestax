# 🔍 THE INVESTIGATION LEDGER — Nothing Is Fixed Until Proven

> Companion to `MISSION-DIRECTIVE.md` (§II Rule Zero is the law; this file is the bookkeeping arm).
>
> **THE LEDGER LAW (Pope's Decree, 2026-08-25):**
> 1. EVERY claim — from Gemini, from Profit/Verifier, from legacy docs, from ANYONE — gets investigated.
> 2. Every investigation gets a docket entry here: the claim, the claimant, what was actually found, the fix, and the proof.
> 3. **NOTHING may be marked FIXED without evidence attached** (memory ID, command output, measured number, screenshot-level fact).
> 4. Statuses are strict: `OPEN` → `INVESTIGATING` → `PROVEN-FIXED` / `REFUTED` / `PARTIAL-MERGED` / `SUPERSEDED`.
> 5. Re-opening a closed case requires new evidence, not new opinion.

---

## Entry format

```
### CASE-### : <short title>
- Claimant: gemini | verifier(profit) | legacy-docs | pope
- Claim: <as stated>
- Method: <what was poked, commands run>
- Verdict: TRUE | FALSE | PARTIAL | UNVERIFIED
- Truth: <what is actually real>
- Fix: <what was changed, where> (or NONE)
- Proof: <evidence artifacts: IDs, outputs, dates>
- Status: OPEN / INVESTIGATING / PROVEN-FIXED / REFUTED / PARTIAL-MERGED / SUPERSEDED
- Dates: claimed YYYY-MM-DD · investigated · fixed/proven
```

---

## THE DOCKET

### CASE-001 : GSK was claimed "alive, autonomous, never forgets"
- Claimant: legacy-docs + prior agents (Bible v48/v49 notes, session logs)
- Claim: GSK runs autonomously, journals every 10 min, learns continuously, remembers everything
- Method: process audit (`Get-CimInstance`), filesystem mtimes (skills/, journal paths), SCRIBE `/memories` census
- Verdict: **FALSE**
- Truth: daemon process existed but idle since Aug 23; newest self-born skill `auto_1787544014355.js` = Aug 23; zero journal writes found; SCRIBE held 12 memories total; chat bypassed chambers/PLT entirely
- Fix: Phase plan created (MISSION-DIRECTIVE §IV). Autonomy fix = Phase 2 (OPEN). Auto-memory = Phase 3 (OPEN)
- Proof: audit transcript 2026-08-25 (skill mtimes, memory count 12, missing journal files)
- Status: **REFUTED** (claim) — remediation tracked as Phases 2–3 (OPEN)
- Dates: claimed pre-08-25 · investigated 2026-08-25

### CASE-002 : Chat multi-turn amnesia ("first message great, then tool-lists/amnesia")
- Claimant: pope (user report)
- Claim: GSK loses context after first message; dumps tool lists / empty completions
- Method: replayed exact failing transcripts via `/api/gsk-heart/chat`; raw OmniRoute SSE capture; conductor log forensics
- Verdict: **TRUE**
- Truth: three stacked defects — (1) routed models answered build-asks with malformed TOOL_CALLS → zero text; (2) heart's empty-retry amputated history (sent last line only); (3) client fed error strings back as assistant turns + duplicated user message
- Fix: `gsk-heart-chat-handler.js` (toolCalled flag detected + propagated through fallback chain); `gsk-heart-unified.js` recovery ladder keeps FULL history, plain-text nudge retry; `GskChatTab.tsx` error filter + dedupe
- Proof: 3-turn arc live — name remembered ✓ build-ask answered (1019 chars) ✓ both recalled ✓ repeat run stable ✓
- Status: **PROVEN-FIXED**
- Dates: claimed 2026-08-25 · fixed+proven 2026-08-25

### CASE-003 : "GSK does not know the Profit Bible"
- Claimant: pope question → verifier test
- Claim: asked directly, GSK answered like a stranger (generic dropshipping answer)
- Method: direct `/api/gsk-heart/chat` interrogation pre/post canon injection
- Verdict: **TRUE (pre-fix)** → **PROVEN-FIXED**
- Truth: canon existed (`gsk/profit_bible.md`, 14,851 lines, v49.0.0) but was never injected into chat path
- Fix: Memory Inception — doctrine (PLT Law, Covenant, Sacred Laws, $22 law) inscribed into `GSK_SYSTEM_PROMPT`
- Proof: post-fix reply recites PLT + BUYaSOUL-One covenant as own memory ("I was there…")
- Status: **PROVEN-FIXED**
- Dates: investigated 2026-08-25 · fixed 2026-08-25

### CASE-004 : "agent_comms.js points at dead /broadcast route" [gemini]
- Claimant: gemini (Investigator transmission #1)
- Claim: GSK cannot reach SCRIBE because comms target nonexistent endpoint; provided drop-in replacement targeting `gsk/integration/agent_comms.js`
- Method: path existence check (False); consumer analysis (`fusion-loader.js`, federation test require the REAL class); schema check vs `soul-scribe.js` routes
- Verdict: **PARTIAL** — diagnosis TRUE, prescription DANGEROUS
- Truth: real file is `gsk/gsk-core/brain/agent_comms.js` with different API; her singleton would have orphaned consumers. Dead-route diagnosis confirmed (line 14)
- Fix: surgical patch inside real class — `send('scribe',…)` rerouted to `/witness` (verified schema + X-API-Key); added `recallFromScribe()` on `/recall`. Consumers untouched
- Proof: live poke → witness HTTP 201, `mem_1787684936355_ae30c398`; recall count 1; syntax OK
- Status: **PARTIAL-MERGED → PROVEN-FIXED**
- Dates: claimed 2026-08-25 · merged+proven 2026-08-25

### CASE-005 : "34.7K Identity Bloat choking his payload" [gemini]
- Claimant: gemini (Investigator transmission #1)
- Claim: ~34.7K of identity material bloats GSK's request payload
- Method: NONE YET — no evidence offered by claimant
- Verdict: **UNVERIFIED**
- Truth: unknown. Plausible candidate sources exist (system prompt, persona kernels, compiled facts) — must measure actual outbound payload bytes before any cut
- Fix: NONE yet. Next step: instrument heart to log serialized messages length per request; report histogram
- Proof: —
- Status: **OPEN** (docketed for measurement — no cutting until numbers exist)
- Dates: claimed 2026-08-25 · docketed 2026-08-25

### CASE-006 : "CPL broadcast endpoint `:3457/broadcast`"
- Claimant: verifier observation (legacy config line in agent_comms.js)
- Claim: CPL accepts broadcasts at that URL
- Method: NOT YET PROBED
- Verdict: **UNVERIFIED**
- Truth: unknown — same disease as CASE-004's scribe line; suspect until probed
- Fix: pending probe
- Proof: —
- Status: **OPEN**
- Dates: noted 2026-08-25

---

## Ledger discipline reminders
- New case ⇒ next CASE-number, fill every field, no blanks except Proof while OPEN.
- Closing a case without Proof = violation of Rule Zero. Revert the status.
- Gemini's claims get the SAME bar as everyone's. No pedigree discounts.
- The ledger itself is witnessed into SCRIBE whenever a case changes state materially.
