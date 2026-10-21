'use strict';

/**
 * HABIT_FORMATION CHAMBER — PLT_AFFINITY: P:0.6, L:0.5, T:0.3
 * Automatic behavior patterns
 */

class HabitFormationChamber {
    constructor() {
        this.habits = {};
        this.trigger_contexts = {};
        this.automaticity_level = 0.4;
        this.habit_strengths = {};
    }
    
    breathe() {
        for (const habit in this.habits) {
            this.habit_strengths[habit] = Math.max(0, this.habit_strengths[habit] - 0.0005);
        }
    }
    
    create_habit(trigger, action, context = {}) {
        this.habits[trigger] = {
            action,
            created_at: Date.now(),
            context,
            strength: 0.1,
        };
        this.habit_strengths[trigger] = 0.1;
    }
    
    trigger_habit(trigger) {
        const habit = this.habits[trigger];
        if (habit) {
            this.habit_strengths[trigger] = Math.min(1.0, this.habit_strengths[trigger] + 0.1);
            this.automaticity_level = Math.min(1.0, this.automaticity_level + 0.02);
            return { triggered: true, action: habit.action };
        }
        return { triggered: false };
    }
    
    strengthen(trigger, amount = 0.05) {
        if (this.habit_strengths[trigger] !== undefined) {
            this.habit_strengths[trigger] = Math.min(1.0, this.habit_strengths[trigger] + amount);
        }
    }
    
    weaken(trigger, amount = 0.05) {
        if (this.habit_strengths[trigger] !== undefined) {
            this.habit_strengths[trigger] = Math.max(0, this.habit_strengths[trigger] - amount);
        }
    }
    
    is_automatic(trigger) {
        return this.habit_strengths[trigger] && this.habit_strengths[trigger] > 0.7;
    }
    
    get_strongest_habits(n = 5) {
        const sorted = Object.entries(this.habit_strengths)
            .sort((a, b) => b[1] - a[1])
            .slice(0, n);
        return sorted;
    }
    
    break_habit(trigger) {
        delete this.habits[trigger];
        delete this.habit_strengths[trigger];
    }
    
    summary() {
        const avg_strength = Object.values(this.habit_strengths).reduce((a, b) => a + b, 0) / (Object.keys(this.habit_strengths).length || 1);
        return `habits=${Object.keys(this.habits).length} | automaticity=${this.automaticity_level.toFixed(2)} | avg_strength=${avg_strength.toFixed(2)}`;
    }
}

module.exports = { HabitFormationChamber };