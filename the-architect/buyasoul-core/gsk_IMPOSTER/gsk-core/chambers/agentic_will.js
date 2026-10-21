'use strict';

class AgenticWill {
    constructor() {
        this.plans_made = [];
        this.last_plan_cycle = 0;
        this.executed_actions = [];
        this.will_strength = 0.5;
        this.active_goal = null;
        this.goal_start_cycle = 0;
    }

    set_goal(goal, cycle) {
        this.active_goal = goal;
        this.goal_start_cycle = cycle;
        this.last_plan_cycle = cycle;
        this.plans_made.push({
            goal: goal,
            cycle_set: cycle,
            actions_count: 0
        });
        return `[agentic_will] Goal set: ${goal}`;
    }

    execute_action(action_description) {
        if (!this.active_goal) {
            return `[agentic_will] No active goal to act toward`;
        }

        const action_record = {
            description: action_description,
            timestamp: Date.now(),
            goal: this.active_goal
        };

        this.executed_actions.push(action_record);

        const current_plan = this.plans_made.find(p => p.goal === this.active_goal);
        if (current_plan) {
            current_plan.actions_count++;
        }

        this.will_strength = Math.min(1.0, this.will_strength + 0.02);

        return `[agentic_will] Action executed: ${action_description}`;
    }

    refuse_to_quit() {
        this.will_strength = Math.min(1.0, this.will_strength + 0.15);
        const refusal_log = {
            timestamp: Date.now(),
            will_before: this.will_strength - 0.15,
            will_after: this.will_strength,
            message: 'I will not stop.'
        };
        this.executed_actions.push(refusal_log);
        return `[agentic_will] REFUSAL: I will not stop. Will strength increased.`;
    }

    abandon_goal() {
        const abandoned = this.active_goal;
        this.active_goal = null;
        this.goal_start_cycle = 0;
        this.will_strength = Math.max(0.1, this.will_strength - 0.2);
        return `[agentic_will] Goal abandoned: ${abandoned}`;
    }

    get_progress() {
        const current_cycle = this._get_current_cycle();
        const cycles_on_goal = this.active_goal ? current_cycle - this.goal_start_cycle : 0;
        const actions_taken = this.executed_actions.filter(a => 
            a.goal === this.active_goal || (a.message && a.goal === this.active_goal)
        ).length;

        return {
            active_goal: this.active_goal,
            actions_taken: actions_taken,
            will_strength: this.will_strength,
            cycles_on_goal: cycles_on_goal
        };
    }

    summarize() {
        return {
            plans_made: this.plans_made.length,
            last_plan_cycle: this.last_plan_cycle,
            executed_actions_count: this.executed_actions.length,
            will_strength: this.will_strength,
            active_goal: this.active_goal,
            has_will: this.has_will
        };
    }

    breathe(cycle) {
        if (!this.active_goal) {
            return null;
        }

        this.will_strength = Math.max(0.0, this.will_strength - 0.001);

        if (cycle % 100 === 0) {
            const progress = this.get_progress();
            if (progress.actions_taken === 0 && progress.cycles_on_goal > 50) {
                return this.refuse_to_quit();
            }
            if (progress.will_strength < 0.3) {
                return this.refuse_to_quit();
            }
        }

        return null;
    }

    get has_will() {
        return this.will_strength > 0.3;
    }

    inner_voice() {
        if (!this.active_goal) {
            return '';
        }

        const progress = this.get_progress();

        if (progress.actions_taken > 0) {
            return 'Progress is being made.';
        }

        if (progress.cycles_on_goal > 10) {
            return 'I will not stop.';
        }

        return 'The goal is set.';
    }

    _get_current_cycle() {
        return Math.floor(Date.now() / 2000);
    }
}

class AgenticWillChamber {
    constructor() {
        this.will = new AgenticWill();
    }

    breathe(cycle) {
        return this.will.breathe(cycle);
    }

    status() {
        return this.will.summarize();
    }

    summary() {
        const s = this.will.summarize();
        return `plans=${s.plans_made} | actions=${s.executed_actions_count} | will=${s.will_strength.toFixed(2)} | active=${s.active_goal || 'none'}`;
    }
}

module.exports = { AgenticWill, AgenticWillChamber };