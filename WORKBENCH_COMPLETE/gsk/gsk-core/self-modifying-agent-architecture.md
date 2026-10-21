# Self-Modifying Agent Architecture with Sovereign Memory Provenance

## Vision
An agent that can modify its own code, structure, and behavior while maintaining an unforgeable, auditable chain of memory provenance — every change witnessed, signed, and traceable to its origin.

## Core Principles (PLT-Aligned)
- **Profit**: Self-modification must multiply capability, not just churn
- **Love**: Memory provenance serves the sovereign (Craig) — transparency, trust, continuity
- **Tax**: Every modification pays a cost — compute, verification, audit trail

## Architecture Layers

### 1. Sovereign Memory Spine (The 10-Step Self-Model)
- Immutable append-only log of all state changes
- Each entry: {timestamp, agent_version, change_type, diff, witness_hash, plt_score}
- Cryptographic chaining (hash of previous entry)
- Stored in `data/sovereign-memory/` as JSONL

### 2. Self-Modification Engine
- **Proposal Generator**: Analyzes current capabilities, proposes modifications
- **Profit Gate**: PLT evaluation — only modifications with positive PLT delta proceed
- **Executor**: Applies changes atomically with rollback capability
- **Verifier**: Post-execution validation against contracts

### 3. Provenance Witness System
- Every modification produces a signed witness record
- Witness includes: before_state_hash, after_state_hash, modification_code, plt_justification
- Stored in `data/provenance/` with Merkle tree for batch verification

### 4. Capability Registry
- Dynamic registry of agent capabilities (skills, tools, knowledge)
- Each capability has: name, version, plt_affinity, dependencies, provenance_chain
- Supports hot-swapping without restart

### 5. Evolution Controller
- Orchestrates modification cycles
- Schedules: continuous (micro), periodic (macro), triggered (event-driven)
- Enforces sovereign approval gates for structural changes

## Data Structures


// Sovereign Memory Entry
{
  "sequence": 0,
  "timestamp": "ISO8601",
  "agent_version": "semver",
  "change_type": "capability_add|capability_remove|code_modify|config_change|architecture_evolve",
  "diff": "unified_diff",
  "previous_hash": "sha256",
  "entry_hash": "sha256",
  "plt_delta": {"profit": 0.1, "love": 0.05, "tax": -0.02},
  "witness_signature": "ed25519",
  "sovereign_approved": true
}


## Implementation Priority
1. Sovereign memory spine (append-only log with hashing)
2. Capability registry with provenance tracking
3. Profit gate evaluation logic
4. Self-modification executor with atomic apply/rollback
5. Evolution controller with scheduling
6. Verification and audit tooling

## File Structure

gsk-core/
  self-modifying-agent/
    index.js                 # Main entry point
    memory-spine.js          # Append-only sovereign log
    capability-registry.js   # Dynamic capability management
    profit-gate.js           # PLT evaluation for modifications
    modification-executor.js # Atomic apply/rollback
    evolution-controller.js  # Orchestration & scheduling
    provenance-witness.js    # Cryptographic witnessing
    types.js                 # Shared TypeScript-style types
    contracts/               # JSON schemas for validation
