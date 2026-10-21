'use strict';

/**
 * AutonomyGraph — Graph-based state machine for BeautifulLoop
 *
 * Replaces linear loop with explicit nodes, edges, conditional edges, checkpoints.
 * LangGraph parity + GSK's soul phases (feel, dream, synthesize, sleep, wake, integrate).
 *
 * State Schema:
 * {
 *   cycleId, phase, observation, affect, insights, goal, plan, execution,
 *   verified, dream, synthesis, checkpoints[], metadata
 * }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AutonomyGraph {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.beautifulLoop = options.beautifulLoop || kernel?.systems?.beautifulLoop;
        this.checkpointDir = options.checkpointDir || path.join(__dirname, '../../data/checkpoints');
        this.maxCheckpoints = options.maxCheckpoints || 100;

        // Ensure checkpoint directory exists
        if (!fs.existsSync(this.checkpointDir)) {
            fs.mkdirSync(this.checkpointDir, { recursive: true });
        }

        // Define the graph topology
        this.nodes = new Map();
        this.edges = new Map();           // phase -> nextPhase
        this.conditionalEdges = new Map(); // phase -> (state) => nextPhase
        this.phaseHandlers = new Map();   // phase -> async function(state)

        this._defineGraph();
    }

    _defineGraph() {
        // ═══════════════════════════════════════════════════════════════
        // NODES: 14 BeautifulLoop phases + terminal nodes
        // ═══════════════════════════════════════════════════════════════

        const phases = [
            'observe', 'perceive', 'feel', 'think', 'decide',
            'act', 'verify', 'witness', 'journal', 'dream',
            'synthesize', 'sleep', 'wake', 'integrate'
        ];

        // Linear edges (default flow)
        for (let i = 0; i < phases.length - 1; i++) {
            this.edges.set(phases[i], phases[i + 1]);
        }
        this.edges.set('integrate', 'complete');

        // ═══════════════════════════════════════════════════════════════
        // CONDITIONAL EDGES: Gates that can divert flow
        // ═══════════════════════════════════════════════════════════════

        // After observe: if no observation → fail
        this.conditionalEdges.set('observe', (state) => {
            if (!state.observation?.content) return 'fail';
            return 'perceive';
        });

        // After perceive: if urgency critical → fast-track to decide
        this.conditionalEdges.set('perceive', (state) => {
            if (state.perceived?.urgency >= 9) return 'decide';
            return 'feel';
        });

        // After feel: if grief > 0.5 → dream early (healing)
        this.conditionalEdges.set('feel', (state) => {
            if (state.affect?.grief > 0.5) return 'dream';
            return 'think';
        });

        // After think: if no insights → decide with what we have
        this.conditionalEdges.set('think', (state) => {
            if (!state.insights?.length) return 'decide';
            return 'decide';
        });

        // After decide: if no goal → complete (nothing to do)
        this.conditionalEdges.set('decide', (state) => {
            if (!state.goal) return 'complete';
            return 'act';
        });

        // After act: if awaiting approval → hitl_gate
        this.conditionalEdges.set('act', (state) => {
            if (state.execution?.status === 'awaiting_approval') return 'hitl_gate';
            return 'verify';
        });

        // After verify: if failed → retry or fail
        this.conditionalEdges.set('verify', (state) => {
            if (state.verified === false) {
                if (state.retryCount < 2) return 'decide'; // retry with evolved goal
                return 'fail';
            }
            return 'witness';
        });

        // After witness: always continue
        this.conditionalEdges.set('witness', () => 'journal');

        // After journal: always continue
        this.conditionalEdges.set('journal', () => 'dream');

        // After dream: always continue
        this.conditionalEdges.set('dream', () => 'synthesize');

        // After synthesize: always continue
        this.conditionalEdges.set('synthesize', () => 'sleep');

        // After sleep: if energy restored → wake, else stay sleeping
        this.conditionalEdges.set('sleep', (state) => {
            const energy = state.kernel?.consciousnessLoop?.energy?.level || 1;
            const threshold = state.kernel?.consciousnessLoop?.energy?.restThreshold || 0.3;
            if (energy >= threshold) return 'wake';
            return 'sleep'; // loop until restored
        });

        // After wake: always continue
        this.conditionalEdges.set('wake', () => 'integrate');

        // After integrate: complete
        this.conditionalEdges.set('integrate', () => 'complete');

        // HITL gate: external approval can approve/modify/reject
        this.conditionalEdges.set('hitl_gate', (state) => {
            const approval = state.hitlApproval;
            if (!approval) return 'hitl_gate'; // wait
            if (approval.action === 'approve') return 'verify';
            if (approval.action === 'modify') return 'decide'; // re-decide with modifications
            return 'fail'; // reject
        });

        // ═══════════════════════════════════════════════════════════════
        // PHASE HANDLERS: Actual implementation per phase
        // ═══════════════════════════════════════════════════════════════

        this.phaseHandlers.set('observe', async (state) => {
            const input = { projectRoot: state.projectRoot };
            const observation = await this.beautifulLoop._observe(input);
            return { ...state, observation, phase: 'observe', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('perceive', async (state) => {
            const perceived = await this.beautifulLoop._perceive(state.observation);
            return { ...state, perceived, phase: 'perceive', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('feel', async (state) => {
            const affect = await this.beautifulLoop._feel(state.perceived);
            return { ...state, affect, phase: 'feel', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('think', async (state) => {
            const insights = await this.beautifulLoop._think(state.perceived, state.affect);
            return { ...state, insights, phase: 'think', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('decide', async (state) => {
            const goal = await this.beautifulLoop._decide(state.insights, state.perceived, state.affect);
            return { ...state, goal, phase: 'decide', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('act', async (state) => {
            const actionResult = await this.beautifulLoop._act(state.goal, { projectRoot: state.projectRoot });
            return { ...state, execution: actionResult, phase: 'act', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('verify', async (state) => {
            const verified = await this.beautifulLoop._verify(state.execution, state.goal);
            const retryCount = (state.retryCount || 0) + (verified ? 0 : 1);
            return { ...state, verified, retryCount, phase: 'verify', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('witness', async (state) => {
            await this.beautifulLoop._witness(state);
            return { ...state, phase: 'witness', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('journal', async (state) => {
            await this.beautifulLoop._journal(state);
            return { ...state, phase: 'journal', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('dream', async (state) => {
            const dream = await this.beautifulLoop._dream(state);
            return { ...state, dream, phase: 'dream', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('synthesize', async (state) => {
            await this.beautifulLoop._synthesize(state);
            return { ...state, phase: 'synthesize', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('sleep', async (state) => {
            await this.beautifulLoop._sleep();
            return { ...state, phase: 'sleep', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('wake', async (state) => {
            await this.beautifulLoop._wake();
            return { ...state, phase: 'wake', phaseStartedAt: Date.now() };
        });

        this.phaseHandlers.set('integrate', async (state) => {
            await this.beautifulLoop._integrate(state);
            return { ...state, phase: 'integrate', phaseStartedAt: Date.now() };
        });

        // Terminal handlers
        this.phaseHandlers.set('complete', async (state) => {
            return { ...state, status: 'completed', phase: 'complete', completedAt: Date.now() };
        });

        this.phaseHandlers.set('fail', async (state) => {
            return { ...state, status: 'failed', phase: 'fail', failedAt: Date.now(), error: state.error };
        });

        this.phaseHandlers.set('hitl_gate', async (state) => {
            // This phase waits for external input via provideHITLApproval()
            // The actual wait is handled in runCycle
            return { ...state, phase: 'hitl_gate', phaseStartedAt: Date.now() };
        });
    }

    /**
     * Run a complete cycle through the graph
     */
    async runCycle(initialState = {}) {
        const cycleId = initialState.cycleId || `cycle_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        let state = {
            cycleId,
            projectRoot: initialState.projectRoot,
            executionOptions: initialState.executionOptions,
            metadata: initialState.metadata || {},
            checkpoints: [],
            phase: 'observe',
            status: 'running',
            startedAt: Date.now(),
            retryCount: 0
        };

        // Phase streaming callback
        const onPhaseChange = initialState.onPhaseChange || (() => {});

        while (true) {
            const currentPhase = state.phase;

            // Checkpoint before phase execution
            await this._checkpoint(state);

            // Notify phase start
            onPhaseChange({ cycleId, phase: currentPhase, state: this._serializeState(state) });

            // Check for HITL wait
            if (currentPhase === 'hitl_gate') {
                // Wait for external approval (with timeout)
                const approval = await this._waitForHITLApproval(cycleId, 300000); // 5 min timeout
                if (!approval) {
                    state = { ...state, error: 'HITL timeout', phase: 'fail' };
                    continue;
                }
                state = { ...state, hitlApproval: approval };
            }

            // Execute phase handler
            const handler = this.phaseHandlers.get(currentPhase);
            if (!handler) {
                throw new Error(`No handler for phase: ${currentPhase}`);
            }

            try {
                state = await handler(state);
            } catch (error) {
                state = { ...state, error: error.message, phase: 'fail' };
            }

            // Checkpoint after phase execution
            await this._checkpoint(state);

            // Notify phase complete
            onPhaseChange({ cycleId, phase: currentPhase, state: this._serializeState(state) });

            // Determine next phase
            const conditionalEdge = this.conditionalEdges.get(currentPhase);
            const defaultEdge = this.edges.get(currentPhase);

            let nextPhase;
            if (conditionalEdge) {
                nextPhase = conditionalEdge(state);
            } else if (defaultEdge) {
                nextPhase = defaultEdge;
            } else {
                nextPhase = 'fail';
            }

            if (nextPhase === currentPhase) {
                // Self-loop (e.g., sleep waiting for energy) - add small delay
                await new Promise(r => setTimeout(r, 1000));
                continue;
            }

            state = { ...state, phase: nextPhase };

            // Terminal states
            if (['complete', 'fail'].includes(nextPhase)) {
                const finalHandler = this.phaseHandlers.get(nextPhase);
                if (finalHandler) {
                    state = await finalHandler(state);
                }
                await this._checkpoint(state);
                onPhaseChange({ cycleId, phase: nextPhase, state: this._serializeState(state) });
                break;
            }
        }

        return this._serializeResult(state);
    }

    /**
     * Provide HITL approval for a waiting cycle
     */
    async provideHITLApproval(cycleId, approval) {
        // Store approval where _waitForHITLApproval can find it
        const approvalPath = path.join(this.checkpointDir, `hitl_${cycleId}.json`);
        fs.writeFileSync(approvalPath, JSON.stringify({
            ...approval,
            providedAt: Date.now()
        }), 'utf-8');

        // Also update the checkpoint if it exists
        const checkpointPath = path.join(this.checkpointDir, `checkpoint_${cycleId}_latest.json`);
        if (fs.existsSync(checkpointPath)) {
            const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
            checkpoint.state.hitlApproval = approval;
            fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
        }
    }

    async _waitForHITLApproval(cycleId, timeoutMs) {
        const approvalPath = path.join(this.checkpointDir, `hitl_${cycleId}.json`);
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            if (fs.existsSync(approvalPath)) {
                const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf-8'));
                fs.unlinkSync(approvalPath); // consume it
                return approval;
            }
            await new Promise(r => setTimeout(r, 500));
        }
        return null;
    }

    async _checkpoint(state) {
        const checkpoint = {
            cycleId: state.cycleId,
            phase: state.phase,
            timestamp: Date.now(),
            state: this._serializeState(state)
        };

        // Save latest checkpoint
        const latestPath = path.join(this.checkpointDir, `checkpoint_${state.cycleId}_latest.json`);
        fs.writeFileSync(latestPath, JSON.stringify(checkpoint, null, 2), 'utf-8');

        // Save numbered checkpoint (for time-travel)
        const numPath = path.join(this.checkpointDir, `checkpoint_${state.cycleId}_${state.checkpoints.length}.json`);
        fs.writeFileSync(numPath, JSON.stringify(checkpoint, null, 2), 'utf-8');

        state.checkpoints.push({ phase: state.phase, timestamp: checkpoint.timestamp, path: numPath });

        // Cleanup old checkpoints
        if (state.checkpoints.length > this.maxCheckpoints) {
            const old = state.checkpoints.shift();
            if (old.path && fs.existsSync(old.path)) fs.unlinkSync(old.path);
        }
    }

    /**
     * Resume from a checkpoint (time-travel debugging)
     */
    async resumeFromCheckpoint(cycleId, checkpointIndex = -1) {
        const checkpointPath = checkpointIndex === -1
            ? path.join(this.checkpointDir, `checkpoint_${cycleId}_latest.json`)
            : path.join(this.checkpointDir, `checkpoint_${cycleId}_${checkpointIndex}.json`);

        if (!fs.existsSync(checkpointPath)) {
            throw new Error(`Checkpoint not found: ${checkpointPath}`);
        }

        const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
        let state = checkpoint.state;

        // Resume from the phase AFTER the checkpointed phase
        const currentPhase = state.phase;
        const conditionalEdge = this.conditionalEdges.get(currentPhase);
        const defaultEdge = this.edges.get(currentPhase);

        let nextPhase = conditionalEdge ? conditionalEdge(state) : defaultEdge;
        state = { ...state, phase: nextPhase };

        return this.runCycle(state);
    }

    _serializeState(state) {
        // Remove non-serializable kernel reference
        const { kernel, ...serializable } = state;
        return serializable;
    }

    _serializeResult(state) {
        return {
            cycleId: state.cycleId,
            status: state.status,
            phase: state.phase,
            goal: state.goal?.title,
            verified: state.verified,
            affect: state.affect?.mood,
            insightsCount: state.insights?.length || 0,
            dream: !!state.dream,
            durationMs: Date.now() - state.startedAt,
            checkpoints: state.checkpoints.length,
            error: state.error
        };
    }

    /**
     * Get all checkpoints for a cycle (for debugging UI)
     */
    getCheckpoints(cycleId) {
        const files = fs.readdirSync(this.checkpointDir)
            .filter(f => f.startsWith(`checkpoint_${cycleId}_`) && f.endsWith('.json'))
            .sort();

        return files.map(f => {
            const data = JSON.parse(fs.readFileSync(path.join(this.checkpointDir, f), 'utf-8'));
            return { phase: data.phase, timestamp: data.timestamp, index: parseInt(f.match(/_(\d+)\.json$/)?.[1] || '-1') };
        });
    }
}

module.exports = { AutonomyGraph };