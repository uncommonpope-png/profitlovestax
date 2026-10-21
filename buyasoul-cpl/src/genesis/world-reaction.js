// world-reaction.js — Act VI BODY (P23/P77) — Mood -> World swap
// Flag-gated by window.__GENESIS_WORLD_REACTION (default OFF).
// When OFF this file is never imported and the legacy animate() if-chain runs
// EXACTLY as today — zero behavioral delta on the live floor.
//
// WHAT IT DOES:
//   Maps GSK mood/phase (the MIND) to a particle + shader preset on the BODY
//   (the Dark City). BODY reflects MIND; it NEVER inverts. The mapping is a
//   pure function mood -> preset; the city never drives GSK's mood.
//
// PRESETS (from the threejs-games Dark-City Component Kit study):
//   particles: rain | stars | snow | fire | smoke   (atmosphere)
//   shaders:   golden-flow | lava | voronoi | gradient | marble  (surface glow)
//
// CASCADE: a mood change is treated as an observation from the MIND; the
//   actual world swap is applied by the server (this module) only after the
//   CASCADE hook approves. Model proposes a mood; server decides the swap.
//
// THREE VERSION: vanilla r128/r160 compatible. Uses global THREE only.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.WorldReaction) return; // idempotent

    // Canonical mood -> { particles, shader } mapping. BODY reflects MIND.
    const MOOD_MAP = {
      joy:        { particles: 'stars',       shader: 'golden-flow' },
      transcend:  { particles: 'stars',       shader: 'gradient' },
      calm:       { particles: 'stars',       shader: 'marble' },
      neutral:    { particles: 'rain',        shader: 'voronoi' },
      somber:     { particles: 'rain',        shader: 'voronoi' },
      melancholy: { particles: 'rain',        shader: 'lava' },
      fear:       { particles: 'smoke',       shader: 'lava' },
      anger:      { particles: 'fire',        shader: 'lava' },
      wrath:      { particles: 'fire',        shader: 'lava' }
    };
    const DEFAULT_MOOD = 'neutral';

    let currentMood = DEFAULT_MOOD;
    let currentPreset = MOOD_MAP[DEFAULT_MOOD];
    let cascadeHook = null;     // (proposal) => boolean ; server decides
    const listeners = [];       // observer callbacks for Genesis reaction events
    let currentPLT = { profit: 0, love: 0, tax: 0 }; // Track overall PLT state

    function flagOn() {
      return (typeof window !== 'undefined') && window.__GENESIS_WORLD_REACTION === true;
    }

    // Resolve a mood/phase observation to a preset. Pure, deterministic.
    function presetFor(mood) {
      return MOOD_MAP[mood] || MOOD_MAP[DEFAULT_MOOD];
    }
    
    // Calculate global PLT mood based on all agent resource pools
    function calculatePLTMood(resourcePool) {
      if (!resourcePool || !resourcePool._pools || resourcePool._pools.size === 0) {
        currentPLT = { profit: 0, love: 0, tax: 0 }; // Reset
        return DEFAULT_MOOD;
      }

      let totalProfit = 0;
      let totalLove = 0;
      let totalTax = 0;
      let agentCount = 0;

      for (const p of resourcePool._pools.values()) {
        totalProfit += p.profit;
        totalLove += p.love;
        totalTax += p.tax;
        agentCount++;
      }

      if (agentCount === 0) {
        currentPLT = { profit: 0, love: 0, tax: 0 }; // Reset
        return DEFAULT_MOOD;
      }

      // Aggregate for currentPLT
      currentPLT = { profit: totalProfit, love: totalLove, tax: totalTax };

      // Simple heuristic for mood from aggregated PLT
      const netPLT = totalProfit + totalLove - totalTax;

      if (netPLT > 20) return 'joy';
      if (netPLT > 10) return 'calm';
      if (totalTax > totalProfit + totalLove && totalTax > 10) return 'wrath';
      if (netPLT < -10) return 'melancholy';
      return 'neutral';
    }

    // Apply the preset. In the sandbox this only mutates an in-memory preset
    // record; the live base is never touched. The host engine reads
    // WorldReaction.currentPreset() to swap its own particle/shader systems.
    function applyPreset(preset, mood) {
      currentMood = mood;
      currentPreset = preset;
      for (const fn of listeners) {
        try { fn({ mood: mood, particles: preset.particles, shader: preset.shader }); } catch (_) {}
      }
      // Emit a genesis:agent:reaction-style event if the bus is present.
      if (Genesis.AgentGateway && typeof Genesis.AgentGateway.emit === 'function') {
        try { Genesis.AgentGateway.emit('genesis:agent:reaction', { source: 'world-reaction', mood, preset }); } catch (_) {}
      }
    }

    const WorldReaction = {
      flag: '__GENESIS_WORLD_REACTION',
      isEnabled() { return flagOn(); },
      registerCascade(fn) { cascadeHook = (typeof fn === 'function') ? fn : null; return !!cascadeHook; },
      clearCascade() { cascadeHook = null; },
      onSwap(fn) { if (typeof fn === 'function') listeners.push(fn); },
      // MIND -> BODY. Call this with an observed GSK mood/phase. The model
      // PROPOSES; the server (CASCADE hook or default allow) DECIDES.
      observeMood(mood) {
        if (!mood || !MOOD_MAP[mood]) mood = DEFAULT_MOOD;
        const preset = presetFor(mood);
        let allowed = true;
        if (cascadeHook) {
          try { allowed = cascadeHook({ fromMood: currentMood, toMood: mood, preset }); } catch (_) { allowed = false; }
        }
        if (allowed) applyPreset(preset, mood);
        return allowed;
      },
      currentMood() { return currentMood; },
      currentPreset() { return currentPreset; },
      moodTable() { return Object.keys(MOOD_MAP); },
      currentPLT() { return currentPLT; }, // Expose current overall PLT state
      summary() {
        return {
          enabled: flagOn(),
          cascadeRegistered: !!cascadeHook,
          mood: currentMood,
          preset: currentPreset,
          observerCount: listeners.length,
          currentPLT: currentPLT // Include current PLT in summary
        };
      }
    };

    Genesis.WorldReaction = WorldReaction;

    // Reaction pass is best driven by the Scheduler after CitizenAI, so the
    // world reflects the mind in the same frame order as the legacy if-chain.
    if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
      Genesis.EngineScheduler.defineTick('world-reaction', function () {
        // Drive mood based on overall PLT state periodically
        if (Genesis.ResourcePool) {
          const newMood = calculatePLTMood(Genesis.ResourcePool);
          WorldReaction.observeMood(newMood);
        }
      }, function () { return flagOn(); });
    }
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('world-reaction', { status: 'candidate', path: './src/genesis/world-reaction.js', cascadeGuarded: true });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
