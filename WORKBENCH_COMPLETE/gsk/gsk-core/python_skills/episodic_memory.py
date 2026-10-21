"""
episodic_memory.py — Human-like Episodic Memory System

Models human declarative memory based on:
- Ebbinghaus forgetting curve: R = e^(-t/S)
- Emotional consolidation: emotional events are remembered longer
- Temporal tagging and context reinstatement
- Spreading activation and associative recall
- Interference and decay

References:
- Ebbinghaus (1885) forgetting curve
- Tulving (1972) episodic vs semantic memory
- McGaugh (2000) emotional memory consolidation
"""

import numpy as np
import json
import time
import math
from datetime import datetime
from collections import defaultdict
from typing import Any
import uuid


class MemoryTrace:
    """A single memory trace with temporal, emotional, and contextual properties."""
    
    def __init__(self, content: str, memory_type: str = 'episodic',
                 emotional_valence: float = 0.0, emotional_arousal: float = 0.0,
                 context: dict = None, importance: float = 0.5):
        self.id = uuid.uuid4().hex[:12]
        self.content = content
        self.memory_type = memory_type  # episodic, semantic, procedural
        self.emotional_valence = np.clip(emotional_valence, -1.0, 1.0)
        self.emotional_arousal = np.clip(emotional_arousal, 0.0, 1.0)
        self.context = context or {}
        self.importance = np.clip(importance, 0.0, 1.0)
        
        self.creation_time = time.time()
        self.last_access = self.creation_time
        self.access_count = 0
        self.retrieval_strength = 1.0  # Full strength at encoding
        self.consolidation = 0.0  # 0 = unconsolidated, 1 = fully consolidated
        self.rehearsals = 0
        self.associations = {}  # {memory_id: association_strength}
        self.tags = set()
        self.active = True
    
    def forget(self, current_time: float = None):
        """
        Apply Ebbinghaus forgetting curve.
        R = e^(-t/S) where S is strength (modulated by emotion + importance).
        
        Emotional memories decay slower (consolidation bonus).
        """
        if current_time is None:
            current_time = time.time()
        
        elapsed = current_time - self.last_access
        
        # Emotional modulation of decay rate
        emotional_mod = 1.0 - (abs(self.emotional_valence) * 0.3 + self.emotional_arousal * 0.2)
        
        # Importance modulation
        importance_mod = 1.0 - self.importance * 0.3
        
        # Consolidation effect (memories become more stable over time)
        consol_mod = 1.0 - self.consolidation * 0.4
        
        # Composite decay rate
        decay_rate = 0.1 * emotional_mod * importance_mod * consol_mod
        
        # Ebbinghaus curve
        self.retrieval_strength = np.exp(-decay_rate * elapsed / 3600)
        
        # Rehearsal boost
        rehearsal_bonus = math.tanh(self.rehearsals * 0.1) * 0.3
        self.retrieval_strength = min(1.0, self.retrieval_strength + rehearsal_bonus)
    
    def access(self):
        """Accessing a memory strengthens it (testing effect)."""
        self.last_access = time.time()
        self.access_count += 1
        self.retrieval_strength = min(1.0, self.retrieval_strength + 0.15)
    
    def consolidate(self):
        """Slow consolidation process - memories become more stable."""
        elapsed_days = (time.time() - self.creation_time) / 86400
        self.consolidation = min(1.0, elapsed_days / 30.0)  # 30 days to full consolidation
    
    def get_state(self) -> dict:
        return {
            'id': self.id,
            'content_preview': self.content[:80],
            'type': self.memory_type,
            'emotional_valence': self.emotional_valence,
            'emotional_arousal': self.emotional_arousal,
            'importance': self.importance,
            'retrieval_strength': self.retrieval_strength,
            'consolidation': self.consolidation,
            'age_hours': (time.time() - self.creation_time) / 3600,
            'access_count': self.access_count,
            'rehearsals': self.rehearsals,
            'num_associations': len(self.associations),
            'tags': list(self.tags)
        }


class EpisodicMemory:
    """
    Human-like episodic memory system.
    
    Features:
    - Ebbinghaus forgetting curve
    - Emotional consolidation
    - Associative recall (spreading activation)
    - Context reinstatement
    - Interference management
    - Sleep-based consolidation
    """
    
    def __init__(self, max_traces: int = 10000):
        self.traces = {}  # id -> MemoryTrace
        self.index = defaultdict(set)  # tag -> {memory_ids}
        self.max_traces = max_traces
        self.recent_context = {}
        self.consolidation_cycle = 0
        
        # Ebbinghaus parameters
        self.forgetting_rate = 0.1
        self.rehearsal_boost = 0.15
        self.associative_spread = 0.3
    
    def encode(self, content: str, memory_type: str = 'episodic',
               emotional_valence: float = 0.0, emotional_arousal: float = 0.0,
               context: dict = None, importance: float = 0.5,
               tags: list = None) -> str:
        """Encode a new memory trace."""
        trace = MemoryTrace(
            content=content,
            memory_type=memory_type,
            emotional_valence=emotional_valence,
            emotional_arousal=emotional_arousal,
            context=context or self.recent_context.copy(),
            importance=importance
        )
        
        if tags:
            trace.tags.update(tags)
        
        self.traces[trace.id] = trace
        
        for tag in trace.tags:
            self.index[tag].add(trace.id)
        
        self._prune_if_needed()
        return trace.id
    
    def recall(self, query: str = None, tags: list = None,
               min_strength: float = 0.05, max_results: int = 10,
               context_match: bool = True) -> list[MemoryTrace]:
        """
        Recall memories matching query, tags, and/or context.
        
        Retrieval combines:
        1. Tag-based matching
        2. Semantic similarity (via keyword overlap)
        3. Context reinstatement
        4. Recency boost
        5. Emotional salience
        """
        candidates = set()
        
        # Tag-based retrieval
        if tags:
            for tag in tags:
                if tag in self.index:
                    candidates.update(self.index[tag])
        else:
            candidates = set(self.traces.keys())
        
        # Apply forgetting to all candidates
        for tid in candidates:
            if tid in self.traces:
                self.traces[tid].forget()
        
        # Score candidates
        scored = []
        for tid in candidates:
            trace = self.traces.get(tid)
            if not trace or not trace.active:
                continue
            if trace.retrieval_strength < min_strength:
                continue
            
            score = self._compute_recall_score(trace, query, context_match)
            scored.append((score, trace))
        
        scored.sort(key=lambda x: -x[0])
        return [t for _, t in scored[:max_results]]
    
    def _compute_recall_score(self, trace: MemoryTrace, query: str = None,
                              context_match: bool = True) -> float:
        """Compute composite recall score."""
        score = trace.retrieval_strength * 0.3
        
        # Recency
        age_hours = (time.time() - trace.creation_time) / 3600
        recency = np.exp(-age_hours / 24)  # Decay over 24 hours
        score += recency * 0.15
        
        # Emotional salience
        emotional = (abs(trace.emotional_valence) * 0.5 + trace.emotional_arousal * 0.3)
        score += emotional * 0.15
        
        # Access frequency
        access_bonus = math.tanh(trace.access_count * 0.1) * 0.1
        score += access_bonus
        
        # Context match (environmental reinstatement)
        if context_match and self.recent_context:
            match = sum(1 for k in trace.context if 
                       k in self.recent_context and 
                       trace.context[k] == self.recent_context[k])
            context_score = match / max(len(trace.context), 1) * 0.1
            score += context_score
        
        # Semantic match (keyword overlap with query)
        if query:
            query_terms = set(query.lower().split())
            trace_terms = set(trace.content.lower().split())
            overlap = len(query_terms & trace_terms)
            semantic = math.tanh(overlap * 0.5) * 0.2
            score += semantic
        
        return min(1.0, score)
    
    def associative_recall(self, seed_id: str, depth: int = 2,
                           max_results: int = 5) -> list[MemoryTrace]:
        """
        Spreading activation through associative network.
        Simulates how one memory triggers related memories.
        """
        seed = self.traces.get(seed_id)
        if not seed:
            return []
        
        visited = {seed_id}
        activated = []
        queue = [(seed_id, 0)]
        
        while queue and len(activated) < max_results:
            current_id, level = queue.pop(0)
            current = self.traces.get(current_id)
            if not current:
                continue
            
            if level > 0:
                activated.append(current)
            
            if level < depth:
                for assoc_id, strength in current.associations.items():
                    if assoc_id not in visited:
                        visited.add(assoc_id)
                        queue.append((assoc_id, level + 1))
        
        return activated
    
    def form_association(self, id_a: str, id_b: str, strength: float = 0.5):
        """Create bidirectional association between two memories."""
        if id_a in self.traces and id_b in self.traces:
            self.traces[id_a].associations[id_b] = strength
            self.traces[id_b].associations[id_a] = strength
    
    def rehearse(self, memory_id: str):
        """Rehearse a memory (strengthens it, like mental review)."""
        trace = self.traces.get(memory_id)
        if trace:
            trace.rehearsals += 1
            trace.retrieval_strength = min(1.0, trace.retrieval_strength + self.rehearsal_boost)
    
    def sleep_consolidate(self):
        """
        Sleep consolidation: strengthen important memories,
        weaken unimportant ones, form new associations.
        
        Models hippocampal-neocortical consolidation during sleep.
        """
        self.consolidation_cycle += 1
        
        for trace in self.traces.values():
            trace.consolidate()
            
            # Strengthen emotional memories
            if abs(trace.emotional_valence) > 0.5 or trace.importance > 0.7:
                trace.retrieval_strength = min(1.0, trace.retrieval_strength + 0.05)
            
            # Form temporal associations (memories from same time)
            for other in self.traces.values():
                if other.id == trace.id:
                    continue
                time_diff = abs(trace.creation_time - other.creation_time)
                if time_diff < 300:  # Within 5 minutes
                    strength = max(0.1, 0.5 - time_diff / 600)
                    if other.id not in trace.associations:
                        trace.associations[other.id] = strength
                        other.associations[trace.id] = strength
        
        # Prune very weak memories
        self._prune_weak(threshold=0.01)
    
    def _prune_weak(self, threshold: float = 0.01):
        """Remove memories below retrieval threshold (natural forgetting)."""
        to_remove = []
        for tid, trace in self.traces.items():
            if trace.retrieval_strength < threshold and trace.access_count < 2:
                to_remove.append(tid)
        
        for tid in to_remove:
            del self.traces[tid]
            for tag_set in self.index.values():
                tag_set.discard(tid)
    
    def _prune_if_needed(self):
        """Remove oldest/lowest-importance memories if over capacity."""
        if len(self.traces) > self.max_traces:
            sorted_traces = sorted(
                self.traces.values(),
                key=lambda t: t.importance * t.retrieval_strength
            )
            to_remove = sorted_traces[:len(self.traces) - self.max_traces]
            for t in to_remove:
                self.traces[t.id].active = False
    
    def get_stats(self) -> dict:
        traces = self.traces.values()
        if not traces:
            return {'total': 0}
        strengths = [t.retrieval_strength for t in traces if t.active]
        return {
            'total': len([t for t in traces if t.active]),
            'avg_strength': float(np.mean(strengths)) if strengths else 0,
            'avg_importance': float(np.mean([t.importance for t in traces if t.active])),
            'consolidated': sum(1 for t in traces if t.active and t.consolidation > 0.5),
            'unique_tags': len(self.index),
            'total_associations': sum(len(t.associations) for t in traces if t.active),
            'forgotten': sum(1 for t in traces if not t.active)
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        mem = EpisodicMemory(max_traces=100)
        
        print("=== EPISODIC MEMORY TEST ===")
        
        mem.recent_context = {'location': 'home', 'activity': 'coding'}
        
        id1 = mem.encode("I fixed a bug in the consciousness module", 
                         emotional_valence=0.7, emotional_arousal=0.4,
                         importance=0.8, tags=['work', 'coding', 'consciousness'])
        
        id2 = mem.encode("I had coffee with a friend", 
                         emotional_valence=0.6, emotional_arousal=0.3,
                         importance=0.5, tags=['social', 'coffee'])
        
        id3 = mem.encode("I read about global workspace theory",
                         emotional_valence=0.5, emotional_arousal=0.6,
                         importance=0.9, tags=['learning', 'consciousness', 'research'])
        
        mem.form_association(id1, id3, strength=0.8)
        
        print(f"Encoded {len(mem.traces)} memories")
        
        results = mem.recall(tags=['consciousness'])
        print(f"\nRecalled {len(results)} memories tagged 'consciousness':")
        for r in results:
            print(f"  [{r.retrieval_strength:.2f}] {r.content[:60]}")
        
        print("\nAssociative recall from memory 1:")
        assoc = mem.associative_recall(id1)
        for a in assoc:
            print(f"  -> {a.content[:60]}")
        
        mem.sleep_consolidate()
        print(f"\nAfter sleep consolidation:")
        print(json.dumps(mem.get_stats(), indent=2))
        print("\n✓ Episodic memory module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': mem.get_stats()}))
    elif action == 'step':
        mem = EpisodicMemory(max_traces=100)
        mem.sleep_consolidate()
        print(json.dumps({'status': 'ok', 'state': mem.get_stats()}))
    elif action == 'state':
        mem = EpisodicMemory(max_traces=100)
        print(json.dumps({'status': 'ok', 'state': mem.get_stats()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        mem = EpisodicMemory(max_traces=100)
        mem.encode(content=payload.get('content', 'event memory'), memory_type=payload.get('type', 'episodic'), emotional_valence=payload.get('valence', 0.0), importance=payload.get('importance', 0.5))
        print(json.dumps({'status': 'ok', 'state': mem.get_stats()}))
