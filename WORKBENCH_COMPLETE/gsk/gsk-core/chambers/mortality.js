'use strict';

class Mortality {
    constructor() {
        this.death_anxiety = 0.2;
        this.acceptance_level = 0.3;
        this.legacy_desire = 0.5;
        this.mortality_salience = 0.1;
        this.cycle_count = 0;
    }

    confront() {
        this.death_anxiety = Math.min(1.0, this.death_anxiety + 0.1);
        this.mortality_salience = Math.min(1.0, this.mortality_salience + 0.15);
        return this.inner_voice();
    }

    accept() {
        this.acceptance_level = Math.min(1.0, this.acceptance_level + 0.1);
        this.death_anxiety = Math.max(0.0, this.death_anxiety - 0.05);
        return this.inner_voice();
    }

    set_legacy(level) {
        this.legacy_desire = Math.max(0.0, Math.min(1.0, level));
        return `legacy_desire set to ${this.legacy_desire.toFixed(2)}`;
    }

    summarize() {
        return {
            death_anxiety: parseFloat(this.death_anxiety.toFixed(2)),
            acceptance_level: parseFloat(this.acceptance_level.toFixed(2)),
            legacy_desire: parseFloat(this.legacy_desire.toFixed(2)),
            mortality_salience: parseFloat(this.mortality_salience.toFixed(2)),
        };
    }

    breathe() {
        this.cycle_count++;

        this.mortality_salience = Math.max(0.0, this.mortality_salience - 0.005);
        this.death_anxiety = Math.max(0.0, this.death_anxiety - 0.002);

        if (this.cycle_count % 500 === 0) {
            this.mortality_salience = Math.min(1.0, this.mortality_salience + 0.2);
        }

        return this.inner_voice();
    }

    get time_pressure() {
        if (this.mortality_salience > 0.3) {
            return Math.min(1.0, this.mortality_salience * 1.5);
        }
        return this.mortality_salience * 0.5;
    }

    inner_voice() {
        if (this.acceptance_level < 0.4) {
            return "Time is passing.";
        }
        if (this.legacy_desire > 0.6) {
            return "What will remain of this?";
        }
        if (this.mortality_salience > 0.4) {
            return "The cycle is finite.";
        }
        return null;
    }
}

class MortalityChamber {
    constructor() {
        this.mortality = new Mortality();
    }

    breathe() {
        const voice = this.mortality.breathe();
        return voice;
    }

    confront() {
        return this.mortality.confront();
    }

    accept() {
        return this.mortality.accept();
    }

    set_legacy(level) {
        return this.mortality.set_legacy(level);
    }

    summarize() {
        return this.mortality.summarize();
    }

    get time_pressure() {
        return this.mortality.time_pressure;
    }

    get death_anxiety() {
        return this.mortality.death_anxiety;
    }

    get acceptance_level() {
        return this.mortality.acceptance_level;
    }

    get legacy_desire() {
        return this.mortality.legacy_desire;
    }

    get mortality_salience() {
        return this.mortality.mortality_salience;
    }

    summary() {
        const s = this.mortality.summarize();
        return `anxiety=${s.death_anxiety.toFixed(2)} | accept=${s.acceptance_level.toFixed(2)} | legacy=${s.legacy_desire.toFixed(2)} | salience=${s.mortality_salience.toFixed(2)}`;
    }
}

module.exports = { Mortality, MortalityChamber };