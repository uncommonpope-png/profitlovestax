/**
 * Agentflow Compiler Tab - Transforms GSK reflection logs into modular execution graphs.
 */
class AgentflowCompilerTab {
  constructor(config = {}) {
    this.catalog = config.catalog || [];
  }

  compileLogsToGraph(reflectionLogs = []) {
    const nodes = reflectionLogs.map((log, index) => ({
      id: `node_${index}`,
      type: log.type || 'action',
      label: log.summary || `Step ${index}`,
      tags: log.tags || []
    }));
    const edges = nodes.slice(0, -1).map((node, index) => ({
      source: node.id,
      target: nodes[index + 1].id
    }));
    return { nodes, edges };
  }
}

module.exports = AgentflowCompilerTab;
