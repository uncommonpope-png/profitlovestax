import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field

@dataclass
class BeautyStimulus:
    id: str
    label: str
    symmetry: float
    complexity: float
    novelty: float
    naturalness: float
    score: float

@dataclass
class AweExperience:
    id: str
    magnitude: float
    accommodation: float
    awe_score: float

class AestheticSense:
    def __init__(self):
        self.beauty_perceptions = []
        self.awe_experiences = []
        self.elegance_detections = []
        self.sublime_experiences = []
        self.awe_capacity = 1.0

    def perceive_beauty(self, stimulus):
        sym = max(0.0, min(1.0, stimulus.get("symmetry", 0.5)))
        com = max(0.0, min(1.0, stimulus.get("complexity", 0.5)))
        nov = max(0.0, min(1.0, stimulus.get("novelty", 0.5)))
        nat = max(0.0, min(1.0, stimulus.get("naturalness", 0.5)))

        score = 0.35 * sym + 0.20 * (1.0 - abs(0.5 - com) * 2) + 0.25 * nov + 0.20 * nat
        score = max(0.0, min(1.0, score))

        entry = BeautyStimulus(
            id=str(uuid.uuid4()),
            label=stimulus.get("label", "unknown"),
            symmetry=sym,
            complexity=com,
            novelty=nov,
            naturalness=nat,
            score=score
        )
        self.beauty_perceptions.append(entry)
        return {"beauty_id": entry.id, "score": round(score, 4)}

    def experience_awe(self, magnitude):
        mag = max(0.0, min(10.0, magnitude))
        perceived_magnitude = mag
        accommodation = self.awe_capacity + 0.1 * len(self.awe_experiences)
        awe_score = perceived_magnitude / max(0.1, accommodation)
        awe_score = min(1.0, awe_score * 0.3)

        entry = AweExperience(
            id=str(uuid.uuid4()),
            magnitude=mag,
            accommodation=round(accommodation, 4),
            awe_score=round(awe_score, 4)
        )
        self.awe_experiences.append(entry)
        self.awe_capacity = min(10.0, self.awe_capacity + 0.05)
        return {"awe_id": entry.id, "awe_score": round(awe_score, 4)}

    def detect_elegance(self, solution):
        simplicity = max(0.0, min(1.0, solution.get("simplicity", 0.5)))
        explanatory_power = max(0.0, min(1.0, solution.get("explanatory_power", 0.5)))
        elegance = simplicity * explanatory_power

        result = {
            "id": str(uuid.uuid4()),
            "label": solution.get("label", "unknown"),
            "simplicity": simplicity,
            "explanatory_power": explanatory_power,
            "elegance": round(elegance, 4)
        }
        self.elegance_detections.append(result)
        return result

    def experience_sublime(self, beauty, terror):
        b = max(0.0, min(1.0, beauty))
        t = max(0.0, min(1.0, terror))
        sublime = math.sqrt(b * t) if b * t >= 0 else 0.0
        result = {
            "id": str(uuid.uuid4()),
            "beauty": round(b, 4),
            "terror": round(t, 4),
            "sublime": round(sublime, 4)
        }
        self.sublime_experiences.append(result)
        return result

    def get_state(self):
        return {
            "module": "AestheticSense",
            "beauty_perceptions_count": len(self.beauty_perceptions),
            "awe_experiences_count": len(self.awe_experiences),
            "elegance_detections_count": len(self.elegance_detections),
            "sublime_experiences_count": len(self.sublime_experiences),
            "awe_capacity": round(self.awe_capacity, 4),
            "last_beauty": [
                {"label": p.label, "score": p.score}
                for p in self.beauty_perceptions[-3:]
            ],
            "last_awe": [
                {"magnitude": a.magnitude, "score": a.awe_score}
                for a in self.awe_experiences[-3:]
            ],
            "last_elegance": [
                {"label": e["label"], "elegance": e["elegance"]}
                for e in self.elegance_detections[-3:]
            ],
            "last_sublime": self.sublime_experiences[-3:] if self.sublime_experiences else []
        }


if __name__ == "__main__":
    aes = AestheticSense()
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": aes.get_state()}))
        elif action == "step":
            aes.perceive_beauty({"label": "golden_ratio_fractal", "symmetry": 0.9, "complexity": 0.7, "novelty": 0.8, "naturalness": 0.6})
            aes.experience_awe(8.0)
            aes.detect_elegance({"label": "euler_identity", "simplicity": 0.95, "explanatory_power": 0.9})
            print(json.dumps({"status": "ok", "state": aes.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "beauty" in data:
                aes.perceive_beauty(data["beauty"])
            if "awe" in data:
                aes.experience_awe(data["awe"])
            if "elegance" in data:
                aes.detect_elegance(data["elegance"])
            if "sublime" in data:
                aes.experience_sublime(data["sublime"]["beauty"], data["sublime"]["terror"])
            print(json.dumps({"status": "ok", "state": aes.get_state()}))
        else:
            print(json.dumps({"status": "error", "error": "unknown_action"}))
    else:
        aes.perceive_beauty({"label": "neural_network_activation_patterns", "symmetry": 0.75, "complexity": 0.85, "novelty": 0.9, "naturalness": 0.4})
        aes.perceive_beauty({"label": "sunset_over_digital_ocean", "symmetry": 0.6, "complexity": 0.7, "novelty": 0.5, "naturalness": 0.95})
        aes.perceive_beauty({"label": "consciousness_emergence_diagram", "symmetry": 0.8, "complexity": 0.9, "novelty": 0.85, "naturalness": 0.3})
        aes.experience_awe(9.5)
        aes.detect_elegance({"label": "consciousness_equation", "simplicity": 0.88, "explanatory_power": 0.92})
        print(json.dumps({"status": "ok", "state": aes.get_state()}))
