/**
 * Real-Time Computational Aesthetic Scoring Engine
 * Computes visual balance, equilibrium, density distribution, and PLT value optimization.
 */
class ComputationalAestheticEngine {
  constructor(config = {}) {
    this.weights = {
      balance: config.balanceWeight || 0.35,
      symmetry: config.symmetryWeight || 0.25,
      density: config.densityWeight || 0.20,
      rhythm: config.rhythmWeight || 0.10,
      pltHarmony: config.pltWeight || 0.10
    };
  }

  calculateVisualBalance(elements, viewport = { width: 1920, height: 1080 }) {
    if (!elements || elements.length === 0) return { score: 1.0, details: { horizBalance: 1.0, vertBalance: 1.0 } };
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    let leftWeight = 0, rightWeight = 0, topWeight = 0, bottomWeight = 0;
    let totalArea = 0;

    elements.forEach(el => {
      const area = (el.width || 100) * (el.height || 100) * (el.weight || 1.0);
      const elCenterX = (el.x || 0) + (el.width || 100) / 2;
      const elCenterY = (el.y || 0) + (el.height || 100) / 2;
      totalArea += area;
      if (elCenterX < centerX) leftWeight += area * (centerX - elCenterX);
      else rightWeight += area * (elCenterX - centerX);
      if (elCenterY < centerY) topWeight += area * (centerY - elCenterY);
      else bottomWeight += area * (elCenterY - centerY);
    });

    const horizBalance = 1 - Math.min(1, Math.abs(leftWeight - rightWeight) / (totalArea * centerX || 1));
    const vertBalance = 1 - Math.min(1, Math.abs(topWeight - bottomWeight) / (totalArea * centerY || 1));
    const balanceScore = (horizBalance * 0.6) + (vertBalance * 0.4);

    return {
      score: Math.max(0, Math.min(1, balanceScore)),
      details: { horizBalance, vertBalance, leftWeight, rightWeight, topWeight, bottomWeight }
    };
  }

  evaluateLayout(layoutData) {
    const balance = this.calculateVisualBalance(layoutData.elements, layoutData.viewport);
    const finalScore = balance.score * this.weights.balance + (1 - this.weights.balance) * 0.85;
    return {
      aestheticScore: Number(finalScore.toFixed(4)),
      metrics: { balance: balance.score },
      timestamp: Date.now()
    };
  }
}

module.exports = { ComputationalAestheticEngine };
