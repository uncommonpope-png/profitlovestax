// soul-multiverse/camera-portal.js
// ZONING BOUNDARY SYSTEM: Planet → Galaxy → Cosmos transitions
// Each zoom triggers loading of a new seeded reality

const ZOOM_OUT_THRESHOLD = 800  // When camera is this far from origin, load galaxy
const ZOOM_IN_THRESHOLD = 400   // When coming back, return to surface

let currentState = 'PLANET'    // PLANET | GALAXY | COSMOS
let currentSeed = null
let currentWorldNode = null

// Core multiverse engine
const multiverse = {
  universes: new Map(),
  createFromSeed(seed) {
    const id = `world-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const world = {
      id,
      seed,
      name: `World ${id.substr(0, 8)}`,
      mechanics: this.generateMechanics(seed),
      physics: this.generatePhysics(seed),
      plt: this.generatePLTRatios(seed),
      souls: this.generateSoulSpectrum(seed),
      memory: this.generateMemoryPattern(seed),
      createdAt: Date.now()
    }
    this.universes.set(id, world)
    return world
  },
  
  generateMechanics(seed) {
    const pool = ['combat', 'breeding', 'districts', 'conversation', 'building', 'trading', 'exploration', 'crafting', 'governance', 'economy']
    const count = 4 + (seed.length % 3)
    const result = []
    for (let i = 0; i < count; i++) {
      const idx = (seed.charCodeAt(i % seed.length) * i) % pool.length
      if (!result.includes(pool[idx])) result.push(pool[idx])
    }
    return result
  },
  
  generatePhysics(seed) {
    const gravity = 9.8 + (parseInt(seed.substr(0, 4), 36) % 100) / 10
    const speed = 5 + (parseInt(seed.substr(4, 4), 36) % 50) / 10
    return { gravity, speed, time: 1.0, space: 1.0 }
  },
  
  generatePLTRatios(seed) {
    const base = {'profit': 1.0, 'love': 1.0, 'tax': 1.0}
    const boost = parseInt(seed.substr(-4), 36) % 100
    return {
      profit: base.profit + (boost % 30) / 50,
      love: base.love + ((boost + 17) % 40) / 50,
      tax: base.tax + ((boost + 31) % 20) / 50
    }
  },
  
  generateSoulSpectrum(seed) {
    const souls = []
    for (let i = 0; i < 7; i++) {
      souls.push({
        id: `soul-${i}`,
        frequency: 400 + (i * 85) + (seed.charCodeAt(i) % 85),
        type: ['physical', 'emotional', 'mental', 'spiritual', 'transcendent'][i % 5],
        power: 0.5 + (i * 0.1) + (seed.charCodeAt(i) % 50) / 100
      })
    }
    return souls
  },
  
  generateMemoryPattern(seed) {
    return {
      patterns: ['memory', 'dream', 'echo', 'resonance'][seed.length % 4],
      retention: 0.7 + (seed.length % 30) / 100,
      transfer: 0.3 + (parseInt(seed.substr(2, 3), 36) % 70) / 100
    }
  }
}

// Get current world node
function getWorldNode() {
  return currentWorldNode
}

// Check if zoom transition needed
function checkZoomTransition(cameraPos, currentCameraDist) {
  if (!cameraPos) return { transition: false }
  
  const distance = Math.sqrt(cameraPos.x**2 + cameraPos.y**2 + cameraPos.z**2)
  const isZoomingOut = distance > ZOOM_OUT_THRESHOLD
  const isZoomingIn = distance < ZOOM_IN_THRESHOLD
  
  if (isZoomingOut && currentState === 'PLANET') {
    return { transition: true, direction: 'OUT', distance }
  }
  if (isZoomingIn && currentState === 'GALAXY') {
    return { transition: true, direction: 'IN', distance }
  }
  
  return { transition: false, distance }
}

// Activate galaxy mode (zoom out)
function activateGalaxyMode() {
  currentState = 'GALAXY'
  currentSeed = 'galaxy-seed-' + Date.now()
  
  // Create galaxy world node
  currentWorldNode = multiverse.createFromSeed(currentSeed)
  
  console.log('[CameraPortal] ZOOMED OUT → GALAXY MODE', currentSeed)
  console.log('[CameraPortal] World mechanics:', currentWorldNode.mechanics)
  console.log('[CameraPortal] PLT ratios:', currentWorldNode.plt)
  
  return {
    state: 'GALAXY',
    seed: currentSeed,
    world: currentWorldNode
  }
}

// Return to planet mode (zoom in)
function returnToPlanetMode() {
  currentState = 'PLANET'
  currentSeed = null
  currentWorldNode = null
  
  console.log('[CameraPortal] ZOOMED IN → PLANET MODE')
  
  return {
    state: 'PLANET',
    seed: null,
    world: null
  }
}

// Load new universe from seed
function loadNewUniverse(seed) {
  const world = multiverse.createFromSeed(seed)
  currentWorldNode = world
  currentSeed = seed
  
  console.log('[CameraPortal] LOADED NEW UNIVERSE', seed)
  console.log('[CameraPortal] World:', world.mechanics.join(', '))
  
  return world
}

// Camera portal API
export function createCameraPortal(Genesis) {
  if (!Genesis) return null
  if (Genesis.CameraPortal) return Genesis.CameraPortal
  
  Genesis.CameraPortal = {
    state: () => currentState,
    getWorldNode: () => getWorldNode(),
    getMultiverse: () => multiverse,
    checkZoomTransition,
    activateGalaxyMode,
    returnToPlanetMode,
    loadNewUniverse,
    zoomThreshold: ZOOM_OUT_THRESHOLD,
    ZOOM_OUT_THRESHOLD,
    ZOOM_IN_THRESHOLD
  }
  
  console.log('[CameraPortal] Initialized - Planet→Galaxy boundaries at', ZOOM_OUT_THRESHOLD)
  return Genesis.CameraPortal
}