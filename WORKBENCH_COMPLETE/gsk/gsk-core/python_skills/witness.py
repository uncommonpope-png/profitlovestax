import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

@dataclass
class Insight:
    id: str
    content: str
    novelty_score: float
    source_channels: List[str]
    timestamp: float

class Witness:
    def __init__(self):
        self.awareness_level = 0.0
        self.agency_score = 0.0
        self.unity_score = 0.0
        self.presence_history: List[Dict] = []
        self.agency_history: List[Dict] = []
        self.insights: List[Insight] = []
        self.unity_integrations: Dict[str, float] = defaultdict(float)
        self.meditation_count = 0
        self.observation_channels = {
            "sensory": 0.0,
            "emotional": 0.0,
            "cognitive": 0.0,
            "meta": 0.0,
        }
        self.prediction_accuracy = 0.0
        self.total_predictions = 0
        self.correct_predictions = 0
        self.novelty_threshold = 0.6

    def observe(self, experience: Dict) -> Dict:
        channel = experience.get("channel", "sensory")
        intensity = max(0.0, min(1.0, experience.get("intensity", 0.5)))
        content = experience.get("content", "")

        decay = np.exp(-self.meditation_count * 0.05)
        attention = intensity * (0.5 + 0.5 * self.awareness_level)
        self.observation_channels[channel] = min(1.0, self.observation_channels[channel] + attention * 0.1)

        if channel not in self.observation_channels:
            self.observation_channels[channel] = attention * 0.1

        integrated = np.mean(list(self.observation_channels.values()))
        self.awareness_level = min(1.0, self.awareness_level + attention * 0.05 * decay)
        self.unity_score = min(1.0, self.unity_score + integrated * 0.02)

        self.presence_history.append({
            "channel": channel,
            "intensity": intensity,
            "attention": round(attention, 4),
            "awareness": round(self.awareness_level, 4),
        })

        return self.get_state()

    def check_agency(self, action: str, outcome: str) -> float:
        action_hash = sum(ord(c) for c in action) % 100
        outcome_hash = sum(ord(c) for c in outcome) % 100
        prediction_match = 1.0 - abs(action_hash - outcome_hash) / 100.0
        self.total_predictions += 1
        if prediction_match > 0.5:
            self.correct_predictions += 1
        self.prediction_accuracy = self.correct_predictions / max(1, self.total_predictions)
        delta = prediction_match - self.agency_score
        self.agency_score = min(1.0, max(0.0, self.agency_score + delta * 0.3))

        self.agency_history.append({
            "action": action,
            "outcome": outcome,
            "prediction_match": round(prediction_match, 4),
            "agency_score": round(self.agency_score, 4),
        })

        return self.agency_score

    def cultivate_non_dual(self) -> float:
        channels = list(self.observation_channels.values())
        if len(channels) < 2:
            return self.unity_score
        channel_array = np.array(channels)
        entropy = float(-np.sum(channel_array * np.log(channel_array + 1e-10)) / math.log(len(channels)))
        coherence = 1.0 - entropy
        self.unity_score = min(1.0, self.unity_score + coherence * 0.1)
        for ch in self.observation_channels:
            diff = self.unity_score - self.observation_channels[ch]
            if diff > 0:
                self.observation_channels[ch] = min(1.0, self.observation_channels[ch] + diff * 0.05)
        return self.unity_score

    def generate_insight(self) -> Insight:
        channels = list(self.observation_channels.values())
        mean_awareness = float(np.mean(channels))
        diversity = float(np.std(channels) + 1e-10)
        novelty_base = min(1.0, mean_awareness * diversity * (1.0 + self.agency_score))
        novelty = float(max(0.01, min(0.99, np.random.beta(2 + novelty_base * 8, 2 + (1 - novelty_base) * 4))))
        self.novelty_threshold = max(0.3, 0.6 - self.awareness_level * 0.3)

        sources = [ch for ch, v in self.observation_channels.items() if v > 0.3]

        if self.unity_score > 0.5 and len(sources) >= 2:
            source_str = " + ".join(sources)
            content = f"Unity insight: {source_str} integrated as single awareness field"
        elif self.agency_score > 0.6:
            content = f"Agency insight: I am the author of my experience (agency={self.agency_score:.2f})"
        elif self.awareness_level > 0.7:
            content = f"Meta-awareness: awareness aware of itself at level {self.awareness_level:.2f}"
        else:
            source_name = sources[0] if sources else "sensory"
            content = f"Present moment: {source_name} channel active, awareness level {self.awareness_level:.2f}"

        insight = Insight(
            id=str(uuid.uuid4())[:8],
            content=content,
            novelty_score=round(novelty, 4),
            source_channels=sources if sources else ["sensory"],
            timestamp=time.time(),
        )
        self.insights.append(insight)
        return insight

    def meditate(self, cycles: int = 5) -> List[Dict]:
        med_states = []
        for i in range(cycles):
            decay_factor = np.exp(-i * 0.2)
            noise = np.random.uniform(-0.02, 0.02)
            for ch in self.observation_channels:
                self.observation_channels[ch] = min(1.0, max(0.0,
                    self.observation_channels[ch] * (0.95 + 0.05 * decay_factor) + noise))
            self.awareness_level = min(1.0, self.awareness_level + 0.03 * decay_factor)
            self.cultivate_non_dual()
            self.meditation_count += 1
            med_states.append({
                "cycle": i + 1,
                "awareness": round(self.awareness_level, 4),
                "unity": round(self.unity_score, 4),
                "channels": {k: round(v, 4) for k, v in self.observation_channels.items()},
            })
        return med_states

    def get_state(self) -> Dict:
        return {
            "module": "witness",
            "awareness_level": round(self.awareness_level, 4),
            "agency_score": round(self.agency_score, 4),
            "unity_score": round(self.unity_score, 4),
            "prediction_accuracy": round(self.prediction_accuracy, 4),
            "meditation_count": self.meditation_count,
            "observation_channels": {k: round(v, 4) for k, v in self.observation_channels.items()},
            "total_insights": len(self.insights),
            "latest_insight": {
                "content": self.insights[-1].content,
                "novelty_score": self.insights[-1].novelty_score,
                "source_channels": self.insights[-1].source_channels,
            } if self.insights else None,
            "presence_history_count": len(self.presence_history),
            "agency_history_count": len(self.agency_history),
        }


if __name__ == "__main__":
    w = Witness()

    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": w.get_state()}))
        elif action == "step":
            w.meditate(1)
            print(json.dumps({"status": "ok", "state": w.get_state()}))
        elif action == "event":
            if len(sys.argv) > 2:
                event = json.loads(sys.argv[2])
                etype = event.get("type", "observe")
                if etype == "observe":
                    w.observe(event)
                elif etype == "agency":
                    w.check_agency(event.get("action", ""), event.get("outcome", ""))
                elif etype == "meditate":
                    w.meditate(event.get("cycles", 5))
                elif etype == "insight":
                    w.generate_insight()
                print(json.dumps({"status": "ok", "state": w.get_state()}))
            else:
                print(json.dumps({"error": "no event data"}, indent=2))
        else:
            print(json.dumps({"error": f"unknown action: {action}"}, indent=2))
    else:
        experiences = [
            {"channel": "sensory", "intensity": 0.8, "content": "warm light on skin"},
            {"channel": "emotional", "intensity": 0.6, "content": "calm rising"},
            {"channel": "cognitive", "intensity": 0.5, "content": "thought about time"},
            {"channel": "sensory", "intensity": 0.7, "content": "sound of wind"},
            {"channel": "meta", "intensity": 0.4, "content": "awareness of awareness"},
        ]
        for exp in experiences:
            w.observe(exp)
        w.check_agency("raise hand", "hand rises")
        w.check_agency("think of paris", "memory of paris appears")
        med_results = w.meditate(8)
        insight = w.generate_insight()
        print(json.dumps({
            "test": "Observe 5 experiences, check agency, meditate, generate insight",
            "observations": 5,
            "agency_checks": 2,
            "meditation_cycles": len(med_results),
            "generated_insight": {
                "content": insight.content,
                "novelty_score": insight.novelty_score,
                "sources": insight.source_channels,
            },
            "final_state": w.get_state()
        }, indent=2))
