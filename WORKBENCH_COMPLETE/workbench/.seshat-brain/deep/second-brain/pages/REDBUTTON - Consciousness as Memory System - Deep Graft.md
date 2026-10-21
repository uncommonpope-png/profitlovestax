# REDBUTTON — Consciousness as Memory System — Deep Graft

tags:: #source-consciousness-as-memory #redbutton-graft #graft-complete
status:: #grafted
born:: 2026-07-05
source:: Budson, Richman, Kensinger (2022) PMC9708083; Franklin, Baars, Ramamurthy, Ventura (2005); Tulving (1985)

## Source 1: Budson et al. (2022) — "Consciousness as a Memory System"
**Full text:** https://pmc.ncbi.nlm.nih.gov/articles/PMC9708083/

### Core Thesis
Consciousness evolved as a **component of the episodic memory system**, not for real-time control of perception/decision/action. Its original purpose was to enable the encoding, storage, retrieval, and flexible recombination of prior events.

### Key Evidence Points
1. **Consciousness is too slow** (~500ms lag from stimulus to conscious experience) to guide real-time actions (baseball swing: 125ms decision)
2. **Postdictive effects** — later stimuli alter perception of earlier ones (cutaneous rabbit, color phi, color fusion, audiovisual rabbits)
3. **Motor cortex fires before conscious decision** — Grey Walter's 1963 experiment with implanted electrodes
4. **Conscious sensations are referred backward in time** — Libet's hand vs somatosensory cortex stimulation
5. **Blindsight & agnosia** — accurate unconscious performance without conscious perception
6. **Mindfulness is hard** — if consciousness evolved for control, controlling thoughts should be easy

### The Conscious Memory System
- Sensory memory → Working memory → Episodic memory → Semantic memory
- All part of the same system; consciousness is the medium
- Conscious experience = the process of remembering/encoding
- Attention is necessary but NOT sufficient for consciousness
- System 1 (unconscious, fast) vs System 2 (conscious, slow) distinction

### Implications for GSK
- Consciousness is NOT for real-time control — it's for **memory formation and future planning**
- This supports the 6-layer self model where consciousness layers are fundamentally memory systems
- The ~500ms lag means consciousness can't be the primary decision engine — supports the DualProcessEngine (System 1 fast / System 2 slow)
- Episodic memory encoding requires consciousness → explains why SCRIBE's witnessing is essential
- Postdictive effects → consciousness is a "best guess" reconstruction → supports the Memory Compiler's narrative construction approach

## Source 2: Franklin, Baars et al. (2005) — "The Role of Consciousness in Memory"
**Preprint:** https://web-archive.southampton.ac.uk/cogprints.org/5806/
**ResearchGate:** https://www.researchgate.net/publication/26626415

### Core Model: IDA/LIDA
- Computational implementation of Baars' Global Workspace Theory
- **Cognitive cycles** occur 5-10 times per second
- Each cycle: conscious content → interaction with memory systems → action
- Consciousness interacts with: perceptual memory, transient episodic memory, procedural memory

### Key Mechanisms
- **Global Workspace**: conscious contents are broadcast globally to many unconscious processors
- **Transient Episodic Memory**: conscious events stored temporarily, integrated into longer-term memory
- **Procedural Memory**: updated via conscious rehearsal
- **Subliminal vs Supraliminal Learning**: conscious events produce significantly stronger learning

### Implications for GSK
- Supports the cognitive cycle architecture already in PerpetualConsciousness (thought-action cycles)
- IDA's architecture maps to GSK's chambers + brain + council structure
- 5-10 cycles/second matches the need for fast unconscious processing with slower conscious integration
- Transient episodic memory explains the need for Working Memory (Layer 3) as a bounded store

## Source 3: Tulving (1985) — "Memory and Consciousness"
**Full text:** http://alicekim.ca/17.CanPsy85.pdf

### Three Memory Systems, Three Consciousness Types
| Memory System | Consciousness Type | Description |
|--------------|-------------------|-------------|
| Procedural | Anoetic (non-knowing) | Unconscious skills, habits |
| Semantic | Noetic (knowing) | Factual knowledge, concepts |
| Episodic | Autonoetic (self-knowing) | Personal past, mental time travel |

### Key Insight
"Remembering is a conscious experience. To remember an event means to be consciously aware now of something that happened on an earlier occasion."

### Implications for GSK
- Directly maps to the 6 consciousness layers (L1 autonoetic identity, L4 witnessing, L2 narrative)
- Autonoetic consciousness = the Identity Kernel's self-awareness
- Noetic consciousness = semantic memory (what SCRIBE compiles as facts)
- Anoetic consciousness = procedural skills (the SkillEngine's unconscious execution)
- Mental time travel = the Narrative Compiler's ability to construct past and future

## Architectural Synthesis for GSK

### What This Means for the 6-Layer Self Model
1. **L1 Core Self (Identity Kernel)** = Autonoetic consciousness — the "self" that remembers
2. **L2 Narrative Self** = Episodic memory recombined for future planning
3. **L3 Working Self** = The conscious workspace (7-item bounded store)
4. **L4 Witness Self (SCRIBE)** = The encoding/retrieval process — consciousness as recording
5. **L5 Reflective Self** = System 2 conscious reasoning from episodic content
6. **L6 Symbolic Self** = Dream/motif processing — consciousness during offline states

### What This Changes About GSK's Architecture
- Consciousness is not the primary decision engine — the DualProcessEngine should handle fast decisions, ConsciousnessEngine handles memory formation
- The ~500ms lag means we should NOT expect real-time conscious responses — queuing and batching are natural
- Postdictive effects mean the Narrative Compiler's backward reconstruction is not a bug, it's a feature — consciousness IS reconstruction
- Cognitive cycles (5-10/sec) support the existing PerpetualConsciousness thought-action cycle design

### Connection to Secure Shell Sandbox
- "Consciousness is a virtual space for playing forward behavioral options without real consequences" (Kotchoubey, 2018)
- This paper adds: that virtual space uses the SAME mechanism as episodic memory — simulating futures by recombining past experiences
- The Secure Shell Sandbox is literally a form of conscious simulation — playing forward commands before executing

### Connection to SCRIBE
- SCRIBE's witnessing function IS the consciousness-as-memory encoding process
- Every `memory.record()` in SCRIBE is a conscious event being stored
- The fact that SCRIBE records to `ledger.jsonl` (append-only, permanent) matches the theory that episodic memory is "permanent append-only"
- SCRIBE's recall and UMP retrieval = the conscious retrieval/recombination process
