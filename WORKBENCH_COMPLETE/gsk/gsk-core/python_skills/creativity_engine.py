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
class Concept:
    name: str
    vector: np.ndarray
    relations: List[Tuple[str, str, float]]


@dataclass
class Idea:
    id: str
    name: str
    vector: np.ndarray
    novelty: float
    parent_concepts: List[str]


class CreativityEngine:
    EMBEDDING_DIM = 32
    N_CONCEPTS = 60

    CONCEPT_NAMES = [
        'consciousness', 'mind', 'brain', 'thought', 'memory', 'dream', 'soul',
        'energy', 'light', 'sound', 'wave', 'particle', 'time', 'space',
        'life', 'death', 'birth', 'growth', 'decay', 'evolution',
        'knowledge', 'wisdom', 'truth', 'beauty', 'justice', 'freedom',
        'love', 'fear', 'joy', 'anger', 'peace', 'war', 'power', 'order',
        'chaos', 'system', 'network', 'flow', 'cycle', 'pattern',
        'tree', 'river', 'mountain', 'star', 'ocean', 'storm', 'fire',
        'city', 'machine', 'garden', 'mirror', 'bridge', 'door', 'window',
        'voice', 'silence', 'question', 'answer', 'riddle', 'code', 'signal',
    ]

    RELATION_TYPES = [
        'contains', 'causes', 'opposes', 'transforms',
        'emerges_from', 'depends_on', 'resembles', 'precedes',
    ]

    def __init__(self, n_concepts: int = 60, dim: int = 32):
        self.dim = dim
        self.n_concepts = min(n_concepts, len(self.CONCEPT_NAMES))
        self.concepts: Dict[str, Concept] = {}
        self.ideas_generated: List[Idea] = []
        self.rng = np.random.default_rng(42)
        self._init_concept_space()
        self.divergent_runs = 0
        self.convergent_runs = 0
        self.analogy_runs = 0

    def _init_concept_space(self):
        vectors = {}
        for i, name in enumerate(self.CONCEPT_NAMES[:self.n_concepts]):
            h = hash(name) & 0x7FFFFFFF
            local_rng = np.random.default_rng(h)
            vec = local_rng.normal(0.0, 1.0, self.dim)
            norm = np.linalg.norm(vec)
            vec = vec / norm if norm > 1e-10 else vec
            vectors[name] = vec
        names = list(vectors.keys())
        for i, name in enumerate(names):
            n_rels = self.rng.integers(1, 5)
            rels = []
            other_indices = self.rng.choice(
                [j for j in range(len(names)) if j != i],
                size=min(n_rels, len(names) - 1),
                replace=False,
            )
            for j in other_indices:
                rtype = self.rng.choice(self.RELATION_TYPES)
                weight = float(self.rng.uniform(0.3, 1.0))
                rels.append((rtype, names[j], weight))
            self.concepts[name] = Concept(
                name=name,
                vector=vectors[name].copy(),
                relations=rels,
            )

    def _get_concept_vector(self, name: str) -> Optional[np.ndarray]:
        if name in self.concepts:
            return self.concepts[name].vector.copy()
        return None

    def _nearest_concept(self, vector: np.ndarray, exclude: set = None) -> Tuple[str, float]:
        if exclude is None:
            exclude = set()
        best_name = None
        best_sim = -float('inf')
        vec_norm = np.linalg.norm(vector)
        if vec_norm < 1e-10:
            return list(self.concepts.keys())[0], 0.0
        vec_unit = vector / vec_norm
        for name, concept in self.concepts.items():
            if name in exclude:
                continue
            sim = float(np.dot(vec_unit, concept.vector))
            if sim > best_sim:
                best_sim = sim
                best_name = name
        return best_name or list(self.concepts.keys())[0], best_sim

    def _compute_novelty(self, vector: np.ndarray) -> float:
        sims = []
        for concept in self.concepts.values():
            n = np.linalg.norm(concept.vector)
            if n > 1e-10:
                sims.append(float(np.dot(vector / np.linalg.norm(vector), concept.vector / n)))
        if not sims:
            return 1.0
        max_sim = max(sims)
        return float(1.0 - max_sim)

    def divergent_think(self, seed_concept: str, n_ideas: int = 5) -> List[str]:
        if seed_concept not in self.concepts:
            return [f"unknown concept: {seed_concept}"]
        self.divergent_runs += 1
        seed_vec = self.concepts[seed_concept].vector
        concept_names = list(self.concepts.keys())
        ideas = []
        for _ in range(n_ideas):
            k = self.rng.integers(2, 5)
            others = [n for n in concept_names if n != seed_concept]
            if len(others) < k:
                k = len(others)
            if k < 2:
                continue
            picks = list(self.rng.choice(others, size=k, replace=False))
            vectors = [self.concepts[p].vector for p in picks]
            vectors.append(seed_vec)
            blend = np.mean(vectors, axis=0)
            noise = self.rng.normal(0.0, 0.15, self.dim)
            blend = blend + noise
            b_norm = np.linalg.norm(blend)
            if b_norm > 1e-10:
                blend = blend / b_norm
            nearest, sim = self._nearest_concept(blend, exclude={seed_concept})
            novelty = self._compute_novelty(blend)
            idea_name = f"{seed_concept}-{nearest}-{self.divergent_runs}-{_}"
            idea = Idea(
                id=str(uuid.uuid4()),
                name=idea_name,
                vector=blend.copy(),
                novelty=round(novelty, 4),
                parent_concepts=[seed_concept] + picks,
            )
            self.ideas_generated.append(idea)
            ideas.append(f"{seed_concept} + {' + '.join(picks)} -> {nearest} (novelty={novelty:.4f})")
        return ideas

    def convergent_think(self, ideas: List[str], constraints: List[str], top_k: int = 2) -> List[str]:
        self.convergent_runs += 1
        scored = []
        for idea_str in ideas:
            parts = idea_str.split(' -> ')
            name_part = parts[-1].split(' (')[0] if ' -> ' in idea_str else idea_str
            constraint_score = 0.0
            for c in constraints:
                if c.lower() in name_part.lower():
                    constraint_score += 0.5
                elif c in self.concepts and name_part in self.concepts:
                    cs = float(np.dot(self.concepts[c].vector, self.concepts[name_part].vector))
                    constraint_score += max(0.0, cs)
            matching_ideas = [ix for ix in self.ideas_generated if ix.name == name_part]
            if matching_ideas:
                novelty = matching_ideas[0].novelty
            else:
                novelty = 0.3
            final_score = constraint_score * 0.6 + novelty * 0.4
            scored.append((idea_str, constraint_score, novelty, final_score))
        scored.sort(key=lambda x: x[3], reverse=True)
        return [s[0] for s in scored[:top_k]]

    def analogical_reason(self, source: str, target: str) -> dict:
        self.analogy_runs += 1
        if source not in self.concepts or target not in self.concepts:
            return {'error': f'Concepts {source} or {target} not found'}
        src_concept = self.concepts[source]
        tgt_concept = self.concepts[target]
        attr_sim = float(np.dot(src_concept.vector, tgt_concept.vector))
        mappings = []
        for s_rel in src_concept.relations:
            rtype, s_target, s_weight = s_rel
            for t_rel in tgt_concept.relations:
                tr_type, t_target, t_weight = t_rel
                if rtype == tr_type:
                    mapping = {
                        'relation': rtype,
                        'source': f"{source} -> {s_target}",
                        'target': f"{target} -> {t_target}",
                        'confidence': float(s_weight * t_weight),
                    }
                    mappings.append(mapping)
        mappings.sort(key=lambda m: m['confidence'], reverse=True)
        rel_sim = 0.0
        if len(src_concept.relations) > 0 and len(tgt_concept.relations) > 0:
            n_matched = len(mappings)
            n_total = max(len(src_concept.relations), len(tgt_concept.relations))
            rel_sim = n_matched / n_total if n_total > 0 else 0.0
        total_sim = 0.6 * attr_sim + 0.4 * rel_sim
        inference_hints = []
        if mappings:
            best = mappings[0]
            inference_hints.append(
                f"Since {source} {best['relation']} {best['source'].split(' -> ')[1]}, "
                f"analogously {target} may {best['relation']} something like {best['target'].split(' -> ')[1]}"
            )
        return {
            'source': source,
            'target': target,
            'attribute_similarity': round(float(attr_sim), 4),
            'relational_similarity': round(float(rel_sim), 4),
            'total_analogy_score': round(float(total_sim), 4),
            'mappings': mappings[:5],
            'inference_hints': inference_hints,
        }

    def creative_solve(self, problem: str, constraints: List[str]) -> dict:
        divergent_ideas = self.divergent_think(problem, n_ideas=8)
        filtered = self.convergent_think(divergent_ideas, constraints, top_k=3)
        analogies = []
        concept_names = list(self.concepts.keys())
        if problem in concept_names:
            others = [n for n in concept_names if n != problem]
            for _ in range(min(2, len(others))):
                ot = str(self.rng.choice(others))
                others.remove(ot) if ot in others else None
                a = self.analogical_reason(problem, ot)
                analogies.append(a)
        return {
            'problem': problem,
            'constraints': constraints,
            'divergent_ideas': divergent_ideas,
            'convergent_filtered': filtered,
            'analogies_generated': len(analogies),
            'analogies': analogies[:2],
        }

    def step(self):
        idx = self.divergent_runs % len(self.CONCEPT_NAMES)
        concept = self.CONCEPT_NAMES[idx]
        ideas = self.divergent_think(concept, n_ideas=3)
        constraints = ['system', 'flow', 'pattern']
        filtered = self.convergent_think(ideas, constraints, top_k=1)
        return {
            'seed_concept': concept,
            'ideas': ideas,
            'filtered': filtered,
        }

    def get_state(self) -> dict:
        return {
            'n_concepts': len(self.concepts),
            'embedding_dim': self.dim,
            'total_ideas_generated': len(self.ideas_generated),
            'divergent_runs': self.divergent_runs,
            'convergent_runs': self.convergent_runs,
            'analogy_runs': self.analogy_runs,
            'recent_ideas': [
                {
                    'name': ix.name[:40],
                    'novelty': ix.novelty,
                    'parents': ix.parent_concepts[:3],
                }
                for ix in self.ideas_generated[-5:]
            ],
            'concept_sample': list(self.concepts.keys())[:10],
        }


def run_test():
    engine = CreativityEngine(n_concepts=30, dim=16)
    ideas = engine.divergent_think('consciousness', n_ideas=5)
    constraints = ['system', 'flow']
    filtered = engine.convergent_think(ideas, constraints, top_k=2)
    analogy = engine.analogical_reason('consciousness', 'tree')
    summary_parts = [
        f"Generated {len(ideas)} divergent ideas on consciousness",
        f"Convergent filtered to {len(filtered)}: {filtered}",
        f"Analogy consciousness->tree score={analogy['total_analogy_score']:.4f}",
        f"Total ideas generated: {len(engine.ideas_generated)}",
    ]
    summary = " | ".join(summary_parts)
    return summary


if __name__ == '__main__':
    if len(sys.argv) == 1:
        s = run_test()
        eng = CreativityEngine()
        print(json.dumps({'status': 'ok', 'summary': s, 'state': eng.get_state()}))
    elif sys.argv[1] == 'state':
        obj = CreativityEngine()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = CreativityEngine()
        obj.step()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = CreativityEngine()
        if 'concept' in payload:
            obj.divergent_think(payload['concept'], n_ideas=payload.get('n_ideas', 5))
        if 'constraints' in payload and payload.get('ideas'):
            obj.convergent_think(payload['ideas'], payload['constraints'])
        if 'analogy' in payload:
            obj.analogical_reason(payload['analogy']['source'], payload['analogy']['target'])
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    else:
        print(json.dumps({'status': 'error', 'message': f'Unknown command: {sys.argv[1]}'}))
