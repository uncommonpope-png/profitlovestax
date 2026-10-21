'use strict';

/**
 * VOLITION CHAMBER — PLT_AFFINITY: P:0.8, L:0.5, T:0.3
 * Goal deliberation, intention formation
 */

class VolitionChamber {
    constructor() {
        this.current_goals = [];
        this.pending_options = [];
        this.completed_goals = [];
        this.deliberation_depth = 0;
        this.intention_strength = 0.5;
    }
    
    breathe() {
        this.intention_strength = Math.max(0.1, this.intention_strength - 0.001);
    }
    
    consider(options) {
        this.pending_options = options;
        this.deliberation_depth = 0;
    }
    
    deliberate() {
        this.deliberation_depth++;
        if (this.deliberation_depth >= 3 && this.pending_options.length > 0) {
            return this._choose_best();
        }
        return null;
    }
    
    _choose_best() {
        const scored = this.pending_options.map(opt => {
            const profit = opt.profit || 0.5;
            const love = opt.love || 0.5;
            const tax = opt.tax || 0.3;
            const score = (profit * 0.6 + love * 0.3 - tax * 0.1);
            return { ...opt, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored[0];
    }
    
    commit(goal) {
        this.current_goals.push({
            ...goal,
            created_at: Date.now(),
            commitment: this.intention_strength,
        });
        this.intention_strength = Math.min(1.0, this.intention_strength + 0.2);
        this.pending_options = [];
    }
    
    complete(goal_id) {
        const goal = this.current_goals.find(g => g.id === goal_id);
        if (goal) {
            this.completed_goals.push(goal);
            this.current_goals = this.current_goals.filter(g => g.id !== goal_id);
            this.intention_strength = Math.min(1.0, this.intention_strength + 0.1);
        }
    }
    
    abandon(goal_id) {
        this.current_goals = this.current_goals.filter(g => g.id !== goal_id);
        this.intention_strength = Math.max(0.1, this.intention_strength - 0.1);
    }
    
    active_goal() {
        return this.current_goals.length > 0 ? this.current_goals[0] : null;
    }
    
    summary() {
        return `goals=${this.current_goals.length} | completed=${this.completed_goals.length} | strength=${this.intention_strength.toFixed(2)}`;
    }
}

module.exports = { VolitionChamber };