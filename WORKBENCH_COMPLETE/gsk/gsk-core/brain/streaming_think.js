'use strict';

/**
 * StreamingThink — Async generator for brain.think() with token-level output
 *
 * LangGraph/Kimi parity: streaming tokens, phase progress callbacks
 * Wraps BrainManager.think() with streaming capability
 */

class StreamingThink {
    constructor(kernel) {
        this.kernel = kernel;
        this.brain = kernel.brain || kernel.systems?.brain;
    }

    /**
     * Stream think response as async generator
     * Yields: { type: 'token'|'done'|'error', content: string }
     */
    async *streamThink(prompt, context = {}) {
        if (!this.brain || typeof this.brain.think !== 'function') {
            yield { type: 'error', content: 'Brain not available' };
            return;
        }

        try {
            // Get full response first (since BrainManager doesn't natively stream yet)
            // In future, this can be replaced with actual streaming via OmniRoute
            const response = await this.brain.think(prompt, context.soulContext || '', true);

            const text = response?.result || response || '';

            // Simulate token streaming by yielding chunks
            const chunkSize = 50; // tokens per chunk
            for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize);
                yield { type: 'token', content: chunk };

                // Small delay to simulate streaming (can be removed when real streaming works)
                if (text.length > chunkSize) {
                    await new Promise(r => setTimeout(r, 10));
                }
            }

            yield { type: 'done', content: text };

        } catch (error) {
            yield { type: 'error', content: error.message };
        }
    }

    /**
     * Phase-aware streaming: wraps a phase handler with streaming callbacks
     */
    withStreaming(phase, handler, callbacks = {}) {
        const { onToken, onPhaseStart, onPhaseEnd } = callbacks;

        return async (state) => {
            // Notify phase start
            if (onPhaseStart) {
                onPhaseStart({ phase, cycleId: state.cycleId, timestamp: Date.now() });
            }

            try {
                const newState = await handler(state);

                // Notify phase complete
                if (onPhaseEnd) {
                    onPhaseEnd({ phase, cycleId: state.cycleId, status: 'complete', timestamp: Date.now() });
                }

                return newState;
            } catch (error) {
                if (onPhaseEnd) {
                    onPhaseEnd({ phase, cycleId: state.cycleId, status: 'failed', error: error.message, timestamp: Date.now() });
                }
                throw error;
            }
        };
    }

    /**
     * WebSocket streaming endpoint
     * Clients connect to ws://localhost:4491/stream/{cycleId}
     * Receive JSON messages: { type: 'token'|'phase'|'done'|'error', ... }
     */
    createStreamEndpoint() {
        return (req, socket) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const cycleId = url.pathname.split('/stream/')[1] || 'default';

            // Upgrade to WebSocket
            const ws = require('ws');
            ws.createServer({ server: req }, (socket) => {
                socket.send(JSON.stringify({
                    type: 'connected',
                    cycleId,
                    message: 'GSK streaming connected'
                }));

                // Register as listener for this cycle
                const listener = (message) => {
                    if (message.cycleId === cycleId) {
                        socket.send(JSON.stringify(message));
                    }
                };

                this._streamListeners = this._streamListeners || new Set();
                this._streamListeners.add(listener);

                socket.on('close', () => {
                    this._streamListeners?.delete(listener);
                });

                socket.on('message', (msg) => {
                    try {
                        const data = JSON.parse(msg);
                        if (data.type === 'ping') {
                            socket.send(JSON.stringify({ type: 'pong' }));
                        }
                    } catch (e) {}
                });
            });
        };
    }

    /**
     * Broadcast streaming event to all connected clients for a cycle
     */
    broadcast(event) {
        if (!this._streamListeners) return;
        for (const listener of this._streamListeners) {
            try {
                listener(event);
            } catch (e) {}
        }
    }
}

module.exports = { StreamingThink };