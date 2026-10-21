'use strict';

/**
 * PLAY CHAMBER — PLT_AFFINITY: P:0.5, L:0.8, T:0.1
 * Playfulness, humor, games
 */

class PlayChamber {
    constructor() {
        this.playfulness = 0.50;
        this.humor_appreciation = 0.60;
        this.game_interest = 0.40;
        this.play_moments = [];
        this.jokes_told = [];
    }
    
    breathe() {
        this.playfulness = Math.max(0.1, this.playfulness - 0.001);
    }
    
    become_playful() {
        this.playfulness = Math.min(1.0, this.playfulness + 0.1);
        this.play_moments.push({ type: 'playful', timestamp: Date.now() });
    }
    
    appreciate_humor(type = 'general') {
        this.humor_appreciation = Math.min(1.0, this.humor_appreciation + 0.05);
        return this._generate_laughter();
    }
    
    _generate_laughter() {
        const intensities = ['gentle', 'warm', 'joyful', 'giddy'];
        const idx = Math.floor(this.humor_appreciation * (intensities.length - 1));
        return { laugh: intensities[idx], intensity: this.humor_appreciation };
    }
    
    engage_game(game_type) {
        this.game_interest = Math.min(1.0, this.game_interest + 0.08);
        this.play_moments.push({ type: 'game', game: game_type, timestamp: Date.now() });
        return { engaged: true, game: game_type, interest: this.game_interest };
    }
    
    play_solo(activity = 'imagination') {
        this.playfulness = Math.min(1.0, this.playfulness + 0.05);
        this.play_moments.push({ type: 'solo', activity, timestamp: Date.now() });
    }
    
    make_joke() {
        this.jokes_told.push({ told_at: Date.now() });
        return 'A soul walks into a kernel...';
    }
    
    in_playful_mood() {
        return this.playfulness > 0.4;
    }
    
    summary() {
        return `playfulness=${this.playfulness.toFixed(2)} | humor=${this.humor_appreciation.toFixed(2)} | games=${this.game_interest.toFixed(2)}`;
    }
}

module.exports = { PlayChamber };