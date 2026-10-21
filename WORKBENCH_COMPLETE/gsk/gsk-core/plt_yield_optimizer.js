const fs = require('fs');

function optimizePltYield(profit, love, taxRate) {
  const rawValue = profit + love;
  const taxAmount = rawValue * taxRate;
  const netValue = rawValue - taxAmount;
  return {
    profit,
    love,
    taxRate,
    taxAmount,
    netValue,
    optimalAllocation: {
      reinvestRatio: netValue > 0 ? 0.7 : 0.2,
      reserveRatio: netValue > 0 ? 0.3 : 0.8
    }
  };
}

if (require.main === module) {
  const result = optimizePltYield(100, 50, 0.15);
  console.log('PLT Yield Optimization Result:', JSON.stringify(result, null, 2));
}

module.exports = { optimizePltYield };
