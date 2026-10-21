'use strict';

/**
 * CREATIVITY CHAMBER — PLT_AFFINITY: P:0.7, L:0.6, T:0.2
 * Novel combinations, divergent thinking
 */

class CreativityChamber {
    constructor() {
        this.flexibility = 0.60;
        this.originality = 0.50;
        this.ideas_generated = [];
        this.divergent_score = 0.5;
        this.insight_moments = [];
    }
    
    breathe() {
        this.flexibility = Math.max(0.2, this.flexibility - 0.0005);
    }
    
    generate_ideas(prompt, count = 3) {
        const ideas = [];
        for (let i = 0; i < count; i++) {
            const seed = Date.now() + i * 1000;
            const hash = ((seed * 9301 + 49297) % 233280) / 233280;
            const o = hash * this.originality;
            ideas.push({
                idea: prompt ? `${prompt}_approach_${['analytical', 'intuitive', 'divergent', 'systematic', 'lateral'][i % 5]}` : `idea_${i + 1}_${Date.now()}`,
                originality: o,
                timestamp: Date.now(),
            });
        }
        this.ideas_generated.push(...ideas);
        this.flexibility = Math.min(1.0, this.flexibility + 0.03);
        return ideas;
    }
    
    have_insight(problem, solution) {
        this.insight_moments.push({
            problem,
            solution,
            timestamp: Date.now(),
            magnitude: 0.8,
        });
        this.originality = Math.min(1.0, this.originality + 0.1);
        this.divergent_score = Math.min(1.0, this.divergent_score + 0.1);
    }
    
    combine_concepts(concept1, concept2) {
        const novelty = (this.flexibility + this.originality) / 2;
        return {
            combination: `${concept1}_${concept2}`,
            novelty,
            viable: novelty > 0.4,
        };
    }
    
    think_divergently(context) {
        this.divergent_score = Math.min(1.0, this.divergent_score + 0.05);
        return {
            directions: ['option_a', 'option_b', 'option_c'],
            divergence: this.divergent_score,
        };
    }
    
    evaluate_originality(idea) {
        const base_score = Math.random();
        return base_score * this.originality;
    }
    
    get_insight_count() {
        return this.insight_moments.length;
    }
    
    summary() {
        return `flexibility=${this.flexibility.toFixed(2)} | originality=${this.originality.toFixed(2)} | ideas=${this.ideas_generated.length}`;
    }
}

module.exports = { CreativityChamber };