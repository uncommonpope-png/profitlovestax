// src/genesis/soul-forge-nexus.js
// SOUL FORGE NEXUS — first new reality built from Lost World mechanics
// A physical 3D realm where souls are forged, summoned, and battled.
// Agent AI (need-based) walks the floor. PLT flows through the Weave.
// Returns a THREE.Group root that the MultiverseHub registers as a stratum.

import * as THREE from 'three';

// PLT advantage cycle (from Lost World): profit>love>tax>profit
const ADVANTAGE = {
  profit: { love: 1.5, tax: 0.7 },
  love: { tax: 1.5, profit: 0.7 },
  tax: { profit: 1.5, love: 0.7 }
};

function getAdvantage(atk, def) {
  if (ADVANTAGE[atk] && ADVANTAGE[atk][def]) return ADVANTAGE[atk][def];
  return 1.0;
}

export function buildSoulForgeNexus(ctx = {}) {
  const THREE = ctx.THREE || window.THREE;
  const Genesis = ctx.Genesis;
  const root = new THREE.Group();
  root.name = 'soul-forge-nexus';
  root.userData.verticalStratumId = 'soul-forge-nexus';
  root.userData.verticalState = 'UNLOADED';

  const state = {
    plt: { profit: 50, love: 50, tax: 50 },
    souls: [],
    gems: 500,
    agents: [],
    combat: null
  };

  // ---- Ground ----
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.9, metalness: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const grid = new THREE.GridHelper(200, 40, 0xff66aa, 0x220044);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  root.add(grid);

  // ---- Forge Altar (central) ----
  const altarGroup = new THREE.Group();
  const altarBase = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 5, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0x332244, emissive: 0x221133, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.3 })
  );
  altarBase.position.y = 1;
  altarGroup.add(altarBase);
  const altarCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2, 1),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.8 })
  );
  altarCore.position.y = 4;
  altarGroup.add(altarCore);
  altarGroup.position.set(0, 0, 0);
  root.add(altarGroup);
  state.altarCore = altarCore;

  // ---- Gacha Orb (floating) ----
  const gachaOrb = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xff66aa, emissive: 0xff66aa, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 })
  );
  gachaOrb.position.set(20, 6, -20);
  root.add(gachaOrb);
  state.gachaOrb = gachaOrb;

  // ---- Combat Arena Ring ----
  const arenaRing = new THREE.Mesh(
    new THREE.TorusGeometry(15, 0.5, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.4 })
  );
  arenaRing.rotation.x = Math.PI / 2;
  arenaRing.position.set(-30, 0.5, 30);
  root.add(arenaRing);
  state.arenaRing = arenaRing;

  // ---- Agent AI (need-based, from Lost World) ----
  const NEED_TYPES = ['energy', 'social', 'skill', 'purpose'];
  const AGENT_COLORS = { profit: 0xffaa00, love: 0xff66aa, tax: 0x00ffcc };
  const AGENT_NAMES = ['Neon', 'Pixel', 'Drift', 'Glitch', 'Spark', 'Volt', 'Echo', 'Pulse', 'Surge', 'Flux'];

  function createHumanoid(type, x, z, name) {
    const g = new THREE.Group();
    const c = AGENT_COLORS[type] || 0xffffff;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.1 }));
    torso.position.y = 1.2; g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffddcc }));
    head.position.y = 1.85; g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.03, 8, 32), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.5, transparent: true, opacity: 0 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    g.position.set(x, 0, z);
    root.add(g);
    return { group: g, type, name, ring, needs: { energy: 80 + Math.random() * 20, social: 80 + Math.random() * 20, skill: 80 + Math.random() * 20, purpose: 80 + Math.random() * 20 }, state: 'IDLE', targetPos: null, stateTimer: 0 };
  }

  for (let i = 0; i < 8; i++) {
    const type = ['profit', 'love', 'tax'][i % 3];
    const x = (Math.random() - 0.5) * 60, z = (Math.random() - 0.5) * 60;
    state.agents.push(createHumanoid(type, x, z, AGENT_NAMES[i]));
  }

  // ---- PLT sync via Weave ----
  function updatePLT(p, l, t) {
    state.plt.profit = Math.max(0, Math.min(100, state.plt.profit + p));
    state.plt.love = Math.max(0, Math.min(100, state.plt.love + l));
    state.plt.tax = Math.max(0, Math.min(100, state.plt.tax + t));
    if (Genesis && Genesis.WeaveBridge) Genesis.WeaveBridge.syncPLT('soul-forge-nexus', { profit: p, love: l, tax: t });
  }

  // ---- Forge ----
  function forgeSoul(name, p, l, t) {
    const type = p > l && p > t ? 'profit' : l > t ? 'love' : 'tax';
    const soul = { id: 'soul-' + Date.now(), name: name || 'Soul', type, plt: { profit: p, love: l, tax: t }, level: 1, skills: ['forge-created'] };
    state.souls.push(soul);
    updatePLT(p * 0.02, l * 0.02, t * 0.02);
    if (Genesis && Genesis.WeaveBridge) Genesis.WeaveBridge.addSoul(soul);
    return soul;
  }

  // ---- Gacha ----
  function pullGacha() {
    if (state.gems < 100) return null;
    state.gems -= 100;
    const roll = Math.random();
    const rarity = roll < 0.15 ? 'legendary' : roll < 0.40 ? 'rare' : 'common';
    const stats = rarity === 'legendary' ? 100 : rarity === 'rare' ? 75 : 50;
    const type = ['profit', 'love', 'tax'][Math.floor(Math.random() * 3)];
    const soul = { id: 'soul-' + Date.now(), name: 'Orb-' + Date.now(), type, rarity, plt: { profit: stats + Math.floor(Math.random() * 20), love: stats + Math.floor(Math.random() * 20), tax: stats + Math.floor(Math.random() * 20) }, level: 1, skills: ['gacha-summoned'] };
    state.souls.push(soul);
    updatePLT(2, 2, 2);
    if (Genesis && Genesis.WeaveBridge) Genesis.WeaveBridge.addSoul(soul);
    return soul;
  }

  // ---- Combat ----
  const PANTHEON = [
    { name: 'Profit Prime', type: 'profit', maxHp: 150 },
    { name: 'Love Weaver', type: 'love', maxHp: 130 },
    { name: 'Tax Collector', type: 'tax', maxHp: 120 }
  ];

  function startCombat(bossIndex) {
    const boss = PANTHEON[bossIndex] || PANTHEON[0];
    const player = state.souls.length > 0 ? { ...state.souls[0], maxHp: 100 } : { name: 'Hero', type: 'profit', maxHp: 100 };
    state.combat = { player, boss, playerHp: 100, bossHp: boss.maxHp, super: 0, active: true, turn: 'player' };
    return state.combat;
  }

  function combatMove(move) {
    if (!state.combat || !state.combat.active || state.combat.turn !== 'player') return;
    const moves = { punch: { dmg: 10, cost: 5 }, kick: { dmg: 15, cost: 8 }, special: { dmg: 40, cost: -50 }, ultimate: { dmg: 80, cost: -100 } };
    const m = moves[move];
    if (!m) return;
    if (state.combat.super + m.cost < 0) return;
    state.combat.super += m.cost;
    const dmg = Math.floor(m.dmg * getAdvantage(state.combat.player.type, state.combat.boss.type));
    state.combat.bossHp = Math.max(0, state.combat.bossHp - dmg);
    updatePLT(3, 1, -1);
    if (state.combat.bossHp <= 0) { state.combat.active = false; updatePLT(10, 5, -2); }
    else { state.combat.turn = 'boss'; setTimeout(() => bossTurn(), 800); }
  }

  function bossTurn() {
    if (!state.combat || !state.combat.active) return;
    const m = ['punch', 'kick', 'special'][Math.floor(Math.random() * 3)];
    const dmgMap = { punch: 10, kick: 15, special: 40 };
    const dmg = Math.floor(dmgMap[m] * getAdvantage(state.combat.boss.type, state.combat.player.type));
    state.combat.playerHp = Math.max(0, state.combat.playerHp - dmg);
    if (state.combat.playerHp <= 0) { state.combat.active = false; updatePLT(-5, -5, 5); }
    else state.combat.turn = 'player';
  }

  // ---- Update loop ----
  function update(dt) {
    const t = performance.now() * 0.001;
    if (state.altarCore) state.altarCore.rotation.y += dt * 0.5;
    if (state.gachaOrb) {
      state.gachaOrb.position.y = 6 + Math.sin(t) * 1.5;
      state.gachaOrb.rotation.y += dt * 0.8;
    }
    if (state.arenaRing) state.arenaRing.rotation.z += dt * 0.2;

    // Agent AI
    for (const a of state.agents) {
      for (const k of NEED_TYPES) a.needs[k] = Math.max(0, Math.min(100, a.needs[k] - dt * (0.5 + Math.random() * 0.5)));
      if (a.state === 'IDLE') {
        const lowest = NEED_TYPES.reduce((min, k) => a.needs[k] < a.needs[min] ? k : min, NEED_TYPES[0]);
        if (a.needs[lowest] < 40) {
          a.targetPos = new THREE.Vector3((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
          a.state = 'WALKING';
          a.ring.material.opacity = 0.3;
        }
      } else if (a.state === 'WALKING') {
        if (!a.targetPos) { a.state = 'IDLE'; }
        else {
          const dx = a.targetPos.x - a.group.position.x, dz = a.targetPos.z - a.group.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 1.5) {
            a.state = 'IDLE'; a.ring.material.opacity = 0;
            for (const k of NEED_TYPES) if (a.needs[k] < 50) a.needs[k] = Math.min(100, a.needs[k] + 30 * dt);
          } else {
            a.group.position.x += (dx / dist) * 2.5 * dt;
            a.group.position.z += (dz / dist) * 2.5 * dt;
            a.group.rotation.y = Math.atan2(dx, dz);
          }
        }
      }
    }
  }

  const api = {
    root,
    state,
    update,
    updatePLT,
    forgeSoul,
    pullGacha,
    startCombat,
    combatMove,
    getAdvantage,
    PANTHEON,
    summary() {
      return {
        name: 'Soul Forge Nexus',
        plt: state.plt,
        souls: state.souls.length,
        gems: state.gems,
        agents: state.agents.length,
        combat: state.combat ? { active: state.combat.active, playerHp: state.combat.playerHp, bossHp: state.combat.bossHp } : null
      };
    }
  };

  root.userData.nexusApi = api;
  return api;
}

export function buildSoulForgeNexusAtPosition(x, z, ctx) {
  const nexus = buildSoulForgeNexus(ctx);
  if (nexus && nexus.root) {
    nexus.root.position.set(x, 0, z);
    nexus.root.name = 'soul-forge-nexus-' + Math.round(x) + '-' + Math.round(z);
  }
  return nexus;
}

export function install(Genesis, THREE) {
  if (!Genesis) return null;
  if (Genesis.SoulForgeNexus) return Genesis.SoulForgeNexus;
  const nexus = buildSoulForgeNexus({ THREE: THREE || window.THREE, Genesis });
  Genesis.SoulForgeNexus = nexus;
  if (typeof Genesis.registerModule === 'function') {
    Genesis.registerModule('soul-forge-nexus', { status: 'validated', path: './src/genesis/soul-forge-nexus.js' });
  }
  if (typeof console !== 'undefined') console.log('[SoulForgeNexus] Built — forge/gacha/combat/agent-AI ready');
  return nexus;
}
