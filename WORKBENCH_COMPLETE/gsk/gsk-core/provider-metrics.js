// Provider Metrics Data Schema & Mock Generator
// Tracks: usage (requests), latency (ms), cost ($) per provider

export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', color: 0x412991 },
  { id: 'anthropic', name: 'Anthropic', color: 0xD4AA00 },
  { id: 'google', name: 'Google', color: 0x4285F4 },
  { id: 'cohere', name: 'Cohere', color: 0xFF6F00 },
  { id: 'local', name: 'Local/Ollama', color: 0x00C853 }
];

export function generateMockMetrics() {
  return PROVIDERS.map(p => ({
    provider: p.id,
    name: p.name,
    color: p.color,
    usage: Math.floor(Math.random() * 10000) + 100,
    latency: Math.floor(Math.random() * 2000) + 50,
    cost: Number((Math.random() * 50 + 0.5).toFixed(2)),
    timestamp: Date.now()
  }));
}

export function calculateTotals(metrics) {
  return metrics.reduce((acc, m) => ({
    usage: acc.usage + m.usage,
    latency: acc.latency + m.latency,
    cost: acc.cost + m.cost
  }), { usage: 0, latency: 0, cost: 0 });
}