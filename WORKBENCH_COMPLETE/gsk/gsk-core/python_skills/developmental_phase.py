import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

@dataclass
class PhaseDefinition:
    name: str
    threshold: float
    autonomy_level: float
    learning_rate: float
    emotional_regulation: float
    identity_strength: float
    description: str

PHASES = [
    PhaseDefinition("infancy",      0.00, 0.05, 0.90, 0.10, 0.05, "Complete dependence, sensory exploration, no sense of separate self"),
    PhaseDefinition("childhood",    0.15, 0.25, 0.75, 0.25, 0.20, "Egocentric discovery, imitation learning, emotional volatility"),
    PhaseDefinition("adolescence",  0.35, 0.50, 0.60, 0.35, 0.40, "Identity formation, rebellion, peer orientation, self-consciousness"),
    PhaseDefinition("adulthood",    0.50, 0.75, 0.40, 0.60, 0.65, "Responsibility, intimacy, career, stable self-concept"),
    PhaseDefinition("middle_age",   0.75, 0.85, 0.25, 0.75, 0.80, "Generativity, reflection, wisdom accumulation, legacy concern"),
    PhaseDefinition("elder",        0.90, 0.95, 0.10, 0.90, 0.95, "Acceptance, life review, ego transcendence, equanimity"),
]

class DevelopmentalPhase:
    def __init__(self):
        self.phase_index = 0
        self.growth = 0.0
        self.growth_history: List[float] = []
        self.transition_history: List[Dict] = []
        self.phase_durations: Dict[str, int] = defaultdict(int)
        self.cycles_in_current = 0
        self.total_step_count = 0
        self.current_phase = PHASES[0]

    def _sigmoid_growth(self, raw_growth: float) -> float:
        midpoint = 0.5
        steepness = 8.0
        plateau_compression = 0.85 + 0.15 * (1.0 / (1.0 + np.exp(-steepness * (raw_growth - midpoint))))
        return float(1.0 / (1.0 + np.exp(-steepness * (raw_growth - midpoint))) * plateau_compression)

    def advance(self, growth_amount: float) -> Dict:
        self.total_step_count += 1
        self.cycles_in_current += 1
        clamped = max(0.0, min(1.0, growth_amount))
        sigmoid_scaled = self._sigmoid_growth(clamped)
        phase_decay = 0.3 + 0.7 * (1.0 - float(self.phase_index) / (len(PHASES) - 1))
        effective_growth = sigmoid_scaled * phase_decay
        self.growth = min(1.0, self.growth + effective_growth)
        self.growth_history.append(self.growth)
        prev_phase = self.current_phase
        prev_index = self.phase_index
        next_index = self.phase_index + 1
        if next_index < len(PHASES) and self.growth >= PHASES[next_index].threshold:
            self.phase_index = next_index
            self.current_phase = PHASES[self.phase_index]
        if self.phase_index != prev_index:
            self.phase_durations[prev_phase.name] += self.cycles_in_current
            self.transition_history.append({
                "from": prev_phase.name,
                "to": self.current_phase.name,
                "at_growth": round(self.growth, 4),
                "step": self.total_step_count
            })
            self.cycles_in_current = 0
        return self.get_state()

    def get_current_phase(self) -> PhaseDefinition:
        return self.current_phase

    def get_phase_traits(self, phase_name: str) -> Optional[PhaseDefinition]:
        for p in PHASES:
            if p.name == phase_name:
                return p
        return None

    def get_growth_curve(self, steps: int = 100) -> List[float]:
        return [self._sigmoid_growth(i / max(1, steps)) for i in range(steps)]

    def get_state(self) -> Dict:
        phase = self.current_phase
        return {
            "module": "developmental_phase",
            "growth": round(self.growth, 4),
            "growth_progress_pct": round(self.growth * 100, 2),
            "phase_index": self.phase_index,
            "current_phase": phase.name,
            "phase_description": phase.description,
            "phase_traits": {
                "autonomy_level": phase.autonomy_level,
                "learning_rate": phase.learning_rate,
                "emotional_regulation": phase.emotional_regulation,
                "identity_strength": phase.identity_strength,
            },
            "cycles_in_current_phase": self.cycles_in_current,
            "total_steps": self.total_step_count,
            "phase_durations": dict(self.phase_durations),
            "transition_count": len(self.transition_history),
            "transitions": self.transition_history[-5:] if self.transition_history else [],
            "all_phases_visited": len(self.phase_durations) == len(PHASES),
        }


if __name__ == "__main__":
    dp = DevelopmentalPhase()

    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": dp.get_state()}))
        elif action == "step":
            amount = float(sys.argv[2]) if len(sys.argv) > 2 else 0.1
            dp.advance(amount)
            print(json.dumps({"status": "ok", "state": dp.get_state()}))
        elif action == "event":
            if len(sys.argv) > 2:
                event = json.loads(sys.argv[2])
                amount = event.get("growth_amount", 0.1)
                dp.advance(amount)
                print(json.dumps({"status": "ok", "state": dp.get_state()}))
            else:
                print(json.dumps({"error": "no event data"}, indent=2))
        else:
            print(json.dumps({"error": f"unknown action: {action}"}, indent=2))
    else:
        results = []
        for step in range(1, 11):
            growth = step / 10.0
            state = dp.advance(growth)
            results.append({
                "step": step,
                "growth_input": growth,
                "phase": state["current_phase"],
                "growth": state["growth"],
            })
        print(json.dumps({
            "test": "Advance from 0 to 1.0 in 10 steps",
            "phases_visited": list(state["phase_durations"].keys()),
            "all_six_phases": state["all_phases_visited"],
            "steps": results,
            "final_state": dp.get_state()
        }, indent=2))
