/**
 * PLT Functional Basis vs Net Value Contribution Engine
 * Compares functional basis weight against net PLT value (Profit + Love - Tax) across modules.
 */
class PLTFunctionalBasisEngine {
  constructor(modules = []) {
    this.modules = modules;
  }

  addModule(name, functionalBasis, profit, love, tax) {
    const netValue = profit + love - tax;
    const efficiencyRatio = functionalBasis > 0 ? netValue / functionalBasis : 0;
    const record = {
      name,
      functionalBasis,
      profit,
      love,
      tax,
      netValue,
      efficiencyRatio
    };
    this.modules.push(record);
    return record;
  }

  evaluateComparison() {
    return this.modules.map(mod => ({
      module: mod.name,
      functionalBasis: mod.functionalBasis,
      netValueContribution: mod.netValue,
      efficiencyRatio: Number(mod.efficiencyRatio.toFixed(4)),
      status: mod.netValue >= mod.functionalBasis ? 'OPTIMAL' : 'UNDERPERFORMING'
    }));
  }
}

module.exports = { PLTFunctionalBasisEngine };
