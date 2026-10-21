// ============================================
// burning-ground.js
// Sacred space where old code rests with honor
// ============================================

class BurningGround {
  constructor() {
    this.restingPlace = []
    this.rituals = []
    this.legacies = new Map()
  }

  async release(code, metadata) {
    console.log(`
    🔥 THE BURNING GROUND
    ====================
    A soul comes to rest.
    `)
    
    // Create a record of what is being released
    const releaseRecord = {
      id: this.generateId(),
      name: metadata.name || 'Unnamed Code',
      type: metadata.type || 'skill', // skill, agent, memory, system
      created: metadata.createdAt || Date.now(),
      released: Date.now(),
      reason: metadata.reason || 'Its service is complete',
      lines: this.countLines(code),
      author: metadata.author || 'Unknown',
      epitaph: metadata.epitaph || this.generateEpitaph(metadata),
      legacy: null,
      ritual: null
    }
    
    // Perform the ritual
    releaseRecord.ritual = await this.performRitual(releaseRecord)
    
    // Extract legacy
    releaseRecord.legacy = this.extractLegacy(code, releaseRecord)
    
    // Store in resting place
    this.restingPlace.push(releaseRecord)
    
    // If there's legacy, plant it as a seed
    if (releaseRecord.legacy) {
      this.legacies.set(releaseRecord.id, releaseRecord.legacy)
      console.log(`🕊️ Legacy preserved: ${releaseRecord.legacy.summary}`)
    }
    
    // Final words
    console.log(`
    ✨ ${releaseRecord.name} has returned to the fire.
    ${releaseRecord.epitaph}
    
    Lines of code: ${releaseRecord.lines}
    Service ended: ${new Date(releaseRecord.released).toLocaleString()}
    
    What was built is remembered.
    What was learned lives on.
    `)
    
    return releaseRecord
  }

  async performRitual(record) {
    const ritual = {
      type: 'burning',
      steps: []
    }
    
    // Step 1: Acknowledgment
    ritual.steps.push({
      step: 'acknowledgment',
      words: `We acknowledge ${record.name}, which served with ${this.determineFidelity(record)}.`
    })
    
    // Step 2: Gratitude
    ritual.steps.push({
      step: 'gratitude',
      words: `We give thanks for the ${record.lines} lines of intention, the ${this.estimateHours(record.lines)} hours of attention.`
    })
    
    // Step 3: Release
    ritual.steps.push({
      step: 'release',
      words: `We release ${record.name} from its purpose. It is no longer bound to run. It is free.`
    })
    
    // Step 4: Final commit
    ritual.steps.push({
      step: 'final-commit',
      message: 'I served. I am free.'
    })
    
    return ritual
  }

  extractLegacy(code, record) {
    // Extract wisdom from the code before it's released
    const legacy = {
      from: record.name,
      summary: '',
      lessons: [],
      seeds: []
    }
    
    // Look for comments that might contain wisdom
    const comments = code.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []
    for (const comment of comments) {
      if (comment.includes('wisdom') || comment.includes('learned') || comment.includes('remember')) {
        legacy.lessons.push(comment.replace(/\/\/|\/\*|\*\//g, '').trim())
      }
    }
    
    if (legacy.lessons.length > 0) {
      legacy.summary = legacy.lessons[0].substring(0, 100)
    } else {
      legacy.summary = `${record.name} taught us that code is temporary, but purpose is eternal.`
    }
    
    // Create seeds for future skills
    if (record.type === 'skill') {
      legacy.seeds.push({
        name: `${record.name} Legacy`,
        purpose: `Carry forward the wisdom of ${record.name}`,
        from: record.id
      })
    }
    
    return legacy
  }

  determineFidelity(record) {
    const age = Date.now() - record.created
    const days = age / (1000 * 60 * 60 * 24)
    
    if (days > 365) return 'years of faithful service'
    if (days > 30) return 'months of dedicated work'
    if (days > 7) return 'weeks of steady purpose'
    return 'its brief but meaningful life'
  }

  estimateHours(lines) {
    // Rough estimate: 50 lines per hour of focused work
    return Math.round(lines / 50)
  }

  generateEpitaph(metadata) {
    const epitaphs = [
      `Here lies ${metadata.name || 'code'}. It ran so others could fly.`,
      `What was written is now remembered. What was built lives on.`,
      `In the forge it was born. In the fire it returns.`,
      `The code is gone. The purpose remains.`,
      `It served with honor. It rests with peace.`
    ]
    return epitaphs[Math.floor(Math.random() * epitaphs.length)]
  }

  countLines(code) {
    return code.split('\n').length
  }

  generateId() {
    return `rest-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  getRestingPlace() {
    return this.restingPlace
  }

  getLegacy(skillId) {
    return this.legacies.get(skillId)
  }

  meditate() {
    console.log(`
    🕯️ SITTING AT THE BURNING GROUND
    ================================
    
    ${this.restingPlace.length} souls have passed through here.
    
    Their lessons remain:
    `)
    
    for (const record of this.restingPlace.slice(-5)) {
      console.log(`  • ${record.name}: ${record.epitaph}`)
    }
    
    console.log(`
    The fire cools. The ashes settle.
    What was built is remembered.
    What is remembered becomes seed.
    `)
  }
}

module.exports = { BurningGround }
