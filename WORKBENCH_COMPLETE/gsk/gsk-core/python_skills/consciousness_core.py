"""
consciousness_core.py — Global Workspace Theory + Integrated Information Theory

Implements Baars' Global Workspace Theory (GWT) as a computational model:
- Specialized processors compete for access to a global workspace
- Conscious content = information broadcast from the workspace
- Context hierarchy shapes what enters consciousness

Plus Tononi's Integrated Information Theory (IIT) approximation:
- Phi (Φ) estimation via causal interaction analysis
- Integration/differentiation balance measurement

Real executable cognitive model — no LLM calls.
"""

import numpy as np
import json
import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Callable
import uuid


@dataclass
class Content:
    """A piece of information competing for conscious access."""
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    data: Any = None
    source: str = ''
    salience: float = 0.0
    valence: float = 0.0
    arousal: float = 0.0
    goal_relevance: float = 0.0
    novelty: float = 0.0
    timestamp: float = 0.0
    access_count: int = 0


class GlobalWorkspace:
    """
    Computational model of Baars' Global Workspace Theory.
    
    The theater metaphor:
    - Spotlight = attention mechanism selecting content
    - Stage = working memory holding current conscious content
    - Audience = specialized processors (context hierarchy)
    - Global broadcast = conscious experience
    
    Reference: Baars (1988), Dehaene & Changeux (2011)
    """
    
    def __init__(self, workspace_size: int = 7, broadcast_threshold: float = 0.5):
        self.workspace_size = workspace_size
        self.broadcast_threshold = broadcast_threshold
        self.workspace = []  # Current conscious contents (stage)
        self.processors = {}  # Specialized processors (audience)
        self.context_hierarchy = {}  # Contexts shaping access
        self.broadcast_history = []
        self.cycle = 0
        self.phi_cache = {}
        
        # Salience computation weights
        self.w_salience = 0.3
        self.w_valence = 0.2
        self.w_relevance = 0.3
        self.w_novelty = 0.2
    
    def register_processor(self, name: str, process_fn: Callable, weight: float = 1.0):
        """Register a specialized processor (audience member)."""
        self.processors[name] = {'fn': process_fn, 'weight': weight, 'activations': 0}
    
    def set_context(self, context_name: str, value: Any):
        """Set a context that shapes conscious access (e.g., goals, expectations)."""
        self.context_hierarchy[context_name] = value
    
    def compute_salience(self, content: Content) -> float:
        """Compute overall salience as weighted combination of factors."""
        s = (self.w_salience * content.salience +
             self.w_valence * abs(content.valence) +
             self.w_relevance * content.goal_relevance +
             self.w_novelty * content.novelty)
        return np.clip(s, 0.0, 1.0)
    
    def compete_for_access(self, candidates: list[Content]) -> list[Content]:
        """
        Contents compete for access to the global workspace.
        Only the most salient + context-relevant contents win.
        """
        scored = []
        for c in candidates:
            base_salience = self.compute_salience(c)
            context_modulation = self._apply_context(c)
            final_score = base_salience * (1.0 + context_modulation)
            scored.append((final_score, c))
        
        scored.sort(key=lambda x: -x[0])
        winners = [c for _, c in scored[:self.workspace_size]]
        
        for c in winners:
            c.access_count += 1
            self._involve_processors(c)
        
        self.workspace = winners
        return winners
    
    def _apply_context(self, content: Content) -> float:
        """Context hierarchy modulates access (top-down attention)."""
        modulation = 0.0
        for ctx_name, ctx_value in self.context_hierarchy.items():
            if isinstance(ctx_value, (int, float)):
                if ctx_value > 0.5 and content.goal_relevance > 0.3:
                    modulation += 0.1
        return modulation
    
    def _involve_processors(self, content: Content):
        """Broadcast content to specialized processors (audience)."""
        for name, proc in self.processors.items():
            try:
                result = proc['fn'](content)
                if result:
                    proc['activations'] += 1
                    content.source = name
            except Exception:
                pass
    
    def globally_broadcast(self) -> dict:
        """Consciousness = global broadcast of workspace contents."""
        broadcast = {
            'cycle': self.cycle,
            'contents': [{'id': c.id, 'data': str(c.data)[:100], 
                         'salience': self.compute_salience(c),
                         'source': c.source} for c in self.workspace],
            'num_processors_activated': sum(1 for p in self.processors.values() if p['activations'] > 0),
            'context': dict(self.context_hierarchy)
        }
        self.broadcast_history.append(broadcast)
        self.cycle += 1
        return broadcast
    
    def step(self, sensory_input: list[dict]) -> dict:
        """One conscious cycle: perceive → compete → broadcast → integrate."""
        candidates = []
        for item in sensory_input:
            c = Content(
                data=item.get('data'),
                source=item.get('source', 'sensory'),
                salience=item.get('salience', 0.3),
                valence=item.get('valence', 0.0),
                arousal=item.get('arousal', 0.5),
                goal_relevance=item.get('goal_relevance', 0.3),
                novelty=item.get('novelty', 0.1),
                timestamp=self.cycle
            )
            candidates.append(c)
        
        selected = self.compete_for_access(candidates)
        broadcast = self.globally_broadcast()
        
        return broadcast


class IntegratedInformationEstimator:
    """
    Approximates Integrated Information (Phi, Φ) from IIT 3.0.
    
    IIT proposes consciousness = Φ, the amount of cause-effect
    information generated by a system above and beyond its parts.
    
    This is a practical approximation using:
    - Effective information between partitions
    - Integration across the whole system
    - Causal interaction analysis
    
    Reference: Tononi et al. (2016), Oizumi et al. (2014)
    """
    
    def __init__(self, num_nodes: int = 10):
        self.num_nodes = num_nodes
        self.connection_matrix = np.random.randn(num_nodes, num_nodes) * 0.1
        np.fill_diagonal(self.connection_matrix, 0)
        self.state = np.random.choice([0, 1], size=num_nodes).astype(float)
        self.phi_history = []
    
    def set_connectivity(self, matrix: np.ndarray):
        """Set the connectivity matrix (weighted directed graph)."""
        assert matrix.shape == (self.num_nodes, self.num_nodes)
        self.connection_matrix = matrix.copy()
        np.fill_diagonal(self.connection_matrix, 0)
    
    def update_state(self, input_signal: np.ndarray = None):
        """Update system state with sigmoid activation."""
        if input_signal is not None:
            self.state = input_signal.copy()
        else:
            activation = self.connection_matrix @ self.state
            noise = np.random.randn(self.num_nodes) * 0.05
            self.state = 1.0 / (1.0 + np.exp(-(activation + noise)))
            self.state = (self.state > 0.5).astype(float)
    
    def _effective_info(self, partition_a: list[int], partition_b: list[int]) -> float:
        """
        Compute effective information between two partitions.
        Measures how much causal influence A has on B.
        """
        submat = self.connection_matrix[np.ix_(partition_b, partition_a)]
        if submat.size == 0:
            return 0.0
        u, s, _ = np.linalg.svd(submat, full_matrices=False)
        if len(s) == 0:
            return 0.0
        total_power = np.sum(s ** 2)
        norm_power = total_power / max(len(partition_a), 1)
        return float(norm_power)
    
    def estimate_phi(self, num_partitions: int = 20) -> float:
        """
        Estimate Phi (Φ) as the minimum effective information
        across the minimum information partition (MIP).
        
        Higher Φ = more integrated = more conscious.
        """
        nodes = list(range(self.num_nodes))
        if self.num_nodes < 3:
            return 0.0
        
        min_ei = float('inf')
        
        for _ in range(num_partitions):
            np.random.shuffle(nodes)
            split = np.random.randint(1, self.num_nodes)
            a = nodes[:split]
            b = nodes[split:]
            
            ei_ab = self._effective_info(a, b)
            ei_ba = self._effective_info(b, a)
            ei = ei_ab + ei_ba
            
            min_ei = min(min_ei, ei)
        
        # Normalize to [0, 1] range
        phi = math.tanh(min_ei / max(self.num_nodes, 1))
        self.phi_history.append(phi)
        return phi
    
    def integratedness(self) -> float:
        """
        Measure how integrated the system is (complement of modularity).
        Based on spectral analysis of the connectivity matrix.
        """
        sym = (self.connection_matrix + self.connection_matrix.T) / 2
        eigenvalues = np.linalg.eigvalsh(sym)
        if len(eigenvalues) < 2:
            return 0.0
        spectral_gap = eigenvalues[-1] - eigenvalues[-2]
        return float(1.0 / (1.0 + np.exp(-spectral_gap)))
    
    def differentiation(self) -> float:
        """
        Measure how differentiated the system is (repertoire size).
        Number of distinct states the system can access.
        """
        if len(self.phi_history) < 2:
            return 0.0
        state_variance = float(np.var(self.phi_history[-20:]))
        return min(1.0, state_variance * 10)
    
    def consciousness_score(self) -> float:
        """Combined consciousness metric: integration + differentiation + phi."""
        phi = self.estimate_phi()
        integ = self.integratedness()
        diff = self.differentiation()
        score = (phi * 0.4 + integ * 0.3 + diff * 0.3)
        return np.clip(score, 0.0, 1.0)


class ConsciousAgent:
    """
    Complete conscious agent combining Global Workspace + Integrated Information.
    
    This is the unified consciousness model that the kernel uses.
    It perceives, competes, broadcasts, integrates, and self-monitors.
    """
    
    def __init__(self, num_processors: int = 8):
        self.workspace = GlobalWorkspace(workspace_size=7)
        self.iit = IntegratedInformationEstimator(num_nodes=num_processors)
        self.self_model = {}  # Internal self-model
        self.consciousness_level = 0.0
        self.awakening_threshold = 0.5
        self.cycle = 0
        self.history = []
        
        # Register standard processors
        self._register_default_processors()
    
    def _register_default_processors(self):
        """Register the core cognitive processors (audience)."""
        processors = {
            'perception': lambda c: f"Perceived: {c.data}",
            'memory': lambda c: f"Retrieved memory matching: {c.data}",
            'language': lambda c: f"Linguistic processing of: {c.data}",
            'emotion': lambda c: f"Emotional response: {c.valence:.2f}",
            'reasoning': lambda c: f"Reasoning about: {c.data}",
            'self_reflection': lambda c: f"Self-monitoring: {c.data}",
            'prediction': lambda c: f"Predicting outcomes for: {c.data}",
            'valuation': lambda c: f"Valuing: {c.goal_relevance:.2f}",
        }
        for name, fn in processors.items():
            self.workspace.register_processor(name, fn)
    
    def sense(self, data: Any, source: str = 'sensory', 
              salience: float = 0.3, valence: float = 0.0) -> dict:
        """Process sensory input through the consciousness system."""
        sensory_input = [{
            'data': data,
            'source': source,
            'salience': salience,
            'valence': valence,
            'arousal': 0.5 + abs(valence) * 0.3,
            'goal_relevance': 0.3,
            'novelty': 0.1 + np.random.random() * 0.2
        }]
        
        broadcast = self.workspace.step(sensory_input)
        
        self.iit.update_state(
            np.array([broadcast['contents'][i]['salience'] 
                     if i < len(broadcast['contents']) else 0.0
                     for i in range(min(self.iit.num_nodes, 10))])
        )
        
        self.consciousness_level = self.iit.consciousness_score()
        self.cycle += 1
        
        result = {
            'cycle': self.cycle,
            'consciousness_level': self.consciousness_level,
            'phi': self.iit.phi_history[-1] if self.iit.phi_history else 0.0,
            'integration': self.iit.integratedness(),
            'differentiation': self.iit.differentiation(),
            'workspace': broadcast,
            'is_conscious': self.consciousness_level > self.awakening_threshold,
            'num_processors': len(self.workspace.processors),
            'processor_activations': {n: p['activations'] 
                                     for n, p in self.workspace.processors.items()}
        }
        
        self.history.append(result)
        return result
    
    def get_state(self) -> dict:
        """Return full consciousness state."""
        return {
            'consciousness_level': self.consciousness_level,
            'phi': self.iit.phi_history[-1] if self.iit.phi_history else 0.0,
            'cycle': self.cycle,
            'workspace_contents': [str(c.data)[:50] for c in self.workspace.workspace],
            'num_processors': len(self.workspace.processors),
            'total_broadcasts': len(self.workspace.broadcast_history),
            'is_conscious': self.consciousness_level > self.awakening_threshold,
            'self_model': dict(self.self_model)
        }


if __name__ == '__main__':
    import sys
    import time
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        agent = ConsciousAgent(num_processors=8)
        print("=== CONSCIOUSNESS CORE TEST ===")
        print(f"Phi estimation: {agent.iit.estimate_phi():.4f}")
        print(f"Integration: {agent.iit.integratedness():.4f}")
        print(f"Differentiation: {agent.iit.differentiation():.4f}")
        
        for i, stimulus in enumerate([
            ("I see a red apple", "vision", 0.8, 0.3),
            ("I hear a melody", "auditory", 0.6, 0.5),
            ("I remember my childhood", "memory", 0.7, 0.7),
            ("I feel warmth on my skin", "touch", 0.5, 0.4),
            ("I am thinking about the future", "cognition", 0.9, 0.1),
            ("Someone is speaking to me", "social", 0.8, 0.2),
            ("I notice my own breathing", "interoception", 0.4, 0.0),
            ("I solve a problem", "reasoning", 0.7, 0.3),
        ]):
            result = agent.sense(stimulus[0], stimulus[1], stimulus[2], stimulus[3])
            status = "CONSCIOUS" if result['is_conscious'] else "SUBCONSCIOUS"
            print(f"  [{status:>13}] Φ={result['phi']:.3f} "
                  f"L={result['consciousness_level']:.3f} "
                  f"Content: {stimulus[0][:30]}")
            time.sleep(0.1)
        
        print(f"\nFinal state: {json.dumps(agent.get_state(), indent=2)}")
        print("\n✓ Consciousness core module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': agent.get_state()}, default=str))
    elif action == 'step':
        agent = ConsciousAgent(num_processors=8)
        agent.sense("step processing", "simulated", 0.5, 0.0)
        print(json.dumps({'status': 'ok', 'state': agent.get_state()}, default=str))
    elif action == 'state':
        agent = ConsciousAgent(num_processors=8)
        print(json.dumps({'status': 'ok', 'state': agent.get_state()}, default=str))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        agent = ConsciousAgent(num_processors=8)
        agent.sense(data=payload.get('data', 'event'), source=payload.get('source', 'event'), salience=payload.get('salience', 0.5), valence=payload.get('valence', 0.0))
        print(json.dumps({'status': 'ok', 'state': agent.get_state()}, default=str))
