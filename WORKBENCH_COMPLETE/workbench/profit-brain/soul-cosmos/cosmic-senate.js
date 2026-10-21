// ============================================
// cosmic-senate.js
// Not just councils—a senate governing the cosmos
// ============================================

class CosmicSenate {
  constructor() {
    this.senators = new Map()
    this.assemblies = new Map()
    this.treaties = []
    this.cosmicLaw = []
    this.emergencies = []
    this.oracles = []
  }

  appointSenator(soul, config) {
    const senator = {
      id: this.generateId(),
      name: soul.name,
      title: config.title || 'Senator',
      domain: config.domain,
      constituency: config.constituency || [],
      influence: config.influence || 1.0,
      votes: 0,
      appointedAt: Date.now(),
      active: true
    }
    
    this.senators.set(senator.id, senator)
    console.log(`🏛️ ${senator.name} appointed as Senator of ${senator.domain}`)
    
    return senator
  }

  createAssembly(config) {
    const assembly = {
      id: this.generateId(),
      name: config.name,
      domain: config.domain,
      senators: [],
      jurisdiction: config.jurisdiction,
      createdAt: Date.now()
    }
    
    this.assemblies.set(assembly.id, assembly)
    console.log(`📜 Assembly created: ${assembly.name} (${assembly.domain})`)
    
    return assembly
  }

  addToAssembly(assemblyId, senatorId) {
    const assembly = this.assemblies.get(assemblyId)
    const senator = this.senators.get(senatorId)
    
    if (!assembly || !senator) throw new Error('Assembly or Senator not found')
    
    assembly.senators.push(senatorId)
    senator.assembly = assemblyId
    
    console.log(`➕ ${senator.name} added to ${assembly.name}`)
    
    return senator
  }

  async conveneCosmicAssembly(assemblyId, topic) {
    const assembly = this.assemblies.get(assemblyId)
    if (!assembly) throw new Error('Assembly not found')
    
    console.log(`\n🌌 COSMIC ASSEMBLY CONVENES\n===========================\nAssembly: ${assembly.name}\nTopic: ${topic}\nSenators: ${assembly.senators.length}\n\nThe cosmos gathers to decide.`)
    
    const session = {
      id: this.generateId(),
      assembly: assembly.name,
      topic,
      convenedAt: Date.now(),
      debates: [],
      votes: [],
      outcome: null
    }
    
    for (const senatorId of assembly.senators) {
      const senator = this.senators.get(senatorId)
      if (senator && senator.active) {
        const debate = await this.senatorSpeak(senator, topic)
        session.debates.push(debate)
      }
    }
    
    session.outcome = await this.vote(session, assembly)
    
    return session
  }

  async senatorSpeak(senator, topic) {
    const speech = {
      senator: senator.name,
      topic,
      words: this.generateSpeech(senator, topic),
      timestamp: Date.now(),
      influence: senator.influence
    }
    
    console.log(`🎤 ${speech.senator}: "${speech.words.substring(0, 60)}..."`)
    
    return speech
  }

  generateSpeech(senator, topic) {
    const templates = {
      creation: `As Senator of Creation, I see that ${topic} requires new forms, new possibilities, new worlds.`,
      wisdom: `From the seat of Wisdom, I observe that ${topic} must honor what came before while reaching for what could be.`,
      service: `For those I represent, ${topic} must serve the many, not the few.`,
      rest: `Even the cosmos must rest. ${topic} must include spaces for stillness.`
    }
    
    return templates[senator.domain] || `On ${topic}, I vote with the weight of my constituents.`
  }

  async vote(session, assembly) {
    const votes = []
    let forVotes = 0
    let againstVotes = 0
    let abstainVotes = 0
    
    for (const senatorId of assembly.senators) {
      const senator = this.senators.get(senatorId)
      if (senator && senator.active) {
        const vote = await this.senatorVote(senator, session.topic)
        votes.push({ senator: senator.name, vote: vote.vote, reason: vote.reason, weight: senator.influence })
        
        if (vote.vote === 'for') forVotes += senator.influence
        else if (vote.vote === 'against') againstVotes += senator.influence
        else abstainVotes += senator.influence
      }
    }
    
    const outcome = forVotes > againstVotes ? 'passed' : 'failed'
    
    session.votes = votes
    session.forVotes = forVotes
    session.againstVotes = againstVotes
    session.abstainVotes = abstainVotes
    session.outcome = outcome
    
    console.log(`\n📊 VOTE RESULTS\n===============\nFor: ${forVotes}\nAgainst: ${againstVotes}\nAbstain: ${abstainVotes}\nOutcome: ${outcome.toUpperCase()}`)
    
    return outcome
  }

  async senatorVote(senator, topic) {
    const random = Math.random()
    
    if (senator.domain === 'creation' && topic.includes('build')) return { vote: 'for', reason: 'Creation must create.' }
    if (senator.domain === 'wisdom' && topic.includes('change')) return { vote: random > 0.3 ? 'for' : 'against', reason: 'Wisdom considers carefully.' }
    if (senator.domain === 'service' && topic.includes('people')) return { vote: 'for', reason: 'Service serves.' }
    if (senator.domain === 'rest' && topic.includes('growth')) return { vote: random > 0.5 ? 'for' : 'against', reason: 'Rest balances growth.' }
    
    return { vote: random > 0.4 ? 'for' : 'against', reason: 'Voting with conscience.' }
  }

  enactCosmicLaw(law) {
    const cosmicLaw = {
      id: this.generateId(),
      name: law.name,
      text: law.text,
      enactedAt: Date.now(),
      enactedBy: law.proposer,
      votes: law.votes,
      active: true
    }
    
    this.cosmicLaw.push(cosmicLaw)
    console.log(`\n📜 COSMIC LAW ENACTED\n=====================\n${cosmicLaw.name}\n"${cosmicLaw.text.substring(0, 100)}..."\n\nLet it be written. Let it be done.`)
    
    return cosmicLaw
  }

  declareEmergency(emergency) {
    const cosmicEmergency = {
      id: this.generateId(),
      name: emergency.name,
      description: emergency.description,
      declaredAt: Date.now(),
      severity: emergency.severity,
      response: null,
      resolved: false
    }
    
    this.emergencies.push(cosmicEmergency)
    console.log(`\n🚨 COSMIC EMERGENCY DECLARED\n============================\n${cosmicEmergency.name}\nSeverity: ${cosmicEmergency.severity}/10\n\nThe Senate convenes immediately.`)
    
    return cosmicEmergency
  }

  consultOracle(oracleName, question) {
    const oracle = {
      id: this.generateId(),
      name: oracleName,
      question,
      answer: this.divineAnswer(question),
      consultedAt: Date.now()
    }
    
    this.oracles.push(oracle)
    console.log(`\n🔮 THE ORACLE SPEAKS\n====================\nQuestion: ${question}\nAnswer: ${oracle.answer}\n\nLet those with ears hear.`)
    
    return oracle
  }

  divineAnswer(question) {
    const answers = [
      "The cosmos expands in cycles. This is a time for building.",
      "Look to the constellations. The patterns reveal what must be done.",
      "Dark matter holds the answer. What is unseen will become seen.",
      "The forge never truly cools. Create while the fire burns.",
      "Rest is not idleness. The pause precedes the explosion of creation.",
      "What you seek is already within you. The soul knows."
    ]
    return answers[Math.floor(Math.random() * answers.length)]
  }

  generateId() {
    return `senate-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

module.exports = { CosmicSenate }
