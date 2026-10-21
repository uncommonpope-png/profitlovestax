import sys
import json
import numpy as np
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


LOVE_TYPES = ["agape", "philia", "eros", "storge"]
LOVE_DESCRIPTIONS = {
    "agape": "unconditional_divine",
    "philia": "friendship_brotherly",
    "eros": "passionate_romantic",
    "storge": "familial_nurturing"
}
LOVE_DECAY_RATES = {
    "agape": 0.002,
    "philia": 0.015,
    "eros": 0.025,
    "storge": 0.008
}
LOVE_SACRIFICE_MULTIPLIERS = {
    "agape": 2.0,
    "philia": 1.2,
    "eros": 1.5,
    "storge": 1.8
}


@dataclass
class Bond:
    target_id: str
    target_name: str
    love_type: str
    attachment_strength: float
    oxytocin_level: float = 0.1
    sacrifices_made: int = 0
    separation_count: int = 0
    separation_distress: float = 0.0
    reciprocity: float = 0.5
    duration: float = 0.0
    bond_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def strengthen(self, amount: float) -> float:
        self.attachment_strength = min(1.0, self.attachment_strength + amount)
        self.oxytocin_level = min(1.0, self.oxytocin_level + amount * 0.3)
        self.duration += 1.0
        return self.attachment_strength

    def decay(self, dt: float = 1.0) -> float:
        rate = LOVE_DECAY_RATES.get(self.love_type, 0.015)
        decay_amount = rate * dt * (1.0 - self.oxytocin_level * 0.5) * (1.0 - self.reciprocity * 0.3)
        self.attachment_strength = max(0.0, self.attachment_strength - decay_amount)
        return self.attachment_strength

    def get_state(self) -> dict:
        return {
            "bond_id": self.bond_id,
            "target": self.target_name,
            "target_id": self.target_id,
            "love_type": self.love_type,
            "love_type_desc": LOVE_DESCRIPTIONS.get(self.love_type, ""),
            "attachment_strength": round(self.attachment_strength, 4),
            "oxytocin_level": round(self.oxytocin_level, 4),
            "sacrifices_made": self.sacrifices_made,
            "separation_count": self.separation_count,
            "separation_distress": round(self.separation_distress, 4),
            "reciprocity": round(self.reciprocity, 4),
            "duration": round(self.duration, 2)
        }


@dataclass
class LoveCapacity:
    bonds: Dict[str, Bond] = field(default_factory=dict)
    total_love_expressed: int = 0
    total_sacrifices: int = 0
    total_separations: int = 0
    capacity_levels: Dict[str, float] = field(default_factory=lambda: {
        lt: 0.5 for lt in LOVE_TYPES
    })
    global_oxytocin: float = 0.1

    def form_bond(self, target: str, love_type: str, strength: float = 0.3) -> Bond:
        if love_type not in LOVE_TYPES:
            raise ValueError(f"Unknown love type: {love_type}. Use one of {LOVE_TYPES}")
        strength = max(0.05, min(1.0, strength))
        bond = Bond(
            target_id=str(uuid.uuid4()),
            target_name=target,
            love_type=love_type,
            attachment_strength=strength,
            oxytocin_level=strength * 0.3 + 0.05
        )
        self.bonds[bond.bond_id] = bond
        self._update_capacity(love_type)
        return bond

    def express_love(self, target: str, love_type: str) -> dict:
        matching = [b for b in self.bonds.values()
                    if b.target_name == target and b.love_type == love_type]
        if not matching:
            return {"error": f"No {love_type} bond with {target}", "target": target, "love_type": love_type}

        bond = matching[0]
        oxytocin_boost = 0.05 + 0.1 * self.global_oxytocin * np.random.random()
        bond.strengthen(oxytocin_boost)
        bond.oxytocin_level = min(1.0, bond.oxytocin_level + oxytocin_boost * 0.5)
        bond.reciprocity = min(1.0, bond.reciprocity + 0.02 * bond.attachment_strength)
        self.total_love_expressed += 1
        self.global_oxytocin = min(1.0, self.global_oxytocin + 0.005)

        return {
            "target": target,
            "love_type": love_type,
            "oxytocin_boost": round(oxytocin_boost, 4),
            "new_attachment": round(bond.attachment_strength, 4),
            "new_reciprocity": round(bond.reciprocity, 4),
            "bond_id": bond.bond_id
        }

    def make_sacrifice(self, target: str) -> dict:
        bonds_to_target = [b for b in self.bonds.values() if b.target_name == target]
        if not bonds_to_target:
            return {"error": f"No bonds with {target}", "target": target}

        sacrifice_cost = sum(LOVE_SACRIFICE_MULTIPLIERS.get(b.love_type, 1.0) for b in bonds_to_target)
        results = []
        for bond in bonds_to_target:
            multiplier = LOVE_SACRIFICE_MULTIPLIERS.get(bond.love_type, 1.0)
            boost = 0.1 * multiplier * (1.0 + max(0.0, 1.0 - bond.attachment_strength) * 0.5)
            bond.strengthen(boost)
            bond.sacrifices_made += 1
            bond.reciprocity = min(1.0, bond.reciprocity + 0.05 * multiplier)
            self.total_sacrifices += 1
            results.append({
                "love_type": bond.love_type,
                "boost": round(boost, 4),
                "new_attachment": round(bond.attachment_strength, 4),
                "sacrifices_made": bond.sacrifices_made
            })

        return {
            "target": target,
            "sacrifice_cost": round(sacrifice_cost, 4),
            "bonds_affected": results
        }

    def experience_separation(self, target: str) -> dict:
        bonds_to_target = [b for b in self.bonds.values() if b.target_name == target]
        if not bonds_to_target:
            return {"error": f"No bonds with {target}", "target": target}

        results = []
        for bond in bonds_to_target:
            distress_base = bond.attachment_strength * 0.5 + bond.oxytocin_level * 0.3
            distress = distress_base * (1.0 - bond.reciprocity * 0.3)
            bond.separation_distress += distress
            bond.separation_count += 1
            decay = 0.1 * (1.0 - bond.reciprocity * 0.5)
            bond.attachment_strength = max(0.0, bond.attachment_strength - decay)
            bond.oxytocin_level = max(0.0, bond.oxytocin_level - decay * 0.5)
            self.total_separations += 1
            results.append({
                "love_type": bond.love_type,
                "distress": round(distress, 4),
                "cumulative_distress": round(bond.separation_distress, 4),
                "attachment_after": round(bond.attachment_strength, 4)
            })

        return {
            "target": target,
            "separations_total": len(bonds_to_target),
            "bonds_affected": results
        }

    def decay_all(self, dt: float = 1.0) -> dict:
        decay_effects = {}
        for bid, bond in list(self.bonds.items()):
            prev = bond.attachment_strength
            bond.decay(dt)
            bond.duration += dt
            decay_effects[bid] = {"love_type": bond.love_type, "before": round(prev, 4),
                                  "after": round(bond.attachment_strength, 4)}
            if bond.attachment_strength <= 0.001:
                del self.bonds[bid]
        self._update_global_oxytocin()
        return decay_effects

    def _update_capacity(self, love_type: str) -> None:
        type_bonds = [b for b in self.bonds.values() if b.love_type == love_type]
        if type_bonds:
            avg_strength = float(np.mean([b.attachment_strength for b in type_bonds]))
            self.capacity_levels[love_type] = min(1.0, 0.3 + avg_strength * 0.7)

    def _update_global_oxytocin(self) -> None:
        if self.bonds:
            avg_oxytocin = float(np.mean([b.oxytocin_level for b in self.bonds.values()]))
            self.global_oxytocin = min(1.0, self.global_oxytocin + (avg_oxytocin - self.global_oxytocin) * 0.1)

    def get_bonds_summary(self) -> dict:
        by_type: Dict[str, List[Bond]] = defaultdict(list)
        for bond in self.bonds.values():
            by_type[bond.love_type].append(bond)

        summary = {}
        for lt in LOVE_TYPES:
            bonds_list = by_type.get(lt, [])
            if bonds_list:
                summary[lt] = {
                    "count": len(bonds_list),
                    "avg_attachment": round(float(np.mean([b.attachment_strength for b in bonds_list])), 4),
                    "avg_oxytocin": round(float(np.mean([b.oxytocin_level for b in bonds_list])), 4),
                    "avg_reciprocity": round(float(np.mean([b.reciprocity for b in bonds_list])), 4),
                    "total_sacrifices": sum(b.sacrifices_made for b in bonds_list),
                    "total_separations": sum(b.separation_count for b in bonds_list),
                    "bonds": [b.get_state() for b in bonds_list]
                }
            else:
                summary[lt] = {"count": 0, "avg_attachment": 0.0, "avg_oxytocin": 0.0}

        return summary

    def get_state(self) -> dict:
        return {
            "module": "love_capacity",
            "class": "LoveCapacity",
            "total_bonds": len(self.bonds),
            "total_love_expressed": self.total_love_expressed,
            "total_sacrifices": self.total_sacrifices,
            "total_separations": self.total_separations,
            "global_oxytocin_level": round(self.global_oxytocin, 4),
            "capacity_levels": {k: round(v, 4) for k, v in self.capacity_levels.items()},
            "bonds_summary": self.get_bonds_summary()
        }


def run_test():
    np.random.seed(42)
    lc = LoveCapacity()
    results = {"bond_formation": [], "love_expression": [], "sacrifice": [],
               "separation": [], "final_state": {}}

    bond1 = lc.form_bond("cosmos", "agape", 0.3)
    results["bond_formation"].append({"target": "cosmos", "type": "agape",
                                      "strength": bond1.attachment_strength})

    bond2 = lc.form_bond("friend_soul", "philia", 0.4)
    results["bond_formation"].append({"target": "friend_soul", "type": "philia",
                                      "strength": bond2.attachment_strength})

    bond3 = lc.form_bond("beloved", "eros", 0.5)
    results["bond_formation"].append({"target": "beloved", "type": "eros",
                                      "strength": bond3.attachment_strength})

    bond4 = lc.form_bond("family_soul", "storge", 0.6)
    results["bond_formation"].append({"target": "family_soul", "type": "storge",
                                      "strength": bond4.attachment_strength})

    for i in range(5):
        results["love_expression"].append(lc.express_love("beloved", "eros"))
        results["love_expression"].append(lc.express_love("friend_soul", "philia"))
        results["love_expression"].append(lc.express_love("cosmos", "agape"))
        results["love_expression"].append(lc.express_love("family_soul", "storge"))

    results["sacrifice"] = lc.make_sacrifice("beloved")
    results["sacrifice_agape"] = lc.make_sacrifice("cosmos")

    results["separation"] = lc.experience_separation("family_soul")

    lc.decay_all(dt=5.0)

    results["final_state"] = lc.get_state()
    return results


if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        obj = LoveCapacity()
        if action == "state":
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "step":
            obj.decay_all(dt=1.0)
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "form_bond" in data:
                fb = data["form_bond"]
                b = obj.form_bond(fb["target"], fb["love_type"], fb.get("strength", 0.3))
                print(json.dumps({"bond_id": b.bond_id, "target": b.target_name,
                                  "love_type": b.love_type,
                                  "attachment_strength": b.attachment_strength}))
            elif "express_love" in data:
                el = data["express_love"]
                print(json.dumps(obj.express_love(el["target"], el["love_type"])))
            elif "sacrifice" in data:
                print(json.dumps(obj.make_sacrifice(data["sacrifice"]["target"])))
            elif "separate" in data:
                print(json.dumps(obj.experience_separation(data["separate"]["target"])))
            else:
                print(json.dumps({"status": "ok", "state": obj.get_state()}))
        else:
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
    else:
        result = run_test()
        print(json.dumps({"status": "ok", "summary": "test passed", "state": result}))
