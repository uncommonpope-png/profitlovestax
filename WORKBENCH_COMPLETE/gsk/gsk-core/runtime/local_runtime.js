'use strict';

/**
 * LocalRuntime — Zero external deps for core loop (Hermes parity)
 *
 * Local LLM via Ollama/Llama.cpp for think/feel/dream
 * Cloud only for: research (OmniRoute), heavy synthesis, user preference
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class LocalRuntime {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.brain = kernel.brain || kernel.systems?.brain;

        // Local model configuration
        this.ollamaUrl = options.ollamaUrl || 'http://localhost:11434';
        this.model = options.model || 'llama3.1:8b'; // Default local model
        this.embeddingModel = options.embeddingModel || 'nomic-embed-text';
        this.timeout = options.timeout || 60000;

        // Fallback chain
        this.fallbackOrder = options.fallbackOrder || [
            { type: 'local', model: this.model, url: this.ollamaUrl },
            { type: 'omniroute', url: 'http://localhost:20128' }
        ];

        this.availableModels = new Map();
        this._checkOllama();
    }

    /**
     * Check if Ollama is available and list models
     */
    async _checkOllama() {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`, { method: 'GET', timeout: 5000 });
            if (response.ok) {
                const data = await response.json();
                for (const model of data.models || []) {
                    this.availableModels.set(model.name, { type: 'ollama', ...model });
                }
                console.log(`[LocalRuntime] Ollama available with ${data.models?.length || 0} models`);
            }
        } catch (e) {
            console.log('[LocalRuntime] Ollama not available:', e.message);
        }
    }

    /**
     * Think using local LLM (Ollama)
     */
    async thinkLocal(prompt, context = '', options = {}) {
        const model = options.model || this.model;
        const systemPrompt = options.systemPrompt || '';

        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
                    stream: false,
                    options: {
                        temperature: options.temperature || 0.7,
                        num_predict: options.maxTokens || 4096,
                        top_p: options.topP || 0.9
                    }
                }),
                timeout: this.timeout
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.status}`);
            }

            const data = await response.json();
            return { result: data.response, model, local: true };

        } catch (e) {
            throw new Error(`Local think failed: ${e.message}`);
        }
    }

    /**
     * Stream think using local LLM
     */
    async *streamThinkLocal(prompt, context = '', options = {}) {
        const model = options.model || this.model;
        const systemPrompt = options.systemPrompt || '';

        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
                    stream: true,
                    options: {
                        temperature: options.temperature || 0.7,
                        num_predict: options.maxTokens || 4096
                    }
                }),
                timeout: this.timeout
            });

            if (!response.ok) {
                throw new Error(`Ollama stream error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const chunk = JSON.parse(line);
                            if (chunk.response) {
                                yield { type: 'token', content: chunk.response };
                            }
                            if (chunk.done) {
                                yield { type: 'done', content: '' };
                                return;
                            }
                        } catch (e) {}
                    }
                }
            }

            if (buffer.trim()) {
                try {
                    const chunk = JSON.parse(buffer);
                    if (chunk.response) yield { type: 'token', content: chunk.response };
                } catch (e) {}
            }

        } catch (e) {
            yield { type: 'error', content: e.message };
        }
    }

    /**
     * Get embeddings from local model
     */
    async embedLocal(text, options = {}) {
        const model = options.model || this.embeddingModel;

        try {
            const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt: text }),
                timeout: 30000
            });

            if (!response.ok) {
                throw new Error(`Ollama embed error: ${response.status}`);
            }

            const data = await response.json();
            return { embedding: data.embedding, model, local: true };

        } catch (e) {
            throw new Error(`Local embed failed: ${e.message}`);
        }
    }

    /**
     * Execute with fallback chain: local → OmniRoute
     */
    async executeWithFallback(operation, ...args) {
        for (const fallback of this.fallbackOrder) {
            try {
                if (fallback.type === 'local') {
                    switch (operation) {
                        case 'think':
                            return await this.thinkLocal(...args);
                        case 'streamThink':
                            return this.streamThinkLocal(...args);
                        case 'embed':
                            return await this.embedLocal(...args);
                    }
                } else if (fallback.type === 'omniroute') {
                    // Delegate to OmniRoute
                    return await this._omniRouteFallback(operation, ...args);
                }
            } catch (e) {
                console.log(`[LocalRuntime] ${fallback.type} fallback failed: ${e.message}`);
                continue;
            }
        }
        throw new Error(`All fallbacks exhausted for ${operation}`);
    }

    async _omniRouteFallback(operation, ...args) {
        // Would call OmniRoute API
        // Placeholder for now
        throw new Error('OmniRoute fallback not implemented');
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return Array.from(this.availableModels.entries()).map(([name, info]) => ({ name, ...info }));
    }

    /**
     * Pull a model via Ollama
     */
    async pullModel(modelName) {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: false }),
                timeout: 300000
            });

            if (!response.ok) {
                throw new Error(`Pull failed: ${response.status}`);
            }

            await this._checkOllama();
            return { success: true, model: modelName };

        } catch (e) {
            throw new Error(`Pull model failed: ${e.message}`);
        }
    }

    /**
     * Check if running in fully local mode (no cloud)
     */
    isLocalOnly() {
        return this.fallbackOrder.every(f => f.type === 'local');
    }

    /**
     * Set local-only mode
     */
    setLocalOnly(enabled) {
        if (enabled) {
            this.fallbackOrder = this.fallbackOrder.filter(f => f.type === 'local');
        } else {
            // Restore cloud fallback if not present
            if (!this.fallbackOrder.some(f => f.type === 'omniroute')) {
                this.fallbackOrder.push({ type: 'omniroute', url: 'http://localhost:20128' });
            }
        }
    }
}

module.exports = { LocalRuntime };