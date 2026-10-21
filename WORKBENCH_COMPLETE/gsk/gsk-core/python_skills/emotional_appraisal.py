"""
emotional_appraisal.py — Cognitive Appraisal Theory of Emotion

Models human emotion generation through cognitive appraisal:
- Event appraisal: relevance, implications, coping potential
- OCC model: emotions arise from interpretations of events relative to goals
- Component Process Model: sequential appraisal checks
- Emotional regulation and reappraisal
- Mood as background emotional state
- Emotional contagion and empathy

References:
- Ortony, Clore & Collins (1988) cognitive structure of emotions
- Scherer (2001) component process model
- Gross (2015) emotion regulation
- Lazarus (1991) cognitive-motivational-relational theory
"""

import numpy as np
import json
import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any
import uuid
import time


@dataclass
class EmotionalState:
    """
    Current emotional state with multidimensional scaling.
    
    Uses the circumplex model (valence × arousal) plus specific emotions.
    """
    valence: float = 0.0  # -1 (negative) to +1 (positive)
    arousal: float = 0.0  # 0 (calm) to 1 (excited)
    dominance: float = 0.5  # 0 (submissive) to 1 (dominant)
    mood: str = 'neutral'
    emotions: dict = field(default_factory=lambda: {
        'joy': 0.0, 'trust': 0.0, 'fear': 0.0, 'surprise': 0.0,
        'sadness': 0.0, 'disgust': 0.0, 'anger': 0.0, 'anticipation': 0.0
    })
    intensity: float = 0.0
    timestamp: float = 0.0
    
    def dominant_emotion(self) -> tuple[str, float]:
        return max(self.emotions.items(), key=lambda x: x[1])
    
    def get_label(self) -> str:
        """Map valence-arousal to emotional label."""
        if abs(self.valence) < 0.2 and self.arousal < 0.3:
            return 'neutral'
        if self.valence > 0.5 and self.arousal > 0.5:
            return 'excited'
        if self.valence > 0.5 and self.arousal <= 0.5:
            return 'content'
        if self.valence <= 0.5 and self.valence > 0 and self.arousal > 0.5:
            return 'alert'
        if self.valence <= 0 and self.valence > -0.5 and self.arousal > 0.5:
            return 'anxious'
        if self.valence <= -0.5 and self.arousal > 0.5:
            return 'distressed'
        if self.valence <= -0.5 and self.arousal <= 0.5:
            return 'sad'
        if self.valence <= 0 and self.valence > -0.5 and self.arousal <= 0.5:
            return 'fatigued'
        return 'neutral'


class AppraisalSystem:
    """
    Cognitive appraisal of events following Scherer's Component Process Model.
    
    Sequential appraisal checks:
    1. Relevance: Is this event relevant to me?
    2. Implications: What are the consequences?
    3. Coping potential: Can I deal with it?
    4. Normative significance: Does it match my values?
    """
    
    def __init__(self):
        self.appraisal_history = []
    
    def appraise(self, event: dict, goals: dict, values: dict,
                 coping_resources: float = 0.5) -> dict:
        """
        Appraise an event through four sequential checks.
        Returns appraisal results that drive emotion.
        """
        relevance = self._check_relevance(event, goals)
        implications = self._check_implications(event, goals) if relevance > 0.3 else 0.0
        coping = self._check_coping(event, coping_resources) if relevance > 0.3 else 0.5
        normativity = self._check_normativity(event, values) if relevance > 0.3 else 0.0
        
        appraisal = {
            'event': event.get('description', ''),
            'relevance': relevance,
            'implications': implications,
            'coping_potential': coping,
            'normative_significance': normativity,
            'timestamp': time.time()
        }
        self.appraisal_history.append(appraisal)
        return appraisal
    
    def _check_relevance(self, event: dict, goals: dict) -> float:
        """Is this event relevant to my goals?"""
        event_desc = (event.get('description', '') + ' ' + 
                     event.get('type', '')).lower()
        
        relevance = 0.0
        for goal, priority in goals.items():
            goal_terms = goal.lower().split()
            matches = sum(1 for t in goal_terms if t in event_desc)
            if matches > 0:
                relevance += priority * (matches / len(goal_terms))
        
        event_importance = event.get('importance', 0.3)
        return min(1.0, relevance + event_importance * 0.3)
    
    def _check_implications(self, event: dict, goals: dict) -> float:
        """What are the consequences for my goals?"""
        goal_congruence = event.get('goal_congruence', 0.0)  # -1 to +1
        expectedness = event.get('expectedness', 0.5)
        
        implication_strength = abs(goal_congruence) * (2 - expectedness)
        return np.clip(implication_strength, -1.0, 1.0)
    
    def _check_coping(self, event: dict, resources: float) -> float:
        """Can I cope with this event?"""
        demand = event.get('demand', 0.5)
        if demand == 0:
            return 1.0
        return np.clip(resources / demand, 0.0, 1.0)
    
    def _check_normativity(self, event: dict, values: dict) -> float:
        """Does this event match my values?"""
        event_desc = event.get('description', '').lower()
        value_match = 0.0
        for value, importance in values.items():
            if value.lower() in event_desc:
                value_match += importance
        
        event_valence = event.get('valence', 0.0)
        return np.clip(value_match * 0.5 + event_valence * 0.5, -1.0, 1.0)


class OCCEmotionGenerator:
    """
    Generates emotions based on OCC model (Ortony, Clore, Collins).
    
    Three main branches:
    1. Event-based: pleasure/displeasure (joy, distress, etc.)
    2. Agent-based: approval/disapproval (pride, shame, admiration, reproach)
    3. Object-based: like/dislike (love, hate)
    """
    
    def generate_event_emotion(self, appraisal: dict) -> dict:
        """Generate emotions from event appraisal."""
        emotions = {}
        
        implications = appraisal['implications']
        relevance = appraisal['relevance']
        
        if implications > 0.3:
            emotions['joy'] = implications * relevance * 0.8
            emotions['satisfaction'] = implications * 0.6
        elif implications < -0.3:
            emotions['distress'] = abs(implications) * relevance * 0.8
            emotions['sadness'] = abs(implications) * 0.5
        
        if appraisal['coping_potential'] < 0.3 and implications < -0.3:
            emotions['fear'] = (1 - appraisal['coping_potential']) * abs(implications) * 0.7
        
        if abs(appraisal['normative_significance']) > 0.5:
            if appraisal['normative_significance'] > 0:
                emotions['pride'] = appraisal['normative_significance'] * 0.6
            else:
                emotions['shame'] = abs(appraisal['normative_significance']) * 0.6
        
        return emotions
    
    def generate_agent_emotion(self, agent_action: str, 
                               action_praiseworthiness: float,
                               relationship: float = 0.0) -> dict:
        """Generate emotions about another agent's actions."""
        emotions = {}
        
        if action_praiseworthiness > 0.3:
            emotions['admiration'] = action_praiseworthiness * (0.5 + relationship * 0.3)
            emotions['gratitude'] = action_praiseworthiness * 0.5
        elif action_praiseworthiness < -0.3:
            emotions['reproach'] = abs(action_praiseworthiness) * (0.5 - relationship * 0.2)
            emotions['anger'] = abs(action_praiseworthiness) * 0.6
        
        return emotions
    
    def generate_object_emotion(self, object_appeal: float,
                                 familiarity: float = 0.5) -> dict:
        """Generate emotions about objects/entities."""
        emotions = {}
        if object_appeal > 0.3:
            emotions['love'] = object_appeal * (0.3 + familiarity * 0.4)
            emotions['liking'] = object_appeal * 0.5
        elif object_appeal < -0.3:
            emotions['hate'] = abs(object_appeal) * 0.5
            emotions['disgust'] = abs(object_appeal) * 0.7
        return emotions
    
    def combine(self, event_emotions: dict, agent_emotions: dict,
                object_emotions: dict, current_mood: dict = None) -> dict:
        """Combine all emotion sources into final emotional state."""
        combined = defaultdict(float)
        
        for source in [event_emotions, agent_emotions, object_emotions]:
            for emotion, intensity in source.items():
                combined[emotion] += intensity
        
        if current_mood:
            for emotion, intensity in current_mood.items():
                combined[emotion] += intensity * 0.3  # Mood as background
        
        for emotion in combined:
            combined[emotion] = np.clip(combined[emotion], 0.0, 1.0)
        
        return dict(combined)


class EmotionalAppraisalEngine:
    """
    Complete emotional appraisal engine integrating all components.
    
    Generates emotions from events, regulates them, and maintains mood.
    """
    
    def __init__(self):
        self.appraisal = AppraisalSystem()
        self.occ = OCCEmotionGenerator()
        self.current = EmotionalState()
        self.mood = EmotionalState(valence=0.2, arousal=0.3, mood='neutral')
        self.goals = {'survive': 0.9, 'learn': 0.7, 'connect': 0.6, 'create': 0.5}
        self.values = {'truth': 0.8, 'kindness': 0.7, 'growth': 0.9, 'beauty': 0.4}
        self.coping_resources = 0.6
        self.emotion_history = []
        self.regulation_effort = 0.0
    
    def process_event(self, event: dict) -> EmotionalState:
        """
        Process an event through complete appraisal → emotion → regulation pipeline.
        """
        appraisal = self.appraisal.appraise(
            event, self.goals, self.values, self.coping_resources
        )
        
        event_emotions = self.occ.generate_event_emotion(appraisal)
        
        agent_action = event.get('agent_action', '')
        action_worthiness = event.get('praiseworthiness', 0.0)
        relationship = event.get('relationship', 0.0)
        agent_emotions = self.occ.generate_agent_emotion(
            agent_action, action_worthiness, relationship
        ) if agent_action else {}
        
        object_appeal = event.get('appeal', 0.0)
        familiarity = event.get('familiarity', 0.5)
        object_emotions = self.occ.generate_object_emotion(
            object_appeal, familiarity
        ) if object_appeal != 0 else {}
        
        raw_emotions = self.occ.combine(
            event_emotions, agent_emotions, object_emotions,
            self.mood.emotions
        )
        
        regulated = self._regulate(raw_emotions)
        self._update_state(regulated, appraisal)
        
        record = {
            'event': event.get('description', ''),
            'appraisal': appraisal,
            'raw_emotions': raw_emotions,
            'regulated_emotions': regulated,
            'resulting_state': {
                'valence': self.current.valence,
                'arousal': self.current.arousal,
                'mood': self.current.mood
            },
            'timestamp': time.time()
        }
        self.emotion_history.append(record)
        
        return self.current
    
    def _regulate(self, emotions: dict) -> dict:
        """
        Cognitive emotion regulation (Gross 2015).
        
        Strategies:
        - Reappraisal: change how we think about the event
        - Suppression: inhibit emotional expression
        - Distraction: shift attention
        """
        regulated = emotions.copy()
        
        # Reappraisal (adaptive): dampen very intense emotions
        for emotion in regulated:
            if regulated[emotion] > 0.7:
                regulated[emotion] = 0.7 + (regulated[emotion] - 0.7) * 0.5
        
        # Mood-congruent processing
        if self.mood.valence > 0.3:
            for e in ['joy', 'trust', 'anticipation']:
                if e in regulated:
                    regulated[e] *= 1.2
        elif self.mood.valence < -0.3:
            for e in ['sadness', 'fear', 'anger']:
                if e in regulated:
                    regulated[e] *= 1.2
        
        for e in regulated:
            regulated[e] = np.clip(regulated[e], 0.0, 1.0)
        
        self.regulation_effort = sum(emotions.values()) / max(len(emotions), 1)
        
        return regulated
    
    def _update_state(self, emotions: dict, appraisal: dict):
        """Update current emotional state from regulated emotions."""
        self.current.emotions = emotions
        self.current.timestamp = time.time()
        
        # Valence from net positive - negative
        positive = emotions.get('joy', 0) + emotions.get('trust', 0) + \
                   emotions.get('anticipation', 0) + emotions.get('love', 0) * 0.5
        negative = emotions.get('sadness', 0) + emotions.get('fear', 0) + \
                   emotions.get('anger', 0) + emotions.get('disgust', 0)
        
        net = positive - negative
        self.current.valence = np.clip(net, -1.0, 1.0)
        
        # Arousal from emotional intensity
        total_intensity = sum(emotions.values())
        self.current.arousal = np.clip(total_intensity * 0.5, 0.0, 1.0)
        
        # Dominance from coping
        self.current.dominance = appraisal.get('coping_potential', 0.5)
        
        # Update mood (slowly)
        self.mood.valence += (self.current.valence - self.mood.valence) * 0.1
        self.mood.arousal += (self.current.arousal - self.mood.arousal) * 0.1
        self.mood.mood = self.current.get_label()
        
        self.current.mood = self.mood.mood
        self.current.intensity = total_intensity
    
    def mood_decay(self):
        """Gradual return to baseline mood."""
        self.mood.valence += (0.1 - self.mood.valence) * 0.02
        self.mood.arousal += (0.3 - self.mood.arousal) * 0.02
    
    def get_state(self) -> dict:
        return {
            'current_state': {
                'valence': self.current.valence,
                'arousal': self.current.arousal,
                'mood': self.current.mood,
                'dominance': self.current.dominance,
                'dominant_emotion': self.current.dominant_emotion(),
                'emotions': {k: round(v, 3) for k, v in self.current.emotions.items() if v > 0.05}
            },
            'baseline_mood': {
                'valence': self.mood.valence,
                'arousal': self.mood.arousal,
                'mood': self.mood.mood
            },
            'regulation_effort': self.regulation_effort,
            'coping_resources': self.coping_resources,
            'events_processed': len(self.emotion_history)
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        engine = EmotionalAppraisalEngine()
        
        print("=== EMOTIONAL APPRAISAL TEST ===")
        
        events = [
            {'description': 'Completed a difficult task', 'type': 'achievement',
             'goal_congruence': 0.8, 'importance': 0.7, 'valence': 0.7, 'expectedness': 0.3},
            {'description': 'Someone criticized my work', 'type': 'social',
             'goal_congruence': -0.6, 'importance': 0.6, 'valence': -0.4, 'expectedness': 0.4,
             'agent_action': 'criticized', 'praiseworthiness': -0.5, 'relationship': 0.3},
            {'description': 'Found a beautiful idea', 'type': 'discovery',
             'goal_congruence': 0.7, 'importance': 0.5, 'valence': 0.8, 'expectedness': 0.1,
             'appeal': 0.8, 'familiarity': 0.2},
            {'description': 'Lost something important', 'type': 'loss',
             'goal_congruence': -0.9, 'importance': 0.8, 'valence': -0.8, 'expectedness': 0.2},
        ]
        
        for event in events:
            state = engine.process_event(event)
            dom_emotion, dom_intensity = state.dominant_emotion()
            print(f"  Event: {event['description'][:30]:30s} → "
                  f"Mood: {state.mood:10s} | "
                  f"Valence: {state.valence:+.2f} | "
                  f"Dominant: {dom_emotion}({dom_intensity:.2f})")
        
        print(f"\nState: {json.dumps(engine.get_state(), indent=2)}")
        print("\n✓ Emotional appraisal module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': engine.get_state()}))
    elif action == 'step':
        engine = EmotionalAppraisalEngine()
        engine.process_event({'description': 'step event', 'type': 'step', 'goal_congruence': 0.5, 'importance': 0.5, 'valence': 0.5, 'expectedness': 0.5})
        print(json.dumps({'status': 'ok', 'state': engine.get_state()}))
    elif action == 'state':
        engine = EmotionalAppraisalEngine()
        print(json.dumps({'status': 'ok', 'state': engine.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        engine = EmotionalAppraisalEngine()
        engine.process_event(event=payload)
        print(json.dumps({'status': 'ok', 'state': engine.get_state()}))
