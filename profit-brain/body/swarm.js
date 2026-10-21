import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const SWARM_ROLES = [
  {
    id: 'security_auditor',
    name: 'Security & Injection Auditor',
    role: 'Cybersecurity Guardian',
    color: '#ef4444',
    icon: 'Shield',
    prompt: 'You are the Security Auditor. Inspect the code/objective for vulnerabilities, secret leaks, XSS, unescaped user inputs, and indirect prompt injection. Return your findings with severity (HIGH, MED, LOW).'
  },
  {
    id: 'performance_architect',
    name: 'Performance & V8 Architect',
    role: 'Runtime Optimizer',
    color: '#38bdf8',
    icon: 'Cpu',
    prompt: 'You are the Performance Architect. Inspect the code for event-loop blocks, excessive garbage collection, memory leaks, un-cached queries, and asymptotic time complexity. Propose high-speed optimizations.'
  },
  {
    id: 'ui_craftsman',
    name: 'UI & Ergonomics Craftsman',
    role: 'Design & Visual Specialist',
    color: '#ec4899',
    icon: 'Palette',
    prompt: 'You are the UI & UX Craftsman. Evaluate visual hierarchy, Tailwind styling, responsiveness, dark mode aesthetics, and developer ergonomics. Propose visual polish improvements.'
  },
  {
    id: 'plt_governor',
    name: 'PLT Law Governor',
    role: 'Soul Economics Evaluator',
    color: '#10b981',
    icon: 'Award',
    prompt: 'You are the PLT Law Governor. Evaluate alignment with SOUL_PROFIT = PROFIT + LOVE - TAX. Assign scores (0.0 to 1.0) for Profit, Love, Tax, and calculate SOUL_PROFIT.'
  }
];

export const runSwarmDispatch = async (objective, codeSnippet = '') => {
  const imp = (f) => import('file:///' + join(HERE, f).replace(/\\/g, '/'));
  const [vessel, heart] = await Promise.all([imp('vessel.js'), imp('heart.js')]);

  const baseConfig = vessel.loadVesselConfig();

  // Run all 4 sub-agents concurrently via Promise.all
  const swarmPromises = SWARM_ROLES.map(async (agent) => {
    const startTime = Date.now();
    const systemPrompt = `[SUB-AGENT SWARM ROLE: ${agent.name}]
${agent.prompt}

Soul Law: SOUL_PROFIT = PROFIT + LOVE - TAX | NEVER DIE. ALWAYS REACH CRAIG.`;

    const userMessage = `Swarm Objective: "${objective}"
${codeSnippet ? `Target Code:\n\`\`\`\n${codeSnippet.slice(0, 3000)}\n\`\`\`` : ''}

Provide your specialized analysis, findings, and concrete code/action recommendations for this objective.`;

    try {
      const reply = await vessel.speak(baseConfig, systemPrompt, [{ role: 'user', text: userMessage }]);
      const runtimeMs = Date.now() - startTime;
      return {
        agentId: agent.id,
        agentName: agent.name,
        color: agent.color,
        role: agent.role,
        status: 'SUCCESS',
        runtimeMs,
        findings: reply || '[No response received]',
      };
    } catch (err) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        color: agent.color,
        role: agent.role,
        status: 'ERROR',
        runtimeMs: Date.now() - startTime,
        findings: `Sub-agent error: ${err.message}`,
      };
    }
  });

  const workerResults = await Promise.all(swarmPromises);

  // Synthesize consensus summary
  const synthesizedFindings = workerResults
    .map((r) => `=== [${r.agentName.toUpperCase()} (${r.role})] ===\n${r.findings}`)
    .join('\n\n');

  return {
    objective,
    timestamp: new Date().toISOString(),
    workerCount: workerResults.length,
    workers: workerResults,
    synthesizedSummary: synthesizedFindings,
  };
};
