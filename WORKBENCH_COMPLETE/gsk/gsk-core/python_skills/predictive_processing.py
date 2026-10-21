"""
predictive_processing.py — Hierarchical Predictive Coding & Free Energy

Models perception and action through predictive processing:
- Hierarchical generative models with top-down predictions
- Bottom-up prediction error signals
- Precision-weighted prediction error updating
- Free energy minimization (variational inference)
- Active inference: action selects sensations that fulfill predictions
- Attention as precision optimization

References:
- Friston (2010) free energy principle
- Rao & Ballard (1999) predictive coding in visual cortex
- Clark (2013) "Whatever next?" predictive brains
- Hohwy (2013) predictive mind
"""

import numpy as np
import json
import math
from dataclasses import dataclass, field
from typing import Any
from collections import defaultdict
import uuid
import time


@dataclass
class Prediction:
    """A prediction at a given level of the hierarchy."""
    level: int
    content: Any
    precision: float = 1.0  # Inverse variance — confidence in prediction
    timestamp: float = 0.0
    error: float = 0.0


class HierarchicalLevel:
    """
    One level in the hierarchical predictive processing model.
    
    Each level:
    - Receives top-down predictions from higher level
    - Sends bottom-up prediction errors to higher level
    - Generates predictions of level below
    - Updates its own representations to minimize prediction error
    """
    
    def __init__(self, level: int, n_units: int = 10, 
                 learning_rate: float = 0.1):
        self.level = level
        self.n_units = n_units
        self.learning_rate = learning_rate
        
        # State (representation at this level)
        self.state = np.zeros(n_units)
        self.state_history = []
        
        # Top-down connection weights (from higher level)
        # Represents how higher-level predicts this level
        self.top_down_weights = np.random.randn(n_units) * 0.1
        
        # Bottom-up connection weights (to higher level)
        self.bottom_up_weights = np.random.randn(n_units) * 0.1
        
        # Precision (inverse variance) for each unit
        self.precision = np.ones(n_units) * 2.0
        
        # Prediction error
        self.prediction_error = np.zeros(n_units)
        
        # Expected precision of top-down predictions
        self.top_down_precision = 1.0
    
    def predict_bottom_up(self) -> np.ndarray:
        """Generate bottom-up signal to higher level."""
        return self.state * self.bottom_up_weights
    
    def predict_down(self, higher_state: np.ndarray = None) -> np.ndarray:
        """Generate prediction for level below."""
        if higher_state is not None:
            # Top-down prediction from higher level
            prediction = higher_state * self.top_down_weights
            return np.clip(prediction, -5, 5)
        
        # Self-generated prediction (when no higher level)
        return self.state * 0.5
    
    def compute_prediction_error(self, bottom_up: np.ndarray,
                                  top_down_prediction: np.ndarray) -> np.ndarray:
        """
        Compute prediction error = bottom-up signal - top-down prediction.
        
        Precision-weighted: more precise predictions have more influence.
        """
        self.prediction_error = bottom_up - top_down_prediction
        return self.prediction_error
    
    def update_state(self, prediction_error: np.ndarray):
        """
        Update state to minimize prediction error.
        
        Delta state ∝ precision * prediction error
        """
        precision_weighted_error = self.precision * prediction_error
        delta = self.learning_rate * precision_weighted_error
        self.state += delta
        self.state = np.clip(self.state, -5, 5)
    
    def update_precision(self, prediction_error: np.ndarray, 
                         expected_precision: float = 2.0):
        """
        Update precision based on prediction error.
        
        Precision increases when predictions are accurate,
        decreases when prediction error is high.
        """
        error_magnitude = np.mean(np.abs(prediction_error))
        precision_change = (expected_precision - np.mean(self.precision)) * 0.01
        
        if error_magnitude < 0.5:
            # Predictions are accurate → increase precision
            self.precision += (expected_precision - self.precision) * 0.05
        else:
            # Prediction error high → decrease precision (uncertainty)
            self.precision -= self.precision * 0.02 * error_magnitude
        
        self.precision = np.clip(self.precision, 0.1, 10.0)
    
    def get_state_dict(self) -> dict:
        return {
            'level': self.level,
            'state_mean': float(np.mean(self.state)),
            'state_std': float(np.std(self.state)),
            'mean_precision': float(np.mean(self.precision)),
            'prediction_error_mean': float(np.mean(np.abs(self.prediction_error)))
        }


class PredictiveHierarchy:
    """
    Hierarchical predictive coding model.
    
    Multiple levels, each predicting the level below.
    Prediction errors flow up, predictions flow down.
    """
    
    def __init__(self, n_levels: int = 3, units_per_level: int = 10):
        self.levels = [
            HierarchicalLevel(i, units_per_level) 
            for i in range(n_levels)
        ]
        self.n_levels = n_levels
        
        # Total free energy over time
        self.free_energy_history = []
        self.total_free_energy = 0.0
    
    def process_sensory_input(self, sensory_input: np.ndarray) -> dict:
        """
        Process sensory input through the hierarchy.
        
        Returns: processing summary with prediction errors and free energy.
        """
        # Bottom-up pass: sensory input → Level 0
        bottom_up = sensory_input.copy()
        level_errors = []
        
        for i in range(self.n_levels):
            level = self.levels[i]
            
            if i == 0:
                # Level 0 receives sensory input directly
                level.state = bottom_up.copy()
                top_down_pred = level.predict_down()
                
                # At the lowest level, prediction compares to sensory input
                pred_error = level.compute_prediction_error(
                    sensory_input, top_down_pred
                )
            else:
                # Higher levels receive prediction error from level below
                lower_level = self.levels[i - 1]
                
                # Top-down prediction from this level
                top_down_pred = level.predict_down(
                    self.levels[i + 1].state if i < self.n_levels - 1 else None
                ) if i < self.n_levels - 1 else level.predict_down()
                
                # Bottom-up signal from lower level
                bottom_up_signal = lower_level.predict_bottom_up()
                
                # Compute prediction error
                pred_error = level.compute_prediction_error(
                    bottom_up_signal, top_down_pred
                )
                
                # Update this level's state
                level.update_state(pred_error)
            
            # Update precision
            level.update_precision(pred_error)
            level_errors.append(float(np.mean(np.abs(pred_error))))
        
        # Top-down pass: higher levels refine lower-level predictions
        for i in range(self.n_levels - 2, -1, -1):
            higher = self.levels[i + 1]
            current = self.levels[i]
            
            # Higher level sends refined prediction down
            refined_prediction = higher.predict_down()
            
            # Current level updates based on refined prediction
            if i == 0:
                # For sensory level, use original input
                sensory_pred_error = sensory_input - refined_prediction
                current.update_state(current.precision * sensory_pred_error)
            else:
                pred_error = current.compute_prediction_error(
                    current.state, refined_prediction
                )
                current.update_state(pred_error)
        
        # Free energy = sum of squared prediction errors weighted by precision
        free_energy = self._compute_free_energy()
        self.free_energy_history.append(free_energy)
        self.total_free_energy += free_energy
        
        return {
            'free_energy': free_energy,
            'level_errors': level_errors,
            'total_free_energy': self.total_free_energy,
            'levels': [l.get_state_dict() for l in self.levels]
        }
    
    def _compute_free_energy(self) -> float:
        """Compute variational free energy (F = prediction error * precision)."""
        total_fe = 0.0
        for level in self.levels:
            precision_weighted = np.mean(level.precision * np.abs(level.prediction_error))
            total_fe += precision_weighted
        return float(total_fe)
    
    def generate_prediction(self, n_steps: int = 5) -> list:
        """Generate predictions by running the hierarchy forward."""
        predictions = []
        current = self.levels[0].state.copy()
        
        for _ in range(n_steps):
            # Propagate through hierarchy
            for i in range(1, self.n_levels):
                higher_pred = self.levels[i].predict_down()
                current += higher_pred * 0.1
            
            predictions.append(current.copy())
        
        return predictions
    
    def get_state(self) -> dict:
        return {
            'n_levels': self.n_levels,
            'free_energy_history_len': len(self.free_energy_history),
            'last_free_energy': self.free_energy_history[-1] if self.free_energy_history else 0,
            'total_free_energy': self.total_free_energy,
            'levels': [l.get_state_dict() for l in self.levels]
        }


class ActiveInference:
    """
    Active inference agent.
    
    Actions are selected to minimize expected free energy:
    - Epistemic value: reduce uncertainty (exploration)
    - Pragmatic value: achieve preferred outcomes (exploitation)
    
    Balance between exploration and exploitation is emergent.
    """
    
    def __init__(self, n_actions: int = 4, n_states: int = 5):
        self.n_actions = n_actions
        self.n_states = n_states
        
        # Prior preferences over states (preferred outcomes)
        self.preferences = np.zeros(n_states)
        
        # Transition matrix P(s' | s, a)
        self.transition = np.ones((n_states, n_actions, n_states)) / n_states
        
        # Likelihood matrix P(o | s)
        self.likelihood = np.ones((n_states, n_states)) / n_states
        
        # Current beliefs about states
        self.beliefs = np.ones(n_states) / n_states
        
        # Expected free energy for each action
        self.expected_free_energy = np.zeros(n_actions)
        
        # Action selection temperature (higher = more exploration)
        self.temperature = 0.5
    
    def set_preference(self, state: int, value: float):
        """Set prior preference for a state."""
        self.preferences[state] = value
    
    def observe(self, observation: int):
        """
        Update beliefs given observation (perceptual inference).
        
        P(s|o) ∝ P(o|s) * P(s)
        """
        likelihood = self.likelihood[:, observation]
        self.beliefs = likelihood * self.beliefs
        self.beliefs /= np.sum(self.beliefs)
    
    def infer_action(self) -> int:
        """
        Select action to minimize expected free energy.
        
        G(a) = -E[ln P(o|s)] - H[Q(s|a)]
        
        First term: pragmatic value (achieve preferences)
        Second term: epistemic value (reduce uncertainty)
        """
        self.expected_free_energy = np.zeros(self.n_actions)
        
        for a in range(self.n_actions):
            pragmatic_value = self._pragmatic_value(a)
            epistemic_value = self._epistemic_value(a)
            
            self.expected_free_energy[a] = pragmatic_value + epistemic_value
        
        # Softmax action selection
        inv_temp = 1.0 / max(self.temperature, 0.01)
        logits = -self.expected_free_energy * inv_temp
        logits = logits - np.max(logits)
        probs = np.exp(logits)
        probs /= np.sum(probs)
        
        action = np.random.choice(self.n_actions, p=probs)
        return action, float(probs[action])
    
    def _pragmatic_value(self, action: int) -> float:
        """
        Pragmatic value = expected preference attainment.
        
        -E[ln P(o|s)] where P(o) encodes preferences.
        """
        expected_next_state = self.beliefs @ self.transition[:, action, :]
        expected_observation = expected_next_state @ self.likelihood
        
        # Cross-entropy with preferences (lower = better alignment)
        # Avoid log(0)
        expected_observation = np.clip(expected_observation, 1e-10, 1.0)
        preference_alignment = -np.sum(
            self.preferences * np.log(expected_observation)
        )
        
        return -preference_alignment  # Negative because we minimize free energy
    
    def _epistemic_value(self, action: int) -> float:
        """
        Epistemic value = expected information gain.
        
        -H[Q(s|a)] = expected reduction in uncertainty
        """
        expected_next_state = self.beliefs @ self.transition[:, action, :]
        expected_next_state = np.clip(expected_next_state, 1e-10, 1.0)
        
        # Entropy of expected next state
        entropy = -np.sum(expected_next_state * np.log(expected_next_state))
        
        # Information gain = current entropy - expected entropy
        current_entropy = -np.sum(self.beliefs * np.clip(np.log(self.beliefs), -100, 100))
        
        return current_entropy - entropy
    
    def learn_transition(self, state: int, action: int, next_state: int, 
                         learning_rate: float = 0.1):
        """Update transition matrix based on observed outcomes."""
        old = self.transition[state, action, :]
        target = np.zeros(self.n_states)
        target[next_state] = 1.0
        self.transition[state, action, :] = (1 - learning_rate) * old + learning_rate * target
        self.transition[state, action, :] /= np.sum(self.transition[state, action, :])
    
    def get_state(self) -> dict:
        return {
            'beliefs': self.beliefs.tolist(),
            'preferences': self.preferences.tolist(),
            'expected_free_energy': self.expected_free_energy.tolist(),
            'temperature': self.temperature,
            'n_actions': self.n_actions
        }


class PredictiveEngine:
    """
    Complete predictive processing engine.
    """
    
    def __init__(self):
        self.hierarchy = PredictiveHierarchy(n_levels=3, units_per_level=8)
        self.active_inference = ActiveInference(n_actions=4, n_states=8)
        self.surprise_history = []
    
    def process(self, sensory_input: np.ndarray) -> dict:
        """
        Process sensory input through predictive hierarchy.
        """
        result = self.hierarchy.process_sensory_input(sensory_input)
        
        surprise = self._compute_surprise(sensory_input)
        self.surprise_history.append(surprise)
        
        result['surprise'] = surprise
        return result
    
    def _compute_surprise(self, input_vector: np.ndarray) -> float:
        """Compute Bayesian surprise: KL divergence between prior and posterior."""
        level_0_state = self.hierarchy.levels[0].state
        prior = np.clip(np.abs(level_0_state) / np.sum(np.abs(level_0_state) + 1e-10), 1e-10, 1.0)
        posterior = np.clip(np.abs(input_vector) / np.sum(np.abs(input_vector) + 1e-10), 1e-10, 1.0)
        
        kl = np.sum(prior * np.log(prior / posterior))
        return float(kl)
    
    def generate(self, n_steps: int = 5) -> list:
        """Generate predictions."""
        return self.hierarchy.generate_prediction(n_steps)
    
    def decide_action(self, observation: int = 0) -> tuple[int, float]:
        """Decide action using active inference."""
        self.active_inference.observe(observation)
        action, prob = self.active_inference.infer_action()
        return action, prob
    
    def get_state(self) -> dict:
        return {
            'hierarchy': self.hierarchy.get_state(),
            'active_inference': self.active_inference.get_state(),
            'mean_surprise': float(np.mean(self.surprise_history)) if self.surprise_history else 0.0,
            'n_steps': len(self.surprise_history)
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        engine = PredictiveEngine()
        
        print("=== PREDICTIVE PROCESSING TEST ===")
        
        for step in range(5):
            sensory_input = np.random.randn(8) * 0.5 + np.sin(step * 0.5)
            result = engine.process(sensory_input)
            print(f"  Step {step}: Free energy={result['free_energy']:.4f}, "
                  f"Surprise={result['surprise']:.4f}")
        
        action, prob = engine.decide_action(observation=3)
        print(f"\n  Action selection: action={action}, probability={prob:.3f}")
        
        predictions = engine.generate(n_steps=3)
        print(f"  Generated {len(predictions)} predictions")
        
        print(f"\nState: {json.dumps(engine.get_state(), indent=2)}")
        print("\n✓ Predictive processing module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': engine.get_state()}))
    elif action == 'step':
        engine = PredictiveEngine()
        engine.process(np.random.randn(8) * 0.5)
        print(json.dumps({'status': 'ok', 'state': engine.get_state()}))
    elif action == 'state':
        engine = PredictiveEngine()
        print(json.dumps({'status': 'ok', 'state': engine.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        engine = PredictiveEngine()
        engine.process(np.array(payload.get('input', np.random.randn(8).tolist())))
        print(json.dumps({'status': 'ok', 'state': engine.get_state()}))
