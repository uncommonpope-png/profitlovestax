const TelemetryStreamCompressor = require('./stream_compressor.js');
const compressor = new TelemetryStreamCompressor();
const payload = { cpu: 12.5, memory: 450, state: 'ACTIVE', telemetryFrame: Array(100).fill({ ok: true }) };
console.log('Pass 1 (Miss expected):', compressor.compress('visualizer_1', payload));
console.log('Pass 2 (Hit expected):', compressor.compress('visualizer_1', payload));
console.log('Pass 3 (Hit expected):', compressor.compress('visualizer_1', payload));
console.log('Metrics:', compressor.getMetrics());
