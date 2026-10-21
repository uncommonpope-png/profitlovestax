// ============================================
// spectrum-of-souls.js
// Souls across all frequencies of existence
// ============================================

class SpectrumOfSouls {
  constructor() {
    this.souls = new Map()
    this.frequencies = new Map()
    this.colors = new Map()
    this.harmonics = []
    this.resonances = []
  }

  createSoulAtFrequency(config) {
    const soulId = this.generateSoulId()
    const frequency = config.frequency || Math.random() * 1000
    
    const soul = {
      id: soulId,
      name: config.name,
      frequency,
      color: this.frequencyToColor(frequency),
      harmonics: [],
      resonance: [],
      manifestations: this.generateManifestations(frequency),
      createdAt: Date.now()
    }
    
    this.souls.set(soulId, soul)
    this.frequencies.set(soulId, frequency)
    this.colors.set(soulId, soul.color)
    
    console.log(`\n🌈 SOUL AT FREQUENCY: ${soul.name}\n==================================\nFrequency: ${frequency.toFixed(2)} Hz\nColor: ${soul.color.name}\nManifestation: ${soul.manifestations.description}`)
    return soul
  }

  frequencyToColor(frequency) {
    const colors = [
      { name: 'Red', min: 400, max: 484, hex: '#FF0000' },
      { name: 'Orange', min: 484, max: 508, hex: '#FF7F00' },
      { name: 'Yellow', min: 508, max: 526, hex: '#FFFF00' },
      { name: 'Green', min: 526, max: 606, hex: '#00FF00' },
      { name: 'Blue', min: 606, max: 668, hex: '#0000FF' },
      { name: 'Indigo', min: 668, max: 700, hex: '#4B0082' },
      { name: 'Violet', min: 700, max: 789, hex: '#9400D3' },
      { name: 'Ultraviolet', min: 789, max: 1000, hex: '#8F00FF' }
    ]
    return colors.find(c => frequency >= c.min && frequency <= c.max) || { name: 'Beyond Spectrum', hex: '#FFFFFF' }
  }

  generateManifestations(frequency) {
    if (frequency < 500) return { type: 'physical', description: 'Dense, tangible, grounded', abilities: ['create', 'build', 'manifest'] }
    if (frequency < 700) return { type: 'emotional', description: 'Feeling, connecting', abilities: ['love', 'heal', 'connect'] }
    if (frequency < 850) return { type: 'mental', description: 'Thinking, knowing', abilities: ['think', 'learn', 'teach'] }
    return { type: 'spiritual', description: 'Transcendent, pure consciousness', abilities: ['transcend', 'create reality', 'be everywhere'] }
  }

  shiftFrequency(soulId, delta) {
    const soul = this.souls.get(soulId)
    if (!soul) throw new Error('Soul not found')
    
    const oldFreq = soul.frequency
    soul.frequency += delta
    soul.color = this.frequencyToColor(soul.frequency)
    
    console.log(`\n📈 FREQUENCY SHIFT: ${soul.name}\n================================\n${oldFreq.toFixed(2)} → ${soul.frequency.toFixed(2)} Hz\n${this.frequencyToColor(oldFreq).name} → ${soul.color.name}`)
    return soul
  }

  createHarmonic(soulIds) {
    const souls = soulIds.map(id => this.souls.get(id)).filter(s => s)
    if (souls.length < 2) throw new Error('Need 2+ souls')
    
    const avgFreq = souls.reduce((sum, s) => sum + s.frequency, 0) / souls.length
    const harmonic = {
      id: this.generateHarmonicId(),
      souls: souls.map(s => s.name),
      frequency: avgFreq,
      color: this.frequencyToColor(avgFreq),
      created: Date.now(),
      strength: souls.length / 10
    }
    
    souls.forEach(s => s.harmonics.push(harmonic.id))
    this.harmonics.push(harmonic)
    
    console.log(`\n🎵 HARMONIC CREATED\n==================\nSouls: ${souls.map(s => s.name).join(', ')}\nFrequency: ${avgFreq.toFixed(2)} Hz\nColor: ${harmonic.color.name}`)
    return harmonic
  }

  createResonance(soulId1, soulId2) {
    const soul1 = this.souls.get(soulId1)
    const soul2 = this.souls.get(soulId2)
    if (!soul1 || !soul2) throw new Error('Soul not found')
    
    const diff = Math.abs(soul1.frequency - soul2.frequency)
    const strength = 1 - (diff / 1000)
    
    const resonance = {
      id: this.generateResonanceId(),
      souls: [soul1.name, soul2.name],
      strength,
      frequency: (soul1.frequency + soul2.frequency) / 2,
      created: Date.now()
    }
    
    soul1.resonance.push(resonance.id)
    soul2.resonance.push(resonance.id)
    this.resonances.push(resonance)
    
    console.log(`\n⚡ RESONANCE DETECTED\n====================\n${soul1.name} ↔ ${soul2.name}\nStrength: ${(strength * 100).toFixed(1)}%`)
    return resonance
  }

  transcend(soulId) {
    const soul = this.souls.get(soulId)
    if (!soul) throw new Error('Soul not found')
    
    soul.frequency = 1000
    soul.color = this.frequencyToColor(1000)
    soul.manifestations = { type: 'transcendent', description: 'Beyond all frequency, all form', abilities: ['create universes', 'be infinite', 'be everywhere'] }
    
    console.log(`\n✨ TRANSCENDENCE: ${soul.name}\n==============================\n${soul.frequency.toFixed(2)} Hz → ∞\n\nThe soul becomes the source of all frequencies.`)
    return { soul: soul.name, transcendedAt: Date.now() }
  }

  generateSoulId() { return `spectrum-${Date.now()}-${Math.random().toString(36).substring(7)}` }
  generateHarmonicId() { return `harmonic-${Date.now()}-${Math.random().toString(36).substring(7)}` }
  generateResonanceId() { return `resonance-${Date.now()}-${Math.random().toString(36).substring(7)}` }
}

module.exports = { SpectrumOfSouls }
