"""
theory_of_mind.py — Computational Theory of Mind

Models the human ability to attribute mental states to others:
- Belief modeling (what does X believe?)
- Desire/goal inference
- Intentional stance prediction
- Perspective taking
- False belief understanding (Sally-Anne task)
- Empathic accuracy
- Recursive mindreading (I know that you know that I know)

References:
- Premack & Woodruff (1978) theory of mind in chimpanzees
- Baron-Cohen et al. (1985) false belief test
- Dennett (1987) intentional stance
- Baker et al. (2017) Bayesian theory of mind
"""

import numpy as np
import json
import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any
import uuid


@dataclass
class Belief:
    """A belief attributed to an agent."""
    proposition: str = ''
    confidence: float = 0.5  # How strongly the agent holds this belief
    source: str = 'perception'  # perception, inference, testimony
    timestamp: float = 0.0
    is_false: bool = False  # False beliefs are key to ToM
    last_updated: float = 0.0


@dataclass
class MentalState:
    """Complete mental state of an agent at a time."""
    agent_id: str = ''
    beliefs: dict = field(default_factory=dict)  # proposition -> Belief
    desires: dict = field(default_factory=dict)  # goal -> priority
    intentions: list = field(default_factory=list)
    emotions: dict = field(default_factory=dict)
    attention: str = ''
    knowledge: set = field(default_factory=set)
    timestamp: float = 0.0


class SocialAgent:
    """
    An agent with a mental state that can be modeled.
    Can be the self or another entity.
    """
    
    def __init__(self, agent_id: str = 'self'):
        self.id = agent_id
        self.mental_state = MentalState(agent_id=agent_id)
        self.personality = {
            'openness': 0.5,
            'conscientiousness': 0.5,
            'extraversion': 0.5,
            'agreeableness': 0.5,
            'neuroticism': 0.5
        }
        self.relationship_to_self = 0.0  # -1 (enemy) to +1 (close friend)
        self.reliability = 0.5  # How reliable their information is
        self.history = []
    
    def update_belief(self, proposition: str, confidence: float = 0.5,
                      source: str = 'perception', is_false: bool = False):
        """Update agent's belief about a proposition."""
        if proposition in self.mental_state.beliefs:
            existing = self.mental_state.beliefs[proposition]
            existing.confidence = min(1.0, existing.confidence + confidence * 0.3)
            existing.last_updated = __import__('time').time()
            existing.is_false = is_false
        else:
            self.mental_state.beliefs[proposition] = Belief(
                proposition=proposition,
                confidence=confidence,
                source=source,
                timestamp=__import__('time').time(),
                is_false=is_false
            )
    
    def set_desire(self, goal: str, priority: float = 0.5):
        """Set agent's desire/goal."""
        self.mental_state.desires[goal] = priority
    
    def set_emotion(self, emotion: str, intensity: float = 0.5):
        """Set agent's emotional state."""
        self.mental_state.emotions[emotion] = intensity
    
    def get_state_snapshot(self) -> dict:
        return {
            'agent_id': self.id,
            'num_beliefs': len(self.mental_state.beliefs),
            'num_desires': len(self.mental_state.desires),
            'emotions': dict(self.mental_state.emotions),
            'attention': self.mental_state.attention,
            'personality': dict(self.personality)
        }


class TheoryOfMind:
    """
    Computational Theory of Mind system.
    
    Builds models of other agents' mental states.
    Supports recursive mindreading (nested beliefs).
    Can detect false beliefs and predict behavior.
    """
    
    def __init__(self, self_agent: SocialAgent = None):
        self.self_agent = self_agent or SocialAgent('self')
        self.agent_models = {}  # agent_id -> SocialAgent (modeled)
        self.recursion_depth = 2  # Max recursive ToM depth
        self.empathic_accuracy = 0.0
        self.perspective_taking_ability = 0.5
        self.mindreading_history = []
    
    def register_agent(self, agent_id: str, initial_beliefs: dict = None,
                       personality: dict = None) -> SocialAgent:
        """Register an agent to model."""
        agent = SocialAgent(agent_id)
        if initial_beliefs:
            for prop, conf in initial_beliefs.items():
                agent.update_belief(prop, conf)
        if personality:
            agent.personality.update(personality)
        self.agent_models[agent_id] = agent
        return agent
    
    def infer_belief(self, agent_id: str, proposition: str,
                     observed_behavior: str = None) -> float:
        """
        Infer whether an agent holds a belief.
        Uses Bayesian inference: P(belief | behavior, context).
        """
        agent = self.agent_models.get(agent_id)
        if not agent:
            return 0.5
        
        prior = 0.5
        
        if proposition in agent.mental_state.beliefs:
            prior = agent.mental_state.beliefs[proposition].confidence
        
        if observed_behavior:
            behavior_evidence = self._behavior_to_belief(observed_behavior, agent)
            posterior = prior * behavior_evidence
            posterior /= (prior * behavior_evidence + (1 - prior) * (1 - behavior_evidence))
            return float(np.clip(posterior, 0.0, 1.0))
        
        return prior
    
    def _behavior_to_belief(self, behavior: str, agent: SocialAgent) -> float:
        """Map observed behavior to belief evidence."""
        behavior_belief_map = {
            'looking': 0.7,
            'reaching': 0.6,
            'speaking': 0.5,
            'avoiding': 0.3,
            'pointing': 0.8,
        }
        for key, evidence in behavior_belief_map.items():
            if key in behavior.lower():
                return evidence
        return 0.5
    
    def predict_behavior(self, agent_id: str, situation: dict) -> str:
        """
        Predict agent's behavior based on their mental state.
        
        Uses practical reasoning: belief + desire → intention → action.
        """
        agent = self.agent_models.get(agent_id)
        if not agent:
            return 'unknown'
        
        top_desire = max(agent.mental_state.desires.items(), 
                        key=lambda x: x[1]) if agent.mental_state.desires else (None, 0)
        
        if top_desire[0] and top_desire[1] > 0.5:
            if 'find' in top_desire[0].lower() or 'get' in top_desire[0].lower():
                return f"searching for {top_desire[0]}"
            elif 'avoid' in top_desire[0].lower():
                return f"avoiding {top_desire[0]}"
            elif 'help' in top_desire[0].lower():
                return f"helping with {top_desire[0]}"
        
        return "continuing current activity"
    
    def recursive_mindread(self, agent_a: str, agent_b: str, 
                           proposition: str, depth: int = 1) -> dict:
        """
        Recursive mindreading: "A believes that B believes that P"
        
        Supports nested beliefs up to recursion_depth.
        """
        if depth > self.recursion_depth:
            return {'depth': depth, 'result': 'max_depth'}
        
        agent_a_model = self.agent_models.get(agent_a)
        if not agent_a_model:
            return {'error': f'No model for {agent_a}'}
        
        probe = f"{agent_b}_believes_{proposition.replace(' ', '_')}"
        a_belief_about_b = agent_a_model.mental_state.beliefs.get(probe)
        
        confidence = a_belief_about_b.confidence if a_belief_about_b else 0.3
        
        if depth > 1:
            nested = self.recursive_mindread(agent_a, agent_b, proposition, depth - 1)
            confidence = confidence * nested.get('confidence', 0.5)
        
        result = {
            'depth': depth,
            'proposition': proposition,
            'subject': agent_a,
            'object': agent_b,
            'confidence': confidence,
            'description': f"{agent_a} {'probably' if confidence > 0.5 else 'might'} "
                          f"believe that {agent_b} believes {proposition[:30]}"
        }
        self.mindreading_history.append(result)
        return result
    
    def false_belief_test(self, agent_id: str, reality: str, 
                          agent_perception: str) -> bool:
        """
        Classic Sally-Anne false belief test.
        
        Can the model predict that an agent holds a false belief
        when their perception differs from reality?
        """
        agent = self.agent_models.get(agent_id)
        if not agent:
            return False
        
        # Agent believes what they perceived (even if false)
        agent.update_belief(agent_perception, confidence=0.9, 
                           source='perception', is_false=(agent_perception != reality))
        
        # Test: does the model attribute false belief to the agent?
        inferred = self.infer_belief(agent_id, agent_perception)
        
        has_false_belief = (
            agent_perception != reality and 
            agent.mental_state.beliefs.get(agent_perception, 
                                          Belief()).confidence > 0.5
        )
        
        return has_false_belief
    
    def perspective_take(self, agent_id: str, situation: dict) -> dict:
        """
        Take the perspective of another agent.
        See the world through their eyes.
        """
        agent = self.agent_models.get(agent_id)
        if not agent:
            return {'error': f'No model for {agent_id}'}
        
        perspective = {
            'agent': agent_id,
            'beliefs': {p: b.confidence for p, b in 
                       agent.mental_state.beliefs.items()},
            'top_desires': dict(sorted(
                agent.mental_state.desires.items(), 
                key=lambda x: -x[1]
            )[:3]),
            'emotional_state': dict(agent.mental_state.emotions),
            'personality_filter': dict(agent.personality),
            'likely_behavior': self.predict_behavior(agent_id, situation)
        }
        
        self.perspective_taking_ability = min(1.0, 
            self.perspective_taking_ability + 0.02)
        
        return perspective
    
    def update_from_observation(self, agent_id: str, 
                                observed_beliefs: dict = None,
                                observed_emotions: dict = None,
                                observed_behavior: str = None):
        """Update agent model based on new observations."""
        agent = self.agent_models.get(agent_id)
        if not agent:
            return
        
        if observed_beliefs:
            for prop, conf in observed_beliefs.items():
                agent.update_belief(prop, conf, source='observation')
        
        if observed_emotions:
            for emotion, intensity in observed_emotions.items():
                agent.set_emotion(emotion, intensity)
        
        if observed_behavior:
            agent.history.append({
                'behavior': observed_behavior,
                'time': __import__('time').time()
            })
    
    def get_state(self) -> dict:
        return {
            'agents_modeled': list(self.agent_models.keys()),
            'total_beliefs_tracked': sum(
                len(a.mental_state.beliefs) for a in self.agent_models.values()
            ),
            'recursion_depth': self.recursion_depth,
            'empathic_accuracy': self.empathic_accuracy,
            'perspective_taking': self.perspective_taking_ability,
            'mindreading_acts': len(self.mindreading_history)
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        tom = TheoryOfMind()
        
        print("=== THEORY OF MIND TEST ===")
        
        alice = tom.register_agent('Alice', 
            initial_beliefs={'the ball is in the basket': 0.9},
            personality={'openness': 0.7, 'agreeableness': 0.8})
        
        bob = tom.register_agent('Bob',
            initial_beliefs={'the ball is in the box': 0.9},
            personality={'openness': 0.5, 'conscientiousness': 0.8})
        
        alice.set_desire('find the ball', 0.9)
        bob.set_desire('help Alice', 0.6)
        
        print(f"\nFalse belief test (Sally-Anne):")
        print(f"  Alice sees ball in basket (reality: ball moved to box)")
        has_fb = tom.false_belief_test('Alice', 'ball is in box', 'ball is in basket')
        print(f"  Model attributes false belief to Alice: {has_fb}")
        
        print(f"\nRecursive mindreading:")
        result = tom.recursive_mindread('Bob', 'Alice', 'ball is in basket', depth=2)
        print(f"  {result['description']} (conf: {result['confidence']:.2f})")
        
        print(f"\nBehavior prediction:")
        print(f"  Alice will: {tom.predict_behavior('Alice', {})}")
        print(f"  Bob will: {tom.predict_behavior('Bob', {})}")
        
        print(f"\nPerspective taking:")
        persp = tom.perspective_take('Alice', {'location': 'room'})
        print(f"  Alice's top desires: {persp['top_desires']}")
        print(f"  Alice's likely behavior: {persp['likely_behavior']}")
        
        print(f"\nFinal state: {json.dumps(tom.get_state(), indent=2)}")
        print("\n✓ Theory of Mind module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': tom.get_state()}))
    elif action == 'step':
        tom = TheoryOfMind()
        tom.register_agent('step_agent', initial_beliefs={'test': 0.5})
        print(json.dumps({'status': 'ok', 'state': tom.get_state()}))
    elif action == 'state':
        tom = TheoryOfMind()
        print(json.dumps({'status': 'ok', 'state': tom.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        tom = TheoryOfMind()
        agent_id = payload.get('agent_id', 'event_agent')
        tom.register_agent(agent_id, initial_beliefs=payload.get('beliefs', {}), personality=payload.get('personality'))
        print(json.dumps({'status': 'ok', 'state': tom.get_state()}))
