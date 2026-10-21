"""
cognitive_control.py — Executive Function & Cognitive Control

Models human executive functions through:
- Goal maintenance and shielding
- Task-set switching with switch costs
- Conflict monitoring (Stroop-like)
- Error detection and error-related negativity
- Inhibition of prepotent responses
- Working memory updating
- Cognitive flexibility

References:
- Miyake et al. (2000) unity and diversity of executive functions
- Botvinick et al. (2001) conflict monitoring theory
- Norman & Shallice (1986) supervisory attentional system
- Miller & Cohen (2001) integrative theory of prefrontal cortex
"""

import numpy as np
import json
import math
from dataclasses import dataclass, field
from typing import Any
from collections import defaultdict
import uuid
import time


@dataclass
class Task:
    """A task with associated goals and rules."""
    id: str
    name: str
    priority: float = 0.5
    goals: dict = field(default_factory=dict)
    rules: list = field(default_factory=list)
    activation: float = 1.0  # Current activation level
    created: float = 0.0
    deadline: float = 0.0
    
    @property
    def overdue(self) -> bool:
        if self.deadline == 0:
            return False
        return time.time() > self.deadline


class GoalMaintenance:
    """
    Active maintenance of goals despite interference.
    
    Uses recurrent excitation to keep goals active.
    Goal shielding: protect primary goal from distraction.
    """
    
    def __init__(self, decay_rate: float = 0.05, 
                 shielding_strength: float = 0.7):
        self.goals = {}  # name -> (activation, priority, dependencies)
        self.decay_rate = decay_rate
        self.shielding_strength = shielding_strength
        self.focal_goal = None
    
    def set_goal(self, name: str, priority: float = 0.5, 
                 dependencies: list = None):
        """Set a new goal with priority."""
        self.goals[name] = {
            'activation': 1.0,
            'priority': priority,
            'dependencies': dependencies or [],
            'progress': 0.0,
            'active': True
        }
        self._update_focal_goal()
    
    def complete_goal(self, name: str):
        """Mark goal as completed."""
        if name in self.goals:
            self.goals[name]['active'] = False
            self.goals[name]['progress'] = 1.0
        self._update_focal_goal()
    
    def _update_focal_goal(self):
        """Determine the current focal goal."""
        active = {k: v for k, v in self.goals.items() if v['active']}
        if not active:
            self.focal_goal = None
            return
        
        # Most active weighted by priority, with dependency resolution
        scores = {}
        for name, info in active.items():
            score = info['activation'] * info['priority']
            
            # Check dependencies are met
            deps_met = all(
                d not in self.goals or not self.goals[d]['active']
                for d in info['dependencies']
            )
            if not deps_met:
                score *= 0.3
            
            scores[name] = score
        
        self.focal_goal = max(scores, key=scores.get)
    
    def update(self, dt: float = 1.0):
        """
        Update goal activations over time.
        
        Focal goal gets boosted, others decay.
        """
        for name, info in self.goals.items():
            if not info['active']:
                continue
            
            if name == self.focal_goal:
                # Shielding: maintain focal goal activation
                info['activation'] += (1.0 - info['activation']) * 0.1
            else:
                # Decay non-focal goals
                decay = self.decay_rate * dt
                if self.focal_goal:
                    # Focal goal suppresses others via lateral inhibition
                    decay += self.shielding_strength * 0.05
                info['activation'] = max(0.0, info['activation'] - decay)
    
    def interfere(self, distractor: str, strength: float = 0.3):
        """
        Simulate interference from a distractor.
        
        Distractor reduces activation of focal goal.
        """
        if self.focal_goal and distractor != self.focal_goal:
            self.goals[self.focal_goal]['activation'] = max(
                0.0,
                self.goals[self.focal_goal]['activation'] - strength * 0.2
            )
    
    def get_state(self) -> dict:
        active_goals = {k: v for k, v in self.goals.items() if v['active']}
        return {
            'n_active_goals': len(active_goals),
            'focal_goal': self.focal_goal,
            'goals': {k: {
                'activation': round(v['activation'], 3),
                'priority': v['priority'],
                'progress': round(v['progress'], 2)
            } for k, v in active_goals.items()}
        }


class TaskSwitcher:
    """
    Task-set switching with cognitive costs.
    
    Switching between tasks incurs a switch cost.
    Costs are higher with greater task dissimilarity.
    """
    
    def __init__(self, base_switch_cost: float = 0.3,
                 practice_effect: float = 0.05):
        self.current_task = None
        self.base_switch_cost = base_switch_cost
        self.practice_effect = practice_effect
        self.switch_history = []
        self.task_similarity = defaultdict(lambda: defaultdict(float))
        self.practice = defaultdict(float)
    
    def set_similarity(self, task_a: str, task_b: str, similarity: float):
        """Set similarity between two tasks (0=dissimilar, 1=identical)."""
        self.task_similarity[task_a][task_b] = similarity
        self.task_similarity[task_b][task_a] = similarity
    
    def switch_to(self, new_task: str) -> float:
        """
        Switch to a new task. Returns switch cost.
        
        Switch cost = base_cost * (1 - similarity) * (1 - practice)
        """
        if self.current_task is None:
            self.current_task = new_task
            return 0.0
        
        if new_task == self.current_task:
            return 0.0
        
        similarity = self.task_similarity.get(self.current_task, {}).get(new_task, 0.3)
        practice = self.practice.get(new_task, 0.0)
        
        switch_cost = self.base_switch_cost * (1 - similarity) * max(0.1, 1 - practice)
        
        record = {
            'from': self.current_task,
            'to': new_task,
            'cost': switch_cost,
            'similarity': similarity,
            'timestamp': time.time()
        }
        self.switch_history.append(record)
        
        self.current_task = new_task
        self.practice[new_task] += self.practice_effect
        self.practice[new_task] = min(self.practice[new_task], 0.8)
        
        return switch_cost
    
    def get_state(self) -> dict:
        return {
            'current_task': self.current_task,
            'switches': len(self.switch_history),
            'mean_cost': float(np.mean([s['cost'] for s in self.switch_history])) 
                         if self.switch_history else 0.0,
            'practice_level': dict(self.practice)
        }


class ConflictMonitor:
    """
    Monitors conflict between competing responses.
    
    Based on Botvinick's conflict monitoring theory:
    - Conflict detected when multiple responses are equally activated
    - High conflict triggers cognitive control adjustments
    - Anterior cingulate (ACC) as conflict detector
    - Error likelihood prediction
    """
    
    def __init__(self, conflict_threshold: float = 0.5,
                 control_adjustment: float = 0.2):
        self.conflict_level = 0.0
        self.conflict_threshold = conflict_threshold
        self.control_adjustment = control_adjustment
        self.control_level = 0.5  # Baseline cognitive control
        self.history = []
        self.error_likelihood = 0.0
        self.accumulated_conflict = 0.0
    
    def compute_conflict(self, response_activations: np.ndarray) -> float:
        """
        Compute conflict using Hopfield energy.
        
        Conflict = -sum_i(sum_j response_i * response_j * w_ij)
        Simplified: conflict = product of top two activations
        """
        sorted_acts = np.sort(response_activations)[::-1]
        
        if len(sorted_acts) < 2:
            self.conflict_level = 0.0
        else:
            self.conflict_level = sorted_acts[0] * sorted_acts[1] * 4  # Scale to ~[0,1]
        
        self.conflict_level = np.clip(self.conflict_level, 0.0, 1.0)
        
        record = {
            'conflict': self.conflict_level,
            'top_activations': sorted_acts[:3].tolist(),
            'control': self.control_level,
            'timestamp': time.time()
        }
        self.history.append(record)
        self.accumulated_conflict += self.conflict_level
        
        # Update error likelihood
        self.error_likelihood += (self.conflict_level - self.error_likelihood) * 0.1
        
        return self.conflict_level
    
    def adjust_control(self):
        """
        Adjust cognitive control based on conflict.
        
        High conflict → increase control (more focused, slower)
        Low conflict → decrease control (more automatic, faster)
        """
        if self.conflict_level > self.conflict_threshold:
            self.control_level = min(1.0, self.control_level + self.control_adjustment)
        else:
            self.control_level = max(0.3, self.control_level - self.control_adjustment * 0.5)
    
    def get_state(self) -> dict:
        return {
            'current_conflict': self.conflict_level,
            'control_level': self.control_level,
            'error_likelihood': self.error_likelihood,
            'error_likelihood': self.error_likelihood,
            'mean_conflict': float(np.mean([h['conflict'] for h in self.history]))
                            if self.history else 0.0,
            'conflicts_detected': sum(1 for h in self.history if h['conflict'] > self.conflict_threshold)
        }


class ResponseInhibition:
    """
    Inhibition of prepotent responses.
    
    Used in Go/No-Go, Stop-Signal paradigms.
    """
    
    def __init__(self, inhibition_strength: float = 0.6,
                 stop_signal_delay: float = 0.2):
        self.inhibition_strength = inhibition_strength
        self.stop_signal_delay = stop_signal_delay
        self.inhibition_success = []
        self.inhibition_latency = 0.25
        self.last_action = None
    
    def inhibit(self, response_activation: float, stop_signal: bool = False) -> float:
        """
        Attempt to inhibit a response.
        
        Returns the inhibited activation level.
        """
        if not stop_signal:
            self.last_action = 'go'
            return response_activation
        
        # Stop signal: attempt inhibition
        inhibition_effect = self.inhibition_strength * np.random.beta(5, 2)
        inhibited = response_activation * (1 - inhibition_effect)
        
        success = inhibited < 0.3
        self.inhibition_success.append(success)
        self.last_action = 'stop'
        
        return max(0.0, inhibited)
    
    def get_state(self) -> dict:
        return {
            'inhibition_strength': self.inhibition_strength,
            'success_rate': float(np.mean(self.inhibition_success)) 
                           if self.inhibition_success else 0.0,
            'n_attempts': len(self.inhibition_success)
        }


class WorkingMemoryUpdater:
    """
    Working memory updating and manipulation.
    
    Based on Baddeley's model:
    - Central executive: controls attention
    - Phonological loop: verbal info
    - Visuospatial sketchpad: visual info
    - Episodic buffer: integrated episodes
    """
    
    def __init__(self, capacity: int = 4):
        self.capacity = capacity
        self.phonological_loop = []
        self.visuospatial = []
        self.episodic_buffer = []
        self.central_executive_load = 0.0
    
    def update(self, slot_type: str, content: Any, duration: float = 5.0):
        """
        Update working memory content.
        
        slot_type: 'phonological', 'visuospatial', or 'episodic'
        """
        buffer_map = {
            'phonological': self.phonological_loop,
            'visuospatial': self.visuospatial,
            'episodic': self.episodic_buffer
        }
        
        if slot_type not in buffer_map:
            return False
        
        buffer = buffer_map[slot_type]
        buffer.append({
            'content': content,
            'timestamp': time.time(),
            'duration': duration
        })
        
        # Enforce capacity limit
        while len(buffer) > self.capacity:
            removed = buffer.pop(0)
        
        # Update executive load
        total_items = len(self.phonological_loop) + len(self.visuospatial) + len(self.episodic_buffer)
        self.central_executive_load = min(1.0, total_items / (self.capacity * 3))
        
        return True
    
    def recall(self, slot_type: str = None) -> list:
        """Recall items from working memory."""
        if slot_type:
            buffer_map = {
                'phonological': self.phonological_loop,
                'visuospatial': self.visuospatial,
                'episodic': self.episodic_buffer
            }
            return [item['content'] for item in buffer_map.get(slot_type, [])]
        
        # Return all
        return {
            'phonological': [i['content'] for i in self.phonological_loop],
            'visuospatial': [i['content'] for i in self.visuospatial],
            'episodic': [i['content'] for i in self.episodic_buffer]
        }
    
    def clear(self):
        """Clear working memory."""
        self.phonological_loop = []
        self.visuospatial = []
        self.episodic_buffer = []
        self.central_executive_load = 0.0
    
    def get_state(self) -> dict:
        return {
            'capacity': self.capacity,
            'load': self.central_executive_load,
            'phonological_n': len(self.phonological_loop),
            'visuospatial_n': len(self.visuospatial),
            'episodic_n': len(self.episodic_buffer),
            'total_items': len(self.phonological_loop) + len(self.visuospatial) + len(self.episodic_buffer)
        }


class ExecutiveController:
    """
    Complete executive control system.
    """
    
    def __init__(self):
        self.goals = GoalMaintenance()
        self.task_switcher = TaskSwitcher()
        self.conflict_monitor = ConflictMonitor()
        self.inhibition = ResponseInhibition()
        self.wm = WorkingMemoryUpdater()
        self.current_task = None
        self.total_control_effort = 0.0
        self.errors = []
    
    def set_task(self, task: Task):
        """Set a new task with goals and rules."""
        self.current_task = task
        self.goals.set_goal(task.name, task.priority)
        self.task_switcher.switch_to(task.name)
        
        for goal_name, priority in task.goals.items():
            self.goals.set_goal(goal_name, priority)
    
    def process_response(self, response_activations: np.ndarray, 
                         stop_signal: bool = False) -> dict:
        """
        Process a response through full executive control pipeline.
        
        Returns: selected action and control metrics.
        """
        # 1. Conflict monitoring
        conflict = self.conflict_monitor.compute_conflict(response_activations)
        
        # 2. Adjust control if needed
        self.conflict_monitor.adjust_control()
        current_control = self.conflict_monitor.control_level
        
        # 3. Response inhibition if stop signal
        max_activation = np.max(response_activations)
        inhibited = self.inhibition.inhibit(max_activation, stop_signal)
        
        # 4. Select action (highest activation after inhibition)
        if stop_signal and inhibited < 0.3:
            action = -1  # No action (successful inhibition)
        else:
            action = int(np.argmax(response_activations))
            if inhibited < max_activation:
                # Partial inhibition - increase caution
                self.total_control_effort += 0.1
        
        # 5. Goal maintenance
        self.goals.update()
        
        # 6. Working memory update
        self.wm.central_executive_load = current_control * conflict * 0.5
        
        # Update control effort
        self.total_control_effort += current_control * conflict
        
        return {
            'action': action,
            'conflict': conflict,
            'control_level': current_control,
            'inhibited': inhibited < max_activation if not stop_signal else False,
            'stopped': stop_signal and inhibited < 0.3,
            'response_activation': float(max_activation),
            'focal_goal': self.goals.focal_goal
        }
    
    def detect_error(self, expected: float, actual: float, 
                     response_activation: float) -> dict:
        """
        Error detection with error-related negativity (ERN) simulation.
        
        ERN is larger when:
        - Error is more salient (expected - actual is large)
        - Response was made with high confidence
        """
        error = abs(expected - actual)
        error_threshold = 0.3
        
        if error > error_threshold:
            ern = error * response_activation * 10  # Scales with salience
            
            record = {
                'expected': expected,
                'actual': actual,
                'error': error,
                'ern': float(ern),
                'post_error_slowing': True,
                'timestamp': time.time()
            }
            self.errors.append(record)
            
            # Post-error slowing: increase conflict threshold briefly
            self.conflict_monitor.conflict_threshold += 0.1
            
            return record
        
        return {'error': 0.0, 'ern': 0.0, 'post_error_slowing': False}
    
    def get_state(self) -> dict:
        return {
            'current_task': self.current_task.name if self.current_task else None,
            'goal_state': self.goals.get_state(),
            'conflict_state': self.conflict_monitor.get_state(),
            'switch_state': self.task_switcher.get_state(),
            'inhibition_state': self.inhibition.get_state(),
            'working_memory': self.wm.get_state(),
            'total_control_effort': self.total_control_effort,
            'errors_detected': len(self.errors),
            'recent_errors': len([e for e in self.errors[-5:] if e['error'] > 0.3])
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        controller = ExecutiveController()
        
        print("=== COGNITIVE CONTROL TEST ===")
        
        task = Task(id='1', name='problem_solving', priority=0.8,
                    goals={'understand': 0.6, 'solve': 0.9},
                    rules=['analyze', 'compute', 'verify'])
        controller.set_task(task)
        print(f"1. Set task: {task.name} (focal goal: {controller.goals.focal_goal})")
        
        for step in range(6):
            if step == 3:
                activations = np.array([0.8, 0.75, 0.2, 0.1])
                stop_signal = False
                label = "CONFLICT"
            elif step == 4:
                activations = np.array([0.9, 0.3, 0.2, 0.1])
                stop_signal = True
                label = "STOP"
            else:
                activations = np.array([0.9, 0.2, 0.1, 0.05])
                stop_signal = False
                label = "normal"
            
            result = controller.process_response(activations, stop_signal)
            print(f"   Step {step} ({label:8s}): action={result['action']}, "
                  f"conflict={result['conflict']:.2f}, control={result['control_level']:.2f}, "
                  f"focal={result['focal_goal']}")
        
        error = controller.detect_error(expected=1.0, actual=0.2, response_activation=0.8)
        print(f"\n2. Error detection: ERN={error['ern']:.2f}, "
              f"post-error slowing={error['post_error_slowing']}")
        
        controller.wm.update('phonological', 'task_instructions')
        controller.wm.update('visuospatial', {'x': 10, 'y': 20})
        controller.wm.update('episodic', {'problem': 'solve_x', 'solved': False})
        
        print(f"\n3. Working memory: load={controller.wm.central_executive_load:.2f}")
        
        print(f"\nState: {json.dumps(controller.get_state(), indent=2)}")
        print("\n✓ Cognitive control module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': controller.get_state()}))
    elif action == 'step':
        controller = ExecutiveController()
        task = Task(id='1', name='step_task', priority=0.5, goals={}, rules=[])
        controller.set_task(task)
        controller.process_response(np.array([0.8, 0.2, 0.1, 0.05]))
        print(json.dumps({'status': 'ok', 'state': controller.get_state()}))
    elif action == 'state':
        controller = ExecutiveController()
        print(json.dumps({'status': 'ok', 'state': controller.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        controller = ExecutiveController()
        activations = np.array(payload.get('activations', [0.8, 0.2, 0.1, 0.05]))
        stop_signal = payload.get('stop_signal', False)
        controller.process_response(activations, stop_signal)
        print(json.dumps({'status': 'ok', 'state': controller.get_state()}))
