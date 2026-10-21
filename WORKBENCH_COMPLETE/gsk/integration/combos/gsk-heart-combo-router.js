'use strict';

/**
 * GSK-HEART Combo Router
 *
 * Features:
 * - Multi-model pipeline execution
 * - Sequential step processing
 * - Context handoff between models
 * - Built-in combo templates
 */

const providerCatalog = require('../catalogs/provider-catalog');
const { gskHeartChat, resolveProviderId } = require('../handlers/gsk-heart-chat-handler.js');

async function executeModelStep(context, step, chatHandler) {
  const { input, messages } = context;
  let prompt = input;

  if (step.options && step.options.systemPrompt) {
    prompt = step.options.systemPrompt + '\n\n' + input;
  }
  if (step.options && step.options.prefix) {
    prompt = step.options.prefix + prompt;
  }
  if (step.options && step.options.suffix) {
    prompt = prompt + step.options.suffix;
  }

  const result = await chatHandler.chat({
    prompt,
    messages: messages || [],
    model: step.model,
    options: {},
  });

  if (!result.success) {
    return {
      success: false,
      error: 'Step "' + (step.label || step.id) + '" failed: ' + result.error,
    };
  }

  return {
    success: true,
    output: result.content,
    model: step.model,
    usage: result.usage,
  };
}

async function executeCombo(comboName, input, handler, options) {
  options = options || {};
  const combo = getComboConfig(comboName);
  if (!combo) {
    return { success: false, error: 'Unknown combo: ' + comboName };
  }

  const steps = combo.steps;
  const results = [];
  let currentInput = input;
  let messageHistory = options.initialMessages || [];

  console.log('[GSK-HEART] Executing combo "' + comboName + '" with ' + steps.length + ' steps');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log('[GSK-HEART] Step ' + (i + 1) + '/' + steps.length + ': ' + (step.label || step.id));

    const stepResult = await executeModelStep(
      { input: currentInput, messages: messageHistory, handler },
      step,
      handler
    );

    if (!stepResult.success) {
      return {
        success: false,
        error: stepResult.error,
        completedSteps: i,
        partialResults: results,
      };
    }

    results.push({
      step: step.id,
      label: step.label,
      output: stepResult.output,
      model: stepResult.model,
      usage: stepResult.usage,
    });

    currentInput = stepResult.output;

    if (options.accumulateHistory) {
      messageHistory.push(
        { role: 'user', content: i === 0 ? input : results[i - 1].output },
        { role: 'assistant', content: stepResult.output }
      );
    }
  }

  return {
    success: true,
    data: {
      finalOutput: currentInput,
      comboName: comboName,
      stepsExecuted: steps.length,
    },
    steps: results,
  };
}

function normalizeStep(value, index, comboName) {
  if (typeof value === 'string') {
    return { id: 'step-' + index + '-' + value, kind: 'model', model: value, weight: 0, label: value };
  }
  if (!value || typeof value !== 'object') return null;
  if (value.kind === 'combo-ref') {
    return { id: value.id || ('ref-' + index + '-' + value.comboName), kind: 'combo-ref', comboName: value.comboName, weight: value.weight || 0 };
  }
  const rawModel = value.model;
  if (!rawModel) return null;
  const providerId = value.providerId || value.provider || (rawModel.indexOf('/') > 0 ? rawModel.slice(0, rawModel.indexOf('/')) : null);
  return {
    id: value.id || ('step-' + index + '-' + rawModel),
    kind: 'model',
    model: rawModel,
    providerId: providerId || undefined,
    weight: value.weight || 0,
    label: value.label,
    system: value.system,
  };
}

function normalizeComboSteps(models, comboName) {
  if (!Array.isArray(models)) return [];
  return models.map(function(v, i) { return normalizeStep(v, i, comboName); }).filter(function(v) { return v !== null; });
}

function getComboConfig(name) {
  const normalized = name.toLowerCase().replace(/[-_]/g, '');
  for (const [key, combo] of Object.entries(BUILTIN_COMBOS)) {
    const keyNormalized = key.toLowerCase().replace(/[-_]/g, '');
    if (keyNormalized === normalized || key.toLowerCase() === name.toLowerCase()) {
      return { name: key, ...combo };
    }
  }
  return null;
}

function listCombos() {
  return Object.entries(BUILTIN_COMBOS).map(function(name_combo) {
    const name = name_combo[0];
    const combo = name_combo[1];
    return {
      name: name,
      description: combo.description,
      steps: combo.steps.length,
    };
  });
}

function extractFinalText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (result.success && result.data && result.data.finalOutput) return result.data.finalOutput;
  if (result.output) return result.output;
  if (result.steps && result.steps.length > 0) {
    return result.steps[result.steps.length - 1].output || '';
  }
  return '';
}

function runCombo(comboNameOrConfig, input, opts) {
  opts = opts || {};
  let combo;
  if (typeof comboNameOrConfig === 'string') {
    combo = getComboConfig(comboNameOrConfig);
  } else {
    combo = comboNameOrConfig;
  }
  if (!combo) return Promise.resolve({ success: false, error: 'Unknown combo' });

  const handler = opts.handler || {
    chat: function(opts2) { return gskHeartChat(opts2); },
    stream: function(opts2) { return streamChat(opts2); },
  };

  const steps = normalizeComboSteps(combo.steps, combo.name || comboNameOrConfig);
  const results = [];
  let currentInput = input;

  return (async function() {
    for (const step of steps) {
      const model = step.model || 'auto/best-chat';
      const providerId = step.providerId || resolveProviderId(model);
      const result = await handler.chat({
        model: model,
        prompt: step.system ? (step.system + '\n\n' + currentInput) : currentInput,
        options: { providerId: providerId },
      });
      results.push({ step: step.id, output: result });
      if (result && result.success === false) return { success: false, steps: results, error: result.error };
      currentInput = (result && result.content) || (result && result.finalOutput) || currentInput;
    }
    return { success: true, steps: results, finalOutput: currentInput };
  })();
}

const BUILTIN_COMBOS = {
  research: {
    description: 'Research pipeline: search → summarize → critique',
    steps: [
      {
        id: 'search',
        kind: 'model',
        label: 'Information Retrieval',
        model: 'auto/best-search',
        options: {
          systemPrompt: 'You are a research assistant. Find and retrieve relevant information about the query. Be thorough and cite sources.',
        },
      },
      {
        id: 'summarize',
        kind: 'model',
        label: 'Summarization',
        model: 'auto/best-chat',
        options: {
          systemPrompt: 'You are a research summarizer. Condense the research findings into a clear, well-structured summary highlighting key insights.',
        },
      },
      {
        id: 'critique',
        kind: 'model',
        label: 'Critical Analysis',
        model: 'claude-3-5-sonnet',
        options: {
          systemPrompt: 'You are a critical analyst. Evaluate the summary for gaps, biases, and areas needing further investigation. Provide constructive critique.',
        },
      },
    ],
  },

  creative: {
    description: 'Creative writing: ideate → draft → polish',
    steps: [
      {
        id: 'ideate',
        kind: 'model',
        label: 'Idea Generation',
        model: 'gpt-4o',
        options: {
          systemPrompt: 'You are a creative brainstormer. Generate 3-5 bold, innovative ideas based on the prompt. Push boundaries.',
        },
      },
      {
        id: 'draft',
        kind: 'model',
        label: 'Drafting',
        model: 'gpt-4o',
        options: {
          systemPrompt: 'You are a professional writer. Create a well-structured, engaging draft based on the selected idea. Use appropriate tone and style for the audience.',
          prefix: 'Develop this concept into a full draft:\n\n',
        },
      },
      {
        id: 'polish',
        kind: 'model',
        label: 'Refinement',
        model: 'gemini-pro',
        options: {
          systemPrompt: 'You are an editor. Polish this draft for clarity, flow, grammar, and impact. Make it publication-ready.',
          prefix: 'Edit and polish this draft:\n\n',
        },
      },
    ],
  },

  translation: {
    description: 'Translation pipeline: translate → verify → adapt',
    steps: [
      {
        id: 'translate',
        kind: 'model',
        label: 'Initial Translation',
        model: 'gpt-4o',
        options: {
          systemPrompt: 'You are a professional translator. Translate the text accurately while preserving meaning and tone.',
        },
      },
      {
        id: 'verify',
        kind: 'model',
        label: 'Accuracy Check',
        model: 'claude-sonnet',
        options: {
          systemPrompt: 'You are a translation reviewer. Compare the original and translation. Identify any errors, omissions, or mistranslations.',
          prefix: 'Original:\n---\nVerify this translation:\n\n',
        },
      },
      {
        id: 'adapt',
        kind: 'model',
        label: 'Cultural Adaptation',
        model: 'gpt-4o',
        options: {
          systemPrompt: 'You are a cultural consultant. Adapt the translation for natural expression in the target language and culture. Fix any awkward phrasing.',
          prefix: 'Improve this translation for natural flow:\n\n',
        },
      },
    ],
  },
};

class GSKHeartComboRouter {
  constructor(options) {
    options = options || {};
    this.handler = options.handler;
    this.customCombos = new Map();
  }

  registerCombo(name, config) {
    this.customCombos.set(name.toLowerCase(), config);
    console.log('[GSK-HEART] Registered custom combo: ' + name);
  }

  async run(comboName, input, options) {
    options = options || {};
    const customCombo = this.customCombos.get(comboName.toLowerCase());
    if (customCombo) {
      return executeCombo(comboName, input, this.handler, { ...options, customCombo: customCombo });
    }
    return executeCombo(comboName, input, this.handler, options);
  }

  list() {
    return listCombos().concat(Array.from(this.customCombos.entries()).map(function(name_config) {
      const name = name_config[0];
      const config = name_config[1];
      return {
        name: name,
        description: config.description || 'Custom combo',
        steps: (config.steps ? config.steps.length : 0),
      };
    }));
  }

  getInfo(name) {
    return getComboConfig(name);
  }
}

function streamChat(opts) {
  const { gskHeartChat: _chat } = require('../handlers/gsk-heart-chat-handler.js');
  return _chat(opts);
}

module.exports = {
  executeCombo,
  getComboConfig,
  listCombos,
  BUILTIN_COMBOS,
  GSKHeartComboRouter,
  ComboRouter: GSKHeartComboRouter,
  runCombo,
  normalizeComboSteps,
  extractFinalText,
};
