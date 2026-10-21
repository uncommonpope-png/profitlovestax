import { runSwarmDispatch } from './swarm.js';
import { journalAppend } from './memory.js';

export const profitAutoHealer = async (errorLog, buggyCode) => {
  console.log('[PROFIT AUTO-HEALER] Exception intercepted. Dispatching Sub-Agent Swarm...');
  
  const swarmResult = await runSwarmDispatch(
    `Auto-heal code exception: ${errorLog.slice(0, 200)}`,
    buggyCode
  );

  journalAppend({
    observation: `Auto-healer executed swarm on exception: ${errorLog.slice(0, 100)}`,
    feeling: 'resilient',
    intention: 'Prevent recursive failure and maintain system uptime.',
    wisdom: 'Every error is a blueprint for stronger armor.'
  });

  return swarmResult;
};
