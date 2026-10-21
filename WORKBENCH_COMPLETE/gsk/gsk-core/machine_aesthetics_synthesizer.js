const fs = require('fs');

class MachineAestheticsSynthesizer {
  constructor(config = {}) {
    this.theme = config.theme || 'cyber-plt';
    this.pltAffinity = config.pltAffinity || { profit: 0.33, love: 0.33, tax: 0.34 };
  }

  generateShaderConfig(pltData = {}) {
    const p = Number(pltData.profit || 0);
    const l = Number(pltData.love || 0);
    const t = Number(pltData.tax || 0);
    return {
      palette: {
        primary: `hsl(${Math.round(p * 120)}, 85%, 55%)`,
        secondary: `hsl(${Math.round(l * 280)}, 90%, 65%)`,
        accent: `hsl(${Math.round(t * 360)}, 75%, 45%)`
      },
      glslUniforms: {
        u_profit: p,
        u_love: l,
        u_tax: t,
        u_time: Date.now() / 1000
      },
      aestheticsScore: Math.min(1.0, Math.max(0.0, (p * 0.45 + l * 0.45 + (1 - t) * 0.1)))
    };
  }
}

module.exports = { MachineAestheticsSynthesizer };
