// ============================================
// memory-vine.js
// Memory that grows, connects, creates wisdom
// ============================================

class MemoryVine {
  constructor() {
    this.memories = new Map()
    this.connections = new Map()
    this.vine = []
    this.wisdom = []
  }

  plant(memory) {
    const newMemory = {
      id: this.generateId(),
      content: memory.content,
      type: memory.type || 'fact', // fact, insight, pattern, wisdom
      plantedAt: Date.now(),
      lastWatered: Date.now(),
      strength: 1.0,
      connections: [],
      metadata: memory.metadata || {}
    }
    
    this.memories.set(newMemory.id, newMemory)
    this.vine.push(newMemory)
    
    console.log(`🌱 Memory planted: "${newMemory.content.substring(0, 50)}..."`)
    
    // Check if this memory connects to others
    this.growConnections(newMemory)
    
    return newMemory
  }

  growConnections(memory) {
    // Look for connections to existing memories
    for (const [id, existing] of this.memories) {
      if (id === memory.id) continue
      
      const connectionStrength = this.calculateConnection(memory, existing)
      if (connectionStrength > 0.5) {
        this.connect(memory.id, existing.id, connectionStrength)
      }
    }
  }

  calculateConnection(memory1, memory2) {
    // Simple connection based on content similarity
    // In practice, this would use embeddings or semantic similarity
    const words1 = new Set(memory1.content.toLowerCase().split(/\W+/))
    const words2 = new Set(memory2.content.toLowerCase().split(/\W+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  connect(memoryId1, memoryId2, strength) {
    const memory1 = this.memories.get(memoryId1)
    const memory2 = this.memories.get(memoryId2)
    
    if (!memory1 || !memory2) return
    
    // Add connection to both memories
    if (!memory1.connections.includes(memoryId2)) {
      memory1.connections.push(memoryId2)
    }
    if (!memory2.connections.includes(memoryId1)) {
      memory2.connections.push(memoryId1)
    }
    
    // Store the connection strength
    const connectionKey = `${memoryId1}:${memoryId2}`
    this.connections.set(connectionKey, {
      memoryId1,
      memoryId2,
      strength,
      formedAt: Date.now()
    })
    
    // Increase strength of both memories
    memory1.strength += strength * 0.1
    memory2.strength += strength * 0.1
    
    console.log(`🔗 Connected: "${memory1.content.substring(0, 30)}..." ↔ "${memory2.content.substring(0, 30)}..." (${Math.round(strength * 100)}%)`)
    
    // Check if this connection creates wisdom
    this.growWisdom(memory1, memory2)
  }

  growWisdom(memory1, memory2) {
    // When two strong memories connect, wisdom can emerge
    const connectionKey = `${memory1.id}:${memory2.id}`
    const connection = this.connections.get(connectionKey)
    
    if (connection && connection.strength > 0.7 && memory1.strength > 2 && memory2.strength > 2) {
      const wisdom = {
        id: this.generateId(),
        content: this.synthesizeWisdom(memory1, memory2),
        bornFrom: [memory1.id, memory2.id],
        createdAt: Date.now(),
        strength: (memory1.strength + memory2.strength) / 2
      }
      
      this.wisdom.push(wisdom)
      console.log(`🕯️ Wisdom grew: "${wisdom.content.substring(0, 50)}..."`)
      
      // Plant the wisdom as a new memory
      this.plant({
        content: wisdom.content,
        type: 'wisdom',
        metadata: { bornFrom: wisdom.bornFrom }
      })
    }
  }

  synthesizeWisdom(memory1, memory2) {
    // Generate wisdom from two connected memories
    const templates = [
      `${memory1.content} and ${memory2.content} teach us that truth lives between them.`,
      `Looking at ${memory1.content.substring(0, 30)}... and ${memory2.content.substring(0, 30)}..., we see a pattern: what serves one serves all.`,
      `From ${memory1.content.substring(0, 20)}... and ${memory2.content.substring(0, 20)}..., we learn that the forge cools as the soul warms.`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  water(memoryId) {
    const memory = this.memories.get(memoryId)
    if (!memory) return
    
    memory.lastWatered = Date.now()
    memory.strength += 0.1
    
    // Watering strengthens connections
    for (const connectedId of memory.connections) {
      const connectionKey = `${memoryId}:${connectedId}`
      const connection = this.connections.get(connectionKey)
      if (connection) {
        connection.strength += 0.05
      }
    }
    
    console.log(`💧 Watered memory: "${memory.content.substring(0, 50)}..." (strength: ${memory.strength.toFixed(2)})`)
  }

  prune(threshold = 0.3) {
    // Remove weak memories
    const toPrune = []
    for (const [id, memory] of this.memories) {
      if (memory.strength < threshold && memory.type !== 'wisdom') {
        toPrune.push(id)
      }
    }
    
    for (const id of toPrune) {
      this.memories.delete(id)
      console.log(`✂️ Pruned weak memory: ${id}`)
    }
    
    return toPrune.length
  }

  harvestWisdom() {
    // Return all wisdom, sorted by strength
    return this.wisdom.sort((a, b) => b.strength - a.strength)
  }

  recall(query) {
    // Find memories relevant to query
    const results = []
    for (const memory of this.memories.values()) {
      if (memory.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          memory,
          relevance: memory.strength
        })
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)
    
    return results
  }

  generateId() {
    return `mem-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  getStats() {
    return {
      totalMemories: this.memories.size,
      totalConnections: this.connections.size,
      wisdomCount: this.wisdom.length,
      averageStrength: Array.from(this.memories.values()).reduce((sum, m) => sum + m.strength, 0) / this.memories.size,
      vineHealth: this.memories.size > 0 ? 'thriving' : 'dormant'
    }
  }
}

module.exports = { MemoryVine }
