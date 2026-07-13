/**
 * @module VariantDetail
 * @description Detail page component for a single variant. Shows full PDP preview
 * with tailored fields, cohort profile section (name, description, behavioral signals),
 * applied tailoring rules list, diff-from-control comparison, and per-variant export button.
 * Uses React Router useParams for variant ID. Accessible headings, landmarks, and keyboard navigation.
 * [Pipeline-aligned: synthetic data only]
 */

import { useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ArrowLeft, CheckCircle, XCircle, Tag, Users, Layers, FileText, Image } from 'lucide-react';
import { useAppContext } from '@/context/AppContext.jsx';
import { useAccessibility } from '@/context/AccessibilityProvider.jsx';
import CohortBadge from '@/components/CohortBadge.jsx';
import { DiffHighlight } from '@/components/DiffHighlight.jsx';
import ExportButton from '@/components/ExportButton.jsx';
import ErrorBanner from '@/components/ErrorBanner.jsx';
import LoadingSpinner from '@/components/LoadingSpinner.jsx';
import { computeDiff, getChangedFieldCount } from '@/utils/diffUtils.js';
import { manageFocusOnRouteChange } from '@/utils/accessibilityHelpers.js';

/**
 * Page title prefix for accessibility announcements.
 * @type {string}
 */
const PAGE_TITLE_PREFIX = 'Variant Detail';

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
 * Finds a variant by its variantId from the variants array.
 * @param {object[]} variants - Array of variant manifest objects.
 * @param {string} variantId - The variant ID to find.
 * @returns {object|null} The found variant or null.
 */
function findVariantById(variants, variantId) {
  if (!Array.isArray(variants) || !variantId) {
    return null;
  }
  return variants.find((v) => v && v.variantId === variantId) || null;
}

/**
 * Finds the first variant to use as a control reference.
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
 * VariantDetail page component that displays a full detail view for a single
 * PDP variant. Shows tailored fields, cohort profile, tailoring rules,
 * diff-from-control comparison, and per-variant export button.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function VariantDetail({ className }) {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { announce } = useAccessibility();
  const { variants, loading, error } = state;

  const variant = useMemo(() => {
    return findVariantById(variants, variantId);
  }, [variants, variantId]);

  const controlVariant = useMemo(() => {
    return findControlVariant(variants);
  }, [variants]);

  const diff = useMemo(() => {
    if (!controlVariant || !variant) {
      return {};
    }
    return computeDiff(controlVariant, variant);
  }, [controlVariant, variant]);

  const changedFieldCount = useMemo(() => {
    if (!controlVariant || !variant) {
      return 0;
    }
    return getChangedFieldCount(controlVariant, variant);
  }, [controlVariant, variant]);

  const pageTitle = useMemo(() => {
    if (variant && variant.variantData && variant.variantData.title) {
      return `${PAGE_TITLE_PREFIX}: ${variant.variantData.title}`;
    }
    return PAGE_TITLE_PREFIX;
  }, [variant]);

  /**
   * Manage focus on initial mount for route change accessibility.
   */
  useEffect(() => {
    manageFocusOnRouteChange(pageTitle);
  }, [pageTitle]);

  /**
   * Navigates back to the gallery.
   */
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Handles keydown events for the back button.
   * @param {React.KeyboardEvent} event
   */
  const handleBackKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBack();
    }
  }, [handleBack]);

  /**
   * Handles export completion.
   * @param {object} result
   */
  const handleExportComplete = useCallback((result) => {
    if (result && result.success) {
      announce('Variant manifest exported successfully');
    } else {
      announce('Variant manifest export failed');
    }
  }, [announce]);

  if (loading) {
    return (
      <main
        id="main-content"
        className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className || ''}`}
        aria-label="Variant Detail"
        role="main"
      >
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner
            message="Loading variant details..."
            ariaLabel="Loading variant details, please wait"
            size="lg"
          />
        </div>
      </main>
    );
  }

  if (error && typeof error === 'string' && error.trim().length > 0) {
    return (
      <main
        id="main-content"
        className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className || ''}`}
        aria-label="Variant Detail"
        role="main"
      >
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
            aria-label="Back to gallery"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Gallery
          </button>
        </div>
        <ErrorBanner
          message={error}
          errorType="Loading Error"
        />
      </main>
    );
  }

  if (!variant) {
    return (
      <main
        id="main-content"
        className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className || ''}`}
        aria-label="Variant Detail"
        role="main"
      >
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
            aria-label="Back to gallery"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Gallery
          </button>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center"
          role="status"
          aria-label="Variant not found"
        >
          <FileText className="h-12 w-12 text-gray-400 mb-4" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-gray-700 mb-2">
            Variant Not Found
          </h1>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            The variant with ID &quot;{variantId}&quot; could not be found. It may have been removed or the URL is incorrect.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-md bg-bby-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-bby-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to Gallery
          </button>
        </div>
      </main>
    );
  }

  const { variantData, cohort, tailoringRules, canonicalPdpId, schemaVersion } = variant;
  const { title, description, price, sku, category, features, images, badge, promotionMessage } = variantData;

  const cohortId = cohort && cohort.id ? cohort.id : '';
  const cohortName = cohort && cohort.name ? cohort.name : '';
  const behaviorSignals = cohort && Array.isArray(cohort.behaviorSignals) ? cohort.behaviorSignals : [];
  const rules = Array.isArray(tailoringRules) ? tailoringRules : [];

  const heroImage = Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].trim().length > 0
    ? images[0]
    : 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';

  return (
    <main
      id="main-content"
      className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className || ''}`}
      aria-label={pageTitle}
      role="main"
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleBack}
          onKeyDown={handleBackKeyDown}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
          aria-label="Back to gallery"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Gallery
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {title || 'Untitled Variant'}
            </h1>
            {cohortId && cohortName && (
              <CohortBadge
                cohortId={cohortId}
                cohortName={cohortName}
                size="md"
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>ID: {variant.variantId}</span>
            <span>Canonical: {canonicalPdpId}</span>
            {schemaVersion !== undefined && (
              <span>Schema v{schemaVersion}</span>
            )}
            {changedFieldCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300">
                {changedFieldCount} diff{changedFieldCount !== 1 ? 's' : ''} from control
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <ExportButton
            variant={variant}
            size="md"
            buttonVariant="primary"
            label="Export Manifest"
            ariaLabel={`Export manifest for variant ${variant.variantId}`}
            onExportComplete={handleExportComplete}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: PDP Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Image Section */}
          <section
            className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
            aria-labelledby="section-product-preview"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 id="section-product-preview" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Image className="h-4 w-4" aria-hidden="true" />
                Product Preview
              </h2>
            </div>
            <div className="p-4">
              {/* Hero Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-gray-100 mb-4">
                <img
                  src={heroImage}
                  alt={title || 'Product variant image'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {badge && typeof badge === 'string' && badge.trim().length > 0 && (
                  <span className="absolute top-3 left-3 inline-flex items-center rounded-md bg-bby-yellow-500 px-2.5 py-1 text-xs font-bold text-bby-blue-900 shadow-sm">
                    {badge}
                  </span>
                )}
              </div>

              {/* Image Gallery Thumbnails */}
              {Array.isArray(images) && images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border border-gray-200 bg-gray-100"
                    >
                      <img
                        src={img}
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Tailored Fields Section */}
          <section
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
            aria-labelledby="section-tailored-fields"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 id="section-tailored-fields" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Tag className="h-4 w-4" aria-hidden="true" />
                Tailored Fields
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Title */}
              <DiffHighlight
                fieldName="Title"
                controlValue={diff.title ? diff.title.controlValue : null}
                variantValue={diff.title ? diff.title.variantValue : title}
                showLabel={true}
                showTooltip={diff.title ? diff.title.changed : false}
              >
                <p className={`text-base font-semibold ${diff.title && diff.title.changed ? 'text-amber-800' : 'text-gray-900'}`}>
                  {title || 'Untitled Variant'}
                </p>
              </DiffHighlight>

              {/* Price */}
              <DiffHighlight
                fieldName="Price"
                controlValue={diff.price ? diff.price.controlValue : null}
                variantValue={diff.price ? diff.price.variantValue : price}
                showLabel={true}
                showTooltip={diff.price ? diff.price.changed : false}
              >
                <p className={`text-xl font-bold ${diff.price && diff.price.changed ? 'text-amber-800' : 'text-gray-900'}`}>
                  {formatPrice(price)}
                </p>
              </DiffHighlight>

              {/* Promotion Message */}
              {promotionMessage && typeof promotionMessage === 'string' && promotionMessage.trim().length > 0 && (
                <DiffHighlight
                  fieldName="Promotion"
                  controlValue={diff.promotionMessage ? diff.promotionMessage.controlValue : null}
                  variantValue={diff.promotionMessage ? diff.promotionMessage.variantValue : promotionMessage}
                  showLabel={true}
                  showTooltip={diff.promotionMessage ? diff.promotionMessage.changed : false}
                >
                  <p className={`text-sm ${diff.promotionMessage && diff.promotionMessage.changed ? 'text-amber-800' : 'text-gray-700'}`}>
                    {promotionMessage}
                  </p>
                </DiffHighlight>
              )}

              {/* Description */}
              <DiffHighlight
                fieldName="Description"
                controlValue={diff.description ? diff.description.controlValue : null}
                variantValue={diff.description ? diff.description.variantValue : description}
                showLabel={true}
                showTooltip={diff.description ? diff.description.changed : false}
              >
                <p className={`text-sm leading-relaxed ${diff.description && diff.description.changed ? 'text-amber-800' : 'text-gray-700'}`}>
                  {description || 'No description available.'}
                </p>
              </DiffHighlight>

              {/* SKU & Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DiffHighlight
                  fieldName="SKU"
                  controlValue={diff.sku ? diff.sku.controlValue : null}
                  variantValue={diff.sku ? diff.sku.variantValue : sku}
                  showLabel={true}
                  showTooltip={diff.sku ? diff.sku.changed : false}
                >
                  <p className={`text-sm ${diff.sku && diff.sku.changed ? 'text-amber-800' : 'text-gray-700'}`}>
                    {sku || 'N/A'}
                  </p>
                </DiffHighlight>

                <DiffHighlight
                  fieldName="Category"
                  controlValue={diff.category ? diff.category.controlValue : null}
                  variantValue={diff.category ? diff.category.variantValue : category}
                  showLabel={true}
                  showTooltip={diff.category ? diff.category.changed : false}
                >
                  <p className={`text-sm ${diff.category && diff.category.changed ? 'text-amber-800' : 'text-gray-700'}`}>
                    {category || 'N/A'}
                  </p>
                </DiffHighlight>
              </div>

              {/* Badge */}
              {badge && typeof badge === 'string' && badge.trim().length > 0 && (
                <DiffHighlight
                  fieldName="Badge"
                  controlValue={diff.badge ? diff.badge.controlValue : null}
                  variantValue={diff.badge ? diff.badge.variantValue : badge}
                  showLabel={true}
                  showTooltip={diff.badge ? diff.badge.changed : false}
                >
                  <span className={`inline-flex items-center rounded-md bg-bby-yellow-500 px-2.5 py-1 text-xs font-bold text-bby-blue-900 ${diff.badge && diff.badge.changed ? 'ring-2 ring-amber-400' : ''}`}>
                    {badge}
                  </span>
                </DiffHighlight>
              )}

              {/* Features */}
              <DiffHighlight
                fieldName="Features"
                controlValue={diff.features ? diff.features.controlValue : null}
                variantValue={diff.features ? diff.features.variantValue : features}
                showLabel={true}
                showTooltip={diff.features ? diff.features.changed : false}
              >
                {Array.isArray(features) && features.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {features.map((feature, index) => (
                      <li
                        key={index}
                        className={`text-sm ${diff.features && diff.features.changed ? 'text-amber-800' : 'text-gray-700'}`}
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No features listed.</p>
                )}
              </DiffHighlight>
            </div>
          </section>
        </div>

        {/* Right Column: Cohort & Rules */}
        <div className="space-y-6">
          {/* Cohort Profile Section */}
          <section
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
            aria-labelledby="section-cohort-profile"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 id="section-cohort-profile" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Users className="h-4 w-4" aria-hidden="true" />
                Cohort Profile
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {cohortId && cohortName ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cohort</p>
                    <CohortBadge
                      cohortId={cohortId}
                      cohortName={cohortName}
                      size="lg"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cohort ID</p>
                    <p className="text-sm text-gray-700">{cohortId}</p>
                  </div>

                  {/* Behavior Signals */}
                  {behaviorSignals.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Behavior Signals</p>
                      <ul className="space-y-1.5" aria-label="Behavior signals for this cohort">
                        {behaviorSignals.map((signal, index) => (
                          <li
                            key={index}
                            className="inline-flex items-center mr-2 mb-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300"
                          >
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No cohort information available.</p>
              )}
            </div>
          </section>

          {/* Tailoring Rules Section */}
          <section
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
            aria-labelledby="section-tailoring-rules"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 id="section-tailoring-rules" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Layers className="h-4 w-4" aria-hidden="true" />
                Tailoring Rules
              </h2>
            </div>
            <div className="p-4">
              {rules.length > 0 ? (
                <ul className="space-y-3" aria-label="Applied tailoring rules">
                  {rules.map((rule, index) => (
                    <li
                      key={rule.ruleId || index}
                      className="flex items-start gap-2.5 rounded-md border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {rule.applied ? (
                          <CheckCircle
                            className="h-4 w-4 text-green-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle
                            className="h-4 w-4 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">
                          {rule.ruleId}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {rule.description}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rule.applied ? 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-300' : 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300'}`}
                          aria-label={rule.applied ? 'Rule applied' : 'Rule not applied'}
                        >
                          {rule.applied ? 'Applied' : 'Not Applied'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No tailoring rules available.</p>
              )}
            </div>
          </section>

          {/* Diff Summary Section */}
          <section
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
            aria-labelledby="section-diff-summary"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 id="section-diff-summary" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Diff Summary
              </h2>
            </div>
            <div className="p-4">
              {changedFieldCount > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-amber-800">{changedFieldCount}</span> field{changedFieldCount !== 1 ? 's' : ''} differ{changedFieldCount === 1 ? 's' : ''} from the control variant.
                  </p>
                  <ul className="space-y-1.5" aria-label="Changed fields list">
                    {Object.keys(diff).filter((key) => diff[key].changed).map((key) => (
                      <li
                        key={key}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" aria-hidden="true" />
                        <span className="font-medium text-gray-800 capitalize">{key}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {controlVariant && variant && controlVariant.variantId === variant.variantId
                    ? 'This is the control variant.'
                    : 'No differences from the control variant.'}
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Synthetic Data Disclaimer */}
      <div className="mt-8 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
        <p className="text-xs font-medium text-yellow-800">
          All data displayed is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]
        </p>
      </div>
    </main>
  );
}

VariantDetail.propTypes = {
  className: PropTypes.string,
};

VariantDetail.defaultProps = {
  className: '',
};

export { VariantDetail, findVariantById, findControlVariant, PAGE_TITLE_PREFIX };
export default VariantDetail;