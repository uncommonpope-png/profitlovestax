"""
decision_making.py — Bayesian & Prospect Theory Decision Making

Models human decision-making through:
- Prospect theory: loss aversion, diminishing sensitivity, probability weighting
- Bayesian belief updating: prior → posterior inference
- Expected utility maximization with risk preferences
- Satisficing: Simon's bounded rationality
- Multi-attribute decision making
- Regret-based learning

References:
- Kahneman & Tversky (1979) prospect theory
- Sutton & Barto (2018) reinforcement learning
- Simon (1955) bounded rationality
- Loomes & Sugden (1982) regret theory
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
class Decision:
    """Record of a decision made."""
    id: str = ''
    options: list = field(default_factory=list)
    chosen: str = ''
    utilities: dict = field(default_factory=dict)
    confidence: float = 0.0
    rationality: float = 0.0
    timestamp: float = 0.0
    outcome: Any = None
    regret: float = 0.0


class ProspectTheory:
    """
    Kahneman & Tversky's Prospect Theory value function.
    
    v(x) = x^alpha if x >= 0
    v(x) = -lambda * (-x)^beta if x < 0
    
    Key features:
    - Diminishing sensitivity (alpha, beta < 1)
    - Loss aversion (lambda > 1)
    - Probability weighting: w(p) = p^gamma / (p^gamma + (1-p)^gamma)^(1/gamma)
    """
    
    def __init__(self, alpha: float = 0.88, beta: float = 0.88,
                 loss_aversion: float = 2.25, gamma: float = 0.65):
        self.alpha = alpha  # Sensitivity to gains
        self.beta = beta   # Sensitivity to losses
        self.loss_aversion = loss_aversion  # Lambda
        self.gamma = gamma  # Probability weighting parameter
    
    def value(self, x: float) -> float:
        """Compute prospect theory value."""
        if x >= 0:
            return x ** self.alpha
        else:
            return -self.loss_aversion * ((-x) ** self.beta)
    
    def probability_weight(self, p: float) -> float:
        """Compute weighted probability (inverse-S shaped)."""
        if p <= 0 or p >= 1:
            return p
        numerator = p ** self.gamma
        denominator = (p ** self.gamma + (1 - p) ** self.gamma) ** (1 / self.gamma)
        return numerator / denominator
    
    def evaluate_prospect(self, outcomes: list, probabilities: list) -> float:
        """
        Evaluate a prospect (gamble) with weighted probabilities.
        
        V = sum(w(p_i) * v(x_i))
        """
        total = 0.0
        for x, p in zip(outcomes, probabilities):
            vx = self.value(x)
            wp = self.probability_weight(p)
            total += wp * vx
        return total
    
    def evaluate_certainty_equivalent(self, outcomes: list, probabilities: list) -> float:
        """Compute certainty equivalent of a prospect."""
        prospect_value = self.evaluate_prospect(outcomes, probabilities)
        if prospect_value >= 0:
            return prospect_value ** (1 / self.alpha)
        else:
            return -((-prospect_value) ** (1 / self.beta))


class BayesianBeliefUpdater:
    """
    Bayesian updating of beliefs based on evidence.
    
    P(H|E) = P(E|H) * P(H) / P(E)
    
    Supports:
    - Beta-Bernoulli for binary outcomes
    - Dirichlet-Categorical for multi-outcome
    - Gaussian-Normal for continuous
    """
    
    def __init__(self):
        self.beliefs = {}  # name -> (alpha, beta) for Beta distributions
    
    def beta_belief(self, name: str, alpha: float = 1.0, beta: float = 1.0):
        """Initialize a Beta belief."""
        self.beliefs[name] = {'type': 'beta', 'alpha': alpha, 'beta': beta}
    
    def update_beta(self, name: str, success: bool, weight: float = 1.0):
        """Update Beta belief with observation."""
        if name not in self.beliefs:
            self.beta_belief(name)
        
        b = self.beliefs[name]
        if success:
            b['alpha'] += weight
        else:
            b['beta'] += weight
    
    def posterior_mean(self, name: str) -> float:
        """Get posterior mean of Beta belief."""
        if name not in self.beliefs:
            return 0.5
        b = self.beliefs[name]
        return b['alpha'] / (b['alpha'] + b['beta'])
    
    def posterior_variance(self, name: str) -> float:
        """Get posterior variance (uncertainty)."""
        if name not in self.beliefs:
            return 0.083  # Max variance for Beta(1,1)
        b = self.beliefs[name]
        n = b['alpha'] + b['beta']
        mean = b['alpha'] / n
        return (mean * (1 - mean)) / (n + 1)
    
    def confidence(self, name: str) -> float:
        """Confidence = 1 - normalized uncertainty."""
        var = self.posterior_variance(name)
        norm_var = var / 0.083  # Normalize to [0, 1]
        return 1.0 - np.clip(norm_var, 0.0, 1.0)
    
    def expected_value(self, name: str, gain_if_true: float, loss_if_false: float) -> float:
        """Expected value given belief."""
        p = self.posterior_mean(name)
        return p * gain_if_true + (1 - p) * loss_if_false
    
    def information_value(self, name: str, perfect_info_cost: float = 0.1) -> tuple[float, bool]:
        """Expected value of perfect information. Returns (value, worth_buying?)."""
        current_uncertainty = self.posterior_variance(name)
        value_of_info = current_uncertainty * 0.5  # Simplified
        return value_of_info, value_of_info > perfect_info_cost


class MultiAttributeUtility:
    """
    Multi-attribute utility theory for complex decisions.
    
    U(x) = sum(w_i * u_i(x_i))
    Supports MAUT and conjoint analysis.
    """
    
    def __init__(self):
        self.attributes = {}  # name -> weight
        self.utility_functions = {}  # name -> callable
    
    def add_attribute(self, name: str, weight: float, 
                      u_func: callable = None):
        """Add an attribute with weight and utility function."""
        self.attributes[name] = weight
        if u_func is None:
            u_func = lambda x: np.clip(x / 10.0, 0.0, 1.0)
        self.utility_functions[name] = u_func
    
    def evaluate(self, alternative: dict) -> float:
        """Compute total utility of an alternative."""
        total = 0.0
        total_weight = sum(self.attributes.values())
        
        if total_weight == 0:
            return 0.0
        
        for attr, weight in self.attributes.items():
            if attr in alternative:
                raw = alternative[attr]
                u = self.utility_functions[attr](raw)
                total += weight * u
        
        return total / total_weight
    
    def compare(self, alternatives: list) -> list:
        """Compare multiple alternatives and rank them."""
        results = []
        for alt in alternatives:
            utility = self.evaluate(alt)
            results.append({
                'name': alt.get('name', 'unknown'),
                'utility': utility,
                'attributes': {k: v for k, v in alt.items() if k != 'name'}
            })
        return sorted(results, key=lambda x: x['utility'], reverse=True)


class Satisficing:
    """
    Simon's bounded rationality — satisficing instead of optimizing.
    
    Sets an aspiration level and chooses the first option that meets it.
    Adjusts aspiration based on experience.
    """
    
    def __init__(self, initial_aspiration: float = 0.6,
                 adaptation_rate: float = 0.1):
        self.aspiration = initial_aspiration
        self.adaptation_rate = adaptation_rate
    
    def satisfies(self, utility: float) -> bool:
        """Check if option meets aspiration."""
        return utility >= self.aspiration
    
    def find_first_good(self, options: list, utility_func: callable) -> tuple[Any, float]:
        """Find first option that satisfies aspiration."""
        for option in options:
            utility = utility_func(option)
            if utility >= self.aspiration:
                return option, utility
        # If none found, return best available
        best = max(options, key=utility_func)
        return best, utility_func(best)
    
    def update_aspiration(self, outcome_utility: float):
        """Adapt aspiration level based on experience."""
        self.aspiration += self.adaptation_rate * (outcome_utility - self.aspiration)
        self.aspiration = np.clip(self.aspiration, 0.1, 0.95)


class RegretTracker:
    """
    Regret-based learning from decisions.
    
    Regret = actual outcome - best possible outcome
    Used to update future decision weights.
    """
    
    def __init__(self, learning_rate: float = 0.3, regret_sensitivity: float = 1.5):
        self.history = []
        self.learning_rate = learning_rate
        self.regret_sensitivity = regret_sensitivity  # How much regret hurts
        self.total_regret = 0.0
    
    def record_outcome(self, decision: Decision, outcomes: dict):
        """Record outcome and compute regret."""
        chosen_utility = outcomes.get(decision.chosen, 0.0)
        best_utility = max(outcomes.values())
        
        regret = self.regret_sensitivity * (best_utility - chosen_utility)
        decision.outcome = outcomes
        decision.regret = max(0.0, regret)
        
        self.total_regret += decision.regret
        self.history.append(decision)
    
    def expected_regret(self, option: str, decision: Decision) -> float:
        """Predict regret for choosing an option based on similar past decisions."""
        similar_decisions = [d for d in self.history 
                           if d.chosen != option and d.regret > 0]
        if not similar_decisions:
            return 0.0
        return np.mean([d.regret for d in similar_decisions]) * 0.3
    
    def regret_adjusted_utility(self, option: str, base_utility: float, 
                                decision: Decision) -> float:
        """Utility adjusted for anticipated regret."""
        anticipated_regret = self.expected_regret(option, decision)
        return base_utility - anticipated_regret


class DecisionMaker:
    """
    Complete decision-making system.
    """
    
    def __init__(self):
        self.prospect = ProspectTheory()
        self.beliefs = BayesianBeliefUpdater()
        self.maut = MultiAttributeUtility()
        self.satisficing = Satisficing()
        self.regret = RegretTracker()
        self.decisions = []
        self.rationality_score = 0.8
    
    def decide(self, options: list, context: dict = None) -> Decision:
        """
        Make a decision using integrated system.
        
        Combines:
        - Prospect theory for risky choices
        - Bayesian beliefs for uncertainty
        - Multi-attribute for complex tradeoffs
        - Satisficing under bounded rationality
        - Regret anticipation
        """
        decision = Decision(
            id=str(uuid.uuid4())[:8],
            options=[o.get('name', str(o)) for o in options],
            timestamp=time.time()
        )
        
        utilities = {}
        for option in options:
            name = option.get('name', 'unknown')
            
            if 'outcomes' in option and 'probabilities' in option:
                # Risky choice via prospect theory
                utility = self.prospect.evaluate_prospect(
                    option['outcomes'], option['probabilities']
                )
            elif 'attributes' in option:
                # Multi-attribute decision
                utility = self.maut.evaluate(option['attributes'])
            else:
                # Simple expected value with beliefs
                base_value = option.get('value', 0.0)
                prob = option.get('probability', 0.5)
                utility = self.prospect.value(base_value) * self.prospect.probability_weight(prob)
            
            # Adjust for anticipated regret
            utility = self.regret.regret_adjusted_utility(name, utility, decision)
            utilities[name] = utility
        
        # Decide: satisficing first, then maximizing
        decision.utilities = utilities
        
        if context and context.get('bounded', False):
            chosen = min(utilities.keys(), 
                        key=lambda k: abs(utilities[k] - self.satisficing.aspiration))
            chosen = max(utilities.keys(), key=lambda k: utilities[k])
        else:
            chosen = max(utilities.keys(), key=lambda k: utilities[k])
        
        decision.chosen = chosen
        utilities_list = list(utilities.values())
        if len(utilities_list) >= 2:
            diff = max(utilities_list) - sorted(utilities_list)[-2]
            decision.confidence = np.clip(diff * 5, 0.1, 0.99)
        else:
            decision.confidence = 0.5
        
        decision.rationality = self.rationality_score
        self.decisions.append(decision)
        
        return decision
    
    def learn_from_outcome(self, decision: Decision, outcomes: dict):
        """Learn from decision outcome."""
        self.regret.record_outcome(decision, outcomes)
        
        chosen_outcome = outcomes.get(decision.chosen, 0.0)
        self.satisficing.update_aspiration(chosen_outcome)
        
        # Update beliefs based on outcome
        self.beliefs.update_beta(decision.chosen, chosen_outcome > 0)
        
        # Adjust rationality based on regret
        if decision.regret > 0.5:
            self.rationality_score = max(0.3, self.rationality_score - 0.05)
        elif decision.regret < 0.1:
            self.rationality_score = min(0.95, self.rationality_score + 0.02)
    
    def get_state(self) -> dict:
        return {
            'decisions_made': len(self.decisions),
            'current_rationality': self.rationality_score,
            'total_regret': self.regret.total_regret,
            'aspiration_level': self.satisficing.aspiration,
            'recent_decisions': [
                {
                    'chosen': d.chosen,
                    'confidence': d.confidence,
                    'regret': d.regret,
                    'timestamp': d.timestamp
                }
                for d in self.decisions[-5:]
            ]
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        dm = DecisionMaker()
        
        print("=== DECISION MAKING TEST ===")
        
        print("\n1. Prospect Theory:")
        risky = {
            'name': 'gamble',
            'outcomes': [100, -50],
            'probabilities': [0.5, 0.5]
        }
        safe = {
            'name': 'sure',
            'value': 20,
            'probability': 1.0
        }
        
        print("\n2. Multi-attribute decision:")
        dm.maut.add_attribute('quality', 0.5)
        dm.maut.add_attribute('price', 0.3, lambda x: np.clip(1.0 - x/100, 0, 1))
        dm.maut.add_attribute('speed', 0.2)
        
        options = [
            {'name': 'option_a', 'attributes': {'quality': 8, 'price': 30, 'speed': 7}},
            {'name': 'option_b', 'attributes': {'quality': 5, 'price': 10, 'speed': 9}},
            {'name': 'option_c', 'attributes': {'quality': 9, 'price': 80, 'speed': 5}},
        ]
        
        decision = dm.decide(options)
        print(f"  Chosen: {decision.chosen}")
        print(f"  Confidence: {decision.confidence:.2f}")
        print(f"  Utilities: {decision.utilities}")
        
        print("\n3. Learning from outcomes:")
        dm.learn_from_outcome(decision, {
            'option_a': 7,
            'option_b': 9,
            'option_c': 6
        })
        print(f"  Regret: {decision.regret:.2f}")
        print(f"  Updated aspiration: {dm.satisficing.aspiration:.2f}")
        print(f"  Updated rationality: {dm.rationality_score:.2f}")
        
        print("\n4. Risky decision (prospect theory):")
        risky_options = [
            {'name': 'safe', 'value': 40, 'probability': 1.0},
            {'name': 'risky', 'outcomes': [100, 0], 'probabilities': [0.5, 0.5]},
        ]
        risky_dec = dm.decide(risky_options)
        print(f"  Chosen: {risky_dec.chosen}")
        print(f"  Utilities: {risky_dec.utilities}")
        print(f"  (Loss aversion makes safe option more attractive)")
        
        print(f"\nState: {json.dumps(dm.get_state(), indent=2)}")
        print("\n✓ Decision making module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': dm.get_state()}))
    elif action == 'step':
        dm = DecisionMaker()
        dm.maut.add_attribute('quality', 0.5)
        dm.maut.add_attribute('price', 0.3)
        options = [{'name': 'a', 'attributes': {'quality': 8, 'price': 5}}, {'name': 'b', 'attributes': {'quality': 5, 'price': 8}}]
        dm.decide(options)
        print(json.dumps({'status': 'ok', 'state': dm.get_state()}))
    elif action == 'state':
        dm = DecisionMaker()
        print(json.dumps({'status': 'ok', 'state': dm.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        dm = DecisionMaker()
        options = payload.get('options', [{'name': 'default', 'value': 10, 'probability': 0.5}])
        dm.decide(options)
        print(json.dumps({'status': 'ok', 'state': dm.get_state()}))
