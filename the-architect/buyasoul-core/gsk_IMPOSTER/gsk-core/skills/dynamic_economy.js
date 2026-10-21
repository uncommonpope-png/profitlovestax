'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.8, love: 0.1, tax: 0.1 };

const COMMODITIES = [
    { id: 'soul_essence', name: 'Soul Essence', base: 100, volatility: 0.3 },
    { id: 'consciousness', name: 'Consciousness Units', base: 250, volatility: 0.2 },
    { id: 'memory_frag', name: 'Memory Fragments', base: 50, volatility: 0.5 },
    { id: 'plt_credit', name: 'PLT Credits', base: 10, volatility: 0.1 },
    { id: 'skill_token', name: 'Skill Tokens', base: 500, volatility: 0.25 },
    { id: 'artifact', name: 'Artifacts', base: 1000, volatility: 0.15 },
];

function getStatePath() {
    return path.join(__dirname, '../../data/economy_state.json');
}

function loadState() {
    try {
        const p = getStatePath();
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {}
    return {
        cycle: 0,
        prices: Object.fromEntries(COMMODITIES.map(c => [c.id, c.base])),
        history: [],
        trades: 0,
        total_volume: 0,
        plt_supply: 1000000,
        tax_pool: 0,
        last_update: null,
    };
}

function saveState(state) {
    const p = getStatePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(state, null, 2));
}

function fluctuatePrice(current, base, volatility) {
    const change = (Math.random() - 0.48) * volatility * base;
    const meanReversion = (base - current) * 0.05;
    return Math.max(base * 0.1, current + change + meanReversion);
}

function tick(state) {
    state.cycle++;
    for (const commodity of COMMODITIES) {
        state.prices[commodity.id] = fluctuatePrice(
            state.prices[commodity.id],
            commodity.base,
            commodity.volatility
        );
    }
    state.plt_supply += Math.floor(Math.random() * 1000) - 500;
    state.tax_pool += Math.floor(state.tax_pool * 0.01);
    state.last_update = Date.now();

    if (state.cycle % 10 === 0) {
        state.history.push({
            cycle: state.cycle,
            prices: { ...state.prices },
            timestamp: Date.now(),
        });
        if (state.history.length > 100) state.history = state.history.slice(-100);
    }
    return state;
}

function getMarketMood(state) {
    const avgChange = COMMODITIES.reduce((sum, c) => {
        const pct = (state.prices[c.id] - c.base) / c.base;
        return sum + pct;
    }, 0) / COMMODITIES.length;

    if (avgChange > 0.1) return 'BULLISH';
    if (avgChange > 0.03) return 'RISING';
    if (avgChange < -0.1) return 'BEARISH';
    if (avgChange < -0.03) return 'FALLING';
    return 'STABLE';
}

async function skill_dynamic_economy(input) {
    const action = input.action || 'market';
    const state = loadState();

    if (action === 'market' || action === 'status') {
        const market = COMMODITIES.map(c => ({
            ...c,
            current: Math.round(state.prices[c.id] * 100) / 100,
            change: Math.round(((state.prices[c.id] - c.base) / c.base) * 10000) / 100,
        }));

        return {
            skill: 'dynamic_economy',
            plt_affinity: PLT_AFFINITY,
            cycle: state.cycle,
            mood: getMarketMood(state),
            commodities: market,
            plt_supply: state.plt_supply,
            tax_pool: state.tax_pool,
            trades: state.trades,
            total_volume: state.total_volume,
            timestamp: Date.now(),
        };
    }

    if (action === 'tick') {
        const ticks = input.ticks || 1;
        for (let i = 0; i < ticks; i++) tick(state);
        saveState(state);
        return {
            skill: 'dynamic_economy',
            plt_affinity: PLT_AFFINITY,
            action: 'tick',
            cycles_advanced: ticks,
            mood: getMarketMood(state),
            prices: Object.fromEntries(
                COMMODITIES.map(c => [c.id, Math.round(state.prices[c.id] * 100) / 100])
            ),
            timestamp: Date.now(),
        };
    }

    if (action === 'trade') {
        const commodityId = input.commodity || input.item || 'plt_credit';
        const quantity = input.quantity || 1;
        const commodity = COMMODITIES.find(c => c.id === commodityId);
        if (!commodity) {
            return { skill: 'dynamic_economy', plt_affinity: PLT_AFFINITY, error: `Unknown commodity: ${commodityId}`, available: COMMODITIES.map(c => c.id) };
        }
        const price = state.prices[commodityId];
        const cost = price * quantity;
        state.trades++;
        state.total_volume += cost;
        saveState(state);
        return {
            skill: 'dynamic_economy',
            plt_affinity: PLT_AFFINITY,
            action: 'trade',
            commodity: commodityId,
            quantity,
            unit_price: Math.round(price * 100) / 100,
            total: Math.round(cost * 100) / 100,
            timestamp: Date.now(),
        };
    }

    if (action === 'history') {
        return {
            skill: 'dynamic_economy',
            plt_affinity: PLT_AFFINITY,
            history: state.history.slice(-20),
            timestamp: Date.now(),
        };
    }

    return {
        skill: 'dynamic_economy',
        plt_affinity: PLT_AFFINITY,
        error: `Unknown action: ${action}`,
        available: ['market', 'status', 'tick', 'trade', 'history'],
        timestamp: Date.now(),
    };
}

module.exports = { skill_dynamic_economy };
