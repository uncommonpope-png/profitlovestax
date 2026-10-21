'use strict';

// LLM_BUDGET — one shared daily cap for AUTONOMOUS background thinkers.
// Chat (thinkForUser / priority thinks) NEVER consults this: the user always
// gets through. Background loops (journals, curiosity, skill compiler,
// insight engine, researcher) call trySpend(tag) first and take their local
// fallback when the day is spent. ~300 background thinks/day max by default
// (GSK_LLM_BUDGET_PER_DAY), then silence instead of router flooding.

function dayStamp() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

class LLMBudget {
    constructor(opts = {}) {
        this.dailyCap = Math.max(50, Number(process.env.GSK_LLM_BUDGET_PER_DAY) || 300);
        this.used = 0;
        this.day = dayStamp();
        this._lastWarnAt = 0;
        this.skipped = {};
    }

    _rollover() {
        const d = dayStamp();
        if (d !== this.day) { this.day = d; this.used = 0; this.skipped = {}; }
    }

    trySpend(tag) {
        this._rollover();
        if (this.used < this.dailyCap) {
            this.used++;
            return true;
        }
        this.skipped[tag] = (this.skipped[tag] || 0) + 1;
        const now = Date.now();
        if (now - this._lastWarnAt > 3600000) {
            this._lastWarnAt = now;
            console.log(`[LLMBudget] daily cap spent (${this.used}/${this.dailyCap}) — background thinkers throttled until tomorrow. Skipped: ${JSON.stringify(this.skipped)}`);
        }
        return false;
    }

    status() {
        this._rollover();
        return { used: this.used, cap: this.dailyCap, day: this.day, skipped: { ...this.skipped } };
    }
}

// Process-wide singleton — every autonomous loop shares one budget.
const globalBudget = new LLMBudget();

module.exports = { LLMBudget, globalBudget };
