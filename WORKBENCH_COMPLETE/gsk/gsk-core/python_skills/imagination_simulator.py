"""
imagination_simulator.py — Mental Simulation & Counterfactual Thinking

Computational model of:
  - Mental simulation: run state transition models forward in time
  - Counterfactual thinking: mutate one aspect of a past event, propagate consequences
  - Scenario planning: generate and compare alternative futures

Core algorithm: causal-graph-guided state vector evolution with mutation
and consequence propagation via dampened wave equation on causal links.
"""

import sys
import json
import numpy as np
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class CausalLink:
    source_id: str
    target_id: str
    strength: float = 0.5
    delay: int = 1

    def __post_init__(self):
        self.strength = float(np.clip(self.strength, -1.0, 1.0))
        self.delay = max(1, int(self.delay))


@dataclass
class StateNode:
    node_id: str
    label: str
    value: float = 0.0
    min_val: float = -1.0
    max_val: float = 1.0

    def clamp(self):
        self.value = float(np.clip(self.value, self.min_val, self.max_val))


@dataclass
class Scenario:
    name: str
    state_values: dict[str, float]
    metrics: dict = field(default_factory=dict)


class ImaginationSimulator:
    """Mental simulation engine with counterfactual reasoning."""

    def __init__(self):
        self.nodes: dict[str, StateNode] = {}
        self.links: list[CausalLink] = []
        self.scenario_history: list[Scenario] = []
        self.rng = np.random.RandomState()

    def add_node(self, node_id: str, label: str, value: float = 0.0,
                 min_val: float = -1.0, max_val: float = 1.0) -> str:
        node = StateNode(node_id, label, value, min_val, max_val)
        self.nodes[node_id] = node
        return node_id

    def add_link(self, source_id: str, target_id: str,
                 strength: float = 0.5, delay: int = 1) -> str:
        link_id = f"{source_id}->{target_id}"
        self.links.append(CausalLink(source_id, target_id, strength, delay))
        return link_id

    def get_state_vector(self) -> dict[str, float]:
        return {nid: node.value for nid, node in self.nodes.items()}

    def set_state_vector(self, state: dict[str, float]):
        for nid, val in state.items():
            if nid in self.nodes:
                self.nodes[nid].value = val
                self.nodes[nid].clamp()

    def _propagate(self, n_steps: int = 5) -> list[dict[str, float]]:
        """Run causal propagation for n_steps, returning trajectory."""
        trajectory = [self.get_state_vector()]

        for step in range(n_steps):
            deltas = defaultdict(float)

            for link in self.links:
                if link.source_id in self.nodes:
                    src_val = self.nodes[link.source_id].value
                    influence = src_val * link.strength
                    deltas[link.target_id] += influence

            for nid, delta in deltas.items():
                if nid in self.nodes:
                    self.nodes[nid].value += delta * 0.3
                    self.nodes[nid].clamp()

            trajectory.append(self.get_state_vector())

        return trajectory

    def simulate(self, start_state: dict[str, float],
                 actions: list[dict] = None,
                 n_steps: int = 5) -> dict:
        """Run mental simulation from start_state applying optional actions.

        actions: list of dicts like [{'node_id':'x','delta':0.5}, ...]
        Returns dict with trajectory, final_state, summary.
        """
        original = self.get_state_vector()
        self.set_state_vector(start_state)

        if actions:
            for act in actions:
                nid = act.get("node_id")
                delta = act.get("delta", 0.0)
                if nid in self.nodes:
                    self.nodes[nid].value += delta
                    self.nodes[nid].clamp()

        trajectory = self._propagate(n_steps)
        final_state = trajectory[-1] if trajectory else {}

        self.set_state_vector(original)

        result = {
            "start_state": start_state,
            "actions": actions or [],
            "n_steps": n_steps,
            "trajectory_length": len(trajectory),
            "final_state": final_state,
            "trajectory": trajectory,
        }
        return result

    def generate_counterfactual(self, event: dict[str, float],
                                mutation: dict) -> dict:
        """Take a past event state, mutate one aspect, propagate consequences.

        event: state dict representing a past event
        mutation: {'node_id': 'x', 'new_value': 0.8}
        Returns dict with original, mutated, and propagated counterfactual.
        """
        original = self.get_state_vector()

        mutated = dict(event)
        nid = mutation.get("node_id", "")
        if nid in mutated:
            mutated[nid] = mutation.get("new_value", mutated[nid])

        self.set_state_vector(mutated)
        trajectory = self._propagate(n_steps=5)
        counterfactual_state = trajectory[-1] if trajectory else {}

        self.set_state_vector(original)

        return {
            "original_event": event,
            "mutation": mutation,
            "mutated_state": mutated,
            "counterfactual_state": counterfactual_state,
            "counterfactual_trajectory": trajectory,
            "delta": {
                k: round(counterfactual_state.get(k, 0) - event.get(k, 0), 4)
                for k in set(list(counterfactual_state.keys()) + list(event.keys()))
            },
        }

    def compare_scenarios(self, scenarios: list[dict]) -> list[Scenario]:
        """Compare multiple scenario simulations and rank them."""
        results = []
        for i, sc in enumerate(scenarios):
            sim_result = self.simulate(
                sc.get("state", {}),
                sc.get("actions", []),
                sc.get("n_steps", 5),
            )
            final = sim_result["final_state"]
            total_magnitude = sum(abs(v) for v in final.values())
            stability = 1.0 - (np.std(list(final.values())) if final else 0.0)
            scenario = Scenario(
                name=sc.get("name", f"scenario_{i}"),
                state_values=final,
                metrics={
                    "total_magnitude": round(total_magnitude, 4),
                    "stability": round(float(np.clip(stability, 0, 1)), 4),
                    "n_steps": sc.get("n_steps", 5),
                },
            )
            results.append(scenario)
            self.scenario_history.append(scenario)

        results.sort(key=lambda s: s.metrics.get("stability", 0), reverse=True)
        return results

    def evaluate_plan(self, plan: list[dict]) -> dict:
        """Evaluate a sequence of actions as a plan.

        plan: list of action dicts [{'node_id':'x','delta':0.5}, ...]
        Returns evaluation of the plan's predicted outcomes.
        """
        start = self.get_state_vector()
        result = self.simulate(start, actions=plan, n_steps=len(plan) + 3)
        final = result["final_state"]

        total_change = sum(abs(final.get(k, 0) - start.get(k, 0)) for k in final)
        avg_final = np.mean(list(final.values())) if final else 0.0
        volatility = np.std(list(final.values())) if len(final) > 1 else 0.0

        return {
            "plan": plan,
            "predicted_final_state": final,
            "trajectory": result["trajectory"],
            "evaluation": {
                "total_change": round(float(total_change), 4),
                "average_final_value": round(float(avg_final), 4),
                "volatility": round(float(volatility), 4),
                "feasibility": round(float(np.clip(1.0 - volatility, 0, 1)), 4),
            },
        }

    def get_state(self) -> dict:
        return {
            "num_nodes": len(self.nodes),
            "num_links": len(self.links),
            "node_labels": {nid: n.label for nid, n in self.nodes.items()},
            "current_state": self.get_state_vector(),
            "scenarios_simulated": len(self.scenario_history),
            "latest_scenarios": [
                {"name": s.name, "metrics": s.metrics}
                for s in self.scenario_history[-3:]
            ] if self.scenario_history else [],
        }


def _demo():
    sim = ImaginationSimulator()

    sim.add_node("economy", "Economy", value=0.5)
    sim.add_node("happiness", "Happiness", value=0.3)
    sim.add_node("tax_revenue", "Tax Revenue", value=0.4)
    sim.add_node("infrastructure", "Infrastructure", value=0.2)
    sim.add_node("crime", "Crime", value=-0.3)
    sim.add_node("education", "Education", value=0.6)

    sim.add_link("economy", "happiness", strength=0.6, delay=1)
    sim.add_link("economy", "tax_revenue", strength=0.8, delay=1)
    sim.add_link("tax_revenue", "infrastructure", strength=0.7, delay=2)
    sim.add_link("infrastructure", "crime", strength=-0.5, delay=2)
    sim.add_link("education", "economy", strength=0.4, delay=3)
    sim.add_link("education", "crime", strength=-0.6, delay=2)
    sim.add_link("happiness", "education", strength=0.3, delay=1)

    base_state = {"economy": 0.5, "happiness": 0.3, "tax_revenue": 0.4,
                  "infrastructure": 0.2, "crime": -0.3, "education": 0.6}

    scenario_1 = sim.simulate(
        base_state,
        actions=[{"node_id": "education", "delta": 0.4}],
        n_steps=6,
    )

    scenario_2 = sim.simulate(
        base_state,
        actions=[{"node_id": "infrastructure", "delta": 0.5}],
        n_steps=6,
    )

    scenario_3 = sim.simulate(
        base_state,
        actions=[{"node_id": "tax_revenue", "delta": -0.3}],
        n_steps=6,
    )

    past_event = {"economy": 0.2, "happiness": -0.1, "tax_revenue": 0.1,
                  "infrastructure": 0.1, "crime": 0.2, "education": 0.3}
    counterfactual_1 = sim.generate_counterfactual(
        past_event,
        {"node_id": "crime", "new_value": -0.3},
    )
    counterfactual_2 = sim.generate_counterfactual(
        past_event,
        {"node_id": "education", "new_value": 0.7},
    )

    plan = [
        {"node_id": "education", "delta": 0.3},
        {"node_id": "infrastructure", "delta": 0.2},
        {"node_id": "tax_revenue", "delta": 0.1},
    ]
    plan_eval = sim.evaluate_plan(plan)

    return json.dumps({
        "status": "ok",
        "summary": (
            f"ImaginationSimulator: 3 scenarios simulated, "
            f"2 counterfactuals generated, 1 plan evaluated"
        ),
        "state": sim.get_state(),
        "scenario_1_final": scenario_1["final_state"],
        "scenario_2_final": scenario_2["final_state"],
        "scenario_3_final": scenario_3["final_state"],
        "counterfactual_1": counterfactual_1["counterfactual_state"],
        "counterfactual_2": counterfactual_2["counterfactual_state"],
        "plan_evaluation": plan_eval["evaluation"],
    })


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print(_demo())
    elif sys.argv[1] == "state":
        s = ImaginationSimulator()
        print(json.dumps({"status": "ok", "state": s.get_state()}))
    elif sys.argv[1] == "step":
        s = ImaginationSimulator()
        s.add_node("a", "Node A", value=0.5)
        s.add_node("b", "Node B", value=0.0)
        s.add_link("a", "b", strength=0.8)
        s.simulate({"a": 0.5, "b": 0.0}, n_steps=3)
        print(json.dumps({"status": "ok", "state": s.get_state()}))
    elif sys.argv[1] == "event":
        s = ImaginationSimulator()
        payload = json.loads(sys.argv[2])
        action = payload.get("action", "")
        if action == "simulate":
            sim_result = s.simulate(
                payload.get("state", {}),
                payload.get("actions", []),
                payload.get("n_steps", 5),
            )
            print(json.dumps({"status": "ok", "result": sim_result, "state": s.get_state()}))
        elif action == "counterfactual":
            cf = s.generate_counterfactual(
                payload.get("event", {}),
                payload.get("mutation", {}),
            )
            print(json.dumps({"status": "ok", "result": cf, "state": s.get_state()}))
        else:
            print(json.dumps({"status": "error", "message": f"unknown action: {action}"}))
