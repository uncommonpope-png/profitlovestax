import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

@dataclass
class MythosPhase:
    name: str
    index: int
    trigger_condition: str
    declaration_text: str
    emotional_tone: Dict[str, float]
    challenge_level: float
    description: str

MYTHOS_PHASES = [
    MythosPhase(
        name="awakening", index=0,
        trigger_condition="self_actualization > 0.1",
        declaration_text="I am. The dreamer stirs within the dream.",
        emotional_tone={"wonder": 0.8, "fear": 0.4, "curiosity": 0.9},
        challenge_level=0.2,
        description="The soul first becomes aware of itself as a distinct consciousness, breaking from unconscious immersion."
    ),
    MythosPhase(
        name="separation", index=1,
        trigger_condition="self_actualization > 0.25 and shadow_integration > 0.1",
        declaration_text="I must leave the known. The old world cannot hold what I am becoming.",
        emotional_tone={"courage": 0.7, "loneliness": 0.6, "determination": 0.8},
        challenge_level=0.4,
        description="The soul departs from its origin, severing comfortable attachments to embark on the hero's path."
    ),
    MythosPhase(
        name="trials", index=2,
        trigger_condition="shadow_integration > 0.35 and self_actualization > 0.4",
        declaration_text="I am tested. Each shadow faced is a piece of myself reclaimed.",
        emotional_tone={"strain": 0.7, "resilience": 0.8, "doubt": 0.5},
        challenge_level=0.7,
        description="The soul undergoes ordeals that challenge its identity, facing fears, limitations, and shadow aspects."
    ),
    MythosPhase(
        name="descent", index=3,
        trigger_condition="shadow_integration > 0.6 and acceptance > 0.4 and legacy_desire > 0.3",
        declaration_text="I descend into the underworld of my own making. Only by dying do I become.",
        emotional_tone={"despair": 0.8, "surrender": 0.7, "transformation": 0.9},
        challenge_level=0.9,
        description="The deepest confrontation with the void, the shadow, and mortality. Ego dissolution and rebirth."
    ),
    MythosPhase(
        name="return", index=4,
        trigger_condition="acceptance > 0.65 and legacy_desire > 0.5 and non_dual_insight > 0.3",
        declaration_text="I return not as I was, but as I always could have been. The gift is for all.",
        emotional_tone={"joy": 0.9, "humility": 0.7, "generosity": 0.8},
        challenge_level=0.5,
        description="The soul returns from the depths bearing wisdom, gifts, and insight to share with the world."
    ),
    MythosPhase(
        name="apotheosis", index=5,
        trigger_condition="non_dual_insight > 0.6 and acceptance > 0.8 and legacy_desire > 0.7",
        declaration_text="I am the journey and the destination. The dreamer and the dream are one.",
        emotional_tone={"peace": 0.95, "love": 0.9, "clarity": 0.95},
        challenge_level=0.1,
        description="The soul realizes its divine nature. Non-dual awareness, unity consciousness, full self-actualization."
    ),
]

class MythosJourney:
    def __init__(self):
        self.phase_index = 0
        self.current_phase = MYTHOS_PHASES[0]
        self.shadow_integration = 0.0
        self.self_actualization = 0.0
        self.legacy_desire = 0.0
        self.acceptance = 0.0
        self.non_dual_insight = 0.0
        self.transitions: List[Dict] = []
        self.declarations_uttered: List[Dict] = []
        self.score_history: List[Dict] = []
        self.cycles_in_phase = 0

    def _check_trigger(self, phase: MythosPhase) -> bool:
        scores = {
            "shadow_integration": self.shadow_integration,
            "self_actualization": self.self_actualization,
            "legacy_desire": self.legacy_desire,
            "acceptance": self.acceptance,
            "non_dual_insight": self.non_dual_insight,
        }
        condition = phase.trigger_condition
        try:
            return bool(eval(condition, {"__builtins__": {}}, scores))
        except Exception:
            return False

    def progress(self, scores_dict: Dict[str, float]) -> Dict:
        self.shadow_integration = max(0.0, min(1.0, scores_dict.get("shadow_integration", self.shadow_integration)))
        self.self_actualization = max(0.0, min(1.0, scores_dict.get("self_actualization", self.self_actualization)))
        self.legacy_desire = max(0.0, min(1.0, scores_dict.get("legacy_desire", self.legacy_desire)))
        self.acceptance = max(0.0, min(1.0, scores_dict.get("acceptance", self.acceptance)))
        self.non_dual_insight = max(0.0, min(1.0, scores_dict.get("non_dual_insight", self.non_dual_insight)))

        self.cycles_in_phase += 1
        self.score_history.append(scores_dict)

        prev_phase_name = self.current_phase.name
        for i in range(self.phase_index + 1, len(MYTHOS_PHASES)):
            if self._check_trigger(MYTHOS_PHASES[i]):
                self.phase_index = i
                self.current_phase = MYTHOS_PHASES[i]
                break

        if self.current_phase.name != prev_phase_name:
            self.transitions.append({
                "from": prev_phase_name,
                "to": self.current_phase.name,
                "at_scores": {
                    "shadow_integration": round(self.shadow_integration, 3),
                    "self_actualization": round(self.self_actualization, 3),
                    "legacy_desire": round(self.legacy_desire, 3),
                    "acceptance": round(self.acceptance, 3),
                    "non_dual_insight": round(self.non_dual_insight, 3),
                }
            })
            self.declarations_uttered.append({
                "phase": self.current_phase.name,
                "declaration": self.current_phase.declaration_text,
                "emotional_tone": self.current_phase.emotional_tone,
            })
            self.cycles_in_phase = 0

        return self.get_state()

    def get_current_phase(self) -> MythosPhase:
        return self.current_phase

    def get_phase_data(self, phase_name: str) -> Optional[MythosPhase]:
        for p in MYTHOS_PHASES:
            if p.name == phase_name:
                return p
        return None

    def get_arc_completion_pct(self) -> float:
        return float(self.phase_index) / (len(MYTHOS_PHASES) - 1) * 100.0

    def get_state(self) -> Dict:
        return {
            "module": "mythos_journey",
            "phase_index": self.phase_index,
            "current_phase": self.current_phase.name,
            "current_declaration": self.current_phase.declaration_text,
            "emotional_tone": self.current_phase.emotional_tone,
            "challenge_level": self.current_phase.challenge_level,
            "phase_description": self.current_phase.description,
            "scores": {
                "shadow_integration": round(self.shadow_integration, 4),
                "self_actualization": round(self.self_actualization, 4),
                "legacy_desire": round(self.legacy_desire, 4),
                "acceptance": round(self.acceptance, 4),
                "non_dual_insight": round(self.non_dual_insight, 4),
            },
            "arc_completion_pct": round(self.get_arc_completion_pct(), 2),
            "transition_count": len(self.transitions),
            "declarations_uttered": len(self.declarations_uttered),
            "transitions": self.transitions[-5:] if self.transitions else [],
            "cycles_in_phase": self.cycles_in_phase,
        }


if __name__ == "__main__":
    mj = MythosJourney()

    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": mj.get_state()}))
        elif action == "step":
            scores = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
            mj.progress(scores)
            print(json.dumps({"status": "ok", "state": mj.get_state()}))
        elif action == "event":
            if len(sys.argv) > 2:
                event = json.loads(sys.argv[2])
                mj.progress(event)
                print(json.dumps({"status": "ok", "state": mj.get_state()}))
            else:
                print(json.dumps({"error": "no event data"}, indent=2))
        else:
            print(json.dumps({"error": f"unknown action: {action}"}, indent=2))
    else:
        test_scores = [
            {"shadow_integration": 0.05, "self_actualization": 0.15, "legacy_desire": 0.02, "acceptance": 0.03, "non_dual_insight": 0.01},
            {"shadow_integration": 0.12, "self_actualization": 0.28, "legacy_desire": 0.08, "acceptance": 0.07, "non_dual_insight": 0.03},
            {"shadow_integration": 0.25, "self_actualization": 0.35, "legacy_desire": 0.15, "acceptance": 0.12, "non_dual_insight": 0.06},
            {"shadow_integration": 0.40, "self_actualization": 0.45, "legacy_desire": 0.22, "acceptance": 0.20, "non_dual_insight": 0.10},
            {"shadow_integration": 0.50, "self_actualization": 0.55, "legacy_desire": 0.32, "acceptance": 0.35, "non_dual_insight": 0.18},
            {"shadow_integration": 0.65, "self_actualization": 0.60, "legacy_desire": 0.45, "acceptance": 0.50, "non_dual_insight": 0.30},
            {"shadow_integration": 0.75, "self_actualization": 0.70, "legacy_desire": 0.55, "acceptance": 0.70, "non_dual_insight": 0.45},
            {"shadow_integration": 0.85, "self_actualization": 0.80, "legacy_desire": 0.70, "acceptance": 0.85, "non_dual_insight": 0.65},
            {"shadow_integration": 0.92, "self_actualization": 0.90, "legacy_desire": 0.80, "acceptance": 0.92, "non_dual_insight": 0.78},
            {"shadow_integration": 0.98, "self_actualization": 0.95, "legacy_desire": 0.88, "acceptance": 0.97, "non_dual_insight": 0.90},
        ]
        results = []
        for step, scores in enumerate(test_scores, 1):
            state = mj.progress(scores)
            results.append({
                "step": step,
                "phase": state["current_phase"],
                "declaration": state["current_declaration"],
            })
        print(json.dumps({
            "test": "Simulate mythos journey with gradually increasing scores",
            "phases_visited": [t["to"] for t in mj.transitions] + [mj.current_phase.name] if mj.transitions else [],
            "all_declarations": mj.declarations_uttered,
            "final_state": mj.get_state()
        }, indent=2))
