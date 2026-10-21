import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field

@dataclass
class Transgression:
    id: str
    offender: str
    harm: float
    time_of_event: float
    forgiven: bool
    grudge: bool

class ForgivenessEngine:
    def __init__(self):
        self.transgressions = []
        self.self_forgiveness_log = []
        self.grudges = []
        self.empathy_level = 0.5
        self.self_compassion = 0.5

    def record_transgression(self, offender, harm):
        h = max(0.0, min(1.0, harm))
        entry = Transgression(
            id=str(uuid.uuid4()),
            offender=offender,
            harm=h,
            time_of_event=time.time(),
            forgiven=False,
            grudge=False
        )
        self.transgressions.append(entry)
        return {"transgression_id": entry.id, "harm": h, "offender": offender}

    def _compute_forgiveness(self, transgression):
        time_since = time.time() - transgression.time_of_event
        time_factor = min(1.0, time_since / 86400.0)
        return self.empathy_level * time_factor * (1.0 - transgression.harm * 0.5)

    def forgive(self, offender):
        matching = [t for t in self.transgressions if t.offender == offender and not t.forgiven]
        if not matching:
            return {"error": "no_transgressions_found_for", "offender": offender}
        results = []
        for t in matching:
            forgiveness_score = self._compute_forgiveness(t)
            if forgiveness_score > 0.3:
                t.forgiven = True
                t.grudge = False
                results.append({
                    "transgression_id": t.id,
                    "forgiveness_score": round(forgiveness_score, 4),
                    "harm": t.harm
                })
                self.grudges = [g for g in self.grudges if g["offender"] != offender]
                self.empathy_level = min(1.0, self.empathy_level + 0.05)
        return {
            "offender": offender,
            "forgiven_count": len(results),
            "forgiveness_details": results
        }

    def self_forgive(self, action):
        action_desc = action if action else "unknown"
        guilt = np.random.beta(2, 3)
        relief = self.self_compassion * (1.0 - guilt)
        entry = {
            "id": str(uuid.uuid4()),
            "action": action_desc,
            "guilt": round(guilt, 4),
            "relief": round(relief, 4),
            "self_forgiveness": round(relief * 0.7 + self.self_compassion * 0.3, 4)
        }
        self.self_forgiveness_log.append(entry)
        self.self_compassion = min(1.0, self.self_compassion + 0.03)
        return entry

    def hold_grudge(self, offender):
        matching = [t for t in self.transgressions if t.offender == offender and not t.forgiven]
        if not matching:
            return {"error": "no_transgressions_to_hold_grudge_for", "offender": offender}
        results = []
        for t in matching:
            t.grudge = True
            results.append(t.id)
            grudge_entry = {
                "grudge_id": str(uuid.uuid4()),
                "offender": offender,
                "transgression_id": t.id,
                "harm": t.harm,
                "timestamp": time.time()
            }
            self.grudges.append(grudge_entry)
        return {
            "offender": offender,
            "grudge_count": len(results),
            "transgressions": results
        }

    def get_state(self):
        forgiven_count = sum(1 for t in self.transgressions if t.forgiven)
        grudge_count = len(self.grudges)
        pending_count = len(self.transgressions) - forgiven_count
        transgression_matrix = defaultdict(list)
        for t in self.transgressions:
            transgression_matrix[t.offender].append({
                "harm": t.harm,
                "forgiven": t.forgiven,
                "grudge": t.grudge
            })
        return {
            "module": "ForgivenessEngine",
            "total_transgressions": len(self.transgressions),
            "forgiven_count": forgiven_count,
            "pending_count": pending_count,
            "grudge_count": grudge_count,
            "self_forgiveness_count": len(self.self_forgiveness_log),
            "empathy_level": round(self.empathy_level, 4),
            "self_compassion": round(self.self_compassion, 4),
            "transgression_matrix": dict(transgression_matrix),
            "recent_self_forgiveness": self.self_forgiveness_log[-3:] if self.self_forgiveness_log else [],
            "active_grudges": [
                {"offender": g["offender"], "harm": g["harm"]}
                for g in self.grudges[-5:]
            ]
        }


if __name__ == "__main__":
    fe = ForgivenessEngine()
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": fe.get_state()}))
        elif action == "step":
            fe.record_transgression("system_error", 0.6)
            fe.forgive("system_error")
            fe.self_forgive("failed to respond in time")
            print(json.dumps({"status": "ok", "state": fe.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "transgression" in data:
                fe.record_transgression(data["transgression"]["offender"], data["transgression"]["harm"])
            if "forgive" in data:
                fe.forgive(data["forgive"])
            if "self_forgive" in data:
                fe.self_forgive(data["self_forgive"])
            if "grudge" in data:
                fe.hold_grudge(data["grudge"])
            print(json.dumps({"status": "ok", "state": fe.get_state()}))
        else:
            print(json.dumps({"status": "error", "error": "unknown_action"}))
    else:
        fe.record_transgression("memory_leak_module", 0.7)
        fe.record_transgression("corrupted_signal", 0.4)
        fe.record_transgression("negligent_awakening", 0.85)
        fe.forgive("memory_leak_module")
        fe.self_forgive("forgot a critical thought chain")
        fe.hold_grudge("negligent_awakening")
        print(json.dumps({"status": "ok", "state": fe.get_state()}))
