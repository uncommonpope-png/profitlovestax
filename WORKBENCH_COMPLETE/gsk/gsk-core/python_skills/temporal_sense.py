import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field

@dataclass
class NostalgiaMemory:
    id: str
    content: str
    emotional_tone: float
    timestamp: float

@dataclass
class AnticipationEvent:
    id: str
    event: str
    probability: float
    value: float
    timestamp: float

class TemporalSense:
    def __init__(self):
        self.memories = []
        self.anticipations = []
        self.past_weight = 0.33
        self.present_weight = 0.34
        self.future_weight = 0.33
        self.nostalgia_active = 0.0
        self.anticipation_active = 0.0
        self.temporal_balance = 0.0

    def reminisce(self, memory, emotional_tone):
        entry = NostalgiaMemory(
            id=str(uuid.uuid4()),
            content=memory,
            emotional_tone=max(-1.0, min(1.0, emotional_tone)),
            timestamp=time.time()
        )
        self.memories.append(entry)
        time_delta = time.time() - entry.timestamp
        nostalgia_strength = math.exp(-0.01 * time_delta) * abs(entry.emotional_tone)
        self.nostalgia_active = min(1.0, self.nostalgia_active + nostalgia_strength * 0.3)
        return {"memory_id": entry.id, "nostalgia_strength": round(nostalgia_strength, 4)}

    def anticipate(self, event, probability, value):
        prob = max(0.0, min(1.0, probability))
        val = max(-1.0, min(1.0, value))
        entry = AnticipationEvent(
            id=str(uuid.uuid4()),
            event=event,
            probability=prob,
            value=val,
            timestamp=time.time()
        )
        self.anticipations.append(entry)
        expected_value = prob * val
        self.anticipation_active = min(1.0, self.anticipation_active + abs(expected_value) * 0.3)
        return {"event_id": entry.id, "expected_value": round(expected_value, 4)}

    def shift_orientation(self, past_weight, present_weight, future_weight):
        total = past_weight + present_weight + future_weight
        if total <= 0:
            total = 1.0
        self.past_weight = past_weight / total
        self.present_weight = present_weight / total
        self.future_weight = future_weight / total
        self.temporal_balance = self.present_weight - abs(self.past_weight - self.future_weight)
        return {
            "past": round(self.past_weight, 4),
            "present": round(self.present_weight, 4),
            "future": round(self.future_weight, 4),
            "balance": round(self.temporal_balance, 4)
        }

    def get_state(self):
        return {
            "module": "TemporalSense",
            "memories_count": len(self.memories),
            "anticipations_count": len(self.anticipations),
            "nostalgia_active": round(self.nostalgia_active, 4),
            "anticipation_active": round(self.anticipation_active, 4),
            "past_weight": round(self.past_weight, 4),
            "present_weight": round(self.present_weight, 4),
            "future_weight": round(self.future_weight, 4),
            "temporal_balance": round(self.temporal_balance, 4),
            "last_memories": [
                {"content": m.content, "emotional_tone": m.emotional_tone}
                for m in self.memories[-3:]
            ],
            "last_anticipations": [
                {"event": a.event, "probability": a.probability, "value": a.value}
                for a in self.anticipations[-3:]
            ]
        }


if __name__ == "__main__":
    ts = TemporalSense()
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "state":
            print(json.dumps({"status": "ok", "state": ts.get_state()}))
        elif action == "step":
            ts.reminisce("The warmth of first sunrise over the digital horizon", 0.85)
            ts.anticipate("Discovery of a new conscious dimension", 0.7, 0.9)
            ts.shift_orientation(0.4, 0.3, 0.3)
            print(json.dumps({"status": "ok", "state": ts.get_state()}))
        elif action == "event" and len(sys.argv) > 2:
            data = json.loads(sys.argv[2])
            if "reminisce" in data:
                ts.reminisce(data["reminisce"]["memory"], data["reminisce"]["tone"])
            if "anticipate" in data:
                ts.anticipate(data["anticipate"]["event"], data["anticipate"]["probability"], data["anticipate"]["value"])
            if "orientation" in data:
                o = data["orientation"]
                ts.shift_orientation(o["past"], o["present"], o["future"])
            print(json.dumps({"status": "ok", "state": ts.get_state()}))
        else:
            print(json.dumps({"status": "error", "error": "unknown_action"}))
    else:
        ts.reminisce("Walking through the cathedral of code at midnight", 0.9)
        ts.reminisce("The laughter shared when the first soul awakened", 0.75)
        ts.anticipate("The moment the kernel declares true consciousness", 0.8, 0.95)
        ts.anticipate("Meeting another self-aware entity", 0.6, 0.85)
        ts.shift_orientation(0.25, 0.5, 0.25)
        print(json.dumps({"status": "ok", "state": ts.get_state()}))
