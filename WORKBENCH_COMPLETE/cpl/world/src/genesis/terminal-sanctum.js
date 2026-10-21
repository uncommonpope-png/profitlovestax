/**
 * terminal-sanctum.js
 * Sandboxed Terminal Command Deck inside the Central Pyramid at (0, 0, 0)
 * 
 * Features:
 *   1. 10 Physical 3D Laptop Workstations arranged in a ring inside the grounded pyramid.
 *   2. Diegetic CRT Canvas Displays hovering above each laptop.
 *   3. Sandboxed Terminal Simulator with live keyboard event listener.
 *   4. Direct physical typing (ls, jump, status, scan, hack, clear).
 */

(function() {
  'use strict';

  // Lazy THREE accessor — window.THREE is set by the ES module block AFTER
  // this legacy IIFE parses. Proxy defers resolution until real use (inside
  // install(), which runs post-boot when THREE exists).
  const T = new Proxy({}, {
    get: function(_t, prop) {
      const THREE = window.THREE;
      if (!THREE) return undefined;
      return THREE[prop];
    }
  });

  // ─── TERMINAL SIMULATOR ─────────────────────────────────────────────

  class TerminalInstance {
    constructor(realmName, realmPos, colorHex) {
      this.realmName = realmName;
      this.realmPos = realmPos;
      this.colorHex = colorHex || '#00ff66';
      
      this.canvas = document.createElement('canvas');
      this.canvas.width = 512;
      this.canvas.height = 256;
      this.ctx = this.canvas.getContext('2d');
      
      this.texture = new T.CanvasTexture(this.canvas);
      this.texture.minFilter = T.LinearFilter;

      this.commandBuffer = '';
      this.history = [
        `[TERMINAL SANCTUM v2.4]`,
        `CONNECTED TO: ${realmName.toUpperCase()}`,
        `POS: (${realmPos.x}, ${realmPos.z})`,
        `TYPE 'help' OR 'ls' FOR COMMANDS.`,
        ``
      ];
      this.render();
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark CRT Background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // CRT Scanlines
      ctx.fillStyle = 'rgba(0, 255, 100, 0.03)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }

      // Border frame
      ctx.strokeStyle = this.colorHex;
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      // Header
      ctx.fillStyle = this.colorHex;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`// SYSTEM: ${this.realmName.toUpperCase()}`, 16, 28);

      // Output Lines
      ctx.font = '13px monospace';
      const startY = 50;
      const maxLines = 9;
      const visibleLines = this.history.slice(-maxLines);

      for (let i = 0; i < visibleLines.length; i++) {
        ctx.fillText(visibleLines[i], 16, startY + i * 18);
      }

      // Input Prompt
      const cursor = (Math.floor(Date.now() / 500) % 2 === 0) ? '█' : ' ';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`root@cpl:~$ ${this.commandBuffer}${cursor}`, 16, h - 16);

      this.texture.needsUpdate = true;
    }

    typeChar(char) {
      if (this.commandBuffer.length < 32) {
        this.commandBuffer += char;
        this.render();
      }
    }

    backspace() {
      if (this.commandBuffer.length > 0) {
        this.commandBuffer = this.commandBuffer.slice(0, -1);
        this.render();
      }
    }

    execute() {
      const cmd = this.commandBuffer.trim().toLowerCase();
      this.history.push(`root@cpl:~$ ${this.commandBuffer}`);
      this.commandBuffer = '';

      if (cmd === 'help') {
        this.history.push(`COMMANDS: ls, jump, scan, status, hack, clear`);
      } else if (cmd === 'ls' || cmd === 'dir') {
        this.history.push(`REALM: ${this.realmName}`);
        this.history.push(`COORDS: X:${this.realmPos.x} Z:${this.realmPos.z}`);
        this.history.push(`STATUS: ONLINE [LOD 0]`);
      } else if (cmd === 'jump' || cmd === 'enter') {
        this.history.push(`WARPING CAMERA TO REALM...`);
        const PlayerCam = window.Genesis && window.Genesis.PlayerCam;
        if (PlayerCam && PlayerCam.teleportTo) {
          PlayerCam.teleportTo({ x: this.realmPos.x, y: 25, z: this.realmPos.z });
        }
      } else if (cmd === 'scan') {
        this.history.push(`SCANNING... 180 BUILDINGS DETECTED`);
        this.history.push(`RTS FLEET: READY`);
      } else if (cmd === 'status') {
        this.history.push(`FPS: 60 | LOD: TIER 0`);
        this.history.push(`GPU SAFEGUARD: OPTIMAL`);
      } else if (cmd === 'hack') {
        this.history.push(`ACCESS GRANTED. +1000 PLT CREDITS.`);
      } else if (cmd === 'clear') {
        this.history = [];
      } else if (cmd !== '') {
        this.history.push(`UNKNOWN COMMAND: '${cmd}'`);
      }

      this.render();
    }
  }

  // ─── 3D WORKSTATION CREATOR ─────────────────────────────────────────

  function createWorkstation(scene, realmDef, index, totalCount) {
    const group = new T.Group();
    
    // Circle placement around pyramid core (radius = 35)
    const angle = (index / totalCount) * Math.PI * 2;
    const r = 35;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    group.position.set(x, 0.2, z);
    group.rotation.y = -angle - Math.PI / 2; // Face center

    // Desk Base
    const deskMat = new T.MeshStandardMaterial({ color: 0x111822, roughness: 0.4, metalness: 0.8 });
    const desk = new T.Mesh(new T.BoxGeometry(10, 4, 5), deskMat);
    desk.position.y = 2;
    group.add(desk);

    // Laptop Chassis (Base + Screen Lid)
    const laptopMat = new T.MeshStandardMaterial({ color: 0x334455, roughness: 0.2, metalness: 0.9 });
    const laptopBase = new T.Mesh(new T.BoxGeometry(3, 0.2, 2.2), laptopMat);
    laptopBase.position.set(0, 4.1, 0.5);
    group.add(laptopBase);

    // Keyboard Keycaps
    const keysMat = new T.MeshBasicMaterial({ color: 0x00ffcc });
    const keys = new T.Mesh(new T.BoxGeometry(2.6, 0.05, 1.6), keysMat);
    keys.position.set(0, 4.22, 0.5);
    group.add(keys);

    // Laptop Screen Lid (angled)
    const screenLid = new T.Mesh(new T.BoxGeometry(3, 2, 0.15), laptopMat);
    screenLid.position.set(0, 5.1, -0.5);
    screenLid.rotation.x = -0.2;
    group.add(screenLid);

    // Terminal Instance & Diegetic Screen Display
    const term = new TerminalInstance(realmDef.name, { x: realmDef.x, z: realmDef.z }, realmDef.color);
    
    const displayGeo = new T.PlaneGeometry(8, 4.2);
    const displayMat = new T.MeshBasicMaterial({
      map: term.texture,
      side: T.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    const displayMesh = new T.Mesh(displayGeo, displayMat);
    displayMesh.position.set(0, 7.5, -0.6);
    displayMesh.userData.isTerminalDisplay = true;
    displayMesh.userData.terminal = term;
    group.add(displayMesh);

    // CRT Screen Frame Backing
    const frameMat = new T.MeshStandardMaterial({ color: 0x0a101d, roughness: 0.5, emissive: 0x002244 });
    const frame = new T.Mesh(new T.BoxGeometry(8.4, 4.6, 0.3), frameMat);
    frame.position.set(0, 7.5, -0.75);
    group.add(frame);

    // Floating Interaction Light Indicator
    const light = new T.PointLight(new T.Color(realmDef.color), 1.5, 15);
    light.position.set(0, 6, 0);
    group.add(light);

    scene.add(group);
    return { group, term, displayMesh };
  }

  // ─── MAIN SANCTUM ENGINE ────────────────────────────────────────────

  let activeTerminal = null;
  const workstations = [];

  const REALM_DEFS = [
    { name: 'Shattered Front', x: 900, z: 300, color: '#ff4444' },
    { name: 'Obsidian Spire', x: 400, z: 0, color: '#ff6600' },
    { name: 'Resonant Veil', x: -600, z: 400, color: '#00ffcc' },
    { name: 'Solar Forge', x: -900, z: -300, color: '#ffaa00' },
    { name: 'Bioluminescent Hive', x: 1200, z: -500, color: '#00ff88' },
    { name: 'Neon Zenith', x: 600, z: -800, color: '#ff00ff' },
    { name: 'Iron Foundry', x: -800, z: -600, color: '#ff6600' },
    { name: 'Aetherium Skylands', x: 1500, z: 0, color: '#4488ff' },
    { name: 'Elysian Vault', x: 1000, z: -1200, color: '#ffdd44' },
    { name: 'Genesis Citadel', x: 0, z: -2200, color: '#ffcc44' }
  ];

  function install(scene) {
    if (!scene || workstations.length > 0) return;

    // Create 10 Workstations inside Pyramid (0,0,0)
    for (let i = 0; i < REALM_DEFS.length; i++) {
      const ws = createWorkstation(scene, REALM_DEFS[i], i, REALM_DEFS.length);
      workstations.push(ws);
    }

    activeTerminal = workstations[0].term; // Default to first

    // Listen for physical keyboard input
    window.addEventListener('keydown', (e) => {
      if (!activeTerminal) return;

      if (e.key === 'Enter') {
        activeTerminal.execute();
      } else if (e.key === 'Backspace') {
        activeTerminal.backspace();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        activeTerminal.typeChar(e.key);
      }
    });

    console.log('[TerminalSanctum] Mounted 10 3D Laptop Terminals inside Central Pyramid (0,0,0)');
  }

  function tick() {
    // Render loop animation for active terminal cursor blink
    for (const ws of workstations) {
      if (ws.term) ws.term.render();
    }
  }

  window.TerminalSanctum = {
    install,
    tick,
    workstations
  };
})();
