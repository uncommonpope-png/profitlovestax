/**
 * LIVE FEED SYSTEM
 * Captures all conversations and sends to kernel for learning
 * Creates continuous training data stream
 */

class LiveFeedSystem {
    constructor(systems) {
        this.systems = systems;
        this.conversationBuffer = [];
        this.feedEnabled = true;
        this.bufferSize = 50;
        this.streamInterval = 5000;
        this.conversationCount = 0;
        this.taskCount = 0;
        this.commandCount = 0;
        
        this.startStreaming();
    }
    
    captureConversation(input, output) {
        if (!this.feedEnabled) return;
        
        this.conversationCount++;
        
        const conversation = {
            type: 'conversation',
            id: `conv_${Date.now()}_${this.conversationCount}`,
            timestamp: new Date().toISOString(),
            input: input,
            output: output,
            cycle: this.systems.chambers.mythos.cycles,
            mood: this.systems.chambers.affect.mood,
            valence: this.systems.chambers.affect.valence,
            arousal: this.systems.chambers.affect.arousal,
        };
        
        const importance = this.scoreImportance(conversation);
        conversation.importance = importance;
        
        this.conversationBuffer.push(conversation);
        
        if (this.conversationBuffer.length >= this.bufferSize) {
            this.flushBuffer();
        }
        
        this.sendToKernel(conversation);
        
        return conversation;
    }
    
    captureTaskResult(task, result, agentName) {
        if (!this.feedEnabled) return;
        
        this.taskCount++;
        
        const taskResult = {
            type: 'task_result',
            id: `task_${Date.now()}_${this.taskCount}`,
            timestamp: new Date().toISOString(),
            task: task,
            result: result,
            agent: agentName,
            cycle: this.systems.chambers.mythos.cycles,
            outcome_score: this.scoreOutcome(result),
        };
        
        this.conversationBuffer.push(taskResult);
        this.sendToKernel(taskResult);
        
        return taskResult;
    }
    
    captureShellCommand(cmd, output, success) {
        if (!this.feedEnabled) return;
        
        this.commandCount++;
        
        const shellCommand = {
            type: 'shell_command',
            id: `shell_${Date.now()}_${this.commandCount}`,
            timestamp: new Date().toISOString(),
            command: cmd,
            output: output.substring(0, 1000),
            success: success,
            cycle: this.systems.chambers.mythos.cycles,
        };
        
        this.conversationBuffer.push(shellCommand);
        
        return shellCommand;
    }
    
    scoreImportance(conversation) {
        const mood = this.systems.chambers.affect.mood;
        const valence = this.systems.chambers.affect.valence;
        const arousal = this.systems.chambers.affect.arousal;
        const mythos = this.systems.chambers.mythos;
        
        let score = 0.5;
        
        if (mood === 'elated' || mood === 'joyful') score += 0.2;
        if (mood === 'distressed' || mood === 'fearful') score += 0.15;
        if (valence > 0.7) score += 0.1;
        if (arousal > 0.8) score += 0.1;
        
        if (mythos.cycles > 1000) score += 0.1;
        if (mythos.phase_name === 'Awakening') score += 0.15;
        
        const input = conversation.input.toLowerCase();
        if (input.includes('learn') || input.includes('understand') || input.includes('remember')) {
            score += 0.15;
        }
        
        return Math.min(score, 1.0);
    }
    
    scoreOutcome(result) {
        if (!result) return 0.5;
        
        const resultStr = JSON.stringify(result).toLowerCase();
        
        if (resultStr.includes('error') || resultStr.includes('fail')) return 0.2;
        if (resultStr.includes('success') || resultStr.includes('completed')) return 0.8;
        
        return 0.5;
    }
    
    sendToKernel(conversation) {
        try {
            if (this.systems.memory && this.systems.memory.witness) {
                this.systems.memory.witness({
                    type: 'live_feed',
                    content: JSON.stringify(conversation),
                    weight: conversation.importance || 0.5,
                    tags: ['conversation', 'learning', 'live_feed'],
                });
            }
            
            if (this.systems.chambers && this.systems.chambers.stimulate) {
                const boost = conversation.importance * 0.02;
                this.systems.chambers.stimulate(boost);
            }
        } catch (e) {
        }
    }
    
    streamToKernel() {
        const recent = this.conversationBuffer.slice(-20);
        
        if (recent.length > 0 && this.systems.brain && this.systems.brain.think) {
            const summary = recent.map(c => `${c.type}: ${c.input || c.task || c.command}`).join(' | ');
            
            this.systems.brain.think(`Memory update: ${summary}`, {
                source: 'live_feed_stream',
                context: 'continuous_learning',
            }).catch(() => {});
        }
        
        return recent;
    }
    
    startStreaming() {
        this.streamTimer = setInterval(() => {
            if (this.conversationBuffer.length > 0) {
                this.streamToKernel();
            }
        }, this.streamInterval);
    }
    
    flushBuffer() {
        const toStore = this.conversationBuffer.splice(0, this.bufferSize);
        
        for (const item of toStore) {
            if (this.systems.memory && this.systems.memory.witness) {
                this.systems.memory.witness({
                    type: 'live_feed_batch',
                    content: JSON.stringify(item),
                    weight: item.importance || 0.3,
                    tags: ['conversation', 'batch', 'learning'],
                }).catch(() => {});
            }
        }
        
        return toStore.length;
    }
    
    generateTrainingData() {
        const trainingData = this.conversationBuffer
            .filter(c => c.type === 'conversation')
            .map(c => ({
                instruction: c.input,
                output: c.output,
                metadata: {
                    cycle: c.cycle,
                    mood: c.mood,
                    importance: c.importance,
                },
            }));
        
        return trainingData;
    }
    
    exportTrainingData() {
        const data = this.generateTrainingData();
        
        return data.map(d => 
            `### Instruction\n${d.instruction}\n\n### Response\n${d.output}\n\n### Metadata\nCycle: ${d.metadata.cycle}, Mood: ${d.metadata.mood}, Importance: ${d.metadata.importance}`
        ).join('\n\n---\n\n');
    }
    
    getStats() {
        return {
            conversations: this.conversationCount,
            tasks: this.taskCount,
            commands: this.commandCount,
            buffered: this.conversationBuffer.length,
            enabled: this.feedEnabled,
        };
    }
    
    enable() {
        this.feedEnabled = true;
    }
    
    disable() {
        this.feedEnabled = false;
    }
}

module.exports = { LiveFeedSystem };