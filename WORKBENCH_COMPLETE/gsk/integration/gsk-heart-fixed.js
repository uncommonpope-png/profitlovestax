/**
 * GSK-HEART UNIFIED MODULE
 * Master integration module that combines all GSK-HEART components
 * 
 * This is the single entry point for GSK's absorbed OmniRoute functionality.
 * Import this module to get complete LLM routing, chat, combos, resilience, and safety.
 * 
 * @module gsk-heart-unified
 */

const providerCatalog = require('./catalogs/provider-catalog');
const { GSKHeartRouter } = require('./routing/gsk-heart-routing-engine');
const { GSKHeartChatHandler, executeWithFallback } = require('./handlers/gsk-heart-chat-handler');
const { GSKHeartComboRouter } = require('./combos/gsk-heart-combo-router');
const { GSKHeartResilienceManager } = require('./resilience/gsk-heart-resilience-manager');
const { GSKHeartGuardrailsManager } = require('./safety/gsk-heart-guardrails-manager');

// Normalize catalog access - ALL_PROVIDERS is the main provider map
const providers = providerCatalog.ALL_PROVIDERS || providerCatalog.providers || {};

/**
 * GSK Heart Unified Class
 * Single interface for all GSK-HEART functionality
 */
class GSKHeartUnified {
  constructor(options = {}) {
    // Initialize router
    this.router = new GSKHeartRouter(options.router);
    
    // Initialize chat handler
    this.chatHandler = new GSKHeartChatHandler(options.chatHandler);
    
    // Initialize combo router with chat handler reference
    this.comboRouter = new GSKHeartComboRouter({ 
      handler: this.chatHandler,
      ...options.comboRouter 
    });
    
    // Initialize resilience manager
    this.resilience = new GSKHeartResilienceManager(options.resilience);
    
    // Initialize guardrails manager
    this.guardrails = new GSKHeartGuardrailsManager(options.guardrails);
    
    // Configuration
    this.config = {
      enableGuardrails: options.enableGuardrails !== false,
      enableResilience: options.enableResilience !== false,
      enableCombos: options.enableCombos !== false,
      defaultProviderChain: options.defaultProviderChain || [],
      autoPromoteModels: options.autoPromoteModels ?? true,
    };
    
    console.log('[GSK-HEART] Unified module initialized');
    console.log(`[GSK-HEART] Providers loaded: ${Object.keys(providerCatalog.providers || {}).length}`);
    console.log(`[GSK-HEART] Built-in combos: ${Object.keys(this.comboRouter.list()).length}`);
  }

  /**
   * Build provider chain from routing decision
   * @param {string} selectedModel - Model selected by router
   * @returns {Array} Provider chain for fallback
   */
  _buildProviderChain(selectedModel) {
    const chain = [];
    const providerInfo = providerCatalog.providers?.[selectedModel];
    
    if (providerInfo) {
      chain.push(providerInfo);
      
      // Add fallback providers from same family
      const family = providerInfo.authType;
      const fallbacks = Object.values(providerCatalog.providers)
        .filter(p => p.authType === family && p.id !== selectedModel)
        .slice(0, 3);
      chain.push(...fallbacks);
    }
    
    // If no specific provider, use default chain
    if (chain.length === 0 && this.config.defaultProviderChain.length > 0) {
      return this.config.defaultProviderChain;
    }
    
    // Ultimate fallback: any available provider
    if (chain.length === 0) {
      const availableProviders = Object.values(providerCatalog.providers).slice(0, 5);
      chain.push(...availableProviders);
    }
    
    return chain;
  }

  /**
   * Main chat method - routes, validates, and executes
   * @param {Object} request - Chat request
   * @param {string} [request.prompt] - User prompt
   * @param {Array} [request.messages] - Message history
   * @param {string} [request.model] - Specific model (optional, router will select if not provided)
   * @param {boolean} [request.stream=false] - Enable streaming
   * @param {Function} [request.onChunk] - Streaming callback
   * @param {Object} [request.options] - Additional options
   * @returns {Promise<Object>} Chat response
   */
  async chat(request) {
    const { 
      prompt, 
      messages, 
      model: requestedModel, 
      stream = false, 
      onChunk,
      options = {} 
    } = request;

    let inputText = prompt || (messages?.[messages.length - 1]?.content) || '';

    // Step 1: Guardrails validation (input)
    if (this.config.enableGuardrails) {
      const validationResult = this.guardrails.validateInput(inputText);
      if (!validationResult.allowed) {
        return {
          success: false,
          error: 'Input blocked by guardrails',
          reasons: validationResult.reasons,
          blocked: true,
        };
      }
      // Use sanitized input
      inputText = validationResult.text;
    }

    // Step 2: Route to best model (if not specified)
    let selectedModel = requestedModel;
    let routingDecision = null;
    
    if (!selectedModel) {
      routingDecision = await this.router.route({ prompt: inputText }, options.routing || {});
      
      if (!routingDecision) {
        return {
          success: false,
          error: 'No suitable model found for request',
        };
      }
      
      selectedModel = routingDecision.model;
      console.log(`[GSK-HEART] Routed to: ${selectedModel} (AIQ: ${routingDecision.confidence?.toFixed(2) || 'N/A'})`);
    }

    // Step 3: Check provider availability (resilience)
    if (this.config.enableResilience) {
      const availability = this.resilience.checkAvailability(selectedModel);
      if (!availability.available) {
        // Try to reroute
        const altRouting = await this.router.route(
          { prompt: inputText }, 
          { ...options.routing, excludeModels: [selectedModel] }
        );
        
        if (altRouting) {
          selectedModel = altRouting.model;
          console.log(`[GSK-HEART] Provider unavailable, rerouted to: ${selectedModel}`);
        } else {
          return {
            success: false,
            error: `Provider ${selectedModel} unavailable: ${availability.reason}`,
            availability,
          };
        }
      }
    }

    // Step 4: Build provider chain for fallback
    const providerChain = this._buildProviderChain(selectedModel);

    // Step 5: Execute chat
    const chatOptions = {
      providerChain,
      messages: messages || [{ role: 'user', content: inputText }],
      onChunk: stream ? onChunk : null,
    };

    const result = await executeWithFallback(chatOptions);

    // Step 6: Record outcome for resilience tracking
    if (this.config.enableResilience && result.provider) {
      if (result.success) {
        this.resilience.recordSuccess(result.provider);
      } else {
        this.resilience.recordFailure(result.provider, result.error);
      }
    }

    // Step 7: Guardrails sanitization (output)
    if (result.success && this.config.enableGuardrails) {
      result.content = this.guardrails.sanitizeOutput(result.content);
    }

    // Step 8: Record observation for routing learning
    if (routingDecision && result.provider) {
      const latency = result.usage?.totalTime || 1000;
      const cost = result.usage?.estimatedCost || 0.001;
      this.router.recordObservation(
        result.provider,
        latency,
        cost,
        result.success
      );
    }

    return {
      ...result,
      routing: routingDecision,
      stream,
    };
  }

  /**
   * Non-streaming completion
   * @param {Object} request - Completion request
   * @returns {Promise<string>} Response text
   */
  async complete(request) {
    const result = await this.chat({ ...request, stream: false });
    
    if (!result.success) {
      throw new Error(result.error || 'Completion failed');
    }
    
    return result.content;
  }

  /**
   * Streaming completion with callback
   * @param {Object} request - Completion request
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<Object>} Result metadata
   */
  async stream(request, onChunk) {
    return this.chat({ ...request, stream: true, onChunk });
  }

  /**
   * Execute a combo pipeline
   * @param {string} comboName - Combo name
   * @param {string} input - Input text
   * @param {Object} [options] - Combo options
   * @returns {Promise<Object>} Combo result
   */
  async runCombo(comboName, input, options = {}) {
    if (!this.config.enableCombos) {
      return {
        success: false,
        error: 'Combos are disabled in this configuration',
      };
    }

    // Validate input first
    if (this.config.enableGuardrails) {
      const validation = this.guardrails.validateInput(input);
      if (!validation.allowed) {
        return {
          success: false,
          error: 'Input blocked by guardrails',
          reasons: validation.reasons,
        };
      }
      input = validation.text;
    }

    return this.comboRouter.run(comboName, input, options);
  }

  /**
   * List available combos
   * @returns {Array} Combo list
   */
  listCombos() {
    return this.comboRouter.list();
  }

  /**
   * Get routing report
   * @returns {Object} Routing statistics
   */
  getRoutingReport() {
    return this.router.getReport();
  }

  /**
   * Get resilience status
   * @returns {Object} Resilience status
   */
  getResilienceStatus() {
    return this.resilience.getStatus();
  }

  /**
   * Get guardrails statistics
   * @returns {Object} Guardrails stats
   */
  getGuardrailsStats() {
    return this.guardrails.getStats();
  }

  /**
   * Get full system health report
   * @returns {Object} Health report
   */
  getHealthReport() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      providers: Object.keys(providerCatalog.providers || {}).length,
      routing: this.getRoutingReport(),
      resilience: this.getResilienceStatus(),
      guardrails: this.getGuardrailsStats(),
      combos: this.listCombos().length,
    };
  }

  /**
   * Register a custom combo
   * @param {string} name - Combo name
   * @param {Object} config - Combo configuration
   */
  registerCombo(name, config) {
    this.comboRouter.registerCombo(name, config);
  }
}

// Singleton
let _instance = null;
function getInstance(options) {
  if (!_instance) _instance = new GSKHeartUnified(options);
  return _instance;
}

module.exports = {
  GSKHeartUnified,
  getInstance,
  providerCatalog,
  GSKHeartRouter,
  GSKHeartChatHandler,
  GSKHeartComboRouter,
  GSKHeartResilienceManager,
  GSKHeartGuardrailsManager,
};
