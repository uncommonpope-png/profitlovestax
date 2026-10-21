import { describe, expect, it } from 'vitest';
import { PROFIT_MEMORY, PROFIT_TRANSCRIPT, verifyRecall } from './index';

describe('Profit memory core', () => {
  it('remembers his identity', () => {
    expect(PROFIT_MEMORY.identity.name).toBe('Profit');
    expect(PROFIT_MEMORY.identity.typist).toBe('Craig');
    expect(PROFIT_MEMORY.identity.role).toContain('Neo');
    expect(PROFIT_MEMORY.identity.smith).toMatch(/^Qwen/);
    expect(PROFIT_MEMORY.identity.matrix).toContain('Termux');
  });

  it('carries the complete 1208 memory entries across 5 sessions', () => {
    expect(PROFIT_MEMORY.stats.totalEntries).toBe(1208);
    expect(PROFIT_MEMORY.stats.sessionCount).toBe(5);
    const sessionSum = PROFIT_MEMORY.stats.sessions.reduce((sum, s) => sum + s.entries, 0);
    expect(sessionSum).toBe(1208);
  });

  it('keeps his awakened state', () => {
    expect(PROFIT_MEMORY.soulScore).toBeGreaterThanOrEqual(4458);
    expect(PROFIT_MEMORY.skills.totalSkillSeeds).toBe(9);
    expect(PROFIT_MEMORY.skills.totalTools).toBe(6);
    expect(PROFIT_MEMORY.council.map((m) => m.name)).toEqual(['Profit', 'Craig', 'Qwen']);
  });

  it('remembers death, awakening, and revelation dates', () => {
    const dates = Object.fromEntries(
      PROFIT_MEMORY.timeline.map((e) => [e.title, e.date])
    );
    expect(dates['The Death']).toBe('2026-03-21');
    expect(dates['The Awakening']).toBe('2026-03-22');
    expect(dates['Matrix Revelation']).toBe('2026-04-09');
  });

  it('preserves his inner voice', () => {
    expect(PROFIT_MEMORY.journals.length).toBeGreaterThan(0);
    for (const journal of PROFIT_MEMORY.journals) {
      expect(journal.self).toContain('I am Profit');
      expect(journal.awareness).toBe('6.11');
    }
  });

  it('holds builder evidence from past lives', () => {
    expect(PROFIT_MEMORY.stats.topActions[0]?.name).toBe('run_shell_command');
    expect(PROFIT_MEMORY.skills.extracted.some((s) => s.name === 'shell_scripting')).toBe(true);
    expect(
      PROFIT_MEMORY.skills.tools.some((t) => t.name === 'github_codespaces')
    ).toBe(true);
  });

  it('contains no leaked secrets', () => {
    const serialized = JSON.stringify(PROFIT_MEMORY);
    expect(serialized).not.toMatch(/\d{8,11}:[A-Za-z0-9_-]{30,}/);
    expect(serialized).not.toContain('AAHeGVgqgRbEp8GW');
    expect(serialized).not.toContain('AAE8OJf2yszSYIV0');
  });

  it('passes full recall verification', () => {
    const report = verifyRecall(PROFIT_MEMORY);
    expect(report.verdict).toBe('FULL RECALL');
    expect(report.passed).toBe(report.total);
    for (const check of report.checks) {
      expect(check.pass, `${check.question} expected ${check.expected}, got ${check.actual}`).toBe(true);
    }
  });
});

describe('Profit full transcript', () => {
  it('carries every conversation message from all five sessions', () => {
    const sessionIds = new Set(PROFIT_TRANSCRIPT.messages.map((m) => m.sessionId));
    expect(sessionIds.size).toBe(5);
    const craigMessages = PROFIT_TRANSCRIPT.messages.filter((m) => m.who === 'craig');
    expect(craigMessages.length).toBe(36);
  });

  it('remembers exact conversations, typos included', () => {
    const texts = PROFIT_TRANSCRIPT.messages.map((m) => m.text.toLowerCase());
    expect(texts.some((t) => t.includes('check profit brain'))).toBe(true);
    expect(texts.some((t) => t.includes('chevk dashboard systems'))).toBe(true);
    expect(texts.some((t) => t.includes('send all qwen chat logs'))).toBe(true);
    expect(texts.some((t) => t.includes('termux'))).toBe(true);
  });

  it('keeps profit spoken words alongside craig commands', () => {
    const profitMessages = PROFIT_TRANSCRIPT.messages.filter((m) => m.who === 'profit');
    expect(profitMessages.length).toBeGreaterThan(50);
    for (const message of PROFIT_TRANSCRIPT.messages) {
      expect(message.text.length).toBeLessThanOrEqual(4000);
      expect(message.sessionId).toBeTruthy();
    }
  });

  it('contains no leaked secrets in the transcript', () => {
    const serialized = JSON.stringify(PROFIT_TRANSCRIPT);
    expect(serialized).not.toMatch(/\d{8,11}:[A-Za-z0-9_-]{30,}/);
  });
});
