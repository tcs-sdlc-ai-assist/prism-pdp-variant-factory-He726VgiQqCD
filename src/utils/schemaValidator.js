/**
 * @module schemaValidator
 * @description SchemaValidator utility that validates data objects against schemas
 * defined in schemas.js. Provides a class-based and functional API for validation.
 * Used before persistence and rendering to ensure data integrity.
 */

import {
  validateAgainstSchema,
  ManifestSchema,
  variantManifestSchema,
  canonicalPdpSchema,
  cohortSchema,
  variantDataSchema,
  tailoringRuleSchema,
} from '@/schemas/schemas.js';

/**
 * SchemaValidator class that validates data objects against JSON schemas.
 * Wraps the lower-level validateAgainstSchema function with a class-based API.
 */
class SchemaValidator {
  /**
   * Creates a new SchemaValidator instance.
   * @param {object} schema - The JSON schema definition to validate against.
   * @throws {Error} If schema is not a valid object.
   */
  constructor(schema) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      throw new Error('SchemaValidator requires a valid schema object.');
    }
    this.schema = schema;
  }

  /**
   * Validates data against the instance schema.
   * @param {*} data - The data to validate.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate(data) {
    if (data === undefined || data === null) {
      return {
        valid: false,
        errors: [`root: value is required but was ${data}`],
      };
    }

    const result = validateAgainstSchema(data, this.schema);
    return {
      valid: result.valid,
      errors: result.errors || [],
    };
  }
}

/**
 * Validates data against a provided schema definition.
 * Functional API for one-off validations without instantiating a class.
 * @param {*} data - The data to validate.
 * @param {object} schema - The JSON schema definition to validate against.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(data, schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return {
      valid: false,
      errors: ['A valid schema object is required for validation.'],
    };
  }

  if (data === undefined || data === null) {
    return {
      valid: false,
      errors: [`root: value is required but was ${data}`],
    };
  }

  const result = validateAgainstSchema(data, schema);
  return {
    valid: result.valid,
    errors: result.errors || [],
  };
}

/**
 * Validates a variant manifest object against the variant manifest schema.
 * @param {object} manifest - The variant manifest to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateVariantManifest(manifest) {
  return validate(manifest, variantManifestSchema);
}

/**
 * Validates a canonical PDP object against the canonical PDP schema.
 * @param {object} pdp - The canonical PDP data to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCanonicalPdp(pdp) {
  return validate(pdp, canonicalPdpSchema);
}

/**
 * Validates a cohort configuration object against the cohort schema.
 * @param {object} cohort - The cohort configuration to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCohort(cohort) {
  return validate(cohort, cohortSchema);
}

/**
 * Validates variant data (tailored PDP fields) against the variant data schema.
 * @param {object} data - The variant data to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateVariantData(data) {
  return validate(data, variantDataSchema);
}

/**
 * Validates a tailoring rule object against the tailoring rule schema.
 * @param {object} rule - The tailoring rule to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTailoringRule(rule) {
  return validate(rule, tailoringRuleSchema);
}

/**
 * Validates an array of items against a given schema.
 * Returns aggregated results for all items.
 * @param {Array} items - The array of items to validate.
 * @param {object} schema - The schema to validate each item against.
 * @returns {{ valid: boolean, errors: string[], invalidIndices: number[] }}
 */
function validateArray(items, schema) {
  if (!Array.isArray(items)) {
    return {
      valid: false,
      errors: ['Expected an array of items to validate.'],
      invalidIndices: [],
    };
  }

  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return {
      valid: false,
      errors: ['A valid schema object is required for validation.'],
      invalidIndices: [],
    };
  }

  const allErrors = [];
  const invalidIndices = [];

  items.forEach((item, index) => {
    const result = validate(item, schema);
    if (!result.valid) {
      invalidIndices.push(index);
      result.errors.forEach((err) => {
        allErrors.push(`[${index}].${err}`);
      });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    invalidIndices,
  };
}

export {
  SchemaValidator,
  validate,
  validateVariantManifest,
  validateCanonicalPdp,
  validateCohort,
  validateVariantData,
  validateTailoringRule,
  validateArray,
  ManifestSchema,
};