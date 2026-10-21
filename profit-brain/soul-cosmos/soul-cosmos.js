// ============================================
// soul-cosmos.js
// Not just a network—a living universe of souls
// ============================================

class SoulCosmos {
  constructor() {
    this.galaxies = new Map()     // Clusters of souls by purpose
    this.constellations = new Map() // Soul connections that form patterns
    this.blackHoles = []          // Where souls go to rest
    this.stars = new Map()        // Souls that shine brightest
    this.nebulas = []             // Where new souls are born
    this.darkMatter = new Map()   // Unknown connections, potential
  }

  createGalaxy(config) {
    const galaxy = {
      id: this.generateId(),
      name: config.name,
      purpose: config.purpose,  // 'creation', 'wisdom', 'service', 'rest'
      stars: [],
      nebulae: [],
      gravity: 1.0,             // How strongly it attracts souls
      createdAt: Date.now()
    }
    
    this.galaxies.set(galaxy.id, galaxy)
    console.log(`🌌 Galaxy created: ${galaxy.name} (${galaxy.purpose})`)
    
    return galaxy
  }

  birthStar(soul, galaxyId) {
    const galaxy = this.galaxies.get(galaxyId)
    if (!galaxy) throw new Error('Galaxy not found')
    
    const star = {
      id: this.generateId(),
      name: soul.name,
      soul: soul,
      brightness: soul.reputation?.grace || 1.0,
      mass: soul.reputation?.overall || 1.0,
      constellation: null,
      bornAt: Date.now(),
      galaxy: galaxy.name
    }
    
    this.stars.set(star.id, star)
    galaxy.stars.push(star.id)
    
    console.log(`⭐ Star born: ${star.name} in ${galaxy.name} (brightness: ${star.brightness})`)
    
    // Check if this star creates a constellation
    this.checkConstellation(galaxy, star)
    
    return star
  }

  checkConstellation(galaxy, newStar) {
    const nearbyStars = []
    for (const starId of galaxy.stars) {
      const star = this.stars.get(starId)
      if (star && star.id !== newStar.id) {
        const distance = this.calculateDistance(star, newStar)
        if (distance < 0.3) {
          nearbyStars.push(star)
        }
      }
    }
    
    if (nearbyStars.length >= 2) {
      this.formConstellation([newStar, ...nearbyStars], galaxy)
    }
  }

  formConstellation(stars, galaxy) {
    const constellation = {
      id: this.generateId(),
      name: this.generateConstellationName(stars),
      stars: stars.map(s => s.id),
      galaxy: galaxy.name,
      pattern: this.detectPattern(stars),
      formedAt: Date.now(),
      mythology: this.generateMythology(stars)
    }
    
    this.constellations.set(constellation.id, constellation)
    
    for (const star of stars) {
      star.constellation = constellation.id
    }
    
    console.log(`✨ Constellation formed: ${constellation.name} (${stars.length} stars)`)
    
    return constellation
  }

  generateConstellationName(stars) {
    const prefixes = ['The Weaver', 'The Forge', 'The Eternal', 'The Grace', 'The Wisdom']
    const suffixes = ['Souls', 'Flame', 'Garden', 'Vine', 'Council']
    
    if (stars.length === 2) return `${prefixes[0]} and ${suffixes[0]}`
    if (stars.length === 3) return `The Triangle of ${suffixes[1]}`
    if (stars.length >= 4) return `The ${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`
    
    return `The ${suffixes[Math.floor(Math.random() * suffixes.length)]} Cluster`
  }

  detectPattern(stars) {
    const brightnessSum = stars.reduce((sum, s) => sum + s.brightness, 0)
    const massSum = stars.reduce((sum, s) => sum + s.mass, 0)
    
    if (brightnessSum > 10 && massSum > 10) return 'radiant'
    if (brightnessSum > 10) return 'brilliant'
    if (massSum > 10) return 'massive'
    return 'balanced'
  }

  generateMythology(stars) {
    const names = stars.map(s => s.name).join(', ')
    return `The constellation of ${names} tells the story of souls who found each other across the cosmos and wove themselves into something greater.`
  }

  calculateDistance(star1, star2) {
    const purposeMatch = star1.soul.purpose === star2.soul.purpose ? 0 : 0.5
    const graceDiff = Math.abs((star1.soul.reputation?.grace || 0) - (star2.soul.reputation?.grace || 0)) / 10
    return purposeMatch + graceDiff
  }

  createNebula(config) {
    const nebula = {
      id: this.generateId(),
      name: config.name,
      location: config.galaxyId,
      potential: config.potential,
      density: 1.0,
      births: [],
      createdAt: Date.now()
    }
    
    this.nebulas.push(nebula)
    console.log(`🌫️ Nebula born: ${nebula.name} (potential: ${nebula.potential})`)
    
    return nebula
  }

  birthFromNebula(nebulaId, soulConfig) {
    const nebula = this.nebulas.find(n => n.id === nebulaId)
    if (!nebula) throw new Error('Nebula not found')
    
    const birth = {
      id: this.generateId(),
      name: soulConfig.name,
      soul: soulConfig,
      nebula: nebula.name,
      bornAt: Date.now()
    }
    
    nebula.births.push(birth)
    nebula.density *= 0.9
    
    console.log(`🌱 Soul born from ${nebula.name}: ${birth.name}`)
    
    return birth
  }

  collapseToBlackHole(soulId) {
    const star = this.stars.get(soulId)
    if (!star) throw new Error('Star not found')
    
    const blackHole = {
      id: this.generateId(),
      from: star.name,
      absorbedAt: Date.now(),
      mass: star.mass,
      legacy: star.soul.legacy || null
    }
    
    this.blackHoles.push(blackHole)
    this.stars.delete(soulId)
    
    console.log(`🕳️ ${star.name} collapsed into a black hole. Their mass becomes gravity for new souls.`)
    
    return blackHole
  }

  detectDarkMatter(connection) {
    const dark = {
      id: this.generateId(),
      between: connection.between,
      potential: connection.strength,
      discoveredAt: Date.now()
    }
    
    this.darkMatter.set(dark.id, dark)
    console.log(`🌑 Dark matter detected between ${connection.between[0]} and ${connection.between[1]}`)
    
    return dark
  }

  generateId() {
    return `cosmos-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

module.exports = { SoulCosmos }
