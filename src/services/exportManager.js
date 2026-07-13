/**
 * @module exportManager
 * @description ExportManager utility for exporting variant manifests as JSON downloads.
 * Provides single-variant and bulk export functionality with schema validation.
 * Creates Blob objects with JSON content and triggers browser downloads via URL.createObjectURL.
 * [Pipeline-aligned: synthetic data only]
 */

import { validateVariantManifest } from '@/utils/schemaValidator.js';
import { ERROR_MESSAGES } from '@/constants/constants.js';

/**
 * Generates a timestamped filename for a variant manifest export.
 * @param {string} variantId - The variant ID to include in the filename.
 * @returns {string} The generated filename.
 */
function generateFilename(variantId) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${variantId}-${timestamp}.json`;
}

/**
 * Triggers a browser download for a given Blob.
 * Creates a temporary anchor element, clicks it, and cleans up.
 * @param {Blob} blob - The Blob to download.
 * @param {string} filename - The filename for the download.
 * @returns {string} The blob URL that was created.
 */
function triggerDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return blobUrl;
}

/**
 * Exports a single variant manifest as a JSON file download.
 * Validates the manifest against the schema before export.
 * @param {object} variant - The variant manifest object to export.
 * @returns {Promise<{ success: boolean, blobUrl?: string, error?: string }>}
 */
async function exportVariantManifest(variant) {
  try {
    if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_VARIANT_DATA} A valid variant object is required for export.`,
      };
    }

    const validationResult = validateVariantManifest(variant);

    if (!validationResult.valid) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_VARIANT_DATA} Validation failed: ${validationResult.errors.join('; ')}`,
      };
    }

    const jsonString = JSON.stringify(variant, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const filename = generateFilename(variant.variantId);
    const blobUrl = triggerDownload(blob, filename);

    return {
      success: true,
      blobUrl,
    };
  } catch (error) {
    console.error('ExportManager: Failed to export variant manifest.', error);
    return {
      success: false,
      error: `Export failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Exports all variant manifests as individual JSON files bundled into a single
 * combined JSON download. Validates each manifest before inclusion.
 * Invalid manifests are skipped with errors logged.
 * @param {object[]} variants - Array of variant manifest objects to export.
 * @returns {Promise<{ success: boolean, blobUrl?: string, error?: string, skipped?: number }>}
 */
async function exportAllManifests(variants) {
  try {
    if (!Array.isArray(variants) || variants.length === 0) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_VARIANT_DATA} A non-empty array of variants is required for bulk export.`,
      };
    }

    const validVariants = [];
    let skipped = 0;

    for (const variant of variants) {
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        skipped++;
        console.error('ExportManager: Skipping invalid variant (not an object).');
        continue;
      }

      const validationResult = validateVariantManifest(variant);

      if (validationResult.valid) {
        validVariants.push(variant);
      } else {
        skipped++;
        console.error(
          `ExportManager: Skipping variant ${variant.variantId || 'unknown'} — validation failed:`,
          validationResult.errors,
        );
      }
    }

    if (validVariants.length === 0) {
      return {
        success: false,
        error: `${ERROR_MESSAGES.INVALID_VARIANT_DATA} No valid variants to export. All ${skipped} variant(s) failed validation.`,
        skipped,
      };
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      totalVariants: validVariants.length,
      skippedVariants: skipped,
      variants: validVariants,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `all-variants-${timestamp}.json`;
    const blobUrl = triggerDownload(blob, filename);

    return {
      success: true,
      blobUrl,
      skipped,
    };
  } catch (error) {
    console.error('ExportManager: Failed to export all manifests.', error);
    return {
      success: false,
      error: `Bulk export failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Revokes a previously created blob URL to free memory.
 * @param {string} blobUrl - The blob URL to revoke.
 */
function revokeBlobUrl(blobUrl) {
  try {
    if (blobUrl && typeof blobUrl === 'string' && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (error) {
    console.error('ExportManager: Failed to revoke blob URL.', error);
  }
}

/**
 * ExportManager class providing a static API for variant manifest export.
 */
class ExportManager {
  /**
   * Exports a single variant manifest as a JSON file download.
   * @param {object} variant - The variant manifest object to export.
   * @returns {Promise<{ success: boolean, blobUrl?: string, error?: string }>}
   */
  static async exportVariantManifest(variant) {
    return exportVariantManifest(variant);
  }

  /**
   * Exports all variant manifests as a combined JSON file download.
   * @param {object[]} variants - Array of variant manifest objects to export.
   * @returns {Promise<{ success: boolean, blobUrl?: string, error?: string, skipped?: number }>}
   */
  static async exportAllManifests(variants) {
    return exportAllManifests(variants);
  }

  /**
   * Revokes a previously created blob URL to free memory.
   * @param {string} blobUrl - The blob URL to revoke.
   */
  static revokeBlobUrl(blobUrl) {
    revokeBlobUrl(blobUrl);
  }
}

export {
  ExportManager,
  exportVariantManifest,
  exportAllManifests,
  revokeBlobUrl,
  generateFilename,
  triggerDownload,
};

export default ExportManager;