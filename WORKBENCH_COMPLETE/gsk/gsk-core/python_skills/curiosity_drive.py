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
class TopicKnowledge:
    name: str
    known: float
    total: float
    importance: float
    uncertainty: float
    exploration_count: int = 0
    last_explored: float = 0.0
    prediction_errors: List[float] = field(default_factory=list)


@dataclass
class CuriosityQuestion:
    question: str
    topic: str
    information_gap: float
    expected_insight: float


class CuriosityDrive:
    TOPICS = [
        'physics', 'biology', 'consciousness', 'mathematics', 'philosophy',
        'music', 'art', 'language', 'history', 'technology',
        'psychology', 'sociology', 'economics', 'ecology', 'astronomy',
    ]

    QUESTION_TEMPLATES = [
        "What is the relationship between {topic} and {other}?",
        "Why does {topic} behave the way it does?",
        "What would happen if {topic} were different?",
        "How does {topic} emerge from simpler components?",
        "What are the limits of {topic}?",
        "Can {topic} be understood as a form of {other}?",
        "What lies beyond the current understanding of {topic}?",
        "How does {topic} change over time?",
        "What is the purpose of {topic}?",
        "How does {topic} interact with {other}?",
    ]

    def __init__(self, n_topics: int = 10, learning_rate: float = 0.1):
        self.learning_rate = learning_rate
        self.rng = np.random.default_rng()
        self.topics: Dict[str, TopicKnowledge] = {}
        self.questions_generated: List[CuriosityQuestion] = []
        self.exploration_history: List[dict] = []
        self.total_curiosity_score = 0.0
        self.step_count = 0
        self.knowledge_coverage = np.zeros(n_topics)
        self.uncertainty_vector = np.ones(n_topics) * 0.5
        self._init_knowledge(n_topics)

    def _init_knowledge(self, n_topics: int):
        selected = self.rng.choice(self.TOPICS, size=min(n_topics, len(self.TOPICS)), replace=False)
        for name in selected:
            self.topics[name] = TopicKnowledge(
                name=name,
                known=float(self.rng.uniform(0.1, 0.4)),
                total=float(self.rng.uniform(0.5, 0.9)),
                importance=float(self.rng.uniform(0.3, 0.9)),
                uncertainty=float(self.rng.uniform(0.3, 0.8)),
            )
        self._update_vectors()

    def _update_vectors(self):
        names = list(self.topics.keys())
        for i, name in enumerate(names):
            t = self.topics[name]
            self.knowledge_coverage[i] = t.known / max(t.total, 1e-10)
            self.uncertainty_vector[i] = t.uncertainty

    def _topic_index(self, name: str) -> Optional[int]:
        names = list(self.topics.keys())
        return names.index(name) if name in names else None

    def evaluate_information_gap(self, known: float, unknown: float) -> float:
        gap = max(0.0, unknown - known)
        curiosity = gap * (1.0 + 0.5 * (1.0 - math.exp(-gap * 3.0)))
        return float(np.clip(curiosity, 0.0, 2.0))

    def _compute_prediction_error(self, topic_name: str) -> float:
        if topic_name not in self.topics:
            return 0.5
        topic = self.topics[topic_name]
        if not topic.prediction_errors:
            return topic.uncertainty
        recent = topic.prediction_errors[-5:]
        return float(np.mean(recent))

    def generate_curiosity_questions(self, n_questions: int = 5) -> List[str]:
        names = list(self.topics.keys())
        if len(names) < 2:
            return []
        gaps = []
        for name in names:
            t = self.topics[name]
            gap = self.evaluate_information_gap(t.known, t.total)
            gaps.append(gap * t.importance)
        gaps = np.array(gaps)
        probs = np.maximum(gaps, 0.001)
        probs = probs / probs.sum()
        questions = []
        for _ in range(n_questions):
            idx = int(self.rng.choice(len(names), p=probs))
            topic = names[idx]
            others = [n for n in names if n != topic]
            other = str(self.rng.choice(others))
            template = str(self.rng.choice(self.QUESTION_TEMPLATES))
            question_text = template.format(topic=topic, other=other)
            t = self.topics[topic]
            gap = self.evaluate_information_gap(t.known, t.total)
            q = CuriosityQuestion(
                question=question_text,
                topic=topic,
                information_gap=round(gap, 4),
                expected_insight=round(gap * t.importance, 4),
            )
            self.questions_generated.append(q)
            questions.append(question_text)
        return questions

    def select_explore_action(self, actions: List[str], knowledge: Dict[str, float] = None) -> str:
        if knowledge is None:
            knowledge = {}
        best_action = actions[0] if actions else ''
        best_score = -float('inf')
        for action in actions:
            exploration_bonus = 0.0
            for topic_name, topic in self.topics.items():
                if topic_name in action.lower() or topic_name[:4] in action.lower():
                    gap = self.evaluate_information_gap(topic.known, topic.total)
                    exploration_bonus += gap * topic.importance * 0.3
            known_reward = knowledge.get(action, 0.0)
            pred_error = self._compute_prediction_error(action) * 0.2
            score = known_reward + exploration_bonus + pred_error
            if score > best_score:
                best_score = score
                best_action = action
        return best_action

    def _simulate_exploration(self, topic_name: str) -> dict:
        if topic_name not in self.topics:
            return {'error': f'Unknown topic: {topic_name}'}
        topic = self.topics[topic_name]
        base_gain = self.rng.uniform(0.05, 0.25)
        learning = base_gain * (1.0 - topic.known / max(topic.total, 1e-10))
        surprise = self.rng.uniform(-0.05, 0.15)
        new_known = min(topic.total, topic.known + learning)
        new_uncertainty = max(0.05, topic.uncertainty - self.learning_rate * 0.5)
        pred_error = abs(learning - base_gain) + max(0.0, surprise)
        return {
            'topic': topic_name,
            'knowledge_gain': round(float(learning), 4),
            'new_known': round(float(new_known), 4),
            'new_uncertainty': round(float(new_uncertainty), 4),
            'prediction_error': round(float(pred_error), 4),
            'surprise': round(float(surprise), 4),
        }

    def update_from_exploration(self, topic: str, result: dict = None) -> dict:
        if topic not in self.topics:
            return {'error': f'Unknown topic: {topic}'}
        sim_result = self._simulate_exploration(topic) if result is None else result
        t = self.topics[topic]
        if 'new_known' in sim_result:
            t.known = max(0.0, min(t.total, sim_result['new_known']))
        if 'new_uncertainty' in sim_result:
            t.uncertainty = max(0.01, min(1.0, sim_result['new_uncertainty']))
        if 'knowledge_gain' in sim_result and sim_result['knowledge_gain'] > 0.1:
            t.total = min(1.0, t.total + self.rng.uniform(0.0, 0.05))
        if 'prediction_error' in sim_result:
            t.prediction_errors.append(sim_result['prediction_error'])
        t.exploration_count += 1
        t.last_explored = time.time()
        gap = self.evaluate_information_gap(t.known, t.total)
        exploration_record = {
            'topic': topic,
            'timestamp': t.last_explored,
            'gap_after': round(gap, 4),
            'known_after': round(t.known, 4),
            'count': t.exploration_count,
        }
        self.exploration_history.append(exploration_record)
        self._update_vectors()
        return exploration_record

    def step(self):
        self.step_count += 1
        names = list(self.topics.keys())
        gaps = []
        for name in names:
            t = self.topics[name]
            gap = self.evaluate_information_gap(t.known, t.total)
            gaps.append((name, gap * t.importance))
        gaps.sort(key=lambda x: x[1], reverse=True)
        target = gaps[0][0] if gaps else names[0]
        if self.rng.random() < 0.3:
            target = str(self.rng.choice(names))
        result = self.update_from_exploration(target)
        questions = self.generate_curiosity_questions(2)
        self._update_vectors()
        return {
            'step': self.step_count,
            'explored': target,
            'knowledge_gain': result.get('knowledge_gain', 0),
            'curiosity_questions': questions,
        }

    def get_state(self) -> dict:
        return {
            'n_topics': len(self.topics),
            'step_count': self.step_count,
            'total_curiosity_score': round(self.total_curiosity_score, 4),
            'knowledge_coverage_mean': round(float(np.mean(self.knowledge_coverage)), 4),
            'uncertainty_mean': round(float(np.mean(self.uncertainty_vector)), 4),
            'exploration_count': len(self.exploration_history),
            'questions_generated': len(self.questions_generated),
            'topics': {
                name: {
                    'known': round(t.known, 4),
                    'total': round(t.total, 4),
                    'importance': round(t.importance, 4),
                    'uncertainty': round(t.uncertainty, 4),
                    'exploration_count': t.exploration_count,
                    'information_gap': round(self.evaluate_information_gap(t.known, t.total), 4),
                }
                for name, t in self.topics.items()
            },
            'recent_explorations': self.exploration_history[-5:],
        }


def run_test():
    engine = CuriosityDrive(n_topics=8)
    gaps = []
    for name, topic in engine.topics.items():
        gap = engine.evaluate_information_gap(topic.known, topic.total)
        gaps.append(f"{name}: gap={gap:.4f}")
    questions = engine.generate_curiosity_questions(5)
    names = list(engine.topics.keys())
    actions = [f"study_{n}" for n in names] + [f"experiment_on_{n}" for n in names]
    chosen = engine.select_explore_action(actions)
    engine.update_from_exploration('consciousness')
    gap_new = engine.evaluate_information_gap(
        engine.topics['consciousness'].known,
        engine.topics['consciousness'].total
    )
    summary_parts = [
        f"Evaluated {len(gaps)} topic gaps",
        f"Generated {len(questions)} curiosity questions",
        f"Selected action: {chosen}",
        f"Consciousness gap before update: {[g for g in gaps if 'consciousness' in g][0]}, after: {gap_new:.4f}",
    ]
    summary = " | ".join(summary_parts)
    return summary


if __name__ == '__main__':
    if len(sys.argv) == 1:
        s = run_test()
        eng = CuriosityDrive()
        print(json.dumps({'status': 'ok', 'summary': s, 'state': eng.get_state()}))
    elif sys.argv[1] == 'state':
        obj = CuriosityDrive()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = CuriosityDrive()
        obj.step()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = CuriosityDrive()
        if 'topic' in payload:
            obj.update_from_exploration(payload['topic'], payload.get('result'))
        if 'generate_questions' in payload:
            obj.generate_curiosity_questions(payload.get('n_questions', 3))
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    else:
        print(json.dumps({'status': 'error', 'message': f'Unknown command: {sys.argv[1]}'}))
