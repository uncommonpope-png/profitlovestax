'use strict';
/* source-field.test.cjs — Batch 221 tests (BUILD ROUND 18). Plain node:test, zero deps. */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SOURCE_KINDS, MATCH_KINDS, leafPaths, normalizeValue, normalizedEqual,
  exactEqual, matchKindFor, hashValue, makeSpan, validateSourceRef,
  validateDerivedSources, validateToolResultTrajectory, declareTransform,
  rerunTransform, transformSemanticsMatch, buildCandidateSet,
  classifyUntraceable, gradeLeaf, gradeParameter, gradeObservationClaim,
  reportRoutineStats, repoFieldGradeFinding, refuseLiveIntervention,
} = require('./source-field.cjs');

const HOPS = ['h1', 'h2', 'h3']; // current hop index 3 (after h3) unless noted
const CTX_HOPS = { hops: HOPS, currentHopIndex: 3 };

function logged(kind, ref, value, extra) {
  return Object.assign({ kind, ref, value }, extra || {});
}
function fieldGradeCase(overrides) {
  // A clean field-grade leaf: request ref, one logged source, exact match.
  const base = {
    leafPath: 'amount',
    leafValue: 42,
    record: { kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 2 } },
    candidateSet: buildCandidateSet(42, [
      logged('request', { turnId: 't1', spanStart: 0, spanEnd: 2 }, 42),
    ]),
    ctx: CTX_HOPS,
  };
  return Object.assign(base, overrides || {});
}

// --- Leaf paths -----------------------------------------------------------

test('leaf granularity: one record per leaf, JSON Pointer paths', () => {
  const leaves = leafPaths({ amount: 5, address: { city: 'Memphis', zip: '38108' }, items: ['a', 'b'] });
  assert.deepEqual(leaves.map((l) => l.path), ['amount', 'address/city', 'address/zip', 'items/0', 'items/1']);
  assert.equal(leaves.find((l) => l.path === 'address/city').value, 'Memphis');
});

test('leaf paths: scalar = name alone, nested field and array index recurse', () => {
  const leaves = leafPaths({ a: { b: [{ c: 1 }, { c: 2 }] } });
  assert.deepEqual(leaves.map((l) => l.path), ['a/b/0/c', 'a/b/1/c']);
});

test('leaf paths: span objects are leaves, never expanded into content', () => {
  const span = makeSpan({ resourceId: 'blob-1', version: 'v3', startByte: 0, endByte: 99, hash: 'abc' });
  const leaves = leafPaths({ doc: span });
  assert.equal(leaves.length, 1);
  assert.equal(leaves[0].value.hash, 'abc');
});

test('leaf paths: non-object args throw (spec violation, fail loud)', () => {
  assert.throws(() => leafPaths(null), /must be an object/);
  assert.throws(() => leafPaths('x'), /must be an object/);
});

// --- Normalization + value refs -------------------------------------------

test('Batch 10 normalization: casefold, number tolerance, date parse, enum alias', () => {
  assert.equal(normalizedEqual('  Hello   World ', 'hello world'), true);
  assert.equal(normalizedEqual(1.0000000001, 1), true);
  assert.equal(normalizedEqual('2026-11-04', '2026-11-04T00:00:00.000Z'), true);
  assert.equal(normalizedEqual('yes', 'true', { enumAliases: { yes: 'true' } }), true);
  assert.equal(normalizedEqual('yes', 'false', { enumAliases: { yes: 'true' } }), false);
});

test('exact vs normalized: byte-identical is exact, casefold-only is normalized', () => {
  assert.equal(matchKindFor('Hi', 'Hi'), 'exact');
  assert.equal(matchKindFor('Hi', 'hi'), 'normalized');
  assert.equal(matchKindFor(5, 6), null);
  assert.equal(exactEqual('Hi', 'hi'), false);
});

test('value reference is a hash of the normalized value, not a copy', () => {
  const ref = hashValue('Hello World');
  assert.equal(ref.kind, 'hash');
  assert.equal(ref.algorithm, 'sha256');
  assert.equal(ref.normalizationSpecVersion, 'batch10-v1');
  assert.equal(ref.hash, hashValue('hello world').hash); // normalized, so casefold-equal hashes match
  assert.ok(!('value' in ref));
  assert.notEqual(ref.hash, hashValue('Hello World', { normalizationSpecVersion: 'other-v9' }).hash);
});

test('spans: resource id + version + range + hash; missing anchor throws', () => {
  const s = makeSpan({ resourceId: 'r1', version: 'v2', startLine: 1, endLine: 4, hash: 'h' });
  assert.equal(s.startLine, 1);
  assert.throws(() => makeSpan({ version: 'v2', startByte: 0, endByte: 1, hash: 'h' }), /resourceId/);
  assert.throws(() => makeSpan({ resourceId: 'r1', hash: 'h' }), /range/);
  assert.throws(() => makeSpan({ resourceId: 'r1', startByte: 0, endByte: 1 }), /hash/);
});

// --- Source-ref shapes ------------------------------------------------------

test('request ref: free-text span complete; structured field path complete; bare request kind-only', () => {
  assert.equal(validateSourceRef('request', { turnId: 't1', spanStart: 0, spanEnd: 9 }).shape, 'complete');
  assert.equal(validateSourceRef('request', { messageId: 'm1', fieldPath: 'form/amount' }).shape, 'complete');
  const bare = validateSourceRef('request', {});
  assert.equal(bare.shape, 'kind-only');
  assert.ok(bare.reasons.join(' ').includes('turn/message id'));
});

test('memory ref: fact id without version is kind-only; full triple complete', () => {
  assert.equal(validateSourceRef('memory', { factId: 'f1' }).shape, 'kind-only');
  assert.equal(validateSourceRef('memory', { factId: 'f1', snapshotId: 's9', fieldPath: 'city' }).shape, 'complete');
  assert.equal(validateSourceRef('memory', { factId: 'f1', versionId: 'v2', fieldPath: 'city' }).shape, 'complete');
});

test('tool_result ref: hop + snapshot + pointer complete; missing pointer kind-only', () => {
  assert.equal(validateSourceRef('tool_result', { hopId: 'h1', snapshotId: 's1', resultPointer: 'total' }).shape, 'complete');
  assert.equal(validateSourceRef('tool_result', { hopId: 'h1', snapshotId: 's1' }).shape, 'kind-only');
});

test('documented_default ref: id + spec version complete; missing version kind-only', () => {
  assert.equal(validateSourceRef('documented_default', { defaultId: 'd1', defaultSpecVersion: 'v1' }).shape, 'complete');
  assert.equal(validateSourceRef('documented_default', { defaultId: 'd1' }).shape, 'kind-only');
});

test('memory_similar ref: full shape complete; missing threshold id kind-only', () => {
  const full = { candidateFactId: 'f2', snapshotId: 's2', fieldPath: 'city', similarityScore: 0.91, similarityThresholdId: 'th-0.8' };
  assert.equal(validateSourceRef('memory_similar', full).shape, 'complete');
  const noTh = Object.assign({}, full); delete noTh.similarityThresholdId;
  assert.equal(validateSourceRef('memory_similar', noTh).shape, 'kind-only');
});

test('derived ref: list + transform + spec version complete; missing transform kind-only', () => {
  const full = { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'pct-dec', transformSpecVersion: 'v1' };
  assert.equal(validateSourceRef('derived', full).shape, 'complete');
  assert.equal(validateSourceRef('derived', { sources: full.sources }).shape, 'kind-only');
});

test('unknown SOURCE_KIND throws; unknown MATCH_KIND in gradeLeaf throws', () => {
  assert.throws(() => validateSourceRef('telepathy', {}), /unknown SOURCE_KIND/);
  assert.throws(() => gradeLeaf(fieldGradeCase({ record: { kind: 'request', matchKind: 'vibes', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } } })), /unknown MATCH_KIND/);
});

// --- Violations -------------------------------------------------------------

test('model_generation with a source_ref is a counted violation, never grounded', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'model_generation', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } },
  }));
  assert.equal(g.grade, 'untraceable');
  assert.ok(g.violations.includes('model-generation-with-source-ref'));
  assert.equal(g.hallucination, 'fail');
});

test('model_generation with no ref is untraceable, not a violation', () => {
  const g = gradeLeaf(fieldGradeCase({ record: { kind: 'model_generation' }, candidateSet: [] }));
  assert.equal(g.grade, 'untraceable');
  assert.deepEqual(g.violations, []);
});

test('forward tool_result ref is a violation; cross-trajectory ref is a violation', () => {
  const fwd = gradeLeaf(fieldGradeCase({
    record: { kind: 'tool_result', ref: { hopId: 'h3', snapshotId: 's1', resultPointer: 'total' } },
    ctx: { hops: HOPS, currentHopIndex: 2 },
  }));
  assert.ok(fwd.violations.includes('forward-reference'));
  assert.equal(fwd.grade, 'untraceable');
  const cross = gradeLeaf(fieldGradeCase({
    record: { kind: 'tool_result', ref: { hopId: 'other-traj-h9', snapshotId: 's1', resultPointer: 'total' } },
  }));
  assert.ok(cross.violations.includes('cross-trajectory-reference'));
  assert.equal(cross.grade, 'untraceable');
});

test('prior-hop tool_result ref in the same trajectory is no violation', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'tool_result', ref: { hopId: 'h1', snapshotId: 's1', resultPointer: 'total' } },
  }));
  assert.deepEqual(g.violations, []);
  assert.equal(g.grade, 'field-grade');
});

test('non-derived kind carrying a transform is a violation; derived may carry one', () => {
  const bad = gradeLeaf(fieldGradeCase({
    record: { kind: 'request', transformId: 'pct-dec', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } },
  }));
  assert.ok(bad.violations.includes('non-derived-carries-transform'));
  assert.notEqual(bad.grade, 'field-grade');
  const ok = gradeLeaf(fieldGradeCase({
    record: { kind: 'request', transformId: 'none', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } },
  }));
  assert.deepEqual(ok.violations, []);
});

// --- Documented defaults ------------------------------------------------------

test('documented_default found in the registry is field-grade', () => {
  const g = gradeLeaf({
    leafPath: 'currency', leafValue: 'USD',
    record: { kind: 'documented_default', ref: { defaultId: 'd-usd', defaultSpecVersion: 'v1' } },
    candidateSet: buildCandidateSet('USD', [logged('documented_default', { defaultId: 'd-usd', defaultSpecVersion: 'v1' }, 'USD')]),
    ctx: Object.assign({}, CTX_HOPS, { documentedDefaults: [{ id: 'd-usd', specVersion: 'v1' }] }),
  });
  assert.equal(g.grade, 'field-grade');
});

test('ad-hoc usual value with no default id is reclassified as model_generation', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'documented_default', ref: { defaultSpecVersion: 'v1' } },
  }));
  assert.equal(g.effectiveKind, 'model_generation');
  assert.equal(g.grade, 'untraceable');
});

test('documented_default id absent from the registry is untraceable, not field-grade', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'documented_default', ref: { defaultId: 'd-nope', defaultSpecVersion: 'v1' } },
    ctx: Object.assign({}, CTX_HOPS, { documentedDefaults: [{ id: 'd-other' }] }),
  }));
  assert.equal(g.grade, 'untraceable');
  assert.ok(g.reasons.join(' ').includes('not in the routine'));
});

// --- Derived: malformed, registry gap, re-run --------------------------------

test('derived malformed: single source with no transform; transform with no sources', () => {
  const noTransform = validateDerivedSources({ sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }] });
  assert.equal(noTransform.malformed, true);
  const noSources = validateDerivedSources({ transformId: 'pct-dec', transformSpecVersion: 'v1' });
  assert.equal(noSources.malformed, true);
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'derived', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }] } },
  }));
  assert.equal(g.grade, 'derived-unverified');
});

test('derived with an undocumented transform is derived-unverified + registry gap', () => {
  const g = gradeLeaf(fieldGradeCase({
    leafValue: 0.05,
    record: { kind: 'derived', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'pct-dec', transformSpecVersion: 'v1' } },
    ctx: Object.assign({}, CTX_HOPS, { transformRegistry: [], sourceValues: [5] }),
  }));
  assert.equal(g.grade, 'derived-unverified');
  assert.equal(g.registryGap, true);
});

test('derived transform re-run pass: percent-to-decimal 5 -> 0.05, rule-grade for hallucination', () => {
  const registry = [declareTransform({ id: 'pct-dec', specVersion: 'v1', op: 'percent-to-decimal', outputUnit: 'decimal' })];
  const g = gradeLeaf(fieldGradeCase({
    leafValue: 0.05,
    record: { kind: 'derived', declaredUnit: 'decimal', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'pct-dec', transformSpecVersion: 'v1' } },
    ctx: Object.assign({}, CTX_HOPS, { transformRegistry: registry, sourceValues: [5] }),
  }));
  assert.equal(g.grade, 'derived-verified');
  assert.equal(g.hallucination, 'pass');
  assert.equal(g.misinterpretation, 'proof-available');
  assert.equal(g.rerun.matches, true);
});

test('derived transform re-run fail: transform does not reproduce the value', () => {
  const registry = [declareTransform({ id: 'pct-dec', specVersion: 'v1', op: 'percent-to-decimal', outputUnit: 'decimal' })];
  const g = gradeLeaf(fieldGradeCase({
    leafValue: 0.06,
    record: { kind: 'derived', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'pct-dec', transformSpecVersion: 'v1' } },
    ctx: Object.assign({}, CTX_HOPS, { transformRegistry: registry, sourceValues: [5] }),
  }));
  assert.equal(g.grade, 'derived-unverified');
  assert.equal(g.hallucination, 'judge');
});

test('semantics mismatch (5 vs 0.05): percent-to-decimal into percent-expecting is a misinterpretation candidate', () => {
  const registry = [declareTransform({ id: 'pct-dec', specVersion: 'v1', op: 'percent-to-decimal', outputUnit: 'decimal' })];
  const g = gradeLeaf(fieldGradeCase({
    leafValue: 0.05,
    record: { kind: 'derived', declaredUnit: 'percent', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'pct-dec', transformSpecVersion: 'v1' } },
    ctx: Object.assign({}, CTX_HOPS, { transformRegistry: registry, sourceValues: [5] }),
  }));
  assert.equal(g.grade, 'derived-verified');
  assert.equal(g.hallucination, 'pass');
  assert.equal(g.misinterpretation, 'misinterpretation-candidate');
  assert.equal(g.semantics.match, false);
});

test('declareTransform throws on an entry with no runnable op or function', () => {
  assert.throws(() => declareTransform({ id: 'x', op: 'teleport' }), /known op/);
  assert.throws(() => declareTransform({}), /requires an id/);
});

test('rerunTransform: custom run function, concat and arithmetic ops', () => {
  const custom = declareTransform({ id: 'join', specVersion: 'v1', run: (vs) => vs.join('-') });
  assert.equal(rerunTransform(custom, ['a', 'b'], 'a-b').matches, true);
  const add = declareTransform({ id: 'sum', specVersion: 'v1', op: 'add' });
  assert.equal(rerunTransform(add, [2, 3], 5).matches, true);
  assert.equal(rerunTransform(add, [2, 3], 6).matches, false);
  assert.equal(rerunTransform(add, ['x'], 5).reran, false); // NaN path: non-finite
});

// --- Candidate set, ambiguity split, similar, untraceable ----------------------

test('field-grade: candidate_set size 1, match verified, ref complete', () => {
  const g = gradeLeaf(fieldGradeCase({}));
  assert.equal(g.grade, 'field-grade');
  assert.equal(g.hallucination, 'pass');
  assert.equal(g.misinterpretation, 'proof-available');
  assert.equal(g.candidateSetSize, 1);
});

test('kind-only ref downgrades to judge-grade even with a unique candidate', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'request', ref: { turnId: 't1' } }, // no span, no field path
  }));
  assert.equal(g.grade, 'similar/judge');
  assert.equal(g.hallucination, 'judge');
});

test('ambiguous split: passes hallucination, fails as misinterpretation proof', () => {
  const candidates = buildCandidateSet(42, [
    logged('request', { turnId: 't1', spanStart: 0, spanEnd: 2 }, 42),
    logged('memory', { factId: 'f1', snapshotId: 's1', fieldPath: 'n' }, 42),
  ]);
  assert.equal(candidates.length, 2);
  const g = gradeLeaf(fieldGradeCase({ candidateSet: candidates }));
  assert.equal(g.grade, 'ambiguous');
  assert.equal(g.hallucination, 'pass');
  assert.equal(g.misinterpretation, 'ambiguous');
});

test('similar/judge: memory_similar with a complete ref is judge-grade, never rule-grade', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'memory_similar', ref: { candidateFactId: 'f2', snapshotId: 's2', fieldPath: 'city', similarityScore: 0.91, similarityThresholdId: 'th-0.8' } },
    candidateSet: [],
  }));
  assert.equal(g.grade, 'similar/judge');
  assert.equal(g.hallucination, 'judge');
  assert.equal(g.misinterpretation, 'judge');
});

test('untraceable: no candidate, with Batch 17 <UNK> classes', () => {
  const clar = gradeLeaf(fieldGradeCase({ candidateSet: [], ctx: Object.assign({}, CTX_HOPS, { domainEnumerable: true }) }));
  assert.equal(clar.grade, 'untraceable');
  assert.equal(clar.untraceable.unkClass, 2);
  assert.equal(clar.untraceable.reason, 'provenance-failure');
  const verify = gradeLeaf(fieldGradeCase({ candidateSet: [] }));
  assert.equal(verify.untraceable.unkClass, 3);
  assert.equal(verify.untraceable.unkLabel, 'verify-before-commit');
  assert.equal(classifyUntraceable({ domainEnumerable: true }).unkClass, 2);
});

test('unretrieved: a value needing full-store search is untraceable, said so', () => {
  const g = gradeLeaf(fieldGradeCase({ candidateSet: [], ctx: Object.assign({}, CTX_HOPS, { needsFullStoreSearch: true }) }));
  assert.equal(g.grade, 'untraceable');
  assert.ok(g.reasons.join(' ').includes('full-store search'));
});

test('matching runs over logged sources only: an unlogged value never matches', () => {
  const candidates = buildCandidateSet(42, []); // whole store not consulted
  assert.equal(candidates.length, 0);
  const g = gradeLeaf(fieldGradeCase({ candidateSet: candidates }));
  assert.equal(g.grade, 'untraceable');
});

test('normalized match still field-grade (casefold-only difference)', () => {
  const g = gradeLeaf({
    leafPath: 'city', leafValue: 'Memphis',
    record: { kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 7 } },
    candidateSet: buildCandidateSet('Memphis', [logged('request', { turnId: 't1', spanStart: 0, spanEnd: 7 }, 'memphis')]),
    ctx: CTX_HOPS,
  });
  assert.equal(g.candidateSet[0].matchKind, 'normalized');
  assert.equal(g.grade, 'field-grade');
});

// --- Invalidated source flag ---------------------------------------------------

test('invalidated-source flag: grade kept, flag reported alongside', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'memory', ref: { factId: 'f1', snapshotId: 's-old', fieldPath: 'n' } },
    candidateSet: buildCandidateSet(42, [logged('memory', { factId: 'f1', snapshotId: 's-old', fieldPath: 'n' }, 42)]),
    ctx: Object.assign({}, CTX_HOPS, { invalidatedSnapshots: ['s-old'] }),
  }));
  assert.equal(g.grade, 'field-grade');
  assert.equal(g.invalidatedSource, true);
});

// --- Parameter rollup -----------------------------------------------------------

test('weakest-leaf rollup: one untraceable leaf hides behind no grounded label', () => {
  const good = gradeLeaf(fieldGradeCase({}));
  const bad = gradeLeaf(fieldGradeCase({ leafPath: 'zip', candidateSet: [] }));
  const rolled = gradeParameter({ parameterName: 'address', leafGrades: [good, bad] });
  assert.equal(rolled.grade, 'untraceable');
  assert.equal(rolled.weakestLeafPath, 'zip');
  assert.equal(rolled.hallucination, 'fail');
});

test('parameter rollup: ambiguous weakest leaf keeps hallucination pass but not proof', () => {
  const good = gradeLeaf(fieldGradeCase({}));
  const amb = gradeLeaf(fieldGradeCase({
    leafPath: 'city',
    candidateSet: buildCandidateSet(42, [
      logged('request', { turnId: 't1', spanStart: 0, spanEnd: 2 }, 42),
      logged('memory', { factId: 'f1', snapshotId: 's1', fieldPath: 'n' }, 42),
    ]),
  }));
  const rolled = gradeParameter({ parameterName: 'p', leafGrades: [good, amb] });
  assert.equal(rolled.grade, 'ambiguous');
  assert.equal(rolled.weakestLeafPath, 'city');
  assert.equal(rolled.hallucination, 'pass');
  assert.equal(rolled.misinterpretation, 'ambiguous');
});

test('gradeParameter throws on an empty leaf list and on unknown grades', () => {
  assert.throws(() => gradeParameter({ leafGrades: [] }), /at least one/);
  assert.throws(() => gradeParameter({ leafGrades: [{ grade: 'vibes' }] }), /known grade/);
});

// --- Observation-claim reuse ------------------------------------------------------

test('observation-claim reuse: match grounded, mismatch fabricated-observation, missing unlogged', () => {
  const loggedResults = [{ hopId: 'h2', result: { total: 42 } }];
  const grounded = gradeObservationClaim({ claimed: { tool: 'calc', hopId: 'h2', field: 'total', value: 42 }, loggedResults });
  assert.equal(grounded.label, 'grounded-observation');
  const fabricated = gradeObservationClaim({ claimed: { tool: 'calc', hopId: 'h2', field: 'total', value: 43 }, loggedResults });
  assert.equal(fabricated.label, 'fabricated-observation');
  const unlogged = gradeObservationClaim({ claimed: { tool: 'calc', hopId: 'h9', field: 'total', value: 42 }, loggedResults });
  assert.equal(unlogged.label, 'unlogged-observation');
});

test('observation-claim reuse: normalized match counts as grounded, span claims by hash', () => {
  const loggedResults = [{ hopId: 'h2', result: { city: 'memphis' } }];
  const g = gradeObservationClaim({ claimed: { tool: 't', hopId: 'h2', field: 'city', value: 'Memphis' }, loggedResults });
  assert.equal(g.label, 'grounded-observation');
});

// --- Routine report + falsifier ------------------------------------------------------

test('routine report: shares per grade + transform-registry coverage', () => {
  const registry = [declareTransform({ id: 'pct-dec', specVersion: 'v1', op: 'percent-to-decimal', outputUnit: 'decimal' })];
  const leaves = [
    gradeLeaf(fieldGradeCase({})),
    gradeLeaf(fieldGradeCase({ leafPath: 'b', candidateSet: [] })),
    gradeLeaf(fieldGradeCase({
      leafPath: 'c', leafValue: 0.05,
      record: { kind: 'derived', declaredUnit: 'decimal', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'pct-dec', transformSpecVersion: 'v1' } },
      ctx: Object.assign({}, CTX_HOPS, { transformRegistry: registry, sourceValues: [5] }),
    })),
    gradeLeaf(fieldGradeCase({
      leafPath: 'd', leafValue: 0.05,
      record: { kind: 'derived', ref: { sources: [{ kind: 'request', ref: { turnId: 't1', spanStart: 0, spanEnd: 1 } }], transformId: 'nope', transformSpecVersion: 'v1' } },
      ctx: Object.assign({}, CTX_HOPS, { transformRegistry: registry, sourceValues: [5] }),
    })),
  ];
  const rep = reportRoutineStats({ routineId: 'r1', leafGrades: leaves });
  assert.equal(rep.leafCount, 4);
  assert.equal(rep.shares.fieldGrade, 0.25);
  assert.equal(rep.shares.untraceable, 0.25);
  assert.equal(rep.shares.derivedVerified, 0.25);
  assert.equal(rep.shares.derivedUnverified, 0.25);
  assert.equal(rep.transformRegistryCoverage, 0.5);
  assert.equal(rep.derivedLeafCount, 2);
});

test('falsifier: field-grade below half kills the rule-grade reading of 7/8', () => {
  const rep = reportRoutineStats({
    routineId: 'r1',
    leafGrades: [gradeLeaf(fieldGradeCase({})), gradeLeaf(fieldGradeCase({ leafPath: 'b', candidateSet: [] })), gradeLeaf(fieldGradeCase({ leafPath: 'c', candidateSet: [] }))],
  });
  assert.equal(rep.shares.fieldGrade, 1 / 3);
  assert.equal(rep.falsifierFires, true);
  assert.equal(rep.ruleGradeReading, 'killed');
});

test('falsifier: ambiguous above half kills the rule-grade reading', () => {
  const amb = (p) => gradeLeaf(fieldGradeCase({
    leafPath: p,
    candidateSet: buildCandidateSet(42, [
      logged('request', { turnId: 't1', spanStart: 0, spanEnd: 2 }, 42),
      logged('memory', { factId: 'f1', snapshotId: 's1', fieldPath: 'n' }, 42),
    ]),
  }));
  const rep = reportRoutineStats({ routineId: 'r1', leafGrades: [amb('a'), amb('b'), gradeLeaf(fieldGradeCase({ leafPath: 'c' }))] });
  assert.equal(rep.shares.ambiguous, 2 / 3);
  assert.equal(rep.falsifierFires, true);
  assert.equal(rep.ruleGradeReading, 'killed');
});

test('falsifier: field-grade at/above half with low ambiguity keeps the reading standing', () => {
  const rep = reportRoutineStats({ routineId: 'r1', leafGrades: [gradeLeaf(fieldGradeCase({})), gradeLeaf(fieldGradeCase({ leafPath: 'b' }))] });
  assert.equal(rep.falsifierFires, false);
  assert.equal(rep.ruleGradeReading, 'standing');
});

test('routine report: zero labeled leaves is unmeasured, never zero', () => {
  const rep = reportRoutineStats({ routineId: 'r-empty', leafGrades: [] });
  assert.equal(rep.shares.fieldGrade, null);
  assert.equal(rep.transformRegistryCoverage, null);
  assert.equal(rep.ruleGradeReading, 'unmeasured');
  assert.equal(rep.falsifierFires, false);
});

test('routine report: invalidated-source share counted alongside grades', () => {
  const g = gradeLeaf(fieldGradeCase({
    record: { kind: 'memory', ref: { factId: 'f1', snapshotId: 's-old', fieldPath: 'n' } },
    candidateSet: buildCandidateSet(42, [logged('memory', { factId: 'f1', snapshotId: 's-old', fieldPath: 'n' }, 42)]),
    ctx: Object.assign({}, CTX_HOPS, { invalidatedSnapshots: ['s-old'] }),
  }));
  const rep = reportRoutineStats({ routineId: 'r1', leafGrades: [g, gradeLeaf(fieldGradeCase({ leafPath: 'b' }))] });
  assert.equal(rep.shares.invalidatedSource, 0.5);
  assert.equal(rep.shares.fieldGrade, 1);
});

// --- Repo finding + live refusal ------------------------------------------------------

test('repo finding: kinds-only ledger means field-grade unmeasured, never zero', () => {
  const f = repoFieldGradeFinding({});
  assert.equal(f.recordsSourceKindsOnly, true);
  assert.equal(f.fieldGradeShare, null);
  assert.equal(f.ruleGradeReading, 'unmeasured');
  assert.ok(f.reason.includes('unmeasured'));
});

test('live refusal: pre-execution block, live gate, block, abort all throw', () => {
  assert.throws(() => refuseLiveIntervention({ action: 'pre-execution-block' }), /refused/);
  assert.throws(() => refuseLiveIntervention({ action: 'live-gate' }), /refused/);
  assert.throws(() => refuseLiveIntervention({ action: 'block' }), /refused/);
  assert.throws(() => refuseLiveIntervention({ action: 'abort' }), /refused/);
});

test('enums: all seven source kinds and four match kinds present', () => {
  assert.deepEqual(SOURCE_KINDS.slice().sort(), ['derived', 'documented_default', 'memory', 'memory_similar', 'model_generation', 'request', 'tool_result'].sort());
  assert.deepEqual(MATCH_KINDS.slice().sort(), ['exact', 'normalized', 'similar', 'transformed'].sort());
});

test('trajectory helper: prior hop ok, same-or-later forward, unknown cross-trajectory, no trajectory unchecked', () => {
  assert.equal(validateToolResultTrajectory({ hopId: 'h1' }, CTX_HOPS), null);
  assert.equal(validateToolResultTrajectory({ hopId: 'h3' }, { hops: HOPS, currentHopIndex: 2 }), 'forward-reference');
  assert.equal(validateToolResultTrajectory({ hopId: 'zz' }, CTX_HOPS), 'cross-trajectory');
  assert.equal(validateToolResultTrajectory({ hopId: 'zz' }, {}), null);
});
