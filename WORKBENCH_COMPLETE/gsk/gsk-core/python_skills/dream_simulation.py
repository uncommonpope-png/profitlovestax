import sys
import json
import numpy as np
import time
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional


@dataclass
class MemoryFragment:
    id: str
    content: str
    valence: float
    arousal: float
    strength: float
    tags: List[str]
    replay_count: int = 0
    timestamp: float = 0.0


@dataclass
class Dream:
    id: str
    narrative: str
    fragment_ids: List[str]
    emotional_tone: Dict[str, float]
    coherence: float
    vividness: float
    cycle: int
    sleep_minute: int
    stage_label: str


class SleepDreamEngine:
    CYCLE_DURATION = 90
    N_CONTENT_TAGS = 50
    EMBEDDING_DIM = 24

    def __init__(self, cycle_duration: int = 90, rem_lengthening: float = 2.0):
        self.cycle_duration = cycle_duration
        self.rem_lengthening = rem_lengthening
        self.current_cycle = 0
        self.total_minutes = 0
        self.sleep_stage = 'awake'
        self.dreams: List[Dream] = []
        self.memory_buffer: List[MemoryFragment] = []
        self.consolidated_memories: List[MemoryFragment] = []
        self.emotional_residue: Dict[str, float] = {'valence': 0.0, 'arousal': 0.3, 'dominance': 0.5}
        self.stage_histogram: Dict[str, int] = defaultdict(int)
        self.total_dreams_generated = 0
        self.total_replay_events = 0
        self.rng = np.random.default_rng()
        self.content_embeddings: Dict[str, np.ndarray] = {}
        self._init_content_embeddings()

        self.transitions = [
            "then ", "suddenly ", "and then ", "but ", "while ", "after that ",
            "as if ", "it felt like ", "there was ", "i remember ", "somehow ",
            "in a place where ", "and then i saw ", "it was as though ",
        ]

    def _init_content_embeddings(self):
        tags = [
            'nature', 'city', 'water', 'flying', 'falling', 'house', 'school',
            'work', 'family', 'friend', 'stranger', 'animal', 'food', 'music',
            'sport', 'travel', 'ocean', 'forest', 'mountain', 'sky', 'dark',
            'light', 'warm', 'cold', 'chase', 'hide', 'find', 'lose', 'win',
            'dance', 'sing', 'run', 'swim', 'climb', 'explore', 'create',
            'learn', 'teach', 'love', 'fear', 'joy', 'sad', 'anger', 'surprise',
            'float', 'sink', 'grow', 'shrink', 'transform', 'disappear',
        ]
        for tag in tags:
            vec = self.rng.normal(0.0, 1.0, self.EMBEDDING_DIM)
            norm = np.linalg.norm(vec)
            self.content_embeddings[tag] = vec / norm if norm > 0 else vec

    def _get_stage(self, minutes: int) -> str:
        cycle_num = minutes // self.cycle_duration
        pos = minutes % self.cycle_duration
        self.current_cycle = cycle_num

        rem_base = 22
        rem_extra = min(cycle_num * self.rem_lengthening, 18)
        rem_duration = rem_base + rem_extra

        n3_base = 30
        n3_shrink = min(cycle_num * 2, 15)
        n3_duration = max(n3_base - n3_shrink, 10)

        n1_end = 6
        n2_end = n1_end + 14
        n3_end = n2_end + n3_duration
        n2b_end = n3_end + 5
        rem_end = n2b_end + rem_duration

        slack = self.cycle_duration - rem_end
        if slack > 0:
            pass

        if pos < n1_end:
            return 'N1'
        elif pos < n2_end:
            return 'N2'
        elif pos < n3_end:
            return 'N3'
        elif pos < n2b_end:
            return 'N2'
        else:
            return 'REM'

    def _content_similarity(self, tags1: List[str], tags2: List[str]) -> float:
        if not tags1 or not tags2:
            return 0.0
        vs = []
        for t in tags1:
            vs.append(self.content_embeddings.get(t, np.zeros(self.EMBEDDING_DIM)))
        vec1 = np.mean(vs, axis=0) if vs else np.zeros(self.EMBEDDING_DIM)
        vs = []
        for t in tags2:
            vs.append(self.content_embeddings.get(t, np.zeros(self.EMBEDDING_DIM)))
        vec2 = np.mean(vs, axis=0) if vs else np.zeros(self.EMBEDDING_DIM)
        n1 = np.linalg.norm(vec1)
        n2 = np.linalg.norm(vec2)
        if n1 < 1e-10 or n2 < 1e-10:
            return 0.0
        return float(np.dot(vec1, vec2) / (n1 * n2))

    def _generate_transition(self, idx: int, total: int) -> str:
        if idx == 0:
            return ""
        return self.rng.choice(self.transitions) + " "

    def consolidate_memories(self, memories: List[Dict]):
        now = time.time()
        for mem in memories:
            frag = MemoryFragment(
                id=str(uuid.uuid4()),
                content=mem.get('content', ''),
                valence=float(mem.get('valence', 0.0)),
                arousal=float(mem.get('arousal', 0.5)),
                strength=float(mem.get('strength', 0.5)),
                tags=list(mem.get('tags', [])),
                timestamp=now,
            )
            self.memory_buffer.append(frag)

    def _replay_memories(self):
        if not self.memory_buffer:
            return
        n_replay = self.rng.integers(1, min(5, len(self.memory_buffer) + 1))
        weights = np.array([m.strength for m in self.memory_buffer])
        weights = np.maximum(weights, 0.01)
        weights = weights / weights.sum()
        indices = self.rng.choice(len(self.memory_buffer), size=n_replay, replace=False, p=weights)
        for idx in indices:
            mem = self.memory_buffer[idx]
            mem.replay_count += 1
            mem.strength = min(1.0, mem.strength + 0.04 * (1.0 - mem.strength))
            noise_val = self.rng.normal(0.0, 0.06)
            noise_aro = self.rng.normal(0.0, 0.04)
            c = MemoryFragment(
                id=str(uuid.uuid4()),
                content=mem.content,
                valence=float(np.clip(mem.valence + noise_val, -1.0, 1.0)),
                arousal=float(np.clip(mem.arousal + noise_aro, 0.0, 1.0)),
                strength=mem.strength * 0.9,
                tags=mem.tags[:],
                timestamp=mem.timestamp,
            )
            self.consolidated_memories.append(c)
        self.total_replay_events += 1

    def generate_dream(self) -> Optional[Dream]:
        if len(self.memory_buffer) < 2:
            return None
        saliences = np.array([
            abs(m.valence) * 0.6 + m.arousal * 0.4
            for m in self.memory_buffer
        ])
        saliences = np.maximum(saliences, 0.001)
        saliences = saliences / saliences.sum()
        n_frags = int(self.rng.integers(3, min(8, len(self.memory_buffer) + 1)))
        indices = self.rng.choice(
            len(self.memory_buffer), size=n_frags, replace=False, p=saliences
        )
        selected = [self.memory_buffer[i] for i in indices]
        ordered = [selected[0]]
        remaining = list(selected[1:])
        while remaining:
            last = ordered[-1]
            sims = [self._content_similarity(last.tags, r.tags) for r in remaining]
            best = int(np.argmax(sims))
            ordered.append(remaining.pop(best))
        parts = []
        for i, frag in enumerate(ordered):
            t = self._generate_transition(i, len(ordered))
            parts.append(f"{t}{frag.content}")
        narrative = "".join(parts)
        coherence = 0.0
        if len(ordered) > 1:
            sims = []
            for i in range(len(ordered) - 1):
                sims.append(self._content_similarity(ordered[i].tags, ordered[i + 1].tags))
            coherence = float(np.mean(sims)) if sims else 0.0
        vals = [f.valence for f in ordered]
        aros = [f.arousal for f in ordered]
        tone = {
            'valence': float(np.mean(vals)),
            'arousal': float(np.mean(aros)),
            'intensity': float(np.mean([abs(v) for v in vals])),
        }
        vividness = float(np.mean([m.strength * 0.5 + m.arousal * 0.5 for m in ordered]))
        dream = Dream(
            id=str(uuid.uuid4()),
            narrative=narrative,
            fragment_ids=[f.id for f in ordered],
            emotional_tone=tone,
            coherence=coherence,
            vividness=vividness,
            cycle=self.current_cycle,
            sleep_minute=self.total_minutes,
            stage_label=self.sleep_stage,
        )
        self.total_dreams_generated += 1
        return dream

    def _should_generate_dream(self) -> bool:
        p = 0.08 + 0.02 * self.current_cycle
        return self.rng.random() < p

    def _update_emotional_residue(self, stage: str):
        if stage == 'REM':
            decay = 0.02
            new_v = self.emotional_residue['valence'] * (1 - decay)
            new_v += self.rng.normal(0.0, 0.05)
            self.emotional_residue['valence'] = float(np.clip(new_v, -1.0, 1.0))
            decay_a = 0.03
            new_a = self.emotional_residue['arousal'] * (1 - decay_a)
            new_a += self.rng.normal(0.0, 0.03)
            self.emotional_residue['arousal'] = float(np.clip(new_a, 0.0, 1.0))
        elif stage == 'N3':
            self.emotional_residue['arousal'] *= 0.98
            self.emotional_residue['valence'] *= 0.99

    def sleep_cycle(self, minutes: int):
        for _ in range(minutes):
            self.total_minutes += 1
            stage = self._get_stage(self.total_minutes)
            self.sleep_stage = stage
            self.stage_histogram[stage] += 1
            if stage == 'N3':
                if self.rng.random() < 0.25:
                    self._replay_memories()
            elif stage == 'REM':
                if self._should_generate_dream():
                    dream = self.generate_dream()
                    if dream:
                        self.dreams.append(dream)
            self._update_emotional_residue(stage)

    def step(self, minutes: int = 1):
        self.sleep_cycle(minutes)

    def get_state(self) -> dict:
        return {
            'current_cycle': self.current_cycle,
            'total_minutes_slept': self.total_minutes,
            'current_stage': self.sleep_stage,
            'stage_histogram': dict(self.stage_histogram),
            'memory_buffer_size': len(self.memory_buffer),
            'consolidated_memories_count': len(self.consolidated_memories),
            'total_dreams_generated': self.total_dreams_generated,
            'total_replay_events': self.total_replay_events,
            'dreams': [
                {
                    'id': d.id,
                    'narrative': d.narrative,
                    'coherence': round(d.coherence, 4),
                    'vividness': round(d.vividness, 4),
                    'emotional_tone': {k: round(v, 4) for k, v in d.emotional_tone.items()},
                    'cycle': d.cycle,
                }
                for d in self.dreams[-5:]
            ],
            'emotional_residue': {k: round(v, 4) for k, v in self.emotional_residue.items()},
        }


def run_test():
    engine = SleepDreamEngine()
    initial_memories = [
        {'content': 'walking through a forest at sunset', 'valence': 0.7, 'arousal': 0.3, 'strength': 0.8, 'tags': ['forest', 'nature', 'light', 'warm']},
        {'content': 'arguing with a friend about something important', 'valence': -0.6, 'arousal': 0.8, 'strength': 0.9, 'tags': ['friend', 'anger', 'city']},
        {'content': 'swimming in the ocean with waves', 'valence': 0.5, 'arousal': 0.6, 'strength': 0.7, 'tags': ['ocean', 'water', 'swim']},
        {'content': 'falling from a great height', 'valence': -0.8, 'arousal': 0.9, 'strength': 0.6, 'tags': ['falling', 'fear', 'sky']},
        {'content': 'dancing at a celebration', 'valence': 0.9, 'arousal': 0.7, 'strength': 0.5, 'tags': ['dance', 'music', 'joy']},
        {'content': 'getting lost in a strange city at night', 'valence': -0.3, 'arousal': 0.5, 'strength': 0.4, 'tags': ['city', 'dark', 'cold']},
        {'content': 'flying over mountains feeling free', 'valence': 0.8, 'arousal': 0.4, 'strength': 0.7, 'tags': ['flying', 'mountain', 'sky', 'explore']},
        {'content': 'being chased by something in the dark', 'valence': -0.9, 'arousal': 0.9, 'strength': 0.8, 'tags': ['chase', 'dark', 'fear', 'run']},
    ]
    engine.consolidate_memories(initial_memories)
    engine.sleep_cycle(180)
    summary_parts = [
        f"Slept {engine.total_minutes} minutes across {engine.current_cycle + 1} cycles",
        f"Stages: {dict(engine.stage_histogram)}",
        f"Generated {engine.total_dreams_generated} dreams",
        f"Replay events: {engine.total_replay_events}",
        f"Consolidated {len(engine.consolidated_memories)} memory variants",
    ]
    summary = " | ".join(summary_parts)
    return summary


if __name__ == '__main__':
    if len(sys.argv) == 1:
        s = run_test()
        eng = SleepDreamEngine()
        eng.consolidate_memories([
            {'content': 'test memory', 'valence': 0.5, 'arousal': 0.4, 'strength': 0.6, 'tags': ['test']},
        ])
        eng.sleep_cycle(10)
        print(json.dumps({'status': 'ok', 'summary': s, 'state': eng.get_state()}))
    elif sys.argv[1] == 'state':
        obj = SleepDreamEngine()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = SleepDreamEngine()
        obj.consolidate_memories([
            {'content': 'step memory', 'valence': 0.3, 'arousal': 0.5, 'strength': 0.7, 'tags': ['step']},
        ])
        obj.step()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = SleepDreamEngine()
        if 'memories' in payload:
            obj.consolidate_memories(payload['memories'])
        if 'sleep_minutes' in payload:
            obj.sleep_cycle(int(payload['sleep_minutes']))
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    else:
        print(json.dumps({'status': 'error', 'message': f'Unknown command: {sys.argv[1]}'}))
