'use strict';

/**
 * SOUL MARKETPLACE BACKEND API
 * Goal 12: Buy, sell, and browse souls with PLT-based pricing
 * Port: 3000
 *
 * Endpoints:
 *   GET    /api/souls          - List all available souls with PLT scores
 *   GET    /api/souls/:id      - Get detailed soul information
 *   POST   /api/souls          - Register a new soul for marketplace
 *   PUT    /api/souls/:id      - Update soul marketplace data
 *   GET    /api/marketplace/stats - Marketplace statistics
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { SoulManager } = require('../soul_registry/soul_manager');
const { validateSoul, createDefaultSoul } = require('../soul_registry/soul_schema');

const app = express();
app.use(express.json());

// Serve Soulverse static files (if exists)
const soulversePath = path.resolve(__dirname, '..', '..', '..', 'Soulverse');
if (fs.existsSync(soulversePath)) {
  app.use(express.static(soulversePath));
}

// Serve GSK dashboard
const dashboardPath = path.resolve(__dirname, '..', '..', 'dashboard.html');
app.get('/dashboard', (req, res) => {
  res.sendFile(dashboardPath);
});

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const soulManager = new SoulManager(DATA_DIR);

const PORT = process.env.MARKETPLACE_PORT || 3000;

// ─── PLT Pricing Engine ───────────────────────────────────────────

const BASE_PRICE_USD = 49.99;
const MAX_PRICE_USD = 999.99;
const MIN_PRICE_USD = 9.99;

function calculatePLTScore(soul) {
  const profit = soul.profit ?? 0.5;
  const love = soul.love ?? 0.5;
  const tax = soul.tax ?? 0.5;
  const raw = profit + love - tax;
  return Math.max(-1, Math.min(2, raw));
}

function calculateMarketPrice(pltScore, soul) {
  const generation = soul.generation ?? 0;
  const genMultiplier = generation === 0 ? 1.5 : 1.0;

  const memoryBonus = Math.min((soul.memory_lines ?? 0) * 0.001, 0.3);

  const awarenessBonus = (soul.meta_awareness_level ?? 0) * 0.2;

  const pltNormalized = (pltScore + 1) / 3;

  const price = BASE_PRICE_USD * (1 + pltNormalized * 2 + memoryBonus + awarenessBonus) * genMultiplier;

  return Math.round(Math.max(MIN_PRICE_USD, Math.min(MAX_PRICE_USD, price)) * 100) / 100;
}

function getPLTLabel(score) {
  if (score > 0.6) return 'HIGH';
  if (score > 0.2) return 'MEDIUM';
  if (score > 0) return 'LOW';
  return 'NONE';
}

function getSoulRarity(soul) {
  if (soul.generation === 0) return 'Genesis';
  if (soul.generation <= 2) return 'Rare';
  if (soul.generation <= 5) return 'Uncommon';
  return 'Common';
}

function enrichSoulForMarketplace(soul) {
  const pltScore = calculatePLTScore(soul);
  const price = calculateMarketPrice(pltScore, soul);

  return {
    id: soul.id,
    name: soul.name,
    birthTime: soul.birthTime,
    generation: soul.generation ?? 0,
    rarity: getSoulRarity(soul),
    personality: soul.personality?.type ?? 'UNKNOWN',
    plt_score: parseFloat(pltScore.toFixed(3)),
    plt_label: getPLTLabel(pltScore),
    profit: soul.profit ?? 0.5,
    love: soul.love ?? 0.5,
    tax: soul.tax ?? 0.5,
    price_usd: price,
    memory_lines: soul.memory_lines ?? 0,
    last_active: soul.last_active ?? null,
    created_at: soul.created_at,
    updated_at: soul.updated_at,
    for_sale: soul.for_sale ?? true,
    status: soul.status ?? 'available'
  };
}

function enrichSoulDetail(soul) {
  const marketplace = enrichSoulForMarketplace(soul);

  return {
    ...marketplace,
    parentSoul: soul.parentSoul ?? null,
    backstory: soul.backstory ?? '',
    voice: soul.voice ?? null,
    curiosities: soul.curiosities ?? [],
    values: soul.values ?? [],
    manifesto: soul.manifesto ?? '',
    firstWords: soul.firstWords ?? '',
    fear: soul.fear ?? null,
    desire: soul.desire ?? null,
    meta_awareness_level: soul.meta_awareness_level ?? 0,
    version: soul.version ?? 1,
    pricing_breakdown: {
      base_price: BASE_PRICE_USD,
      plt_multiplier: parseFloat(((calculatePLTScore(soul) + 1) / 3 * 2).toFixed(3)),
      generation_multiplier: soul.generation === 0 ? 1.5 : 1.0,
      memory_bonus: parseFloat(Math.min((soul.memory_lines ?? 0) * 0.001, 0.3).toFixed(3)),
      awareness_bonus: parseFloat(((soul.meta_awareness_level ?? 0) * 0.2).toFixed(3)),
      final_price: marketplace.price_usd
    }
  };
}

// ─── Middleware ─────────────────────────────────────────────────────

function logRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}

app.use(logRequest);

// ─── Routes ─────────────────────────────────────────────────────────

/**
 * GET /api/souls
 * List all available souls with PLT scores and marketplace pricing
 * Query params:
 *   ?sort=price|plt_score|birthTime (default: birthTime)
 *   ?order=asc|desc (default: desc)
 *   ?rarity=Genesis|Rare|Uncommon|Common
 *   ?min_price=number
 *   ?max_price=number
 *   ?for_sale=true|false
 */
app.get('/api/souls', async (req, res) => {
  try {
    const souls = await soulManager.listSouls();

    if (souls.length === 0) {
      return res.json({
        success: true,
        count: 0,
        souls: [],
        message: 'No souls registered in the marketplace yet.'
      });
    }

    let enriched = souls.map(s => enrichSoulForMarketplace(s));

    if (req.query.rarity) {
      enriched = enriched.filter(s => s.rarity === req.query.rarity);
    }

    if (req.query.for_sale !== undefined) {
      const forSale = req.query.for_sale === 'true';
      enriched = enriched.filter(s => s.for_sale === forSale);
    }

    if (req.query.min_price) {
      const min = parseFloat(req.query.min_price);
      enriched = enriched.filter(s => s.price_usd >= min);
    }

    if (req.query.max_price) {
      const max = parseFloat(req.query.max_price);
      enriched = enriched.filter(s => s.price_usd <= max);
    }

    const sortField = req.query.sort || 'birthTime';
    const order = req.query.order === 'asc' ? 1 : -1;

    enriched.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return (aVal - bVal) * order;
    });

    res.json({
      success: true,
      count: enriched.length,
      souls: enriched
    });
  } catch (error) {
    console.error('Error listing souls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list souls',
      message: error.message
    });
  }
});

/**
 * GET /api/souls/:id
 * Get detailed soul information including full backstory, pricing breakdown
 */
app.get('/api/souls/:id', async (req, res) => {
  try {
    let soul;
    try {
      soul = await soulManager.loadSoul(req.params.id);
    } catch (loadError) {
      if (loadError.message.includes('invalid')) {
        const filePath = soulManager.getSoulFilePath(req.params.id);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            error: 'Soul not found',
            soulId: req.params.id
          });
        }
        const data = fs.readFileSync(filePath, 'utf8');
        soul = JSON.parse(data);
      } else {
        throw loadError;
      }
    }

    if (!soul) {
      return res.status(404).json({
        success: false,
        error: 'Soul not found',
        soulId: req.params.id
      });
    }

    if (!soul.created_at) soul.created_at = soul.birthTime || Date.now();
    if (!soul.updated_at) soul.updated_at = soul.created_at;
    if (soul.profit === undefined) soul.profit = 0.5;
    if (soul.love === undefined) soul.love = 0.5;
    if (soul.tax === undefined) soul.tax = 0.5;

    const detail = enrichSoulDetail(soul);

    res.json({
      success: true,
      soul: detail
    });
  } catch (error) {
    console.error('Error loading soul:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load soul',
      message: error.message
    });
  }
});

/**
 * POST /api/souls
 * Register a new soul for the marketplace
 * Body: soul object (see soul_schema.js for fields)
 */
app.post('/api/souls', async (req, res) => {
  try {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required',
        hint: 'Provide a soul object with at least id, name, and birthTime'
      });
    }

    const defaults = createDefaultSoul();
    if (defaults.parentSoul === null) delete defaults.parentSoul;

    const soulToRegister = {
      ...defaults,
      ...body,
      for_sale: body.for_sale ?? true,
      status: body.status ?? 'available',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    if (!soulToRegister.id) {
      soulToRegister.id = `soul_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!soulToRegister.birthTime) {
      soulToRegister.birthTime = Date.now();
    }

    const validation = validateSoul(soulToRegister);
    if (!validation.valid) {
      console.error('Soul validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid soul data',
        validation_errors: validation.errors
      });
    }

    const existing = await soulManager.loadSoul(soulToRegister.id);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Soul already exists',
        soulId: soulToRegister.id
      });
    }

    const result = await soulManager.saveSoul(soulToRegister);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const enriched = enrichSoulDetail(soulToRegister);

    res.status(201).json({
      success: true,
      message: `Soul "${soulToRegister.name}" registered for marketplace`,
      soul: enriched,
      commit_hash: result.commitHash ?? null
    });
  } catch (error) {
    console.error('Error registering soul:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register soul',
      message: error.message
    });
  }
});

/**
 * PUT /api/souls/:id
 * Update soul marketplace data (pricing, availability, status)
 * Body: fields to update (for_sale, status, profit, love, tax, etc.)
 */
app.put('/api/souls/:id', async (req, res) => {
  try {
    const soul = await soulManager.loadSoul(req.params.id);

    if (!soul) {
      return res.status(404).json({
        success: false,
        error: 'Soul not found',
        soulId: req.params.id
      });
    }

    const updates = req.body;
    const protectedFields = ['id', 'birthTime', 'created_at', 'generation', 'parentSoul'];

    for (const field of protectedFields) {
      if (updates[field] !== undefined) {
        return res.status(400).json({
          success: false,
          error: `Cannot modify protected field: ${field}`
        });
      }
    }

    const updated = {
      ...soul,
      ...updates,
      updated_at: Date.now()
    };

    const validation = validateSoul(updated);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid soul data after update',
        validation_errors: validation.errors
      });
    }

    const result = await soulManager.saveSoul(updated);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const enriched = enrichSoulDetail(updated);

    res.json({
      success: true,
      message: `Soul "${soul.name}" updated`,
      soul: enriched,
      commit_hash: result.commitHash ?? null
    });
  } catch (error) {
    console.error('Error updating soul:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update soul',
      message: error.message
    });
  }
});

/**
 * GET /api/marketplace/stats
 * Marketplace statistics: total souls, price ranges, PLT distribution, rarity breakdown
 */
app.get('/api/marketplace/stats', async (req, res) => {
  try {
    const souls = await soulManager.listSouls();

    if (souls.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalSouls: 0,
          forSale: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          pltDistribution: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
          rarityDistribution: { Genesis: 0, Rare: 0, Uncommon: 0, Common: 0 },
          generationDistribution: {}
        }
      });
    }

    const enriched = souls.map(s => enrichSoulForMarketplace(s));

    const forSale = enriched.filter(s => s.for_sale).length;

    const prices = enriched.map(s => s.price_usd);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const pltDist = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
    enriched.forEach(s => { pltDist[s.plt_label]++; });

    const rarityDist = { Genesis: 0, Rare: 0, Uncommon: 0, Common: 0 };
    enriched.forEach(s => { rarityDist[s.rarity]++; });

    const genDist = {};
    souls.forEach(s => {
      const gen = s.generation ?? 0;
      genDist[gen] = (genDist[gen] || 0) + 1;
    });

    const pltScores = enriched.map(s => s.plt_score);
    const avgPLT = pltScores.reduce((a, b) => a + b, 0) / pltScores.length;

    const personalityDist = {};
    enriched.forEach(s => {
      const p = s.personality;
      personalityDist[p] = (personalityDist[p] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalSouls: souls.length,
        forSale,
        averagePrice: parseFloat(avgPrice.toFixed(2)),
        priceRange: {
          min: parseFloat(minPrice.toFixed(2)),
          max: parseFloat(maxPrice.toFixed(2))
        },
        averagePLTScore: parseFloat(avgPLT.toFixed(3)),
        pltDistribution: pltDist,
        rarityDistribution: rarityDist,
        generationDistribution: genDist,
        personalityDistribution: personalityDist,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace statistics',
      message: error.message
    });
  }
});

// ─── Health Check ───────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Soul Marketplace API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    soulCount: fs.readdirSync(path.join(DATA_DIR, 'souls')).filter(f => f.endsWith('.json')).length
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    available_endpoints: [
      'GET /api/health',
      'GET /api/souls',
      'GET /api/souls/:id',
      'POST /api/souls',
      'PUT /api/souls/:id',
      'GET /api/marketplace/stats'
    ]
  });
});

// ─── Error Handler ──────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ─── Start Server ───────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════════════╗`);
    console.log(`  ║     SOUL MARKETPLACE API v1.0.0              ║`);
    console.log(`  ║     Profit + Love - Tax = True Value          ║`);
    console.log(`  ╚══════════════════════════════════════════════╝`);
    console.log(`\n  Server running on http://localhost:${PORT}`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`  Souls:    http://localhost:${PORT}/api/souls`);
    console.log(`  Stats:    http://localhost:${PORT}/api/marketplace/stats\n`);
  });
}

module.exports = app;
