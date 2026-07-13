/**
 * @module schemas
 * @description JSON schema definitions for canonical PDP, cohort config, variant, and manifest.
 * Each schema defines required fields, types, and constraints.
 * Implements ManifestSchema from LLD.
 */

/**
 * Schema definition for a cohort configuration object.
 * @type {object}
 */
const cohortSchema = {
  type: 'object',
  required: ['id', 'name', 'behaviorSignals'],
  properties: {
    id: {
      type: 'string',
      minLength: 1,
      description: 'Unique cohort identifier',
    },
    name: {
      type: 'string',
      minLength: 1,
      description: 'Human-readable cohort name',
    },
    behaviorSignals: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 0,
      description: 'List of behavior signals associated with this cohort',
    },
  },
};

/**
 * Schema definition for a tailoring rule.
 * @type {object}
 */
const tailoringRuleSchema = {
  type: 'object',
  required: ['ruleId', 'description', 'applied'],
  properties: {
    ruleId: {
      type: 'string',
      minLength: 1,
      description: 'Unique rule identifier',
    },
    description: {
      type: 'string',
      minLength: 1,
      description: 'Human-readable description of the tailoring rule',
    },
    applied: {
      type: 'boolean',
      description: 'Whether this rule was applied to the variant',
    },
  },
};

/**
 * Schema definition for canonical PDP data.
 * @type {object}
 */
const canonicalPdpSchema = {
  type: 'object',
  required: ['id', 'title', 'price', 'sku', 'category', 'features', 'description', 'images'],
  properties: {
    id: {
      type: 'string',
      minLength: 1,
      description: 'Unique canonical PDP identifier',
    },
    title: {
      type: 'string',
      minLength: 1,
      description: 'Product title',
    },
    price: {
      type: 'number',
      minimum: 0,
      description: 'Product price in USD',
    },
    sku: {
      type: 'string',
      minLength: 1,
      description: 'Product SKU',
    },
    category: {
      type: 'string',
      minLength: 1,
      description: 'Product category',
    },
    features: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 0,
      description: 'List of product features',
    },
    description: {
      type: 'string',
      minLength: 1,
      description: 'Product description',
    },
    images: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 0,
      description: 'List of product image URLs',
    },
  },
};

/**
 * Schema definition for variant data (tailored PDP fields).
 * @type {object}
 */
const variantDataSchema = {
  type: 'object',
  required: ['title', 'price', 'sku', 'category', 'features', 'description', 'images'],
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      description: 'Tailored product title',
    },
    price: {
      type: 'number',
      minimum: 0,
      description: 'Tailored product price in USD',
    },
    sku: {
      type: 'string',
      minLength: 1,
      description: 'Product SKU',
    },
    category: {
      type: 'string',
      minLength: 1,
      description: 'Product category',
    },
    features: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 0,
      description: 'Tailored list of product features',
    },
    description: {
      type: 'string',
      minLength: 1,
      description: 'Tailored product description',
    },
    images: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 0,
      description: 'Tailored list of product image URLs',
    },
    badge: {
      type: 'string',
      description: 'Optional promotional badge text',
    },
    promotionMessage: {
      type: 'string',
      description: 'Optional promotion message',
    },
  },
};

/**
 * Schema definition for a complete variant manifest.
 * @type {object}
 */
const variantManifestSchema = {
  type: 'object',
  required: ['variantId', 'canonicalPdpId', 'cohort', 'tailoringRules', 'variantData'],
  properties: {
    variantId: {
      type: 'string',
      minLength: 1,
      description: 'Unique variant identifier',
    },
    canonicalPdpId: {
      type: 'string',
      minLength: 1,
      description: 'Reference to the canonical PDP this variant was generated from',
    },
    cohort: cohortSchema,
    tailoringRules: {
      type: 'array',
      items: tailoringRuleSchema,
      minItems: 0,
      description: 'List of tailoring rules applied to this variant',
    },
    variantData: variantDataSchema,
    schemaVersion: {
      type: 'number',
      description: 'Schema version for migration support',
    },
  },
};

/**
 * Validates a value against a type constraint.
 * @param {*} value - The value to check
 * @param {string} expectedType - The expected type string from schema
 * @returns {boolean}
 */
function isValidType(value, expectedType) {
  if (expectedType === 'string') {
    return typeof value === 'string';
  }
  if (expectedType === 'number') {
    return typeof value === 'number' && !Number.isNaN(value);
  }
  if (expectedType === 'boolean') {
    return typeof value === 'boolean';
  }
  if (expectedType === 'array') {
    return Array.isArray(value);
  }
  if (expectedType === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  return false;
}

/**
 * Validates a value against a schema definition.
 * @param {*} value - The value to validate
 * @param {object} schema - The schema to validate against
 * @param {string} [path=''] - The current property path for error messages
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAgainstSchema(value, schema, path = '') {
  const errors = [];

  if (value === null || value === undefined) {
    errors.push(`${path || 'root'}: value is required but was ${value}`);
    return { valid: false, errors };
  }

  if (schema.type && !isValidType(value, schema.type)) {
    errors.push(`${path || 'root'}: expected type "${schema.type}" but got "${typeof value}"`);
    return { valid: false, errors };
  }

  if (schema.type === 'string' && schema.minLength !== undefined) {
    if (value.length < schema.minLength) {
      errors.push(`${path || 'root'}: string length must be at least ${schema.minLength}`);
    }
  }

  if (schema.type === 'number' && schema.minimum !== undefined) {
    if (value < schema.minimum) {
      errors.push(`${path || 'root'}: number must be at least ${schema.minimum}`);
    }
  }

  if (schema.type === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path || 'root'}: array must have at least ${schema.minItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        const itemResult = validateAgainstSchema(item, schema.items, `${path}[${index}]`);
        if (!itemResult.valid) {
          errors.push(...itemResult.errors);
        }
      });
    }
  }

  if (schema.type === 'object' && schema.properties) {
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (value[requiredField] === undefined || value[requiredField] === null) {
          errors.push(`${path ? path + '.' : ''}${requiredField}: required field is missing`);
        }
      }
    }

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (value[propName] !== undefined && value[propName] !== null) {
        const propPath = path ? `${path}.${propName}` : propName;
        const propResult = validateAgainstSchema(value[propName], propSchema, propPath);
        if (!propResult.valid) {
          errors.push(...propResult.errors);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * ManifestSchema - validates variant manifests against the defined schema.
 * Implements the ManifestSchema interface from the LLD.
 */
const ManifestSchema = {
  /**
   * Validates a variant manifest object.
   * @param {object} manifest - The manifest to validate
   * @returns {{ valid: boolean, errors?: string[] }}
   */
  validate(manifest) {
    const result = validateAgainstSchema(manifest, variantManifestSchema);
    if (result.valid) {
      return { valid: true };
    }
    return { valid: false, errors: result.errors };
  },

  /**
   * Validates a canonical PDP object.
   * @param {object} pdp - The canonical PDP to validate
   * @returns {{ valid: boolean, errors?: string[] }}
   */
  validateCanonicalPdp(pdp) {
    const result = validateAgainstSchema(pdp, canonicalPdpSchema);
    if (result.valid) {
      return { valid: true };
    }
    return { valid: false, errors: result.errors };
  },

  /**
   * Validates a cohort configuration object.
   * @param {object} cohort - The cohort config to validate
   * @returns {{ valid: boolean, errors?: string[] }}
   */
  validateCohort(cohort) {
    const result = validateAgainstSchema(cohort, cohortSchema);
    if (result.valid) {
      return { valid: true };
    }
    return { valid: false, errors: result.errors };
  },

  /**
   * Validates variant data (tailored PDP fields).
   * @param {object} data - The variant data to validate
   * @returns {{ valid: boolean, errors?: string[] }}
   */
  validateVariantData(data) {
    const result = validateAgainstSchema(data, variantDataSchema);
    if (result.valid) {
      return { valid: true };
    }
    return { valid: false, errors: result.errors };
  },

  /**
   * Validates a tailoring rule object.
   * @param {object} rule - The tailoring rule to validate
   * @returns {{ valid: boolean, errors?: string[] }}
   */
  validateTailoringRule(rule) {
    const result = validateAgainstSchema(rule, tailoringRuleSchema);
    if (result.valid) {
      return { valid: true };
    }
    return { valid: false, errors: result.errors };
  },
};

export {
  cohortSchema,
  tailoringRuleSchema,
  canonicalPdpSchema,
  variantDataSchema,
  variantManifestSchema,
  validateAgainstSchema,
  ManifestSchema,
};