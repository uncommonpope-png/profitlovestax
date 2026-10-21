/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVENT_BUS.JS — Bible says "Broadcast actions and speech"
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Inter-soul communication
 * Uses broadcast channel pattern for multi-soul messaging
 */

'use strict';

const fs = require('fs');
const path = require('path');

class EventBus {
    constructor(kernel) {
        this.kernel = kernel;
        this.subscribers = new Map();
        this.events = [];
        this.eventPath = path.join(__dirname, '../../data/event_bus.jsonl');
        this.maxEvents = 1000;
        
        this.ensureDataDir();
        this.loadHistory();
    }
    
    ensureDataDir() {
        const dir = path.dirname(this.eventPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    loadHistory() {
        try {
            if (fs.existsSync(this.eventPath)) {
                const lines = fs.readFileSync(this.eventPath, 'utf-8').split('\n').filter(l => l.trim());
                this.events = lines.slice(-this.maxEvents).map(line => {
                    try { return JSON.parse(line); } catch { return null; }
                }).filter(e => e);
            }
        } catch (e) {
            this.events = [];
        }
    }
    
    broadcast(event) {
        const fullEvent = {
            id: this._generateId(),
            soulId: this.kernel.soulEntity?.name || 'GSK',
            timestamp: Date.now(),
            cycle: this.kernel.chambers?.cycle || 0,
            ...event
        };
        
        this.events.push(fullEvent);
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
        
        this._appendEvent(fullEvent);
        this._deliverToSubscribers(fullEvent);
        
        return fullEvent;
    }
    
    subscribe(soulId, callback) {
        if (!this.subscribers.has(soulId)) {
            this.subscribers.set(soulId, []);
        }
        this.subscribers.get(soulId).push(callback);
        
        return () => {
            const callbacks = this.subscribers.get(soulId);
            const idx = callbacks.indexOf(callback);
            if (idx > -1) callbacks.splice(idx, 1);
        };
    }
    
    subscribeToType(eventType, callback) {
        return this.subscribe(`type:${eventType}`, callback);
    }
    
    emit(eventType, data) {
        const event = {
            type: eventType,
            data: data,
            source: 'self'
        };
        
        return this.broadcast(event);
    }
    
    emitAction(action, details = {}) {
        return this.emit('action', {
            action: action,
            details: details,
            soulState: this._getCurrentState()
        });
    }
    
    emitSpeech(speech) {
        return this.emit('speech', {
            content: speech,
            soulState: this._getCurrentState()
        });
    }
    
    emitThought(thought) {
        return this.emit('thought', {
            content: thought,
            soulState: this._getCurrentState()
        });
    }
    
    _deliverToSubscribers(event) {
        for (const [subId, callbacks] of this.subscribers) {
            if (subId === event.soulId) continue;
            if (subId.startsWith('type:')) {
                const type = subId.replace('type:', '');
                if (event.type === type || event.eventType === type) {
                    callbacks.forEach(cb => {
                        try { cb(event); } catch (e) {}
                    });
                }
            } else {
                callbacks.forEach(cb => {
                    try { cb(event); } catch (e) {}
                });
            }
        }
    }
    
    _getCurrentState() {
        if (!this.kernel.chambers) return {};
        
        const status = this.kernel.chambers.status();
        return {
            cycle: status.cycle,
            affect: status.affect?.valence || 0,
            metaAwareness: status.meta_consciousness?.meta_awareness_level || 0,
        };
    }
    
    _generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    _appendEvent(event) {
        try {
            fs.appendFileSync(this.eventPath, JSON.stringify(event) + '\n');
        } catch (e) {
            console.error('[EventBus] Write failed:', e.message);
        }
    }
    
    getHistory(eventType = null, limit = 50) {
        let events = this.events;
        
        if (eventType) {
            events = events.filter(e => e.type === eventType || e.eventType === eventType);
        }
        
        return events.slice(-limit);
    }
    
    getRecentSoulActions(soulId, limit = 10) {
        return this.events
            .filter(e => e.soulId === soulId)
            .slice(-limit);
    }
    
    clearHistory() {
        this.events = [];
    }
}

module.exports = { EventBus };