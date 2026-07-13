/**
 * @module schemaValidator.test
 * @description Unit tests for SchemaValidator: validates correct data passes,
 * missing required fields fail, type mismatches fail, null/undefined handling,
 * nested object validation, and error message accuracy.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect } from 'vitest';
import {
  SchemaValidator,
  validate,
  validateVariantManifest,
  validateCanonicalPdp,
  validateCohort,
  validateVariantData,
  validateTailoringRule,
  validateArray,
  ManifestSchema,
} from '@/utils/schemaValidator.js';
import {
  variantManifestSchema,
  canonicalPdpSchema,
  cohortSchema,
  variantDataSchema,
  tailoringRuleSchema,
} from '@/schemas/schemas.js';
import { syntheticTV, syntheticLaptop } from '@/data/canonicalProducts.js';
import { budgetShopperCohort, techEnthusiastCohort } from '@/data/cohorts.js';

/**
 * Helper: creates a valid variant manifest for testing.
 * @returns {object}
 */
function createValidManifest() {
  return {
    variantId: 'variant-test-001',
    canonicalPdpId: 'canonical-tv-001',
    cohort: {
      id: 'cohort-budget-shopper',
      name: 'Budget Shopper',
      behaviorSignals: ['frequent-price-filter-usage', 'sort-by-price-low-to-high'],
    },
    tailoringRules: [
      {
        ruleId: 'rule-budget-hero-image',
        description: 'Prioritize hero image showing price tag or value badge overlay',
        applied: true,
      },
    ],
    variantData: {
      title: 'Prism UltraView 65" 4K QLED Smart TV — Great Value Deal',
      description: 'Experience stunning picture quality. [Synthetic variant.]',
      price: 1299.99,
      sku: 'SKU-TV-88Q900',
      category: 'TVs & Home Theater',
      features: ['65-inch 4K QLED display', '120Hz refresh rate'],
      images: ['https://placehold.co/800x600/0046be/ffffff?text=TV+Front'],
      badge: 'Great Value',
      promotionMessage: 'Save big today!',
    },
    schemaVersion: 1,
  };
}

/**
 * Helper: creates valid variant data for testing.
 * @returns {object}
 */
function createValidVariantData() {
  return {
    title: 'Test Product Title',
    description: 'Test product description.',
    price: 999.99,
    sku: 'SKU-TEST-001',
    category: 'Test Category',
    features: ['Feature 1', 'Feature 2'],
    images: ['https://placehold.co/800x600'],
    badge: 'Test Badge',
    promotionMessage: 'Test promotion.',
  };
}

/**
 * Helper: creates a valid canonical PDP for testing.
 * @returns {object}
 */
function createValidCanonicalPdp() {
  return {
    id: 'canonical-test-001',
    title: 'Test Product',
    price: 499.99,
    sku: 'SKU-TEST-001',
    category: 'Test Category',
    features: ['Feature A'],
    description: 'A test product description.',
    images: ['https://placehold.co/800x600'],
  };
}

/**
 * Helper: creates a valid cohort for testing.
 * @returns {object}
 */
function createValidCohort() {
  return {
    id: 'cohort-test',
    name: 'Test Cohort',
    behaviorSignals: ['signal-a', 'signal-b'],
  };
}

/**
 * Helper: creates a valid tailoring rule for testing.
 * @returns {object}
 */
function createValidTailoringRule() {
  return {
    ruleId: 'rule-test-001',
    description: 'A test tailoring rule',
    applied: true,
  };
}

describe('SchemaValidator', () => {
  describe('SchemaValidator class', () => {
    it('creates an instance with a valid schema', () => {
      const validator = new SchemaValidator(variantManifestSchema);
      expect(validator).toBeDefined();
      expect(validator.schema).toBe(variantManifestSchema);
    });

    it('throws an error when constructed with null schema', () => {
      expect(() => new SchemaValidator(null)).toThrow('SchemaValidator requires a valid schema object.');
    });

    it('throws an error when constructed with undefined schema', () => {
      expect(() => new SchemaValidator(undefined)).toThrow('SchemaValidator requires a valid schema object.');
    });

    it('throws an error when constructed with an array', () => {
      expect(() => new SchemaValidator([])).toThrow('SchemaValidator requires a valid schema object.');
    });

    it('throws an error when constructed with a string', () => {
      expect(() => new SchemaValidator('schema')).toThrow('SchemaValidator requires a valid schema object.');
    });

    it('validates correct data and returns valid: true', () => {
      const validator = new SchemaValidator(variantManifestSchema);
      const manifest = createValidManifest();
      const result = validator.validate(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns valid: false for null data', () => {
      const validator = new SchemaValidator(variantManifestSchema);
      const result = validator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('required');
    });

    it('returns valid: false for undefined data', () => {
      const validator = new SchemaValidator(variantManifestSchema);
      const result = validator.validate(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('required');
    });

    it('returns errors array even when valid', () => {
      const validator = new SchemaValidator(variantManifestSchema);
      const manifest = createValidManifest();
      const result = validator.validate(manifest);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('validate function', () => {
    it('validates correct data against a schema', () => {
      const result = validate(createValidManifest(), variantManifestSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid for null data', () => {
      const result = validate(null, variantManifestSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid for undefined data', () => {
      const result = validate(undefined, variantManifestSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns invalid for null schema', () => {
      const result = validate({ test: 'data' }, null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('A valid schema object is required for validation.');
    });

    it('returns invalid for undefined schema', () => {
      const result = validate({ test: 'data' }, undefined);
      expect(result.valid).toBe(false);
    });

    it('returns invalid for array schema', () => {
      const result = validate({ test: 'data' }, []);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('A valid schema object is required for validation.');
    });
  });

  describe('validateVariantManifest', () => {
    it('passes for a valid variant manifest', () => {
      const manifest = createValidManifest();
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('fails when variantId is missing', () => {
      const manifest = createValidManifest();
      delete manifest.variantId;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantId'))).toBe(true);
    });

    it('fails when canonicalPdpId is missing', () => {
      const manifest = createValidManifest();
      delete manifest.canonicalPdpId;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('canonicalPdpId'))).toBe(true);
    });

    it('fails when cohort is missing', () => {
      const manifest = createValidManifest();
      delete manifest.cohort;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('cohort'))).toBe(true);
    });

    it('fails when tailoringRules is missing', () => {
      const manifest = createValidManifest();
      delete manifest.tailoringRules;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('tailoringRules'))).toBe(true);
    });

    it('fails when variantData is missing', () => {
      const manifest = createValidManifest();
      delete manifest.variantData;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantData'))).toBe(true);
    });

    it('fails when variantId is an empty string', () => {
      const manifest = createValidManifest();
      manifest.variantId = '';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantId'))).toBe(true);
    });

    it('fails when variantId is a number instead of string', () => {
      const manifest = createValidManifest();
      manifest.variantId = 12345;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('variantId'))).toBe(true);
    });

    it('fails when cohort has missing required fields', () => {
      const manifest = createValidManifest();
      manifest.cohort = { id: 'test' };
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('fails when variantData has wrong type for price', () => {
      const manifest = createValidManifest();
      manifest.variantData.price = 'not-a-number';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('price'))).toBe(true);
    });

    it('fails when variantData features is not an array', () => {
      const manifest = createValidManifest();
      manifest.variantData.features = 'not-an-array';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('features'))).toBe(true);
    });

    it('fails when tailoringRules contains invalid rule objects', () => {
      const manifest = createValidManifest();
      manifest.tailoringRules = [{ ruleId: 'test' }]; // missing description and applied
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('passes with optional schemaVersion present', () => {
      const manifest = createValidManifest();
      manifest.schemaVersion = 2;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('passes with optional badge and promotionMessage', () => {
      const manifest = createValidManifest();
      manifest.variantData.badge = 'Sale';
      manifest.variantData.promotionMessage = 'Limited time offer!';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('fails for a non-object input (string)', () => {
      const result = validateVariantManifest('not-an-object');
      expect(result.valid).toBe(false);
    });

    it('fails for a non-object input (array)', () => {
      const result = validateVariantManifest([1, 2, 3]);
      expect(result.valid).toBe(false);
    });

    it('fails for a non-object input (number)', () => {
      const result = validateVariantManifest(42);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCanonicalPdp', () => {
    it('passes for a valid canonical PDP', () => {
      const result = validateCanonicalPdp(createValidCanonicalPdp());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('passes for syntheticTV data', () => {
      const result = validateCanonicalPdp(syntheticTV);
      expect(result.valid).toBe(true);
    });

    it('passes for syntheticLaptop data', () => {
      const result = validateCanonicalPdp(syntheticLaptop);
      expect(result.valid).toBe(true);
    });

    it('fails when id is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.id;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('id'))).toBe(true);
    });

    it('fails when title is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.title;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
    });

    it('fails when price is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.price;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('price'))).toBe(true);
    });

    it('fails when price is a string', () => {
      const pdp = createValidCanonicalPdp();
      pdp.price = 'free';
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('price'))).toBe(true);
    });

    it('fails when sku is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.sku;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sku'))).toBe(true);
    });

    it('fails when category is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.category;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('category'))).toBe(true);
    });

    it('fails when features is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.features;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('features'))).toBe(true);
    });

    it('fails when description is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.description;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('fails when images is missing', () => {
      const pdp = createValidCanonicalPdp();
      delete pdp.images;
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('images'))).toBe(true);
    });

    it('fails for null input', () => {
      const result = validateCanonicalPdp(null);
      expect(result.valid).toBe(false);
    });

    it('fails for undefined input', () => {
      const result = validateCanonicalPdp(undefined);
      expect(result.valid).toBe(false);
    });

    it('passes with empty features array', () => {
      const pdp = createValidCanonicalPdp();
      pdp.features = [];
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(true);
    });

    it('passes with empty images array', () => {
      const pdp = createValidCanonicalPdp();
      pdp.images = [];
      const result = validateCanonicalPdp(pdp);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCohort', () => {
    it('passes for a valid cohort', () => {
      const result = validateCohort(createValidCohort());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('passes for budgetShopperCohort data', () => {
      const result = validateCohort(budgetShopperCohort);
      expect(result.valid).toBe(true);
    });

    it('passes for techEnthusiastCohort data', () => {
      const result = validateCohort(techEnthusiastCohort);
      expect(result.valid).toBe(true);
    });

    it('fails when id is missing', () => {
      const cohort = createValidCohort();
      delete cohort.id;
      const result = validateCohort(cohort);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('id'))).toBe(true);
    });

    it('fails when name is missing', () => {
      const cohort = createValidCohort();
      delete cohort.name;
      const result = validateCohort(cohort);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('fails when behaviorSignals is missing', () => {
      const cohort = createValidCohort();
      delete cohort.behaviorSignals;
      const result = validateCohort(cohort);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('behaviorSignals'))).toBe(true);
    });

    it('fails when id is an empty string', () => {
      const cohort = createValidCohort();
      cohort.id = '';
      const result = validateCohort(cohort);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('id'))).toBe(true);
    });

    it('fails when name is a number', () => {
      const cohort = createValidCohort();
      cohort.name = 123;
      const result = validateCohort(cohort);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('fails when behaviorSignals is not an array', () => {
      const cohort = createValidCohort();
      cohort.behaviorSignals = 'not-an-array';
      const result = validateCohort(cohort);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('behaviorSignals'))).toBe(true);
    });

    it('passes with empty behaviorSignals array', () => {
      const cohort = createValidCohort();
      cohort.behaviorSignals = [];
      const result = validateCohort(cohort);
      expect(result.valid).toBe(true);
    });

    it('fails for null input', () => {
      const result = validateCohort(null);
      expect(result.valid).toBe(false);
    });

    it('fails for undefined input', () => {
      const result = validateCohort(undefined);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateVariantData', () => {
    it('passes for valid variant data', () => {
      const result = validateVariantData(createValidVariantData());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('fails when title is missing', () => {
      const data = createValidVariantData();
      delete data.title;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
    });

    it('fails when price is missing', () => {
      const data = createValidVariantData();
      delete data.price;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('price'))).toBe(true);
    });

    it('fails when price is NaN', () => {
      const data = createValidVariantData();
      data.price = NaN;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('price'))).toBe(true);
    });

    it('fails when sku is missing', () => {
      const data = createValidVariantData();
      delete data.sku;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sku'))).toBe(true);
    });

    it('fails when category is missing', () => {
      const data = createValidVariantData();
      delete data.category;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('category'))).toBe(true);
    });

    it('fails when features is missing', () => {
      const data = createValidVariantData();
      delete data.features;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('features'))).toBe(true);
    });

    it('fails when description is missing', () => {
      const data = createValidVariantData();
      delete data.description;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('fails when images is missing', () => {
      const data = createValidVariantData();
      delete data.images;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('images'))).toBe(true);
    });

    it('fails when title is an empty string', () => {
      const data = createValidVariantData();
      data.title = '';
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
    });

    it('fails when description is a number', () => {
      const data = createValidVariantData();
      data.description = 42;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('passes with optional badge present', () => {
      const data = createValidVariantData();
      data.badge = 'Hot Deal';
      const result = validateVariantData(data);
      expect(result.valid).toBe(true);
    });

    it('passes with optional promotionMessage present', () => {
      const data = createValidVariantData();
      data.promotionMessage = 'Limited time!';
      const result = validateVariantData(data);
      expect(result.valid).toBe(true);
    });

    it('fails for null input', () => {
      const result = validateVariantData(null);
      expect(result.valid).toBe(false);
    });

    it('fails for undefined input', () => {
      const result = validateVariantData(undefined);
      expect(result.valid).toBe(false);
    });

    it('fails when features contains non-string items', () => {
      const data = createValidVariantData();
      data.features = [123, true];
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
    });

    it('fails when images contains non-string items', () => {
      const data = createValidVariantData();
      data.images = [42];
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTailoringRule', () => {
    it('passes for a valid tailoring rule', () => {
      const result = validateTailoringRule(createValidTailoringRule());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('fails when ruleId is missing', () => {
      const rule = createValidTailoringRule();
      delete rule.ruleId;
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ruleId'))).toBe(true);
    });

    it('fails when description is missing', () => {
      const rule = createValidTailoringRule();
      delete rule.description;
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('fails when applied is missing', () => {
      const rule = createValidTailoringRule();
      delete rule.applied;
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('applied'))).toBe(true);
    });

    it('fails when ruleId is an empty string', () => {
      const rule = createValidTailoringRule();
      rule.ruleId = '';
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ruleId'))).toBe(true);
    });

    it('fails when applied is a string instead of boolean', () => {
      const rule = createValidTailoringRule();
      rule.applied = 'true';
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('applied'))).toBe(true);
    });

    it('passes when applied is false', () => {
      const rule = createValidTailoringRule();
      rule.applied = false;
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(true);
    });

    it('fails for null input', () => {
      const result = validateTailoringRule(null);
      expect(result.valid).toBe(false);
    });

    it('fails for undefined input', () => {
      const result = validateTailoringRule(undefined);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateArray', () => {
    it('validates an array of valid cohorts', () => {
      const cohorts = [createValidCohort(), createValidCohort()];
      const result = validateArray(cohorts, cohortSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.invalidIndices).toEqual([]);
    });

    it('returns invalid indices for mixed valid/invalid items', () => {
      const cohorts = [
        createValidCohort(),
        { id: 'missing-name' }, // missing name and behaviorSignals
        createValidCohort(),
      ];
      const result = validateArray(cohorts, cohortSchema);
      expect(result.valid).toBe(false);
      expect(result.invalidIndices).toContain(1);
      expect(result.invalidIndices).not.toContain(0);
      expect(result.invalidIndices).not.toContain(2);
    });

    it('returns invalid for non-array input', () => {
      const result = validateArray('not-an-array', cohortSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expected an array of items to validate.');
      expect(result.invalidIndices).toEqual([]);
    });

    it('returns invalid for null schema', () => {
      const result = validateArray([createValidCohort()], null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('A valid schema object is required for validation.');
    });

    it('returns invalid for array schema', () => {
      const result = validateArray([createValidCohort()], []);
      expect(result.valid).toBe(false);
    });

    it('passes for an empty array', () => {
      const result = validateArray([], cohortSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.invalidIndices).toEqual([]);
    });

    it('validates an array of valid tailoring rules', () => {
      const rules = [createValidTailoringRule(), createValidTailoringRule()];
      const result = validateArray(rules, tailoringRuleSchema);
      expect(result.valid).toBe(true);
    });

    it('reports all invalid indices when all items are invalid', () => {
      const items = [
        { bad: 'data' },
        { also: 'bad' },
      ];
      const result = validateArray(items, cohortSchema);
      expect(result.valid).toBe(false);
      expect(result.invalidIndices).toContain(0);
      expect(result.invalidIndices).toContain(1);
    });
  });

  describe('ManifestSchema', () => {
    it('validates a valid manifest via ManifestSchema.validate', () => {
      const result = ManifestSchema.validate(createValidManifest());
      expect(result.valid).toBe(true);
    });

    it('rejects an invalid manifest via ManifestSchema.validate', () => {
      const result = ManifestSchema.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates a valid canonical PDP via ManifestSchema.validateCanonicalPdp', () => {
      const result = ManifestSchema.validateCanonicalPdp(syntheticTV);
      expect(result.valid).toBe(true);
    });

    it('rejects an invalid canonical PDP via ManifestSchema.validateCanonicalPdp', () => {
      const result = ManifestSchema.validateCanonicalPdp({});
      expect(result.valid).toBe(false);
    });

    it('validates a valid cohort via ManifestSchema.validateCohort', () => {
      const result = ManifestSchema.validateCohort(budgetShopperCohort);
      expect(result.valid).toBe(true);
    });

    it('rejects an invalid cohort via ManifestSchema.validateCohort', () => {
      const result = ManifestSchema.validateCohort({});
      expect(result.valid).toBe(false);
    });

    it('validates valid variant data via ManifestSchema.validateVariantData', () => {
      const result = ManifestSchema.validateVariantData(createValidVariantData());
      expect(result.valid).toBe(true);
    });

    it('rejects invalid variant data via ManifestSchema.validateVariantData', () => {
      const result = ManifestSchema.validateVariantData({});
      expect(result.valid).toBe(false);
    });

    it('validates a valid tailoring rule via ManifestSchema.validateTailoringRule', () => {
      const result = ManifestSchema.validateTailoringRule(createValidTailoringRule());
      expect(result.valid).toBe(true);
    });

    it('rejects an invalid tailoring rule via ManifestSchema.validateTailoringRule', () => {
      const result = ManifestSchema.validateTailoringRule({});
      expect(result.valid).toBe(false);
    });
  });

  describe('error message accuracy', () => {
    it('includes field path in error messages for missing required fields', () => {
      const manifest = createValidManifest();
      delete manifest.variantId;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      const hasFieldPath = result.errors.some((e) => e.includes('variantId') && e.includes('required'));
      expect(hasFieldPath).toBe(true);
    });

    it('includes type information in error messages for type mismatches', () => {
      const manifest = createValidManifest();
      manifest.variantData.price = 'wrong-type';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      const hasTypeInfo = result.errors.some((e) => e.includes('price') && e.includes('number'));
      expect(hasTypeInfo).toBe(true);
    });

    it('includes nested path in error messages for nested validation failures', () => {
      const manifest = createValidManifest();
      manifest.cohort.id = '';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      const hasNestedPath = result.errors.some((e) => e.includes('id'));
      expect(hasNestedPath).toBe(true);
    });

    it('reports multiple errors when multiple fields are invalid', () => {
      const manifest = createValidManifest();
      delete manifest.variantId;
      delete manifest.canonicalPdpId;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some((e) => e.includes('variantId'))).toBe(true);
      expect(result.errors.some((e) => e.includes('canonicalPdpId'))).toBe(true);
    });

    it('reports errors for invalid items within arrays', () => {
      const manifest = createValidManifest();
      manifest.variantData.features = ['valid', 123, 'also-valid'];
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      const hasArrayIndexError = result.errors.some((e) => e.includes('[1]'));
      expect(hasArrayIndexError).toBe(true);
    });

    it('includes root path for top-level type mismatch', () => {
      const result = validateVariantManifest('not-an-object');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('root') || e.includes('type'))).toBe(true);
    });
  });

  describe('nested object validation', () => {
    it('validates nested cohort object within manifest', () => {
      const manifest = createValidManifest();
      manifest.cohort = {
        id: 'cohort-test',
        name: 'Test',
        behaviorSignals: ['signal-1'],
      };
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('fails for deeply nested invalid data in cohort behaviorSignals', () => {
      const manifest = createValidManifest();
      manifest.cohort.behaviorSignals = [123];
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
    });

    it('fails for deeply nested invalid data in tailoringRules', () => {
      const manifest = createValidManifest();
      manifest.tailoringRules = [
        {
          ruleId: '',
          description: 'Valid description',
          applied: true,
        },
      ];
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ruleId'))).toBe(true);
    });

    it('validates nested variantData within manifest', () => {
      const manifest = createValidManifest();
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('fails when nested variantData title is null', () => {
      const manifest = createValidManifest();
      manifest.variantData.title = null;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('title'))).toBe(true);
    });

    it('fails when nested cohort name is null', () => {
      const manifest = createValidManifest();
      manifest.cohort.name = null;
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles an object with extra properties gracefully', () => {
      const manifest = createValidManifest();
      manifest.extraField = 'should be ignored';
      const result = validateVariantManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('handles price of zero as valid', () => {
      const data = createValidVariantData();
      data.price = 0;
      const result = validateVariantData(data);
      expect(result.valid).toBe(true);
    });

    it('handles negative price as invalid', () => {
      const data = createValidVariantData();
      data.price = -10;
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('price'))).toBe(true);
    });

    it('handles boolean false for applied in tailoring rule', () => {
      const rule = createValidTailoringRule();
      rule.applied = false;
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(true);
    });

    it('handles empty string for description in tailoring rule as invalid', () => {
      const rule = createValidTailoringRule();
      rule.description = '';
      const result = validateTailoringRule(rule);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('handles features array with empty strings as invalid', () => {
      const data = createValidVariantData();
      data.features = [''];
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
    });

    it('handles images array with empty strings as invalid', () => {
      const data = createValidVariantData();
      data.images = [''];
      const result = validateVariantData(data);
      expect(result.valid).toBe(false);
    });
  });
});