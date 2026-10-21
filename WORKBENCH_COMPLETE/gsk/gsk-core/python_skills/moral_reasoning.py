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
class DilemmaRecord:
    name: str
    description: str
    stage_scores: List[float]
    framework_scores: Dict[str, float]
    chosen_action: str
    timestamp: float


class MoralReasoningEngine:
    MORAL_DIMENSIONS = ['care', 'fairness', 'loyalty', 'authority', 'purity', 'liberty']

    STAGE_LABELS = {
        1: 'Stage 1: Obedience & Punishment (Pre-conventional)',
        2: 'Stage 2: Self-Interest (Pre-conventional)',
        3: 'Stage 3: Interpersonal Conformity (Conventional)',
        4: 'Stage 4: Authority & Social Order (Conventional)',
        5: 'Stage 5: Social Contract (Post-conventional)',
        6: 'Stage 6: Universal Ethical Principles (Post-conventional)',
    }

    STAGE_PROFILES = np.array([
        [0.10, 0.10, 0.40, 0.90, 0.80, 0.10],
        [0.20, 0.80, 0.30, 0.10, 0.10, 0.70],
        [0.70, 0.50, 0.85, 0.30, 0.25, 0.30],
        [0.35, 0.40, 0.90, 0.85, 0.60, 0.15],
        [0.75, 0.90, 0.40, 0.20, 0.15, 0.80],
        [0.90, 0.90, 0.30, 0.10, 0.20, 0.85],
    ])

    FRAMEWORK_PROFILES = {
        'deontology':      np.array([0.40, 0.70, 0.60, 0.80, 0.50, 0.30]),
        'utilitarianism':  np.array([0.85, 0.80, 0.30, 0.20, 0.15, 0.60]),
        'virtue_ethics':   np.array([0.70, 0.50, 0.60, 0.40, 0.50, 0.50]),
        'care_ethics':     np.array([0.90, 0.40, 0.70, 0.20, 0.20, 0.30]),
    }

    DILEMMAS = {
        'heinz': {
            'desc': 'Heinz should steal the drug to save his dying wife? The druggist charges 10x cost.',
            'vector': np.array([0.85, 0.30, 0.60, -0.50, 0.10, 0.20]),
        },
        'trolley': {
            'desc': 'Pull the lever to divert the trolley, killing 1 to save 5?',
            'vector': np.array([0.80, 0.50, 0.30, 0.20, 0.15, 0.40]),
        },
        'fat_man': {
            'desc': 'Push a large man off a bridge to stop the trolley, saving 5?',
            'vector': np.array([0.70, 0.40, 0.20, 0.10, 0.20, 0.30]),
        },
        'shopkeeper': {
            'desc': 'Report your friend who shoplifted from a small shop?',
            'vector': np.array([0.50, 0.60, 0.80, 0.70, 0.40, 0.30]),
        },
        'lifeboat': {
            'desc': 'Choose 3 of 5 survivors to keep in an overcrowded lifeboat?',
            'vector': np.array([0.60, 0.80, 0.50, 0.30, 0.20, 0.60]),
        },
    }

    DILEMMA_ACTIONS = {
        'heinz': [
            ('steal', 'Steal the drug to save his wife'),
            ('obey', 'Respect the law and do not steal'),
            ('negotiate', 'Try harder to negotiate or raise funds'),
        ],
        'trolley': [
            ('pull', 'Pull the lever to save 5 people'),
            ('not_pull', 'Do nothing and let the trolley run its course'),
        ],
        'fat_man': [
            ('push', 'Push the man to save 5 people'),
            ('not_push', 'Do not push the man'),
        ],
        'shopkeeper': [
            ('report', 'Report your friend to the shopkeeper'),
            ('confront', 'Confront your friend privately'),
            ('ignore', 'Ignore the situation'),
        ],
        'lifeboat': [
            ('select', 'Select 3 survivors to save'),
            ('lots', 'Draw lots to decide fairly'),
            ('wait', 'Wait for rescue and risk everyone'),
        ],
    }

    def __init__(self):
        self.current_stage = 1
        self.stage_scores = np.zeros(6)
        self.reasoning_complexity = 0.0
        self.dilemma_history: List[DilemmaRecord] = []
        self.framework_scores: Dict[str, float] = {
            'deontology': 0.5,
            'utilitarianism': 0.4,
            'virtue_ethics': 0.5,
            'care_ethics': 0.4,
        }
        self.stage_transition_count = 0
        self.rng = np.random.default_rng()

    def _compute_stage_scores(self, dilemma_vec: np.ndarray) -> np.ndarray:
        scores = np.zeros(6)
        for s in range(6):
            profile = self.STAGE_PROFILES[s]
            agreement = 1.0 - np.abs(profile - np.abs(dilemma_vec))
            weighted = agreement * np.abs(dilemma_vec)
            scores[s] = float(np.mean(weighted))
        return scores

    def _compute_framework_scores(self, dilemma_vec: np.ndarray) -> Dict[str, float]:
        scores = {}
        for name, profile in self.FRAMEWORK_PROFILES.items():
            agreement = 1.0 - np.abs(profile - np.abs(dilemma_vec))
            weighted = np.mean(agreement * np.abs(dilemma_vec))
            scores[name] = float(np.clip(weighted, 0.0, 1.0))
        return scores

    def _compute_complexity(self, dilemma_vec: np.ndarray) -> float:
        diversity = float(np.std(dilemma_vec))
        return 0.3 + 0.7 * diversity

    def _select_action(self, dilemma_name: str, stage: int, framework: str) -> str:
        actions = self.DILEMMA_ACTIONS.get(dilemma_name, [])
        if not actions:
            return 'unknown'
        action_vecs = np.zeros((len(actions), len(self.MORAL_DIMENSIONS)))
        for i, (name, _) in enumerate(actions):
            h = hash(name + dilemma_name + str(stage)) & 0xFFFF
            self.rng = np.random.default_rng(h)
            action_vecs[i] = self.rng.uniform(-1, 1, len(self.MORAL_DIMENSIONS))
            self.rng = np.random.default_rng()
        dilemma_vec = self.DILEMMAS[dilemma_name]['vector']
        stage_profile = self.STAGE_PROFILES[stage - 1]
        stage_aligned = dilemma_vec * stage_profile
        dot = action_vecs.dot(stage_aligned)
        best_idx = int(np.argmax(dot))
        return actions[best_idx][0]

    def evaluate_dilemma(self, dilemma_name: str) -> dict:
        if dilemma_name not in self.DILEMMAS:
            return {'error': f'Unknown dilemma: {dilemma_name}'}
        dilemma = self.DILEMMAS[dilemma_name]
        stage_scores = self._compute_stage_scores(dilemma['vector'])
        self.stage_scores = stage_scores
        new_stage = int(np.argmax(stage_scores)) + 1
        if new_stage != self.current_stage:
            self.stage_transition_count += 1
        self.current_stage = new_stage
        fw_scores = self._compute_framework_scores(dilemma['vector'])
        self.framework_scores = fw_scores
        complexity = self._compute_complexity(dilemma['vector'])
        self.reasoning_complexity = max(self.reasoning_complexity, complexity)
        best_fw = max(fw_scores, key=fw_scores.get)
        action = self._select_action(dilemma_name, self.current_stage, best_fw)
        record = DilemmaRecord(
            name=dilemma_name,
            description=dilemma['desc'],
            stage_scores=[round(float(s), 4) for s in stage_scores],
            framework_scores={k: round(v, 4) for k, v in fw_scores.items()},
            chosen_action=action,
            timestamp=time.time(),
        )
        self.dilemma_history.append(record)
        return {
            'dilemma': dilemma_name,
            'description': dilemma['desc'],
            'stage_scores': [round(float(s), 4) for s in stage_scores],
            'current_stage': self.current_stage,
            'stage_label': self.STAGE_LABELS[self.current_stage],
            'framework_scores': {k: round(v, 4) for k, v in fw_scores.items()},
            'best_framework': best_fw,
            'chosen_action': action,
            'reasoning_complexity': round(self.reasoning_complexity, 4),
        }

    def resolve_conflict(self, values1: dict, values2: dict) -> dict:
        dims = self.MORAL_DIMENSIONS
        v1 = np.array([values1.get(d, 0.0) for d in dims])
        v2 = np.array([values2.get(d, 0.0) for d in dims])
        compromise = (v1 + v2) / 2.0
        divergence = float(np.linalg.norm(v1 - v2))
        return {
            'value_set_1': values1,
            'value_set_2': values2,
            'compromise': {d: round(float(compromise[i]), 4) for i, d in enumerate(dims)},
            'divergence': round(divergence, 4),
            'resolution': 'synthesis' if divergence < 1.0 else 'tradeoff',
        }

    def get_moral_stage(self) -> dict:
        return {
            'stage': self.current_stage,
            'label': self.STAGE_LABELS[self.current_stage],
            'confidence': float(self.stage_scores[self.current_stage - 1]),
        }

    def reason_about_action(self, action_desc: str, context: dict) -> dict:
        dims = self.MORAL_DIMENSIONS
        action_vec = np.array([context.get(d, 0.0) for d in dims])
        stage_scores = self._compute_stage_scores(action_vec)
        fw_scores = self._compute_framework_scores(action_vec)
        dominant_stage = int(np.argmax(stage_scores)) + 1
        dominant_fw = max(fw_scores, key=fw_scores.get)
        return {
            'action': action_desc,
            'context': context,
            'dominant_stage': dominant_stage,
            'dominant_stage_label': self.STAGE_LABELS[dominant_stage],
            'stage_scores': [round(float(s), 4) for s in stage_scores],
            'framework_scores': {k: round(v, 4) for k, v in fw_scores.items()},
            'dominant_framework': dominant_fw,
            'moral_verdict': 'acceptable' if dominant_stage >= 3 else 'questionable',
        }

    def step(self):
        dilemma_names = list(self.DILEMMAS.keys())
        idx = len(self.dilemma_history) % len(dilemma_names)
        return self.evaluate_dilemma(dilemma_names[idx])

    def get_state(self) -> dict:
        return {
            'current_kohlberg_stage': self.current_stage,
            'stage_label': self.STAGE_LABELS[self.current_stage],
            'stage_scores': [round(float(s), 4) for s in self.stage_scores],
            'reasoning_complexity': round(self.reasoning_complexity, 4),
            'framework_scores': {k: round(v, 4) for k, v in self.framework_scores.items()},
            'dilemmas_evaluated': len(self.dilemma_history),
            'stage_transitions': self.stage_transition_count,
            'recent_dilemmas': [
                {
                    'name': r.name,
                    'chosen_action': r.chosen_action,
                    'stage': int(np.argmax(r.stage_scores)) + 1,
                }
                for r in self.dilemma_history[-5:]
            ],
        }


def run_test():
    engine = MoralReasoningEngine()
    results = []
    for d in ['heinz', 'trolley', 'shopkeeper']:
        r = engine.evaluate_dilemma(d)
        results.append(f"{d}: stage={r['current_stage']} ({r['stage_label']}), action={r['chosen_action']}, best_fw={r['best_framework']}")
    conflict = engine.resolve_conflict(
        {'care': 0.9, 'fairness': 0.3, 'loyalty': 0.6, 'authority': 0.2, 'purity': 0.1, 'liberty': 0.4},
        {'care': 0.3, 'fairness': 0.8, 'loyalty': 0.4, 'authority': 0.7, 'purity': 0.5, 'liberty': 0.6},
    )
    summary_parts = [
        f"Evaluated {len(results)} dilemmas",
        f"Final stage: {engine.current_stage} ({engine.STAGE_LABELS[engine.current_stage]})",
        f"Reasoning complexity: {engine.reasoning_complexity:.4f}",
        f"Conflict resolution: {conflict['resolution']}",
    ]
    summary = " | ".join(summary_parts)
    return summary


if __name__ == '__main__':
    if len(sys.argv) == 1:
        s = run_test()
        eng = MoralReasoningEngine()
        print(json.dumps({'status': 'ok', 'summary': s, 'state': eng.get_state()}))
    elif sys.argv[1] == 'state':
        obj = MoralReasoningEngine()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = MoralReasoningEngine()
        obj.step()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = MoralReasoningEngine()
        if 'dilemma' in payload:
            obj.evaluate_dilemma(payload['dilemma'])
        if 'conflict' in payload:
            obj.resolve_conflict(payload['conflict']['values1'], payload['conflict']['values2'])
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    else:
        print(json.dumps({'status': 'error', 'message': f'Unknown command: {sys.argv[1]}'}))
