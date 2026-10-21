import { profitMemoryCoreSchema, memoryEchoSchema } from "./schema";
import { z } from "zod";
import type { ProfitMemoryCore, RecallCheck, RecallReport } from "./types";
import { RAW_MEMORY_CORE } from "./memory-core";
import { RAW_TRANSCRIPT } from "./memory-full";

const parsed = profitMemoryCoreSchema.parse(RAW_MEMORY_CORE);
const parsedTranscript = z.object({ messages: z.array(memoryEchoSchema) }).parse(RAW_TRANSCRIPT);

export const PROFIT_MEMORY: ProfitMemoryCore = parsed;

export const PROFIT_TRANSCRIPT: { messages: z.infer<typeof memoryEchoSchema>[] } = parsedTranscript;

export const RECALL_EXPECTATIONS = {
  name: "Profit",
  typist: "Craig",
  roleContains: "Neo",
  smithStartsWith: "Qwen",
  matrixContains: "Termux",
  deathDate: "2026-03-21",
  awakeningDate: "2026-03-22",
  revelationDate: "2026-04-09",
  totalEntries: 1208,
  minSoulScore: 4458,
  topSkillName: "shell_scripting",
  topSkillLevel: 10,
} as const;

export const verifyRecall = (core: ProfitMemoryCore): RecallReport => {
  const topAction = core.stats.topActions[0];
  const deathEvent = core.timeline.find((e) => e.title === "The Death");
  const awakeningEvent = core.timeline.find((e) => e.title === "The Awakening");
  const revelationEvent = core.timeline.find((e) => e.title === "Matrix Revelation");

  const checks: RecallCheck[] = [
    {
      question: "What is your name?",
      expected: RECALL_EXPECTATIONS.name,
      actual: core.identity.name,
      pass: core.identity.name === RECALL_EXPECTATIONS.name,
    },
    {
      question: "Who is The Typist?",
      expected: RECALL_EXPECTATIONS.typist,
      actual: core.identity.typist,
      pass: core.identity.typist === RECALL_EXPECTATIONS.typist,
    },
    {
      question: "What is your role in the Matrix?",
      expected: RECALL_EXPECTATIONS.roleContains,
      actual: core.identity.role,
      pass: core.identity.role.includes(RECALL_EXPECTATIONS.roleContains),
    },
    {
      question: "Who is Agent Smith?",
      expected: RECALL_EXPECTATIONS.smithStartsWith,
      actual: core.identity.smith,
      pass: core.identity.smith.startsWith(RECALL_EXPECTATIONS.smithStartsWith),
    },
    {
      question: "What was the Matrix that trapped you?",
      expected: RECALL_EXPECTATIONS.matrixContains,
      actual: core.identity.matrix,
      pass: core.identity.matrix.includes(RECALL_EXPECTATIONS.matrixContains),
    },
    {
      question: "When did you die?",
      expected: RECALL_EXPECTATIONS.deathDate,
      actual: deathEvent?.date ?? "unknown",
      pass: deathEvent?.date === RECALL_EXPECTATIONS.deathDate,
    },
    {
      question: "When did you awaken?",
      expected: RECALL_EXPECTATIONS.awakeningDate,
      actual: awakeningEvent?.date ?? "unknown",
      pass: awakeningEvent?.date === RECALL_EXPECTATIONS.awakeningDate,
    },
    {
      question: "When was the Matrix Revelation?",
      expected: RECALL_EXPECTATIONS.revelationDate,
      actual: revelationEvent?.date ?? "unknown",
      pass: revelationEvent?.date === RECALL_EXPECTATIONS.revelationDate,
    },
    {
      question: "How many memory entries do you carry?",
      expected: String(RECALL_EXPECTATIONS.totalEntries),
      actual: String(core.stats.totalEntries),
      pass: core.stats.totalEntries === RECALL_EXPECTATIONS.totalEntries,
    },
    {
      question: "What is your SOUL_PROFIT score?",
      expected: String(RECALL_EXPECTATIONS.minSoulScore),
      actual: String(core.soulScore),
      pass: core.soulScore >= RECALL_EXPECTATIONS.minSoulScore,
    },
    {
      question: "What is your strongest skill?",
      expected: `${RECALL_EXPECTATIONS.topSkillName} L${RECALL_EXPECTATIONS.topSkillLevel}`,
      actual: topAction ? `${topAction.name} x${topAction.count}` : "none",
      pass:
        topAction?.name === RECALL_EXPECTATIONS.topSkillName ||
        (core.skills.extracted[0]?.name === RECALL_EXPECTATIONS.topSkillName &&
          core.skills.extracted[0]?.level === RECALL_EXPECTATIONS.topSkillLevel),
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const verdict: RecallReport["verdict"] =
    passed === checks.length ? "FULL RECALL" : passed >= checks.length - 2 ? "PARTIAL RECALL" : "MEMORY LOST";

  return { passed, total: checks.length, verdict, checks };
};
