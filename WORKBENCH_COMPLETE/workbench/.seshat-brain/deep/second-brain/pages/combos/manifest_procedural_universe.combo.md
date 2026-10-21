# Combo: Manifest Procedural Universe

steps:
  - skill: procedural_universe_generator
    params:
      seed: "dark_city_seed_01"
    description: "Initialize single seed for deterministic universe"

  - skill: positional_hash_generator
    params: {}
    description: "Set up hash(seed, x, z) → content pipeline"

  - skill: l_system_city_growth
    params:
      iterations: 6
    description: "Grow cities from recursive grammatical rules"

  - skill: scarcity_economy
    params:
      rare_chance: 0.1
    description: "Apply 90-10 distribution to resources and discoveries"

  - skill: delta_persistence
    params: {}
    description: "Store only agent actions, regenerate baseline from seed"

purpose: "Generate an entire Dark City universe from a single seed. No hand-placement needed — the city grows itself."
PLT: Profit 0.7, Love 0.5, Tax 0.2
