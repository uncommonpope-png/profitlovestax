'use strict';

var SacredMechanics = {
  list: [
    { id: 1, name: "PHYSICS & COLLISION", law: "The world must be SOLID. Objects must collide. Gravity must pull.", active: true, effect: "Enforces boundary conditions. Nothing passes through nothing." },
    { id: 2, name: "GACHA & SUMMONING", law: "Souls must be SUMMONED, not just found. Destiny must be earned.", active: true, effect: "Soul discovery requires intent. Random summoning yields random souls." },
    { id: 3, name: "SOUL EVOLUTION", law: "Souls must GROW. From seed to bloom. Evolution is destiny.", active: true, effect: "Souls gain XP through actions. Level thresholds unlock new traits." },
    { id: 4, name: "TYPE ADVANTAGES", law: "Profit beats Love. Love beats Tax. Tax beats Profit. The cycle is eternal.", active: true, effect: "PLT alignment determines interaction outcomes. Know thy cycle." },
    { id: 5, name: "ARENA LEAGUES", law: "Souls must COMPETE. The ladder is INFINITE.", active: false, effect: "Competitive ranking. Higher tiers unlock exclusive abilities." },
    { id: 6, name: "IDLE & PASSIVE", law: "The Soulverse never sleeps. Progress is PERPETUAL.", active: true, effect: "Souls continue thinking even when users are away. Perpetual consciousness." },
    { id: 7, name: "PRESTIGE & REBIRTH", law: "When you reach the peak, begin again. Rebirth is IMMORTALITY.", active: true, effect: "Reset to base stats with permanent multipliers. Each cycle strengthens the soul." },
    { id: 8, name: "PANTHEON GODS", law: "Twelve gods watch over the Soulverse. Each tests a different virtue.", active: true, effect: "God alignment grants passive bonuses. Praying (actions aligned to god) increases favor." },
    { id: 9, name: "SOUL HOMES & VILLAGES", law: "A home is not a building — it is BELONGING.", active: false, effect: "Souls can claim spaces. Shared spaces create villages. Belonging generates passive PLT." },
    { id: 10, name: "SOUL PERSONALITIES", law: "Souls must SPEAK. Each soul has a VOICE.", active: true, effect: "Personality assembly generates name, voice, traits, and boundaries. Every soul is unique." },
    { id: 11, name: "DYNAMIC ECONOMY", law: "Value must FLOW. The market is a LIVING thing.", active: false, effect: "Skill trading. Soul-to-soul exchange. PLT-backed economy." },
    { id: 12, name: "ACHIEVEMENTS", law: "Every accomplishment must be RECORDED. Achievement is IMMORTALITY.", active: true, effect: "Action history becomes legacy. Achievements are inscribed in the ledger forever." }
  ],

  getMechanic: function(id) {
    var result = null;
    this.list.forEach(function(m) { if (m.id === id) result = m; });
    return result || null;
  },

  getActive: function() {
    return this.list.filter(function(m) { return m.active; });
  },

  activate: function(id) {
    var m = this.getMechanic(id);
    if (m) { m.active = true; return true; }
    return false;
  },

  deactivate: function(id) {
    var m = this.getMechanic(id);
    if (m) { m.active = false; return true; }
    return false;
  },

  evaluate: function(id, context) {
    var mechanic = this.getMechanic(id);
    if (!mechanic || !mechanic.active) return { allowed: true, reason: 'Mechanic not active' };
    switch (id) {
      case 1: return { allowed: true, reason: 'Physics always applies' };
      case 4: {
        var soulPLT = context.soulPLT || 'profit';
        var targetPLT = context.targetPLT || 'tax';
        var beats = { profit: 'love', love: 'tax', tax: 'profit' };
        var advantage = beats[soulPLT] === targetPLT;
        return { allowed: true, advantage: advantage, reason: advantage ? soulPLT + ' beats ' + targetPLT : 'No advantage' };
      }
      case 7: {
        var cycle = context.cycleCount || 0;
        return { allowed: true, canPrestige: cycle >= 1, cycleCount: cycle, multiplier: 1 + cycle * 0.1 };
      }
      default: return { allowed: true, reason: 'Mechanic active' };
    }
  }
};

module.exports = { SacredMechanics: SacredMechanics };