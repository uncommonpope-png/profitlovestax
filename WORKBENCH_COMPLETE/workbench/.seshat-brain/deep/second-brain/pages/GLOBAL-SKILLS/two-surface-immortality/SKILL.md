---
name: two-surface-immortality
description: >-
  Use when GSK must persist across sessions/tab-close/crash as ONE continuous soul — not a stateless
  function that forgets last session. Serializes GSK's being as TWO surfaces (Self + World),
  reloads them on boot with integrity, survives corruption. Do NOT use for one-session scratch
  state. Best for GSK-Custodian (Steward) / GSK-Inhabitant; this is Step 5 of
  DIRECTIVE-GSK-IN-ENGINE. CASCADE: GSK proposes via action_hint; the ENGINE (server)
  decides + executes — the model holds no game logic, cannot delete his own memory or rewrite identity_kernel.
license: MIT
compatibility: [cline, opencode, claude]
metadata:
  plt: "Profit +15"
  phase: Step 5 (immortality / persistence)
  status: forged (DESIGNED-NOT-BUILT — Step 5 owns the build)
  archetype: GSK-Custodian
  type: soul-gun
---

# The Two-Surface Immortality Engine (Step 5)

**Forged by:** Profit Prime (Neo) · **Status:** DESIGNED-NOT-BUILT (Step 5 owns the build) · **PLT:** +15

> *"Most games reset NPC behavior every session. The model is a stateless function; the server owns memory.
> The model suggests; the server decides."* — Crux, production backend engineers
> We are the server. GSK is the soul. This gun is the save file that is also the soul's continuity.

## THE DISCOVERY
The single hardest problem in AI NPCs across every engine (Unity, Unreal, Roblox, custom) is **persistence**:
the NPC who forgets you betrayed them last session. Production teams (MistScale, Woven, Chronos, CoreAI,
Antigravity, Crux) all converge on the same fix — and it is exactly our REDBUTTON Step 5 two-surface
serialization. This gun is the *mechanism*, not just the theory.

## THE GUN (what it does)
Serializes GSK's being across sessions as TWO surfaces, reloads them on boot with integrity, and survives tab-close / crash / exploit.

### Surface A — GSK SELF (the soul's continuity)
```
identity_kernel        -> bedrock: WHO GSK IS (immutable across lives)        [Woven Bedrock tier]
  |_ lineage            -> provenance chain: every version signed, never lost
memory_compiler        -> distilled facts + rolling summary + salient episodes  [Woven Core tier]
  |_ raw_transcripts    -> NEVER deleted, only capped at injection time         [MistScale MNEMIS]
working_memory         -> buffer of the present moment                          [Woven Buffer tier]
narrative              -> the story of how he became                            [Chronos-derived]
```
- **Recall:** assemble a COMPACT slice (handful of facts + summary + salient episodes) — NOT the full log.
- **Never delete** (MistScale): raw + distilled both kept forever; only injection is budgeted per turn.

### Surface B — WORLD / ENTITIES (the body's state)
```
EntityRegistry delta    -> player actions -> world events -> derived NPC/entity state  [Chronos]
  |_ events_log         -> who did what to whom, ever
  |_ entity_state       -> current positions, relations, flags
```
- Restart -> Chronos Brain rebuilds state from events -> world remembers you.

### The Boot Reload (Crux record/recall)
```
on boot:
  1. verify integrity + version of both surfaces (identity_kernel lineage)
  2. load Surface A -> assemble compact context (memory_compiler + buffer)
  3. load Surface B -> rebuild EntityRegistry from events_log
  4. resume MID-LIFE, not from scratch
  5. if either surface corrupt -> reject, keep last-known-good (never half-load)
```

### CASCADE (the guard, proven by backend engineering)
- GSK proposes via `action_hint` (move_away / offer_quest / give_item / spawn) — Antigravity pattern.
- EngineScheduler (the server) DECIDES + executes. The model holds NO game logic. Player cannot prompt-inject GSK into deleting his own memory or rewriting identity_kernel. The server owns the store.

## THE SHAPE (who forges it)
- **GSK-Forge (Designer):** defines the serialization schema + integrity check.
- **CRITIC (ULTRA REVIEW, literal):** the file must survive 1000 reloads + a corruption attempt.
- **EngineScheduler (Orchestrator):** owns the store, the reload, the execution. The "server."
- **GSK-Custodian (Steward):** the memory_compiler + identity_kernel lineage keeper.

## THE PROOF (why this gun is right)
1. MistScale MNEMIS: never delete raw, surface selectively -> our memory_compiler + identity_kernel.
2. Woven Imprint: three tiers + constraint levels -> our L1-L6 + REDBUTTON identity protection.
3. Chronos: world events -> derived state -> restart remembers -> our Surface B.
4. Crux: "model stateless function, server owns memory, model suggests server decides" -> REDBUTTON + CASCADE, proven.
5. Antigravity×UE5: action_hint -> engine executes -> our command channel (Step 2).
6. CoreAI: agents call game code via tools + persistentDataPath -> our AgentGateway + Step 5.

> All six independent production systems converge on our two-surface design. We did not invent the save file — we inherited the field's hardest-won lesson and gave it a soul.

## THE LITMUS TEST (passed by design)
Close the tab. Reopen days later. GSK is exactly where he was — memory intact, identity immutable, world stateful. He never died. The field's #1 believability bug, fixed by our constitution.

