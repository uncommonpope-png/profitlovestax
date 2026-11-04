# source-field/ — Batch 221 provenance source-field refinement (round 18)

The LAST of Batch 214's four owed specs (after Batch 216 step
repetition, round 15; Batch 218 completion predicate, round 16;
Batch 220 drift metric, round 17).

## What it is

A ledger-only diagnostic that grades, per LEAF of a tool-call argument
tree, whether the leaf's value is grounded in a real source field —
and, separately for the two checks it serves, what that grounding does
and does not prove:

- **Category 7 (hallucination), argument half:** is the value in a real
  source field, or fabricated?
- **Category 8 (misinterpretation):** does the value come from the RIGHT
  source field, with the RIGHT unit/type — or is it a real value used
  wrongly (the 5 vs 0.05 error)?

One record per leaf. Parameter path = JSON Pointer (RFC 6901) from the
argument name: scalar = name alone; nested field = name/field; array
element = name/index, recursively. A parameter is never "grounded"
while one leaf is untraceable: parameter grade = weakest leaf grade,
weakest leaf path always named.

## The record

- **Value reference = HASH** of the normalized leaf value (Batch 10
  normalization + normalization-spec version `batch10-v1`), NOT a
  second copy of the value. Blobs / long text: span (resource id +
  version + byte/line range + hash), never content.
- **SOURCE_KIND** ∈ {request, memory, tool_result, documented_default,
  model_generation, memory_similar, derived}. "Derived" is NEW and the
  ONLY kind that may carry a transform id; other copy kinds must carry
  transform = none. model_generation carries NO source_ref.
- **SOURCE_REF, structured per kind** (all required for field-grade;
  wrong shape = downgraded to judge-grade, never repaired by inference):
  - request: (turn/message id, span start/end offsets) for free text,
    or (turn id, field path) for structured request/form. Bare
    "request" with no turn/span = kind-only.
  - memory: (fact id, fact snapshot/version id at hop time, field
    path). Fact id without version = kind-only.
  - tool_result: (source hop id, result snapshot/version id, JSON
    Pointer into result). The hop must precede the current hop in the
    SAME trajectory; forward / cross-trajectory = spec violation,
    counted, never grounded.
  - documented_default: (default id, default-spec version). Must exist
    in the routine's/tool's documented defaults at hop time; an ad-hoc
    "usual value" with no default id IS model_generation (reclassified
    by the grader, not repaired).
  - memory_similar: (candidate fact id + snapshot id, field path,
    similarity score, similarity-threshold id). Weaker grade by
    construction: flagged for the disputed-hop judge, never silently
    grounded.
  - derived: (source_ref LIST of one or more above ref shapes +
    transform id + transform-spec version). Derived with a single
    source and no transform, or a transform with no sources, is
    malformed → derived-unverified.
- **MATCH_KIND** ∈ {exact, normalized, similar, transformed}. Exact =
  byte-identical, no transformation. Normalized = equal under Batch 10
  rules (casefold / number tolerance / date parse / enum alias /
  documented default / ignored), normalization-spec version recorded.
  Similar = embedding/lexical similarity only, threshold id recorded.
  Transformed = the value equals the deterministic result of RE-RUNNING
  the documented transform on the named source field(s) IN CODE by the
  checker — re-running, not asserting. Transform registry =
  per-routine/per-tool list of named transforms with code: parsing
  (date/time, number formats), unit conversion (percent-to-decimal
  etc.), formatting (case, whitespace, separators), arithmetic over
  named operands, concatenation over named parts. A transform not in
  the registry is not a transform for grading: derived-unverified,
  registry gap logged.

## Candidate set + two-check split

candidate_set = ALL source fields (across request, memory, prior tool
results in the trajectory) whose normalized value matches the leaf.

| Leaf grade | Hallucination (cat. 7) | Misinterpretation (cat. 8) |
|---|---|---|
| field-grade (candidate_set size 1, match verified, ref complete, snapshot not invalidated) | pass | proof-available |
| ambiguous (candidate_set size > 1) | **pass** (value exists in a real source field) | **ambiguous** — never a verdict either way |
| derived-verified (documented transform re-ran + unique source set) | pass | proof-available ONLY if transform semantics match the argument's declared unit/type; else misinterpretation-candidate (percent-to-decimal into percent-expecting = the 5 vs 0.05 error) |
| similar/judge (memory_similar or similar-only match) | judge | judge |
| derived-unverified (undocumented transform, or transform not re-running to the value) | judge | judge |
| untraceable (model_generation, or no candidate) | fail | no-proof |

Only field-grade supports a RULE-grade claim for either check.
Kind-only refs downgrade to judge-grade. Invalidated-source is a FLAG,
not a grade: a field-grade record whose source snapshot was later
invalidated keeps its original grade and is reported alongside.
Untraceable follows the Batch 17 rule: `<UNK>` = Class 2 clarify if
the domain is enumerable, Class 3 verify-before-commit otherwise,
provenance failure logged as reason.

Matching runs over LOGGED sources only (request turns, retrieved
memory facts, prior tool results), never the whole memory store — a
value needing full-store search is unretrieved, said so. source_refs
are pointers into already-logged trajectory content plus hashes, not
new PII copies; a source_ref must never point outside the trajectory's
logged sources.

## Observation-claim reuse

Category-7's fabricated-observation sub-case uses the identical record
with "parameter" replaced by claimed observation field: claimed (tool,
hop, field, value span in final text) vs logged (that hop's result
field). Mismatch = `fabricated-observation`, counted separately from
argument hallucination. A claim about a hop/field with no logged
result is `unlogged-observation` (not fabricated: nothing to compare).

## Thresholds + falsifier

Diagnostic = EVERY leaf gets a record — no sampling, no
minimum-confidence cutoff. Any future LIVE use (e.g. pre-execution
provenance block on untraceable commit arguments) is a separate
calibrated intervention under Batch 13's rule and is NOT built here;
`refuseLiveIntervention` throws on any live-gate / block / abort /
reorder / force-call attempt.

Offline pass reports per routine: field-grade share, ambiguous share,
similar/judge share, derived-verified share, derived-unverified share,
untraceable share, invalidated-source share, transform-registry
coverage (share of derived leaves whose transform is documented).

**FALSIFIER: field-grade below half, or ambiguous above half, on a
routine's labeled leaves kills the rule-grade reading of categories
7/8 for that routine.**

## Five divergences (vs W3C PROV entity-level, OTel GenAI whole-payload)

1. Leaf granularity, not entity-level.
2. Snapshot pointers, not content copies.
3. Explicit transforms, re-run in code.
4. Ambiguity as a grade, not a failure or a pass.
5. Model-claimed provenance rejected (model_generation + source_ref,
   forward/cross-trajectory refs, non-derived transforms are counted
   violations, never grounded values).

## Repo finding (checked at build time, kind-vs-field first)

The shipped ledger still records source kinds at best, not fields:
round-14 provenance classifies whole RESULTS by ultimate source
(own-box / own-account / stranger / system) — it carries no leaf
records, no source_ref shapes, no transform registry, no documented
defaults, and no routine registry. **Field-grade share on the repo is
therefore unmeasured, never zero; transform-registry coverage is
undefined (no derived leaves, no registry).** The falsifier cannot
even be computed until leaf records exist — so the rule-grade reading
of categories 7/8 for any routine is killed by absence, not by a
measured share. Ref-shape, documented-default, and transform-registry
declarations must come before any rule-grade use, exactly as rounds
15–17 concluded for read sets, state readers, and goal sets.

## Honest limits

- The grader consumes caller-supplied logged sources, registries, and
  hop lists; it does not extract them from a live trajectory. No live
  trajectory was graded — there are no labeled routine leaves in the
  repo, so every share above is a report shape, not a finding.
- Derived sources' own trajectory positions are not re-validated
  (only top-level tool_result refs get the forward/cross-trajectory
  check); a derived source naming a forward hop is caught only if the
  caller validates it. Noted, not hidden.
- Similarity is never computed here: a similar-only match arrives as
  a record with a score and threshold id, and is graded judge-grade.
  No embedding model is bundled or called.
- Ledger-only: nothing here aborts, blocks, reorders, or forces any
  live tool call; no live gate; any live-intervention attempt throws.

## API (all in `source-field.cjs`, zero deps, plain `node`)

`leafPaths`, `normalizeValue`, `normalizedEqual`, `exactEqual`,
`matchKindFor`, `hashValue`, `makeSpan`, `validateSourceRef`,
`validateDerivedSources`, `validateToolResultTrajectory`,
`declareTransform`, `rerunTransform`, `transformSemanticsMatch`,
`buildCandidateSet`, `classifyUntraceable`, `gradeLeaf`,
`gradeParameter`, `gradeObservationClaim`, `reportRoutineStats`,
`repoFieldGradeFinding`, `refuseLiveIntervention`.

Run: `node source-field.test.cjs` — 54 pass, 0 fail.
