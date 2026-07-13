/**
 * @module exportManager.test
 * @description Unit tests for ExportManager: single variant export produces valid JSON,
 * bulk export produces valid JSON array, schema validation runs before export,
 * handles export errors, Blob creation and download trigger verification.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ExportManager,
  exportVariantManifest,
  exportAllManifests,
  revokeBlobUrl,
  generateFilename,
  triggerDownload,
} from '@/services/exportManager.js';
import { validateVariantManifest } from '@/utils/schemaValidator.js';

/**
 * Helper: creates a valid variant manifest for testing.
 * @returns {object}
 */
function createValidManifest(overrides = {}) {
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
    ...overrides,
  };
}

/**
 * Helper: creates a second valid variant manifest for bulk export testing.
 * @returns {object}
 */
function createSecondValidManifest() {
  return createValidManifest({
    variantId: 'variant-test-002',
    cohort: {
      id: 'cohort-tech-enthusiast',
      name: 'Tech Enthusiast',
      behaviorSignals: ['spec-comparison-tool-usage', 'review-section-deep-scroll'],
    },
    tailoringRules: [
      {
        ruleId: 'rule-tech-hero-image',
        description: 'Prioritize hero image showcasing internal hardware',
        applied: true,
      },
    ],
    variantData: {
      title: 'Prism UltraView 65" 4K QLED Smart TV — Performance Edition',
      description: 'Engineered for power users. [Synthetic variant.]',
      price: 1299.99,
      sku: 'SKU-TV-88Q900',
      category: 'TVs & Home Theater',
      features: ['65-inch 4K QLED display', '120Hz refresh rate'],
      images: ['https://placehold.co/800x600/0046be/ffffff?text=TV+Front'],
      badge: 'Latest Tech',
      promotionMessage: 'Free expedited shipping on the latest tech.',
    },
  });
}

describe('ExportManager', () => {
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalCreateElement;
  let mockAnchor;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalCreateElement = document.createElement.bind(document);

    URL.createObjectURL = vi.fn(() => 'blob:https://localhost/mock-blob-url');
    URL.revokeObjectURL = vi.fn();

    mockAnchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return mockAnchor;
      }
      return originalCreateElement(tag);
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  describe('generateFilename', () => {
    it('generates a filename containing the variant ID', () => {
      const filename = generateFilename('variant-test-001');
      expect(filename).toContain('variant-test-001');
    });

    it('generates a filename ending with .json', () => {
      const filename = generateFilename('variant-test-001');
      expect(filename).toMatch(/\.json$/);
    });

    it('generates a filename containing a timestamp', () => {
      const filename = generateFilename('variant-test-001');
      // Timestamp format: YYYY-MM-DDTHH-MM-SS-mmmZ
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('generates different filenames for different variant IDs', () => {
      const filename1 = generateFilename('variant-001');
      const filename2 = generateFilename('variant-002');
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('triggerDownload', () => {
    it('creates a blob URL and triggers a download', () => {
      const blob = new Blob(['test'], { type: 'application/json' });
      const blobUrl = triggerDownload(blob, 'test-file.json');

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockAnchor.href).toBe('blob:https://localhost/mock-blob-url');
      expect(mockAnchor.download).toBe('test-file.json');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(blobUrl).toBe('blob:https://localhost/mock-blob-url');
    });

    it('sets the anchor display to none', () => {
      const blob = new Blob(['test'], { type: 'application/json' });
      triggerDownload(blob, 'test-file.json');

      expect(mockAnchor.style.display).toBe('none');
    });
  });

  describe('revokeBlobUrl', () => {
    it('revokes a valid blob URL', () => {
      revokeBlobUrl('blob:https://localhost/mock-blob-url');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:https://localhost/mock-blob-url');
    });

    it('does not revoke a non-blob URL', () => {
      revokeBlobUrl('https://example.com/file.json');
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('does not throw for null input', () => {
      expect(() => revokeBlobUrl(null)).not.toThrow();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('does not throw for undefined input', () => {
      expect(() => revokeBlobUrl(undefined)).not.toThrow();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('does not throw for empty string input', () => {
      expect(() => revokeBlobUrl('')).not.toThrow();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('does not throw for numeric input', () => {
      expect(() => revokeBlobUrl(42)).not.toThrow();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('handles revokeObjectURL throwing an error gracefully', () => {
      URL.revokeObjectURL = vi.fn(() => {
        throw new Error('revoke error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => revokeBlobUrl('blob:https://localhost/mock-blob-url')).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('exportVariantManifest', () => {
    it('exports a valid variant manifest successfully', async () => {
      const manifest = createValidManifest();
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(true);
      expect(result.blobUrl).toBe('blob:https://localhost/mock-blob-url');
      expect(result.error).toBeUndefined();
    });

    it('creates a Blob with JSON content type', async () => {
      const manifest = createValidManifest();
      await exportVariantManifest(manifest);

      expect(URL.createObjectURL).toHaveBeenCalled();
      const blobArg = URL.createObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
    });

    it('serializes the manifest as formatted JSON', async () => {
      const manifest = createValidManifest();
      await exportVariantManifest(manifest);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);
      expect(parsed.variantId).toBe('variant-test-001');
      expect(parsed.variantData.title).toBe(manifest.variantData.title);
    });

    it('triggers a download with a filename containing the variant ID', async () => {
      const manifest = createValidManifest();
      await exportVariantManifest(manifest);

      expect(mockAnchor.download).toContain('variant-test-001');
      expect(mockAnchor.download).toMatch(/\.json$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('runs schema validation before export', async () => {
      const manifest = createValidManifest();
      const validationResult = validateVariantManifest(manifest);
      expect(validationResult.valid).toBe(true);

      const result = await exportVariantManifest(manifest);
      expect(result.success).toBe(true);
    });

    it('fails when variant is null', async () => {
      const result = await exportVariantManifest(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });

    it('fails when variant is undefined', async () => {
      const result = await exportVariantManifest(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant is an array', async () => {
      const result = await exportVariantManifest([1, 2, 3]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant is a string', async () => {
      const result = await exportVariantManifest('not-an-object');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant is a number', async () => {
      const result = await exportVariantManifest(42);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant fails schema validation (missing variantId)', async () => {
      const manifest = createValidManifest();
      delete manifest.variantId;
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Validation failed');
    });

    it('fails when variant fails schema validation (missing variantData)', async () => {
      const manifest = createValidManifest();
      delete manifest.variantData;
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant fails schema validation (missing cohort)', async () => {
      const manifest = createValidManifest();
      delete manifest.cohort;
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant fails schema validation (invalid price type)', async () => {
      const manifest = createValidManifest();
      manifest.variantData.price = 'not-a-number';
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variant fails schema validation (empty variantId)', async () => {
      const manifest = createValidManifest();
      manifest.variantId = '';
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('does not trigger download when validation fails', async () => {
      const manifest = createValidManifest();
      delete manifest.variantId;
      await exportVariantManifest(manifest);

      expect(mockAnchor.click).not.toHaveBeenCalled();
    });

    it('handles Blob creation error gracefully', async () => {
      const originalBlob = global.Blob;
      global.Blob = vi.fn(() => {
        throw new Error('Blob creation failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const manifest = createValidManifest();
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Blob creation failed');

      global.Blob = originalBlob;
      consoleSpy.mockRestore();
    });

    it('handles URL.createObjectURL error gracefully', async () => {
      URL.createObjectURL = vi.fn(() => {
        throw new Error('createObjectURL failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const manifest = createValidManifest();
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('createObjectURL failed');

      consoleSpy.mockRestore();
    });
  });

  describe('exportAllManifests', () => {
    it('exports multiple valid variant manifests successfully', async () => {
      const variants = [createValidManifest(), createSecondValidManifest()];
      const result = await exportAllManifests(variants);

      expect(result.success).toBe(true);
      expect(result.blobUrl).toBe('blob:https://localhost/mock-blob-url');
    });

    it('creates a Blob with JSON content type for bulk export', async () => {
      const variants = [createValidManifest(), createSecondValidManifest()];
      await exportAllManifests(variants);

      expect(URL.createObjectURL).toHaveBeenCalled();
      const blobArg = URL.createObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('application/json');
    });

    it('produces valid JSON array in the export payload', async () => {
      const variants = [createValidManifest(), createSecondValidManifest()];
      await exportAllManifests(variants);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('totalVariants');
      expect(parsed).toHaveProperty('variants');
      expect(Array.isArray(parsed.variants)).toBe(true);
      expect(parsed.totalVariants).toBe(2);
      expect(parsed.variants.length).toBe(2);
    });

    it('includes exportedAt timestamp in the payload', async () => {
      const variants = [createValidManifest()];
      await exportAllManifests(variants);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.exportedAt).toBeDefined();
      expect(typeof parsed.exportedAt).toBe('string');
      // Should be a valid ISO date string
      expect(new Date(parsed.exportedAt).toISOString()).toBe(parsed.exportedAt);
    });

    it('triggers a download with a filename containing "all-variants"', async () => {
      const variants = [createValidManifest()];
      await exportAllManifests(variants);

      expect(mockAnchor.download).toContain('all-variants');
      expect(mockAnchor.download).toMatch(/\.json$/);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('runs schema validation on each variant before export', async () => {
      const variants = [createValidManifest(), createSecondValidManifest()];

      variants.forEach((v) => {
        const validationResult = validateVariantManifest(v);
        expect(validationResult.valid).toBe(true);
      });

      const result = await exportAllManifests(variants);
      expect(result.success).toBe(true);
    });

    it('skips invalid variants and exports only valid ones', async () => {
      const validManifest = createValidManifest();
      const invalidManifest = { variantId: 'invalid' }; // missing required fields

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await exportAllManifests([validManifest, invalidManifest]);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(1);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);
      expect(parsed.totalVariants).toBe(1);
      expect(parsed.skippedVariants).toBe(1);
      expect(parsed.variants[0].variantId).toBe('variant-test-001');

      consoleSpy.mockRestore();
    });

    it('reports skipped count in the result', async () => {
      const validManifest = createValidManifest();
      const invalidManifest1 = { bad: 'data' };
      const invalidManifest2 = { also: 'bad' };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await exportAllManifests([validManifest, invalidManifest1, invalidManifest2]);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(2);

      consoleSpy.mockRestore();
    });

    it('fails when all variants are invalid', async () => {
      const invalidManifest1 = { variantId: 'bad-1' };
      const invalidManifest2 = { variantId: 'bad-2' };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await exportAllManifests([invalidManifest1, invalidManifest2]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.skipped).toBe(2);

      consoleSpy.mockRestore();
    });

    it('fails when variants is null', async () => {
      const result = await exportAllManifests(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variants is undefined', async () => {
      const result = await exportAllManifests(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variants is an empty array', async () => {
      const result = await exportAllManifests([]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variants is not an array', async () => {
      const result = await exportAllManifests('not-an-array');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('fails when variants is an object', async () => {
      const result = await exportAllManifests({ variant: 'data' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('skips non-object items in the variants array', async () => {
      const validManifest = createValidManifest();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await exportAllManifests([validManifest, null, 'string', 42]);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(3);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);
      expect(parsed.totalVariants).toBe(1);

      consoleSpy.mockRestore();
    });

    it('does not trigger download when no valid variants exist', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await exportAllManifests([null, undefined, 'bad']);

      expect(mockAnchor.click).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles Blob creation error gracefully in bulk export', async () => {
      const originalBlob = global.Blob;
      global.Blob = vi.fn(() => {
        throw new Error('Blob creation failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const variants = [createValidManifest()];
      const result = await exportAllManifests(variants);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Blob creation failed');

      global.Blob = originalBlob;
      consoleSpy.mockRestore();
    });

    it('exports a single variant in bulk mode successfully', async () => {
      const variants = [createValidManifest()];
      const result = await exportAllManifests(variants);

      expect(result.success).toBe(true);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);
      expect(parsed.totalVariants).toBe(1);
      expect(parsed.variants.length).toBe(1);
    });
  });

  describe('ExportManager static methods', () => {
    it('exportVariantManifest exports a valid manifest', async () => {
      const manifest = createValidManifest();
      const result = await ExportManager.exportVariantManifest(manifest);

      expect(result.success).toBe(true);
      expect(result.blobUrl).toBeDefined();
    });

    it('exportVariantManifest rejects an invalid manifest', async () => {
      const result = await ExportManager.exportVariantManifest(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('exportAllManifests exports multiple valid manifests', async () => {
      const variants = [createValidManifest(), createSecondValidManifest()];
      const result = await ExportManager.exportAllManifests(variants);

      expect(result.success).toBe(true);
      expect(result.blobUrl).toBeDefined();
    });

    it('exportAllManifests rejects an empty array', async () => {
      const result = await ExportManager.exportAllManifests([]);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('revokeBlobUrl revokes a valid blob URL', () => {
      ExportManager.revokeBlobUrl('blob:https://localhost/mock-blob-url');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:https://localhost/mock-blob-url');
    });

    it('revokeBlobUrl handles null gracefully', () => {
      expect(() => ExportManager.revokeBlobUrl(null)).not.toThrow();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('schema validation integration', () => {
    it('validates manifest before single export', async () => {
      const manifest = createValidManifest();
      const validationResult = validateVariantManifest(manifest);
      expect(validationResult.valid).toBe(true);

      const exportResult = await exportVariantManifest(manifest);
      expect(exportResult.success).toBe(true);
    });

    it('blocks export when manifest has missing required fields', async () => {
      const manifest = createValidManifest();
      delete manifest.canonicalPdpId;

      const validationResult = validateVariantManifest(manifest);
      expect(validationResult.valid).toBe(false);

      const exportResult = await exportVariantManifest(manifest);
      expect(exportResult.success).toBe(false);
      expect(exportResult.error).toBeDefined();
    });

    it('blocks export when manifest has type mismatches', async () => {
      const manifest = createValidManifest();
      manifest.variantData.features = 'not-an-array';

      const validationResult = validateVariantManifest(manifest);
      expect(validationResult.valid).toBe(false);

      const exportResult = await exportVariantManifest(manifest);
      expect(exportResult.success).toBe(false);
    });

    it('blocks export when nested cohort data is invalid', async () => {
      const manifest = createValidManifest();
      manifest.cohort = { id: '' };

      const validationResult = validateVariantManifest(manifest);
      expect(validationResult.valid).toBe(false);

      const exportResult = await exportVariantManifest(manifest);
      expect(exportResult.success).toBe(false);
    });

    it('blocks export when tailoring rules have invalid structure', async () => {
      const manifest = createValidManifest();
      manifest.tailoringRules = [{ ruleId: 'test' }]; // missing description and applied

      const validationResult = validateVariantManifest(manifest);
      expect(validationResult.valid).toBe(false);

      const exportResult = await exportVariantManifest(manifest);
      expect(exportResult.success).toBe(false);
    });
  });

  describe('JSON output format', () => {
    it('produces properly formatted JSON for single export', async () => {
      const manifest = createValidManifest();
      await exportVariantManifest(manifest);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();

      // Should be formatted with 2-space indentation
      expect(text).toContain('\n');
      expect(text).toContain('  ');

      // Should be valid JSON
      const parsed = JSON.parse(text);
      expect(parsed).toBeDefined();
    });

    it('produces properly formatted JSON for bulk export', async () => {
      const variants = [createValidManifest(), createSecondValidManifest()];
      await exportAllManifests(variants);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();

      // Should be formatted with 2-space indentation
      expect(text).toContain('\n');
      expect(text).toContain('  ');

      // Should be valid JSON
      const parsed = JSON.parse(text);
      expect(parsed).toBeDefined();
    });

    it('preserves all variant data fields in single export', async () => {
      const manifest = createValidManifest();
      await exportVariantManifest(manifest);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.variantId).toBe(manifest.variantId);
      expect(parsed.canonicalPdpId).toBe(manifest.canonicalPdpId);
      expect(parsed.cohort.id).toBe(manifest.cohort.id);
      expect(parsed.cohort.name).toBe(manifest.cohort.name);
      expect(parsed.tailoringRules.length).toBe(manifest.tailoringRules.length);
      expect(parsed.variantData.title).toBe(manifest.variantData.title);
      expect(parsed.variantData.price).toBe(manifest.variantData.price);
      expect(parsed.variantData.sku).toBe(manifest.variantData.sku);
      expect(parsed.variantData.category).toBe(manifest.variantData.category);
      expect(parsed.variantData.badge).toBe(manifest.variantData.badge);
      expect(parsed.variantData.promotionMessage).toBe(manifest.variantData.promotionMessage);
      expect(parsed.schemaVersion).toBe(manifest.schemaVersion);
    });

    it('preserves all variant data fields in bulk export', async () => {
      const manifest1 = createValidManifest();
      const manifest2 = createSecondValidManifest();
      await exportAllManifests([manifest1, manifest2]);

      const blobArg = URL.createObjectURL.mock.calls[0][0];
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.variants[0].variantId).toBe(manifest1.variantId);
      expect(parsed.variants[1].variantId).toBe(manifest2.variantId);
      expect(parsed.variants[0].variantData.title).toBe(manifest1.variantData.title);
      expect(parsed.variants[1].variantData.title).toBe(manifest2.variantData.title);
    });
  });

  describe('error handling edge cases', () => {
    it('returns error message string when export fails', async () => {
      const result = await exportVariantManifest(null);
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });

    it('returns error message string when bulk export fails', async () => {
      const result = await exportAllManifests(null);
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });

    it('handles variant with empty object variantData gracefully', async () => {
      const manifest = createValidManifest();
      manifest.variantData = {};
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('handles variant with null variantData gracefully', async () => {
      const manifest = createValidManifest();
      manifest.variantData = null;
      const result = await exportVariantManifest(manifest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('logs error to console when single export fails due to exception', async () => {
      URL.createObjectURL = vi.fn(() => {
        throw new Error('mock error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const manifest = createValidManifest();
      await exportVariantManifest(manifest);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('logs error to console when bulk export fails due to exception', async () => {
      URL.createObjectURL = vi.fn(() => {
        throw new Error('mock error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const variants = [createValidManifest()];
      await exportAllManifests(variants);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('logs error for each skipped invalid variant in bulk export', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const validManifest = createValidManifest();
      const invalidManifest = { variantId: 'invalid-001', canonicalPdpId: 'test' };

      await exportAllManifests([validManifest, invalidManifest]);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});