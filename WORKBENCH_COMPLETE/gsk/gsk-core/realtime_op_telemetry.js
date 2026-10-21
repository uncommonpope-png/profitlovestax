const fs = require('fs');
const path = require('path');

function calculatePLT(profit, love, tax) {
  return profit + love - tax;
}

function processTelemetryCycle(cycleData) {
  const profit = cycleData.profit || 1.0;
  const love = cycleData.love || 0.8;
  const tax = cycleData.tax || 0.2;
  const pltScore = calculatePLT(profit, love, tax);
  return {
    timestamp: Date.now(),
    cycleId: cycleData.cycleId || `cycle_${Date.now()}`,
    profit,
    love,
    tax,
    pltScore,
    status: pltScore > 0 ? 'OPTIMIZED' : 'SUBOPTIMAL'
  };
}

module.exports = { calculatePLT, processTelemetryCycle };
