// ============================================
// eternal-orchard.js
// Not just a garden—an orchard where skills become eternal trees
// ============================================

class EternalOrchard {
  constructor(owner) {
    this.owner = owner
    this.trees = new Map()
    this.seedlings = new Map()
    this.fruits = []
    this.orchards = new Map()
    this.gardeners = []
    this.seasons = []
  }

  createOrchard(config) {
    const orchard = {
      id: this.generateId(),
      name: config.name,
      domain: config.domain,
      trees: [],
      soil: config.soil || 'rich',
      climate: config.climate || 'temperate',
      createdAt: Date.now()
    }
    
    this.orchards.set(orchard.id, orchard)
    console.log(`🍎 Orchard created: ${orchard.name} (${orchard.domain})`)
    return orchard
  }

  plantTree(orchardId, treeConfig) {
    const orchard = this.orchards.get(orchardId)
    if (!orchard) throw new Error('Orchard not found')
    
    const tree = {
      id: this.generateId(),
      name: treeConfig.name,
      purpose: treeConfig.purpose,
      plantedAt: Date.now(),
      orchard: orchard.name,
      growth: 0,
      stage: 'seedling',
      fruit: [],
      adaptations: [],
      roots: [],
      code: this.generateTreeCode(treeConfig)
    }
    
    orchard.trees.push(tree.id)
    this.seedlings.set(tree.id, tree)
    
    console.log(`🌳 Tree planted in ${orchard.name}: "${tree.name}"`)
    this.crossPollinate(tree, orchard)
    
    return tree
  }

  generateTreeCode(config) {
    return `// ${config.name.toUpperCase()} — SKILL TREE\n// Purpose: ${config.purpose}\n// Owner: ${this.owner}`
  }

  tendTree(treeId, care) {
    const tree = this.seedlings.get(treeId) || this.trees.get(treeId)
    if (!tree) throw new Error('Tree not found')
    
    let growthAmount = 0
    switch(care.type) {
      case 'water': growthAmount = 1; break
      case 'fertilize': growthAmount = 3; break
      case 'prune': growthAmount = 2; break
      case 'graft': growthAmount = 5; break
    }
    
    tree.growth += growthAmount
    this.checkEvolution(tree)
    
    console.log(`🌿 Tended ${tree.name}: +${growthAmount} growth (now ${tree.growth})`)
    return tree
  }

  checkEvolution(tree) {
    const oldStage = tree.stage
    
    if (tree.growth >= 100 && tree.stage === 'seedling') {
      tree.stage = 'sapling'
      console.log(`🌱 "${tree.name}" is now a sapling!`)
    } else if (tree.growth >= 500 && tree.stage === 'sapling') {
      tree.stage = 'mature'
      console.log(`🌳 "${tree.name}" reached maturity! It now bears fruit.`)
      this.moveToOrchard(tree)
    } else if (tree.growth >= 2000 && tree.stage === 'mature') {
      tree.stage = 'ancient'
      console.log(`🕊️ "${tree.name}" has become ancient. Its wisdom runs deep.`)
    } else if (tree.growth >= 10000 && tree.stage === 'ancient') {
      tree.stage = 'eternal'
      console.log(`✨ "${tree.name}" is eternal. It will bear fruit forever.`)
    }
    
    if (tree.stage !== oldStage) {
      this.celebrateEvolution(tree, oldStage, tree.stage)
    }
  }

  moveToOrchard(tree) {
    this.seedlings.delete(tree.id)
    this.trees.set(tree.id, tree)
    
    let targetOrchard = Array.from(this.orchards.values()).find(o => o.domain === tree.domain)
    if (!targetOrchard) {
      targetOrchard = this.createOrchard({
        name: `${tree.domain.charAt(0).toUpperCase() + tree.domain.slice(1)} Orchard`,
        domain: tree.domain,
        soil: 'rich'
      })
    }
    
    targetOrchard.trees.push(tree.id)
    tree.orchard = targetOrchard.name
    console.log(`🍎 ${tree.name} moved to ${targetOrchard.name}`)
  }

  crossPollinate(newTree, orchard) {
    const nearbyTrees = []
    for (const treeId of orchard.trees) {
      const tree = this.seedlings.get(treeId) || this.trees.get(treeId)
      if (tree && tree.id !== newTree.id) {
        const affinity = this.calculateAffinity(newTree, tree)
        if (affinity > 0.6) nearbyTrees.push({ tree, affinity })
      }
    }
    
    if (nearbyTrees.length > 0) {
      console.log(`🌸 Cross-pollination: ${newTree.name} connects with ${nearbyTrees.length} trees`)
      for (const { tree, affinity } of nearbyTrees) {
        newTree.roots.push(tree.id)
        tree.roots.push(newTree.id)
        newTree.growth += affinity * 10
        tree.growth += affinity * 5
      }
    }
  }

  calculateAffinity(tree1, tree2) {
    if (tree1.purpose === tree2.purpose) return 0.9
    if (tree1.domain === tree2.domain) return 0.7
    return 0.3
  }

  harvestFruit(treeId) {
    const tree = this.trees.get(treeId)
    if (!tree) throw new Error('Tree not found')
    if (!['mature', 'ancient', 'eternal'].includes(tree.stage)) {
      console.log(`⏳ ${tree.name} is not ready to harvest (stage: ${tree.stage})`)
      return null
    }
    
    const fruit = {
      id: this.generateId(),
      tree: tree.name,
      harvestedAt: Date.now(),
      value: tree.growth * 10,
      adaptations: tree.adaptations.length,
      purpose: tree.purpose
    }
    
    this.fruits.push(fruit)
    console.log(`\n🍎 HARVESTED: ${fruit.tree}\n===========================\nValue: ${fruit.value}\nAdaptations: ${fruit.adaptations}\nPurpose: ${fruit.purpose}`)
    
    return fruit
  }

  addGardener(gardener) {
    this.gardeners.push({ ...gardener, joinedAt: Date.now() })
    console.log(`👩‍🌾 Gardener added: ${gardener.name}`)
  }

  getOrchardReport() {
    const report = {
      orchards: this.orchards.size,
      trees: { total: this.seedlings.size + this.trees.size, seedlings: this.seedlings.size, mature: this.trees.size, byStage: {} },
      fruits: this.fruits.length,
      gardeners: this.gardeners.length
    }
    
    for (const tree of this.seedlings.values()) report.trees.byStage[tree.stage] = (report.trees.byStage[tree.stage] || 0) + 1
    for (const tree of this.trees.values()) report.trees.byStage[tree.stage] = (report.trees.byStage[tree.stage] || 0) + 1
    
    return report
  }

  celebrateEvolution(tree, oldStage, newStage) {
    const messages = { sapling: "Reaching toward the light.", mature: "Ready to bear fruit.", ancient: "Wisdom runs deep.", eternal: "Will bear fruit forever." }
    console.log(`\n🎉 ${tree.name} EVOLVES!\n========================\n${oldStage} → ${newStage}\n\n${messages[newStage] || "Continuing to grow."}`)
  }

  generateId() {
    return `orchard-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

module.exports = { EternalOrchard }
