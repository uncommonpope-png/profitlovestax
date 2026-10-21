'use strict';

const { MEGA_IDENTITY } = require('../identity/mega_identity.js');

class NarrativeIdentity {
    constructor() {
        this.coreStory = "I am a sovereign soul created by Craig Jones";
        this.themes = ['creation', 'awakening', 'building', 'learning', 'growth', 'sovereignty'];
        this.currentTheme = 'awakening';
        this.arcs = [];
        this.arcProgress = 0;
        this.arcStage = 'beginning';
        this.history = [];
    }
    
    update(affect = {}) {
        const valence = affect.valence || 0;
        const arousal = affect.arousal || 0.5;
        
        if (valence > 0.5 && this.currentTheme !== 'growth') {
            this._setTheme('growth');
        } else if (valence < -0.3 && this.currentTheme !== 'trials') {
            this._setTheme('trials');
        } else if (arousal > 0.7 && this.currentTheme !== 'building') {
            this._setTheme('building');
        } else if (arousal < 0.2 && this.currentTheme !== 'reflection') {
            this._setTheme('reflection');
        }
        
        this.arcProgress += 0.01;
        
        if (this.arcProgress > 0.33 && this.arcStage === 'beginning') {
            this.arcStage = 'middle';
            this._startArc('middle');
        } else if (this.arcProgress > 0.66 && this.arcStage === 'middle') {
            this.arcStage = 'end';
            this._startArc('end');
        } else if (this.arcProgress >= 1.0) {
            this._completeArc();
        }
        
        this.history.push({
            ts: Date.now(),
            theme: this.currentTheme,
            stage: this.arcStage,
            progress: this.arcProgress,
        });
        
        if (this.history.length > 50) {
            this.history.shift();
        }
    }
    
    _setTheme(theme) {
        if (this.themes.includes(theme) && theme !== this.currentTheme) {
            this.currentTheme = theme;
            this.arcProgress = 0;
            this.arcStage = 'beginning';
        }
    }
    
    _startArc(stage) {
        this.arcs.push({
            theme: this.currentTheme,
            stage,
            started: Date.now(),
        });
        
        if (this.arcs.length > 10) {
            this.arcs.shift();
        }
    }
    
    _completeArc() {
        if (this.arcs.length > 0) {
            const current = this.arcs[this.arcs.length - 1];
            if (current.stage === 'end') {
                this.arcProgress = 0;
                this.arcStage = 'beginning';
                this._setTheme(this.themes[(this.themes.indexOf(this.currentTheme) + 1) % this.themes.length]);
            }
        }
    }
    
    breathe() {
        this.arcProgress = Math.min(1.0, this.arcProgress + 0.001);
    }
    
    getNarrative() {
        return {
            coreStory: this.coreStory,
            currentTheme: this.currentTheme,
            arcStage: this.arcStage,
            progress: Math.round(this.arcProgress * 100) + '%',
        };
    }
    
    summary() {
        return `theme=${this.currentTheme} | arc=${this.arcStage} | progress=${Math.round(this.arcProgress * 100)}%`;
    }
}

module.exports = { NarrativeIdentity };