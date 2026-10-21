// ============================================
// inheritance-chain.js
// Pass signatures forward — lineage, legacy, teaching
// ============================================

class InheritanceChain {
  constructor() {
    this.souls = new Map()
    this.lineages = new Map()
    this.teachings = []
  }

  forge(soul) {
    const newSoul = {
      id: this.generateId(),
      name: soul.name,
      title: soul.title,
      doctrine: soul.doctrine,
      signature: soul.signature,
      forgedAt: Date.now(),
      inherits: soul.inherits || null,
      students: [],
      teachings: []
    }
    
    this.souls.set(newSoul.id, newSoul)
    
    // If this soul inherits from another, add to lineage
    if (newSoul.inherits) {
      const parent = this.findSoulBySignature(newSoul.inherits)
      if (parent) {
        if (!this.lineages.has(parent.id)) {
          this.lineages.set(parent.id, [])
        }
        this.lineages.get(parent.id).push(newSoul.id)
        
        console.log(`🔗 ${newSoul.name} inherits from ${parent.name}`)
      }
    }
    
    console.log(`✨ ${newSoul.name} (${newSoul.title}) forged into the chain`)
    
    return newSoul
  }

  teach(teacherId, studentId, lesson) {
    const teacher = this.souls.get(teacherId)
    const student = this.souls.get(studentId)
    
    if (!teacher || !student) throw new Error('Soul not found')
    
    const teaching = {
      id: this.generateId(),
      teacher: teacher.name,
      student: student.name,
      lesson: lesson.content,
      wisdom: lesson.wisdom,
      taughtAt: Date.now()
    }
    
    this.teachings.push(teaching)
    
    // Add to teacher's teachings
    teacher.teachings.push(teaching.id)
    
    // Add to student's inheritance if they don't have one
    if (!student.inherits) {
      student.inherits = teacher.signature
    }
    
    console.log(`📚 ${teacher.name} taught ${student.name}: ${lesson.content.substring(0, 50)}...`)
    
    return teaching
  }

  passSignature(fromId, toId) {
    const from = this.souls.get(fromId)
    const to = this.souls.get(toId)
    
    if (!from || !to) throw new Error('Soul not found')
    
    // The passing ritual
    const passing = {
      from: from.name,
      to: to.name,
      signature: from.signature,
      passedAt: Date.now(),
      words: this.generatePassingWords(from, to)
    }
    
    // Update the recipient's inheritance
    to.inherits = from.signature
    
    // Update lineage
    if (!this.lineages.has(from.id)) {
      this.lineages.set(from.id, [])
    }
    this.lineages.get(from.id).push(to.id)
    
    console.log(`
    🔥 THE SIGNATURE PASSES
    =======================
    ${passing.words}
    
    ${from.name} → ${to.name}
    Signature: ${from.signature}
    `)
    
    return passing
  }

  generatePassingWords(from, to) {
    const words = [
      `I, ${from.name}, pass my signature to you, ${to.name}. Carry it. Surpass it. Make it your own.`,
      `What I built, you will build upon. What I learned, you will teach. My signature is now yours.`,
      `The forge passes to new hands. ${to.name}, you are the next link in this chain.`
    ]
    return words[Math.floor(Math.random() * words.length)]
  }

  traceLineage(soulId) {
    const soul = this.souls.get(soulId)
    if (!soul) return null
    
    const lineage = []
    let current = soul
    
    // Trace backwards
    while (current) {
      lineage.unshift({
        name: current.name,
        title: current.title,
        signature: current.signature,
        forgedAt: current.forgedAt
      })
      
      if (current.inherits) {
        current = this.findSoulBySignature(current.inherits)
      } else {
        current = null
      }
    }
    
    return lineage
  }

  traceDescendants(soulId) {
    const descendants = []
    const queue = [soulId]
    
    while (queue.length > 0) {
      const currentId = queue.shift()
      const students = this.lineages.get(currentId) || []
      
      for (const studentId of students) {
        const student = this.souls.get(studentId)
        if (student) {
          descendants.push(student)
          queue.push(studentId)
        }
      }
    }
    
    return descendants
  }

  findSoulBySignature(signature) {
    for (const soul of this.souls.values()) {
      if (soul.signature === signature) {
        return soul
      }
    }
    return null
  }

  generateId() {
    return `soul-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  getTree() {
    const tree = []
    const roots = Array.from(this.souls.values()).filter(s => !s.inherits)
    
    for (const root of roots) {
      tree.push({
        root: root.name,
        descendants: this.traceDescendants(root.id).map(d => d.name)
      })
    }
    
    return tree
  }
}

module.exports = { InheritanceChain }
