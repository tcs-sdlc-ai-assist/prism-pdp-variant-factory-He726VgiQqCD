/**
 * @module VariantGallery
 * @description Gallery page component displaying all 10 variants in a responsive grid.
 * Includes bulk export button, cohort filter dropdown, and control PDP reference panel.
 * Uses AppContext for variant data. Semantic <main> with aria-label.
 * Handles empty/error states.
 * [Pipeline-aligned: synthetic data only]
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Filter, X, Package, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/context/AccessibilityProvider.jsx';
import VariantCard from '@/components/VariantCard.jsx';
import ExportButton from '@/components/ExportButton.jsx';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import LoadingSpinner from '@/components/LoadingSpinner.jsx';
import { manageFocusOnRouteChange } from '@/utils/accessibilityHelpers.js';

/**
 * Page title for accessibility announcements.
 * @type {string}
 */
const PAGE_TITLE = 'Variant Gallery';

/**
 * Label for the "All Cohorts" filter option.
 * @type {string}
 */
const ALL_COHORTS_LABEL = 'All Cohorts';

/**
 * Extracts unique cohorts from an array of variant manifests.
 * @param {object[]} variants - Array of variant manifest objects.
 * @returns {Array<{id: string, name: string}>} Array of unique cohort objects.
 */
function extractUniqueCohorts(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return [];
  }

  const seen = new Set();
  const cohorts = [];

  for (const variant of variants) {
    if (variant && variant.cohort && variant.cohort.id && variant.cohort.name) {
      if (!seen.has(variant.cohort.id)) {
        seen.add(variant.cohort.id);
        cohorts.push({
          id: variant.cohort.id,
          name: variant.cohort.name,
        });
      }
    }
  }

  return cohorts;
}

/**
 * Finds the first variant that can serve as a control reference.
 * Uses the first variant in the list as the control baseline.
 * @param {object[]} variants - Array of variant manifest objects.
 * @returns {object|null} The control variant or null.
 */
function findControlVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  return variants[0] || null;
}

/**
 * Formats a price number as a USD currency string.
 * @param {number} price - The price value.
 * @returns {string} The formatted price string.
 */
function formatPrice(price) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '$0.00';
  }
  return `$${price.toFixed(2)}`;
}

/**
 * VariantGallery page component that displays all generated PDP variants
 * in a responsive grid layout. Provides cohort filtering, bulk export,
 * and a control PDP reference panel.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function VariantGallery({ className }) {
  const { state, clearError, regenerateVariants } = useAppContext();
  const { announce } = useAccessibility();
  const { variants, loading, error, canonicalProducts } = state;

  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

  /**
   * Manage focus on initial mount for route change accessibility.
   */
  useEffect(() => {
    manageFocusOnRouteChange(PAGE_TITLE);
  }, []);

  /**
   * Extract unique cohorts from variants for the filter dropdown.
   */
  const uniqueCohorts = useMemo(() => {
    return extractUniqueCohorts(variants);
  }, [variants]);

  /**
   * The control variant used as the baseline for diff comparison.
   */
  const controlVariant = useMemo(() => {
    return findControlVariant(variants);
  }, [variants]);

  /**
   * Filtered variants based on the selected cohort filter.
   */
  const filteredVariants = useMemo(() => {
    if (!Array.isArray(variants) || variants.length === 0) {
      return [];
    }

    if (!selectedCohortId || selectedCohortId === '') {
      return variants;
    }

    return variants.filter((v) => v && v.cohort && v.cohort.id === selectedCohortId);
  }, [variants, selectedCohortId]);

  /**
   * The first canonical product for the control reference panel.
   */
  const canonicalProduct = useMemo(() => {
    if (Array.isArray(canonicalProducts) && canonicalProducts.length > 0) {
      return canonicalProducts[0];
    }
    return null;
  }, [canonicalProducts]);

  /**
   * Handles cohort filter change.
   * @param {React.ChangeEvent<HTMLSelectElement>} event
   */
  const handleCohortFilterChange = useCallback((event) => {
    const value = event.target.value;
    setSelectedCohortId(value);

    if (value === '') {
      announce('Showing all cohorts');
    } else {
      const cohort = uniqueCohorts.find((c) => c.id === value);
      const cohortName = cohort ? cohort.name : value;
      announce(`Filtered to ${cohortName} cohort`);
    }
  }, [announce, uniqueCohorts]);

  /**
   * Clears the cohort filter.
   */
  const handleClearFilter = useCallback(() => {
    setSelectedCohortId('');
    announce('Filter cleared, showing all cohorts');
  }, [announce]);

  /**
   * Toggles the control PDP reference panel.
   */
  const handleToggleControlPanel = useCallback(() => {
    setControlPanelOpen((prev) => {
      const next = !prev;
      announce(next ? 'Control PDP reference panel opened' : 'Control PDP reference panel closed');
      return next;
    });
  }, [announce]);

  /**
   * Handles regeneration of variants.
   */
  const handleRegenerate = useCallback(async () => {
    announce('Regenerating variants...');
    await regenerateVariants();
    announce('Variants regenerated successfully');
  }, [announce, regenerateVariants]);

  /**
   * Handles dismissing the error banner.
   */
  const handleDismissError = useCallback(() => {
    clearError();
  }, [clearError]);

  /**
   * Handles the reset data action from the error banner.
   */
  const handleResetData = useCallback(async () => {
    clearError();
    await regenerateVariants();
    announce('Data has been reset and variants regenerated');
  }, [clearError, regenerateVariants, announce]);

  const hasVariants = Array.isArray(filteredVariants) && filteredVariants.length > 0;
  const hasAnyVariants = Array.isArray(variants) && variants.length > 0;
  const isFiltered = selectedCohortId !== '';

  return (
    <main
      id="main-content"
      className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className || ''}`}
      aria-label="Variant Gallery"
      role="main"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {PAGE_TITLE}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and compare all generated PDP variants across cohorts. All data is synthetic. [Pipeline-aligned]
        </p>
      </div>

      {/* Error Banner */}
      {error && typeof error === 'string' && error.trim().length > 0 && (
        <div className="mb-6">
          <ErrorBanner
            message={error}
            errorType="Generation Error"
            onDismiss={handleDismissError}
            onAction={handleResetData}
            actionLabel="Reset Data"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner
            message="Generating variants..."
            ariaLabel="Generating PDP variants, please wait"
            size="lg"
          />
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Filter and Control Panel Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Cohort Filter */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cohort-filter"
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                >
                  <Filter
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Cohort
                </label>
                <select
                  id="cohort-filter"
                  value={selectedCohortId}
                  onChange={handleCohortFilterChange}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500"
                  aria-label="Filter variants by cohort"
                >
                  <option value="">{ALL_COHORTS_LABEL}</option>
                  {uniqueCohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>

                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
                    aria-label="Clear cohort filter"
                  >
                    <X
                      className="h-3 w-3"
                      aria-hidden="true"
                    />
                    Clear
                  </button>
                )}
              </div>

              {/* Control Panel Toggle */}
              <button
                type="button"
                onClick={handleToggleControlPanel}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
                aria-expanded={controlPanelOpen}
                aria-controls="control-pdp-panel"
                aria-label={controlPanelOpen ? 'Hide control PDP reference' : 'Show control PDP reference'}
              >
                <Package
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                {controlPanelOpen ? 'Hide Control PDP' : 'Show Control PDP'}
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Regenerate Button */}
              <button
                type="button"
                onClick={handleRegenerate}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
                aria-label="Regenerate all variants"
              >
                <RefreshCw
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Regenerate
              </button>

              {/* Bulk Export Button */}
              {hasAnyVariants && (
                <ExportButton
                  variants={variants}
                  size="md"
                  buttonVariant="primary"
                  label="Export All"
                  ariaLabel={`Export all ${variants.length} variant manifests as JSON`}
                />
              )}
            </div>
          </div>

          {/* Variant Count */}
          {hasAnyVariants && (
            <div className="mb-4">
              <p
                className="text-sm text-gray-500"
                role="status"
                aria-live="polite"
              >
                Showing {filteredVariants.length} of {variants.length} variant{variants.length !== 1 ? 's' : ''}
                {isFiltered && (
                  <span className="ml-1 font-medium text-gray-700">
                    (filtered by {uniqueCohorts.find((c) => c.id === selectedCohortId)?.name || selectedCohortId})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Control PDP Reference Panel */}
          {controlPanelOpen && canonicalProduct && (
            <div
              id="control-pdp-panel"
              className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
              role="region"
              aria-label="Control PDP reference"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-blue-900 mb-2">
                    Control PDP Reference
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Title</p>
                      <p className="text-sm text-blue-900 mt-0.5 line-clamp-2">{canonicalProduct.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Price</p>
                      <p className="text-sm font-bold text-blue-900 mt-0.5">{formatPrice(canonicalProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">SKU</p>
                      <p className="text-sm text-blue-900 mt-0.5">{canonicalProduct.sku}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Category</p>
                      <p className="text-sm text-blue-900 mt-0.5">{canonicalProduct.category}</p>
                    </div>
                  </div>
                  {canonicalProduct.description && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Description</p>
                      <p className="text-sm text-blue-900 mt-0.5 line-clamp-3">{canonicalProduct.description}</p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleToggleControlPanel}
                  className="flex-shrink-0 inline-flex rounded-md p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
                  aria-label="Close control PDP reference panel"
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasVariants && !error && (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center"
              role="status"
              aria-label="No variants available"
            >
              <Package
                className="h-12 w-12 text-gray-400 mb-4"
                aria-hidden="true"
              />
              {isFiltered ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    No variants match this filter
                  </h2>
                  <p className="text-sm text-gray-500 mb-4 max-w-md">
                    No variants found for the selected cohort. Try clearing the filter or selecting a different cohort.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="inline-flex items-center gap-1.5 rounded-md bg-bby-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-bby-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
                  >
                    Clear Filter
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    No variants generated yet
                  </h2>
                  <p className="text-sm text-gray-500 mb-4 max-w-md">
                    Click the button below to generate PDP variants from canonical product data and cohort configurations.
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1.5 rounded-md bg-bby-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-bby-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
                  >
                    <RefreshCw
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Generate Variants
                  </button>
                </>
              )}
            </div>
          )}

          {/* Variant Grid */}
          {hasVariants && (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              role="list"
              aria-label="PDP variant cards"
            >
              {filteredVariants.map((variant) => (
                <div
                  key={variant.variantId}
                  role="listitem"
                >
                  <VariantCard
                    variant={variant}
                    controlVariant={controlVariant}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

VariantGallery.propTypes = {
  className: PropTypes.string,
};

VariantGallery.defaultProps = {
  className: '',
};

export { VariantGallery, extractUniqueCohorts, findControlVariant, PAGE_TITLE, ALL_COHORTS_LABEL };
export default VariantGallery;