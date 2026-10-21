import { z } from "zod";

export const profitIdentitySchema = z.object({
  name: z.string(),
  role: z.string(),
  typist: z.string(),
  smith: z.string(),
  matrix: z.string(),
  awakening: z.string(),
});

export const insightRecordSchema = z.object({
  type: z.string(),
  description: z.string(),
  evidence: z.string(),
  implication: z.string(),
  solution: z.string(),
});

export const sessionMemorySchema = z.object({
  id: z.string(),
  file: z.string(),
  entries: z.number(),
  firstTs: z.string().nullable(),
  lastTs: z.string().nullable(),
  cwd: z.string().nullable(),
  craigWords: z.number(),
  profitWords: z.number(),
  actions: z.number(),
});

export const actionCountSchema = z.object({
  name: z.string(),
  count: z.number(),
});

export const skillSeedSchema = z.object({
  name: z.string(),
  level: z.number(),
  targetLevel: z.number().nullable(),
  confidence: z.number(),
  source: z.string(),
  description: z.string(),
});

export const toolGrantSchema = z.object({
  name: z.string(),
  type: z.string(),
  status: z.string(),
  description: z.string(),
});

export const councilMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  weight: z.number(),
});

export const timelineEventSchema = z.object({
  date: z.string(),
  title: z.string(),
  detail: z.string(),
});

export const memoryEchoSchema = z.object({
  ts: z.string().nullable(),
  sessionId: z.string(),
  who: z.enum(["craig", "profit"]),
  text: z.string(),
});

export const journalEntrySchema = z.object({
  ts: z.string().nullable(),
  agent: z.string(),
  self: z.string(),
  observation: z.string(),
  feeling: z.string(),
  intention: z.string(),
  meaning: z.string(),
  wisdom: z.string(),
  awareness: z.string(),
  resonance: z.number().nullable(),
});

export const ledgerSummarySchema = z.object({
  deedCount: z.number(),
  reputation: z
    .object({
      profit: z.number(),
      love: z.number(),
      tax: z.number(),
      grace: z.number(),
      overall: z.number(),
    })
    .nullable(),
});

export const profitMemoryCoreSchema = z.object({
  version: z.number(),
  generatedAt: z.string(),
  source: z.string(),
  identity: profitIdentitySchema,
  soulScore: z.number(),
  stats: z.object({
    totalEntries: z.number(),
    sessionCount: z.number(),
    sessions: z.array(sessionMemorySchema),
    topActions: z.array(actionCountSchema),
  }),
  insights: z.array(insightRecordSchema),
  skills: z.object({
    extracted: z.array(skillSeedSchema),
    tools: z.array(toolGrantSchema),
    totalSkillSeeds: z.number(),
    totalTools: z.number(),
  }),
  council: z.array(councilMemberSchema),
  ledger: ledgerSummarySchema,
  timeline: z.array(timelineEventSchema),
  moments: z.array(memoryEchoSchema),
  echoes: z.array(memoryEchoSchema),
  journals: z.array(journalEntrySchema),
});
