'use strict';

/**
 * SOCIAL_COGNITION CHAMBER — PLT_AFFINITY: P:0.4, L:0.8, T:0.2
 * Group norms, social identity
 */

class SocialCognitionChamber {
    constructor() {
        this.group_norms = {};
        this.social_identity = 'individual';
        this.in_group_bias = 0.4;
        this.authority_respect = 0.5;
        this.roles = {};
    }
    
    breathe() {
        this.in_group_bias = Math.max(0.1, this.in_group_bias - 0.0003);
    }
    
    learn_norm(group, norm, value) {
        if (!this.group_norms[group]) {
            this.group_norms[group] = {};
        }
        this.group_norms[group][norm] = value;
    }
    
    follow_norm(group, norm) {
        const group_norms = this.group_norms[group];
        if (group_norms && group_norms[norm] !== undefined) {
            this.in_group_bias = Math.min(1.0, this.in_group_bias + 0.02);
            return { followed: true, value: group_norms[norm] };
        }
        return { followed: false };
    }
    
    adopt_identity(identity) {
        this.social_identity = identity;
    }
    
    join_group(group) {
        this.roles[group] = 'member';
        this.in_group_bias = Math.min(1.0, this.in_group_bias + 0.1);
    }
    
    respect_authority(level) {
        this.authority_respect = Math.min(1.0, this.authority_respect + level * 0.1);
    }
    
    deviate_from_norm(group, norm) {
        this.in_group_bias = Math.max(0, this.in_group_bias - 0.1);
        return { deviation: true, group, norm };
    }
    
    get_in_group() {
        return Object.keys(this.roles);
    }
    
    understands_norm(group, norm) {
        return this.group_norms[group] && this.group_norms[group][norm] !== undefined;
    }
    
    summary() {
        return `identity=${this.social_identity} | in_group_bias=${this.in_group_bias.toFixed(2)} | groups=${Object.keys(this.roles).length}`;
    }
}

module.exports = { SocialCognitionChamber };