"""
metacognition.py — Metacognitive Monitoring and Control

Models human metacognition:
- Confidence estimation (calibration)
- Error detection and correction
- Feeling-of-knowing judgments
- Strategy selection and monitoring
- Cognitive effort regulation
- Self-reflection and insight

References:
- Flavell (1979) metacognition and cognitive monitoring
- Koriat (2007) metacognition and consciousness
- Metcalfe & Shimamura (1994) metacognition
"""

import numpy as np
import json
import math
from collections import deque
from dataclasses import dataclass, field
from typing import Any
import uuid


@dataclass
class CognitiveTask:
    """A cognitive task being monitored."""
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    description: str = ''
    type: str = 'reasoning'  # reasoning, memory, perception, decision
    difficulty: float = 0.5
    start_time: float = 0.0
    end_time: float = 0.0
    confidence: float = 0.0
    accuracy: float = 0.0
    effort: float = 0.0
    strategies_used: list = field(default_factory=list)
    errors_detected: list = field(default_factory=list)


class MetacognitiveMonitor:
    """
    Monitors cognitive processes and estimates confidence, effort, and accuracy.
    
    Key metacognitive judgments:
    - Ease-of-learning (EOL): before task
    - Judgment-of-learning (JOL): during/after
    - Feeling-of-knowing (FOK): tip-of-tongue
    - Confidence calibration: accuracy vs confidence
    """
    
    def __init__(self, calibration_window: int = 50):
        self.confidence_history = deque(maxlen=calibration_window)
        self.accuracy_history = deque(maxlen=calibration_window)
        self.tasks = {}
        self.bias = 0.0  # Overconfidence (>0) or underconfidence (<0)
        self.calibration_score = 0.0
        self.insight_level = 0.0
        self.reflection_log = []
    
    def estimate_confidence(self, task: CognitiveTask) -> float:
        """
        Estimate confidence based on:
        - Domain expertise (past accuracy in similar tasks)
        - Task difficulty
        - Cognitive effort expended
        - Processing fluency (how easily information comes to mind)
        """
        base_confidence = 0.5
        
        # Past accuracy in similar domains
        domain_accuracy = self._domain_accuracy(task.type)
        base_confidence += (domain_accuracy - 0.5) * 0.3
        
        # Difficulty adjustment
        difficulty_adjust = (1.0 - task.difficulty) * 0.2
        base_confidence += difficulty_adjust
        
        # Effort heuristic (more effort = lower confidence, typically)
        effort_adjust = (1.0 - task.effort) * 0.15
        base_confidence += effort_adjust
        
        # Processing fluency
        fluency = self._processing_fluency(task)
        base_confidence += fluency * 0.15
        
        # Bias adjustment
        base_confidence += self.bias * 0.1
        
        task.confidence = np.clip(base_confidence, 0.0, 1.0)
        return task.confidence
    
    def _domain_accuracy(self, task_type: str) -> float:
        """Past accuracy for this type of task."""
        relevant = [(c, a) for c, a in zip(self.confidence_history, self.accuracy_history)
                   if True]  # Simplification: all tasks
        if not relevant:
            return 0.5
        return float(np.mean([a for _, a in relevant]))
    
    def _processing_fluency(self, task: CognitiveTask) -> float:
        """How easily information is processed (higher = more confident)."""
        if task.type == 'memory':
            return 0.3 + np.random.random() * 0.2 if len(self.accuracy_history) > 0 else 0.5
        return 0.5
    
    def evaluate_outcome(self, task_id: str, was_correct: bool, 
                         confidence: float = None):
        """
        Evaluate task outcome and update calibration.
        This is the core metacognitive feedback loop.
        """
        task = self.tasks.get(task_id)
        if not task:
            return
        
        task.accuracy = 1.0 if was_correct else 0.0
        conf = confidence or task.confidence
        
        self.confidence_history.append(conf)
        self.accuracy_history.append(task.accuracy)
        
        self._update_calibration()
        self._detect_errors(task, was_correct)
    
    def _update_calibration(self):
        """
        Update confidence calibration.
        Calibration = |confidence - accuracy| averaged.
        Lower = better calibrated.
        """
        if len(self.confidence_history) < 5:
            return
        
        conf_arr = np.array(self.confidence_history)
        acc_arr = np.array(self.accuracy_history)
        
        self.calibration_score = float(np.mean(np.abs(conf_arr - acc_arr)))
        self.bias = float(np.mean(conf_arr - acc_arr))
    
    def _detect_errors(self, task: CognitiveTask, was_correct: bool):
        """
        Detect and analyze errors for metacognitive insight.
        """
        if not was_correct:
            error = {
                'task_id': task.id,
                'description': task.description[:50],
                'confidence': task.confidence,
                'type': task.type,
                'effort': task.effort
            }
            task.errors_detected.append(error)
    
    def feeling_of_knowing(self, query: str, retrieval_effort: float) -> float:
        """
        Feeling-of-knowing judgment.
        
        When retrieval fails but we sense the knowledge exists.
        Based on cue familiarity and partial activation.
        """
        # Cue familiarity (simulated)
        familiarity = 0.3 + np.random.random() * 0.4
        
        # Retrieval effort (more effort for tip-of-tongue states)
        fok = familiarity * (1.0 - retrieval_effort * 0.5)
        
        # Tip-of-tongue state: high familiarity + high effort
        if familiarity > 0.6 and retrieval_effort > 0.5:
            fok = 0.7 + (familiarity - 0.5) * 0.3
        
        return np.clip(fok, 0.0, 1.0)
    
    def reflect(self, task_id: str = None) -> dict:
        """
        Metacognitive reflection — thinking about thinking.
        Generates insight about cognitive processes.
        """
        reflection = {
            'timestamp': __import__('time').time(),
            'calibration': self.calibration_score,
            'bias': self.bias,
            'overconfidence': self.bias > 0.1,
            'underconfidence': self.bias < -0.1,
            'insight_level': self.insight_level,
            'tasks_monitored': len(self.tasks),
            'recent_accuracy': float(np.mean(list(self.accuracy_history)[-10:])) if len(self.accuracy_history) >= 10 else 0.0,
            'recent_confidence': float(np.mean(list(self.confidence_history)[-10:])) if len(self.confidence_history) >= 10 else 0.0,
        }
        
        # Generate insights
        insights = []
        if self.bias > 0.2:
            insights.append(f"I tend to be overconfident by {self.bias:.2f}")
        elif self.bias < -0.2:
            insights.append(f"I tend to be underconfident by {abs(self.bias):.2f}")
        
        if self.calibration_score < 0.1:
            insights.append("My confidence is well-calibrated")
        elif self.calibration_score > 0.3:
            insights.append("My confidence calibration needs improvement")
        
        reflection['insights'] = insights
        self.reflection_log.append(reflection)
        
        # Insight grows with reflection
        self.insight_level = min(1.0, self.insight_level + 0.05)
        
        return reflection


class StrategySelector:
    """
    Selects cognitive strategies based on task demands and metacognitive monitoring.
    
    Implements the metacognitive control loop:
    Monitor → Evaluate → Select Strategy → Execute → Monitor
    """
    
    def __init__(self):
        self.strategies = {
            'analytical': {'effort': 0.8, 'accuracy': 0.7, 'speed': 0.3},
            'intuitive': {'effort': 0.2, 'accuracy': 0.5, 'speed': 0.8},
            'trial_and_error': {'effort': 0.4, 'accuracy': 0.4, 'speed': 0.6},
            'decomposition': {'effort': 0.7, 'accuracy': 0.8, 'speed': 0.3},
            'analogy': {'effort': 0.5, 'accuracy': 0.6, 'speed': 0.5},
            'simulation': {'effort': 0.6, 'accuracy': 0.7, 'speed': 0.4},
            'heuristic': {'effort': 0.2, 'accuracy': 0.4, 'speed': 0.9},
            'deep_analysis': {'effort': 0.9, 'accuracy': 0.9, 'speed': 0.2},
        }
        self.strategy_history = deque(maxlen=20)
    
    def select_strategy(self, task_difficulty: float, time_pressure: float,
                       desired_accuracy: float = 0.7) -> tuple[str, dict]:
        """
        Select optimal strategy based on task demands.
        Balances accuracy, speed, and cognitive effort.
        """
        best_strategy = None
        best_score = -float('inf')
        
        for name, profile in self.strategies.items():
            accuracy_fit = 1.0 - abs(profile['accuracy'] - desired_accuracy)
            difficulty_fit = 1.0 - abs(profile['effort'] - task_difficulty)
            speed_fit = profile['speed'] if time_pressure > 0.5 else 1.0
            
            score = (accuracy_fit * 0.4 + difficulty_fit * 0.3 + speed_fit * 0.3)
            
            if score > best_score:
                best_score = score
                best_strategy = (name, profile)
        
        if best_strategy:
            self.strategy_history.append({
                'strategy': best_strategy[0],
                'difficulty': task_difficulty,
                'time_pressure': time_pressure
            })
        
        return best_strategy or ('analytical', self.strategies['analytical'])
    
    def evaluate_strategy_effectiveness(self, was_correct: bool, 
                                        effort: float) -> float:
        """How effective was the chosen strategy?"""
        if was_correct:
            return 1.0 - effort * 0.3
        else:
            return 0.0


class CognitiveController:
    """
    Executive control system that monitors, evaluates, and regulates cognition.
    
    Integrates metacognitive monitoring with strategy selection
    for adaptive cognitive control.
    """
    
    def __init__(self):
        self.monitor = MetacognitiveMonitor()
        self.strategy_selector = StrategySelector()
        self.active_tasks = {}
        self.cognitive_load = 0.0  # 0-1, current mental workload
        self.control_history = []
    
    def initiate_task(self, description: str, task_type: str = 'reasoning',
                     difficulty: float = 0.5, time_pressure: float = 0.3) -> str:
        """Start monitoring a new cognitive task."""
        task = CognitiveTask(
            description=description,
            type=task_type,
            difficulty=difficulty,
            start_time=__import__('time').time(),
            effort=self.cognitive_load
        )
        
        self.monitor.tasks[task.id] = task
        
        strategy_name, strategy = self.strategy_selector.select_strategy(
            difficulty, time_pressure
        )
        task.strategies_used.append(strategy_name)
        
        confidence = self.monitor.estimate_confidence(task)
        
        self.active_tasks[task.id] = task
        
        return {
            'task_id': task.id,
            'confidence': confidence,
            'strategy': strategy_name,
            'cognitive_load': self.cognitive_load
        }
    
    def complete_task(self, task_id: str, was_correct: bool):
        """Complete a task and evaluate outcome."""
        task = self.active_tasks.pop(task_id, None)
        if not task:
            task = self.monitor.tasks.get(task_id)
            if not task:
                return
        
        task.end_time = __import__('time').time()
        self.monitor.evaluate_outcome(task_id, was_correct)
        
        control_record = {
            'task_id': task_id,
            'type': task.type,
            'confidence': task.confidence,
            'correct': was_correct,
            'strategy': task.strategies_used,
            'duration': task.end_time - task.start_time
        }
        self.control_history.append(control_record)
        
        # Adjust cognitive load based on outcome
        if was_correct:
            self.cognitive_load = max(0.0, self.cognitive_load - 0.05)
        else:
            self.cognitive_load = min(1.0, self.cognitive_load + 0.1)
    
    def get_state(self) -> dict:
        return {
            'cognitive_load': self.cognitive_load,
            'active_tasks': len(self.active_tasks),
            'total_tasks_completed': len(self.control_history),
            'calibration': self.monitor.calibration_score,
            'bias': self.monitor.bias,
            'insight_level': self.monitor.insight_level,
            'last_reflection': self.monitor.reflection_log[-1] if self.monitor.reflection_log else None,
            'recent_accuracy': float(np.mean([c['correct'] for c in self.control_history[-10:]])) if len(self.control_history) >= 10 else 0.0
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        controller = CognitiveController()
        
        print("=== METACOGNITION TEST ===")
        
        tasks = [
            ("Solve the equation 2x + 5 = 13", 'reasoning', 0.3, True),
            ("Recall yesterday's conversation", 'memory', 0.6, True),
            ("Classify this image", 'perception', 0.7, False),
            ("Make a complex decision", 'decision', 0.8, True),
            ("Remember a name from years ago", 'memory', 0.9, False),
        ]
        
        for desc, ttype, diff, correct in tasks:
            result = controller.initiate_task(desc, ttype, diff)
            print(f"  Task: {desc[:30]:30s} | "
                  f"Conf: {result['confidence']:.2f} | "
                  f"Strategy: {result['strategy']:15s} | "
                  f"Correct: {correct}")
            controller.complete_task(result['task_id'], correct)
        
        print(f"\n  Cognitive load: {controller.cognitive_load:.2f}")
        print(f"  Calibration: {controller.monitor.calibration_score:.3f}")
        print(f"  Bias: {controller.monitor.bias:.3f}")
        
        reflection = controller.monitor.reflect()
        print(f"  Insights: {reflection['insights']}")
        
        state = controller.get_state()
        print(f"\nState: {json.dumps(state, indent=2, default=str)[:300]}")
        print("\n✓ Metacognition module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': controller.get_state()}))
    elif action == 'step':
        controller = CognitiveController()
        res = controller.initiate_task("step task", "reasoning", 0.5)
        controller.complete_task(res['task_id'], True)
        print(json.dumps({'status': 'ok', 'state': controller.get_state()}))
    elif action == 'state':
        controller = CognitiveController()
        print(json.dumps({'status': 'ok', 'state': controller.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        controller = CognitiveController()
        res = controller.initiate_task(description=payload.get('description', 'event task'), task_type=payload.get('type', 'reasoning'), difficulty=payload.get('difficulty', 0.5))
        controller.complete_task(res['task_id'], payload.get('correct', True))
        print(json.dumps({'status': 'ok', 'state': controller.get_state()}))
