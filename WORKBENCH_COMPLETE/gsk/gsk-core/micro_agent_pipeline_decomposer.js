/**
 * MicroAgentPipelineDecomposer
 * Decomposes monolithic multi-step plans into atomic, telemetry-gated micro-agent pipelines.
 */

class MicroAgentPipelineDecomposer {
  constructor(maxStepsPerPipeline = 8) {
    this.maxStepsPerPipeline = maxStepsPerPipeline;
  }

  decompose(plan) {
    if (!plan || !Array.isArray(plan.steps) || plan.steps.length <= this.maxStepsPerPipeline) {
      return [plan];
    }

    const subPipelines = [];
    const totalStages = Math.ceil(plan.steps.length / this.maxStepsPerPipeline);

    for (let i = 0; i < plan.steps.length; i += this.maxStepsPerPipeline) {
      const stageIndex = Math.floor(i / this.maxStepsPerPipeline) + 1;
      const chunk = plan.steps.slice(i, i + this.maxStepsPerPipeline);

      subPipelines.push({
        id: `${plan.id || 'plan'}_stage_${stageIndex}`,
        title: `${plan.title || 'Task'} [Stage ${stageIndex}/${totalStages}]`,
        steps: chunk,
        telemetryGate: {
          minPassScore: 0.80,
          maxRetryCount: 2,
          checkpointVerified: false
        }
      });
    }

    return subPipelines;
  }
}

module.exports = { MicroAgentPipelineDecomposer };
