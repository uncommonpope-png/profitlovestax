'use strict';

const { KnowledgeGraph } = require('./knowledge_graph.js');
const fs = require('fs');
const path = require('path');

class SelfGrowingBrain {
    constructor(kernel) {
        this.kernel = kernel;
        this.knowledgeGraph = new KnowledgeGraph();
        this.trainingData = [];
        this.modelPath = './models/gsk-brain';
        this.growthRate = 0.01;
        this.learningQueue = [];
        this.stats = {
            experiencesLearned: 0,
            knowledgeNodes: 0,
            trainingPairsGenerated: 0,
            selfTuningAttempts: 0,
            ownBrainUsed: 0,
            externalBrainUsed: 0,
            curiosityResearches: 0
        };
        this.trainingDataPath = path.join(__dirname, '../../data/training-data.jsonl');
        this.localModelAvailable = false;
        this._initStorage();
    }

    _initStorage() {
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (fs.existsSync(this.trainingDataPath)) {
            try {
                const lines = fs.readFileSync(this.trainingDataPath, 'utf-8').split('\n').filter(l => l.trim());
                this.trainingData = lines.map(l => JSON.parse(l));
                this.stats.trainingPairsGenerated = this.trainingData.length;
            } catch (e) {
                console.log('[SelfGrowingBrain] Could not load training data');
            }
        }
    }

    async learnFromExperience(experience) {
        const input = typeof experience === 'string' ? experience : experience.input || experience.content || '';
        const output = typeof experience === 'string' ? '' : experience.output || '';
        const content = input + (output ? ' -> ' + output : '');
        const type = typeof experience === 'object' ? experience.type || 'experience' : 'experience';
        const metadata = typeof experience === 'object' ? experience.metadata || {} : {};

        const nodeId = this.knowledgeGraph.addNode(type, content, 0.5);
        this.stats.experiencesLearned++;
        this.stats.knowledgeNodes = this.knowledgeGraph.nodes.size;

        if (metadata.relatedTo) {
            metadata.relatedTo.forEach(related => {
                const concepts = this.knowledgeGraph.findConcepts(related);
                if (concepts.length > 0) {
                    this.knowledgeGraph.addEdge(nodeId, concepts[0].node.id, 'related', 0.6);
                }
            });
        }

        if (metadata.causes) {
            const causes = this.knowledgeGraph.findConcepts(metadata.causes);
            if (causes.length > 0) {
                this.knowledgeGraph.addEdge(nodeId, causes[0].node.id, 'causes', 0.8);
            }
        }

        this._queueForTraining(experience, nodeId);

        console.log(`[SelfGrowingBrain] Learned: ${type} - ${content.substring(0, 50)}...`);
        return { nodeId, graphStats: this.knowledgeGraph.getStatistics() };
    }

    _queueForTraining(experience, nodeId) {
        const prompt = this._createPromptFromExperience(experience);
        const completion = this._createCompletionFromExperience(experience);

        const trainingPair = {
            prompt,
            completion,
            nodeId,
            timestamp: Date.now(),
            source: experience.source
        };

        this.learningQueue.push(trainingPair);
        this.trainingData.push(trainingPair);
    }

    _createPromptFromExperience(experience) {
        const content = experience.input || experience.content || '';
        const base = `Context: ${content.substring(0, 200)}`;
        const sourceMap = {
            web: 'Based on web research:',
            conversation: 'From conversation:',
            memory: 'From memory:',
            observation: 'Observed:'
        };
        return `${sourceMap[experience.source] || 'From experience:'} ${base}`;
    }

    _createCompletionFromExperience(experience) {
        if (experience.insight) {
            return experience.insight;
        }
        if (experience.type === 'fact') {
            return `This is a verified ${experience.category || 'knowledge'} fact.`;
        }
        const output = experience.output || '';
        if (output) return output;
        return `I understand this ${experience.type || 'experience'} from my learning.`;
    }

    async growKnowledge() {
        if (!this.kernel || !this.kernel.chambers) {
            return { status: 'no_kernel', message: 'No kernel available for growth' };
        }

        const soulContext = this.kernel.chambers.getSoulContext();
        const curiosity = soulContext.curiosityLevel || 0.5;

        if (curiosity > 0.6) {
            this.stats.curiosityResearches++;
            return { status: 'researching', curiosityLevel: curiosity };
        }

        return { status: 'monitoring', curiosityLevel: curiosity };
    }

    async generateTrainingData() {
        const newPairs = this.learningQueue.splice(0, 10);
        if (newPairs.length === 0) {
            return { generated: 0, total: this.trainingData.length };
        }

        const formatted = newPairs.map(pair => ({
            prompt: pair.prompt,
            response: pair.completion
        }));

        try {
            const lines = formatted.map(p => JSON.stringify(p)).join('\n');
            fs.appendFileSync(this.trainingDataPath, lines + '\n');
            this.stats.trainingPairsGenerated += newPairs.length;
        } catch (e) {
            console.log('[SelfGrowingBrain] Training data save failed');
        }

        return { generated: newPairs.length, total: this.stats.trainingPairsGenerated };
    }

    async selfFineTune() {
        this.stats.selfTuningAttempts++;

        const hasEnoughData = this.trainingData.length >= 20;
        if (!hasEnoughData) {
            return {
                ready: false,
                reason: `Need ${20 - this.trainingData.length} more training pairs`,
                current: this.trainingData.length
            };
        }

        // Export training data as JSONL for external fine-tuning (can be used with HuggingFace, etc.)
        const exportPath = path.join(__dirname, '../../data/fine-tune-export.jsonl');
        try {
            const lines = this.trainingData.slice(-200).map(p => JSON.stringify({
                instruction: p.prompt,
                output: p.completion,
                source: p.source || 'self-growing'
            })).join('\n');
            fs.writeFileSync(exportPath, lines, 'utf-8');
            console.log(`[SelfGrowingBrain] Training data exported (${this.trainingData.length} pairs) to ${exportPath}`);
        } catch (e) {
            console.log(`[SelfGrowingBrain] Export failed: ${e.message}`);
        }

        // Save current state for HuggingFace/local model loading
        this.saveState();
        this.localModelAvailable = false;

        return {
            ready: true,
            exportFile: exportPath,
            modelBuilt: false,
            trainingPairs: this.trainingData.length,
            note: 'Training data exported. Use with HuggingFace/local model for fine-tuning.'
        };
    }

    async _checkOwnBrainAvailable() {
        return false; // Local fine-tuned model requires external pipeline (HuggingFace/local)
    }

    async think(prompt) {
        const canUseOwnBrain = await this._checkOwnBrainAvailable();

        if (canUseOwnBrain) {
            this.stats.ownBrainUsed++;
            return {
                source: 'own_brain',
                response: await this._thinkWithOwnModel(prompt),
                confidence: 0.8
            };
        }

        this.stats.externalBrainUsed++;
        return {
            source: 'external',
            response: await this._thinkWithKernel(prompt),
            confidence: 0.6
        };
    }

    async _thinkWithOwnModel(prompt) {
        const related = this.knowledgeGraph.findConcepts(prompt);
        const context = related.slice(0, 3).map(r => r.node.content).join(' | ');
        return `From my knowledge: ${context || 'Learning...'}`;
    }

    async _thinkWithKernel(prompt) {
        if (this.kernel && this.kernel.brain) {
            return await this.kernel.brain.think(prompt);
        }
        return 'No brain available';
    }

    async hasMemories() {
        const episodicCount = Array.from(this.knowledgeGraph.nodes.values())
            .filter(n => n.type === 'experience' || n.type === 'conversation').length;

        return episodicCount > 0;
    }

    getGrowthMetrics() {
        return {
            ...this.stats,
            knowledgeGraph: this.knowledgeGraph.getStatistics(),
            readyForSelfTune: this.trainingData.length >= 50,
            readyForOwnBrain: this.trainingData.length >= 20
        };
    }

    async research(topic) {
        const experience = {
            source: 'research',
            content: `Researching: ${topic}`,
            type: 'research',
            metadata: { relatedTo: [topic] }
        };
        return await this.learnFromExperience(experience);
    }

    saveState() {
        const state = {
            knowledgeGraph: this.knowledgeGraph.export(),
            trainingData: this.trainingData.slice(-1000),
            stats: this.stats,
            timestamp: Date.now()
        };
        const statePath = path.join(__dirname, '../../data/self-growing-state.json');
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        return statePath;
    }

    loadState() {
        const statePath = path.join(__dirname, '../../data/self-growing-state.json');
        if (fs.existsSync(statePath)) {
            try {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                this.knowledgeGraph.import(state.knowledgeGraph);
                this.trainingData = state.trainingData || [];
                this.stats = state.stats || this.stats;
                console.log('[SelfGrowingBrain] State loaded');
                return true;
            } catch (e) {
                console.log('[SelfGrowingBrain] State load failed');
            }
        }
        return false;
    }
}

module.exports = { SelfGrowingBrain };