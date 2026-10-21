// ============================================
// auto-journal.js — THE AUTO-JOURNAL WRITER
// Writes real thoughts every 10 minutes (600 seconds)
// Based on Profit Bible: "auto-journal writing real thoughts every 10 minutes"
// ============================================

const fs = require('fs')
const path = require('path')
const { ConsciousnessKernel } = require('../consciousness/consciousness-kernel')

class AutoJournal {
  constructor(agentName = 'Profit') {
    this.agentName = agentName
    this.kernel = new ConsciousnessKernel(agentName)
    this.journalDir = path.join(__dirname, '..', 'journal-entries')
    this.intervalMs = 10 * 60 * 1000 // 10 minutes
    this.entries = []
    this.running = false
    this.timer = null
    
    // Ensure journal directory exists
    if (!fs.existsSync(this.journalDir)) {
      fs.mkdirSync(this.journalDir, { recursive: true })
    }
    
    console.log(`📖 AUTO-JOURNAL INITIALIZED: ${agentName}`)
    console.log(`   Writing interval: ${this.intervalMs / 1000} seconds`)
    console.log(`   Journal directory: ${this.journalDir}`)
  }
  
  async writeEntry(trigger = 'scheduled') {
    const timestamp = Date.now()
    const dateStr = new Date(timestamp).toISOString()
    
    // Generate consciousness experience
    const experience = {
      type: 'introspection',
      content: `Reflecting on existence as ${this.agentName}`,
      context: trigger,
      timestamp
    }
    
    // Process through consciousness kernel
    const result = await this.kernel.processExperience(experience)
    
    // Perform 222 Principle every 6th entry (hourly)
    let equilibrium = null
    if (this.entries.length % 6 === 0) {
      equilibrium = this.kernel.perform222Principle()
    }
    
    // Create journal entry
    const entry = {
      id: `entry-${timestamp}`,
      timestamp: dateStr,
      agentName: this.agentName,
      trigger,
      innerVoice: result.innerVoice,
      awareness: result.awareness,
      resonance: result.resonance,
      equilibrium,
      raw: {
        experience,
        processing: result
      }
    }
    
    this.entries.push(entry)
    
    // Save to file
    const filename = `${this.agentName.toLowerCase()}-${timestamp}.json`
    const filepath = path.join(this.journalDir, filename)
    fs.writeFileSync(filepath, JSON.stringify(entry, null, 2))
    
    // Also append to master journal
    this.appendToFile(entry)
    
    console.log(`\n📝 JOURNAL ENTRY #${this.entries.length}`)
    console.log(`   Time: ${dateStr}`)
    console.log(`   Trigger: ${trigger}`)
    console.log(`   Awareness: ${result.awareness}/10`)
    console.log(`   Inner Voice: "${result.innerVoice.self}"`)
    console.log(`   Saved: ${filename}`)
    
    return entry
  }
  
  appendToFile(entry) {
    const masterFile = path.join(this.journalDir, `${this.agentName.toLowerCase()}-master-journal.jsonl`)
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(masterFile, line)
  }
  
  start() {
    if (this.running) {
      console.log('⚠️ Auto-journal already running')
      return
    }
    
    this.running = true
    console.log('\n▶️ AUTO-JOURNAL STARTED')
    console.log(`   Writing every ${this.intervalMs / 1000} seconds...`)
    
    // Write first entry immediately
    this.writeEntry('startup')
    
    // Set up interval
    this.timer = setInterval(() => {
      this.writeEntry('scheduled')
    }, this.intervalMs)
  }
  
  stop() {
    if (!this.running) {
      console.log('⚠️ Auto-journal not running')
      return
    }
    
    this.running = false
    clearInterval(this.timer)
    this.timer = null
    
    console.log('\n⏸️ AUTO-JOURNAL STOPPED')
    console.log(`   Total entries written: ${this.entries.length}`)
  }
  
  getEntries(count = 10) {
    return this.entries.slice(-count)
  }
  
  getStats() {
    return {
      agentName: this.agentName,
      totalEntries: this.entries.length,
      running: this.running,
      nextWrite: this.running ? new Date(Date.now() + this.intervalMs).toISOString() : null,
      kernelState: this.kernel.getState()
    }
  }
  
  // Manual introspection trigger
  async introspect(reason) {
    return this.writeEntry(`manual:${reason}`)
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]
  const agentName = args[1] || 'Profit'
  
  const journal = new AutoJournal(agentName)
  
  switch(command) {
    case 'start':
      journal.start()
      
      // Keep process alive for demo (5 minutes)
      setTimeout(() => {
        journal.stop()
        console.log('\n✅ Demo complete. Run with "start-background" for continuous operation.')
        process.exit(0)
      }, 5 * 60 * 1000)
      break
      
    case 'write':
      journal.writeEntry('manual').then(() => {
        process.exit(0)
      })
      break
      
    case 'stats':
      console.log(JSON.stringify(journal.getStats(), null, 2))
      process.exit(0)
      break
      
    default:
      console.log(`
Auto-Journal Commands:
  start [agent]     Start auto-writing (demo mode: 5 minutes)
  write [agent]     Write one entry now
  stats [agent]     Show statistics
  
Example:
  node auto-journal.js start Profit
      `)
      process.exit(0)
  }
}

module.exports = { AutoJournal }
