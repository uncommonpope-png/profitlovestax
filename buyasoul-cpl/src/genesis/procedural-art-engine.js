/**
 * procedural-art-engine.js
 * BUYASOUL CPL / GODFORGE — Procedural Shader & Canvas Texture Factory
 * 
 * Generates high-resolution GPU texture maps (Normal, Roughness, Emissive)
 * completely procedurally at boot via HTML5 Canvas math. Zero asset downloads.
 */

(function() {
  'use strict';

  const T = window.THREE;

  const TEX_CACHE = {};

  // ─── 1. SCI-FI PANEL NORMAL MAP GENERATOR ────────────────────────────

  function generatePanelNormalMap(width, height) {
    width = width || 512;
    height = height || 512;
    const key = `nmap_${width}_${height}`;
    if (TEX_CACHE[key]) return TEX_CACHE[key];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Neutral normal map base (RGB 128, 128, 255 = flat Z-normal)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, width, height);

    // Draw panel grid seams (Beveled inset lines)
    ctx.lineWidth = 4;
    const gridSize = 64;

    for (let x = 0; x < width; x += gridSize) {
      // X-bevel border
      ctx.strokeStyle = 'rgb(255, 128, 255)'; // X-positive normal tilt
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
      ctx.stroke();

      ctx.strokeStyle = 'rgb(0, 128, 255)'; // X-negative normal tilt
      ctx.beginPath();
      ctx.moveTo(x + 3, 0); ctx.lineTo(x + 3, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      // Y-bevel border
      ctx.strokeStyle = 'rgb(128, 255, 255)'; // Y-positive normal tilt
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(width, y);
      ctx.stroke();

      ctx.strokeStyle = 'rgb(128, 0, 255)'; // Y-negative normal tilt
      ctx.beginPath();
      ctx.moveTo(0, y + 3); ctx.lineTo(width, y + 3);
      ctx.stroke();
    }

    // Rivet / Bolt dots on corners
    ctx.fillStyle = 'rgb(200, 200, 255)';
    for (let x = 32; x < width; x += gridSize) {
      for (let y = 32; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    TEX_CACHE[key] = texture;
    return texture;
  }

  // ─── 2. WEATHERED STONE / METAL ROUGHNESS MAP ───────────────────────

  function generateRoughnessMap(width, height) {
    width = width || 256;
    height = height || 256;
    const key = `rmap_${width}_${height}`;
    if (TEX_CACHE[key]) return TEX_CACHE[key];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Perlin-style noise grain
      const noise = Math.floor(140 + Math.random() * 115);
      data[i]     = noise; // R
      data[i + 1] = noise; // G
      data[i + 2] = noise; // B
      data[i + 3] = 255;   // A
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    TEX_CACHE[key] = texture;
    return texture;
  }

  // ─── 3. ILLUMINATED WINDOW & CIRCUIT EMISSIVE MAP ───────────────────

  function generateEmissiveMap(width, height, colorHex) {
    width = width || 256;
    height = height || 256;
    colorHex = colorHex || '#00ffcc';
    const key = `emap_${width}_${height}_${colorHex}`;
    if (TEX_CACHE[key]) return TEX_CACHE[key];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Glowing window grid matrix
    ctx.fillStyle = colorHex;
    const winW = 12;
    const winH = 20;
    const gapX = 8;
    const gapY = 12;

    for (let x = 10; x < width - 10; x += winW + gapX) {
      for (let y = 10; y < height - 10; y += winH + gapY) {
        if (Math.random() > 0.35) { // 65% lit windows
          ctx.fillRect(x, y, winW, winH);
        }
      }
    }

    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    TEX_CACHE[key] = texture;
    return texture;
  }

  // ─── 4. MATERIAL FACTORY WITH PROCEDURAL MAP BINDING ─────────────────

  function createArtMaterial(colorHex, opts) {
    opts = opts || {};
    const normalMap = generatePanelNormalMap(512, 512);
    const roughnessMap = generateRoughnessMap(256, 256);
    const emissiveMap = opts.hasWindows ? generateEmissiveMap(256, 256, opts.emissiveColor || '#00ffcc') : null;

    const mat = new T.MeshStandardMaterial({
      color: colorHex || 0x223344,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.6,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.4,
      normalMap: normalMap,
      normalScale: new T.Vector2(0.8, 0.8),
      roughnessMap: roughnessMap,
      emissiveMap: emissiveMap,
      emissive: emissiveMap ? new T.Color(opts.emissiveColor || '#00ffcc') : new T.Color(0x000000),
      emissiveIntensity: emissiveMap ? (opts.emissiveIntensity || 1.2) : 0,
    });

    return mat;
  }

  window.ProceduralArtEngine = {
    generatePanelNormalMap,
    generateRoughnessMap,
    generateEmissiveMap,
    createArtMaterial,
  };

  console.log('[ProceduralArtEngine] Shader & Canvas Texture Engine initialized cleanly.');
})();
