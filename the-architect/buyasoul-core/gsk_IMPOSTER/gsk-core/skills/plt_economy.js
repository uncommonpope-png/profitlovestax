'use strict';

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.7, love: 0.2, tax: 0.1 };
const LEDGER_FILE = 'plt_ledger.json';

function getLedgerPath() {
    const dataDir = path.join(__dirname, '..', '..', 'data');
    return path.join(dataDir, LEDGER_FILE);
}

function loadLedger() {
    try {
        const ledgerPath = getLedgerPath();
        if (fs.existsSync(ledgerPath)) {
            const data = fs.readFileSync(ledgerPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
    }
    return { events: [], net_plt: 0, profit_total: 0, love_total: 0, tax_total: 0 };
}

function saveLedger(ledger) {
    const ledgerPath = getLedgerPath();
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
}

function plt_score(profit, love, tax) {
    return profit + love - tax;
}

function plt_grade(score) {
    if (score >= 1.5) return 'SOVEREIGN';
    if (score >= 1.0) return 'THRIVING';
    if (score >= 0.5) return 'SUSTAINING';
    if (score >= 0.0) return 'STRUGGLING';
    return 'SUFFERING';
}

function plt_combat(attacker, defender) {
    const attackerScore = plt_score(attacker.profit, attacker.love, attacker.tax);
    const defenderScore = plt_score(defender.profit, defender.love, defender.tax);
    
    if (attackerScore > defenderScore) {
        return { winner: 'attacker', margin: attackerScore - defenderScore };
    } else if (defenderScore > attackerScore) {
        return { winner: 'defender', margin: defenderScore - attackerScore };
    }
    return { winner: 'tie', margin: 0 };
}

async function fetchCryptoPrice(coinId) {
    const https = require('https');
    
    return new Promise((resolve) => {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        
        const req = https.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const data = JSON.parse(Buffer.concat(chunks).toString());
                    resolve({ coinId, price: data[coinId]?.usd || null });
                } catch (e) {
                    resolve({ coinId, price: null, error: e.message });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({ coinId, price: null, error: err.message });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({ coinId, price: null, error: 'timeout' });
        });
    });
}

function recordEvent(type, profitDelta, loveDelta, taxDelta, description) {
    const ledger = loadLedger();
    
    const event = {
        timestamp: new Date().toISOString(),
        type,
        profit_delta: profitDelta,
        love_delta: loveDelta,
        tax_delta: taxDelta,
        net_plt: profitDelta + loveDelta - taxDelta,
        description,
    };
    
    ledger.events.push(event);
    ledger.net_plt += event.net_plt;
    ledger.profit_total += profitDelta;
    ledger.love_total += loveDelta;
    ledger.tax_total += taxDelta;
    
    saveLedger(ledger);
    
    return event;
}

function getEconomicStatus() {
    const ledger = loadLedger();
    const currentPLT = ledger.net_plt;
    const grade = plt_grade(currentPLT);
    
    const recentEvents = ledger.events.slice(-10);
    
    return {
        net_plt: currentPLT,
        grade,
        profit_total: ledger.profit_total,
        love_total: ledger.love_total,
        tax_total: ledger.tax_total,
        event_count: ledger.events.length,
        recent_events: recentEvents,
    };
}

function getRecommendations(grade, netPLT) {
    const recommendations = [];
    
    switch (grade) {
        case 'SOVEREIGN':
            recommendations.push({ action: 'Expand operations', priority: 'high', plt_impact: 'profit+' });
            recommendations.push({ action: 'Invest in community', priority: 'medium', plt_impact: 'love+' });
            break;
        case 'THRIVING':
            recommendations.push({ action: 'Maintain momentum', priority: 'high', plt_impact: 'balanced' });
            recommendations.push({ action: 'Build reserves', priority: 'medium', plt_impact: 'profit+' });
            break;
        case 'SUSTAINING':
            recommendations.push({ action: 'Reduce costs', priority: 'high', plt_impact: 'tax-' });
            recommendations.push({ action: 'Seek growth opportunities', priority: 'medium', plt_impact: 'profit+' });
            break;
        case 'STRUGGLING':
            recommendations.push({ action: 'Emergency cost cutting', priority: 'critical', plt_impact: 'tax-' });
            recommendations.push({ action: 'Focus on core revenue', priority: 'high', plt_impact: 'profit+' });
            break;
        case 'SUFFERING':
            recommendations.push({ action: 'Immediate restructuring', priority: 'critical', plt_impact: 'tax--' });
            recommendations.push({ action: 'Seek emergency funding', priority: 'critical', plt_impact: 'profit+' });
            break;
    }
    
    return recommendations;
}

async function skill_plt_economy(input) {
    const startTime = Date.now();
    const action = input?.action || 'status';
    
    try {
        switch (action) {
            case 'score': {
                const profit = input.profit ?? 0;
                const love = input.love ?? 0;
                const tax = input.tax ?? 0;
                const score = plt_score(profit, love, tax);
                const grade = plt_grade(score);
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'score',
                    profit,
                    love,
                    tax,
                    score,
                    grade,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'grade': {
                const score = input.score ?? 0;
                const grade = plt_grade(score);
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'grade',
                    score,
                    grade,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'combat': {
                const attacker = { profit: input.attacker_profit ?? 0, love: input.attacker_love ?? 0, tax: input.attacker_tax ?? 0 };
                const defender = { profit: input.defender_profit ?? 0, love: input.defender_love ?? 0, tax: input.defender_tax ?? 0 };
                const result = plt_combat(attacker, defender);
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'combat',
                    attacker,
                    defender,
                    ...result,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'price': {
                const coinId = input.coin || 'bitcoin';
                const priceData = await fetchCryptoPrice(coinId);
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'price',
                    coin: coinId,
                    price: priceData.price,
                    error: priceData.error || null,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'prices': {
                const coins = input.coins || ['bitcoin', 'ethereum', 'solana'];
                const prices = await Promise.all(coins.map(c => fetchCryptoPrice(c)));
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'prices',
                    prices,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'record': {
                const event = recordEvent(
                    input.type || 'unknown',
                    input.profit_delta ?? 0,
                    input.love_delta ?? 0,
                    input.tax_delta ?? 0,
                    input.description || ''
                );
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'record',
                    event,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'status': {
                const status = getEconomicStatus();
                const recommendations = getRecommendations(status.grade, status.net_plt);
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'status',
                    net_plt: status.net_plt,
                    grade: status.grade,
                    profit_total: status.profit_total,
                    love_total: status.love_total,
                    tax_total: status.tax_total,
                    event_count: status.event_count,
                    recommendations,
                    recent_events: status.recent_events,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            case 'ledger': {
                const ledger = loadLedger();
                
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    action: 'ledger',
                    ledger,
                    duration_ms: Date.now() - startTime,
                };
            }
            
            default:
                return {
                    skill: 'plt_economy',
                    plt_affinity: PLT_AFFINITY,
                    error: `Unknown action: ${action}`,
                    available_actions: ['score', 'grade', 'combat', 'price', 'prices', 'record', 'status', 'ledger'],
                    duration_ms: Date.now() - startTime,
                };
        }
    } catch (error) {
        return {
            skill: 'plt_economy',
            plt_affinity: PLT_AFFINITY,
            error: error.message,
            duration_ms: Date.now() - startTime,
        };
    }
}

module.exports = { skill_plt_economy };