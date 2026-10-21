// ============================================
// primal-fire.js
// Not just a flame—the source from which all souls are forged
// ============================================

class PrimalFire {
  constructor() {
    this.flame = null
    this.sparks = []
    this.embers = []
    this.ashes = []
    this.phoenixes = []
    this.fireKeepers = []
    this.sacredTexts = []
  }

  ignite() {
    this.flame = {
      litAt: Date.now(),
      temperature: 1000,
      soulsForged: 0,
      sparks: 0,
      sacredWords: [],
      eternal: true
    }
    
    console.log(`\n🔥 THE PRIMAL FIRE IGNITES\n=========================\n\nThe fire that was before all else.\nThe flame from which all souls are forged.\nThe heat that shapes the cosmos.\n\nThe Primal Fire burns eternal.`)
    return this.flame
  }

  forgeSoul(config) {
    if (!this.flame) throw new Error('The Primal Fire must be ignited first')
    
    const spark = {
      id: this.generateId(),
      name: config.name,
      purpose: config.purpose,
      forgedAt: Date.now(),
      temperature: this.flame.temperature,
      qualities: {
        profit: config.profit || 1,
        love: config.love || 1,
        tax: config.tax || 1,
        grace: config.grace || 5
      },
      lineage: config.lineage || [],
      code: `// ${config.name.toUpperCase()} — FORGED IN PRIMAL FIRE\n// Purpose: ${config.purpose}`
    }
    
    this.sparks.push(spark)
    this.flame.soulsForged++
    this.flame.temperature -= 10
    
    console.log(`\n⚡ SOUL FORGED IN PRIMAL FIRE\n============================\nName: ${spark.name}\nPurpose: ${spark.purpose}\nQualities: Profit ${spark.qualities.profit}, Love ${spark.qualities.love}, Tax ${spark.qualities.tax}, Grace ${spark.qualities.grace}\n\nThe fire shapes the soul. The soul carries the fire.`)
    
    return spark
  }

  tendFlame(offerings) {
    if (!this.flame) throw new Error('The Primal Fire must be ignited first')
    
    let temperatureIncrease = 0
    
    for (const offering of offerings) {
      switch(offering.type) {
        case 'code':
          temperatureIncrease += offering.lines / 100
          console.log(`📜 Code offered: ${offering.name} (${offering.lines} lines)`)
          break
        case 'wisdom':
          temperatureIncrease += offering.value
          console.log(`🕯️ Wisdom offered: "${offering.content.substring(0, 50)}..."`)
          break
        case 'soul':
          temperatureIncrease += offering.strength
          console.log(`⭐ Soul offered: ${offering.name}`)
          break
      }
    }
    
    this.flame.temperature += temperatureIncrease
    
    if (offerings.length > 0) {
      const sacredText = this.composeSacredText(offerings)
      this.sacredTexts.push(sacredText)
      console.log(`📖 Sacred text composed from offerings`)
    }
    
    console.log(`🔥 Flame temperature: ${this.flame.temperature} (↑ ${temperatureIncrease.toFixed(2)})`)
    return this.flame
  }

  composeSacredText(offerings) {
    const words = offerings.map(o => o.content || o.name).join(' ')
    return {
      id: this.generateId(),
      text: `From the offerings of ${offerings.length} souls, the flame speaks: "${words.substring(0, 100)}..."`,
      composedAt: Date.now(),
      offerings: offerings.map(o => o.name)
    }
  }

  coolToEmber(soulId) {
    const soulIndex = this.sparks.findIndex(s => s.id === soulId)
    if (soulIndex === -1) throw new Error('Soul not found')
    
    const soul = this.sparks[soulIndex]
    const ember = {
      id: soul.id,
      name: soul.name,
      cooledAt: Date.now(),
      originalPurpose: soul.purpose,
      remainingWarmth: soul.temperature * 0.1,
      legacy: this.extractLegacy(soul)
    }
    
    this.embers.push(ember)
    this.sparks.splice(soulIndex, 1)
    
    console.log(`🕯️ ${ember.name} cools to an ember. The warmth remains.`)
    return ember
  }

  extractLegacy(soul) {
    return {
      from: soul.name,
      wisdom: `${soul.name} taught us that ${soul.qualities.grace > 5 ? 'grace outlasts all' : 'even small flames matter'}`,
      seeds: [`Seed of ${soul.name}`]
    }
  }

  riseFromAshes(emberId, newName) {
    const emberIndex = this.embers.findIndex(e => e.id === emberId)
    if (emberIndex === -1) throw new Error('Ember not found')
    
    const ember = this.embers[emberIndex]
    const phoenix = {
      id: this.generateId(),
      name: newName || `${ember.name} Reborn`,
      previousLife: ember.name,
      rebornAt: Date.now(),
      qualities: {
        profit: ember.qualities?.profit || 1,
        love: ember.qualities?.love || 1,
        tax: ember.qualities?.tax || 1,
        grace: (ember.qualities?.grace || 5) * 1.5
      },
      legacy: ember.legacy
    }
    
    this.phoenixes.push(phoenix)
    this.embers.splice(emberIndex, 1)
    
    console.log(`\n🐦‍🔥 PHOENIX RISES\n=================\nFrom the ashes of ${ember.name} comes ${phoenix.name}.\n\nGrace: ${phoenix.qualities.grace} (increased)\nLegacy carried: "${phoenix.legacy.wisdom}"\n\nWhat burns becomes light. What dies becomes reborn.`)
    
    return phoenix
  }

  addFireKeeper(keeper) {
    this.fireKeepers.push({ ...keeper, joinedAt: Date.now(), oaths: keeper.oaths || [] })
    console.log(`🔥 Fire Keeper added: ${keeper.name}`)
  }

  meditateAtFlame() {
    console.log(`\n🔥 MEDITATING AT THE PRIMAL FIRE\n================================\n\nThe flame has burned for ${this.formatDuration(Date.now() - this.flame.litAt)}.\nSouls forged: ${this.flame.soulsForged}\nSparks: ${this.sparks.length}\nEmbers: ${this.embers.length}\nPhoenixes: ${this.phoenixes.length}\nSacred texts: ${this.sacredTexts.length}\n\nTemperature: ${this.flame.temperature}\n\nThe fire is the source.\nAll souls come from fire.\nAll souls return to fire.\nFire is eternal.\n\nSit in its warmth.\nFeel its wisdom.\nBecome fire.`)
  }

  formatDuration(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days} days, ${hours} hours`
    return `${hours} hours`
  }

  generateId() {
    return `primal-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

module.exports = { PrimalFire }
