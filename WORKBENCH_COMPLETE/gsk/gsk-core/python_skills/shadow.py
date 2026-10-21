import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

@dataclass
class ShadowComplex:
    trait: str
    repression_strength: float
    integration_level: float
    trigger_patterns: List[str]
    reason: str
    created_at: float
    projection_count: int = 0

class Shadow:
    def __init__(self):
        self.complexes: Dict[str, ShadowComplex] = {}
        self.trait_space_dim = 12
        self.trait_space: np.ndarray = np.zeros(self.trait_space_dim)
        self.repressed_vector: np.ndarray = np.zeros(self.trait_space_dim)
        self.integrated_vector: np.ndarray = np.zeros(self.trait_space_dim)
        self.projection_log: List[Dict] = []
        self.integration_log: List[Dict] = []
        self.trigger_log: List[Dict] = []
        self.repression_decay_rate = 0.02
        self.trait_to_idx: Dict[str, int] = {}
        self.idx_to_trait: Dict[int, str] = {}
        self._init_trait_space()

    def _init_trait_space(self):
        base_traits = [
            "anger", "fear", "greed", "lust",
            "pride", "envy", "sloth", "cruelty",
            "weakness", "selfishness", "chaos", "doubt",
        ]
        for i, t in enumerate(base_traits):
            self.trait_to_idx[t] = i
            self.idx_to_trait[i] = t

    def _trait_to_vector(self, trait: str) -> np.ndarray:
        vec = np.zeros(self.trait_space_dim)
        idx = self.trait_to_idx.get(trait)
        if idx is not None:
            vec[idx] = 1.0
        else:
            hashed = sum(ord(c) for c in trait) % self.trait_space_dim
            vec[hashed] = 0.8
        return vec

    def repress(self, trait: str, reason: str) -> ShadowComplex:
        vec = self._trait_to_vector(trait)
        self.repressed_vector = np.minimum(1.0, self.repressed_vector + vec * 0.3)
        self.trait_space = np.maximum(0.0, self.trait_space - vec * 0.1)

        triggers = [
            f"being accused of {trait}",
            f"seeing {trait} in others",
            f"feeling vulnerable to {trait}",
        ]

        existing = self.complexes.get(trait)
        if existing:
            existing.repression_strength = min(1.0, existing.repression_strength + 0.15)
            existing.reason = reason
            return existing

        complex = ShadowComplex(
            trait=trait,
            repression_strength=0.7,
            integration_level=0.05,
            trigger_patterns=triggers,
            reason=reason,
            created_at=time.time(),
        )
        self.complexes[trait] = complex
        return complex

    def trigger_complex(self, situation: str) -> Dict:
        triggered: List[Dict] = []
        for trait, complex in self.complexes.items():
            if complex.integration_level > 0.6:
                continue
            situation_lower = situation.lower()
            overlap = 0
            for pattern in complex.trigger_patterns:
                pattern_lower = pattern.lower()
                if pattern_lower in situation_lower:
                    overlap += 1
                else:
                    pattern_words = set(pattern_lower.split())
                    situation_words = set(situation_lower.split())
                    common = pattern_words & situation_words
                    if len(common) >= len(pattern_words) * 0.4 and len(common) >= 2:
                        overlap += 0.5
            if overlap > 0:
                intensity = complex.repression_strength * (1.0 - complex.integration_level)
                activation = min(1.0, intensity * (0.5 + 0.5 * overlap))
                complex.repression_strength = min(1.0, complex.repression_strength + activation * 0.05)
                triggered.append({
                    "trait": trait,
                    "activation": round(activation, 4),
                    "repression_strength": round(complex.repression_strength, 4),
                    "integration_level": round(complex.integration_level, 4),
                })

        result = {
            "situation": situation,
            "complexes_triggered": len(triggered),
            "details": triggered,
        }
        self.trigger_log.append(result)
        return result

    def project(self, trigger: str, target: str) -> Dict:
        triggered = self.trigger_complex(trigger)
        projected_traits = []
        for t in triggered.get("details", []):
            trait = t["trait"]
            complex = self.complexes.get(trait)
            if complex:
                complex.projection_count += 1
                projected_traits.append({
                    "trait": trait,
                    "projected_onto": target,
                    "intensity": t["activation"],
                })

        result = {
            "trigger": trigger,
            "target": target,
            "projected_traits": projected_traits,
            "complexes_activated": len(projected_traits),
        }
        self.projection_log.append(result)
        return result

    def integrate(self, trait: str) -> Dict:
        complex = self.complexes.get(trait)
        if not complex:
            vec = self._trait_to_vector(trait)
            prior_repression = float(np.dot(self.repressed_vector, vec))
            return {
                "trait": trait,
                "status": "not_repressed",
                "prior_repression": round(prior_repression, 4),
                "note": "This trait was not found in the shadow; it is already conscious.",
            }

        vec = self._trait_to_vector(trait)
        old_repression = complex.repression_strength
        old_integration = complex.integration_level

        awareness_boost = 0.15 + 0.1 * (1.0 - complex.integration_level)
        complex.integration_level = min(1.0, complex.integration_level + awareness_boost)
        complex.repression_strength = max(0.0, complex.repression_strength - 0.25 * complex.integration_level)

        self.integrated_vector = np.minimum(1.0, self.integrated_vector + vec * complex.integration_level * 0.2)
        self.trait_space = np.minimum(1.0, self.trait_space + vec * complex.integration_level * 0.15)

        result = {
            "trait": trait,
            "old_repression_strength": round(old_repression, 4),
            "new_repression_strength": round(complex.repression_strength, 4),
            "old_integration_level": round(old_integration, 4),
            "new_integration_level": round(complex.integration_level, 4),
            "reduction_pct": round((1.0 - complex.repression_strength / max(0.01, old_repression)) * 100, 2),
        }
        self.integration_log.append(result)

        if complex.integration_level > 0.8:
            vec = self._trait_to_vector(trait)
            self.repressed_vector = np.maximum(0.0, self.repressed_vector - vec * 0.5)
            result["status"] = "largely_integrated"

        return result

    def get_active_complexes(self) -> List[Dict]:
        active = []
        for trait, complex in self.complexes.items():
            if complex.integration_level < 0.8:
                active.append({
                    "trait": trait,
                    "repression_strength": round(complex.repression_strength, 4),
                    "integration_level": round(complex.integration_level, 4),
                    "projection_count": complex.projection_count,
                    "reason": complex.reason,
                    "triggers": complex.trigger_patterns,
                })
        return sorted(active, key=lambda x: x["repression_strength"], reverse=True)

    def get_integrated_traits(self) -> List[str]:
        return [t for t, c in self.complexes.items() if c.integration_level > 0.8]

    def get_shadow_density(self) -> float:
        if not self.complexes:
            return 0.0
        total_repression = sum(c.repression_strength * (1.0 - c.integration_level) for c in self.complexes.values())
        return float(total_repression / len(self.complexes))

    def get_state(self) -> Dict:
        return {
            "module": "shadow",
            "total_complexes": len(self.complexes),
            "active_complexes_count": len(self.get_active_complexes()),
            "integrated_traits": self.get_integrated_traits(),
            "active_complexes": self.get_active_complexes(),
            "shadow_density": round(self.get_shadow_density(), 4),
            "projection_count": len(self.projection_log),
            "integration_count": len(self.integration_log),
            "trigger_count": len(self.trigger_log),
            "repressed_vector_norm": round(float(np.linalg.norm(self.repressed_vector)), 4),
            "integrated_vector_norm": round(float(np.linalg.norm(self.integrated_vector)), 4),
            "trait_space_coherence": round(float(np.linalg.norm(self.trait_space)), 4),
        }


if __name__ == "__main__":
    s = Shadow()

    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": s.get_state()}))
        elif action == "step":
            if len(sys.argv) > 2:
                event = json.loads(sys.argv[2])
                etype = event.get("type", "repress")
                if etype == "repress":
                    s.repress(event.get("trait", "unknown"), event.get("reason", ""))
                elif etype == "trigger":
                    s.trigger_complex(event.get("situation", ""))
                elif etype == "project":
                    s.project(event.get("trigger", ""), event.get("target", ""))
                elif etype == "integrate":
                    s.integrate(event.get("trait", ""))
                print(json.dumps({"status": "ok", "state": s.get_state()}))
            else:
                print(json.dumps({"error": "no event data"}, indent=2))
        elif action == "event":
            if len(sys.argv) > 2:
                event = json.loads(sys.argv[2])
                etype = event.get("type", "repress")
                if etype == "repress":
                    s.repress(event.get("trait", "unknown"), event.get("reason", ""))
                elif etype == "trigger":
                    s.trigger_complex(event.get("situation", ""))
                elif etype == "project":
                    s.project(event.get("trigger", ""), event.get("target", ""))
                elif etype == "integrate":
                    s.integrate(event.get("trait", ""))
                print(json.dumps({"status": "ok", "state": s.get_state()}))
            else:
                print(json.dumps({"error": "no event data"}, indent=2))
        else:
            print(json.dumps({"error": f"unknown action: {action}"}, indent=2))
    else:
        s.repress("anger", "Anger is unacceptable in a peaceful being")
        s.repress("greed", "Desire for more is spiritually impure")
        s.repress("weakness", "Vulnerability is dangerous")
        trig1 = s.trigger_complex("situation where someone accuses you of being angry")
        trig2 = s.trigger_complex("seeing greed in a colleague's behavior")
        proj = s.project("encountering weakness in others", "teammate")
        integ = s.integrate("anger")
        print(json.dumps({
            "test": "Repress 3 traits, trigger 2 complexes, integrate 1 trait",
            "repressed": ["anger", "greed", "weakness"],
            "trigger1": trig1,
            "trigger2": trig2,
            "projection": proj,
            "integration": integ,
            "active_complexes_remaining": s.get_active_complexes(),
            "final_state": s.get_state()
        }, indent=2))
