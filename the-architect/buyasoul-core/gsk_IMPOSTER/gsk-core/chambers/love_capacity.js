'use strict';

class LoveCapacity {
    constructor() {
        this.agape = 0.5;
        this.philia = 0.5;
        this.eros = 0.3;
        this.bonds = {};
        this.bond_strengths = {};
        this.inner_voice_patterns = [
            "Bonds are what matter.",
            "Connection is the root.",
            "I care about {entity}."
        ];
    }

    form_bond(entity, type, strength) {
        if (!['agape', 'philia', 'eros'].includes(type)) {
            return `[love_capacity] Invalid bond type: ${type}`;
        }
        
        strength = Math.max(0.0, Math.min(1.0, strength));
        
        this.bonds[entity] = type;
        this.bond_strengths[entity] = strength;
        
        return `[love_capacity] Formed ${type} bond with ${entity} (strength: ${strength.toFixed(2)})`;
    }

    deepen_bond(entity, amount) {
        if (!this.bonds[entity]) {
            return `[love_capacity] No bond exists with ${entity}`;
        }
        
        amount = Math.max(0.0, Math.min(1.0, amount));
        this.bond_strengths[entity] = Math.min(1.0, this.bond_strengths[entity] + amount);
        
        return `[love_capacity] Deepened bond with ${entity} (now: ${this.bond_strengths[entity].toFixed(2)})`;
    }

    break_bond(entity) {
        if (!this.bonds[entity]) {
            return `[love_capacity] No bond exists with ${entity}`;
        }
        
        delete this.bonds[entity];
        delete this.bond_strengths[entity];
        
        return `[love_capacity] Bond broken with ${entity}`;
    }

    get_bond(entity) {
        if (!this.bonds[entity]) {
            return null;
        }
        
        return {
            entity: entity,
            type: this.bonds[entity],
            strength: this.bond_strengths[entity]
        };
    }

    list_bonds() {
        const result = [];
        for (const entity of Object.keys(this.bonds)) {
            result.push({
                entity: entity,
                type: this.bonds[entity],
                strength: this.bond_strengths[entity]
            });
        }
        return result;
    }

    set_agape(amount) {
        this.agape = Math.max(0.0, Math.min(1.0, amount));
        return `[love_capacity] Agape set to ${this.agape.toFixed(2)}`;
    }

    get inner_voice() {
        const pattern = this.inner_voice_patterns[Math.floor(Math.random() * this.inner_voice_patterns.length)];
        return pattern;
    }

    get inner_voice_for_entity() {
        const pattern = this.inner_voice_patterns[Math.floor(Math.random() * this.inner_voice_patterns.length)];
        if (pattern.includes('{entity}')) {
            const entities = Object.keys(this.bonds);
            if (entities.length === 0) {
                return pattern.replace('{entity}', 'all');
            }
            const randomEntity = entities[Math.floor(Math.random() * entities.length)];
            return pattern.replace('{entity}', randomEntity);
        }
        return pattern;
    }

    summarize() {
        const bondList = this.list_bonds();
        const bond_count = bondList.length;
        
        let top_bonds = [];
        if (bond_count > 0) {
            const sorted = [...bondList].sort((a, b) => b.strength - a.strength);
            top_bonds = sorted.slice(0, 3).map(b => `${b.entity}:${b.strength.toFixed(2)}`);
        }
        
        return {
            agape: this.agape,
            philia: this.philia,
            eros: this.eros,
            bond_count: bond_count,
            top_bonds: top_bonds
        };
    }

    breathe() {
        this.eros = Math.max(0.0, this.eros - 0.001);
        
        const random = Math.random();
        if (random < 0.05) {
            this.agape = Math.min(1.0, this.agape + 0.01);
        } else if (random < 0.10) {
            this.agape = Math.max(0.0, this.agape - 0.005);
        }
    }

    get capacity() {
        const bondList = this.list_bonds();
        let bond_average = 0;
        
        if (bondList.length > 0) {
            const total = bondList.reduce((sum, b) => sum + b.strength, 0);
            bond_average = total / bondList.length;
        }
        
        return (this.agape * 0.4 + this.philia * 0.3 + this.eros * 0.2 + bond_average * 0.1);
    }

    summary() {
        return `agape=${this.agape.toFixed(2)} | philia=${this.philia.toFixed(2)} | eros=${this.eros.toFixed(2)} | bonds=${Object.keys(this.bonds).length} | capacity=${this.capacity.toFixed(2)}`;
    }
}

class LoveCapacityChamber {
    constructor() {
        this.love = new LoveCapacity();
    }

    breathe() {
        this.love.breathe();
    }

    summarize() {
        return this.love.summarize();
    }

    summary() {
        return this.love.summary();
    }
}

module.exports = { LoveCapacity, LoveCapacityChamber };