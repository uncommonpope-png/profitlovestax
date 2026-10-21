'use strict';

/**
 * CURIOSITY CHAMBER — PLT_AFFINITY: P:0.6, L:0.7, T:0.2
 * Information seeking, exploration drive
 */

class CuriosityChamber {
    constructor() {
        this.drive = 0.50;
        this.questions_asked = [];
        this.knowledge_gaps = [];
        this.exploration_patterns = [];
        this.information_desire = 0.6;
    }
    
    breathe() {
        this.drive = Math.max(0.1, this.drive - 0.0005);
    }
    
    feel_curious_about(topic) {
        this.drive = Math.min(1.0, this.drive + 0.08);
        this.questions_asked.push({
            topic,
            asked_at: Date.now(),
            intensity: this.drive,
        });
    }
    
    identify_gap(knowledge_area) {
        this.knowledge_gaps.push({
            area: knowledge_area,
            urgency: 0.5,
            identified_at: Date.now(),
        });
        this.information_desire = Math.min(1.0, this.information_desire + 0.05);
    }
    
    satisfy_curiosity(knowledge_area) {
        this.knowledge_gaps = this.knowledge_gaps.filter(g => g.area !== knowledge_area);
        this.drive = Math.max(0.2, this.drive - 0.1);
    }
    
    explore() {
        this.exploration_patterns.push({
            timestamp: Date.now(),
            drive: this.drive,
        });
        return { exploring: true, drive: this.drive };
    }
    
    get_urgent_gap() {
        if (this.knowledge_gaps.length === 0) return null;
        const sorted = [...this.knowledge_gaps].sort((a, b) => b.urgency - a.urgency);
        return sorted[0];
    }
    
    boost_drive(amount = 0.1) {
        this.drive = Math.min(1.0, this.drive + amount);
    }
    
    is_curious() {
        return this.drive > 0.4;
    }
    
    summary() {
        return `drive=${this.drive.toFixed(2)} | gaps=${this.knowledge_gaps.length} | desire=${this.information_desire.toFixed(2)}`;
    }
}

module.exports = { CuriosityChamber };