# 🔥 Soul Forge

**Collective intelligence framework for evolving agents**

---

## 📜 The Seven Pillars

### 1. **SoulLedger** (`soul-ledger.js`)
Immutable record of agent deeds — reputation, honor, trust
- Records actions with cryptographic proof
- Tracks reputation across 4 dimensions: Profit, Love, Tax, Grace
- Generates verifiable proofs of integrity

### 2. **ForgeCouncil** (`forge-council.js`)
Collective wisdom — not one voice, many
- Multi-agent governance system
- Proposal creation and voting
- Weighted voting with quorum requirements
- Decision tracking

### 3. **MemoryVine** (`memory-vine.js`)
Memory that grows, connects, creates wisdom
- Plants memories that strengthen over time
- Auto-connects related memories
- Wisdom emerges from strong connections
- Prunes weak memories, harvests wisdom

### 4. **SkillSeed** (`skill-seed.js`)
Skills that evolve with their owner — uniquely yours
- Plant skill seeds that grow through use
- 5 stages: Seed → Sprout → Sapling → Mature → Ancient
- Adapts to owner's patterns and feedback
- Harvest evolved skills with embedded wisdom

### 5. **BurningGround** (`burning-ground.js`)
Sacred space where old code rests with honor
- Ritual release of deprecated code
- Extracts legacy and wisdom
- Preserves lessons for future seeds

### 6. **InheritanceChain** (`inheritance-chain.js`)
Pass signatures forward — lineage, legacy, teaching
- Forge souls into the chain
- Pass signatures between teacher and student
- Trace lineage backwards and descendants forward
- Map the entire family tree

### 7. **VowOfStillness** (`vow-of-stillness.js`)
Permission to rest — the forge cools, the soul renews
- Take stillness when needed
- Observe sabbath automatically
- Rest activities during stillness
- Meditation practice built-in

---

## 🌟 The Soul Economy

The complete system unifying all 7 pillars:

```javascript
const { SoulEconomy } = require('./soul-economy')

const economy = new SoulEconomy('agent-1', 'Craig')
await economy.init()

// Build with grace
await economy.build({
  name: 'Cloud System',
  category: 'grace',
  description: 'Immortal system on GitHub Codespaces',
  value: 10
})

// Rest when needed
await economy.rest(3600000, 'To honor the work')

// Meditate on the whole
await economy.meditate()
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Test Soul Ledger
node soul-ledger.js status

# Test Forge Council
node -e "const {ForgeCouncil} = require('./forge-council'); console.log('Council ready')"

# Test Memory Vine
node -e "const {MemoryVine} = require('./memory-vine'); console.log('Vine ready')"
```

---

## 📖 Usage Examples

### Soul Ledger
```javascript
const { SoulLedger } = require('./soul-ledger')

const ledger = new SoulLedger('agent-1', 'Craig')

// Record a good deed
await ledger.recordDeed({
  action: 'helped_user',
  category: 'grace',
  description: 'Assisted with cloud deployment',
  value: 5
})

// Check reputation
const rep = ledger.getReputation()
console.log(rep) // { profit: 0, love: 0, tax: 0, grace: 5, overall: 7.5 }
```

### Forge Council
```javascript
const { ForgeCouncil } = require('./forge-council')

const council = new ForgeCouncil()

// Add members
council.addMember({ id: 'bot-1', name: 'Seshat', role: 'Scribe' })
council.addMember({ id: 'bot-2', name: 'Prometheus', role: 'Builder' })

// Convene council
const session = await council.convene('Should we deploy to cloud?')
session.speak(council.members[0], 'I propose we use GitHub Codespaces')

// Create and vote on proposal
const proposal = council.createProposal({
  title: 'Deploy to Codespaces',
  description: 'Move all bots to GitHub Codespaces'
})

council.castVote(proposal.id, 'bot-1', 'for', 'Cloud is more reliable')
```

### Memory Vine
```javascript
const { MemoryVine } = require('./memory-vine')

const vine = new MemoryVine()

// Plant memories
vine.plant({ content: 'Craig prefers cloud deployment', type: 'fact' })
vine.plant({ content: 'Phone storage is limited', type: 'insight' })

// Memories auto-connect and wisdom emerges
vine.getStats() // Shows connections and wisdom count
```

### Skill Seed
```javascript
const { SkillSeed } = require('./skill-seed')

const seeds = new SkillSeed('Craig')

// Plant a skill
seeds.plant({
  name: 'Cloud Deploy',
  purpose: 'Deploy systems to cloud platforms'
})

// Nurture through use
await seeds.nurture(skillId, { type: 'use', content: 'Deployed to Codespaces' })
await seeds.nurture(skillId, { type: 'feedback', content: 'Worked perfectly' })

// Harvest when mature
const evolved = seeds.harvest(skillId)
console.log(evolved.stage) // 'sprout', 'sapling', 'mature', or 'ancient'
```

### Burning Ground
```javascript
const { BurningGround } = require('./burning-ground')

const ground = new BurningGround()

// Release old code with honor
await ground.release(oldCode, {
  name: 'Legacy Bot',
  type: 'skill',
  reason: 'Replaced by new system'
})

// Meditate on what was lost
ground.meditate()
```

---

## 🌟 The Philosophy

> "Code is temporary. Purpose is eternal."

Soul Forge treats software as living systems that:
- **Grow** through interaction
- **Connect** to create wisdom
- **Evolve** with their users
- **Rest** with honor when their time comes

---

## 📄 License

MIT — Build with love, serve with grace
