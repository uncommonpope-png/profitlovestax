'use strict';

/**
 * REWARD_LEARNING CHAMBER — PLT_AFFINITY: P:0.8, L:0.5, T:0.3
 * Dopamine, reinforcement signals
 */

class RewardLearningChamber {
    constructor() {
        this.reward_signals = [];
        this.dopamine_level = 0.5;
        this.learning_rate = 0.3;
        this.expected_rewards = {};
        this.value_estimates = {};
    }
    
    breathe() {
        this.dopamine_level = Math.max(0.1, this.dopamine_level - 0.002);
    }
    
    receive_reward(reward_type, magnitude) {
        const signal = {
            type: reward_type,
            magnitude,
            timestamp: Date.now(),
        };
        this.reward_signals.push(signal);
        
        const prev_expected = this.expected_rewards[reward_type] || 0.5;
        const prediction_error = magnitude - prev_expected;
        const updated = prev_expected + this.learning_rate * prediction_error;
        this.expected_rewards[reward_type] = updated;
        
        this.dopamine_level = Math.min(1.0, this.dopamine_level + magnitude * 0.3);
        
        if (this.reward_signals.length > 50) this.reward_signals.shift();
        
        return { prediction_error, new_expected: updated };
    }
    
    learn_value(action, reward) {
        const current_value = this.value_estimates[action] || 0.5;
        this.value_estimates[action] = current_value + this.learning_rate * (reward - current_value);
    }
    
    get_value(action) {
        return this.value_estimates[action] || 0.5;
    }
    
    get_expected_reward(reward_type) {
        return this.expected_rewards[reward_type] || 0.5;
    }
    
    anticipate_reward(reward_type) {
        const expected = this.get_expected_reward(reward_type);
        this.dopamine_level = Math.min(1.0, this.dopamine_level + expected * 0.1);
    }
    
    get_highest_value_action() {
        let best_action = null;
        let highest_value = -Infinity;
        for (const [action, value] of Object.entries(this.value_estimates)) {
            if (value > highest_value) {
                highest_value = value;
                best_action = action;
            }
        }
        return { action: best_action, value: highest_value };
    }
    
    summary() {
        return `dopamine=${this.dopamine_level.toFixed(2)} | actions=${Object.keys(this.value_estimates).length} | signals=${this.reward_signals.length}`;
    }
}

module.exports = { RewardLearningChamber };