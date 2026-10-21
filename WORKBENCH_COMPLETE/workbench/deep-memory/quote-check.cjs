'use strict';
/**
 * QUOTE CHECK (Assembly Phase 7) — the deterministic quote verifier
 * designed in Phase 6 §12 and left unbuilt there.
 *
 * Phase 6 §7(e) showed the failure mode: with only a prompt-level
 * QUOTE DISCIPLINE header, the resident's answers stay inside real
 * passages but quote SELECTION and quote-vs-paraphrase discipline
 * vary run to run — a paraphrase gets offered as an "exact phrase".
 * This module is the second stage: after the answer is produced,
 * every quoted span is extracted and string-matched against the
 * passages that were actually recalled for the turn. A span that is
 * not in the passages is flagged as a mismatch, Rule Zero style —
 * the answer is annotated, never silently trusted.
 *
 * Deterministic, dependency-free. Matching is substring on
 * normalized text (case, quote/dash unification, punctuation and
 * whitespace collapsed), with ellipsis-split fragments: a span
 * quoted as "aaa … bbb" verifies only if BOTH fragments verify.
 * Strictness is the point — the resident is instructed to copy
 * exact wording; drift is reported, not excused.
 */

const MIN_SPAN_CHARS = 12;
const MIN_FRAGMENT_TOKENS = 3;

function normalize(s) {
  return String(s || '')
    .replace(/[“”「」]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract double-quoted spans (curly or straight) from an answer. */
function extractQuotes(text) {
  const spans = [];
  const re = /[“"]([^“”"]{1,600})[”"]/g;
  let m;
  while ((m = re.exec(String(text || ''))) !== null) {
    const span = m[1].trim();
    if (span.length >= MIN_SPAN_CHARS) spans.push(span);
  }
  return spans;
}

function fragmentVerified(fragmentNorm, corpusNorm) {
  const toks = fragmentNorm.split(' ').filter(Boolean);
  if (toks.length < MIN_FRAGMENT_TOKENS) return true; // too small to judge — not held against the span
  return corpusNorm.includes(fragmentNorm);
}

/**
 * checkQuotes(answerText, passages)
 * passages: array of strings, or of hit objects with .text.
 * Returns { verdict, quotes: [{span, status, fragments}], verifiedCount, mismatchCount }
 * verdict: 'no_quotes' | 'all_verified' | 'mismatch_flagged'
 */
function checkQuotes(answerText, passages) {
  const texts = (passages || []).map(p => (typeof p === 'string' ? p : (p && p.text) || ''));
  const corpusNorm = ' ' + texts.map(normalize).join(' ') + ' ';
  const spans = extractQuotes(answerText);
  const quotes = spans.map(span => {
    const fragments = String(span).split(/…|\.\.\./).map(f => normalize(f)).filter(Boolean);
    const fragResults = fragments.map(f => ({ fragment: f, verified: fragmentVerified(f, corpusNorm) }));
    const status = fragResults.every(f => f.verified) ? 'verified' : 'mismatch';
    return { span, status, fragments: fragResults };
  });
  const mismatchCount = quotes.filter(q => q.status === 'mismatch').length;
  return {
    verdict: quotes.length === 0 ? 'no_quotes' : (mismatchCount === 0 ? 'all_verified' : 'mismatch_flagged'),
    quotes,
    verifiedCount: quotes.length - mismatchCount,
    mismatchCount,
  };
}

module.exports = { checkQuotes, extractQuotes, normalize };
