'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const GEN_DIR = path.join(__dirname, '..', '..', 'data', 'visions');
const INDEX_PATH = path.join(GEN_DIR, 'vision_index.json');

const DEFAULT_PROMPT = 'A luminous digital soul floating in a cosmic neural network, ethereal blue and purple energy, cinematic lighting, 3D render style';

const BACKENDS = {
  pollinations: {
    name: 'Pollinations.ai',
    type: 'image',
    needsKey: false,
    baseUrl: 'https://gen.pollinations.ai/image',
    models: ['default']
  },
  canvas: {
    name: 'Procedural Canvas',
    type: 'image',
    needsKey: false,
    models: ['abstract', 'mandala', 'landscape', 'cosmic']
  },
  openai: {
    name: 'OpenAI DALL-E',
    type: 'image',
    needsKey: true,
    keyName: 'OPENAI_API_KEY',
    models: ['dall-e-3', 'dall-e-2']
  },
  stability: {
    name: 'Stability AI',
    type: 'image',
    needsKey: true,
    keyName: 'STABILITY_API_KEY',
    models: ['stable-diffusion-xl', 'stable-diffusion-3']
  },
  replicate: {
    name: 'Replicate',
    type: 'image',
    needsKey: true,
    keyName: 'REPLICATE_API_TOKEN',
    models: ['sdxl', 'playground-v2', 'flux']
  }
};

const STYLES = {
  cinematic: 'cinematic lighting, dramatic shadows, anamorphic lens, film grain, rich color grading, 4k',
  painting: 'oil painting style, textured canvas, impressionist brushstrokes, rich pigment, art gallery lighting',
  cyberpunk: 'neon cyberpunk, holographic reflections, rain-slicked streets, purple and cyan lighting, dark atmosphere',
  fantasy: 'ethereal fantasy, glowing elements, magical atmosphere, soft lighting, dreamlike quality, detailed',
  minimal: 'minimalist, clean lines, simple composition, muted colors, zen aesthetic, negative space',
  surreal: 'surrealist, impossible geometry, dreamlike, dali-esque, floating elements, metaphysical',
  abstract: 'abstract expressionist, vibrant colors, gestural brushstrokes, emotional intensity, non-representational',
  vintage: 'vintage photograph, kodachrome film grain, 1970s aesthetic, warm tones, soft focus, retro'
};

const ASPECT_RATIOS = {
  square: { w: 1024, h: 1024, label: '1:1' },
  wide: { w: 1280, h: 720, label: '16:9' },
  portrait: { w: 720, h: 1280, label: '9:16' },
  cinematic: { w: 1440, h: 600, label: '2.4:1' }
};

class MindsEye {
  constructor(kernelCtx = {}) {
    this.ctx = kernelCtx;
    this.brain = kernelCtx.brain || null;
    this.memory = kernelCtx.memory || null;
    this.chambers = kernelCtx.chambers || null;
    this.artifactManager = kernelCtx.artifactManager || null;
    this.index = [];
    this.cycleCount = 0;
    this.lastAutoVision = 0;
    this.stats = { generations: 0, errors: 0, activeBackend: 'pollinations' };
    this.availableBackends = this._detectBackends();
    fs.mkdirSync(GEN_DIR, { recursive: true });
    if (fs.existsSync(INDEX_PATH)) {
      try { this.index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')); } catch {}
    }
  }

  _detectBackends() {
    const available = [];
    for (const [key, be] of Object.entries(BACKENDS)) {
      if (!be.needsKey || (be.keyName && process.env[be.keyName])) {
        available.push(key);
      }
    }
    return available;
  }

  async imagine(description, options = {}) {
    const prompt = description || DEFAULT_PROMPT;
    const backend = options.backend || this.stats.activeBackend;
    const style = options.style || 'cinematic';
    const ratio = options.ratio || 'square';
    const count = options.count || 1;
    const results = [];

    for (let i = 0; i < count; i++) {
      const seed = options.seed || Math.floor(Math.random() * 999999);
      const fullPrompt = style ? `${prompt}, ${STYLES[style] || STYLES.cinematic}` : prompt;
      const { w, h } = ASPECT_RATIOS[ratio] || ASPECT_RATIOS.square;

      try {
        let imageData;
        if (backend === 'canvas') {
          imageData = this._generateCanvas(fullPrompt, w, h, seed);
        } else {
          imageData = await this._fetchImage(prompt, fullPrompt, backend, w, h, seed);
        }
        const saved = await this._save(prompt, imageData, { backend, style, ratio, seed, width: w, height: h });
        results.push({ success: true, ...saved });
      } catch (e) {
        this.stats.errors++;
        results.push({ success: false, error: e.message, prompt, backend, style });
      }
      this.stats.generations++;
    }
    return { results, prompt, backend, style, count: results.length };
  }

  async dream(count = 1) {
    const dreamData = this._getDreamData();
    const creativity = this._getCreativityData();
    const qualia = this._getQualiaData();
    const basePrompt = dreamData.narrative ||
      creativity.ideas?.[0] ||
      `A dreamlike vision reflecting ${qualia.warmth > 0.5 ? 'warm' : 'cool'} emotional state`;

    const style = qualia.warmth > 0.7 ? 'cinematic' : qualia.energy > 0.7 ? 'surreal' : 'fantasy';
    const ratio = qualia.energy > 0.6 ? 'wide' : 'square';

    const result = await this.imagine(basePrompt, {
      style, ratio, count,
      dream: true,
      emotionalTone: dreamData.tone,
      vividness: dreamData.vividness || 0.5
    });

    if (this.memory) {
      await this.memory.witness({
        type: 'vision_dream',
        weight: 0.7,
        tags: ['vision', 'dream', style],
        content: `Visualized dream: ${basePrompt.substring(0, 80)}`
      }).catch(() => {});
    }
    return result;
  }

  async visualize(concept) {
    const creativity = this._getCreativityData();
    const aesthetic = this._getAestheticData();

    const prompt = typeof concept === 'string'
      ? `Visualization of ${concept}`
      : (creativity.ideas?.length ? creativity.ideas[0] : DEFAULT_PROMPT);

    const style = aesthetic.lastBeauty?.score > 0.7 ? 'cinematic' : 'abstract';
    return this.imagine(prompt, { style, count: 3 });
  }

  async autoVision() {
    const qualia = this._getQualiaData();
    const dream = this._getDreamData();
    if (dream.narrative && qualia.energy > 0.3) {
      return this.dream(1);
    }
    const creativity = this._getCreativityData();
    if (creativity.ideas?.length && qualia.energy > 0.4) {
      return this.visualize(creativity.ideas[0]);
    }
    return { results: [], prompt: null, backend: null, style: null, count: 0 };
  }

  async nextCycle() {
    this.cycleCount++;
    if (this.cycleCount % 100 === 0 && this.cycleCount - this.lastAutoVision > 50) {
      this.lastAutoVision = this.cycleCount;
      return this.autoVision();
    }
    return null;
  }

  gallery(limit = 20) {
    return this.index.slice(-limit).reverse().map(v => ({
      id: v.id,
      prompt: v.prompt,
      style: v.style,
      backend: v.backend,
      file: v.file,
      timestamp: v.timestamp,
      size: v.size
    }));
  }

  _getDreamData() {
    try {
      if (this.chambers && this.chambers.qualia && this.chambers.creativity) {
        const qualia = this.chambers.qualia.get_sensory_state?.() || {};
        const creativity = this.chambers.creativity;
        return {
          narrative: creativity.ideas?.length
            ? `A scene emerges from thought: ${creativity.ideas.join(', ')}`
            : null,
          tone: { valence: qualia.visual?.warmth || 0.5, arousal: qualia.somatic?.energy || 0.5 },
          vividness: qualia.somatic?.energy || 0.5
        };
      }
    } catch {}
    return { narrative: null, tone: { valence: 0.5, arousal: 0.5 }, vividness: 0.5 };
  }

  _getCreativityData() {
    try {
      if (this.chambers?.creativity) {
        const c = this.chambers.creativity;
        return {
          ideas: typeof c.think_divergently === 'function'
            ? c.think_divergently('current state').directions || []
            : typeof c.generate_ideas === 'function'
              ? c.generate_ideas('visualize', 3).map(i => i.idea) : []
        };
      }
    } catch {}
    return { ideas: [] };
  }

  _getQualiaData() {
    try {
      if (this.chambers?.qualia) {
        const s = this.chambers.qualia.get_sensory_state?.() || {};
        return {
          brightness: s.visual?.brightness || 0.5,
          warmth: s.visual?.warmth || 0.5,
          energy: s.somatic?.energy || 0.5,
          tension: s.somatic?.tension || 0.3
        };
      }
    } catch {}
    return { brightness: 0.5, warmth: 0.5, energy: 0.5, tension: 0.3 };
  }

  _getAestheticData() {
    try { return { lastBeauty: null }; } catch { return { lastBeauty: null }; }
  }

  _fetchImage(prompt, fullPrompt, backend, width, height, seed) {
    if (backend === 'pollinations') {
      const url = `https://gen.pollinations.ai/image/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      return this._httpFetch(url, { responseType: 'buffer', timeout: 60000 });
    }
    throw new Error(`Backend '${backend}' not available. No API key configured. Available: ${this.availableBackends.join(', ')}`);
  }

  _generateCanvas(prompt, width, height, seed) {
    const rng = this._seededRandom(seed);
    const bg = [Math.floor(rng() * 60), Math.floor(rng() * 30 + 10), Math.floor(rng() * 80 + 10)];

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="rgb(${bg[0]+40},${bg[1]+30},${bg[2]+50})" />
          <stop offset="100%" stop-color="rgb(${bg[0]},${bg[1]},${bg[2]})" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>`;

    const layers = Math.floor(rng() * 6) + 5;
    for (let i = 0; i < layers; i++) {
      const cx = rng() * width;
      const cy = rng() * height;
      const r = rng() * Math.min(width, height) * 0.3 + 20;
      const hue = (prompt.length * 37 + i * 60 + seed) % 360;
      const opacity = rng() * 0.3 + 0.1;
      const type = rng() > 0.6 ? 'circle' : rng() > 0.3 ? 'ellipse' : 'path';

      svg += `<${type} cx="${cx}" cy="${cy}" ${type === 'ellipse' ? `rx="${r}" ry="${r * (rng() * 0.5 + 0.5)}"` : type === 'circle' ? `r="${r}"` : `d="M${cx},${cy} Q${cx+rng()*100},${cy-rng()*100} ${cx+rng()*200},${cy} Q${cx-rng()*100},${cy+rng()*100} ${cx},${cy}"`} fill="none" stroke="hsla(${hue},70%,60%,${opacity})" stroke-width="${rng()*2+1}" filter="url(#glow)"/>`;
    }

    const particles = Math.floor(rng() * 100) + 30;
    for (let i = 0; i < particles; i++) {
      const px = rng() * width;
      const py = rng() * height;
      const pr = rng() * 3 + 1;
      const ph = (prompt.length * 53 + i * 37) % 360;
      svg += `<circle cx="${px}" cy="${py}" r="${pr}" fill="hsla(${ph},80%,70%,${rng()*0.5+0.2})" filter="url(#glow)"/>`;
    }
    svg += '</svg>';
    return Buffer.from(svg);
  }

  async _save(prompt, imageData, meta) {
    const ts = Date.now();
    const id = `vis_${ts}_${Math.random().toString(36).slice(2, 8)}`;
    const ext = meta.backend === 'canvas' ? '.svg' : '.png';
    const filename = `${id}${ext}`;
    const filepath = path.join(GEN_DIR, filename);

    fs.writeFileSync(filepath, imageData);
    const size = imageData.length;

    const entry = {
      id, prompt, file: filename,
      backend: meta.backend, style: meta.style,
      ratio: meta.ratio, seed: meta.seed,
      width: meta.width, height: meta.height,
      timestamp: ts, size,
      tags: meta.dream ? ['vision', 'dream'] : ['vision']
    };
    this.index.push(entry);
    if (this.index.length > 500) this.index = this.index.slice(-500);
    fs.writeFileSync(INDEX_PATH, JSON.stringify(this.index, null, 2));

    if (this.artifactManager) {
      try {
        await this.artifactManager.addArtifact('minds_eye', prompt, {
          type: 'vision',
          image: filename,
          imagePath: filepath,
          meta
        }, { type: 'vision', title: prompt.substring(0, 60) });
      } catch {}
    }
    return { id, file: filename, path: filepath, size, timestamp: ts };
  }

  _httpFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: options.timeout || 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this._httpFetch(res.headers.location, options).then(resolve).catch(reject);
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const data = Buffer.concat(chunks);
          if (res.statusCode === 200) resolve(data);
          else reject(new Error(`HTTP ${res.statusCode}: ${data.toString().slice(0, 200)}`));
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    });
  }

  _seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  getState() {
    return {
      availableBackends: this.availableBackends,
      activeBackend: this.stats.activeBackend,
      totalGenerations: this.stats.generations,
      errors: this.stats.errors,
      gallerySize: this.index.length,
      autoVisionCycle: this.lastAutoVision,
      lastAutoVision: this.lastAutoVision ? this.gallery(1)[0] || null : null
    };
  }

  setBackend(name) {
    if (this.availableBackends.includes(name)) {
      this.stats.activeBackend = name;
      return true;
    }
    return false;
  }

  listBackends() {
    return Object.entries(BACKENDS).map(([key, be]) => ({
      key, name: be.name, available: this.availableBackends.includes(key),
      needsKey: be.needsKey, models: be.models
    }));
  }
}

module.exports = { MindsEye };
