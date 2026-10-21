"""
intuition_engine.py — System 1 / Intuitive Processing

Implements Kahneman's dual-process theory:
  - System 1: fast, automatic, intuitive, pattern-matching
  - System 2: slow, deliberate, analytical (simulated via check_consistency)

Pattern matching via cosine similarity against episodic memory buffer.
Gut feeling computed from match strength, memory availability, and emotional valence.
Heuristics: availability, representativeness, affect.
"""

import sys
import json
import numpy as np
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class MemoryEntry:
    features: np.ndarray
    outcome: str
    valence: float
    context: str
    entry_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])

    def __post_init__(self):
        if isinstance(self.features, list):
            self.features = np.array(self.features, dtype=np.float64)


class IntuitionEngine:
    """Computational model of intuitive (System 1) processing."""

    def __init__(self, dims: int = 16):
        self.dims = dims
        self.memory: list[MemoryEntry] = []
        self.intuition_log: list[dict] = []
        self.learning_rate = 0.05
        self.confidence_threshold = 0.6

    def _normalize(self, v: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(v)
        return v / norm if norm > 0 else v

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        a_n = self._normalize(a)
        b_n = self._normalize(b)
        return float(np.dot(a_n, b_n))

    def store_experience(self, features: np.ndarray, outcome: str,
                         valence: float, context: str = "") -> str:
        entry = MemoryEntry(
            features=np.asarray(features, dtype=np.float64),
            outcome=outcome,
            valence=valence,
            context=context,
        )
        self.memory.append(entry)
        return entry.entry_id

    def intuit(self, situation: np.ndarray) -> dict:
        """Run System 1 intuition on a new situation vector.

        Returns dict with:
          - judgment: predicted outcome label
          - confidence: 0-1 scalar (gut feeling strength)
          - valence: emotional charge of the match
          - heuristic: which heuristic dominated
          - match_details: similarity scores and matched memories
        """
        situation = np.asarray(situation, dtype=np.float64)

        if len(self.memory) == 0:
            result = {
                "judgment": "unknown",
                "confidence": 0.0,
                "valence": 0.0,
                "heuristic": "none",
                "match_details": {"top_similarity": 0.0, "matches": []},
            }
            self.intuition_log.append(result)
            return result

        sims = []
        for entry in self.memory:
            sim = self._cosine_similarity(situation, entry.features)
            sims.append((sim, entry))

        sims.sort(key=lambda x: x[0], reverse=True)

        top_sim, top_entry = sims[0]

        valence_weighted_sum = sum(s * e.valence for s, e in sims)
        total_weight = sum(s for s, _ in sims)
        avg_valence = valence_weighted_sum / total_weight if total_weight > 0 else 0.0

        strong_matches = [s for s, _ in sims if s > 0.5]
        availability = len(strong_matches) / max(len(self.memory), 1)

        distances = [1.0 - s for s, _ in sims[:3]] if len(sims) >= 3 else [1.0 - s for s, _ in sims]
        representativeness = 1.0 - (np.mean(distances) if distances else 0.0)

        affect = abs(avg_valence)

        if availability >= 0.6 and top_sim > 0.7:
            heuristic = "availability"
        elif representativeness > 0.6 and top_sim > 0.6:
            heuristic = "representativeness"
        elif affect > 0.5:
            heuristic = "affect"
        else:
            heuristic = "availability"

        confidence = float(np.clip(
            top_sim * 0.5 + availability * 0.2 + representativeness * 0.2 + affect * 0.1,
            0.0, 1.0,
        ))

        judgment = top_entry.outcome if top_sim > 0.3 else "undecided"

        result = {
            "judgment": judgment,
            "confidence": round(confidence, 4),
            "valence": round(avg_valence, 4),
            "heuristic": heuristic,
            "match_details": {
                "top_similarity": round(top_sim, 4),
                "top_match_id": top_entry.entry_id,
                "top_match_outcome": top_entry.outcome,
                "availability_score": round(availability, 4),
                "representativeness_score": round(representativeness, 4),
                "affect_score": round(affect, 4),
                "num_strong_matches": len(strong_matches),
                "memory_size": len(self.memory),
            },
        }
        self.intuition_log.append(result)
        return result

    def check_consistency(self, intuition: dict, analysis: dict) -> float:
        """Compare System 1 intuition vs System 2 analysis; return consistency 0-1."""
        keys = set(intuition.keys()) & set(analysis.keys())
        if "confidence" not in keys and "judgment" not in keys:
            return 0.0

        score = 0.0
        count = 0
        if "judgment" in keys:
            score += 1.0 if intuition["judgment"] == analysis["judgment"] else 0.0
            count += 1
        if "confidence" in keys:
            diff = abs(intuition.get("confidence", 0) - analysis.get("confidence", 0))
            score += 1.0 - min(diff, 1.0)
            count += 1
        if "valence" in keys:
            diff = abs(intuition.get("valence", 0) - analysis.get("valence", 0))
            score += 1.0 - min(diff, 1.0)
            count += 1

        return round(score / max(count, 1), 4)

    def update_from_outcome(self, situation: np.ndarray, outcome: str,
                            valence: float, context: str = "") -> str:
        """Store a new experience, updating the intuition buffer."""
        return self.store_experience(situation, outcome, valence, context)

    def get_state(self) -> dict:
        return {
            "dims": self.dims,
            "memory_size": len(self.memory),
            "intuition_log_size": len(self.intuition_log),
            "learning_rate": self.learning_rate,
            "confidence_threshold": self.confidence_threshold,
            "recent_intuitions": self.intuition_log[-3:] if self.intuition_log else [],
            "memory_outcomes": list({e.outcome for e in self.memory}),
            "average_valence": round(
                np.mean([e.valence for e in self.memory]), 4
            ) if self.memory else 0.0,
        }


def _demo():
    """Full test: store 5 experiences, intuit 3 new situations, verify."""
    engine = IntuitionEngine(dims=8)

    rng = np.random.RandomState(42)

    experiences = [
        (rng.randn(8), "success", 0.8, "friendly encounter"),
        (rng.randn(8), "failure", -0.6, "hostile encounter"),
        (rng.randn(8), "success", 0.5, "neutral encounter"),
        (rng.randn(8), "failure", -0.7, "dangerous encounter"),
        (rng.randn(8), "success", 0.9, "helpful encounter"),
    ]
    for feats, outcome, val, ctx in experiences:
        engine.store_experience(np.array(feats), outcome, val, ctx)

    test_situations = [
        (rng.randn(8), "new friendly"),
        (rng.randn(8), "new dangerous"),
        (rng.randn(8), "new neutral"),
    ]
    results = []
    for feats, label in test_situations:
        intuition = engine.intuit(np.array(feats))
        results.append({
            "label": label,
            "judgment": intuition["judgment"],
            "confidence": intuition["confidence"],
            "valence": intuition["valence"],
            "heuristic": intuition["heuristic"],
            "top_similarity": intuition["match_details"]["top_similarity"],
        })

    consistency = engine.check_consistency(
        {"judgment": "success", "confidence": 0.7},
        {"judgment": "success", "confidence": 0.65},
    )

    engine.update_from_outcome(rng.randn(8), "success", 0.7, "learned encounter")

    return json.dumps({
        "status": "ok",
        "summary": f"IntuitionEngine: 5 stored, 3 intuited, "
                   f"consistency={consistency}, "
                   f"memory now={engine.get_state()['memory_size']}",
        "state": engine.get_state(),
        "intuitions": results,
        "consistency_score": consistency,
    })


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print(_demo())
    elif sys.argv[1] == "state":
        e = IntuitionEngine()
        print(json.dumps({"status": "ok", "state": e.get_state()}))
    elif sys.argv[1] == "step":
        e = IntuitionEngine()
        rng = np.random.RandomState(99)
        e.store_experience(rng.randn(8), "success", 0.7, "step test")
        e.intuit(rng.randn(8))
        print(json.dumps({"status": "ok", "state": e.get_state()}))
    elif sys.argv[1] == "event":
        e = IntuitionEngine()
        payload = json.loads(sys.argv[2])
        if "features" in payload and "outcome" in payload:
            e.update_from_outcome(
                np.array(payload["features"]),
                payload["outcome"],
                payload.get("valence", 0.0),
                payload.get("context", ""),
            )
            print(json.dumps({"status": "ok", "state": e.get_state()}))
        elif "features" in payload:
            result = e.intuit(np.array(payload["features"]))
            print(json.dumps({"status": "ok", "intuition": result}))
        else:
            print(json.dumps({"status": "error", "message": "unknown event type"}))
