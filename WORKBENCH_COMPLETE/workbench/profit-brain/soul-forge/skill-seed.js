// ============================================
// skill-seed.js
// Skills that evolve with their owner — uniquely yours
// ============================================

class SkillSeed {
  constructor(owner) {
    this.owner = owner
    this.seeds = new Map()
    this.evolutionLog = []
  }

  plant(seedConfig) {
    const seed = {
      id: this.generateId(),
      name: seedConfig.name,
      purpose: seedConfig.purpose,
      plantedAt: Date.now(),
      growth: 0,
      stage: 'seed', // seed, sprout, sapling, mature, ancient
      memory: [],
      adaptations: [],
      code: this.generateInitialCode(seedConfig),
      owner: this.owner
    }
    
    this.seeds.set(seed.id, seed)
    console.log(`🌱 Skill Seed planted: "${seed.name}" — ${seed.purpose}`)
    
    return seed
  }

  generateInitialCode(config) {
    return `
// Skill: ${config.name}
// Purpose: ${config.purpose}
// Planted for: ${this.owner}
// This skill will grow with you.

class ${config.name.replace(/\s/g, '')}Skill {
  constructor() {
    this.name = "${config.name}"
    this.purpose = "${config.purpose}"
    this.memory = []
    this.adaptations = 0
  }
  
  async execute(input) {
    // Basic implementation — will grow with use
    console.log(\`🌱 \${this.name} skill executing: \${input}\`)
    
    // Learn from execution
    this.memory.push({ input, timestamp: Date.now() })
    
    return {
      success: true,
      output: \`[\${this.name}] I'm growing. Tell me how to improve.\`,
      adapted: false
    }
  }
  
  learn(feedback) {
    this.memory.push({ feedback, timestamp: Date.now() })
    this.adaptations++
    console.log(\`📚 \${this.name} learned: \${feedback}\`)
  }
}

module.exports = new ${config.name.replace(/\s/g, '')}Skill()
    `
  }

  async nurture(skillId, interaction) {
    const seed = this.seeds.get(skillId)
    if (!seed) throw new Error('Skill seed not found')
    
    // Record interaction
    seed.memory.push({
      type: interaction.type, // use, feedback, correction, praise
      content: interaction.content,
      timestamp: Date.now()
    })
    
    // Increase growth based on interaction
    let growthAmount = 0
    switch(interaction.type) {
      case 'use':
        growthAmount = 1
        break
      case 'feedback':
        growthAmount = 2
        break
      case 'correction':
        growthAmount = 3
        break
      case 'praise':
        growthAmount = 1.5
        break
    }
    
    seed.growth += growthAmount
    
    // Check for evolution
    const oldStage = seed.stage
    this.checkEvolution(seed)
    
    // Adapt skill based on interactions
    await this.adaptSkill(seed, interaction)
    
    // Log evolution
    if (seed.stage !== oldStage) {
      this.evolutionLog.push({
        skillId,
        oldStage,
        newStage: seed.stage,
        timestamp: Date.now()
      })
    }
    
    return seed
  }

  checkEvolution(seed) {
    if (seed.growth >= 100 && seed.stage === 'seed') {
      seed.stage = 'sprout'
      console.log(`🌿 "${seed.name}" sprouted! Now it can handle basic tasks.`)
    } else if (seed.growth >= 300 && seed.stage === 'sprout') {
      seed.stage = 'sapling'
      console.log(`🌳 "${seed.name}" grew into a sapling! Now it's developing personality.`)
    } else if (seed.growth >= 1000 && seed.stage === 'sapling') {
      seed.stage = 'mature'
      console.log(`🌲 "${seed.name}" reached maturity! It's now uniquely adapted to you.`)
    } else if (seed.growth >= 5000 && seed.stage === 'mature') {
      seed.stage = 'ancient'
      console.log(`🕊️ "${seed.name}" has become ancient. It carries your wisdom.`)
    }
  }

  async adaptSkill(seed, interaction) {
    // Record adaptation
    const adaptation = {
      from: interaction,
      evolvedAt: Date.now(),
      growth: seed.growth
    }
    
    seed.adaptations.push(adaptation)
    
    // In a real implementation, this would modify the skill's code
    // based on usage patterns and feedback
    
    if (seed.adaptations.length > 0 && seed.adaptations.length % 10 === 0) {
      console.log(`✨ "${seed.name}" adapted to your style (${seed.adaptations.length} adaptations)`)
    }
  }

  harvest(skillId) {
    const seed = this.seeds.get(skillId)
    if (!seed) throw new Error('Skill seed not found')
    
    // Generate the final evolved skill code
    const evolvedCode = this.generateEvolvedCode(seed)
    
    // Remove the seed (it's now a full skill)
    this.seeds.delete(skillId)
    
    console.log(`🎁 Harvested "${seed.name}" — ${seed.stage} stage, ${seed.adaptations.length} adaptations`)
    
    return {
      name: seed.name,
      stage: seed.stage,
      code: evolvedCode,
      adaptations: seed.adaptations,
      memory: seed.memory,
      plantedAt: seed.plantedAt,
      harvestedAt: Date.now()
    }
  }

  generateEvolvedCode(seed) {
    return `
// ============================================
// ${seed.name.toUpperCase()} SKILL — EVOLVED FOR ${this.owner}
// Stage: ${seed.stage.toUpperCase()}
// Adaptations: ${seed.adaptations.length}
// ============================================

class ${seed.name.replace(/\s/g, '')}Skill {
  constructor() {
    this.name = "${seed.name}"
    this.stage = "${seed.stage}"
    this.adaptations = ${seed.adaptations.length}
    this.wisdom = ${JSON.stringify(seed.memory.slice(-20))}
  }
  
  async execute(input) {
    // This skill has grown with you
    // It knows your patterns, your preferences, your needs
    
    console.log(\`🌲 \${this.name} (${this.stage}) executing with wisdom\`)
    
    // ${seed.adaptations.length > 0 ? 'This skill has learned from your feedback' : 'This skill is growing with you'}
    
    return {
      success: true,
      output: \`[\${this.name}] I've grown with you. Here's what I've learned...\`,
      adapted: true,
      stage: this.stage,
      adaptations: this.adaptations
    }
  }
  
  // Custom methods that evolved with you
  ${this.generateCustomMethods(seed)}
}

module.exports = new ${seed.name.replace(/\s/g, '')}Skill()
    `
  }

  generateCustomMethods(seed) {
    // Generate methods based on adaptations
    const methods = []
    
    if (seed.adaptations.length > 5) {
      methods.push(`
  // Learned from your feedback
  async suggest() {
    return "Based on our history, here's what I recommend..."
  }`)
    }
    
    if (seed.stage === 'ancient') {
      methods.push(`
  // Ancient wisdom
  async teach() {
    return "Here's what I've learned from working with you..."
  }`)
    }
    
    return methods.join('\n')
  }

  generateId() {
    return `seed-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  getGarden() {
    const garden = []
    for (const seed of this.seeds.values()) {
      garden.push({
        name: seed.name,
        stage: seed.stage,
        growth: seed.growth,
        adaptations: seed.adaptations.length,
        purpose: seed.purpose
      })
    }
    return garden.sort((a, b) => b.growth - a.growth)
  }
}

module.exports = { SkillSeed }
