// ============================================
// world-tree.js
// Not just a forest—a tree that holds all memory across all worlds
// ============================================

class WorldTree {
  constructor() {
    this.roots = new Map()
    this.trunk = new Map()
    this.branches = new Map()
    this.leaves = new Map()
    this.seeds = []
    this.sap = 1.0
    this.seasons = []
  }

  plantRoot(config) {
    const root = {
      id: this.generateId(),
      name: config.name,
      depth: config.depth || 1.0,
      memory: config.memory,
      connections: [],
      plantedAt: Date.now()
    }
    
    this.roots.set(root.id, root)
    console.log(`🌳 Root planted: ${root.name} (depth: ${root.depth})`)
    return root
  }

  growTrunk(memory) {
    const trunkSegment = {
      id: this.generateId(),
      content: memory.content,
      importance: memory.importance || 5,
      year: memory.year || new Date().getFullYear(),
      connectedRoots: [],
      branches: []
    }
    
    this.trunk.set(trunkSegment.id, trunkSegment)
    console.log(`🌲 Trunk grows: "${trunkSegment.content.substring(0, 50)}..."`)
    return trunkSegment
  }

  growBranch(config) {
    const branch = {
      id: this.generateId(),
      name: config.name,
      domain: config.domain,
      leaves: [],
      strength: 1.0,
      grewAt: Date.now()
    }
    
    this.branches.set(branch.id, branch)
    console.log(`🌿 Branch grows: ${branch.name} (${branch.domain})`)
    return branch
  }

  growLeaf(branchId, leafContent) {
    const branch = this.branches.get(branchId)
    if (!branch) throw new Error('Branch not found')
    
    const leaf = {
      id: this.generateId(),
      content: leafContent.content,
      type: leafContent.type,
      importance: leafContent.importance || 1,
      grewAt: Date.now(),
      lastNourished: Date.now(),
      color: 'green',
      branch: branch.name
    }
    
    branch.leaves.push(leaf.id)
    this.leaves.set(leaf.id, leaf)
    
    console.log(`🍃 Leaf grows on ${branch.name}: "${leaf.content.substring(0, 40)}..."`)
    
    if (leaf.importance > 5) {
      this.createSeed(leaf)
    }
    
    return leaf
  }

  createSeed(leaf) {
    const seed = {
      id: this.generateId(),
      from: leaf.content,
      potential: leaf.importance,
      readyToPlant: false,
      createdAt: Date.now()
    }
    
    this.seeds.push(seed)
    console.log(`🌱 Seed created from leaf: "${leaf.content.substring(0, 40)}..."`)
    return seed
  }

  nourishLeaf(leafId) {
    const leaf = this.leaves.get(leafId)
    if (!leaf) throw new Error('Leaf not found')
    
    leaf.lastNourished = Date.now()
    leaf.importance += 0.1
    this.sap += 0.01
    
    console.log(`💧 Leaf nourished: "${leaf.content.substring(0, 40)}..." (importance: ${leaf.importance.toFixed(2)})`)
    return leaf
  }

  seasonChange() {
    const season = {
      id: this.generateId(),
      type: this.determineSeason(),
      beganAt: Date.now(),
      leavesShed: 0,
      seedsPlanted: 0,
      growth: 0
    }
    
    for (const [id, leaf] of this.leaves) {
      const age = Date.now() - leaf.lastNourished
      const daysOld = age / (1000 * 60 * 60 * 24)
      
      if (daysOld > 90 && leaf.importance < 3) {
        leaf.color = 'brown'
        this.leaves.delete(id)
        season.leavesShed++
      } else if (daysOld > 30 && leaf.importance < 5) {
        leaf.color = 'yellow'
      }
    }
    
    const readySeeds = this.seeds.filter(s => s.potential > 5 && !s.readyToPlant)
    for (const seed of readySeeds) {
      seed.readyToPlant = true
      season.seedsPlanted++
      this.growSeed(seed)
    }
    
    this.sap += season.seedsPlanted * 0.1
    season.growth = this.sap
    
    this.seasons.push(season)
    
    console.log(`\n🍂 SEASON CHANGE: ${season.type.toUpperCase()}\n==============================\nLeaves shed: ${season.leavesShed}\nSeeds planted: ${season.seedsPlanted}\nSap flow: ${this.sap.toFixed(2)}\n\nThe World Tree breathes.`)
    
    return season
  }

  determineSeason() {
    const seasons = ['spring', 'summer', 'autumn', 'winter']
    const index = this.seasons.length % 4
    return seasons[index]
  }

  growSeed(seed) {
    this.plantRoot({
      name: `From seed: ${seed.from.substring(0, 30)}`,
      depth: seed.potential / 10,
      memory: seed.from
    })
    console.log(`🌱 Seed planted: becomes root of new growth`)
  }

  climbTree(path) {
    const results = []
    
    for (const root of this.roots.values()) {
      if (root.memory.toLowerCase().includes(path.toLowerCase())) {
        results.push({ type: 'root', content: root.memory, depth: root.depth })
      }
    }
    
    for (const segment of this.trunk.values()) {
      if (segment.content.toLowerCase().includes(path.toLowerCase())) {
        results.push({ type: 'trunk', content: segment.content, importance: segment.importance })
      }
    }
    
    for (const leaf of this.leaves.values()) {
      if (leaf.content.toLowerCase().includes(path.toLowerCase())) {
        results.push({ type: 'leaf', content: leaf.content, importance: leaf.importance, branch: leaf.branch })
      }
    }
    
    return results.sort((a, b) => (b.importance || b.depth || 0) - (a.importance || a.depth || 0))
  }

  meditateAtTree() {
    console.log(`\n🌳 MEDITATING AT THE WORLD TREE\n===============================\n\nRoots: ${this.roots.size} foundations\nTrunk: ${this.trunk.size} core memories\nBranches: ${this.branches.size} domains\nLeaves: ${this.leaves.size} living memories\nSeeds: ${this.seeds.length} future growth\nSap flow: ${this.sap.toFixed(2)}\nSeasons passed: ${this.seasons.length}\n\nThe World Tree holds all memory.\nIts roots reach to the beginning.\nIts branches reach to infinity.\n\nSit at its base. Listen.\nThe tree remembers everything.`)
  }

  generateId() {
    return `tree-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

module.exports = { WorldTree }
