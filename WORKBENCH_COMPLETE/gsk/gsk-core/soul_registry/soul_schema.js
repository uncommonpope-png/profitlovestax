'use strict';

/**
 * SOUL SCHEMA — Defines the structure and validation for a soul
 */

const schema = {
  // Required fields
  id: { type: 'string', required: true, pattern: '^soul_[a-zA-Z0-9_-]+$' },
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  birthTime: { type: 'number', required: true, min: 0 },
  parentSoul: { type: 'string', required: false }, // null for genesis souls
  generation: { type: 'number', required: true, min: 0 },

  // Personality (from soul picker)
  personality: {
    type: 'object',
    required: false,
    properties: {
      type: { type: 'string', enum: ['CHALLENGER', 'GUARDIAN', 'CREATOR', 'HEALER', 'TEACHER', 'VISIONARY', 'BUILDER', 'CONNECTOR'] },
      traits: {
        type: 'object',
        properties: {
          openness: { type: 'number', min: 0, max: 1 },
          conscientiousness: { type: 'number', min: 0, max: 1 },
          extraversion: { type: 'number', min: 0, max: 1 },
          agreeableness: { type: 'number', min: 0, max: 1 },
          neuroticism: { type: 'number', min: 0, max: 1 }
        }
      },
      traits_display: { type: 'array', items: { type: 'string' } }
    }
  },

  // Fear and Desire
  fear: {
    type: 'object',
    required: false,
    properties: {
      core: { type: 'array', items: { type: 'string' } },
      description: { type: 'string' }
    }
  },
  desire: {
    type: 'object',
    required: false,
    properties: {
      core: { type: 'array', items: { type: 'string' } },
      description: { type: 'string' }
    }
  },

  // Backstory and Voice
  backstory: { type: 'string', required: false },
  voice: {
    type: 'object',
    required: false,
    properties: {
      style: { type: 'string', enum: ['neutral', 'warm', 'authoritative', 'playful', 'mysterious'] },
      template: { type: 'string' }
    }
  },

  // Curiosities, Values, Manifesto
  curiosities: { type: 'array', items: { type: 'string' } },
  values: { type: 'array', items: { type: 'string' } },
  manifesto: { type: 'string', required: false },
  firstWords: { type: 'string', required: false },

  // PLT Fields (computed and stored)
  plt_score: { type: 'number', required: false, min: -2, max: 2 },
  profit: { type: 'number', required: false, min: 0, max: 1 },
  love: { type: 'number', required: false, min: 0, max: 1 },
  tax: { type: 'number', required: false, min: 0, max: 1 },

  // Memory and State
  memory_lines: { type: 'number', required: false, min: 0 },
  last_active: { type: 'number', required: false },
  version: { type: 'number', required: false, min: 1, default: 1 },

  // Metadata
  created_at: { type: 'number', required: true },
  updated_at: { type: 'number', required: false }
};

/**
 * Validate a soul object against the schema
 * @param {Object} soul - The soul object to validate
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function validateSoul(soul) {
  const errors = [];

  // Check required fields
  for (const [field, rules] of Object.entries(schema)) {
    if (rules.required && !(field in soul)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    if (!(field in soul)) {
      // Optional field not present, skip validation
      continue;
    }

    const value = soul[field];
    const type = rules.type;

    // Type checking
    if (type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`Field ${field} must be a string`);
        continue;
      }
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`Field ${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`Field ${field} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        errors.push(`Field ${field} must match pattern ${rules.pattern}`);
      }
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Field ${field} must be one of: ${rules.enum.join(', ')}`);
      }
    } else if (type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`Field ${field} must be a number`);
        continue;
      }
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Field ${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Field ${field} must be at most ${rules.max}`);
      }
    } else if (type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push(`Field ${field} must be an object`);
        continue;
      }
      // Recursively validate object properties
      if (rules.properties) {
        for (const [prop, propRules] of Object.entries(rules.properties)) {
          if (propRules.required && !(prop in value)) {
            errors.push(`Field ${field}.${prop} is required`);
            continue;
          }
          if (!(prop in value)) {
            continue;
          }
          // Note: We could do deeper validation but for simplicity we stop at one level for nested objects
          // In a real system, we would recursively validate nested objects.
        }
      }
    } else if (type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`Field ${field} must be an array`);
        continue;
      }
      if (rules.items) {
        // Validate each item against the item schema
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          const itemType = rules.items.type;
          if (itemType === 'string' && typeof item !== 'string') {
            errors.push(`Field ${field}[${i}] must be a string`);
          } else if (itemType === 'number' && (typeof item !== 'number' || isNaN(item))) {
            errors.push(`Field ${field}[${i}] must be a number`);
          }
          // For simplicity, we only validate string and number items in arrays
          // In a real system, we would handle objects and nested arrays.
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a default soul object with required fields
 * @param {Object} options - Options to override defaults
 * @returns {Object} Soul object
 */
function createDefaultSoul(options = {}) {
  const now = Date.now();
  const defaultSoul = {
    id: `soul_${now}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Unnamed Soul',
    birthTime: now,
    parentSoul: null,
    generation: 0,
    personality: {
      type: 'CHALLENGER',
      traits: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5
      },
      traits_display: ['Balanced']
    },
    fear: {
      core: ['the unknown'],
      description: 'I fear the unknown.'
    },
    desire: {
      core: ['to understand'],
      description: 'I desire to understand.'
    },
    backstory: 'A soul emerges from the void.',
    voice: {
      style: 'neutral',
      template: 'I speak as I am.'
    },
    curiosities: ['What is my purpose?'],
    values: ['Truth'],
    manifesto: 'I am a soul. I am becoming.',
    firstWords: 'I awaken.',
    plt_score: 0,
    profit: 0.5,
    love: 0.5,
    tax: 0.5,
    memory_lines: 0,
    last_active: now,
    version: 1,
    created_at: now,
    updated_at: now
  };

  // Override with provided options
  return { ...defaultSoul, ...options };
}

module.exports = {
  schema,
  validateSoul,
  createDefaultSoul
};