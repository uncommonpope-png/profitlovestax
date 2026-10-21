import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Callable


@dataclass
class Chunk:
    id: str
    attributes: Dict[str, float]
    created: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    activation: float = 1.0
    decay_rate: float = 0.05

    def decay(self, current_time: float) -> None:
        elapsed = current_time - self.last_accessed
        self.activation = max(0.0, self.activation - self.decay_rate * elapsed)
        self.last_accessed = current_time

    def access(self, current_time: float) -> None:
        self.decay(current_time)
        self.activation = min(1.0, self.activation + 0.2)
        self.last_accessed = current_time


@dataclass
class ProductionRule:
    id: str
    name: str
    conditions: Dict[str, Tuple[str, float]]
    actions: Dict[str, float]
    priority: float = 1.0
    specificity: int = 0
    firing_count: int = 0
    last_fired: float = 0.0
    created_from_chunking: bool = False

    def matches(self, working_memory: Dict[str, float]) -> Tuple[bool, float]:
        match_score = 0.0
        for attr, (op, val) in self.conditions.items():
            if attr not in working_memory:
                return False, 0.0
            wm_val = working_memory[attr]
            if op == '==' and abs(wm_val - val) > 1e-6:
                return False, 0.0
            elif op == '<' and not (wm_val < val):
                return False, 0.0
            elif op == '>' and not (wm_val > val):
                return False, 0.0
            elif op == '<=' and not (wm_val <= val):
                return False, 0.0
            elif op == '>=' and not (wm_val >= val):
                return False, 0.0
            elif op == '~=' and abs(wm_val - val) > val * 0.2:
                return False, 0.0
            match_score += 1.0 / (1.0 + abs(wm_val - val))
        specificity = len(self.conditions)
        return True, match_score + specificity * 0.5


def parse_action(action_str: str, wm: Dict[str, float]) -> Dict[str, float]:
    result = {}
    for part in action_str.split(','):
        part = part.strip()
        if '=' in part:
            k, v = part.split('=', 1)
            v = v.strip()
            try:
                result[k.strip()] = float(v)
            except ValueError:
                if v.startswith('wm.'):
                    var = v[3:]
                    result[k.strip()] = wm.get(var, 0.0)
                elif v.startswith('sum'):
                    terms = v[3:].strip('()')
                    parts = [float(x.strip()) if x.strip().lstrip('-').replace('.','',1).isdigit() else wm.get(x.strip(), 0.0) for x in terms.split('+')]
                    result[k.strip()] = sum(parts)
                else:
                    result[k.strip()] = wm.get(v, 0.0)
    return result


class ProductionSystem:
    def __init__(self, decay_rate: float = 0.05):
        self.rules: Dict[str, ProductionRule] = {}
        self.chunks: Dict[str, Chunk] = {}
        self.working_memory: Dict[str, float] = {}
        self.goal_stack: List[Dict[str, float]] = []
        self.firing_history: List[Dict] = []
        self.chunked_rules: List[str] = []
        self.step_count: int = 0
        self.decay_rate = decay_rate
        self.conflict_resolution_stats: Dict[str, int] = defaultdict(int)

    def add_rule(self, condition: Dict[str, Tuple[str, float]], action: Dict[str, float],
                 priority: float = 1.0, name: Optional[str] = None) -> str:
        rule_id = str(uuid.uuid4())
        rule = ProductionRule(
            id=rule_id,
            name=name or f'rule_{len(self.rules)}',
            conditions=condition,
            actions=action,
            priority=priority,
            specificity=len(condition)
        )
        self.rules[rule_id] = rule
        return rule_id

    def add_chunk(self, attributes: Dict[str, float]) -> str:
        chunk_id = str(uuid.uuid4())
        chunk = Chunk(id=chunk_id, attributes=attributes, decay_rate=self.decay_rate)
        self.chunks[chunk_id] = chunk
        for k, v in attributes.items():
            self.working_memory[k] = v
        return chunk_id

    def set_goal(self, goal: Dict[str, float]) -> None:
        self.goal_stack.append(goal)
        for k, v in goal.items():
            self.working_memory[k] = v

    def _decay_all_chunks(self) -> None:
        now = time.time()
        for chunk in self.chunks.values():
            chunk.decay(now)

    def _find_matching_rules(self) -> List[ProductionRule]:
        now = time.time()
        for chunk in self.chunks.values():
            chunk.decay(now)
        matches = []
        for rule in self.rules.values():
            ok, score = rule.matches(self.working_memory)
            if ok:
                matches.append((rule, score))
        matches.sort(key=lambda x: (-x[0].priority, -x[1], -x[0].specificity, -x[0].firing_count))
        return [m[0] for m in matches]

    def _resolve_conflict(self, candidates: List[ProductionRule]) -> Optional[ProductionRule]:
        if not candidates:
            return None
        tied: Dict[str, List[ProductionRule]] = defaultdict(list)
        for rule in candidates:
            key = f'p{rule.priority:.1f}_s{rule.specificity}'
            tied[key].append(rule)

        for key in sorted(tied.keys(), reverse=True):
            group = tied[key]
            if len(group) == 1:
                chosen = group[0]
                self.conflict_resolution_stats[chosen.name] += 1
                return chosen

        max_recency = -1
        chosen = group[0]
        for rule in group:
            if rule.last_fired > max_recency:
                max_recency = rule.last_fired
                chosen = rule
        self.conflict_resolution_stats[chosen.name] += 1
        return chosen

    def _apply_rule(self, rule: ProductionRule) -> Dict[str, float]:
        now = time.time()
        rule.firing_count += 1
        rule.last_fired = now
        changes = {}
        for k, v in rule.actions.items():
            if k.startswith('goal.'):
                goal_key = k[5:]
                if self.goal_stack:
                    self.goal_stack[-1][goal_key] = v
                    self.working_memory[goal_key] = v if isinstance(v, (int, float)) else hash(v) % 1000
            elif k.startswith('wm.'):
                wm_key = k[3:]
                val = v if isinstance(v, (int, float)) else hash(v) % 1000
                self.working_memory[wm_key] = val
                changes[wm_key] = val
            elif k == 'push_goal':
                self.set_goal({'target': v if isinstance(v, (int, float)) else 1.0})
            elif k == 'pop_goal':
                if self.goal_stack:
                    self.goal_stack.pop()
            elif k == 'add_chunk' or k == 'new_chunk':
                if isinstance(v, dict):
                    chunk = Chunk(id=str(uuid.uuid4()), attributes=v, decay_rate=self.decay_rate)
                    self.chunks[chunk.id] = chunk
            else:
                val = v if isinstance(v, (int, float)) else hash(v) % 1000
                self.working_memory[k] = val
                changes[k] = val
        return changes

    def step(self, input_data: Optional[Dict[str, float]] = None) -> Dict[str, float]:
        self.step_count += 1
        self._decay_all_chunks()
        if input_data:
            for k, v in input_data.items():
                self.working_memory[k] = v

        candidates = self._find_matching_rules()
        chosen = self._resolve_conflict(candidates)

        if chosen:
            changes = self._apply_rule(chosen)
            self.firing_history.append({
                'step': self.step_count,
                'rule': chosen.name,
                'priority': chosen.priority,
                'specificity': chosen.specificity,
                'changes': changes,
                'time': time.time()
            })
            if len(self.firing_history) > 100:
                self.firing_history.pop(0)
        else:
            self.firing_history.append({
                'step': self.step_count,
                'rule': None,
                'priority': 0,
                'specificity': 0,
                'changes': {},
                'time': time.time()
            })

        return dict(self.working_memory)

    def learn_from_success(self, goal: str, steps: List[Dict]) -> Optional[str]:
        if len(steps) < 2:
            return None
        general_conditions = {}
        for step in steps:
            if step.get('rule'):
                rule = self.rules.get(step['rule'])
                if rule:
                    for attr, (op, val) in rule.conditions.items():
                        if op == '==' or op == '~=':
                            if attr not in general_conditions:
                                general_conditions[attr] = (op, val)
                            elif general_conditions[attr] != (op, val):
                                pass

        general_actions = {}
        for step in steps:
            wm_before = step.get('wm_before', {})
            wm_after = step.get('wm_after', {})
            for k in wm_after:
                if k in wm_before and abs(wm_after[k] - wm_before[k]) > 1e-6:
                    general_actions[k] = wm_after[k]

        if not general_conditions or not general_actions:
            return None

        chunked_rule = ProductionRule(
            id=str(uuid.uuid4()),
            name=f'chunked_{goal}_{self.step_count}',
            conditions=general_conditions,
            actions=general_actions,
            priority=1.5,
            specificity=len(general_conditions),
            created_from_chunking=True
        )
        self.rules[chunked_rule.id] = chunked_rule
        self.chunked_rules.append(chunked_rule.id)
        return chunked_rule.id

    def get_state(self) -> dict:
        return {
            'module': 'cognitive_architecture',
            'class': 'ProductionSystem',
            'rules_count': len(self.rules),
            'chunks_count': len(self.chunks),
            'working_memory': dict(self.working_memory),
            'goal_stack': list(self.goal_stack),
            'firing_count': self.step_count,
            'firing_history': self.firing_history[-10:],
            'chunked_rules': len(self.chunked_rules),
            'conflict_resolution': dict(self.conflict_resolution_stats),
            'step_count': self.step_count
        }

    def process_event(self, payload: dict) -> dict:
        event_type = payload.get('type', '')
        if event_type == 'add_rule':
            self.add_rule(
                condition=payload.get('condition', {}),
                action=payload.get('action', {}),
                priority=payload.get('priority', 1.0),
                name=payload.get('name')
            )
        elif event_type == 'add_chunk':
            self.add_chunk(payload.get('attributes', {}))
        elif event_type == 'step':
            self.step(payload.get('input'))
        elif event_type == 'set_goal':
            self.set_goal(payload.get('goal', {}))
        elif event_type == 'learn':
            self.learn_from_success(
                goal=payload.get('goal', ''),
                steps=payload.get('steps', [])
            )
        return self.get_state()


def run_tests():
    ps = ProductionSystem()
    tests_passed = 0

    ps.add_rule(
        condition={'x': ('>', 5.0), 'y': ('<', 10.0)},
        action={'result': 1.0, 'wm.state': 'high_x'},
        priority=2.0,
        name='rule_high_x'
    )
    ps.add_rule(
        condition={'x': ('<=', 5.0)},
        action={'result': 0.0, 'wm.state': 'low_x'},
        priority=1.0,
        name='rule_low_x'
    )
    ps.add_rule(
        condition={'z': ('==', 1.0), 'mode': ('==', 1.0)},
        action={'wm.mode_result': 99.0},
        priority=3.0,
        name='rule_mode'
    )
    ps.add_rule(
        condition={'temperature': ('>', 30.0)},
        action={'wm.alert': 1.0, 'result': -1.0},
        priority=2.5,
        name='rule_hot'
    )
    ps.add_rule(
        condition={'x': ('>=', 0.0)},
        action={'wm.valid': 1.0},
        priority=0.5,
        name='rule_default'
    )

    assert len(ps.rules) == 5, f"Expected 5 rules, got {len(ps.rules)}"
    tests_passed += 1

    ps.add_chunk({'x': 7.0, 'y': 3.0, 'z': 0.0, 'temperature': 25.0})
    wm = ps.step()
    assert wm.get('result') == 1.0, f"Expected result=1.0 for x>5, got {wm.get('result')}"
    assert wm.get('state') is not None, "wm.state should be set via state key"
    tests_passed += 1

    ps.add_chunk({'x': 2.0, 'y': 5.0, 'temperature': 35.0})
    wm = ps.step()
    assert wm.get('alert') == 1.0, f"Expected alert for temperature>30, got {wm.get('alert')}"
    tests_passed += 1

    ps.add_chunk({'x': 3.0, 'y': 8.0, 'z': 1.0, 'mode': 1.0})
    wm = ps.step()
    assert wm.get('mode_result') == 99.0, f"Expected mode_result=99.0, got {wm.get('mode_result')}"
    tests_passed += 1

    assert ps.step_count == 3, f"Expected 3 steps, got {ps.step_count}"
    tests_passed += 1

    return {
        'status': 'ok',
        'summary': f'ProductionSystem tests passed: {tests_passed}/5. Rules={len(ps.rules)}, Steps={ps.step_count}, Last WM={json.dumps({k: round(v,2) for k,v in wm.items()})}',
        'state': ps.get_state()
    }


if __name__ == '__main__':
    if len(sys.argv) == 1:
        result = run_tests()
        print(json.dumps(result))
    elif sys.argv[1] == 'state':
        obj = ProductionSystem()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = ProductionSystem()
        obj.step({'input': 1.0})
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = ProductionSystem()
        result = obj.process_event(payload)
        print(json.dumps({'status': 'ok', 'state': result}))
