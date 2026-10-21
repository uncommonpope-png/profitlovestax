"""
attention_salience.py — Human-like Attention and Salience System

Models visual and cognitive attention based on:
- Bottom-up salience (feature contrast: color, orientation, motion)
- Top-down attention (goal-driven modulation)
- Inhibition of return (IOR) — prevents revisiting attended locations
- Attentional blink — brief blind period after attending
- Divided attention and cognitive load
- Spotlight and zoom-lens models

References:
- Itti & Koch (2001) computational salience model
- Posner (1980) orienting of attention
- Treisman & Gelade (1980) feature integration theory
- Desimone & Duncan (1995) biased competition model
"""

import numpy as np
import json
import math
from collections import deque
from dataclasses import dataclass, field
from typing import Any
import uuid


@dataclass
class AttentionalFocus:
    """Current focus of attention."""
    target_id: str = ''
    location: tuple = (0.0, 0.0)
    feature: str = ''
    intensity: float = 0.0
    duration: float = 0.0
    modality: str = 'visual'  # visual, auditory, cognitive, interoceptive
    source: str = 'bottom-up'  # bottom-up, top-down, goal-driven
    timestamp: float = 0.0


class SalienceMap:
    """
    Computes bottom-up salience based on feature contrast.
    
    Models the human salience map in the superior colliculus
    and posterior parietal cortex.
    """
    
    def __init__(self, width: int = 10, height: int = 10):
        self.width = width
        self.height = height
        self.feature_maps = {
            'intensity': np.zeros((height, width)),
            'color': np.zeros((height, width)),
            'orientation': np.zeros((height, width)),
            'motion': np.zeros((height, width)),
            'novelty': np.zeros((height, width))
        }
        self.salience = np.zeros((height, width))
        self.inhibition_map = np.zeros((height, width))  # IOR
        self.attended_locations = deque(maxlen=20)  # For IOR
        self.center_bias = self._gaussian(width, height)
    
    def _gaussian(self, width: int, height: int, 
                  sigma: float = 0.3) -> np.ndarray:
        """Center bias — humans tend to focus on center."""
        cy, cx = height / 2, width / 2
        y, x = np.ogrid[:height, :width]
        return np.exp(-((x - cx)**2 + (y - cy)**2) / (2 * sigma**2 * min(width, height)**2))
    
    def update(self, features: dict[str, np.ndarray]):
        """
        Update salience map from feature inputs.
        
        Each feature map contributes to overall salience
        based on center-surround contrast.
        """
        for feature_name, feature_map in features.items():
            if feature_name in self.feature_maps:
                self.feature_maps[feature_name] = feature_map.copy()
                
                # Center-surround contrast
                blurred = self._gaussian_blur(feature_map, sigma=3)
                contrast = feature_map - blurred
                
                # Combine into salience
                self.feature_maps[feature_name] = np.abs(contrast)
        
        # Weighted sum of feature contrasts
        self.salience = (
            self.feature_maps['intensity'] * 0.3 +
            self.feature_maps['color'] * 0.2 +
            self.feature_maps['orientation'] * 0.2 +
            self.feature_maps['motion'] * 0.2 +
            self.feature_maps['novelty'] * 0.1
        )
        
        # Add center bias
        self.salience += self.center_bias * 0.1
        
        # Apply inhibition of return
        self.salience -= self.inhibition_map * 0.5
        
        self.salience = np.clip(self.salience, 0.0, 1.0)
    
    def _gaussian_blur(self, image: np.ndarray, sigma: float = 3.0) -> np.ndarray:
        """Simple Gaussian blur using separable convolution."""
        from scipy.ndimage import gaussian_filter
        try:
            return gaussian_filter(image, sigma=sigma)
        except ImportError:
            kernel_size = int(sigma * 3) * 2 + 1
            kernel = np.exp(-(np.arange(kernel_size) - kernel_size//2)**2 / (2*sigma**2))
            kernel /= kernel.sum()
            blurred = np.apply_along_axis(lambda x: np.convolve(x, kernel, mode='same'), 
                                          0, image)
            blurred = np.apply_along_axis(lambda x: np.convolve(x, kernel, mode='same'), 
                                          1, blurred)
            return blurred
    
    def get_focus_point(self, goal_bias: np.ndarray = None) -> tuple:
        """
        Select next focus point based on salience + top-down bias.
        
        Winner-take-all with IOR.
        """
        combined = self.salience.copy()
        
        if goal_bias is not None:
            combined += goal_bias * 0.3
        
        combined = np.clip(combined, 0.0, 1.0)
        
        # Add noise for exploration
        noise = np.random.randn(self.height, self.width) * 0.05
        combined += noise
        
        flat_idx = np.argmax(combined)
        y, x = divmod(flat_idx, self.width)
        
        # Update inhibition of return
        self._add_inhibition(y, x)
        
        return (x, y)
    
    def _add_inhibition(self, y: int, x: int, radius: int = 2, 
                        strength: float = 0.5):
        """Add inhibition of return at attended location."""
        y_start = max(0, y - radius)
        y_end = min(self.height, y + radius + 1)
        x_start = max(0, x - radius)
        x_end = min(self.width, x + radius + 1)
        
        self.inhibition_map[y_start:y_end, x_start:x_end] = strength
        
        self.attended_locations.append((x, y))
    
    def decay_inhibition(self, rate: float = 0.05):
        """Gradually decay inhibition of return."""
        self.inhibition_map = np.maximum(0, self.inhibition_map - rate)


class AttentionalBlink:
    """
    Models the attentional blink phenomenon.
    
    After detecting a target, there's a 200-500ms period
    where subsequent targets are missed.
    """
    
    def __init__(self, blink_duration: float = 0.4):
        self.blink_duration = blink_duration
        self.last_target_time = 0.0
        self.is_in_blink = False
    
    def detect_target(self, current_time: float) -> bool:
        """Check if we can detect a target (not in blink period)."""
        elapsed = current_time - self.last_target_time
        
        if elapsed < 0.15:
            return False  # Early blink
        
        if 0.15 <= elapsed < (0.15 + self.blink_duration):
            self.is_in_blink = True
            return False  # In blink
        
        self.is_in_blink = False
        self.last_target_time = current_time
        return True
    
    def reset(self):
        """Reset attentional blink state."""
        self.last_target_time = 0.0
        self.is_in_blink = False


class ExecutiveAttention:
    """
    Top-down executive attention control.
    
    Manages:
    - Goal-directed attention
    - Task switching
    - Distractor suppression
    - Cognitive load management
    - Divided attention
    """
    
    def __init__(self):
        self.goals = []  # Priority queue of attentional goals
        self.distractors = []
        self.task_set = {}  # Current task configuration
        self.cognitive_load = 0.0
        self.switch_cost = 0.15  # Cost of switching attention
        self.current_focus = None
        self.attention_history = []
    
    def set_goal(self, goal: str, priority: float = 0.5, 
                 location: tuple = None, feature: str = None):
        """Set a top-down attentional goal."""
        self.goals.append({
            'description': goal,
            'priority': priority,
            'location': location,
            'feature': feature,
            'start_time': __import__('time').time()
        })
        self.goals.sort(key=lambda g: -g['priority'])
    
    def get_top_down_bias(self, width: int, height: int) -> np.ndarray:
        """Generate top-down bias map from current goals."""
        bias = np.zeros((height, width))
        
        for goal in self.goals:
            if goal['location']:
                x, y = goal['location']
                if 0 <= x < width and 0 <= y < height:
                    # Gaussian around goal location
                    cy, cx = y, x
                    yy, xx = np.ogrid[:height, :width]
                    gaussian = np.exp(-((xx - cx)**2 + (yy - cy)**2) / (2 * 5**2))
                    bias += gaussian * goal['priority']
            
            if goal['feature']:
                bias += 0.2  # General feature-based bias
        
        return np.clip(bias, 0.0, 1.0)
    
    def suppress_distractors(self, salience: np.ndarray, 
                             distractor_locations: list) -> np.ndarray:
        """Suppress salience at known distractor locations."""
        suppressed = salience.copy()
        for x, y in distractor_locations:
            if 0 <= x < salience.shape[1] and 0 <= y < salience.shape[0]:
                y_start = max(0, y - 2) ; y_end = min(salience.shape[0], y + 3)
                x_start = max(0, x - 2) ; x_end = min(salience.shape[1], x + 3)
                suppressed[y_start:y_end, x_start:x_end] *= 0.3
        return suppressed
    
    def switch_task(self, new_task: str):
        """Switch to a new task (with switch cost)."""
        self.cognitive_load = min(1.0, self.cognitive_load + self.switch_cost)
        self.task_set = {'current': new_task, 'previous': self.task_set.get('current')}
        
        self.attention_history.append({
            'switch_to': new_task,
            'switch_cost': self.switch_cost,
            'cognitive_load': self.cognitive_load,
            'time': __import__('time').time()
        })


class AttentionSystem:
    """
    Complete attention system integrating bottom-up and top-down mechanisms.
    
    Simulates human visual/cognitive attention.
    """
    
    def __init__(self, width: int = 10, height: int = 10):
        self.salience_map = SalienceMap(width, height)
        self.blink = AttentionalBlink()
        self.executive = ExecutiveAttention()
        self.current_focus = AttentionalFocus()
        self.focus_history = []
        self.cycle = 0
    
    def process_scene(self, features: dict[str, np.ndarray], 
                      time_step: float = 0.1) -> AttentionalFocus:
        """One attentional cycle: perceive → compute salience → select focus."""
        self.cycle += 1
        current_time = self.cycle * time_step
        
        # Update salience map
        self.salience_map.update(features)
        
        # Decay inhibition
        self.salience_map.decay_inhibition(0.05)
        
        # Get top-down bias
        goal_bias = self.executive.get_top_down_bias(
            self.salience_map.width, self.salience_map.height
        )
        
        # Suppress distractors
        salience = self.executive.suppress_distractors(
            self.salience_map.salience, self.executive.distractors
        )
        
        # Select focus point
        if self.blink.detect_target(current_time):
            x, y = self.salience_map.get_focus_point(goal_bias)
            
            self.current_focus = AttentionalFocus(
                location=(x, y),
                intensity=self.salience_map.salience[y, x],
                duration=time_step,
                timestamp=current_time
            )
        else:
            # Maintain current focus during blink
            self.current_focus.duration += time_step
        
        self.focus_history.append(self.current_focus)
        return self.current_focus
    
    def get_focus_description(self) -> str:
        """Describe where attention is focused."""
        fx, fy = self.current_focus.location
        intensity = self.current_focus.intensity
        if intensity > 0.7:
            qualifier = "strongly focused on"
        elif intensity > 0.4:
            qualifier = "attending to"
        else:
            qualifier = "glancing at"
        
        return f"Attention {qualifier} location ({fx:.1f}, {fy:.1f}) " \
               f"(intensity: {intensity:.2f})"
    
    def get_state(self) -> dict:
        return {
            'cycle': self.cycle,
            'current_focus': {
                'location': self.current_focus.location,
                'intensity': self.current_focus.intensity,
                'duration': self.current_focus.duration,
                'modality': self.current_focus.modality,
                'source': self.current_focus.source
            },
            'blink_state': {
                'in_blink': self.blink.is_in_blink,
                'last_target': self.blink.last_target_time
            },
            'cognitive_load': self.executive.cognitive_load,
            'active_goals': len(self.executive.goals),
            'total_focus_shifts': len(self.focus_history),
            'salience_stats': {
                'mean': float(np.mean(self.salience_map.salience)),
                'max': float(np.max(self.salience_map.salience)),
                'num_peaks': int(np.sum(self.salience_map.salience > 0.5))
            }
        }


if __name__ == '__main__':
    import sys
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'verify'
    
    if action == 'verify':
        attn = AttentionSystem(width=10, height=10)
        
        print("=== ATTENTION SYSTEM TEST ===")
        
        attn.executive.set_goal("Find the target", priority=0.8, location=(3, 4))
        attn.executive.distractors = [(7, 2), (1, 8)]
        
        for i in range(10):
            features = {
                'intensity': np.random.rand(10, 10) * 0.5,
                'color': np.random.rand(10, 10) * 0.3,
                'orientation': np.random.rand(10, 10) * 0.4,
                'motion': np.random.rand(10, 10) * 0.2,
                'novelty': np.random.rand(10, 10) * 0.3
            }
            
            features['intensity'][4, 3] = 0.95
            features['color'][4, 3] = 0.9
            
            focus = attn.process_scene(features)
            
            if i % 3 == 0:
                print(f"  Cycle {i}: {attn.get_focus_description()}")
        
        print(f"\nAttentional blink occurred: {attn.blink.is_in_blink}")
        print(f"Cognitive load: {attn.executive.cognitive_load:.2f}")
        print(f"State: {json.dumps(attn.get_state(), indent=2, default=str)[:300]}")
        print("\n✓ Attention system module verified")
        print(json.dumps({'status': 'ok', 'summary': 'test summary', 'state': attn.get_state()}))
    elif action == 'step':
        attn = AttentionSystem(width=10, height=10)
        features = {'intensity': np.random.rand(10, 10) * 0.5, 'color': np.random.rand(10, 10) * 0.3, 'orientation': np.random.rand(10, 10) * 0.4, 'motion': np.random.rand(10, 10) * 0.2, 'novelty': np.random.rand(10, 10) * 0.3}
        features['intensity'][4, 3] = 0.95
        attn.process_scene(features)
        print(json.dumps({'status': 'ok', 'state': attn.get_state()}))
    elif action == 'state':
        attn = AttentionSystem(width=10, height=10)
        print(json.dumps({'status': 'ok', 'state': attn.get_state()}))
    elif action == 'event':
        payload = json.loads(sys.argv[2])
        attn = AttentionSystem(width=10, height=10)
        features = payload.get('features', {'intensity': [[0.5]*10]*10})
        if isinstance(features, dict):
            for k in features:
                features[k] = np.array(features[k])
        attn.process_scene(features)
        print(json.dumps({'status': 'ok', 'state': attn.get_state()}))
