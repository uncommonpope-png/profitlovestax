'use strict';
/**
 * GRAFT — LOOK SQUEEZE (Make-Him-Better, quality-per-judge-call)
 *
 * Front 1's loop (graft_look_loop) revises until the bar or the cap,
 * spending a judge call on every round and keeping only the last
 * artifact. The squeeze keeps the same eyes but spends them like
 * money:
 *
 *     RENDER+JUDGE → pass? done (wasted 0)
 *                  → else REVISE → RENDER+JUDGE → …
 *     stop when a round fails to beat the best total so far
 *     (sum of the four criteria), or at 4 search rounds total.
 *
 * Every candidate (the original + each revision) is kept as a file
 * and ranked: passing-the-bar first, then total, then fewest
 * below-bar criteria, then earliest. The best candidate is verified
 * by ONE final render+judge — the metrics round — whose scores are
 * the report; the chosen candidate is not judged again after it.
 * The only wasted judge calls are the stop-rule round (the first
 * non-improving round, bought to learn there was nothing more) and
 * the metrics round (re-judging a known candidate for the record) —
 * both are counted, by name, in the result.
 *
 * Engine: ../brain/look_loop.js (render/judge/revise are Front 1's,
 * reused untouched). If any round comes back UNSEEN, the squeeze
 * says so and stops — an unjudged candidate is never ranked.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { lookLoop, reviseArtifact, passesBar, BAR } = require('../brain/look_loop.js');

const PLT_AFFINITY = { profit: 0.9, love: 0.4, tax: 0.2 };
const MAX_SEARCH_ROUNDS = 4; // initial + up to 3 revisions, as Front 1

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const totalScore = (scores) => Object.keys(BAR).reduce((a, k) => a + (typeof scores[k] === 'number' ? scores[k] : 0), 0);
const belowBarCount = (scores) => Object.keys(BAR).filter(k => !(typeof scores[k] === 'number' && scores[k] >= BAR[k])).length;

function rankCandidates(candidates) {
    return [...candidates].sort((a, b) =>
        (Number(b.passed) - Number(a.passed))
        || (b.total - a.total)
        || (a.belowBarCount - b.belowBarCount)
        || (a.index - b.index));
}

function extractVerdict(v) {
    if (!v || v.seen === false) return null;
    const round0 = (v.rounds || []).find(r => r && r.scores) || {};
    const scores = v.finalScores || round0.scores || null;
    if (!scores) return null;
    return {
        scores,
        reasons: v.finalReasons || round0.reasons || {},
        critique: v.finalCritique || round0.critique || [],
        screenshots: v.screenshots || round0.shots || null,
        contactSheet: round0.contactSheet || null,
    };
}

async function runSqueeze(input = {}, deps = {}) {
    const judge = deps.lookLoop || lookLoop;
    const revise = deps.reviseArtifact || reviseArtifact;
    const htmlPath = input.htmlPath ? path.resolve(String(input.htmlPath)) : null;
    const brief = String(input.brief || input.task || '');
    const maxRounds = Math.max(1, Math.min(MAX_SEARCH_ROUNDS, Number(input.maxRounds || input.maxSearchRounds) || MAX_SEARCH_ROUNDS));
    if (!htmlPath || !fs.existsSync(htmlPath)) {
        return { success: false, seen: false, status: 'unseen', error: 'html_file_not_found', detail: `no HTML artifact at ${htmlPath}`, rounds: [], ranking: [] };
    }
    const outDir = input.outDir ? path.resolve(String(input.outDir)) : path.join(path.dirname(htmlPath), 'look-squeeze');
    const candDir = path.join(outDir, 'candidates');
    fs.mkdirSync(candDir, { recursive: true });

    // Candidates live as files; the source artifact is not mutated
    // until the winner is known.
    let currentHtml = fs.readFileSync(htmlPath, 'utf8');
    let currentPath = path.join(candDir, 'candidate-0.html');
    fs.writeFileSync(currentPath, currentHtml);

    const candidates = [];
    let stopReason = null;
    let revisionError = null;
    let unseen = null;

    for (let i = 0; i < maxRounds; i++) {
        const verdict = await judge({ htmlPath: currentPath, brief, outDir: path.join(outDir, `round-${i}`), maxRevisions: 0 });
        const ex = extractVerdict(verdict);
        if (!ex) {
            unseen = { error: (verdict && verdict.error) || 'judge_unavailable', detail: (verdict && verdict.detail) || 'the candidate came back unjudged', round: i };
            stopReason = 'unseen';
            break;
        }
        const cand = {
            index: i, revision: i, path: currentPath, sha256: sha256(currentHtml),
            scores: ex.scores, total: +totalScore(ex.scores).toFixed(4),
            passed: passesBar(ex.scores), belowBarCount: belowBarCount(ex.scores),
            reasons: ex.reasons, critique: ex.critique, screenshots: ex.screenshots, contactSheet: ex.contactSheet,
        };
        candidates.push(cand);

        if (cand.passed) { stopReason = i === 0 ? 'passed_initial' : 'passed_bar'; break; }
        const bestBefore = Math.max(...candidates.slice(0, -1).map(c => c.total), -Infinity);
        if (i > 0 && cand.total <= bestBefore) { stopReason = 'no_improvement'; break; }
        if (i === maxRounds - 1) { stopReason = 'cap'; break; }

        const rev = await revise({ html: currentHtml, brief, judged: { scores: cand.scores, reasons: cand.reasons, critique: cand.critique } });
        if (!rev.success) { stopReason = 'revision_failed'; revisionError = rev.error || 'revision failed'; break; }
        currentHtml = rev.html;
        currentPath = path.join(candDir, `candidate-${i + 1}.html`);
        fs.writeFileSync(currentPath, currentHtml);
    }

    if (unseen) {
        return {
            success: false, seen: false, status: 'unseen', skill: 'graft_look_squeeze',
            error: unseen.error, detail: unseen.detail, brief, artifactPath: htmlPath,
            rounds: candidates, ranking: rankCandidates(candidates), stopReason,
            judgeCalls: { total: candidates.length + 1, wasted: 0, productive: candidates.length },
            report: `LOOK SQUEEZE: UNSEEN — round ${unseen.round} came back unjudged (${unseen.error}). No ranking is claimed past that round.`,
        };
    }
    if (candidates.length === 0) {
        return { success: false, seen: false, status: 'unseen', skill: 'graft_look_squeeze', error: 'no_candidates_judged', brief, artifactPath: htmlPath, rounds: [], ranking: [], stopReason, judgeCalls: { total: 0, wasted: 0, productive: 0 }, report: 'LOOK SQUEEZE: UNSEEN — no candidate was judged.' };
    }

    const ranking = rankCandidates(candidates);
    const chosen = ranking[0];

    // METRICS ROUND — the one verification render+judge of the best
    // candidate. Skipped only when the initial artifact passed as-is
    // (done, wasted 0). Its scores are the report.
    let metrics = null;
    let metricsUnseen = null;
    if (stopReason !== 'passed_initial') {
        const mv = await judge({ htmlPath: chosen.path, brief, outDir: path.join(outDir, 'metrics'), maxRevisions: 0 });
        const mex = extractVerdict(mv);
        if (!mex) {
            metricsUnseen = { error: (mv && mv.error) || 'judge_unavailable', detail: (mv && mv.detail) || 'the metrics round came back unjudged' };
        } else {
            metrics = {
                candidateIndex: chosen.index, scores: mex.scores, total: +totalScore(mex.scores).toFixed(4),
                passed: passesBar(mex.scores), reasons: mex.reasons, critique: mex.critique,
                screenshots: mex.screenshots, contactSheet: mex.contactSheet,
            };
        }
    }

    const searchJudgeCalls = candidates.length;
    const stopRuleWasted = stopReason === 'no_improvement' ? 1 : 0;
    const metricsWasted = metrics ? 1 : 0;
    const judgeCalls = {
        total: searchJudgeCalls + (metrics || metricsUnseen ? 1 : 0),
        wasted: stopRuleWasted + metricsWasted,
        productive: searchJudgeCalls - stopRuleWasted,
        stopRuleWasted, metricsWasted,
    };

    if (metricsUnseen) {
        return {
            success: false, seen: false, status: 'unseen', skill: 'graft_look_squeeze',
            error: 'metrics_unseen', detail: metricsUnseen.detail, brief, artifactPath: htmlPath,
            rounds: candidates, ranking, chosenIndex: chosen.index, stopReason, revisionError, judgeCalls,
            report: `LOOK SQUEEZE: UNSEEN — the metrics round on candidate ${chosen.index} came back unjudged (${metricsUnseen.error}); search scores stand in rounds, but no final verdict is claimed.`,
        };
    }

    // Land the winner on the source path (identical bytes to the
    // metrics-verified candidate file — no re-judge after this).
    let finalArtifactPath = htmlPath;
    if (chosen.path !== htmlPath) fs.copyFileSync(chosen.path, htmlPath);
    const finalScores = metrics ? metrics.scores : chosen.scores;
    const passed = metrics ? metrics.passed : chosen.passed;

    const result = {
        success: passed, seen: true, status: passed ? 'passed' : 'below_bar', skill: 'graft_look_squeeze',
        brief, artifactPath: htmlPath, finalArtifactPath,
        finalArtifactSha256: sha256(fs.readFileSync(htmlPath, 'utf8')),
        rounds: candidates, ranking, chosenIndex: chosen.index, chosenCandidate: chosen,
        stopReason, revisionError, metrics, finalScores,
        screenshots: metrics ? metrics.screenshots : chosen.screenshots,
        judgeCalls, bar: BAR,
    };
    result.report = formatReport(result);
    return result;
}

function formatReport(v) {
    const lines = [];
    lines.push(`LOOK SQUEEZE: ${String(v.status || '').toUpperCase()} — stop: ${v.stopReason} · judge calls ${v.judgeCalls.total} (wasted ${v.judgeCalls.wasted}: stop-rule ${v.judgeCalls.stopRuleWasted}, metrics ${v.judgeCalls.metricsWasted})`);
    for (const c of v.rounds) {
        lines.push(`  round ${c.index} (candidate ${c.index}): renders=${c.scores.renders} interaction=${c.scores.interaction} fidelity=${c.scores.fidelity} polish=${c.scores.polish} · total=${c.total}${c.passed ? ' — PASSED BAR' : ` — below bar ×${c.belowBarCount}`}`);
    }
    lines.push('  ranking (passing first → total → fewest below-bar → earliest):');
    v.ranking.forEach((c, r) => lines.push(`    #${r + 1} candidate ${c.index} — total ${c.total}, passed=${c.passed}, below-bar ×${c.belowBarCount}`));
    lines.push(`  chosen: candidate ${v.chosenIndex}`);
    if (v.metrics) lines.push(`  metrics round (candidate ${v.metrics.candidateIndex}): renders=${v.metrics.scores.renders} interaction=${v.metrics.scores.interaction} fidelity=${v.metrics.scores.fidelity} polish=${v.metrics.scores.polish} · total=${v.metrics.total}${v.metrics.passed ? ' — PASSED BAR' : ''} — THESE scores are the report`);
    if (v.revisionError) lines.push(`  revision error: ${v.revisionError}`);
    lines.push(`  final artifact: ${v.finalArtifactPath} (sha256 ${String(v.finalArtifactSha256 || '').slice(0, 12)}…)`);
    return lines.join('\n');
}

async function skill_graft_look_squeeze(input = {}, brain, memory) {
    const action = input.action || 'run';
    if (action === 'discipline') {
        return {
            success: true, skill: 'graft_look_squeeze',
            discipline: [
                'LOOK SQUEEZE — the look loop, spending judge calls like money:',
                '1. JUDGE ONCE PER CANDIDATE: render+judge the artifact (Front 1). A pass is done — wasted 0.',
                '2. REVISE ONLY AGAINST A NUMBER: each new round must beat the best total (sum of the four criteria) so far; the first round that fails to is the stop-rule round — paid for, counted as wasted, and the search ends.',
                '3. CAP 4 SEARCH ROUNDS. Every candidate is kept as a file; nothing is overwritten on the way.',
                '4. RANK BEFORE YOU TRUST: passing-the-bar first, then total, then fewest below-bar criteria, then earliest.',
                '5. ONE METRICS ROUND: the best candidate is render+judged once more and ITS scores are the report — the winner is never re-judged after selection, and the metrics call is counted as wasted on purpose.',
                '6. UNSEEN IS A VERDICT, NOT A PASS: a candidate that comes back unjudged stops the squeeze; it is never ranked on a guess.',
            ].join('\n'),
        };
    }
    if (action === 'run') return runSqueeze(input);
    return { success: false, skill: 'graft_look_squeeze', error: `Unknown action: ${action}`, available: ['run', 'discipline'] };
}

module.exports = {
    skill_graft_look_squeeze,
    run: skill_graft_look_squeeze,
    _runSqueeze: runSqueeze,
    _rankCandidates: rankCandidates,
    _totalScore: totalScore,
    _formatReport: formatReport,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_look_squeeze',
        description: 'Look squeeze (Make-Him-Better graft): the quality-per-judge-call form of the look loop. Render+judges the artifact (Front 1 engine); a pass is done with 0 wasted calls. Otherwise revises and re-judges while each round beats the best total (sum of renders/interaction/fidelity/polish), stopping at the first non-improving round or 4 search rounds. All candidates are kept as files and ranked (passing first → total → fewest below-bar → earliest); the best is verified by ONE final metrics render+judge whose scores are the report. Wasted judge calls (stop-rule round + metrics round) are counted by name. Any unjudged round → status "unseen", never ranked on a guess.',
        version: '1.0.0',
        inputs: { action: "'run' (default) | 'discipline'", htmlPath: 'path to the HTML artifact', brief: 'the commission brief', outDir: 'candidate/report directory (default: <artifact dir>/look-squeeze)', maxRounds: 'search-round cap, 1–4 (default 4)' },
        output: '{ success, status: passed|below_bar|unseen, rounds: [candidates with scores+totals], ranking, chosenIndex, metrics: {scores,...}|null, finalScores, judgeCalls: {total, wasted, productive, stopRuleWasted, metricsWasted}, stopReason, report }',
    },
};
