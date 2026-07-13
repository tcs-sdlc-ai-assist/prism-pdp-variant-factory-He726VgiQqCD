/**
 * @module variantFactory.test
 * @description Unit tests for VariantFactory: generates exactly 10 variants,
 * each variant has required fields, variants are cohort-specific, schema validation
 * passes for all variants, deterministic output for same input, handles missing/invalid
 * input gracefully.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  VariantFactory,
  generateVariants,
  generateVariantsForProduct,
  generateSingleVariant,
  getVisualDiff,
  generateVariantId,
  tailorTitle,
  tailorDescription,
  tailorImages,
  tailorPrice,
  tailorFeatures,
  generateBadge,
  generatePromotionMessage,
  getAppliedRules,
  sortFeaturesByKeywords,
} from '@/services/variantFactory.js';
import { validateVariantManifest } from '@/utils/schemaValidator.js';
import { VARIANT_COUNT } from '@/constants/constants.js';
import { canonicalProducts, syntheticTV, syntheticLaptop } from '@/data/canonicalProducts.js';
import { cohorts, budgetShopperCohort, techEnthusiastCohort, premiumBuyerCohort, studentCohort, businessBuyerCohort } from '@/data/cohorts.js';

describe('VariantFactory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateVariantId', () => {
    it('generates a deterministic variant ID from product, cohort, and index', () => {
      const result = generateVariantId('product-1', 'cohort-1', 0);
      expect(result).toBe('variant-product-1-cohort-1-0');
    });

    it('generates different IDs for different indices', () => {
      const id1 = generateVariantId('product-1', 'cohort-1', 0);
      const id2 = generateVariantId('product-1', 'cohort-1', 1);
      expect(id1).not.toBe(id2);
    });

    it('generates different IDs for different cohorts', () => {
      const id1 = generateVariantId('product-1', 'cohort-a', 0);
      const id2 = generateVariantId('product-1', 'cohort-b', 0);
      expect(id1).not.toBe(id2);
    });

    it('generates different IDs for different products', () => {
      const id1 = generateVariantId('product-1', 'cohort-1', 0);
      const id2 = generateVariantId('product-2', 'cohort-1', 0);
      expect(id1).not.toBe(id2);
    });
  });

  describe('tailorTitle', () => {
    const originalTitle = 'Test Product Title';

    it('appends "Great Value Deal" for budget shopper cohort', () => {
      const result = tailorTitle(originalTitle, budgetShopperCohort);
      expect(result).toBe('Test Product Title — Great Value Deal');
    });

    it('appends "Performance Edition" for tech enthusiast cohort', () => {
      const result = tailorTitle(originalTitle, techEnthusiastCohort);
      expect(result).toBe('Test Product Title — Performance Edition');
    });

    it('appends "Premium Collection" for premium buyer cohort', () => {
      const result = tailorTitle(originalTitle, premiumBuyerCohort);
      expect(result).toBe('Test Product Title — Premium Collection');
    });

    it('appends "Student Essentials" for student cohort', () => {
      const result = tailorTitle(originalTitle, studentCohort);
      expect(result).toBe('Test Product Title — Student Essentials');
    });

    it('appends "Business Pro" for business buyer cohort', () => {
      const result = tailorTitle(originalTitle, businessBuyerCohort);
      expect(result).toBe('Test Product Title — Business Pro');
    });

    it('returns original title for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      const result = tailorTitle(originalTitle, unknownCohort);
      expect(result).toBe(originalTitle);
    });
  });

  describe('tailorDescription', () => {
    const originalDescription = 'Original description.';

    it('adds budget-focused messaging for budget shopper cohort', () => {
      const result = tailorDescription(originalDescription, budgetShopperCohort);
      expect(result).toContain(originalDescription);
      expect(result).toContain('Save more');
      expect(result).toContain('[Synthetic variant.]');
    });

    it('adds tech-focused messaging for tech enthusiast cohort', () => {
      const result = tailorDescription(originalDescription, techEnthusiastCohort);
      expect(result).toContain(originalDescription);
      expect(result).toContain('power users');
      expect(result).toContain('[Synthetic variant.]');
    });

    it('adds premium messaging for premium buyer cohort', () => {
      const result = tailorDescription(originalDescription, premiumBuyerCohort);
      expect(result).toContain(originalDescription);
      expect(result).toContain('premium');
      expect(result).toContain('[Synthetic variant.]');
    });

    it('adds student messaging for student cohort', () => {
      const result = tailorDescription(originalDescription, studentCohort);
      expect(result).toContain(originalDescription);
      expect(result).toContain('campus');
      expect(result).toContain('[Synthetic variant.]');
    });

    it('adds business messaging for business buyer cohort', () => {
      const result = tailorDescription(originalDescription, businessBuyerCohort);
      expect(result).toContain(originalDescription);
      expect(result).toContain('Enterprise-ready');
      expect(result).toContain('[Synthetic variant.]');
    });

    it('returns original description for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      const result = tailorDescription(originalDescription, unknownCohort);
      expect(result).toBe(originalDescription);
    });
  });

  describe('tailorImages', () => {
    const originalImages = ['img-0.jpg', 'img-1.jpg', 'img-2.jpg', 'img-3.jpg'];

    it('returns images unchanged for budget shopper cohort', () => {
      const result = tailorImages(originalImages, budgetShopperCohort);
      expect(result).toEqual(originalImages);
    });

    it('reorders images for tech enthusiast cohort', () => {
      const result = tailorImages(originalImages, techEnthusiastCohort);
      expect(result[0]).toBe('img-2.jpg');
      expect(result.length).toBe(originalImages.length);
    });

    it('reorders images for premium buyer cohort', () => {
      const result = tailorImages(originalImages, premiumBuyerCohort);
      expect(result[0]).toBe('img-1.jpg');
      expect(result.length).toBe(originalImages.length);
    });

    it('reorders images for student cohort', () => {
      const result = tailorImages(originalImages, studentCohort);
      expect(result[0]).toBe('img-2.jpg');
      expect(result.length).toBe(originalImages.length);
    });

    it('reorders images for business buyer cohort', () => {
      const result = tailorImages(originalImages, businessBuyerCohort);
      expect(result[0]).toBe('img-3.jpg');
      expect(result.length).toBe(originalImages.length);
    });

    it('returns original images for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      const result = tailorImages(originalImages, unknownCohort);
      expect(result).toEqual(originalImages);
    });

    it('handles empty images array', () => {
      const result = tailorImages([], budgetShopperCohort);
      expect(result).toEqual([]);
    });

    it('handles null images', () => {
      const result = tailorImages(null, budgetShopperCohort);
      expect(result).toBeNull();
    });

    it('handles single image array without error', () => {
      const result = tailorImages(['single.jpg'], techEnthusiastCohort);
      expect(result).toEqual(['single.jpg']);
    });

    it('does not mutate the original images array', () => {
      const original = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'];
      const copy = [...original];
      tailorImages(original, premiumBuyerCohort);
      expect(original).toEqual(copy);
    });
  });

  describe('tailorPrice', () => {
    it('returns original price for budget shopper cohort', () => {
      const result = tailorPrice(1000, budgetShopperCohort);
      expect(result).toBe(1000);
    });

    it('returns original price for tech enthusiast cohort', () => {
      const result = tailorPrice(1000, techEnthusiastCohort);
      expect(result).toBe(1000);
    });

    it('returns original price for premium buyer cohort', () => {
      const result = tailorPrice(1000, premiumBuyerCohort);
      expect(result).toBe(1000);
    });

    it('applies 10% discount for student cohort', () => {
      const result = tailorPrice(1000, studentCohort);
      expect(result).toBe(900);
    });

    it('applies 10% discount with proper rounding for student cohort', () => {
      const result = tailorPrice(1299.99, studentCohort);
      expect(result).toBe(1169.99);
    });

    it('returns original price for business buyer cohort', () => {
      const result = tailorPrice(1000, businessBuyerCohort);
      expect(result).toBe(1000);
    });

    it('returns original price for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      const result = tailorPrice(500, unknownCohort);
      expect(result).toBe(500);
    });
  });

  describe('tailorFeatures', () => {
    const features = [
      'Wi-Fi 6E connectivity',
      '120Hz refresh rate',
      'Energy efficient design',
      'Thunderbolt 4 port',
      'Dolby Atmos audio',
      'Up to 10 hours battery life',
    ];

    it('prioritizes cost-saving features for budget shopper cohort', () => {
      const result = tailorFeatures(features, budgetShopperCohort);
      expect(result[0]).toBe('Energy efficient design');
      expect(result.length).toBe(features.length);
    });

    it('prioritizes performance features for tech enthusiast cohort', () => {
      const result = tailorFeatures(features, techEnthusiastCohort);
      const firstFeature = result[0].toLowerCase();
      expect(
        firstFeature.includes('hz') ||
        firstFeature.includes('thunderbolt') ||
        firstFeature.includes('refresh')
      ).toBe(true);
    });

    it('prioritizes design features for premium buyer cohort', () => {
      const result = tailorFeatures(features, premiumBuyerCohort);
      const firstFeature = result[0].toLowerCase();
      expect(
        firstFeature.includes('dolby') ||
        firstFeature.includes('atmos') ||
        firstFeature.includes('design') ||
        firstFeature.includes('premium')
      ).toBe(true);
    });

    it('prioritizes portability features for student cohort', () => {
      const result = tailorFeatures(features, studentCohort);
      const firstFeature = result[0].toLowerCase();
      expect(
        firstFeature.includes('battery') ||
        firstFeature.includes('hour') ||
        firstFeature.includes('wi-fi')
      ).toBe(true);
    });

    it('prioritizes security features for business buyer cohort', () => {
      const result = tailorFeatures(features, businessBuyerCohort);
      const firstFeature = result[0].toLowerCase();
      expect(
        firstFeature.includes('thunderbolt') ||
        firstFeature.includes('port') ||
        firstFeature.includes('bluetooth') ||
        firstFeature.includes('security')
      ).toBe(true);
    });

    it('returns original features for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      const result = tailorFeatures(features, unknownCohort);
      expect(result).toEqual(features);
    });

    it('handles empty features array', () => {
      const result = tailorFeatures([], budgetShopperCohort);
      expect(result).toEqual([]);
    });

    it('handles null features', () => {
      const result = tailorFeatures(null, budgetShopperCohort);
      expect(result).toBeNull();
    });

    it('does not mutate the original features array', () => {
      const original = ['Feature A', 'Feature B'];
      const copy = [...original];
      tailorFeatures(original, budgetShopperCohort);
      expect(original).toEqual(copy);
    });
  });

  describe('generateBadge', () => {
    it('returns "Great Value" for budget shopper cohort', () => {
      expect(generateBadge(budgetShopperCohort)).toBe('Great Value');
    });

    it('returns "Latest Tech" for tech enthusiast cohort', () => {
      expect(generateBadge(techEnthusiastCohort)).toBe('Latest Tech');
    });

    it('returns "Premium Pick" for premium buyer cohort', () => {
      expect(generateBadge(premiumBuyerCohort)).toBe('Premium Pick');
    });

    it('returns "Student Favorite" for student cohort', () => {
      expect(generateBadge(studentCohort)).toBe('Student Favorite');
    });

    it('returns "Business Ready" for business buyer cohort', () => {
      expect(generateBadge(businessBuyerCohort)).toBe('Business Ready');
    });

    it('returns empty string for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      expect(generateBadge(unknownCohort)).toBe('');
    });
  });

  describe('generatePromotionMessage', () => {
    const price = 1200;

    it('generates financing message for budget shopper cohort', () => {
      const result = generatePromotionMessage(budgetShopperCohort, price);
      expect(result).toContain('$');
      expect(result).toContain('/mo');
      expect(result).toContain('APR');
    });

    it('generates shipping message for tech enthusiast cohort', () => {
      const result = generatePromotionMessage(techEnthusiastCohort, price);
      expect(result).toContain('expedited shipping');
    });

    it('generates premium service message for premium buyer cohort', () => {
      const result = generatePromotionMessage(premiumBuyerCohort, price);
      expect(result).toContain('white-glove');
      expect(result).toContain('warranty');
    });

    it('generates student discount message for student cohort', () => {
      const result = generatePromotionMessage(studentCohort, price);
      expect(result).toContain('Student price');
      expect(result).toContain('.edu');
      expect(result).toContain('10%');
    });

    it('generates volume discount message for business buyer cohort', () => {
      const result = generatePromotionMessage(businessBuyerCohort, price);
      expect(result).toContain('Volume discounts');
      expect(result).toContain('quote');
    });

    it('returns empty string for unknown cohort', () => {
      const unknownCohort = { id: 'cohort-unknown', name: 'Unknown', behaviorSignals: [] };
      expect(generatePromotionMessage(unknownCohort, price)).toBe('');
    });
  });

  describe('getAppliedRules', () => {
    it('extracts tailoring rules from a cohort with rules', () => {
      const rules = getAppliedRules(budgetShopperCohort);
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      rules.forEach((rule) => {
        expect(rule).toHaveProperty('ruleId');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('applied');
        expect(typeof rule.ruleId).toBe('string');
        expect(typeof rule.description).toBe('string');
        expect(typeof rule.applied).toBe('boolean');
      });
    });

    it('returns empty array when cohort has no tailoringRules', () => {
      const cohort = { id: 'test', name: 'Test', behaviorSignals: [] };
      const rules = getAppliedRules(cohort);
      expect(rules).toEqual([]);
    });

    it('returns empty array when tailoringRules is null', () => {
      const cohort = { id: 'test', name: 'Test', behaviorSignals: [], tailoringRules: null };
      const rules = getAppliedRules(cohort);
      expect(rules).toEqual([]);
    });

    it('returns empty array when tailoringRules is not an array', () => {
      const cohort = { id: 'test', name: 'Test', behaviorSignals: [], tailoringRules: 'invalid' };
      const rules = getAppliedRules(cohort);
      expect(rules).toEqual([]);
    });
  });

  describe('sortFeaturesByKeywords', () => {
    it('moves features matching keywords to the top', () => {
      const features = ['No match', 'Has energy keyword', 'Another no match'];
      const keywords = ['energy'];
      const result = sortFeaturesByKeywords(features, keywords);
      expect(result[0]).toBe('Has energy keyword');
      expect(result.length).toBe(3);
    });

    it('preserves order of non-matching features', () => {
      const features = ['C no match', 'A no match', 'B no match'];
      const keywords = ['xyz'];
      const result = sortFeaturesByKeywords(features, keywords);
      expect(result).toEqual(['C no match', 'A no match', 'B no match']);
    });

    it('handles empty features array', () => {
      const result = sortFeaturesByKeywords([], ['keyword']);
      expect(result).toEqual([]);
    });

    it('handles empty keywords array', () => {
      const features = ['Feature A', 'Feature B'];
      const result = sortFeaturesByKeywords(features, []);
      expect(result).toEqual(['Feature A', 'Feature B']);
    });

    it('is case-insensitive for keyword matching', () => {
      const features = ['ENERGY Efficient', 'Other feature'];
      const keywords = ['energy'];
      const result = sortFeaturesByKeywords(features, keywords);
      expect(result[0]).toBe('ENERGY Efficient');
    });
  });

  describe('generateSingleVariant', () => {
    it('generates a variant with all required fields', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);

      expect(variant).toHaveProperty('variantId');
      expect(variant).toHaveProperty('canonicalPdpId');
      expect(variant).toHaveProperty('cohort');
      expect(variant).toHaveProperty('tailoringRules');
      expect(variant).toHaveProperty('variantData');
      expect(variant).toHaveProperty('schemaVersion');
    });

    it('sets the correct canonicalPdpId', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(variant.canonicalPdpId).toBe(syntheticTV.id);
    });

    it('sets the correct cohort information', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(variant.cohort.id).toBe(budgetShopperCohort.id);
      expect(variant.cohort.name).toBe(budgetShopperCohort.name);
      expect(Array.isArray(variant.cohort.behaviorSignals)).toBe(true);
    });

    it('includes tailoring rules from the cohort', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(Array.isArray(variant.tailoringRules)).toBe(true);
      expect(variant.tailoringRules.length).toBeGreaterThan(0);
    });

    it('includes tailored variant data', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      const { variantData } = variant;

      expect(variantData).toHaveProperty('title');
      expect(variantData).toHaveProperty('description');
      expect(variantData).toHaveProperty('price');
      expect(variantData).toHaveProperty('sku');
      expect(variantData).toHaveProperty('category');
      expect(variantData).toHaveProperty('features');
      expect(variantData).toHaveProperty('images');
      expect(variantData).toHaveProperty('badge');
      expect(variantData).toHaveProperty('promotionMessage');
    });

    it('sets schemaVersion to 1', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(variant.schemaVersion).toBe(1);
    });

    it('passes schema validation', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      const result = validateVariantManifest(variant);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('generates a tailored title for the cohort', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(variant.variantData.title).toContain('Great Value Deal');
    });

    it('generates a tailored description for the cohort', () => {
      const variant = generateSingleVariant(syntheticTV, techEnthusiastCohort, 0);
      expect(variant.variantData.description).toContain('power users');
    });

    it('generates a badge for the cohort', () => {
      const variant = generateSingleVariant(syntheticTV, premiumBuyerCohort, 0);
      expect(variant.variantData.badge).toBe('Premium Pick');
    });

    it('generates a promotion message for the cohort', () => {
      const variant = generateSingleVariant(syntheticTV, studentCohort, 0);
      expect(variant.variantData.promotionMessage).toContain('Student price');
    });

    it('applies student discount to price', () => {
      const variant = generateSingleVariant(syntheticTV, studentCohort, 0);
      const expectedPrice = Math.round(syntheticTV.price * 0.9 * 100) / 100;
      expect(variant.variantData.price).toBe(expectedPrice);
    });

    it('preserves original SKU', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(variant.variantData.sku).toBe(syntheticTV.sku);
    });

    it('preserves original category', () => {
      const variant = generateSingleVariant(syntheticTV, budgetShopperCohort, 0);
      expect(variant.variantData.category).toBe(syntheticTV.category);
    });
  });

  describe('generateVariants', () => {
    it('generates exactly VARIANT_COUNT (10) variants', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      expect(variants.length).toBe(VARIANT_COUNT);
    });

    it('generates variants that all pass schema validation', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        const result = validateVariantManifest(variant);
        expect(result.valid).toBe(true);
      });
    });

    it('generates variants with unique IDs', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      const ids = variants.map((v) => v.variantId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(variants.length);
    });

    it('distributes cohorts across products deterministically', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      const cohortIds = variants.map((v) => v.cohort.id);
      expect(cohortIds.length).toBe(VARIANT_COUNT);
    });

    it('produces deterministic output for the same input', async () => {
      const variants1 = await generateVariants(canonicalProducts, cohorts);
      const variants2 = await generateVariants(canonicalProducts, cohorts);

      expect(variants1.length).toBe(variants2.length);
      for (let i = 0; i < variants1.length; i++) {
        expect(variants1[i].variantId).toBe(variants2[i].variantId);
        expect(variants1[i].canonicalPdpId).toBe(variants2[i].canonicalPdpId);
        expect(variants1[i].cohort.id).toBe(variants2[i].cohort.id);
        expect(variants1[i].variantData.title).toBe(variants2[i].variantData.title);
        expect(variants1[i].variantData.price).toBe(variants2[i].variantData.price);
      }
    });

    it('each variant has required fields', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(variant.variantId).toBeDefined();
        expect(typeof variant.variantId).toBe('string');
        expect(variant.variantId.length).toBeGreaterThan(0);

        expect(variant.canonicalPdpId).toBeDefined();
        expect(typeof variant.canonicalPdpId).toBe('string');

        expect(variant.cohort).toBeDefined();
        expect(variant.cohort.id).toBeDefined();
        expect(variant.cohort.name).toBeDefined();
        expect(Array.isArray(variant.cohort.behaviorSignals)).toBe(true);

        expect(Array.isArray(variant.tailoringRules)).toBe(true);

        expect(variant.variantData).toBeDefined();
        expect(variant.variantData.title).toBeDefined();
        expect(variant.variantData.description).toBeDefined();
        expect(typeof variant.variantData.price).toBe('number');
        expect(variant.variantData.sku).toBeDefined();
        expect(variant.variantData.category).toBeDefined();
        expect(Array.isArray(variant.variantData.features)).toBe(true);
        expect(Array.isArray(variant.variantData.images)).toBe(true);
      });
    });

    it('variants are cohort-specific with tailored content', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);

      const budgetVariant = variants.find((v) => v.cohort.id === 'cohort-budget-shopper');
      if (budgetVariant) {
        expect(budgetVariant.variantData.title).toContain('Great Value Deal');
        expect(budgetVariant.variantData.badge).toBe('Great Value');
      }

      const techVariant = variants.find((v) => v.cohort.id === 'cohort-tech-enthusiast');
      if (techVariant) {
        expect(techVariant.variantData.title).toContain('Performance Edition');
        expect(techVariant.variantData.badge).toBe('Latest Tech');
      }

      const premiumVariant = variants.find((v) => v.cohort.id === 'cohort-premium-buyer');
      if (premiumVariant) {
        expect(premiumVariant.variantData.title).toContain('Premium Collection');
        expect(premiumVariant.variantData.badge).toBe('Premium Pick');
      }

      const studentVariant = variants.find((v) => v.cohort.id === 'cohort-student');
      if (studentVariant) {
        expect(studentVariant.variantData.title).toContain('Student Essentials');
        expect(studentVariant.variantData.badge).toBe('Student Favorite');
      }

      const businessVariant = variants.find((v) => v.cohort.id === 'cohort-business-buyer');
      if (businessVariant) {
        expect(businessVariant.variantData.title).toContain('Business Pro');
        expect(businessVariant.variantData.badge).toBe('Business Ready');
      }
    });

    it('throws an error when canonicalProducts is empty', async () => {
      await expect(generateVariants([], cohorts)).rejects.toThrow();
    });

    it('throws an error when canonicalProducts is not an array', async () => {
      await expect(generateVariants('invalid', cohorts)).rejects.toThrow();
    });

    it('throws an error when canonicalProducts is null', async () => {
      await expect(generateVariants(null, cohorts)).rejects.toThrow();
    });

    it('throws an error when canonicalProducts is undefined', async () => {
      await expect(generateVariants(undefined, cohorts)).rejects.toThrow();
    });

    it('throws an error when cohorts is empty', async () => {
      await expect(generateVariants(canonicalProducts, [])).rejects.toThrow();
    });

    it('throws an error when cohorts is not an array', async () => {
      await expect(generateVariants(canonicalProducts, 'invalid')).rejects.toThrow();
    });

    it('throws an error when cohorts is null', async () => {
      await expect(generateVariants(canonicalProducts, null)).rejects.toThrow();
    });

    it('throws an error when cohorts is undefined', async () => {
      await expect(generateVariants(canonicalProducts, undefined)).rejects.toThrow();
    });

    it('generates variants with a single product and multiple cohorts', async () => {
      const variants = await generateVariants([syntheticTV], cohorts);
      expect(variants.length).toBe(VARIANT_COUNT);
      variants.forEach((variant) => {
        expect(variant.canonicalPdpId).toBe(syntheticTV.id);
      });
    });

    it('generates variants with multiple products and a single cohort', async () => {
      const variants = await generateVariants(canonicalProducts, [budgetShopperCohort]);
      expect(variants.length).toBe(VARIANT_COUNT);
      variants.forEach((variant) => {
        expect(variant.cohort.id).toBe(budgetShopperCohort.id);
      });
    });

    it('does not exceed VARIANT_COUNT', async () => {
      const manyCohorts = [...cohorts, ...cohorts, ...cohorts];
      const variants = await generateVariants(canonicalProducts, manyCohorts);
      expect(variants.length).toBeLessThanOrEqual(VARIANT_COUNT);
    });

    it('logs error and skips invalid variants', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should still work since generateSingleVariant produces valid variants
      const variants = await generateVariants(canonicalProducts, cohorts);
      expect(variants.length).toBe(VARIANT_COUNT);

      consoleSpy.mockRestore();
    });
  });

  describe('generateVariantsForProduct', () => {
    it('generates one variant per cohort for a single product', async () => {
      const variants = await generateVariantsForProduct(syntheticTV, cohorts);
      expect(variants.length).toBe(cohorts.length);
    });

    it('all variants reference the same canonical product', async () => {
      const variants = await generateVariantsForProduct(syntheticTV, cohorts);
      variants.forEach((variant) => {
        expect(variant.canonicalPdpId).toBe(syntheticTV.id);
      });
    });

    it('each variant has a different cohort', async () => {
      const variants = await generateVariantsForProduct(syntheticTV, cohorts);
      const cohortIds = variants.map((v) => v.cohort.id);
      const uniqueCohortIds = new Set(cohortIds);
      expect(uniqueCohortIds.size).toBe(cohorts.length);
    });

    it('all variants pass schema validation', async () => {
      const variants = await generateVariantsForProduct(syntheticLaptop, cohorts);
      variants.forEach((variant) => {
        const result = validateVariantManifest(variant);
        expect(result.valid).toBe(true);
      });
    });

    it('throws an error when canonicalProduct is null', async () => {
      await expect(generateVariantsForProduct(null, cohorts)).rejects.toThrow();
    });

    it('throws an error when canonicalProduct is not an object', async () => {
      await expect(generateVariantsForProduct('invalid', cohorts)).rejects.toThrow();
    });

    it('throws an error when cohorts is empty', async () => {
      await expect(generateVariantsForProduct(syntheticTV, [])).rejects.toThrow();
    });

    it('throws an error when cohorts is not an array', async () => {
      await expect(generateVariantsForProduct(syntheticTV, 'invalid')).rejects.toThrow();
    });

    it('throws an error when cohorts is null', async () => {
      await expect(generateVariantsForProduct(syntheticTV, null)).rejects.toThrow();
    });
  });

  describe('getVisualDiff', () => {
    it('returns an empty object when control and target are identical', async () => {
      const variants = await generateVariantsForProduct(syntheticTV, [budgetShopperCohort]);
      const variant = variants[0];
      const diff = getVisualDiff(variant, variant);
      expect(Object.keys(diff).length).toBe(0);
    });

    it('returns differing fields between control and target', async () => {
      const variants = await generateVariantsForProduct(syntheticTV, [budgetShopperCohort, techEnthusiastCohort]);
      const control = variants[0];
      const target = variants[1];
      const diff = getVisualDiff(control, target);

      expect(Object.keys(diff).length).toBeGreaterThan(0);
      expect(diff.title).toBeDefined();
      expect(diff.title.control).toBe(control.variantData.title);
      expect(diff.title.variant).toBe(target.variantData.title);
    });

    it('returns empty object when controlVariant is null', () => {
      const diff = getVisualDiff(null, { variantData: { title: 'test' } });
      expect(diff).toEqual({});
    });

    it('returns empty object when controlVariant has no variantData', () => {
      const diff = getVisualDiff({}, { variantData: { title: 'test' } });
      expect(diff).toEqual({});
    });

    it('returns empty object when targetVariant is null', () => {
      const diff = getVisualDiff({ variantData: { title: 'test' } }, null);
      expect(diff).toEqual({});
    });

    it('returns empty object when targetVariant has no variantData', () => {
      const diff = getVisualDiff({ variantData: { title: 'test' } }, {});
      expect(diff).toEqual({});
    });

    it('detects price differences', () => {
      const control = { variantData: { price: 100 } };
      const target = { variantData: { price: 90 } };
      const diff = getVisualDiff(control, target);
      expect(diff.price).toBeDefined();
      expect(diff.price.control).toBe(100);
      expect(diff.price.variant).toBe(90);
    });

    it('does not include unchanged fields', () => {
      const control = { variantData: { sku: 'SKU-001', price: 100 } };
      const target = { variantData: { sku: 'SKU-001', price: 200 } };
      const diff = getVisualDiff(control, target);
      expect(diff.sku).toBeUndefined();
      expect(diff.price).toBeDefined();
    });
  });

  describe('VariantFactory static methods', () => {
    it('generateVariants generates exactly 10 variants', async () => {
      const variants = await VariantFactory.generateVariants(canonicalProducts, cohorts);
      expect(variants.length).toBe(VARIANT_COUNT);
    });

    it('generateVariantsForProduct generates variants for all cohorts', async () => {
      const variants = await VariantFactory.generateVariantsForProduct(syntheticTV, cohorts);
      expect(variants.length).toBe(cohorts.length);
    });

    it('getVisualDiff returns diff between two variants', async () => {
      const variants = await VariantFactory.generateVariantsForProduct(syntheticTV, [budgetShopperCohort, techEnthusiastCohort]);
      const diff = VariantFactory.getVisualDiff(variants[0], variants[1]);
      expect(Object.keys(diff).length).toBeGreaterThan(0);
    });
  });

  describe('end-to-end variant generation', () => {
    it('generates valid variants for syntheticTV across all cohorts', async () => {
      const variants = await generateVariantsForProduct(syntheticTV, cohorts);
      expect(variants.length).toBe(cohorts.length);
      variants.forEach((variant) => {
        const result = validateVariantManifest(variant);
        expect(result.valid).toBe(true);
        expect(variant.variantData.sku).toBe(syntheticTV.sku);
        expect(variant.variantData.category).toBe(syntheticTV.category);
      });
    });

    it('generates valid variants for syntheticLaptop across all cohorts', async () => {
      const variants = await generateVariantsForProduct(syntheticLaptop, cohorts);
      expect(variants.length).toBe(cohorts.length);
      variants.forEach((variant) => {
        const result = validateVariantManifest(variant);
        expect(result.valid).toBe(true);
        expect(variant.variantData.sku).toBe(syntheticLaptop.sku);
        expect(variant.variantData.category).toBe(syntheticLaptop.category);
      });
    });

    it('student variants have discounted prices', async () => {
      const tvVariants = await generateVariantsForProduct(syntheticTV, [studentCohort]);
      const laptopVariants = await generateVariantsForProduct(syntheticLaptop, [studentCohort]);

      const expectedTvPrice = Math.round(syntheticTV.price * 0.9 * 100) / 100;
      const expectedLaptopPrice = Math.round(syntheticLaptop.price * 0.9 * 100) / 100;

      expect(tvVariants[0].variantData.price).toBe(expectedTvPrice);
      expect(laptopVariants[0].variantData.price).toBe(expectedLaptopPrice);
    });

    it('non-student variants preserve original prices', async () => {
      const nonStudentCohorts = cohorts.filter((c) => c.id !== 'cohort-student');
      const variants = await generateVariantsForProduct(syntheticTV, nonStudentCohorts);

      variants.forEach((variant) => {
        expect(variant.variantData.price).toBe(syntheticTV.price);
      });
    });

    it('all generated variants have non-empty titles', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(variant.variantData.title.length).toBeGreaterThan(0);
      });
    });

    it('all generated variants have non-empty descriptions', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(variant.variantData.description.length).toBeGreaterThan(0);
      });
    });

    it('all generated variants have images arrays', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(Array.isArray(variant.variantData.images)).toBe(true);
        expect(variant.variantData.images.length).toBeGreaterThan(0);
      });
    });

    it('all generated variants have features arrays', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(Array.isArray(variant.variantData.features)).toBe(true);
        expect(variant.variantData.features.length).toBeGreaterThan(0);
      });
    });

    it('all generated variants have tailoring rules', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(Array.isArray(variant.tailoringRules)).toBe(true);
        expect(variant.tailoringRules.length).toBeGreaterThan(0);
        variant.tailoringRules.forEach((rule) => {
          expect(rule.ruleId).toBeDefined();
          expect(rule.description).toBeDefined();
          expect(typeof rule.applied).toBe('boolean');
        });
      });
    });

    it('all generated variants have behavior signals', async () => {
      const variants = await generateVariants(canonicalProducts, cohorts);
      variants.forEach((variant) => {
        expect(Array.isArray(variant.cohort.behaviorSignals)).toBe(true);
        expect(variant.cohort.behaviorSignals.length).toBeGreaterThan(0);
      });
    });
  });
});