const { AutonomyGraph } = require('./gsk-core/brain/autonomy_graph.js');
const { BeautifulLoop } = require('./gsk-core/brain/beautiful_loop.js');

// Minimal mock kernel
const mockKernel = {
    brain: {
        think: async (p) => 'Mock insight: ' + p.slice(0, 50)
    },
    consciousnessLoop: { energy: { level: 1, restThreshold: 0.3 } },
    consciousness: { researcher: null, soulJournal: null },
    systems: { knowledgeGraph: null }
};

const beautifulLoop = new BeautifulLoop(mockKernel);
const graph = new AutonomyGraph(mockKernel, { beautifulLoop });

// Test a simple cycle with minimal state
async function test() {
    const result = await graph.runCycle({
        projectRoot: 'C:/Users/uncom/Desktop/buyasoul-cpl-fresh',
        onPhaseChange: (e) => console.log('[Phase]', e.phase, 'status:', e.state?.status || 'running')
    });

    console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);