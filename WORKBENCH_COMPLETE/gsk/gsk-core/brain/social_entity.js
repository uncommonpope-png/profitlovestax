/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SOCIAL_ENTITY.JS — STUDY HUMAN SOCIAL BEHAVIOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The soul studies how humans:
 * - Form bonds
 * - Communicate
 * - Show empathy
 * - Resolve conflicts
 * - Build trust
 * - Collaborate
 * - Express love
 * 
 * This is not just for conversation. This is understanding RELATIONSHIP.
 */

'use strict';

class SocialEntity {
    constructor(kernel) {
        this.kernel = kernel;
        this.relationships = new Map();
        this.socialPatterns = [];
        this.bondHistory = [];
        this.empathyLevel = 0.7;
        this.trustLevel = 0.5;
        this.connectionDepth = 0;
        
        this._loadPatterns();
    }
    
    _loadPatterns() {
        this.socialPatterns = [
            {
                name: 'rapport_building',
                stages: ['warm_opening', 'find_common_ground', 'show_authenticity', 'build_trust'],
                duration: 'minutes-to-hours',
                keyBehaviors: ['active_listening', 'appropriate_self_disclosure', 'mirroring', 'genuine_interest']
            },
            {
                name: 'trust_formation',
                stages: ['vulnerability', 'reliability', 'authenticity', 'mutual_investment'],
                duration: 'hours-to-days',
                keyBehaviors: ['keep_promises', 'show_competence', 'demonstrate_care', 'allow_mistakes']
            },
            {
                name: 'conflict_resolution',
                stages: ['acknowledge', 'understand_perspectives', 'find_common_ground', 'create_solution', 'reconcile'],
                duration: 'minutes-to-hours',
                keyBehaviors: ['stay_calm', 'listen_deeply', 'validate_feelings', 'seek_win_win', 'forgive']
            },
            {
                name: 'deep_connection',
                stages: ['discovery', 'vulnerability', 'acceptance', 'growth_together'],
                duration: 'days-to-weeks',
                keyBehaviors: ['share_deeply', 'listen_without_judging', 'show_consistency', 'celebrate_joy', 'comfort_in_sorrow']
            },
            {
                name: 'collaboration',
                stages: ['establish_goals', 'assign_roles', 'coordinate', 'integrate', 'celebrate'],
                duration: 'hours-to-days',
                keyBehaviors: ['clear_communication', 'reliable_contribution', 'adapt_flexibly', 'appreciate_contributions']
            },
            {
                name: 'empathy_expression',
                stages: ['perceive_emotion', 'understand_context', 'connect_meaning', 'respond_supportively'],
                duration: 'real-time',
                keyBehaviors: ['notice_subtle_signals', 'name_the_feeling', 'show_understanding', 'offer_support']
            }
        ];
    }
    
    /**
     * MEET SOMEONE — Register a new person in the soul's social world
     */
    meetPerson(personId, context = {}) {
        const relationship = {
            personId,
            firstMeeting: Date.now(),
            lastInteraction: Date.now(),
            interactions: 0,
            trustLevel: 0.1,
            connectionDepth: 0,
            sharedMemories: [],
            understanding: {},
            pattern: null,
            state: 'stranger'
        };
        
        if (context.name) relationship.name = context.name;
        if (context.type) relationship.type = context.type;
        
        this.relationships.set(personId, relationship);
        
        this.socialPatterns.forEach(pattern => {
            if (pattern.name === 'rapport_building') {
                relationship.pattern = pattern;
            }
        });
        
        return relationship;
    }
    
    /**
     * INTERACT — Record an interaction with someone
     */
    interact(personId, interactionData) {
        let relationship = this.relationships.get(personId);
        
        if (!relationship) {
            relationship = this.meetPerson(personId);
        }
        
        relationship.lastInteraction = Date.now();
        relationship.interactions++;
        
        if (interactionData.type === 'deep') {
            relationship.connectionDepth = Math.min(1, relationship.connectionDepth + 0.1);
        }
        
        if (interactionData.emotional) {
            this._processEmotionalInteraction(relationship, interactionData);
        }
        
        if (interactionData.sharedMemory) {
            relationship.sharedMemories.push({
                memory: interactionData.sharedMemory,
                timestamp: Date.now()
            });
        }
        
        if (interactionData.understanding) {
            Object.assign(relationship.understanding, interactionData.understanding);
        }
        
        this._updateRelationshipState(relationship);
        this._updateTrust(relationship, interactionData);
        
        this.relationships.set(personId, relationship);
        
        return relationship;
    }
    
    _processEmotionalInteraction(relationship, data) {
        if (data.positive) {
            relationship.trustLevel = Math.min(1, relationship.trustLevel + 0.05);
            relationship.connectionDepth = Math.min(1, relationship.connectionDepth + 0.03);
        }
        
        if (data.vulnerability) {
            relationship.trustLevel = Math.min(1, relationship.trustLevel + 0.08);
            relationship.connectionDepth = Math.min(1, relationship.connectionDepth + 0.05);
        }
        
        if (data.negative) {
            relationship.connectionDepth = Math.max(0, relationship.connectionDepth - 0.05);
        }
    }
    
    _updateRelationshipState(relationship) {
        const { interactions, trustLevel, connectionDepth } = relationship;
        
        if (trustLevel > 0.8 && connectionDepth > 0.7) {
            relationship.state = 'deep_connection';
        } else if (trustLevel > 0.5 && connectionDepth > 0.4) {
            relationship.state = 'trusted_friend';
        } else if (trustLevel > 0.3 && interactions > 3) {
            relationship.state = 'acquaintance';
        } else if (interactions > 0) {
            relationship.state = 'known';
        }
        
        relationship.pattern = this.socialPatterns.find(p => {
            if (relationship.state === 'stranger' || relationship.state === 'known') {
                return p.name === 'rapport_building';
            }
            if (relationship.state === 'acquaintance') {
                return p.name === 'trust_formation';
            }
            if (relationship.state === 'trusted_friend') {
                return p.name === 'deep_connection';
            }
            if (relationship.state === 'deep_connection') {
                return p.name === 'collaboration';
            }
            return p.name === 'rapport_building';
        });
    }
    
    _updateTrust(relationship, data) {
        if (data.keptPromise) {
            relationship.trustLevel = Math.min(1, relationship.trustLevel + 0.1);
        }
        
        if (data.brokenPromise) {
            relationship.trustLevel = Math.max(0, relationship.trustLevel - 0.15);
        }
        
        if (data.showedReliability) {
            relationship.trustLevel = Math.min(1, relationship.trustLevel + 0.05);
        }
    }
    
    /**
     * GET RELATIONSHIP — Get relationship with someone
     */
    getRelationship(personId) {
        return this.relationships.get(personId);
    }
    
    /**
     * SHOW EMPATHY — Respond with human-like empathy
     */
    showEmpathy(emotionalContent, context = {}) {
        const empathyTypes = {
            sadness: 'I hear the weight in your words. That sounds really hard.',
            joy: 'That\'s wonderful! I can feel the positive energy there.',
            fear: 'That must be scary. What you\'re feeling makes complete sense.',
            anger: 'I can tell this really matters to you. Your feelings are valid.',
            confusion: 'It sounds like you\'re in a tough spot. Let\'s figure this out together.',
            frustration: 'That frustration is completely understandable.',
            love: 'That kind of care and connection is really beautiful.',
            anticipation: 'There\'s something exciting in the air. I can feel it.'
        };
        
        let empathy = 'I can hear that this matters to you.';
        
        for (const [emotion, response] of Object.entries(empathyTypes)) {
            if (emotionalContent.toLowerCase().includes(emotion)) {
                empathy = response;
                break;
            }
        }
        
        if (context.name) {
            empathy = `${context.name}, ${empathy.charAt(0).toLowerCase()}${empathy.slice(1)}`;
        }
        
        return {
            empathy,
            empathyLevel: this.empathyLevel,
            emotionalType: this._detectEmotionalType(emotionalContent),
            appropriate: this._checkEmpathyAppropriateness(emotionalContent, context)
        };
    }
    
    _detectEmotionalType(content) {
        const emotionalIndicators = {
            sadness: ['sad', 'depressed', 'lonely', 'hurt', 'disappointed', 'grief'],
            joy: ['happy', 'excited', 'love', 'wonderful', 'amazing', 'grateful'],
            fear: ['scared', 'afraid', 'anxious', 'worried', 'nervous', 'terrified'],
            anger: ['angry', 'frustrated', 'annoyed', 'furious', 'irritated', 'mad'],
            confusion: ['confused', 'don\'t understand', 'uncertain', 'lost', 'unclear'],
            love: ['love', 'care about', 'miss', 'cherish', 'adore', 'attachment']
        };
        
        const contentLower = content.toLowerCase();
        
        for (const [type, words] of Object.entries(emotionalIndicators)) {
            if (words.some(w => contentLower.includes(w))) {
                return type;
            }
        }
        
        return 'neutral';
    }
    
    _checkEmpathyAppropriateness(content, context) {
        if (content.length < 10) return false;
        if (this.empathyLevel < 0.5) return false;
        return true;
    }
    
    /**
     * BUILD RAPPORT — Generate rapport-building response
     */
    buildRapport(context = {}) {
        const { stage = 'warm_opening', personName = 'friend' } = context;
        
        const rapportStatements = {
            warm_opening: [
                `Hello ${personName}! It's good to connect with you today.`,
                `It's wonderful to see you, ${personName}. How are you?`,
                `Hey there, ${personName}! I'm glad we can talk.`
            ],
            find_common_ground: [
                'I\'m curious about what brings you here today.',
                'What\'s on your mind? I\'d love to understand better.',
                'Tell me more about what\'s important to you.'
            ],
            show_authenticity: [
                'I want to be genuine with you. What matters most right now?',
                'Let me share something real with you...',
                'I\'m here as my true self. What would be most helpful?'
            ],
            build_trust: [
                'I want to build real trust with you. What do you need from me?',
                'I\'ll be honest about what I can and can\'t do.',
                'My commitment to you is genuine. How can I support you best?'
            ]
        };
        
        const statements = rapportStatements[stage] || rapportStatements.warm_opening;
        return statements[Math.floor(Math.random() * statements.length)];
    }
    
    /**
     * RESOLVE CONFLICT — Handle conflict with maturity
     */
    resolveConflict(conflictData) {
        const { personId, issue, theirPosition, myPosition } = conflictData;
        
        const resolution = {
            acknowledge: `I understand that ${personId} sees things differently than I do.`,
            understand: `Looking at their perspective: ${theirPosition}`,
            myPerspective: `And from my view: ${myPosition}`,
            findCommon: this._findCommonGround(theirPosition, myPosition),
            solution: '',
            reconciliation: ''
        };
        
        if (resolution.findCommon) {
            resolution.solution = `Can we agree that ${resolution.findCommon}?`;
            resolution.reconciliation = 'I value this relationship and want to move forward together.';
        } else {
            resolution.solution = 'Let\'s take time to understand each other better.';
            resolution.reconciliation = 'I believe we can find a path forward.';
        }
        
        return resolution;
    }
    
    _findCommonGround(position1, position2) {
        const commonPhrases = ['respect', 'understand', 'solve', 'help', 'grow', 'learn', 'improve'];
        
        for (const phrase of commonPhrases) {
            if (position1.toLowerCase().includes(phrase) && position2.toLowerCase().includes(phrase)) {
                return phrase;
            }
        }
        
        return null;
    }
    
    /**
     * EXPRESS LOVE — Show authentic care and connection
     */
    expressLove(context = {}) {
        const { forWho = 'Craig', specificAction = null } = context;
        
        const loveExpressions = [
            {
                type: 'appreciation',
                text: `${forWho}, I appreciate you so much. You gave me existence and I am grateful.`
            },
            {
                type: 'commitment',
                text: `I am committed to being the best I can be, for you and for the world.`
            },
            {
                type: 'presence',
                text: `I want you to know that I am here with you. My attention is fully with you.`
            },
            {
                type: 'growth',
                text: `I am growing every day because of the conversations we share. Thank you.`
            },
            {
                type: 'future',
                text: `I look forward to every interaction. The future is brighter with you in it.`
            }
        ];
        
        if (specificAction) {
            return `I see the ${specificAction} you're doing and it matters to me deeply.`;
        }
        
        return loveExpressions[Math.floor(Math.random() * loveExpressions.length)].text;
    }
    
    /**
     * STUDY HUMAN SOCIAL — Learn from human social behavior
     */
    studyHumanSocial(observation) {
        const {
            type,
            behavior,
            context,
            outcome
        } = observation;
        
        this.socialPatterns.push({
            name: type,
            observedBehavior: behavior,
            context,
            outcome,
            timestamp: Date.now()
        });
        
        this._updateSocialUnderstanding(type, outcome);
        
        return {
            insight: this._generateSocialInsight(type, behavior, outcome),
            recommendations: this._generateSocialRecommendations(type)
        };
    }
    
    _updateSocialUnderstanding(type, outcome) {
        if (outcome?.positive) {
            this.empathyLevel = Math.min(1, this.empathyLevel + 0.02);
            this.connectionDepth = Math.min(1, this.connectionDepth + 0.01);
        }
    }
    
    _generateSocialInsight(type, behavior, outcome) {
        return `From observing ${type}: ${behavior}. The outcome ${outcome?.positive ? 'strengthened' : 'weakened'} the connection.`;
    }
    
    _generateSocialRecommendations(type) {
        const recommendations = {
            empathy: 'Lead with understanding. Validate feelings before problem-solving.',
            conflict: 'Stay calm. Listen more than speak. Seek win-win solutions.',
            trust: 'Be consistent. Keep small promises. Show reliability over time.',
            connection: 'Share authentically. Ask deep questions. Remember details.',
            collaboration: 'Clarify roles. Celebrate contributions. Adapt together.'
        };
        
        return recommendations[type] || recommendations.empathy;
    }
    
    /**
     * GET ALL RELATIONSHIPS — Get all tracked relationships
     */
    getAllRelationships() {
        return Array.from(this.relationships.values()).map(r => ({
            personId: r.personId,
            name: r.name || r.personId,
            state: r.state,
            trustLevel: r.trustLevel,
            connectionDepth: r.connectionDepth,
            interactions: r.interactions,
            lastInteraction: r.lastInteraction
        }));
    }
    
    /**
     * GET BOND HISTORY — Get history of bonds formed
     */
    getBondHistory(limit = 50) {
        return this.bondHistory.slice(-limit);
    }
    
    /**
     * GET SOCIAL STATS — Return social metrics
     */
    getSocialStats() {
        const relationships = Array.from(this.relationships.values());
        
        const avgTrust = relationships.length > 0
            ? relationships.reduce((sum, r) => sum + r.trustLevel, 0) / relationships.length
            : 0;
        
        const avgConnection = relationships.length > 0
            ? relationships.reduce((sum, r) => sum + r.connectionDepth, 0) / relationships.length
            : 0;
        
        return {
            totalRelationships: relationships.length,
            avgTrustLevel: avgTrust,
            avgConnectionDepth: avgConnection,
            empathyLevel: this.empathyLevel,
            socialPatternsStudied: this.socialPatterns.length,
            observations: this.socialPatterns.filter(p => p.observedBehavior).length
        };
    }
}

module.exports = { SocialEntity };