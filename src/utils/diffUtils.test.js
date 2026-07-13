/**
 * @module diffUtils.test
 * @description Unit tests for diffUtils: correctly identifies changed fields,
 * handles identical objects, handles missing fields, returns proper diff structure.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  getChangedFields,
  getChangedFieldCount,
  hasFieldChanged,
  deepEqual,
} from '@/utils/diffUtils.js';

/**
 * Helper: creates a valid variant manifest for testing.
 * @param {object} [overrides] - Optional overrides for variantData.
 * @returns {object}
 */
function createVariantManifest(overrides = {}) {
  return {
    variantId: 'variant-test-001',
    canonicalPdpId: 'canonical-tv-001',
    cohort: {
      id: 'cohort-budget-shopper',
      name: 'Budget Shopper',
      behaviorSignals: ['frequent-price-filter-usage'],
    },
    tailoringRules: [],
    variantData: {
      title: 'Prism UltraView 65" 4K QLED Smart TV',
      description: 'Experience stunning picture quality. [Synthetic product.]',
      price: 1299.99,
      sku: 'SKU-TV-88Q900',
      category: 'TVs & Home Theater',
      features: ['65-inch 4K QLED display', '120Hz refresh rate'],
      images: ['https://placehold.co/800x600/0046be/ffffff?text=TV+Front'],
      badge: 'Great Value',
      promotionMessage: 'Save big today!',
      ...overrides,
    },
    schemaVersion: 1,
  };
}

describe('diffUtils', () => {
  describe('deepEqual', () => {
    it('returns true for identical primitive strings', () => {
      expect(deepEqual('hello', 'hello')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(deepEqual('hello', 'world')).toBe(false);
    });

    it('returns true for identical numbers', () => {
      expect(deepEqual(42, 42)).toBe(true);
    });

    it('returns false for different numbers', () => {
      expect(deepEqual(42, 43)).toBe(false);
    });

    it('returns true for identical booleans', () => {
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(false, false)).toBe(true);
    });

    it('returns false for different booleans', () => {
      expect(deepEqual(true, false)).toBe(false);
    });

    it('returns true for both null', () => {
      expect(deepEqual(null, null)).toBe(true);
    });

    it('returns true for both undefined', () => {
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('returns false for null vs undefined', () => {
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('returns false for undefined vs null', () => {
      expect(deepEqual(undefined, null)).toBe(false);
    });

    it('returns false for null vs a value', () => {
      expect(deepEqual(null, 'hello')).toBe(false);
    });

    it('returns false for a value vs null', () => {
      expect(deepEqual('hello', null)).toBe(false);
    });

    it('returns false for undefined vs a value', () => {
      expect(deepEqual(undefined, 42)).toBe(false);
    });

    it('returns false for different types', () => {
      expect(deepEqual('42', 42)).toBe(false);
      expect(deepEqual(true, 1)).toBe(false);
    });

    it('returns true for identical arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('returns false for different arrays', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('returns false for arrays of different lengths', () => {
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('returns true for identical objects', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns false for different objects', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for objects with different keys', () => {
      expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('returns true for deeply nested identical objects', () => {
      const obj1 = { a: { b: { c: [1, 2, 3] } } };
      const obj2 = { a: { b: { c: [1, 2, 3] } } };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('returns false for deeply nested different objects', () => {
      const obj1 = { a: { b: { c: [1, 2, 3] } } };
      const obj2 = { a: { b: { c: [1, 2, 4] } } };
      expect(deepEqual(obj1, obj2)).toBe(false);
    });

    it('returns true for the same reference', () => {
      const obj = { a: 1 };
      expect(deepEqual(obj, obj)).toBe(true);
    });

    it('returns true for empty arrays', () => {
      expect(deepEqual([], [])).toBe(true);
    });

    it('returns true for empty objects', () => {
      expect(deepEqual({}, {})).toBe(true);
    });

    it('returns true for both NaN', () => {
      expect(deepEqual(NaN, NaN)).toBe(true);
    });

    it('returns false for NaN vs a number', () => {
      expect(deepEqual(NaN, 42)).toBe(false);
    });

    it('returns true for zero and zero', () => {
      expect(deepEqual(0, 0)).toBe(true);
    });

    it('returns true for empty strings', () => {
      expect(deepEqual('', '')).toBe(true);
    });

    it('returns false for empty string vs non-empty string', () => {
      expect(deepEqual('', 'hello')).toBe(false);
    });
  });

  describe('computeDiff', () => {
    it('returns an empty object when both control and variant are null', () => {
      const diff = computeDiff(null, null);
      expect(diff).toEqual({});
    });

    it('returns an empty object when control is null', () => {
      const variant = createVariantManifest();
      const diff = computeDiff(null, variant);
      expect(diff).toEqual({});
    });

    it('returns an empty object when variant is null', () => {
      const control = createVariantManifest();
      const diff = computeDiff(control, null);
      expect(diff).toEqual({});
    });

    it('returns an empty object when control is undefined', () => {
      const variant = createVariantManifest();
      const diff = computeDiff(undefined, variant);
      expect(diff).toEqual({});
    });

    it('returns an empty object when variant is undefined', () => {
      const control = createVariantManifest();
      const diff = computeDiff(control, undefined);
      expect(diff).toEqual({});
    });

    it('returns all fields as unchanged for identical variants', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest();
      const diff = computeDiff(control, variant);

      expect(Object.keys(diff).length).toBeGreaterThan(0);
      for (const key of Object.keys(diff)) {
        expect(diff[key].changed).toBe(false);
      }
    });

    it('returns proper diff structure with changed, controlValue, and variantValue', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Different Title' });
      const diff = computeDiff(control, variant);

      expect(diff.title).toBeDefined();
      expect(diff.title).toHaveProperty('changed');
      expect(diff.title).toHaveProperty('controlValue');
      expect(diff.title).toHaveProperty('variantValue');
    });

    it('correctly identifies a changed title field', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Tailored Title for Budget Shoppers' });
      const diff = computeDiff(control, variant);

      expect(diff.title.changed).toBe(true);
      expect(diff.title.controlValue).toBe('Prism UltraView 65" 4K QLED Smart TV');
      expect(diff.title.variantValue).toBe('Tailored Title for Budget Shoppers');
    });

    it('correctly identifies a changed price field', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ price: 999.99 });
      const diff = computeDiff(control, variant);

      expect(diff.price.changed).toBe(true);
      expect(diff.price.controlValue).toBe(1299.99);
      expect(diff.price.variantValue).toBe(999.99);
    });

    it('correctly identifies unchanged fields', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Different Title' });
      const diff = computeDiff(control, variant);

      expect(diff.sku.changed).toBe(false);
      expect(diff.sku.controlValue).toBe('SKU-TV-88Q900');
      expect(diff.sku.variantValue).toBe('SKU-TV-88Q900');
    });

    it('correctly identifies changed badge field', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ badge: 'Latest Tech' });
      const diff = computeDiff(control, variant);

      expect(diff.badge.changed).toBe(true);
      expect(diff.badge.controlValue).toBe('Great Value');
      expect(diff.badge.variantValue).toBe('Latest Tech');
    });

    it('correctly identifies changed description field', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ description: 'A completely different description.' });
      const diff = computeDiff(control, variant);

      expect(diff.description.changed).toBe(true);
      expect(diff.description.controlValue).toBe(control.variantData.description);
      expect(diff.description.variantValue).toBe('A completely different description.');
    });

    it('correctly identifies changed features array', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ features: ['New Feature 1', 'New Feature 2', 'New Feature 3'] });
      const diff = computeDiff(control, variant);

      expect(diff.features.changed).toBe(true);
      expect(diff.features.controlValue).toEqual(['65-inch 4K QLED display', '120Hz refresh rate']);
      expect(diff.features.variantValue).toEqual(['New Feature 1', 'New Feature 2', 'New Feature 3']);
    });

    it('correctly identifies changed images array', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ images: ['https://placehold.co/800x600/003da6/ffffff?text=Different'] });
      const diff = computeDiff(control, variant);

      expect(diff.images.changed).toBe(true);
    });

    it('correctly identifies changed promotionMessage field', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ promotionMessage: 'Free shipping on all orders!' });
      const diff = computeDiff(control, variant);

      expect(diff.promotionMessage.changed).toBe(true);
      expect(diff.promotionMessage.controlValue).toBe('Save big today!');
      expect(diff.promotionMessage.variantValue).toBe('Free shipping on all orders!');
    });

    it('correctly identifies changed category field', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ category: 'Electronics' });
      const diff = computeDiff(control, variant);

      expect(diff.category.changed).toBe(true);
      expect(diff.category.controlValue).toBe('TVs & Home Theater');
      expect(diff.category.variantValue).toBe('Electronics');
    });

    it('handles multiple changed fields simultaneously', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({
        title: 'New Title',
        price: 899.99,
        badge: 'Student Favorite',
        promotionMessage: 'Student discount available!',
      });
      const diff = computeDiff(control, variant);

      expect(diff.title.changed).toBe(true);
      expect(diff.price.changed).toBe(true);
      expect(diff.badge.changed).toBe(true);
      expect(diff.promotionMessage.changed).toBe(true);
      expect(diff.sku.changed).toBe(false);
      expect(diff.category.changed).toBe(false);
    });

    it('includes all keys from both control and variant', () => {
      const control = { variantData: { title: 'Control', sku: 'SKU-001' } };
      const variant = { variantData: { title: 'Variant', badge: 'New' } };
      const diff = computeDiff(control, variant);

      expect(diff).toHaveProperty('title');
      expect(diff).toHaveProperty('sku');
      expect(diff).toHaveProperty('badge');
    });

    it('treats missing fields in variant as null', () => {
      const control = { variantData: { title: 'Control', sku: 'SKU-001' } };
      const variant = { variantData: { title: 'Variant' } };
      const diff = computeDiff(control, variant);

      expect(diff.sku.changed).toBe(true);
      expect(diff.sku.controlValue).toBe('SKU-001');
      expect(diff.sku.variantValue).toBeNull();
    });

    it('treats missing fields in control as null', () => {
      const control = { variantData: { title: 'Control' } };
      const variant = { variantData: { title: 'Variant', badge: 'New Badge' } };
      const diff = computeDiff(control, variant);

      expect(diff.badge.changed).toBe(true);
      expect(diff.badge.controlValue).toBeNull();
      expect(diff.badge.variantValue).toBe('New Badge');
    });

    it('works with plain objects (without variantData wrapper)', () => {
      const control = { title: 'Control Title', price: 100 };
      const variant = { title: 'Variant Title', price: 100 };
      const diff = computeDiff(control, variant);

      expect(diff.title.changed).toBe(true);
      expect(diff.price.changed).toBe(false);
    });

    it('returns an empty object when controlData is an array', () => {
      const diff = computeDiff({ variantData: [1, 2, 3] }, { variantData: { title: 'test' } });
      expect(diff).toEqual({});
    });

    it('returns an empty object when variantData is an array', () => {
      const diff = computeDiff({ variantData: { title: 'test' } }, { variantData: [1, 2, 3] });
      expect(diff).toEqual({});
    });

    it('returns an empty object when controlData is null', () => {
      const diff = computeDiff({ variantData: null }, { variantData: { title: 'test' } });
      expect(diff).toEqual({});
    });

    it('returns an empty object when variantData is null', () => {
      const diff = computeDiff({ variantData: { title: 'test' } }, { variantData: null });
      expect(diff).toEqual({});
    });

    it('handles identical arrays as unchanged', () => {
      const control = { variantData: { features: ['a', 'b', 'c'] } };
      const variant = { variantData: { features: ['a', 'b', 'c'] } };
      const diff = computeDiff(control, variant);

      expect(diff.features.changed).toBe(false);
    });

    it('handles reordered arrays as changed', () => {
      const control = { variantData: { features: ['a', 'b', 'c'] } };
      const variant = { variantData: { features: ['c', 'b', 'a'] } };
      const diff = computeDiff(control, variant);

      expect(diff.features.changed).toBe(true);
    });

    it('handles empty objects for both control and variant', () => {
      const diff = computeDiff({ variantData: {} }, { variantData: {} });
      expect(diff).toEqual({});
    });

    it('handles numeric zero as a valid value', () => {
      const control = { variantData: { price: 0 } };
      const variant = { variantData: { price: 0 } };
      const diff = computeDiff(control, variant);

      expect(diff.price.changed).toBe(false);
      expect(diff.price.controlValue).toBe(0);
      expect(diff.price.variantValue).toBe(0);
    });

    it('handles boolean values correctly', () => {
      const control = { variantData: { active: true } };
      const variant = { variantData: { active: false } };
      const diff = computeDiff(control, variant);

      expect(diff.active.changed).toBe(true);
      expect(diff.active.controlValue).toBe(true);
      expect(diff.active.variantValue).toBe(false);
    });

    it('handles empty string vs non-empty string as changed', () => {
      const control = { variantData: { badge: '' } };
      const variant = { variantData: { badge: 'New Badge' } };
      const diff = computeDiff(control, variant);

      expect(diff.badge.changed).toBe(true);
    });
  });

  describe('getChangedFields', () => {
    it('returns an empty array for identical variants', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest();
      const changed = getChangedFields(control, variant);

      expect(changed).toEqual([]);
    });

    it('returns an array of changed field names', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Different Title', price: 999.99 });
      const changed = getChangedFields(control, variant);

      expect(changed).toContain('title');
      expect(changed).toContain('price');
      expect(changed).not.toContain('sku');
      expect(changed).not.toContain('category');
    });

    it('returns an empty array when both are null', () => {
      const changed = getChangedFields(null, null);
      expect(changed).toEqual([]);
    });

    it('returns an empty array when control is null', () => {
      const changed = getChangedFields(null, createVariantManifest());
      expect(changed).toEqual([]);
    });

    it('returns an empty array when variant is null', () => {
      const changed = getChangedFields(createVariantManifest(), null);
      expect(changed).toEqual([]);
    });

    it('returns all field names when all fields differ', () => {
      const control = {
        variantData: {
          title: 'A',
          price: 100,
          sku: 'SKU-A',
        },
      };
      const variant = {
        variantData: {
          title: 'B',
          price: 200,
          sku: 'SKU-B',
        },
      };
      const changed = getChangedFields(control, variant);

      expect(changed).toContain('title');
      expect(changed).toContain('price');
      expect(changed).toContain('sku');
      expect(changed.length).toBe(3);
    });

    it('includes fields present only in control', () => {
      const control = { variantData: { title: 'Control', extra: 'field' } };
      const variant = { variantData: { title: 'Control' } };
      const changed = getChangedFields(control, variant);

      expect(changed).toContain('extra');
    });

    it('includes fields present only in variant', () => {
      const control = { variantData: { title: 'Control' } };
      const variant = { variantData: { title: 'Control', extra: 'field' } };
      const changed = getChangedFields(control, variant);

      expect(changed).toContain('extra');
    });
  });

  describe('getChangedFieldCount', () => {
    it('returns 0 for identical variants', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest();
      const count = getChangedFieldCount(control, variant);

      expect(count).toBe(0);
    });

    it('returns the correct count of changed fields', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({
        title: 'Different Title',
        price: 999.99,
        badge: 'Latest Tech',
      });
      const count = getChangedFieldCount(control, variant);

      expect(count).toBe(3);
    });

    it('returns 0 when both are null', () => {
      const count = getChangedFieldCount(null, null);
      expect(count).toBe(0);
    });

    it('returns 0 when control is null', () => {
      const count = getChangedFieldCount(null, createVariantManifest());
      expect(count).toBe(0);
    });

    it('returns 0 when variant is null', () => {
      const count = getChangedFieldCount(createVariantManifest(), null);
      expect(count).toBe(0);
    });

    it('returns 1 when only one field differs', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Only Title Changed' });
      const count = getChangedFieldCount(control, variant);

      expect(count).toBe(1);
    });

    it('counts fields present only in one side', () => {
      const control = { variantData: { title: 'Control' } };
      const variant = { variantData: { title: 'Control', newField: 'value' } };
      const count = getChangedFieldCount(control, variant);

      expect(count).toBe(1);
    });
  });

  describe('hasFieldChanged', () => {
    it('returns true when a field has changed', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Different Title' });

      expect(hasFieldChanged(control, variant, 'title')).toBe(true);
    });

    it('returns false when a field has not changed', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ title: 'Different Title' });

      expect(hasFieldChanged(control, variant, 'sku')).toBe(false);
    });

    it('returns false when both are null', () => {
      expect(hasFieldChanged(null, null, 'title')).toBe(false);
    });

    it('returns false when control is null', () => {
      expect(hasFieldChanged(null, createVariantManifest(), 'title')).toBe(false);
    });

    it('returns false when variant is null', () => {
      expect(hasFieldChanged(createVariantManifest(), null, 'title')).toBe(false);
    });

    it('returns false for a non-existent field name', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest();

      expect(hasFieldChanged(control, variant, 'nonExistentField')).toBe(false);
    });

    it('returns true when price has changed', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ price: 899.99 });

      expect(hasFieldChanged(control, variant, 'price')).toBe(true);
    });

    it('returns true when features array has changed', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ features: ['New Feature'] });

      expect(hasFieldChanged(control, variant, 'features')).toBe(true);
    });

    it('returns false when features array is identical', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest();

      expect(hasFieldChanged(control, variant, 'features')).toBe(false);
    });

    it('returns true when badge has changed', () => {
      const control = createVariantManifest();
      const variant = createVariantManifest({ badge: 'Premium Pick' });

      expect(hasFieldChanged(control, variant, 'badge')).toBe(true);
    });

    it('returns true when a field exists only in control', () => {
      const control = { variantData: { title: 'Control', extra: 'value' } };
      const variant = { variantData: { title: 'Control' } };

      expect(hasFieldChanged(control, variant, 'extra')).toBe(true);
    });

    it('returns true when a field exists only in variant', () => {
      const control = { variantData: { title: 'Control' } };
      const variant = { variantData: { title: 'Control', extra: 'value' } };

      expect(hasFieldChanged(control, variant, 'extra')).toBe(true);
    });
  });

  describe('integration with variant manifests', () => {
    it('computes diff between two different cohort variants', () => {
      const budgetVariant = createVariantManifest({
        title: 'Prism UltraView 65" 4K QLED Smart TV — Great Value Deal',
        badge: 'Great Value',
        promotionMessage: 'As low as $54.17/mo with 0% APR financing. Save big today!',
      });
      const techVariant = createVariantManifest({
        title: 'Prism UltraView 65" 4K QLED Smart TV — Performance Edition',
        badge: 'Latest Tech',
        promotionMessage: 'Free expedited shipping on the latest tech.',
      });

      const diff = computeDiff(budgetVariant, techVariant);

      expect(diff.title.changed).toBe(true);
      expect(diff.badge.changed).toBe(true);
      expect(diff.promotionMessage.changed).toBe(true);
      expect(diff.sku.changed).toBe(false);
      expect(diff.category.changed).toBe(false);
      expect(diff.price.changed).toBe(false);
    });

    it('detects student price discount as a change', () => {
      const control = createVariantManifest({ price: 1299.99 });
      const studentVariant = createVariantManifest({ price: 1169.99 });

      const diff = computeDiff(control, studentVariant);
      expect(diff.price.changed).toBe(true);
      expect(diff.price.controlValue).toBe(1299.99);
      expect(diff.price.variantValue).toBe(1169.99);
    });

    it('correctly counts all changed fields for a fully tailored variant', () => {
      const control = createVariantManifest();
      const tailored = createVariantManifest({
        title: 'Tailored Title',
        description: 'Tailored description.',
        price: 999.99,
        badge: 'New Badge',
        promotionMessage: 'New promotion.',
        features: ['Different feature'],
        images: ['https://placehold.co/800x600/003da6/ffffff?text=Different'],
      });

      const count = getChangedFieldCount(control, tailored);
      expect(count).toBe(7);

      const changedFields = getChangedFields(control, tailored);
      expect(changedFields).toContain('title');
      expect(changedFields).toContain('description');
      expect(changedFields).toContain('price');
      expect(changedFields).toContain('badge');
      expect(changedFields).toContain('promotionMessage');
      expect(changedFields).toContain('features');
      expect(changedFields).toContain('images');
      expect(changedFields).not.toContain('sku');
      expect(changedFields).not.toContain('category');
    });

    it('returns zero changes when comparing a variant to itself', () => {
      const variant = createVariantManifest({
        title: 'Some Title',
        price: 500,
        badge: 'Badge',
      });

      const count = getChangedFieldCount(variant, variant);
      expect(count).toBe(0);

      const changedFields = getChangedFields(variant, variant);
      expect(changedFields).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles empty variantData objects', () => {
      const control = { variantData: {} };
      const variant = { variantData: {} };
      const diff = computeDiff(control, variant);

      expect(Object.keys(diff).length).toBe(0);
    });

    it('handles control with empty variantData and variant with fields', () => {
      const control = { variantData: {} };
      const variant = { variantData: { title: 'New Title' } };
      const diff = computeDiff(control, variant);

      expect(diff.title.changed).toBe(true);
      expect(diff.title.controlValue).toBeNull();
      expect(diff.title.variantValue).toBe('New Title');
    });

    it('handles variant with empty variantData and control with fields', () => {
      const control = { variantData: { title: 'Control Title' } };
      const variant = { variantData: {} };
      const diff = computeDiff(control, variant);

      expect(diff.title.changed).toBe(true);
      expect(diff.title.controlValue).toBe('Control Title');
      expect(diff.title.variantValue).toBeNull();
    });

    it('handles nested objects within variantData fields', () => {
      const control = { variantData: { specs: { weight: '5 lbs', color: 'black' } } };
      const variant = { variantData: { specs: { weight: '5 lbs', color: 'white' } } };
      const diff = computeDiff(control, variant);

      expect(diff.specs.changed).toBe(true);
    });

    it('handles identical nested objects as unchanged', () => {
      const control = { variantData: { specs: { weight: '5 lbs', color: 'black' } } };
      const variant = { variantData: { specs: { weight: '5 lbs', color: 'black' } } };
      const diff = computeDiff(control, variant);

      expect(diff.specs.changed).toBe(false);
    });

    it('handles undefined field values as null in diff output', () => {
      const control = { variantData: { title: undefined } };
      const variant = { variantData: { title: 'Has Value' } };
      const diff = computeDiff(control, variant);

      expect(diff.title.controlValue).toBeNull();
      expect(diff.title.variantValue).toBe('Has Value');
      expect(diff.title.changed).toBe(true);
    });

    it('treats two undefined field values as unchanged (both null)', () => {
      const control = { variantData: { badge: undefined } };
      const variant = { variantData: { badge: undefined } };
      const diff = computeDiff(control, variant);

      expect(diff.badge.changed).toBe(false);
      expect(diff.badge.controlValue).toBeNull();
      expect(diff.badge.variantValue).toBeNull();
    });
  });
});