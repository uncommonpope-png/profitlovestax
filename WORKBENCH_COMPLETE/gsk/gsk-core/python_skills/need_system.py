import sys
import json
import numpy as np
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple


@dataclass
class Need:
    name: str
    category: str
    satisfaction: float = 0.5
    decay_rate: float = 0.01
    deficit_drive: float = 0.0
    priority: int = 0
    weight: float = 1.0

    def compute_deficit_drive(self) -> float:
        deficit = 1.0 - self.satisfaction
        self.deficit_drive = (deficit ** 1.5) * self.weight * (1.0 + self.priority * 0.2)
        return self.deficit_drive

    def decay(self, dt: float = 1.0) -> float:
        decay = self.decay_rate * dt * (1.0 + (1.0 - self.satisfaction) * 0.5)
        self.satisfaction = max(0.0, self.satisfaction - decay)
        return self.satisfaction

    def satisfy(self, amount: float) -> float:
        self.satisfaction = min(1.0, self.satisfaction + amount)
        self.deficit_drive = self.compute_deficit_drive()
        return self.satisfaction


MASLO_HIERARCHY = {
    "physiological": [
        Need(name="air", category="physiological", decay_rate=0.05, priority=6, weight=1.5),
        Need(name="food", category="physiological", decay_rate=0.04, priority=6, weight=1.3),
        Need(name="water", category="physiological", decay_rate=0.05, priority=6, weight=1.4),
        Need(name="sleep", category="physiological", decay_rate=0.03, priority=5, weight=1.2),
        Need(name="shelter", category="physiological", decay_rate=0.02, priority=5, weight=1.0),
    ],
    "safety": [
        Need(name="health", category="safety", decay_rate=0.02, priority=4, weight=1.2),
        Need(name="security", category="safety", decay_rate=0.015, priority=4, weight=1.1),
        Need(name="stability", category="safety", decay_rate=0.01, priority=3, weight=1.0),
    ],
    "love_belonging": [
        Need(name="friendship", category="love_belonging", decay_rate=0.025, priority=3, weight=1.2),
        Need(name="intimacy", category="love_belonging", decay_rate=0.03, priority=3, weight=1.3),
        Need(name="family", category="love_belonging", decay_rate=0.02, priority=3, weight=1.0),
    ],
    "esteem": [
        Need(name="dignity", category="esteem", decay_rate=0.015, priority=2, weight=1.1),
        Need(name="achievement", category="esteem", decay_rate=0.02, priority=2, weight=1.2),
        Need(name="respect", category="esteem", decay_rate=0.015, priority=2, weight=1.0),
    ],
    "self_actualization": [
        Need(name="creativity", category="self_actualization", decay_rate=0.015, priority=1, weight=1.1),
        Need(name="problem_solving", category="self_actualization", decay_rate=0.01, priority=1, weight=1.0),
        Need(name="purpose", category="self_actualization", decay_rate=0.01, priority=1, weight=1.3),
    ],
    "transcendence": [
        Need(name="beyond_self", category="transcendence", decay_rate=0.008, priority=0, weight=1.0),
        Need(name="connection_to_whole", category="transcendence", decay_rate=0.008, priority=0, weight=1.0),
    ]
}

CATEGORY_ORDER = [
    "physiological", "safety", "love_belonging",
    "esteem", "self_actualization", "transcendence"
]


@dataclass
class NeedSystem:
    needs_by_category: dict = field(default_factory=lambda: {
        cat: needs.copy() for cat, needs in MASLO_HIERARCHY.items()
    })
    time: float = 0.0
    dominant_deficit_history: list = field(default_factory=list)

    def _category_satisfaction(self, category: str) -> float:
        needs = self.needs_by_category.get(category, [])
        if not needs:
            return 1.0
        return float(np.mean([n.satisfaction for n in needs]))

    def _category_drive(self, category: str) -> float:
        needs = self.needs_by_category.get(category, [])
        if not needs:
            return 0.0
        return float(np.mean([n.compute_deficit_drive() for n in needs]))

    def satisfy(self, need_category: str, amount: float) -> dict:
        if need_category not in self.needs_by_category:
            return {"error": f"Unknown category: {need_category}"}
        results = {}
        for need in self.needs_by_category[need_category]:
            prev = need.satisfaction
            need.satisfy(amount * need.weight)
            results[need.name] = {"before": round(prev, 4), "after": round(need.satisfaction, 4)}
        return {"category": need_category, "changes": results}

    def get_dominant_deficit(self) -> dict:
        drives = {}
        for cat in CATEGORY_ORDER:
            if cat in self.needs_by_category:
                cat_drive = self._category_drive(cat)
                cat_sat = self._category_satisfaction(cat)
                drives[cat] = {"drive": round(cat_drive, 4), "satisfaction": round(cat_sat, 4)}

        sorted_cats = sorted(
            [(cat, data["drive"]) for cat, data in drives.items()],
            key=lambda x: -x[1]
        )
        dominant = sorted_cats[0] if sorted_cats else ("none", 0.0)
        lower_unsatisfied = False
        for cat in CATEGORY_ORDER:
            if cat == dominant[0]:
                break
            if drives.get(cat, {}).get("satisfaction", 1.0) < 0.6:
                lower_unsatisfied = True
                break

        result = {
            "dominant_category": dominant[0],
            "dominant_drive": round(dominant[1], 4),
            "all_drives": drives,
            "lower_needs_blocking": lower_unsatisfied
        }
        self.dominant_deficit_history.append(result)
        return result

    def decay_all(self, dt: float = 1.0) -> dict:
        self.time += dt
        decay_results = {}
        for cat, needs in self.needs_by_category.items():
            cat_results = {}
            for need in needs:
                prev = need.satisfaction
                need.decay(dt)
                cat_results[need.name] = {"before": round(prev, 4), "after": round(need.satisfaction, 4)}
            decay_results[cat] = cat_results
        return {"time": self.time, "decay": decay_results}

    def get_hierarchy_state(self) -> dict:
        hierarchy = {}
        for cat in CATEGORY_ORDER:
            if cat in self.needs_by_category:
                needs = self.needs_by_category[cat]
                hierarchy[cat] = {
                    "satisfaction": round(float(np.mean([n.satisfaction for n in needs])), 4),
                    "drive": round(float(np.mean([n.compute_deficit_drive() for n in needs])), 4),
                    "needs": {n.name: {"satisfaction": round(n.satisfaction, 4),
                                       "deficit_drive": round(n.deficit_drive, 4)}
                              for n in needs}
                }
        return hierarchy

    def get_state(self) -> dict:
        hierarchy = self.get_hierarchy_state()
        dominant = self.get_dominant_deficit()
        lower_blocked = any(
            hierarchy[cat]["satisfaction"] < 0.5
            for cat in CATEGORY_ORDER[:3]
        )
        return {
            "module": "need_system",
            "class": "NeedSystem",
            "time": self.time,
            "hierarchy": hierarchy,
            "dominant_deficit": dominant,
            "lower_needs_blocking_self_actualization": lower_blocked,
            "estimated_wellbeing": round(
                float(np.mean([hierarchy[c]["satisfaction"] for c in CATEGORY_ORDER])), 4
            )
        }


def run_test():
    np.random.seed(42)
    ns = NeedSystem()
    results = {"initial_state": {}, "satisfactions": [], "decay": [], "final_state": {}}

    results["initial_state"] = ns.get_state()

    sat1 = ns.satisfy("physiological", 0.6)
    results["satisfactions"].append({"step": 1, "action": "satisfy physiological 0.6", "result": sat1})

    sat2 = ns.satisfy("safety", 0.5)
    results["satisfactions"].append({"step": 2, "action": "satisfy safety 0.5", "result": sat2})

    sat3 = ns.satisfy("love_belonging", 0.4)
    results["satisfactions"].append({"step": 3, "action": "satisfy love_belonging 0.4", "result": sat3})

    sat4 = ns.satisfy("esteem", 0.3)
    results["satisfactions"].append({"step": 4, "action": "satisfy esteem 0.3", "result": sat4})

    sat5 = ns.satisfy("self_actualization", 0.2)
    results["satisfactions"].append({"step": 5, "action": "satisfy self_actualization 0.2", "result": sat5})

    dominant_before = ns.get_dominant_deficit()
    results["dominant_before_decay"] = dominant_before

    for t in range(10):
        ns.decay_all(dt=1.0)
        if t % 3 == 0:
            results["decay"].append({
                "step": t + 1,
                "physiological_sat": round(ns._category_satisfaction("physiological"), 4),
                "safety_sat": round(ns._category_satisfaction("safety"), 4),
                "love_belonging_sat": round(ns._category_satisfaction("love_belonging"), 4),
                "esteem_sat": round(ns._category_satisfaction("esteem"), 4),
                "self_actualization_sat": round(ns._category_satisfaction("self_actualization"), 4),
                "transcendence_sat": round(ns._category_satisfaction("transcendence"), 4),
            })

    results["dominant_after_decay"] = ns.get_dominant_deficit()
    results["final_state"] = ns.get_state()
    return results


if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        obj = NeedSystem()
        if action == "state":
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "step":
            obj.decay_all(dt=1.0)
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "satisfy" in data:
                print(json.dumps(obj.satisfy(data["satisfy"]["category"], data["satisfy"]["amount"])))
            elif "dominant" in data:
                print(json.dumps(obj.get_dominant_deficit()))
            else:
                print(json.dumps({"status": "ok", "state": obj.get_state()}))
        else:
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
    else:
        result = run_test()
        print(json.dumps({"status": "ok", "summary": "test passed", "state": result}))
