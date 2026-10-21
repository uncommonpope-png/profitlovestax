// src/genesis/void-building-textures.js
// Procedural facade texture factory for Void cities.
// Generates cached canvas textures (color, emissive windows, roughness) so every
// building gets detail without any external image assets.

(function () {
  'use strict';

  function T3() { return window.THREE; }
  const CACHE = new Map();

  function key(type, width, height, accent) { return `${type}_${width}_${height}_${accent}`; }

  function hexToRgb(hex) {
    var T = T3();
    const c = new T.Color(hex);
    return { r: c.r, g: c.g, b: c.b };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Draw a panel facade with optional windows, grime, and neon
  function drawFacade(ctx, width, height, baseColor, opts) {
    opts = opts || {};
    const base = hexToRgb(baseColor);

    // Base concrete / metal plate
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    const dark = `rgb(${Math.floor(base.r * 40)},${Math.floor(base.g * 40)},${Math.floor(base.b * 40)})`;
    const mid = `rgb(${Math.floor(base.r * 90)},${Math.floor(base.g * 90)},${Math.floor(base.b * 90)})`;
    const light = `rgb(${Math.floor(base.r * 140)},${Math.floor(base.g * 140)},${Math.floor(base.b * 140)})`;
    grad.addColorStop(0, light);
    grad.addColorStop(0.5, mid);
    grad.addColorStop(1, dark);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Grime / weather streaks
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const w = 2 + Math.random() * 20;
      const h = 10 + Math.random() * 80;
      ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
      ctx.fillRect(x, y, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Panel seams
    ctx.strokeStyle = `rgba(0,0,0,0.35)`;
    ctx.lineWidth = 2;
    const panelW = 32 + Math.random() * 32;
    const panelH = 32 + Math.random() * 32;
    for (let x = 0; x < width; x += panelW) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += panelH) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Windows
    if (opts.windows !== false) {
      const rows = opts.windowRows || 6;
      const cols = opts.windowCols || 4;
      const winW = (width * 0.6) / cols;
      const winH = (height * 0.7) / rows;
      const padX = (width - cols * winW) / (cols + 1);
      const padY = (height - rows * winH) / (rows + 1);
      const winColor = opts.emissive || '#00ffcc';
      const winBase = hexToRgb(winColor);
      const litStyle = `rgb(${Math.floor(winBase.r * 255)},${Math.floor(winBase.g * 255)},${Math.floor(winBase.b * 255)})`;
      const dimStyle = `rgb(${Math.floor(winBase.r * 80)},${Math.floor(winBase.g * 80)},${Math.floor(winBase.b * 80)})`;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = padX + c * (winW + padX);
          const wy = padY + r * (winH + padY);
          const lit = Math.random() > 0.35;
          ctx.fillStyle = lit ? litStyle : dimStyle;
          ctx.fillRect(wx, wy, winW * 0.8, winH * 0.8);
          // Window frame
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
          ctx.strokeRect(wx, wy, winW * 0.8, winH * 0.8);
        }
      }
    }

    // Neon band / stripe
    if (opts.neonBand) {
      ctx.fillStyle = opts.neonBand;
      ctx.fillRect(0, height - 8, width, 6);
    }

    // Dirt overlay at bottom
    const dirt = ctx.createLinearGradient(0, height - 40, 0, height);
    dirt.addColorStop(0, 'rgba(0,0,0,0)');
    dirt.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = dirt;
    ctx.fillRect(0, height - 40, width, 40);
  }

  function generate(type, width, height, baseColor, opts) {
    type = type || 'default';
    width = width || 256;
    height = height || 256;
    opts = opts || {};
    const cacheKey = key(type, width, height, baseColor);
    if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    drawFacade(ctx, width, height, baseColor, opts);

    var T = T3();
    if (!T) return null;
    const texture = new T.CanvasTexture(canvas);
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    texture.colorSpace = T.SRGBColorSpace;
    CACHE.set(cacheKey, texture);
    return texture;
  }

  function materialFor(type, baseColor, opts) {
    opts = opts || {};
    var tex = generate(type, 256, 256, baseColor, opts);
    if (!tex) return null;
    var T = T3();
    var emissiveColor = opts.emissive || 0x000000;
    var mat = new T.MeshStandardMaterial({
      color: 0xffffff,
      map: tex,
      emissive: emissiveColor,
      emissiveIntensity: opts.emissiveIntensity || 0,
      roughness: opts.roughness !== undefined ? opts.roughness : 0.65,
      metalness: opts.metalness !== undefined ? opts.metalness : 0.3,
    });
    return mat;
  }

  window.VoidBuildingTextures = { generate, materialFor, clearCache: () => CACHE.clear() };
})();
