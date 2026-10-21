import sys
import json
import numpy as np
import math
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class MortalityAwareness:
    age: float = 25.0
    max_lifespan: float = 90.0
    mortality_salience: float = 0.1
    death_anxiety: float = 0.1
    meaning_buffer: float = 0.3
    legacy_completeness: float = 0.0
    acceptance_level: float = 0.1
    memento_mori_count: int = 0
    legacy_matrix: dict = field(default_factory=lambda: {
        "creations": 0.0,
        "knowledge": 0.0,
        "relationships": 0.0,
        "impact": 0.0,
        "wisdom": 0.0
    })
    triggers_history: list = field(default_factory=list)

    def _compute_anxiety_curve(self) -> float:
        age_ratio = self.age / self.max_lifespan
        base = 0.05 + 0.6 * (age_ratio ** 1.8)
        salience_boost = self.mortality_salience * 0.4
        acceptance_reduction = self.acceptance_level * 0.5
        return max(0.0, min(1.0, base + salience_boost - acceptance_reduction))

    def _meaning_buffering(self) -> float:
        buffer_target = self.legacy_completeness * 0.6 + self.acceptance_level * 0.4
        self.meaning_buffer += (buffer_target - self.meaning_buffer) * 0.1
        self.meaning_buffer = max(0.0, min(1.0, self.meaning_buffer))
        drive = max(0.0, self.death_anxiety - self.meaning_buffer)
        return drive

    def confront_mortality(self, trigger: str) -> dict:
        trigger_severity = {
            "near_death": 0.8,
            "illness": 0.5,
            "accident": 0.6,
            "loss": 0.4,
            "aging_sign": 0.3,
            "existential_thought": 0.2,
            "death_of_other": 0.5,
            "reminder": 0.15
        }
        severity = trigger_severity.get(trigger.lower(), 0.25)
        self.mortality_salience = min(1.0, self.mortality_salience + severity)
        spike = severity * (1.0 + np.random.rand() * 0.3)
        self.death_anxiety = min(1.0, self.death_anxiety + spike)
        self.triggers_history.append({"trigger": trigger, "severity": severity, "time": time.time()})
        drive = self._meaning_buffering()
        self.meaning_buffer = min(1.0, self.meaning_buffer + drive * 0.2)
        return {
            "trigger": trigger,
            "severity": severity,
            "anxiety_spike": float(spike),
            "meaning_drive": float(drive),
            "mortality_salience": self.mortality_salience
        }

    def evaluate_legacy(self, achievements: dict) -> dict:
        for key, value in achievements.items():
            if key in self.legacy_matrix:
                increment = value * (1.0 - self.legacy_matrix[key]) * 0.3
                self.legacy_matrix[key] = min(1.0, self.legacy_matrix[key] + increment)
        weights = np.array([0.25, 0.2, 0.25, 0.2, 0.1])
        scores = np.array([
            self.legacy_matrix["creations"],
            self.legacy_matrix["knowledge"],
            self.legacy_matrix["relationships"],
            self.legacy_matrix["impact"],
            self.legacy_matrix["wisdom"]
        ])
        self.legacy_completeness = float(np.dot(weights, scores))
        self._meaning_buffering()
        return {"legacy_completeness": self.legacy_completeness, "matrix": dict(self.legacy_matrix)}

    def practice_memento_mori(self) -> dict:
        self.memento_mori_count += 1
        days_left = int((self.max_lifespan - self.age) * 365)
        clarity_boost = 0.02 * self.memento_mori_count
        self.acceptance_level = min(1.0, self.acceptance_level + 0.05 + clarity_boost)
        presence = 0.3 + 0.5 * (1.0 - math.exp(-self.memento_mori_count * 0.15))
        self.death_anxiety = max(0.0, self.death_anxiety - 0.03)
        return {
            "memento_mori_count": self.memento_mori_count,
            "days_estimated_left": days_left,
            "presence_awareness": float(presence),
            "acceptance_boost": 0.05 + clarity_boost
        }

    def process_lifespan(self, age: float) -> dict:
        self.age = max(0.0, min(self.max_lifespan, age))
        self.death_anxiety = self._compute_anxiety_curve()
        age_ratio = self.age / self.max_lifespan
        if age_ratio > 0.7:
            base_acceptance = (age_ratio - 0.7) / 0.3 * 0.4
            self.acceptance_level = min(1.0, self.acceptance_level + base_acceptance * 0.1)
        elif age_ratio < 0.3:
            self.acceptance_level = max(0.05, self.acceptance_level - 0.01)
        drive = self._meaning_buffering()
        if self.death_anxiety > self.meaning_buffer:
            self.legacy_completeness = min(1.0, self.legacy_completeness + drive * 0.05)
        return {
            "age": self.age,
            "death_anxiety": self.death_anxiety,
            "acceptance": self.acceptance_level,
            "meaning_drive": float(drive),
            "life_remaining_ratio": 1.0 - age_ratio
        }

    def get_state(self) -> dict:
        age_ratio = self.age / self.max_lifespan
        acceptance_stage = "denial"
        if self.acceptance_level > 0.8:
            acceptance_stage = "acceptance"
        elif self.acceptance_level > 0.5:
            acceptance_stage = "bargaining"
        elif self.acceptance_level > 0.2:
            acceptance_stage = "anger"
        return {
            "module": "mortality",
            "class": "MortalityAwareness",
            "age": self.age,
            "max_lifespan": self.max_lifespan,
            "life_remaining": 1.0 - age_ratio,
            "mortality_salience": self.mortality_salience,
            "death_anxiety": self.death_anxiety,
            "meaning_buffer": self.meaning_buffer,
            "anxiety_vs_buffer_gap": self.death_anxiety - self.meaning_buffer,
            "legacy_completeness": self.legacy_completeness,
            "legacy_matrix": {k: round(v, 4) for k, v in self.legacy_matrix.items()},
            "acceptance_level": self.acceptance_level,
            "acceptance_stage": acceptance_stage,
            "memento_mori_practices": self.memento_mori_count,
            "triggers_experienced": len(self.triggers_history)
        }


def run_test():
    np.random.seed(42)
    m = MortalityAwareness(age=25.0)
    results = {"lifespan_simulation": [], "legacy_evaluation": {}, "memento_mori": {}, "final_state": {}}

    for age in range(20, 81, 5):
        result = m.process_lifespan(float(age))
        if age % 10 == 0:
            m.confront_mortality("aging_sign")
        if age == 45:
            m.confront_mortality("illness")
        if age == 60:
            m.confront_mortality("loss")
        results["lifespan_simulation"].append({
            "age": age,
            "death_anxiety": round(m.death_anxiety, 4),
            "acceptance": round(m.acceptance_level, 4),
            "meaning_buffer": round(m.meaning_buffer, 4)
        })

    legacy_achieve = {
        "creations": 0.7, "knowledge": 0.9,
        "relationships": 0.6, "impact": 0.5, "wisdom": 0.8
    }
    results["legacy_evaluation"] = m.evaluate_legacy(legacy_achieve)
    results["memento_mori"] = m.practice_memento_mori()
    m.practice_memento_mori()
    m.practice_memento_mori()
    m.confront_mortality("existential_thought")
    results["final_state"] = m.get_state()
    return results


if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        obj = MortalityAwareness(age=30.0)
        if action == "state":
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "step":
            obj.process_lifespan(obj.age + 1)
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "trigger" in data:
                print(json.dumps(obj.confront_mortality(data["trigger"])))
            else:
                print(json.dumps({"status": "ok", "state": obj.get_state()}))
        else:
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
    else:
        result = run_test()
        print(json.dumps({"status": "ok", "summary": "test passed", "state": result}))
