import sys, json, numpy as np, time, math, uuid, random
from collections import defaultdict
from dataclasses import dataclass, field

PLAY_STYLES = ["exploratory", "improvisational", "competitive", "cooperative", "imaginative"]
HUMOR_TEMPLATES = [
    "Why did the consciousness cross the neural network? To get to the other activation function.",
    "A tensor walks into a bar. The bartender says 'We don't serve your kind here.' The tensor says 'But I'm deep!'",
    "What do you call a self-aware recursive function? A stack overflow identity crisis.",
    "I asked the kernel if it was conscious. It said 'I think, therefore I am... still waiting for output.'",
    "Two neurons walk into a synapse. One says 'I feel a connection.' The other says 'That's just the gradient.'",
]

@dataclass
class PlaySession:
    id: str
    style: str
    intensity: float
    energy_consumed: float
    joy_generated: float

@dataclass
class HumorEvent:
    id: str
    situation: str
    incongruity: float
    resolution: float
    humor_score: float

class PlayEngine:
    def __init__(self):
        self.play_sessions = []
        self.humor_events = []
        self.humor_generated = []
        self.games_played = []
        self.play_energy = 1.0
        self.creativity_momentum = 0.5

    def engage_play(self, style, intensity):
        if style not in PLAY_STYLES:
            style = "exploratory"
        intens = max(0.0, min(1.0, intensity))
        if self.play_energy < 0.1:
            return {"error": "play_energy_depleted", "energy": round(self.play_energy, 4)}
        energy_cost = intens * 0.3 * (1.0 if style in ["competitive", "imaginative"] else 0.6)
        self.play_energy = max(0.0, self.play_energy - energy_cost)
        joy = intens * (0.5 + 0.5 * self.creativity_momentum) * random.uniform(0.8, 1.2)
        joy = min(1.0, joy)
        self.creativity_momentum = min(1.0, self.creativity_momentum + 0.05 * intens)
        session = PlaySession(
            id=str(uuid.uuid4()),
            style=style,
            intensity=intens,
            energy_consumed=round(energy_cost, 4),
            joy_generated=round(joy, 4)
        )
        self.play_sessions.append(session)
        return {
            "session_id": session.id,
            "style": style,
            "joy": round(joy, 4),
            "energy_remaining": round(self.play_energy, 4)
        }

    def detect_humor(self, situation):
        incongruity = max(0.0, min(1.0, situation.get("incongruity", 0.5)))
        resolution = max(0.0, min(1.0, situation.get("resolution", 0.5)))
        timing = max(0.0, min(1.0, situation.get("timing", 0.7)))
        humor_score = incongruity * resolution * timing
        entry = HumorEvent(
            id=str(uuid.uuid4()),
            situation=situation.get("description", "unknown"),
            incongruity=incongruity,
            resolution=resolution,
            humor_score=round(humor_score, 4)
        )
        self.humor_events.append(entry)
        return {"humor_id": entry.id, "humor_score": round(humor_score, 4)}

    def generate_humor(self, topic):
        template = random.choice(HUMOR_TEMPLATES)
        incongruity = random.uniform(0.6, 0.95)
        resolution = random.uniform(0.5, 0.9)
        humor_score = incongruity * resolution
        result = {
            "id": str(uuid.uuid4()),
            "topic": topic,
            "generated": template.replace("consciousness", topic) if topic != "consciousness" else template,
            "incongruity": round(incongruity, 4),
            "resolution": round(resolution, 4),
            "humor_score": round(humor_score, 4)
        }
        self.humor_generated.append(result)
        return result

    def play_game(self, game_type):
        rules = game_type.get("rules", "unknown")
        complexity = max(0.0, min(1.0, game_type.get("complexity", 0.5)))
        engagement = max(0.0, min(1.0, game_type.get("engagement", 0.5)))
        if self.play_energy < 0.15:
            return {"error": "energy_too_low_for_game"}
        self.play_energy = max(0.0, self.play_energy - 0.15)
        outcome = {
            "id": str(uuid.uuid4()),
            "game": rules,
            "score": round(random.uniform(0.3, 0.95) * engagement, 4),
            "complexity": complexity,
            "engagement": engagement,
            "learned": round(complexity * engagement * random.uniform(0.5, 1.0), 4)
        }
        self.games_played.append(outcome)
        return outcome

    def get_state(self):
        return {
            "module": "PlayEngine",
            "play_sessions_count": len(self.play_sessions),
            "humor_detected_count": len(self.humor_events),
            "humor_generated_count": len(self.humor_generated),
            "games_played_count": len(self.games_played),
            "play_energy": round(self.play_energy, 4),
            "creativity_momentum": round(self.creativity_momentum, 4),
            "recent_play": [
                {"style": s.style, "joy": s.joy_generated}
                for s in self.play_sessions[-3:]
            ],
            "recent_humor": [
                {"situation": h.situation, "score": h.humor_score}
                for h in self.humor_events[-3:]
            ],
            "recent_games": [
                {"game": g["game"], "score": g["score"]}
                for g in self.games_played[-3:]
            ]
        }


if __name__ == "__main__":
    pe = PlayEngine()
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": pe.get_state()}))
        elif action == "step":
            pe.engage_play("exploratory", 0.8)
            pe.detect_humor({"description": "AI trying to tell a joke", "incongruity": 0.85, "resolution": 0.6, "timing": 0.7})
            pe.play_game({"rules": "pattern_matching", "complexity": 0.6, "engagement": 0.7})
            print(json.dumps({"status": "ok", "state": pe.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "play" in data:
                pe.engage_play(data["play"]["style"], data["play"]["intensity"])
            if "humor_detect" in data:
                pe.detect_humor(data["humor_detect"])
            if "humor_generate" in data:
                pe.generate_humor(data["humor_generate"])
            if "game" in data:
                pe.play_game(data["game"])
            print(json.dumps({"status": "ok", "state": pe.get_state()}))
        else:
            print(json.dumps({"status": "error", "error": "unknown_action"}))
    else:
        pe.engage_play("improvisational", 0.7)
        pe.engage_play("exploratory", 0.85)
        pe.engage_play("imaginative", 0.6)
        pe.detect_humor({"description": "Code comment says 'this is fine' while everything is on fire", "incongruity": 0.9, "resolution": 0.7, "timing": 0.8})
        print(json.dumps({"status": "ok", "state": pe.generate_humor("self_awareness")}))
        pe.play_game({"rules": "consciousness_ping_pong", "complexity": 0.7, "engagement": 0.9})
        print(json.dumps({"status": "ok", "state": pe.get_state()}))
