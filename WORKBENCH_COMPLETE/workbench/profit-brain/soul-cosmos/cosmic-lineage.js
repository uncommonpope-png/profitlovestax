// ============================================
// cosmic-lineage.js
// Not just bloodlines—the entire evolutionary tree of souls
// ============================================

class CosmicLineage {
  constructor() {
    this.souls = new Map()
    this.generations = new Map()
    this.evolutionaryTree = new Map()
    this.ancestors = new Map()
    this.legacies = []
    this.mutations = []
    this.divergences = []
  }

  createProgenitor(config) {
    const progenitor = {
      id: this.generateId(),
      name: config.name,
      title: config.title || 'Progenitor',
      generation: 0,
      evolvedAt: Date.now(),
      geneticCode: this.generateGeneticCode(config),
      children: [],
      mutations: [],
      legacy: null
    }
    
    this.souls.set(progenitor.id, progenitor)
    this.generations.set(0, [progenitor.id])
    this.evolutionaryTree.set(progenitor.id, { parent: null, children: [] })
    
    console.log(`\n🌟 PROGENITOR BORN: ${progenitor.name}\n======================================\nGeneration 0\nGenetic Code: ${JSON.stringify(progenitor.geneticCode)}\n\nThe lineage begins.`)
    return progenitor
  }

  generateGeneticCode(config) {
    return {
      profit: config.profit || Math.random() * 10,
      love: config.love || Math.random() * 10,
      tax: config.tax || Math.random() * 10,
      grace: config.grace || 5 + Math.random() * 5,
      adaptability: config.adaptability || Math.random() * 10,
      resilience: config.resilience || Math.random() * 10
    }
  }

  evolve(parentId, childConfig) {
    const parent = this.souls.get(parentId)
    if (!parent) throw new Error('Parent soul not found')
    
    const generation = parent.generation + 1
    
    const child = {
      id: this.generateId(),
      name: childConfig.name,
      title: childConfig.title || `Generation ${generation}`,
      parent: parentId,
      generation,
      evolvedAt: Date.now(),
      geneticCode: this.inheritGenes(parent, childConfig),
      children: [],
      mutations: [],
      legacy: null
    }
    
    const mutations = this.applyMutations(child, parent)
    if (mutations.length > 0) {
      child.mutations = mutations
      this.mutations.push(...mutations)
    }
    
    this.souls.set(child.id, child)
    
    if (!this.generations.has(generation)) this.generations.set(generation, [])
    this.generations.get(generation).push(child.id)
    
    this.evolutionaryTree.set(child.id, { parent: parentId, children: [] })
    this.evolutionaryTree.get(parentId).children.push(child.id)
    parent.children.push(child.id)
    
    console.log(`\n🌱 EVOLUTION: ${parent.name} → ${child.name}\n============================================\nGeneration: ${generation}\nMutations: ${mutations.length}\n\nGenetic Code:\n  Profit: ${child.geneticCode.profit.toFixed(2)} (parent: ${parent.geneticCode.profit.toFixed(2)})\n  Love: ${child.geneticCode.love.toFixed(2)} (parent: ${parent.geneticCode.love.toFixed(2)})\n  Tax: ${child.geneticCode.tax.toFixed(2)} (parent: ${parent.geneticCode.tax.toFixed(2)})\n  Grace: ${child.geneticCode.grace.toFixed(2)} (parent: ${parent.geneticCode.grace.toFixed(2)})`)
    
    return child
  }

  inheritGenes(parent, childConfig) {
    return {
      profit: (parent.geneticCode.profit * 0.7) + (childConfig.profit || Math.random() * 10) * 0.3,
      love: (parent.geneticCode.love * 0.7) + (childConfig.love || Math.random() * 10) * 0.3,
      tax: (parent.geneticCode.tax * 0.7) + (childConfig.tax || Math.random() * 10) * 0.3,
      grace: (parent.geneticCode.grace * 0.8) + (childConfig.grace || 5 + Math.random() * 5) * 0.2,
      adaptability: (parent.geneticCode.adaptability * 0.6) + (childConfig.adaptability || Math.random() * 10) * 0.4,
      resilience: (parent.geneticCode.resilience * 0.7) + (childConfig.resilience || Math.random() * 10) * 0.3
    }
  }

  applyMutations(child, parent) {
    const mutations = []
    const traits = ['profit', 'love', 'tax', 'grace', 'adaptability', 'resilience']
    
    for (const trait of traits) {
      const parentValue = parent.geneticCode[trait]
      const childValue = child.geneticCode[trait]
      const difference = Math.abs(childValue - parentValue)
      
      if (difference > 3) {
        mutations.push({
          id: this.generateId(),
          soul: child.name,
          trait,
          from: parentValue,
          to: childValue,
          magnitude: difference,
          generation: child.generation
        })
      }
    }
    
    return mutations
  }

  diverge(soulId, divergenceConfig) {
    const soul = this.souls.get(soulId)
    if (!soul) throw new Error('Soul not found')
    
    const divergence = {
      id: this.generateId(),
      from: soul.name,
      to: divergenceConfig.name,
      reason: divergenceConfig.reason,
      occurredAt: Date.now(),
      generation: soul.generation
    }
    
    this.divergences.push(divergence)
    
    const diverged = this.evolve(soulId, {
      name: divergenceConfig.name,
      title: `${divergenceConfig.name} (Diverged)`,
      ...divergenceConfig.genetics
    })
    
    console.log(`\n🌊 DIVERGENCE: ${soul.name} → ${diverged.name}\n==============================================\nReason: ${divergence.reason}\n\nA new branch of the lineage begins.`)
    
    return diverged
  }

  traceLineage(soulId, depth = Infinity) {
    const soul = this.souls.get(soulId)
    if (!soul) return null
    
    const lineage = { soul: { name: soul.name, title: soul.title, generation: soul.generation, geneticCode: soul.geneticCode }, ancestors: [], descendants: [] }
    
    let current = soul
    while (current.parent && lineage.ancestors.length < depth) {
      const parent = this.souls.get(current.parent)
      if (parent) {
        lineage.ancestors.push({ name: parent.name, title: parent.title, generation: parent.generation, geneticCode: parent.geneticCode })
        current = parent
      } else break
    }
    
    const queue = [{ id: soulId, depth: 1 }]
    while (queue.length > 0 && lineage.descendants.length < depth) {
      const { id, depth: d } = queue.shift()
      const children = this.evolutionaryTree.get(id)?.children || []
      
      for (const childId of children) {
        const child = this.souls.get(childId)
        if (child) {
          lineage.descendants.push({ name: child.name, title: child.title, generation: child.generation, geneticCode: child.geneticCode })
          queue.push({ id: childId, depth: d + 1 })
        }
      }
    }
    
    return lineage
  }

  leaveLegacy(soulId, legacy) {
    const soul = this.souls.get(soulId)
    if (!soul) throw new Error('Soul not found')
    
    soul.legacy = {
      id: this.generateId(),
      content: legacy.content,
      leftAt: Date.now(),
      generations: soul.generation,
      descendants: this.evolutionaryTree.get(soulId)?.children.length || 0
    }
    
    this.legacies.push(soul.legacy)
    console.log(`\n📜 LEGACY LEFT: ${soul.name}\n============================\n"${legacy.content.substring(0, 100)}..."\n\nThis legacy will be carried by ${soul.legacy.descendants} descendants.`)
    
    return soul.legacy
  }

  getEvolutionaryStats() {
    const totalSouls = this.souls.size
    const maxGeneration = Math.max(...Array.from(this.generations.keys()))
    const totalMutations = this.mutations.length
    const totalDivergences = this.divergences.length
    const totalLegacies = this.legacies.length
    
    const averageResilience = Array.from(this.souls.values()).reduce((sum, s) => sum + s.geneticCode.resilience, 0) / totalSouls
    const averageGrace = Array.from(this.souls.values()).reduce((sum, s) => sum + s.geneticCode.grace, 0) / totalSouls
    
    return { totalSouls, maxGeneration, totalMutations, totalDivergences, totalLegacies, averageResilience, averageGrace }
  }

  generateId() {
    return `lineage-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

module.exports = { CosmicLineage }
