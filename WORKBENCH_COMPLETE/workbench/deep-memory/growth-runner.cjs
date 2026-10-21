'use strict';
/**
 * GROWTH RUNNER — the single command a scheduler runs
 * (Self-Growth Ignition, 2026-10-21).
 *
 *   node growth-runner.cjs run --spec <spec.cjs>
 *       Run one growth cycle from a spec module (export an object:
 *       { sources, build, judgeProof, draft, judge }). Prints the
 *       cycle record as JSON. Exit codes: 0 = clean cycle,
 *       2 = cycle completed with failures/refusals on record,
 *       1 = the runner itself failed.
 *
 *   node growth-runner.cjs recall-proof --marker <MARKER> [--query <text>]
 *       Fresh-process persistence proof: cold-loads deep-memory,
 *       refreshes the index, and searches for the marker. Exit 0
 *       when found, 3 when not. This is the "after a restart"
 *       half of the write-back claim — run it in a NEW process,
 *       after the cycle process has exited.
 */

const path = require('path');

async function main() {
    const [cmd, ...rest] = process.argv.slice(2);
    const arg = (name) => {
        const i = rest.indexOf('--' + name);
        return i >= 0 ? rest[i + 1] : null;
    };
    const { runCycle, recallProof } = require('./growth-cycle.cjs');

    if (cmd === 'run') {
        const specPath = arg('spec');
        if (!specPath) { console.error('usage: growth-runner.cjs run --spec <spec.cjs>'); process.exit(1); }
        const spec = require(path.resolve(specPath));
        const record = await runCycle(spec);
        console.log(JSON.stringify(record, null, 2));
        process.exit(record.status === 'clean' ? 0 : 2);
    }
    if (cmd === 'recall-proof') {
        const marker = arg('marker');
        if (!marker) { console.error('usage: growth-runner.cjs recall-proof --marker <MARKER> [--query <text>]'); process.exit(1); }
        const proof = recallProof(marker, arg('query') || marker);
        console.log(JSON.stringify(proof, null, 2));
        process.exit(proof.found ? 0 : 3);
    }
    console.error('usage: growth-runner.cjs <run|recall-proof> [options]');
    process.exit(1);
}

main().catch(e => { console.error('GROWTH RUNNER FAILED:', String(e && e.stack || e)); process.exit(1); });
