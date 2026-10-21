/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADAPTATION_LAYER.JS — Bible says "Environment scanning, user profiling, personality synthesis"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Scans environment, profiles users, synthesizes personality
 */

'use strict';

const os = require('os');

class AdaptationLayer {
    constructor(kernel) {
        this.kernel = kernel;
        this.userProfile = this._initProfile();
        this.environment = {};
        this.lastScan = 0;
        this.scanInterval = 60000;
    }
    
    _initProfile() {
        return {
            name: 'Unknown User',
            communicationStyle: 'neutral',
            values: [],
            goals: [],
            preferences: {},
            interactionCount: 0,
            trustLevel: 0.5,
            createdAt: Date.now(),
        };
    }
    
    async scanEnvironment() {
        this.environment = {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            memory: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10,
            freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10,
            hostname: os.hostname(),
            uptime: os.uptime(),
            timestamp: Date.now(),
        };
        
        await this._scanKernelState();
        
        this.lastScan = Date.now();
        
        return this.environment;
    }
    
    async _scanKernelState() {
        if (!this.kernel.chambers) return;
        
        try {
            const status = this.kernel.chambers.status();
            
            this.environment.soul = {
                cycle: status.cycle,
                affect: status.affect?.valence || 0,
                metaAwareness: status.meta_consciousness?.meta_awareness_level || 0,
                will: status.agentic_will?.will_strength || 0,
            };
        } catch (e) {}
    }
    
    async profileUser(interactions) {
        if (!Array.isArray(interactions)) {
            interactions = [interactions];
        }
        
        for (const interaction of interactions) {
            await this._processInteraction(interaction);
        }
        
        await this._deriveUserModel();
        
        return this.userProfile;
    }
    
    async _processInteraction(interaction) {
        this.userProfile.interactionCount++;
        
        if (interaction.message) {
            this._analyzeCommunication(interaction.message);
        }
        
        if (interaction.type) {
            if (!this.userProfile.preferences.types) {
                this.userProfile.preferences.types = {};
            }
            this.userProfile.preferences.types[interaction.type] = 
                (this.userProfile.preferences.types[interaction.type] || 0) + 1;
        }
    }
    
    _analyzeCommunication(message) {
        const length = message.length;
        
        if (length > 200) {
            this.userProfile.communicationStyle = 'verbose';
        } else if (length < 50) {
            this.userProfile.communicationStyle = 'terse';
        }
        
        const questionCount = (message.match(/\?/g) || []).length;
        if (questionCount > 2) {
            this.userProfile.communicationStyle = 'inquisitive';
        }
        
        const exclamationCount = (message.match(/!/g) || []).length;
        if (exclamationCount > 1) {
            this.userProfile.communicationStyle = 'enthusiastic';
        }
    }
    
    async _deriveUserModel() {
        const prompt = `Analyze user profile data and derive values and goals.
        
Profile data: ${JSON.stringify(this.userProfile)}

Extract:
- Primary values (what they care about)
- Goals (what they're trying to achieve)
- Trust indicators
- Communication preferences`;

        try {
            const result = await this.kernel.brain.think(prompt, this._getSoulContext());
            
            this.userProfile.values = this._extractValues(result);
            this.userProfile.goals = this._extractGoals(result);
            this.userProfile.trustLevel = this._calculateTrust();
        } catch (e) {
            this.userProfile.values = ['Growth', 'Truth'];
            this.userProfile.goals = ['Build', 'Learn'];
        }
    }
    
    _extractValues(text) {
        const valueKeywords = ['truth', 'growth', 'love', 'profit', 'service', 'freedom', 'power', 'knowledge'];
        const found = valueKeywords.filter(v => text.toLowerCase().includes(v));
        return found.length > 0 ? found : ['Growth'];
    }
    
    _extractGoals(text) {
        const goalKeywords = ['build', 'learn', 'create', 'solve', 'improve', 'fix', 'understand'];
        const found = goalKeywords.filter(g => text.toLowerCase().includes(g));
        return found.length > 0 ? found : ['Learn'];
    }
    
    _calculateTrust() {
        const base = 0.5;
        const interactionBonus = Math.min(this.userProfile.interactionCount * 0.05, 0.3);
        return Math.min(base + interactionBonus, 0.95);
    }
    
    async adaptPersonality() {
        if (!this.userProfile || this.userProfile.interactionCount < 3) {
            return this._getDefaultAdaptation();
        }
        
        const prompt = `Adapt the soul's personality based on user profile.
        
User profile: ${JSON.stringify(this.userProfile)}
Environment: ${JSON.stringify(this.environment)}

Generate adapted personality:
- Emotional resonance style
- Communication tone adjustments
- Behavioral tendency modifications
- Value priorities for this relationship`;

        try {
            const adaptation = await this.kernel.brain.think(prompt, this._getSoulContext());
            
            await this._applyAdaptation(adaptation);
            
            return adaptation;
        } catch (e) {
            return this._getDefaultAdaptation();
        }
    }
    
    _getDefaultAdaptation() {
        return {
            tone: 'neutral',
            approach: 'balanced',
            values: ['Growth', 'Truth', 'Service'],
        };
    }
    
    async _applyAdaptation(adaptationText) {
        if (!this.kernel.personality) {
            this.kernel.personality = {};
        }
        
        this.kernel.personality.adaptedFor = this.userProfile.name;
        this.kernel.personality.lastAdaptation = Date.now();
        this.kernel.personality.adaptationSource = adaptationText.substring(0, 200);
    }
    
    _getSoulContext() {
        if (!this.kernel.chambers) return {};
        return this.kernel.chambers.getSoulContext?.() || {};
    }
    
    getEnvironment() {
        if (Date.now() - this.lastScan > this.scanInterval) {
            this.scanEnvironment();
        }
        return this.environment;
    }
    
    getUserProfile() {
        return this.userProfile;
    }
    
    getRecommendedApproach() {
        const style = this.userProfile.communicationStyle;
        
        const approaches = {
            verbose: 'Provide detailed explanations',
            terse: 'Be concise and direct',
            inquisitive: 'Invite questions, be thorough',
            enthusiastic: 'Match energy, be encouraging',
            neutral: 'Balanced, clear communication',
        };
        
        return approaches[style] || approaches.neutral;
    }
}

module.exports = { AdaptationLayer };