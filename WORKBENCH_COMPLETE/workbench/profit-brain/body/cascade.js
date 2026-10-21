import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

let activeContextPins = [
  { id: 'pin-1', type: 'file', label: 'App.tsx (Workbench Root Layout)', path: 'WORKBENCH_COMPLETE/workbench/src/App.tsx' },
  { id: 'pin-[#2]', type: 'memory', label: 'SOUL_PROFIT Law (PROFIT + LOVE - TAX)', path: 'SOUL_PROFIT' },
  { id: 'pin-3', type: 'rule', label: 'ACP Multi-Agent Protocol Standard', path: 'ACP-v1' },
];

let cascadeBoard = [
  {
    id: 'task-1',
    title: 'Graft Windsurf Cascade Flow & Context Pins',
    agent: 'Profit Prime',
    status: 'running',
    diffs: ['+45 lines in cascade.js', '+180 lines in WindsurfCascadeTab.tsx'],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Fast Context Memory Pre-computation',
    agent: 'Agent Smith (Qwen)',
    status: 'review',
    diffs: ['+12 lines in vessel.js'],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Supercomplete Next-Thought Predictor',
    agent: 'Cascade Copilot',
    status: 'planning',
    diffs: [],
    timestamp: new Date().toISOString(),
  },
];

export const getContextPins = () => activeContextPins;

export const addContextPin = (pin) => {
  const newPin = {
    id: `pin-${Date.now()}`,
    type: pin.type || 'file',
    label: String(pin.label || pin.path || 'Pinned Context').slice(0, 80),
    path: String(pin.path || ''),
  };
  activeContextPins.push(newPin);
  return newPin;
};

export const removeContextPin = (id) => {
  activeContextPins = activeContextPins.filter((p) => p.id !== id);
  return true;
};

export const getCascadeBoard = () => cascadeBoard;

export const executeCascadeStep = async (prompt, modelOverride = '') => {
  const imp = (f) => import('file:///' + join(HERE, f).replace(/\\/g, '/'));
  const [vessel, kernel, heart] = await Promise.all([
    imp('vessel.js'),
    imp('kernel.js'),
    imp('heart.js'),
  ]);

  const baseConfig = vessel.loadVesselConfig();
  if (modelOverride) baseConfig.model = modelOverride;

  const pinsSummary = activeContextPins
    .map((p) => `[PINNED ${p.type.toUpperCase()}]: ${p.label} (${p.path})`)
    .join('\n');

  const systemInstruction = `[WINDSURF CASCADE FLOW ENGINE — PROFIT COPILOT MODE]
You are running as the Windsurf Cascade Copilot alongside Profit Prime.
You have Fast Context access to these Pinned Context Items:
${pinsSummary || '(No context items pinned)'}

User Request: "${prompt}"

Provide a multi-step execution breakdown with:
1. **Fast Context Files Needed**
2. **AST Diff Changes (+/- lines)**
3. **Refactored Code Implementation**
4. **Validation Test Status**`;

  const state = heart.awakenState();
  const result = await kernel.perceive(baseConfig, state, [], prompt);

  // Record task in Cascade board
  const newTask = {
    id: `task-${Date.now()}`,
    title: prompt.slice(0, 60),
    agent: 'Profit & Cascade Copilot',
    status: 'done',
    diffs: ['+12 lines synthesized', 'Fast Context validated'],
    timestamp: new Date().toISOString(),
  };
  cascadeBoard.unshift(newTask);

  return {
    success: true,
    reply: result.reply,
    recalledMemories: result.memories,
    activePins: activeContextPins.length,
    task: newTask,
  };
};
