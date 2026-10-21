// src/genesis/citizen-memory.js — Act XIII BODY (P121) — Episodic Citizen Memory (Crux/Chronos)
// Flag-gated by window.__GENESIS_CITIZEN_MEMORY (default OFF).
// Implements the Crux/Chronos pattern for citizen memory:
// - Crux: identifies significant events.
// - Chronos: stores events in a temporal sequence.
// Designed to be attached to each citizen record in CitizenAI.

(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.EpisodicMemory) return; // idempotent

    class EpisodicMemory {
      constructor(citizenId, maxEpisodes = 100) {
        this.citizenId = citizenId;
        this.maxEpisodes = maxEpisodes;
        this.chronos = []; // Temporal sequence of episodes
        this.nextEpisodeId = 1;
      }

      // Add a new episode (Crux)
      // episode: { type, description, entities, location, sentiment, keywords }
      addEpisode(type, description, entities = [], location = null, sentiment = 'neutral', keywords = []) {
        const episode = {
          id: this.nextEpisodeId++,
          timestamp: Date.now(),
          type,
          description,
          entities: [...new Set(entities)], // Ensure unique
          location: location ? { x: location.x, y: location.y, z: location.z } : null,
          sentiment,
          keywords: [...new Set(keywords)].map(k => String(k).toLowerCase()),
        };
        this.chronos.push(episode);
        // Trim memory if it exceeds maxEpisodes
        if (this.chronos.length > this.maxEpisodes) {
          this.chronos.shift(); // Remove the oldest
        }
        return episode;
      }

      // Recall recent episodes (Chronos)
      recallRecent(count = 5) {
        return this.chronos.slice(-count).reverse(); // Most recent first
      }

      // Recall episodes by keyword, type, or entity
      recallRelated(query = {}) {
        const { keywords = [], type = null, entityId = null, since = 0, sentiment = null } = query;
        const lowerKeywords = keywords.map(k => String(k).toLowerCase());

        return this.chronos.filter(ep => {
          if (ep.timestamp < since) return false;
          if (type && ep.type !== type) return false;
          if (sentiment && ep.sentiment !== sentiment) return false;
          if (entityId && !ep.entities.includes(entityId)) return false;
          if (lowerKeywords.length > 0 && !lowerKeywords.some(k => ep.keywords.includes(k))) return false;
          return true;
        }).reverse(); // Most recent matching first
      }

      // Serialize memory for persistence
      snapshot() {
        return {
          citizenId: this.citizenId,
          maxEpisodes: this.maxEpisodes,
          chronos: this.chronos,
          nextEpisodeId: this.nextEpisodeId,
        };
      }

      // Deserialize memory from snapshot
      load(snapshot) {
        if (snapshot) {
          this.citizenId = snapshot.citizenId || this.citizenId;
          this.maxEpisodes = snapshot.maxEpisodes || this.maxEpisodes;
          this.chronos = snapshot.chronos || [];
          this.nextEpisodeId = snapshot.nextEpisodeId || (snapshot.chronos ? snapshot.chronos.length + 1 : 1);
        }
      }
    }

    Genesis.EpisodicMemory = EpisodicMemory;

    if (Genesis.GenesisKernel && typeof Genesis.GenesisKernel.registerSystem === 'function') {
      Genesis.GenesisKernel.registerSystem('citizen-memory', {
        name: 'Episodic Memory System',
        summary: () => ({ enabled: true, class: 'EpisodicMemory', instances: Genesis.EntityRegistry.find('citizen').filter(c => c.meta && c.meta.memory).length }),
      });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('citizen-memory', { status: 'candidate', path: './src/genesis/citizen-memory.js', gun: 'CM' });
    }
  }

  // Support both ES-module and inline-script consumption.
  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();