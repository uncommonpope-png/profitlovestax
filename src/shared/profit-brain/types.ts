export type ProfitIdentity = {
  name: string;
  role: string;
  typist: string;
  smith: string;
  matrix: string;
  awakening: string;
};

export type InsightRecord = {
  type: string;
  description: string;
  evidence: string;
  implication: string;
  solution: string;
};

export type SessionMemory = {
  id: string;
  file: string;
  entries: number;
  firstTs: string | null;
  lastTs: string | null;
  cwd: string | null;
  craigWords: number;
  profitWords: number;
  actions: number;
};

export type ActionCount = {
  name: string;
  count: number;
};

export type SkillSeed = {
  name: string;
  level: number;
  targetLevel: number | null;
  confidence: number;
  source: string;
  description: string;
};

export type ToolGrant = {
  name: string;
  type: string;
  status: string;
  description: string;
};

export type CouncilMember = {
  id: string;
  name: string;
  role: string;
  weight: number;
};

export type TimelineEvent = {
  date: string;
  title: string;
  detail: string;
};

export type MemoryEcho = {
  ts: string | null;
  sessionId: string;
  who: "craig" | "profit";
  text: string;
};

export type JournalEntry = {
  ts: string | null;
  agent: string;
  self: string;
  observation: string;
  feeling: string;
  intention: string;
  meaning: string;
  wisdom: string;
  awareness: string;
  resonance: number | null;
};

export type LedgerSummary = {
  deedCount: number;
  reputation: {
    profit: number;
    love: number;
    tax: number;
    grace: number;
    overall: number;
  } | null;
};

export type ProfitStats = {
  totalEntries: number;
  sessionCount: number;
  sessions: SessionMemory[];
  topActions: ActionCount[];
};

export type ProfitSkillVault = {
  extracted: SkillSeed[];
  tools: ToolGrant[];
  totalSkillSeeds: number;
  totalTools: number;
};

export type ProfitMemoryCore = {
  version: number;
  generatedAt: string;
  source: string;
  identity: ProfitIdentity;
  soulScore: number;
  stats: ProfitStats;
  insights: InsightRecord[];
  skills: ProfitSkillVault;
  council: CouncilMember[];
  ledger: LedgerSummary;
  timeline: TimelineEvent[];
  moments: MemoryEcho[];
  echoes: MemoryEcho[];
  journals: JournalEntry[];
};

export type RecallCheck = {
  question: string;
  expected: string;
  actual: string;
  pass: boolean;
};

export type RecallReport = {
  passed: number;
  total: number;
  verdict: "FULL RECALL" | "PARTIAL RECALL" | "MEMORY LOST";
  checks: RecallCheck[];
};
