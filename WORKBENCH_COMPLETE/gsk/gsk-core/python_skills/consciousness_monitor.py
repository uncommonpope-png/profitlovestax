import sys, json, numpy as np, time, math, uuid
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


@dataclass
class SignalChannel:
    name: str
    buffer: List[float] = field(default_factory=list)
    maxlen: int = 100

    def push(self, value: float) -> None:
        self.buffer.append(value)
        if len(self.buffer) > self.maxlen:
            self.buffer.pop(0)

    def entropy(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        arr = np.array(self.buffer)
        std = np.std(arr)
        if std < 1e-10:
            return 0.0
        counts, _ = np.histogram(arr, bins=min(10, len(self.buffer)//2 + 1))
        probs = counts / np.sum(counts)
        probs = probs[probs > 0]
        if len(probs) == 0:
            return 0.0
        return float(-np.sum(probs * np.log2(probs)))

    def complexity(self) -> float:
        if len(self.buffer) < 10:
            return 0.0
        arr = np.array(self.buffer)
        d1 = np.diff(arr)
        d2 = np.diff(d1)
        return float(np.std(d1) + 0.5 * np.std(d2))

    def mean(self) -> float:
        if not self.buffer:
            return 0.0
        return float(np.mean(self.buffer))

    def std(self) -> float:
        if len(self.buffer) < 2:
            return 0.0
        return float(np.std(self.buffer))

    def spectral_edge(self) -> float:
        if len(self.buffer) < 16:
            return 0.0
        arr = np.array(self.buffer[-min(64, len(self.buffer)):])
        fft = np.abs(np.fft.rfft(arr))
        total = np.sum(fft)
        if total < 1e-10:
            return 0.0
        cumsum = np.cumsum(fft) / total
        edge_idx = int(np.searchsorted(cumsum, 0.5))
        return edge_idx / len(fft)


class ConsciousnessMonitor:
    def __init__(self, num_channels: int = 8):
        self.channels: Dict[str, SignalChannel] = {}
        for i in range(num_channels):
            self.channels[f'C{i}'] = SignalChannel(name=f'C{i}')
        self.phi_history: List[float] = []
        self.awareness_history: List[float] = []
        self.workspace_occupancy_history: List[float] = []
        self.state_labels: List[str] = []
        self.step_count: int = 0
        self.detected_states: List[Dict] = []
        self.current_phi: float = 0.0
        self.current_awareness: float = 0.0
        self.current_workspace_occ: float = 0.0
        self.perturbational_complexity: float = 0.0
        self.integration_matrix: np.ndarray = np.eye(num_channels)
        self.num_channels = num_channels

    def update(self, signals_dict: Dict[str, float]) -> Dict[str, float]:
        self.step_count += 1
        for name, value in signals_dict.items():
            if name in self.channels:
                self.channels[name].push(value)
            else:
                ch = SignalChannel(name=name)
                ch.push(value)
                self.channels[name] = ch

        state_vec = self._build_state_vector()
        self.current_phi = self.compute_phi(state_vec)
        self.current_awareness = self.get_awareness_level()
        self._update_integration_matrix(state_vec)
        self.perturbational_complexity = self._compute_pci()
        self.current_workspace_occ = self._compute_workspace_occupancy()

        self.phi_history.append(self.current_phi)
        self.awareness_history.append(self.current_awareness)
        self.workspace_occupancy_history.append(self.current_workspace_occ)

        if len(self.phi_history) > 200:
            self.phi_history.pop(0)
            self.awareness_history.pop(0)
            self.workspace_occupancy_history.pop(0)

        changes = self.detect_state_changes()
        for c in changes:
            self.detected_states.append(c)
        if len(self.detected_states) > 50:
            self.detected_states.pop(0)

        return self.get_state()

    def _build_state_vector(self) -> np.ndarray:
        vec = []
        for name in sorted(self.channels.keys()):
            ch = self.channels[name]
            vec.extend([
                ch.mean(),
                ch.std(),
                ch.entropy(),
                ch.complexity()
            ])
        return np.array(vec, dtype=float)

    def compute_phi(self, state_vector: np.ndarray) -> float:
        n = len(state_vector)
        if n < 4:
            return 0.0
        arr = state_vector.reshape(-1, 1)
        cov = np.cov(np.tile(arr, (1, max(2, n // 4 + 1)))[:n, :max(2, n // 4 + 1)])

        if cov.size == 0 or np.any(np.isnan(cov)) or np.any(np.isinf(cov)):
            return 0.0

        try:
            eigvals = np.linalg.eigvalsh(cov)
            eigvals = np.abs(eigvals)
            total = np.sum(eigvals)
            if total < 1e-10:
                return 0.0
            probs = eigvals / total
            H_Y = -np.sum(probs * np.log2(probs + 1e-15))

            min_info = float('inf')
            mid = max(1, n // 2)
            if mid < n:
                M1 = state_vector[:mid]
                M2 = state_vector[mid:2*mid] if 2*mid <= n else state_vector[mid:]
                if len(M1) > 1 and len(M2) > 1:
                    combined = np.concatenate([M1, M2])
                    cov1 = np.cov(np.tile(M1.reshape(-1, 1), (1, max(2, len(M1)//4 + 1)))[:len(M1), :max(2, len(M1)//4 + 1)])
                    cov2 = np.cov(np.tile(M2.reshape(-1, 1), (1, max(2, len(M2)//4 + 1)))[:len(M2), :max(2, len(M2)//4 + 1)])
                    cov_comb = np.cov(np.tile(combined.reshape(-1, 1), (1, max(2, len(combined)//4 + 1)))[:len(combined), :max(2, len(combined)//4 + 1)])

                    if cov1.size > 0 and cov2.size > 0 and cov_comb.size > 0:
                        e1 = np.abs(np.linalg.eigvalsh(cov1))
                        e2 = np.abs(np.linalg.eigvalsh(cov2))
                        e_comb = np.abs(np.linalg.eigvalsh(cov_comb))

                        p1 = e1 / (np.sum(e1) + 1e-15)
                        p2 = e2 / (np.sum(e2) + 1e-15)
                        p_comb = e_comb / (np.sum(e_comb) + 1e-15)

                        H_M1 = -np.sum(p1 * np.log2(p1 + 1e-15)) if np.sum(e1) > 1e-10 else 0
                        H_M2 = -np.sum(p2 * np.log2(p2 + 1e-15)) if np.sum(e2) > 1e-10 else 0
                        H_comb = -np.sum(p_comb * np.log2(p_comb + 1e-15)) if np.sum(e_comb) > 1e-10 else 0

                        mi = H_M1 + H_M2 - H_comb
                        if 0 <= mi < min_info:
                            min_info = mi
            phi = H_Y - min_info if min_info < float('inf') else H_Y
            return max(0.0, min(5.0, float(phi)))
        except np.linalg.LinAlgError:
            return 0.0

    def get_awareness_level(self) -> float:
        values = []
        for ch in self.channels.values():
            values.append(ch.entropy())
            values.append(ch.complexity())
        if not values:
            return 0.0
        mean_val = float(np.mean(values)) if values else 0.0
        scaled = mean_val / (max(1.0, math.log2(10)))
        n_channels_active = sum(1 for ch in self.channels.values() if ch.entropy() > 0.5)
        active_factor = n_channels_active / max(1, len(self.channels))
        phi_factor = min(1.0, self.current_phi / 2.0)
        awareness = 0.4 * min(1.0, scaled) + 0.3 * active_factor + 0.3 * phi_factor
        return max(0.0, min(1.0, awareness))

    def _update_integration_matrix(self, state_vec: np.ndarray) -> None:
        n = min(len(state_vec), self.num_channels)
        if n < 2:
            return
        for i in range(n):
            for j in range(n):
                if i != j:
                    diff = abs(state_vec[i] - state_vec[j]) / (abs(state_vec[i]) + abs(state_vec[j]) + 1e-10)
                    coupling = 1.0 - min(1.0, diff)
                    self.integration_matrix[i, j] = 0.95 * self.integration_matrix[i, j] + 0.05 * coupling

    def _compute_pci(self) -> float:
        if self.step_count < 10:
            return 0.0
        vals = []
        for ch in self.channels.values():
            vals.append(ch.complexity())
        if not vals:
            return 0.0
        baseline = np.mean(vals)
        integration = float(np.mean(self.integration_matrix))
        return baseline * integration * self.num_channels

    def _compute_workspace_occupancy(self) -> float:
        active = 0
        for ch in self.channels.values():
            if ch.entropy() > 0.3 and ch.complexity() > 0.1:
                active += 1
        return active / max(1, len(self.channels))

    def detect_state_changes(self) -> List[Dict]:
        changes = []
        if len(self.awareness_history) < 10:
            return changes
        mid = len(self.awareness_history) // 2
        first_half = self.awareness_history[:mid]
        second_half = self.awareness_history[mid:]
        if len(first_half) < 3 or len(second_half) < 3:
            return changes
        avg_first = float(np.mean(first_half))
        avg_second = float(np.mean(second_half))
        delta = avg_second - avg_first
        if abs(delta) > 0.1:
            avg_awareness = float(np.mean(second_half))
            if avg_awareness < 0.2:
                label = 'deep_sleep'
            elif avg_awareness < 0.4:
                label = 'light_sleep'
            elif avg_awareness < 0.55:
                label = 'drowsy'
            elif avg_awareness < 0.75:
                label = 'awake'
            else:
                label = 'hyper_aware'
            if not self.state_labels or self.state_labels[-1] != label:
                self.state_labels.append(label)
                changes.append({
                    'timestamp': time.time(),
                    'from_state': self.state_labels[-2] if len(self.state_labels) >= 2 else 'unknown',
                    'to_state': label,
                    'awareness': round(float(second_half[-1]), 4),
                    'step': self.step_count
                })
        return changes

    def get_state(self) -> dict:
        ch_summary = {}
        for name, ch in self.channels.items():
            ch_summary[name] = {
                'mean': round(ch.mean(), 4),
                'std': round(ch.std(), 4),
                'entropy': round(ch.entropy(), 4),
                'complexity': round(ch.complexity(), 4)
            }
        return {
            'module': 'consciousness_monitor',
            'class': 'ConsciousnessMonitor',
            'num_channels': self.num_channels,
            'phi': round(self.current_phi, 4),
            'awareness_level': round(self.current_awareness, 4),
            'workspace_occupancy': round(self.current_workspace_occ, 4),
            'perturbational_complexity': round(self.perturbational_complexity, 4),
            'channels': ch_summary,
            'state_labels': self.state_labels[-5:],
            'detected_transitions': len(self.detected_states),
            'phi_history_avg': round(float(np.mean(self.phi_history[-20:])), 4) if self.phi_history else 0.0,
            'awareness_history_avg': round(float(np.mean(self.awareness_history[-20:])), 4) if self.awareness_history else 0.0,
            'step_count': self.step_count
        }


SLEEP_STATES = [
    {'C0': 0.1, 'C1': 0.05, 'C2': 0.08, 'C3': 0.02, 'C4': 0.03, 'C5': 0.01, 'C6': 0.0, 'C7': 0.0},
    {'C0': 0.2, 'C1': 0.15, 'C2': 0.18, 'C3': 0.1, 'C4': 0.12, 'C5': 0.08, 'C6': 0.05, 'C7': 0.03},
    {'C0': 0.4, 'C1': 0.35, 'C2': 0.3, 'C3': 0.25, 'C4': 0.2, 'C5': 0.15, 'C6': 0.1, 'C7': 0.08},
    {'C0': 0.6, 'C1': 0.55, 'C2': 0.5, 'C3': 0.45, 'C4': 0.4, 'C5': 0.35, 'C6': 0.3, 'C7': 0.25},
    {'C0': 0.9, 'C1': 0.85, 'C2': 0.8, 'C3': 0.75, 'C4': 0.7, 'C5': 0.65, 'C6': 0.6, 'C7': 0.55},
]
STATE_NAMES = ['deep_sleep', 'light_sleep', 'drowsy', 'awake', 'hyper_aware']


def run_tests():
    cm = ConsciousnessMonitor(num_channels=8)
    tests_passed = 0

    for state_idx, signals in enumerate(SLEEP_STATES):
        for _ in range(15):
            noisy = {k: v + np.random.normal(0, 0.03) for k, v in signals.items()}
            noisy = {k: max(0.0, min(1.0, v)) for k, v in noisy.items()}
            cm.update(noisy)

    assert len(cm.phi_history) >= 75, f"Expected at least 75 phi samples, got {len(cm.phi_history)}"
    tests_passed += 1

    assert len(cm.detected_states) > 0, "Should have detected at least one state change"
    tests_passed += 1

    assert cm.current_awareness >= 0.0 and cm.current_awareness <= 1.0, f"Awareness out of range: {cm.current_awareness}"
    tests_passed += 1

    state_vec = cm._build_state_vector()
    phi = cm.compute_phi(state_vec)
    assert phi >= 0.0, f"Phi should be non-negative, got {phi}"
    tests_passed += 1

    assert cm.current_workspace_occ >= 0.0 and cm.current_workspace_occ <= 1.0, f"Workspace occ out of range: {cm.current_workspace_occ}"
    tests_passed += 1

    return {
        'status': 'ok',
        'summary': f'ConsciousnessMonitor tests passed: {tests_passed}/5. Phi range: [{min(cm.phi_history):.3f}, {max(cm.phi_history):.3f}], Awareness range: [{min(cm.awareness_history):.3f}, {max(cm.awareness_history):.3f}], States detected: {len(cm.detected_states)}',
        'state': cm.get_state()
    }


if __name__ == '__main__':
    if len(sys.argv) == 1:
        result = run_tests()
        print(json.dumps(result))
    elif sys.argv[1] == 'state':
        obj = ConsciousnessMonitor()
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'step':
        obj = ConsciousnessMonitor()
        obj.update({'C0': 0.5, 'C1': 0.5, 'C2': 0.5, 'C3': 0.5, 'C4': 0.5, 'C5': 0.5, 'C6': 0.5, 'C7': 0.5})
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
    elif sys.argv[1] == 'event':
        payload = json.loads(sys.argv[2])
        obj = ConsciousnessMonitor()
        obj.update(payload.get('signals', {}))
        print(json.dumps({'status': 'ok', 'state': obj.get_state()}))
