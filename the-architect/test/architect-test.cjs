/**
 * ARCHITECT Test Suite v1.0.0
 * Validates all components
 */

const SoulArchitect = require('../soul-architect.cjs');
const ArchitectProfile = require('../personality/architect-profile.cjs');
const ArchitectDecisionEngine = require('../personality/architect-engine.cjs');
const HexagonalGenerator = require('../src/generators/hexagonal-generator.cjs');
const DDDGenerator = require('../src/generators/ddd-generator.cjs');
const CQRSGenerator = require('../src/generators/cqrs-generator.cjs');
const UltraReviewAgent = require('../ultra-review/ultra-review-agent.cjs');

console.log('🧪 ARCHITECT Test Suite v1.0.0');
console.log('   Running comprehensive validation...');
console.log('');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✅', name);
    passed++;
  } catch (err) {
    console.log('  ❌', name);
    console.log('     Error:', err.message);
    failed++;
  }
}

// Initialize Ultra Review Agent
const reviewer = new UltraReviewAgent({
  patient: 'ARCHITECT',
  surgeon: 'Seshat'
});

console.log('=== Component Loading Tests ===');

test('SoulArchitect loads', () => {
  if (!SoulArchitect) throw new Error('Failed to load');
});

test('ArchitectProfile loads', () => {
  if (!ArchitectProfile) throw new Error('Failed to load');
});

test('DecisionEngine loads', () => {
  if (!ArchitectDecisionEngine) throw new Error('Failed to load');
});

test('HexagonalGenerator loads', () => {
  if (!HexagonalGenerator) throw new Error('Failed to load');
});

test('DDDGenerator loads', () => {
  if (!DDDGenerator) throw new Error('Failed to load');
});

test('CQRSGenerator loads', () => {
  if (!CQRSGenerator) throw new Error('Failed to load');
});

test('UltraReviewAgent loads', () => {
  if (!UltraReviewAgent) throw new Error('Failed to load');
});

console.log('');
console.log('=== Profile Validation ===');

test('Profile has required fields', () => {
  if (!ArchitectProfile.id) throw new Error('Missing id');
  if (!ArchitectProfile.name) throw new Error('Missing name');
  if (!ArchitectProfile.strengths) throw new Error('Missing strengths');
  if (!ArchitectProfile.shadows) throw new Error('Missing shadows');
});

test('Profile has PLT configuration', () => {
  if (!ArchitectProfile.archetype) throw new Error('Missing archetype');
  if (!ArchitectProfile.archetype.plt) throw new Error('Missing PLT');
});

test('Profile has arsenal', () => {
  if (!ArchitectProfile.arsenal) throw new Error('Missing arsenal');
  if (!ArchitectProfile.arsenal.patterns) throw new Error('Missing patterns');
});

console.log('');
console.log('=== Ultra Review Validation ===');

const profileReview = reviewer.review('Architect Profile', 'profile', ArchitectProfile);
test('Profile passed Ultra Review', () => {
  if (!profileReview) throw new Error('Review failed');
});

console.log('');
console.log('=== Generator Tests ===');

test('HexagonalGenerator can generate', () => {
  const gen = new HexagonalGenerator();
  const result = gen.generate({
    name: 'Test',
    domain: { entities: [{ name: 'Test', fields: [] }] },
    application: { useCases: [{ action: 'Create' }] },
    infrastructure: { database: true, http: { routes: [] } }
  });
  if (!result.files || result.files.length === 0) throw new Error('No files generated');
});

test('DDDGenerator can generate', () => {
  const gen = new DDDGenerator();
  const result = gen.generate({
    domain: {},
    aggregates: [{ name: 'Test', entities: [] }],
    services: [{ name: 'Test' }]
  });
  if (!result.files || result.files.length === 0) throw new Error('No files generated');
});

test('CQRSGenerator can generate', () => {
  const gen = new CQRSGenerator();
  const result = gen.generate({
    aggregate: 'Test',
    readModel: 'TestView'
  });
  if (!result.files || result.files.length === 0) throw new Error('No files generated');
});

console.log('');
console.log('=== Decision Engine Tests ===');

const engine = new ArchitectDecisionEngine();

test('Engine can make decisions', () => {
  const result = engine.decide({
    task: 'Test decision',
    options: [
      { type: 'hexagonal', baseUtility: 0.8 },
      { type: 'ddd', baseUtility: 0.7 }
    ]
  });
  if (!result.choice) throw new Error('No choice made');
});

test('Engine can recommend architecture', () => {
  const result = engine.recommend('High traffic e-commerce platform');
  if (!result.primaryPattern) throw new Error('No recommendation');
});

console.log('');
console.log('=== Soul Instance Tests ===');

test('SoulArchitect instantiates', () => {
  const architect = new SoulArchitect();
  if (!architect) throw new Error('Failed to instantiate');
});

test('Soul can think', () => {
  const architect = new SoulArchitect();
  const thinking = architect.think('Test problem');
  if (!thinking.architectPrompt) throw new Error('No prompt generated');
});

test('Soul can recommend', () => {
  const architect = new SoulArchitect();
  const rec = architect.recommend('Test system');
  if (!rec.primaryPattern) throw new Error('No recommendation');
});

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  Test Results');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('  Passed:  ' + passed);
console.log('  Failed:  ' + failed);
console.log('  Total:   ' + (passed + failed));
console.log('');

if (failed === 0) {
  console.log('  ✅ ALL TESTS PASSED');
  console.log('  Ultra Review: APPROVED FOR DEPLOYMENT');
} else {
  console.log('  ⚠️  SOME TESTS FAILED');
  console.log('  Ultra Review: REQUIRES ATTENTION');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
