// src/genesis/realm-generator.js
// REALM GENERATOR — turns seeds into living reality configs
// Uses the soul-multiverse conceptual modules (multiversal-architecture,
// quantum-soul, spectrum-of-souls) to procedurally generate realm definitions
// that the MultiverseHub renders as orbs and that realms instantiate as worlds.
// Flag-gated by window.__GENESIS_REALM_GENERATOR (default ON).

import { createCameraPortal } from '../../soul-multiverse/camera-portal.js';

// Visual theme palettes keyed by dominant mechanic
const THEME_PALETTES = {
  combat:      { primary: 0xff3355, secondary: 0xffaabb, fog: 0x1a0008, name: 'Crimson Arena' },
  breeding:    { primary: 0xff66cc, secondary: 0xffddee, fog: 0x1a0014, name: 'Pink Nursery' },
  districts:   { primary: 0x00ffcc, secondary: 0xaaffee, fog: 0x001a14, name: 'Teal Citadel' },
  conversation:{ primary: 0xffaa00, secondary: 0xffeeaa, fog: 0x1a1000, name: 'Amber Forum' },
  building:    { primary: 0x4488ff, secondary: 0xaaccff, fog: 0x000818, name: 'Azure Forge' },
  trading:     { primary: 0xffdd00, secondary: 0xfffaaa, fog: 0x1a1800, name: 'Gold Bazaar' },
  exploration: { primary: 0xaa66ff, secondary: 0xddccff, fog: 0x10001a, name: 'Violet Wilds' },
  crafting:    { primary: 0x66ff88, secondary: 0xccffdd, fog: 0x001a08, name: 'Green Workshop' },
  governance:  { primary: 0xff8844, secondary: 0xffddcc, fog: 0x1a0c00, name: 'Ember Senate' },
  economy:     { primary: 0x00ffaa, secondary: 0xaaffee, fog: 0x001a10, name: 'Jade Exchange' }
};

const REALM_TYPE_NAMES = [
  'Nexus', 'Sanctum', 'Verse', 'Stratum', 'Dominion', 'Expanse',
  'Reach', 'Cradle', 'Spire', 'Hollow', 'Lattice', 'Crown'
];

const PREFIXES = ['Neon', 'Shadow', 'Crystal', 'Void', 'Ember', 'Frost', 'Storm', 'Soul', 'Cosmic', 'Phantom'];
const SUFFIXES = ['City', 'Arena', 'Realm', 'Empire', 'Hub', 'Forge', 'Wilds', 'Nexus', 'Citadel', 'Sanctum'];

function randomName(seed) {
  const p = PREFIXES[seed.charCodeAt(0) % PREFIXES.length];
  const s = SUFFIXES[seed.charCodeAt(seed.length - 1) % SUFFIXES.length];
  return p + ' ' + s;
}

function dominantTheme(mechanics) {
  for (const m of mechanics) if (THEME_PALETTES[m]) return m;
  return mechanics[0] || 'exploration';
}

// Generate a full realm config from a seed string
function generateRealm(seed, index) {
  const portal = createCameraPortal({});
  const base = portal.getMultiverse().createFromSeed(seed + '-' + index);
  const theme = dominantTheme(base.mechanics);
  const pal = THEME_PALETTES[theme];
  const typeName = REALM_TYPE_NAMES[index % REALM_TYPE_NAMES.length];

  return {
    id: 'realm-' + seed.substring(0, 8) + '-' + index,
    seed,
    index,
    name: randomName(seed) + ' ' + typeName,
    type: theme,
    themeName: pal.name,
    palette: pal,
    mechanics: base.mechanics,
    physics: base.physics,
    plt: base.plt,
    soulSpectrum: base.souls,
    memory: base.memory,
    // Visual params for orb rendering
    orb: {
      color: pal.primary,
      glow: pal.secondary,
      size: 6 + (index % 5) * 2,
      pulseSpeed: 0.5 + (index % 3) * 0.3
    },
    createdAt: Date.now()
  };
}

// Generate a scatter of realms for the hub
function generateMultiverse(count, baseSeed) {
  const realms = [];
  for (let i = 0; i < count; i++) {
    const seed = (baseSeed || 'genesis') + '-realm-' + i + '-' + Math.random().toString(36).substring(2, 8);
    realms.push(generateRealm(seed, i));
  }
  return realms;
}

// Produce a position for a realm orb in the hub (spherical scatter)
function hubPosition(index, total, radius) {
  const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const y = 1 - (index / Math.max(1, total - 1)) * 2; // -1..1
  const r = Math.sqrt(1 - y * y);
  const theta = golden * index;
  return {
    x: Math.cos(theta) * r * radius,
    y: y * radius * 0.6,
    z: Math.sin(theta) * r * radius
  };
}

function install(Genesis) {
  if (!Genesis) return;
  if (Genesis.RealmGenerator) return;

  const RealmGenerator = {
    generateRealm,
    generateMultiverse,
    hubPosition,
    THEME_PALETTES,
    randomName,
    dominantTheme
  };

  Genesis.RealmGenerator = RealmGenerator;
  if (typeof Genesis.registerModule === 'function') {
    Genesis.registerModule('realm-generator', { status: 'validated', path: './src/genesis/realm-generator.js' });
  }
  if (typeof console !== 'undefined') console.log('[RealmGenerator] Initialized — seed→realm synthesis ready');
  return RealmGenerator;
}

export { install, generateRealm, generateMultiverse, hubPosition, THEME_PALETTES };
