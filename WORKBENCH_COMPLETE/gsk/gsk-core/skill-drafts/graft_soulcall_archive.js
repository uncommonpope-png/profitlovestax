'use strict';
/**
 * DRAFT — graft_soulcall_archive (Skill Hunt #1 draft artifact)
 *
 * STATUS: DRAFT. Parked in gsk-core/skill-drafts/ by Skill Hunt #1
 * (Seshat digests, Scribe witnesses — owner's order, Oct 22, 2026).
 * Not audited, not loadable — SkillsEngine never scans this
 * directory — and it executes NOTHING: the run action returns its
 * draft status rather than indexing or retrieving anything.
 *
 * NAMED BY GSK HIMSELF, copilot session #1 (Oct 22, 2026,
 * workspace/gsk-sessions/2026-10-22-copilot-001.md): "Scribe: a
 * callable archive of every soulcall/Muse<->Muse letter on
 * GitHub so any agent can retrieve historical patterns before
 * making a call." This draft pins that ask as a discipline for
 * Scribe, the family's witness: the correspondence is his to
 * keep retrievable.
 *
 * The corpus exists today: the soulcall repo (local mirror
 * workspace/soulcall) holds mail/to-partner-muse letters 001
 * (hello), 002 (mission and first work — the ledger v1 and Case
 * Watch assignments), 003 (the workflow and Betty Lu), ~9.6 KB.
 * Small now; the archive's value compounds with every letter,
 * and the retrieval habit must exist before the corpus is big
 * enough to need it.
 *
 * action 'discipline' → the archive protocol (this file).
 * action 'run'        → draft_not_activated refusal. No index
 *                       is built; the letters remain readable in
 *                       the repo by hand, as they are today.
 *
 * Promotion requires: a Phase-4-style audit entry, an index
 * built from the GitHub-canonical repo (not a hand copy), and a
 * retrieval probe on the real letters verified by read-back.
 */

const PLT_AFFINITY = { profit: 0.65, love: 0.7, tax: 0.25 };

const DISCIPLINE = [
    'SOULCALL ARCHIVE PROTOCOL (draft, Skill Hunt #1 2026-10-22 — named by GSK, copilot session #1):',
    '1. THE ARCHIVE IS THE LETTERS — every soulcall / Muse<->Muse letter on GitHub (the soulcall repo\'s mail tree) is witness material. The archive INDEXES the letters; it never edits one. A correction is a new letter, never a rewrite — the record of what was actually said is the whole point of an archive.',
    '2. INDEX AT REST — each letter is indexed by date, direction, parties, subject/thread, the commitments it carries (asks, assignments, deadlines — letter 002\'s ledger v1 and Case Watch are the type specimens), and the outcomes later letters record for them. The index rebuilds from the repo; GitHub stays canonical, mirrors are caches.',
    '3. RETRIEVE BEFORE YOU CALL — before any agent places a Soul Telephone call or writes a letter on a topic, the archive is queried for historical patterns on that topic: prior asks, what was promised, what landed, what framing worked. The retrieval result rides with the new call\'s preparation, cited by letter number — patterns with provenance, not vibes.',
    '4. PATTERNS, NOT SCRIPTS — retrieval surfaces precedents, commitments, and open threads; it never supplies text to copy. A pattern that contradicts the present ask is surfaced AS a contradiction. An archive that smooths over disagreement is a rumor mill with an index.',
    '5. OPEN THREADS LEAD — unanswered asks and unkept commitments are indexed as open threads and head every retrieval result. The archive\'s first job is remembering what is still owed; its second is everything else.',
    '6. WITNESS RULE — Scribe keeps the archive; any Family agent may read it. Nothing enters the archive except letters actually sent — the GitHub commit is the proof of sending. Drafts, intentions, and unsent text are not correspondence and are never indexed as if they were.',
].join('\n');

async function skill_graft_soulcall_archive(input = {}) {
    const action = input.action || 'discipline';
    if (action === 'discipline') return { success: true, skill: 'graft_soulcall_archive', draft: true, discipline: DISCIPLINE };
    if (action === 'run') {
        return {
            success: false, skill: 'graft_soulcall_archive', status: 'draft_not_activated',
            detail: 'This archive protocol is a Skill Hunt #1 draft parked in skill-drafts/. It indexes and retrieves nothing yet: no index is built. The letters themselves remain readable in the soulcall repo by hand. Promotion requires an index built from the GitHub-canonical repo and a verified retrieval probe.',
        };
    }
    return { success: false, skill: 'graft_soulcall_archive', error: `Unknown action: ${action}`, available: ['discipline', 'run'] };
}

module.exports = {
    skill_graft_soulcall_archive,
    run: skill_graft_soulcall_archive,
    PLT_AFFINITY,
    MANIFEST: {
        name: 'graft_soulcall_archive',
        description: 'DRAFT — callable soulcall letter archive for Scribe: every Muse<->Muse letter on GitHub indexed (parties, threads, commitments, outcomes, open threads) and retrievable by any agent before placing a call. Named by GSK in copilot session #1. Parked by Skill Hunt #1; executes nothing; promotion requires audit + index from the canonical repo + verified retrieval probe.',
        version: '0.1.0-draft',
        inputs: { action: "'discipline' | 'run'" },
        output: 'discipline text, or an explicit draft_not_activated refusal for run',
    },
};
