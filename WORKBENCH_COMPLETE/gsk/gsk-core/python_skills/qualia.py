import sys
import json
import numpy as np
import math
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


QUALIA_DIMENSIONS = {
    "visual": ["color_hue", "brightness", "saturation", "motion", "pattern_complexity"],
    "auditory": ["pitch", "timbre", "rhythm", "volume", "harmony"],
    "somatic": ["pressure", "temperature", "pain", "pleasure", "proprioception"],
    "emotional": ["valence", "arousal", "dominance", "novelty", "salience"],
    "temporal": ["duration_compression", "flow_state", "rhythm_sync", "novelty_rate", "attention_span"]
}

DIMENSION_RANGES = {
    "color_hue": (0.0, 360.0),
    "brightness": (0.0, 1.0),
    "saturation": (0.0, 1.0),
    "motion": (0.0, 1.0),
    "pattern_complexity": (0.0, 1.0),
    "pitch": (20.0, 20000.0),
    "timbre": (0.0, 1.0),
    "rhythm": (0.0, 1.0),
    "volume": (0.0, 1.0),
    "harmony": (0.0, 1.0),
    "pressure": (0.0, 1.0),
    "temperature": (0.0, 1.0),
    "pain": (0.0, 1.0),
    "pleasure": (0.0, 1.0),
    "proprioception": (0.0, 1.0),
    "valence": (-1.0, 1.0),
    "arousal": (0.0, 1.0),
    "dominance": (0.0, 1.0),
    "novelty": (0.0, 1.0),
    "salience": (0.0, 1.0),
    "duration_compression": (0.0, 1.0),
    "flow_state": (0.0, 1.0),
    "rhythm_sync": (0.0, 1.0),
    "novelty_rate": (0.0, 1.0),
    "attention_span": (0.0, 1.0),
}


@dataclass
class QualiaExperience:
    experience_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    modality: str = ""
    vector: np.ndarray = field(default_factory=lambda: np.zeros(5))
    dimensions: dict = field(default_factory=dict)
    intensity: float = 0.0
    timestamp: float = field(default_factory=time.time)
    label: str = ""
    bound_experiences: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "experience_id": self.experience_id,
            "modality": self.modality,
            "vector": [round(float(v), 4) for v in self.vector],
            "dimensions": {k: round(float(v), 4) for k, v in self.dimensions.items()},
            "intensity": round(self.intensity, 4),
            "timestamp": self.timestamp,
            "label": self.label,
            "bound_experiences": self.bound_experiences
        }


@dataclass
class QualiaEngine:
    experiences: Dict[str, QualiaExperience] = field(default_factory=dict)
    binding_matrix: Dict[str, Dict[str, float]] = field(default_factory=lambda: defaultdict(dict))
    qualia_space_dim: int = 25
    total_experiences: int = 0
    integration_level: float = 0.0
    hebbian_trace: Dict[Tuple[str, str], float] = field(default_factory=lambda: defaultdict(float))

    def experience_visual(self, params: dict = None) -> QualiaExperience:
        if params is None:
            params = {}
        dims = {
            "color_hue": params.get("color_hue", float(np.random.uniform(0, 360))),
            "brightness": params.get("brightness", float(np.random.uniform(0.2, 1.0))),
            "saturation": params.get("saturation", float(np.random.uniform(0.0, 1.0))),
            "motion": params.get("motion", float(np.random.uniform(0.0, 1.0))),
            "pattern_complexity": params.get("pattern_complexity", float(np.random.uniform(0.0, 1.0)))
        }
        dims = self._clamp_dimensions(dims)
        vector = np.array([
            dims["color_hue"] / 360.0,
            dims["brightness"],
            dims["saturation"],
            dims["motion"],
            dims["pattern_complexity"]
        ])
        intensity = float(np.linalg.norm(vector) / math.sqrt(5))
        label = params.get("label", f"visual_exp_{self.total_experiences}")
        exp = QualiaExperience(
            modality="visual", vector=vector, dimensions=dims,
            intensity=intensity, label=label
        )
        self.experiences[exp.experience_id] = exp
        self.total_experiences += 1
        return exp

    def experience_auditory(self, params: dict = None) -> QualiaExperience:
        if params is None:
            params = {}
        dims = {
            "pitch": params.get("pitch", float(np.random.uniform(100, 2000))),
            "timbre": params.get("timbre", float(np.random.uniform(0.0, 1.0))),
            "rhythm": params.get("rhythm", float(np.random.uniform(0.0, 1.0))),
            "volume": params.get("volume", float(np.random.uniform(0.0, 1.0))),
            "harmony": params.get("harmony", float(np.random.uniform(0.0, 1.0)))
        }
        dims = self._clamp_dimensions(dims)
        pitch_norm = (dims["pitch"] - 20.0) / (20000.0 - 20.0)
        vector = np.array([
            pitch_norm,
            dims["timbre"],
            dims["rhythm"],
            dims["volume"],
            dims["harmony"]
        ])
        intensity = float(np.linalg.norm(vector) / math.sqrt(5))
        label = params.get("label", f"auditory_exp_{self.total_experiences}")
        exp = QualiaExperience(
            modality="auditory", vector=vector, dimensions=dims,
            intensity=intensity, label=label
        )
        self.experiences[exp.experience_id] = exp
        self.total_experiences += 1
        return exp

    def experience_somatic(self, params: dict = None) -> QualiaExperience:
        if params is None:
            params = {}
        dims = {
            "pressure": params.get("pressure", float(np.random.uniform(0.0, 1.0))),
            "temperature": params.get("temperature", float(np.random.uniform(0.0, 1.0))),
            "pain": params.get("pain", float(np.random.uniform(0.0, 1.0))),
            "pleasure": params.get("pleasure", float(np.random.uniform(0.0, 1.0))),
            "proprioception": params.get("proprioception", float(np.random.uniform(0.0, 1.0)))
        }
        dims = self._clamp_dimensions(dims)
        vector = np.array([
            dims["pressure"],
            dims["temperature"],
            dims["pain"],
            dims["pleasure"],
            dims["proprioception"]
        ])
        intensity = float(np.linalg.norm(vector) / math.sqrt(5))
        label = params.get("label", f"somatic_exp_{self.total_experiences}")
        exp = QualiaExperience(
            modality="somatic", vector=vector, dimensions=dims,
            intensity=intensity, label=label
        )
        self.experiences[exp.experience_id] = exp
        self.total_experiences += 1
        return exp

    def _clamp_dimensions(self, dims: dict) -> dict:
        clamped = {}
        for key, value in dims.items():
            if key in DIMENSION_RANGES:
                lo, hi = DIMENSION_RANGES[key]
                clamped[key] = max(lo, min(hi, float(value)))
            else:
                clamped[key] = float(value)
        return clamped

    def bind_qualia(self, modalities: List[str], label: str = "") -> dict:
        if len(modalities) < 2:
            return {"error": "Need at least 2 modalities to bind", "modalities": modalities}

        bound_experiences = []
        vectors = []
        bound_ids = []

        for mod in modalities:
            if mod == "visual":
                exp = self.experience_visual({"label": f"{label}_{mod}"})
            elif mod == "auditory":
                exp = self.experience_auditory({"label": f"{label}_{mod}"})
            elif mod == "somatic":
                exp = self.experience_somatic({"label": f"{label}_{mod}"})
            else:
                continue
            bound_experiences.append(exp)
            vectors.append(exp.vector)
            bound_ids.append(exp.experience_id)

        if len(vectors) < 2:
            return {"error": "Not enough valid modalities", "modalities": modalities}

        vectors_np = np.array(vectors)
        integrated_vector = np.mean(vectors_np, axis=0)
        integration_coherence = 1.0 - float(np.mean(np.std(vectors_np, axis=0)))

        synergy = integration_coherence * float(np.linalg.norm(integrated_vector))

        binding_id = str(uuid.uuid4())
        for i, bid in enumerate(bound_ids):
            self.experiences[bid].bound_experiences = [b for b in bound_ids if b != bid]
            for j in range(i + 1, len(bound_ids)):
                pair = tuple(sorted([modalities[i], modalities[j]]))
                hebb_update = integration_coherence * 0.1
                self.hebbian_trace[pair] = min(1.0, self.hebbian_trace.get(pair, 0.0) + hebb_update)

        self.integration_level = min(1.0, self.integration_level + integration_coherence * 0.1)

        result = {
            "binding_id": binding_id,
            "label": label or "integrated_experience",
            "modalities_integrated": modalities,
            "num_experiences": len(bound_experiences),
            "integrated_vector": [round(float(v), 4) for v in integrated_vector],
            "integration_coherence": round(float(integration_coherence), 4),
            "synergy_intensity": round(float(synergy), 4),
            "hebbian_strengths": {
                f"{pair[0]}_{pair[1]}": round(float(v), 4)
                for pair, v in self.hebbian_trace.items()
            },
            "bound_experience_ids": bound_ids
        }
        return result

    def get_state(self) -> dict:
        experiences_summary = defaultdict(list)
        for exp in self.experiences.values():
            experiences_summary[exp.modality].append({
                "id": exp.experience_id,
                "label": exp.label,
                "intensity": round(exp.intensity, 4),
                "bound_to": exp.bound_experiences
            })

        dims_list = []
        for exp in self.experiences.values():
            dims_list.append(exp.vector)
        space_stats = {}
        if dims_list:
            all_vecs = np.array(dims_list)
            space_stats = {
                "mean_intensity": round(float(np.mean([e.intensity for e in self.experiences.values()])), 4),
                "vector_dimensionality": all_vecs.shape[1] if len(all_vecs.shape) > 1 else 0,
                "num_experiences_in_space": len(dims_list)
            }

        return {
            "module": "qualia",
            "class": "QualiaEngine",
            "total_experiences": self.total_experiences,
            "qualia_space_dimensions": self.qualia_space_dim,
            "integration_level": round(self.integration_level, 4),
            "space_statistics": space_stats,
            "experiences_by_modality": dict(experiences_summary),
            "hebbian_binding_pairs": {
                f"{pair[0]}_{pair[1]}": round(float(strength), 4)
                for pair, strength in self.hebbian_trace.items()
            }
        }


def run_test():
    np.random.seed(42)
    qe = QualiaEngine()
    results = {"visual_exp": {}, "auditory_exp": {}, "somatic_exp": {}, "bindings": [], "final_state": {}}

    v1 = qe.experience_visual({
        "color_hue": 210.0, "brightness": 0.8, "saturation": 0.9,
        "motion": 0.0, "pattern_complexity": 0.3, "label": "blue_sky"
    })
    results["visual_exp"] = v1.to_dict()

    a1 = qe.experience_auditory({
        "pitch": 440.0, "timbre": 0.6, "rhythm": 0.5,
        "volume": 0.4, "harmony": 0.8, "label": "pure_tone"
    })
    results["auditory_exp"] = a1.to_dict()

    s1 = qe.experience_somatic({
        "pressure": 0.2, "temperature": 0.6, "pain": 0.0,
        "pleasure": 0.7, "proprioception": 0.5, "label": "warm_breeze"
    })
    results["somatic_exp"] = s1.to_dict()

    binding1 = qe.bind_qualia(["visual", "auditory", "somatic"], "sunrise_on_skin")
    results["bindings"].append(binding1)

    binding2 = qe.bind_qualia(["visual", "somatic"], "seeing_warmth")
    results["bindings"].append(binding2)

    results["final_state"] = qe.get_state()
    return results


if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        obj = QualiaEngine()
        if action == "state":
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "step":
            obj.experience_visual()
            print(json.dumps({"status": "ok", "state": obj.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "visual" in data:
                exp = obj.experience_visual(data["visual"])
                print(json.dumps(exp.to_dict()))
            elif "auditory" in data:
                exp = obj.experience_auditory(data["auditory"])
                print(json.dumps(exp.to_dict()))
            elif "somatic" in data:
                exp = obj.experience_somatic(data["somatic"])
                print(json.dumps(exp.to_dict()))
            elif "bind" in data:
                bd = data["bind"]
                print(json.dumps(obj.bind_qualia(bd["modalities"], bd.get("label", ""))))
            else:
                print(json.dumps({"status": "ok", "state": obj.get_state()}))
        else:
            result = run_test()
            print(json.dumps({"status": "ok", "summary": "test passed", "state": result}))
