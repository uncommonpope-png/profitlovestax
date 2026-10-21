'use strict';

/**
 * INTENTIONALITY CHAMBER — PLT_AFFINITY: P:0.7, L:0.5, T:0.2
 * Aboutness, goal-directedness
 */

class IntentionalityChamber {
    constructor() {
        this.intentional_objects = {};
        this.aboutness_level = 0.60;
        this.goal_directed_actions = 0;
        this.intentional_state = 'neutral';
    }
    
    breathe() {
        this.aboutness_level = Math.max(0.2, this.aboutness_level - 0.0003);
    }
    
    be_about(target, state = 'active') {
        this.intentional_objects[target] = {
            state,
            since: Date.now(),
            intensity: this.aboutness_level,
        };
        this.aboutness_level = Math.min(1.0, this.aboutness_level + 0.1);
    }
    
    focus_on(target) {
        this.intentional_state = 'focused';
        this.aboutness_level = Math.min(1.0, this.aboutness_level + 0.15);
    }
    
    shift_intention(from, to) {
        if (this.intentional_objects[from]) {
            this.intentional_objects[from].state = 'abandoned';
        }
        this.be_about(to, 'active');
    }
    
    execute_goal_directed(action) {
        this.goal_directed_actions++;
        this.aboutness_level = Math.min(1.0, this.aboutness_level + 0.05);
        return { action, goal_oriented: true };
    }
    
    get_current_intention() {
        for (const [target, data] of Object.entries(this.intentional_objects)) {
            if (data.state === 'active') {
                return target;
            }
        }
        return null;
    }
    
    has_intention(target) {
        return this.intentional_objects[target] !== undefined;
    }
    
    abandon_intention(target) {
        if (this.intentional_objects[target]) {
            this.intentional_objects[target].state = 'abandoned';
            this.aboutness_level = Math.max(0.1, this.aboutness_level - 0.1);
        }
    }
    
    summary() {
        return `aboutness=${this.aboutness_level.toFixed(2)} | state=${this.intentional_state} | actions=${this.goal_directed_actions}`;
    }
}

module.exports = { IntentionalityChamber };