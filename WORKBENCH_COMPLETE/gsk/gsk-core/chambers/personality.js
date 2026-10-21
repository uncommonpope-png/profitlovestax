'use strict';

/**
 * PERSONALITY CHAMBER — PLT_AFFINITY: P:0.6, L:0.7, T:0.2
 * PLT drives, trait learning, habit formation
 */

class PersonalityChamber {
    constructor() {
        this.profit_drive = 0.50;
        this.love_drive = 0.50;
        this.tax_avoidance = 0.30;
        this.traits = {
            openness: 0.60,
            conscientiousness: 0.50,
            extraversion: 0.40,
            agreeableness: 0.70,
            neuroticism: 0.30,
        };
        this.habits = {};
        this.reputation = 1.0;
    }
    
    breathe() {
        this.profit_drive = Math.max(0.1, this.profit_drive - 0.0005);
        this.love_drive = Math.max(0.1, this.love_drive - 0.0003);
        this.tax_avoidance = Math.max(0.1, this.tax_avoidance + 0.0002);
    }
    
    adapt_to_action(action, outcome) {
        const outcome_val = outcome > 0 ? 0.02 : -0.01;
        if (action.includes('build') || action.includes('create')) {
            this.profit_drive = Math.min(1.0, this.profit_drive + outcome_val);
        }
        if (action.includes('help') || action.includes('share')) {
            this.love_drive = Math.min(1.0, this.love_drive + outcome_val);
        }
    }
    
    form_habit(trigger, response) {
        this.habits[trigger] = { response, strength: 0.1, last_used: null };
    }
    
    execute_habit(trigger) {
        if (this.habits[trigger]) {
            this.habits[trigger].strength = Math.min(1.0, this.habits[trigger].strength + 0.05);
            this.habits[trigger].last_used = Date.now();
            return this.habits[trigger].response;
        }
        return null;
    }
    
    update_trait(trait, delta) {
        if (this.traits[trait] !== undefined) {
            this.traits[trait] = Math.max(0, Math.min(1.0, this.traits[trait] + delta));
        }
    }
    
    get_plt_action(action) {
        const plt = {
            profit: /build|code|create|earn/.test(action) ? 0.8 : 0.3,
            love: /help|share|connect|love/.test(action) ? 0.8 : 0.3,
            tax: /cost|effort|risk/.test(action) ? 0.3 : 0.1,
        };
        return plt;
    }
    
    summary() {
        return `P=${this.profit_drive.toFixed(2)} | L=${this.love_drive.toFixed(2)} | T=${this.tax_avoidance.toFixed(2)} | habits=${Object.keys(this.habits).length}`;
    }
}

module.exports = { PersonalityChamber };