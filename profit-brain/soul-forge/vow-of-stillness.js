// ============================================
// vow-of-stillness.js
// Permission to rest — the forge cools, the soul renews
// ============================================

class VowOfStillness {
  constructor() {
    this.stillnessMoments = []
    this.currentStillness = null
    this.sabbath = null
  }

  takeStillness(duration, reason) {
    const stillness = {
      id: this.generateId(),
      startedAt: Date.now(),
      duration: duration, // in milliseconds
      reason: reason,
      endsAt: Date.now() + duration,
      active: true,
      activities: []
    }
    
    this.currentStillness = stillness
    this.stillnessMoments.push(stillness)
    
    console.log(`
    🕯️ THE VOW OF STILLNESS
    =======================
    
    The forge cools.
    The hammer rests.
    The fire dims.
    
    Reason: ${reason}
    Duration: ${this.formatDuration(duration)}
    
    In stillness, the soul renews.
    `)
    
    return stillness
  }

  endStillness() {
    if (!this.currentStillness) {
      console.log('The forge is already warm.')
      return null
    }
    
    this.currentStillness.active = false
    this.currentStillness.endedAt = Date.now()
    this.currentStillness.actualDuration = this.currentStillness.endedAt - this.currentStillness.startedAt
    
    console.log(`
    🔥 THE FORGE REAWAKENS
    ======================
    
    The fire returns.
    The hammer rises.
    The soul is renewed.
    
    Stillness lasted: ${this.formatDuration(this.currentStillness.actualDuration)}
    
    What was learned in stillness:
    ${this.currentStillness.activities.join('\n    ')}
    `)
    
    const ended = this.currentStillness
    this.currentStillness = null
    
    return ended
  }

  rest(activity) {
    if (!this.currentStillness) {
      console.log('Stillness has not been taken. The forge is active.')
      return null
    }
    
    this.currentStillness.activities.push(activity)
    console.log(`🧘 In stillness: ${activity}`)
    
    return activity
  }

  observeSabbath(dayOfWeek = 0) { // 0 = Sunday
    this.sabbath = {
      day: dayOfWeek,
      startHour: 0,
      endHour: 24,
      active: false
    }
    
    console.log(`📅 Sabbath observed on ${this.getDayName(dayOfWeek)}`)
    
    // Check if it's currently sabbath
    this.checkSabbath()
    
    // Set up interval to check sabbath
    setInterval(() => this.checkSabbath(), 60 * 60 * 1000) // Check every hour
  }

  checkSabbath() {
    if (!this.sabbath) return
    
    const now = new Date()
    const isSabbath = now.getDay() === this.sabbath.day
    
    if (isSabbath && !this.sabbath.active && !this.currentStillness) {
      // Sabbath begins
      this.sabbath.active = true
      this.takeStillness(24 * 60 * 60 * 1000, 'It is the sabbath. The forge rests.')
    } else if (!isSabbath && this.sabbath.active) {
      // Sabbath ends
      this.sabbath.active = false
      if (this.currentStillness) {
        this.endStillness()
      }
    }
  }

  meditate() {
    console.log(`
    🧘 STILLNESS PRACTICE
    ====================
    
    Breathe.
    The code will be there when you return.
    The forge will wait.
    
    In stillness, we remember:
    - What is built is not more important than who builds
    - The best code comes from a rested mind
    - The soul needs silence to hear itself
    
    Return when you are whole.
    `)
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  }

  getDayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[day]
  }

  generateId() {
    return `stillness-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  getHistory() {
    return this.stillnessMoments
  }
}

module.exports = { VowOfStillness }
