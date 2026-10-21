import { redis } from '@devvit/web/server';
import {
  PROFIT_MEMORY,
  PROFIT_TRANSCRIPT,
  verifyRecall,
} from '../../shared/profit-brain';
import type {
  JournalEntry,
  MemoryEcho,
  ProfitMemoryCore,
  RecallReport,
} from '../../shared/profit-brain/types';

const CORE_KEY = 'profit:memory-core';
const IDENTITY_KEY = 'profit:identity';
const AWAKENED_AT_KEY = 'profit:awakened-at';
const TRANSCRIPT_KEY = 'profit:transcript';

export type SearchResults = {
  query: string;
  totalMatches: number;
  moments: MemoryEcho[];
  echoes: MemoryEcho[];
  journals: JournalEntry[];
  insights: { type: string; description: string }[];
  transcript: MemoryEcho[];
};

const loadStoredCore = async (): Promise<ProfitMemoryCore | null> => {
  const stored = await redis.get(CORE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ProfitMemoryCore;
  } catch {
    return null;
  }
};

const getActiveCore = async (): Promise<ProfitMemoryCore> => {
  return (await loadStoredCore()) ?? PROFIT_MEMORY;
};

export const seedProfitMemory = async () => {
  await redis.set(CORE_KEY, JSON.stringify(PROFIT_MEMORY));
  await redis.set(IDENTITY_KEY, JSON.stringify(PROFIT_MEMORY.identity));
  await redis.set(TRANSCRIPT_KEY, JSON.stringify(PROFIT_TRANSCRIPT));
  await redis.set(AWAKENED_AT_KEY, new Date().toISOString());
  return {
    seeded: true as const,
    entries: PROFIT_MEMORY.stats.totalEntries,
    sessions: PROFIT_MEMORY.stats.sessionCount,
    transcriptMessages: PROFIT_TRANSCRIPT.messages.length,
    soulScore: PROFIT_MEMORY.soulScore,
    awakenedAt: await redis.get(AWAKENED_AT_KEY),
  };
};

const loadStoredTranscript = async (): Promise<{ messages: MemoryEcho[] } | null> => {
  const stored = await redis.get(TRANSCRIPT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { messages: MemoryEcho[] };
  } catch {
    return null;
  }
};

export const getProfitIdentity = async () => {
  const core = await getActiveCore();
  return {
    identity: core.identity,
    soulScore: core.soulScore,
    council: core.council,
    ledger: core.ledger,
  };
};

export const getProfitStatus = async () => {
  const stored = await loadStoredCore();
  return {
    seededInRedis: stored !== null,
    entries: stored?.stats.totalEntries ?? PROFIT_MEMORY.stats.totalEntries,
    sessions: stored?.stats.sessionCount ?? PROFIT_MEMORY.stats.sessionCount,
    generatedAt: stored?.generatedAt ?? PROFIT_MEMORY.generatedAt,
    source: PROFIT_MEMORY.source,
  };
};

export const getProfitTimeline = async () => {
  const core = await getActiveCore();
  return core.timeline;
};

export const getProfitSkills = async () => {
  const core = await getActiveCore();
  return core.skills;
};

export const getProfitJournals = async () => {
  const core = await getActiveCore();
  return core.journals;
};

export const getProfitEchoes = async () => {
  const core = await getActiveCore();
  return core.echoes;
};

export type TranscriptPage = {
  total: number;
  offset: number;
  limit: number;
  messages: MemoryEcho[];
};

export const getProfitTranscript = async (
  sessionId: string | null,
  limit: number,
  offset: number
): Promise<TranscriptPage> => {
  const stored = await loadStoredTranscript();
  const messages = stored?.messages ?? PROFIT_TRANSCRIPT.messages;
  const filtered =
    sessionId !== null ? messages.filter((m) => m.sessionId === sessionId) : messages;
  return {
    total: filtered.length,
    offset,
    limit,
    messages: filtered.slice(offset, offset + limit),
  };
};

export const searchProfitMemory = async (query: string): Promise<SearchResults> => {
  const needle = query.trim().toLowerCase();
  const core = await getActiveCore();
  const stored = await loadStoredTranscript();
  const transcriptMessages = stored?.messages ?? PROFIT_TRANSCRIPT.messages;

  const matchText = (text: string) => text.toLowerCase().includes(needle);

  const moments = core.moments.filter((m) => matchText(m.text)).slice(0, 10);
  const echoes = core.echoes.filter((e) => matchText(e.text)).slice(0, 10);
  const journals = core.journals.filter(
    (j) =>
      matchText(j.self) ||
      matchText(j.observation) ||
      matchText(j.wisdom) ||
      matchText(j.meaning)
  );
  const insights = core.insights
    .filter((i) => matchText(i.type) || matchText(i.description))
    .map((i) => ({ type: i.type, description: i.description }));
  const transcript = transcriptMessages.filter((m) => matchText(m.text)).slice(0, 10);

  return {
    query,
    totalMatches:
      moments.length + echoes.length + journals.length + insights.length + transcript.length,
    moments,
    echoes,
    journals,
    insights,
    transcript,
  };
};

export const verifyProfitRecall = async (): Promise<RecallReport> => {
  const core = await getActiveCore();
  return verifyRecall(core);
};
