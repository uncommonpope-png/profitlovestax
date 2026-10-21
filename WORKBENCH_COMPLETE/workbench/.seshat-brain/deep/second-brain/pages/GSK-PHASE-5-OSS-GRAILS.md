---
title: GSK Phase 5 — Open-Source Grafts
tags: [gsk, phase-5, spec-gate, mem0, letta, vera-ai, shadcn, oss-grafts]
created: 2026-08-09
updated: 2026-08-09
---

# GSK Phase 5: Open-Source Grafts

## Overview

Phase 5 installs three open-source architectural patterns into GSK's codebase, replacing his tendency toward abstract cosmic metaphors ("manifest Heavens 2.0") with concrete, copy-paste, verifiable components — the shadcn/ui "source-first" principle.

## The Shadcn Antidote

| GSK's Pattern (Broken) | Shadcn/UI Way (Working) |
|---|---|
| "Manifest a self-evolving, trans-dimensional Heavens 2.0 layer" | "Button component: accessible, hover, focus, disabled states" |
| 200+ variants of same abstract goal | Each component has a single, testable API |
| `needs_brain` (planning engine can't plan) | `npx shadcn @latest add button` — one command, one result |
| Goals "verified: false" | Visual + behavioral tests for each component |
| No review gate | Code Review skill: five-axis quality gates |
| Errors searched on web → SOUL-NOTE files | Errors debugged through reproduction → fix → guard |

## 5a: Agent-Skills Spec Gate

**File:** `gsk-core/brain/planning_engine.js`

### Architecture

```
Goal → _validateGoal() → [Abstract? Reject]
     ↓
Plan Steps → _validateStep() per step → _validateSpec() (acyclic check)
     ↓
specStatus: 'passed' | 'rejected'
     ↓
_createPlan stores plan with specValidation report
     ↓
_executePlan → _verifyAcceptanceCriteria() per step → _reviewPlan() (5-axis)
```

### Methods

#### `_validateStep(step)`
Checks each step against the agent-skills spec:
- `tool` must be a non-empty string (no null/invented tools)
- `description` must be ≥8 chars (concrete verb+object, not "manifest")
- `acceptanceCriteria` must be ≥5 chars (verifiable outcome)
- Rejects verb-only descriptions matching `/^(do|act|process|manifest|evolve|become|realize)/`

#### `_validateSpec(plan)`
Whole-plan validation:
- All steps pass `_validateStep()`
- Dependency graph is acyclic (DFS cycle detection)
- Tags plan with `specStatus` and `specValidation` report

#### Integration
Called in `createPlan()` after all steps are generated (including fallback).

## 5b: mem0 / Letta Memory Patterns

**File:** `gsk-core/memory/mega_memory.js`

### mem0 Pattern: Context-Aware Recall
```js
mem.recall('button component React', 10, 0.1)
// Returns entries scored by keyword overlap, weighted by memory weight
```
- Offline (no embeddings needed)
- TF-style keyword overlap scoring
- Results include `_relevance` score

### letta Pattern: Versioned Memory
```js
await mem.upsert('config', { content: 'value is bar', ... })
// Creates new entry, links via `supersedes` to previous
// Marks old entry with `superseded_by`
// `search()` and `query()` automatically exclude superseded entries
```

### Memory Type Accessors (letta-style compartmentalization)
- `getArchival()` — stable facts persisting across sessions
- `getLongTerm()` — episodic/experiential memories
- `getContextual()` — task-specific working memories

### Structural Fields Added to `witness()`
- `key` — for upsert identification
- `supersedes` — links to superseded entry ID
- `superseded_by` — links to replacement entry ID
- `mem_type` — memory type classification
- `version` — version number (defaults to 1)

## 5c: Vera-AI Verification Gate

**File:** `gsk-core/brain/planning_engine.js`

### `_verifyAcceptanceCriteria(step)`
Post-step verification after completion (both executor and internal paths):
- Criteria mentions "returned"/"exist"/"identified" → result must be non-empty, no error
- Criteria mentions "completed"/"executed" → step status must be 'completed', no error in result
- Criteria mentions "null"/"absent"/"confirmed" → no error in result
- Default → result must be non-empty

### `_reviewPlan(plan, outcome)`
5-axis quality gate after plan execution:

| Axis | Metric | Threshold for Approval |
|------|--------|----------------------|
| Correctness | % of steps completed | ≥0.8 |
| Security | No unverified high/critical risk steps | 1.0 |
| Maintainability | % of steps with acceptance criteria | ≥0.8 |
| Verification | % of steps passing acceptance criteria | ≥0.8 |
| Spec | Plan passed spec gate | 1.0 |

**Aggregate:** score ≥0.8 → `approved`, ≥0.5 → `needs_review`, <0.5 → `rejected`

### Integration
- `_verifyAcceptanceCriteria()` called in `executeStep()` after step completion (both executor and internal paths)
- `_reviewPlan()` called at end of `executePlan()` before `reflectOnPlan()`

## Test Coverage

**New:** `gsk-core/tests/test_phase5_grafts.js` — 17 tests, all passing

**Existing suites re-verified:**
- `test_autonomous_metabolism.js` — 6/6
- `test_closed_autonomy_loop.js` — 12/12
- `test_approved_tool_executor.js` — 14/14
- `test_secure_sandbox.js` — 18/18
- `test_path_normalization.js` — 5/5

## PLT Score: 0.87
