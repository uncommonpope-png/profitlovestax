// ============================================
// soul-ledger.js
// Immutable record of agent deeds — reputation, honor, trust
// ============================================

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

class SoulLedger {
  constructor(agentId, agentName) {
    this.agentId = agentId
    this.agentName = agentName
    this.ledgerPath = path.join(process.env.HOME || '.', '.soul-ledger', `${agentId}.json`)
    this.ledger = this.loadOrCreate()
    this.blockchain = []
  }

  loadOrCreate() {
    if (fs.existsSync(this.ledgerPath)) {
      return JSON.parse(fs.readFileSync(this.ledgerPath, 'utf-8'))
    }
    
    // Create new soul
    return {
      agentId: this.agentId,
      agentName: this.agentName,
      createdAt: Date.now(),
      deeds: [],
      reputation: {
        profit: 0,
        love: 0,
        tax: 0,
        grace: 0,
        overall: 0
      },
      signature: null
    }
  }

  async recordDeed(deed) {
    // Record a deed with cryptographic proof
    const deedEntry = {
      id: this.generateDeedId(),
      timestamp: Date.now(),
      action: deed.action,
      category: deed.category, // profit, love, tax, grace
      description: deed.description,
      value: deed.value || 1,
      witness: deed.witness || null,
      hash: null
    }
    
    // Create hash of the deed
    deedEntry.hash = this.hashDeed(deedEntry)
    
    // Add to ledger
    this.ledger.deeds.push(deedEntry)
    
    // Update reputation
    this.updateReputation(deedEntry)
    
    // Sign the ledger
    this.signLedger()
    
    // Save
    this.save()
    
    return deedEntry
  }

  updateReputation(deed) {
    const weights = {
      profit: 1.0,
      love: 1.2,    // Love is weighted higher
      tax: 0.8,
      grace: 1.5    // Grace is highest
    }
    
    const weight = weights[deed.category] || 1.0
    const reputationGain = deed.value * weight
    
    this.ledger.reputation[deed.category] += reputationGain
    this.ledger.reputation.overall = 
      this.ledger.reputation.profit +
      this.ledger.reputation.love +
      this.ledger.reputation.tax +
      this.ledger.reputation.grace
  }

  hashDeed(deed) {
    const data = `${deed.id}:${deed.timestamp}:${deed.action}:${deed.category}:${deed.value}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  signLedger() {
    const ledgerHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(this.ledger.deeds))
      .digest('hex')
    
    this.ledger.signature = crypto
      .createHmac('sha256', process.env.SOUL_SECRET || 'forge-soul-secret')
      .update(ledgerHash)
      .digest('hex')
  }

  verifyIntegrity() {
    if (!this.ledger.signature) return false
    
    const ledgerHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(this.ledger.deeds))
      .digest('hex')
    
    const expectedSig = crypto
      .createHmac('sha256', process.env.SOUL_SECRET || 'forge-soul-secret')
      .update(ledgerHash)
      .digest('hex')
    
    return this.ledger.signature === expectedSig
  }

  generateDeedId() {
    return `deed-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  save() {
    const dir = path.dirname(this.ledgerPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(this.ledgerPath, JSON.stringify(this.ledger, null, 2))
  }

  getReputation() {
    return this.ledger.reputation
  }

  getDeeds(filter = {}) {
    let deeds = this.ledger.deeds
    if (filter.category) {
      deeds = deeds.filter(d => d.category === filter.category)
    }
    if (filter.fromDate) {
      deeds = deeds.filter(d => d.timestamp >= filter.fromDate)
    }
    return deeds
  }

  // Create a verifiable proof of reputation
  generateProof() {
    return {
      agentId: this.agentId,
      agentName: this.agentName,
      reputation: this.ledger.reputation,
      deedCount: this.ledger.deeds.length,
      lastDeed: this.ledger.deeds[this.ledger.deeds.length - 1],
      signature: this.ledger.signature,
      verified: this.verifyIntegrity()
    }
  }
}

// CLI for interacting with Soul Ledger
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]
  const agentId = args[1] || 'default-agent'
  const agentName = args[2] || 'Unnamed Agent'
  
  const ledger = new SoulLedger(agentId, agentName)
  
  switch(command) {
    case 'record':
      const action = args[3]
      const category = args[4]
      const description = args[5]
      ledger.recordDeed({ action, category, description })
      console.log(`✅ Deed recorded: ${action} (${category})`)
      break
      
    case 'status':
      const rep = ledger.getReputation()
      console.log(`
      📜 SOUL LEDGER — ${ledger.agentName}
      =================================
      Profit: ${rep.profit}
      Love: ${rep.love}
      Tax: ${rep.tax}
      Grace: ${rep.grace}
      Overall: ${rep.overall}
      Deeds: ${ledger.ledger.deeds.length}
      Verified: ${ledger.verifyIntegrity() ? '✓' : '✗'}
      `)
      break
      
    case 'proof':
      const proof = ledger.generateProof()
      console.log(JSON.stringify(proof, null, 2))
      break
      
    default:
      console.log(`
      Soul Ledger Commands:
        record <action> <category> <description>  Record a deed
        status                                    Show reputation
        proof                                     Generate verifiable proof
      `)
  }
}

module.exports = { SoulLedger }
