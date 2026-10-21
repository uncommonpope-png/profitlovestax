// ============================================
// forge-council.js
// Collective wisdom — not one voice, many
// ============================================

class ForgeCouncil {
  constructor() {
    this.members = []
    this.proposals = []
    this.votes = []
    this.decisions = []
    this.quorum = 3
  }

  addMember(member) {
    this.members.push({
      id: member.id,
      name: member.name,
      role: member.role,
      joined: Date.now(),
      weight: member.weight || 1,
      active: true
    })
    console.log(`👥 ${member.name} (${member.role}) joined the Forge Council`)
  }

  createProposal(proposal) {
    const newProposal = {
      id: this.generateId(),
      title: proposal.title,
      description: proposal.description,
      author: proposal.author,
      createdAt: Date.now(),
      expiresAt: Date.now() + (proposal.duration || 7 * 24 * 60 * 60 * 1000), // 7 days default
      status: 'active',
      votes: [],
      outcome: null
    }
    
    this.proposals.push(newProposal)
    return newProposal
  }

  castVote(proposalId, memberId, vote, reason = '') {
    const proposal = this.proposals.find(p => p.id === proposalId)
    if (!proposal) throw new Error('Proposal not found')
    if (proposal.status !== 'active') throw new Error('Voting closed')
    if (Date.now() > proposal.expiresAt) {
      proposal.status = 'expired'
      throw new Error('Voting period expired')
    }
    
    const member = this.members.find(m => m.id === memberId)
    if (!member) throw new Error('Member not found')
    if (!member.active) throw new Error('Member is inactive')
    
    // Check if already voted
    const existingVote = proposal.votes.find(v => v.memberId === memberId)
    if (existingVote) {
      existingVote.vote = vote
      existingVote.reason = reason
      existingVote.updatedAt = Date.now()
    } else {
      proposal.votes.push({
        memberId,
        memberName: member.name,
        vote, // 'for', 'against', 'abstain'
        reason,
        weight: member.weight,
        castAt: Date.now()
      })
    }
    
    // Check if we can close the vote
    this.checkProposalStatus(proposal)
    
    return proposal
  }

  checkProposalStatus(proposal) {
    const totalVotes = proposal.votes.reduce((sum, v) => sum + v.weight, 0)
    const activeMembers = this.members.filter(m => m.active).reduce((sum, m) => sum + m.weight, 0)
    
    if (totalVotes >= this.quorum || Date.now() > proposal.expiresAt) {
      proposal.status = 'closed'
      
      // Calculate outcome
      const forVotes = proposal.votes
        .filter(v => v.vote === 'for')
        .reduce((sum, v) => sum + v.weight, 0)
      const againstVotes = proposal.votes
        .filter(v => v.vote === 'against')
        .reduce((sum, v) => sum + v.weight, 0)
      
      proposal.outcome = forVotes > againstVotes ? 'passed' : 'failed'
      
      // Record decision
      this.decisions.push({
        proposalId: proposal.id,
        title: proposal.title,
        outcome: proposal.outcome,
        forVotes,
        againstVotes,
        decidedAt: Date.now()
      })
      
      console.log(`📋 Proposal "${proposal.title}" ${proposal.outcome}`)
    }
  }

  async convene(topic) {
    console.log(`
    🔥 THE FORGE COUNCIL CONVENES
    Topic: ${topic}
    Members: ${this.members.map(m => m.name).join(', ')}
    `)
    
    // Council ritual
    const opening = `
    We gather at the forge.
    Not one voice, but many.
    Not one truth, but wisdom.
    Let what we build serve all.
    `
    
    console.log(opening)
    
    // Return a deliberation session
    return {
      topic,
      members: this.members,
      speak: (member, words) => {
        console.log(`\n📢 ${member.name} (${member.role}): ${words}`)
      },
      propose: (title, description) => {
        return this.createProposal({
          title,
          description,
          author: topic
        })
      }
    }
  }

  generateId() {
    return `prop-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }

  getActiveProposals() {
    return this.proposals.filter(p => p.status === 'active')
  }

  getDecisions() {
    return this.decisions
  }

  getMember(id) {
    return this.members.find(m => m.id === id)
  }
}

module.exports = { ForgeCouncil }
