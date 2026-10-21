import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Optional

DIMENSION_NAMES = ['energy', 'tension', 'temperature', 'heart_rate', 'breathing', 'posture', 'balance']

@dataclass
class BodyState:
    energy: float = 0.7
    tension: float = 0.3
    temperature: float = 36.6
    heart_rate: float = 70.0
    breathing: float = 12.0
    posture: float = 0.8
    balance: float = 0.9

    def to_array(self) -> np.ndarray:
        return np.array([self.energy, self.tension, self.temperature,
                         self.heart_rate, self.breathing, self.posture, self.balance])

    @classmethod
    def from_array(cls, arr: np.ndarray) -> 'BodyState':
        return cls(*arr)

    def __repr__(self):
        d = {k: round(getattr(self, k), 3) for k in DIMENSION_NAMES}
        return json.dumps(d)


@dataclass
class EpisodicMemory:
    id: str
    summary: str
    emotion_valence: float
    timestamp: float
    agent_initiated: bool = False


class SelfModel:
    def __init__(self):
        self.proto_self = BodyState()
        self.homeostatic_setpoints = BodyState()
        self.core_self_feeling: float = 0.0
        self.narrative: List[str] = []
        self.episodic_memories: List[EpisodicMemory] = []
        self.agency_buffer: List[Dict] = []
        self.mirror_test_history: List[bool] = []
        self.body_history: List[np.ndarray] = []
        self.step_count: int = 0
        self.self_recognition_score: float = 0.0

    def update_body_state(self, sensory_input: Optional[Dict[str, float]] = None) -> BodyState:
        if sensory_input is None:
            sensory_input = {}
        arr = self.proto_self.to_array()
        noise = np.random.normal(0, 0.02, 7)
        for i, name in enumerate(DIMENSION_NAMES):
            if name in sensory_input:
                arr[i] = sensory_input[name]
        if np.random.random() < 0.01:
            arr[0] = arr[0] * 0.95

        arr = np.clip(arr + noise, 0.0, 1.0 if name != 'temperature' else 42.0)
        self.proto_self = BodyState.from_array(arr)

        setpoint_arr = self.homeostatic_setpoints.to_array()
        deviation = np.linalg.norm(arr - setpoint_arr)
        self.core_self_feeling = float(1.0 / (1.0 + deviation))
        self.body_history.append(arr.copy())
        if len(self.body_history) > 100:
            self.body_history.pop(0)
        return self.proto_self

    def _embed(self, text: str) -> np.ndarray:
        words = text.lower().split()
        vec = np.zeros(50)
        for word in words:
            seed = abs(hash(word)) % (2**31)
            rng = np.random.RandomState(seed)
            word_vec = rng.uniform(-1, 1, 50)
            vec += word_vec
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 1e-10 else vec

    def check_agency(self, action: str, outcome: str) -> float:
        action_vec = self._embed(action)
        outcome_vec = self._embed(outcome)
        action_words = set(action.lower().split())
        outcome_words = set(outcome.lower().split())
        overlap = len(action_words & outcome_words)
        word_overlap = overlap / max(1, len(action_words | outcome_words))
        cosine_sim = float(np.dot(action_vec, outcome_vec))
        if word_overlap == 0.0 and len(outcome_words) > 0:
            cosine_sim = cosine_sim * 0.3
        agency = 0.4 * max(0.0, min(1.0, (cosine_sim + 1.0) / 2.0)) + 0.6 * word_overlap
        agency = max(0.0, min(1.0, agency))
        self.agency_buffer.append({
            'action': action, 'outcome': outcome,
            'agency_score': agency, 'time': time.time()
        })
        if len(self.agency_buffer) > 50:
            self.agency_buffer.pop(0)
        return agency

    def mirror_test(self, self_image: np.ndarray, expected_body: np.ndarray) -> bool:
        diff = np.linalg.norm(self_image - expected_body)
        recognized = diff < 0.3
        self.mirror_test_history.append(recognized)
        recent = self.mirror_test_history[-10:]
        if len(recent) > 0:
            self.self_recognition_score = sum(recent) / len(recent)
        return recognized

    def build_narrative(self, episodes: Optional[List[EpisodicMemory]] = None) -> List[str]:
        if episodes is not None:
            for ep in episodes:
                existing_ids = {m.id for m in self.episodic_memories}
                if ep.id not in existing_ids:
                    self.episodic_memories.append(ep)
        sorted_mem = sorted(self.episodic_memories, key=lambda x: x.timestamp)
        self.narrative = []
        for m in sorted_mem:
            authorship = "I chose to" if m.agent_initiated else "I experienced"
            self.narrative.append(f"{authorship}: {m.summary} (val: {m.emotion_valence:.2f})")
        return self.narrative

    def get_state(self) -> dict:
        return {
            'module': 'self_model',
            'class': 'SelfModel',
            'proto_self': {k: round(getattr(self.proto_self, k), 3) for k in DIMENSION_NAMES},
            'core_self_feeling': round(self.core_self_feeling, 4),
            'homeostatic_setpoints': {k: round(getattr(self.homeostatic_setpoints, k), 3) for k in DIMENSION_NAMES},
            'narrative_length': len(self.narrative),
            'episodic_memory_count': len(self.episodic_memories),
            'agency_buffer_size': len(self.agency_buffer),
            'self_recognition_score': round(self.self_recognition_score, 4),
            'mirror_test_count': len(self.mirror_test_history),
            'step_count': self.step_count,
            'last_narrative': self.narrative[-3:] if self.narrative else []
        }

    def process_event(self, payload: dict) -> dict:
        event_type = payload.get('type', '')
        if event_type == 'sensory_update':
            self.update_body_state(payload.get('sensory_input'))
        elif event_type == 'agency_check':
            self.check_agency(payload.get('action', ''), payload.get('outcome', ''))
        elif event_type == 'mirror_test':
            img = np.array(payload.get('image', [0.5]*7))
            body = np.array(payload.get('expected', [0.5]*7))
            self.mirror_test(img, body)
        elif event_type == 'add_memory':
            mem = EpisodicMemory(
                id=payload.get('id', str(uuid.uuid4())),
                summary=payload.get('summary', ''),
                emotion_valence=payload.get('valence', 0.0),
                timestamp=payload.get('timestamp', time.time()),
                agent_initiated=payload.get('agent_initiated', False)
            )
            self.episodic_memories.append(mem)
            self.build_narrative()
        elif event_type == 'build_narrative':
            self.build_narrative()
        return self.get_state()

    def step(self, sensory_input: Optional[Dict[str, float]] = None) -> dict:
        self.step_count += 1
        self.update_body_state(sensory_input)
        return self.get_state()


def run_tests():
    sm = SelfModel()
    tests_passed = 0
    for i in range(10):
        sm.step({'energy': 0.5 + 0.3*math.sin(i*0.5), 'heart_rate': 65 + 10*math.sin(i*0.3)})
    body = sm.proto_self.to_array()
    agency = sm.check_agency("raise hand", "hand rises")
    assert agency > 0.4, f"Agency too low: {agency}"
    tests_passed += 1
    agency2 = sm.check_agency("jump", "earthquake happens")
    assert agency2 < 0.25, f"False agency too high: {agency2}"
    tests_passed += 1
    mirror_ok = sm.mirror_test(body + np.random.normal(0, 0.05, 7), body)
    img_bad = body + np.array([0.5]*7)
    mirror_bad = sm.mirror_test(img_bad, body)
    assert mirror_ok and not mirror_bad, "Mirror test logic failed"
    tests_passed += 1
    episodes = [
        EpisodicMemory("e1", "Woke up and stretched", 0.6, time.time()-100, True),
        EpisodicMemory("e2", "Felt a cold breeze", -0.2, time.time()-50, False),
        EpisodicMemory("e3", "Solved a puzzle", 0.9, time.time()-10, True),
    ]
    narrative = sm.build_narrative(episodes)
    assert len(narrative) == 3, f"Expected 3 narrative entries, got {len(narrative)}"
    tests_passed += 1
    return {
        'status': 'ok',
        'summary': f'SelfModel tests passed: {tests_passed}/4. Body dims={len(DIMENSION_NAMES)}, memories={len(sm.episodic_memories)}, agency_buffer={len(sm.agency_buffer)}',
        'state': sm.get_state()
    }


if __name__ == '__main__':
    if len(sys.argv) == 1:
        result = run_tests()
        print(json.dumps(result))
    elif sys.argv[1] == 'state':
        obj = SelfModel()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = SelfModel()
        obj.step()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = SelfModel()
        result = obj.process_event(payload)
        print(json.dumps({'status': 'ok', 'state': result}))
