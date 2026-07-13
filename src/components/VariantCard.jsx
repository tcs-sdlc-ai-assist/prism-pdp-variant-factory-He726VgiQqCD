/**
 * @module VariantCard
 * @description Card component for a single PDP variant in the gallery grid.
 * Displays variant thumbnail/hero image, tailored title, cohort badge, price,
 * CTA button text, and diff highlights. Links to detail view via React Router.
 * Keyboard accessible with focus styles. Uses prop-types.
 * [Pipeline-aligned: synthetic data only]
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Eye } from 'lucide-react';
import CohortBadge from '@/components/CohortBadge.jsx';
import { DiffHighlight, determineHighlightMode } from '@/components/DiffHighlight.jsx';
import { computeDiff, getChangedFieldCount } from '@/utils/diffUtils.js';
import { generateVariantAriaLabel } from '@/utils/accessibilityHelpers.js';

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
 * Extracts the hero image URL from a variant's image array.
 * Returns the first image or a placeholder if none available.
 * @param {string[]} images - Array of image URLs.
 * @returns {string} The hero image URL.
 */
function getHeroImage(images) {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string' && images[0].trim().length > 0) {
    return images[0];
  }
  return 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';
}

/**
 * Derives a CTA button label from the cohort ID.
 * @param {string} cohortId - The cohort identifier.
 * @returns {string} The CTA button text.
 */
function getCTAText(cohortId) {
  if (cohortId === 'cohort-budget-shopper') {
    return 'See Best Price';
  }
  if (cohortId === 'cohort-tech-enthusiast') {
    return 'Explore Full Specs';
  }
  if (cohortId === 'cohort-premium-buyer') {
    return 'Experience Premium';
  }
  if (cohortId === 'cohort-student') {
    return 'Get Student Deal';
  }
  if (cohortId === 'cohort-business-buyer') {
    return 'Request Business Quote';
  }
  return 'View Details';
}

/**
 * VariantCard component that renders a summary card for a single PDP variant
 * in the gallery grid. Displays hero image, tailored title, cohort badge,
 * price, CTA text, and diff highlight indicators. Links to the detail view.
 *
 * @param {object} props
 * @param {object} props.variant - The variant manifest object.
 * @param {object} [props.controlVariant] - The control variant for diff comparison.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element|null}
 */
function VariantCard({ variant, controlVariant, className }) {
  const navigate = useNavigate();

  if (!variant || typeof variant !== 'object' || !variant.variantId || !variant.variantData) {
    return null;
  }

  const { variantId, variantData, cohort } = variant;
  const { title, price, images, badge, promotionMessage } = variantData;

  const heroImage = getHeroImage(images);
  const formattedPrice = formatPrice(price);
  const cohortId = cohort && cohort.id ? cohort.id : '';
  const cohortName = cohort && cohort.name ? cohort.name : '';
  const ctaText = getCTAText(cohortId);

  const changedFieldCount = useMemo(() => {
    if (!controlVariant) {
      return 0;
    }
    return getChangedFieldCount(controlVariant, variant);
  }, [controlVariant, variant]);

  const diff = useMemo(() => {
    if (!controlVariant) {
      return {};
    }
    return computeDiff(controlVariant, variant);
  }, [controlVariant, variant]);

  const ariaLabel = useMemo(() => {
    return generateVariantAriaLabel(variantData, cohortName);
  }, [variantData, cohortName]);

  /**
   * Navigates to the variant detail view.
   */
  const handleNavigate = useCallback(() => {
    navigate(`/variant/${variantId}`);
  }, [navigate, variantId]);

  /**
   * Handles keydown events for keyboard accessibility.
   * Enter or Space triggers navigation.
   * @param {React.KeyboardEvent} event
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate();
    }
  }, [handleNavigate]);

  const titleChanged = diff.title ? diff.title.changed : false;
  const priceChanged = diff.price ? diff.price.changed : false;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 cursor-pointer ${className || ''}`}
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
    >
      {/* Hero Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={heroImage}
          alt={title || 'Product variant image'}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />

        {/* Badge Overlay */}
        {badge && typeof badge === 'string' && badge.trim().length > 0 && (
          <span className="absolute top-2 left-2 inline-flex items-center rounded-md bg-bby-yellow-500 px-2 py-1 text-xs font-bold text-bby-blue-900 shadow-sm">
            {badge}
          </span>
        )}

        {/* Diff Count Indicator */}
        {changedFieldCount > 0 && (
          <span
            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm"
            aria-label={`${changedFieldCount} field${changedFieldCount !== 1 ? 's' : ''} changed from control`}
          >
            {changedFieldCount} diff{changedFieldCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Cohort Badge */}
        {cohortId && cohortName && (
          <div className="mb-1">
            <CohortBadge
              cohortId={cohortId}
              cohortName={cohortName}
              size="sm"
            />
          </div>
        )}

        {/* Title */}
        <DiffHighlight
          fieldName="title"
          controlValue={diff.title ? diff.title.controlValue : null}
          variantValue={diff.title ? diff.title.variantValue : title}
          showLabel={false}
          showTooltip={titleChanged}
          className="mb-0"
        >
          <h3 className={`text-sm font-semibold leading-snug line-clamp-2 ${titleChanged ? 'text-amber-800' : 'text-gray-900'}`}>
            {title || 'Untitled Variant'}
          </h3>
        </DiffHighlight>

        {/* Price */}
        <DiffHighlight
          fieldName="price"
          controlValue={diff.price ? diff.price.controlValue : null}
          variantValue={diff.price ? diff.price.variantValue : price}
          showLabel={false}
          showTooltip={priceChanged}
          inline
          className="mb-0"
        >
          <span className={`text-lg font-bold ${priceChanged ? 'text-amber-800' : 'text-gray-900'}`}>
            {formattedPrice}
          </span>
        </DiffHighlight>

        {/* Promotion Message */}
        {promotionMessage && typeof promotionMessage === 'string' && promotionMessage.trim().length > 0 && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {promotionMessage}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Button */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-bby-blue-500 px-3 py-1.5 text-xs font-medium text-white group-hover:bg-bby-blue-600 transition-colors">
            <Eye
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {ctaText}
          </span>

          <span className="text-xs text-gray-400">
            {variantId}
          </span>
        </div>
      </div>
    </article>
  );
}

VariantCard.propTypes = {
  variant: PropTypes.shape({
    variantId: PropTypes.string.isRequired,
    canonicalPdpId: PropTypes.string,
    cohort: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      behaviorSignals: PropTypes.arrayOf(PropTypes.string),
    }),
    tailoringRules: PropTypes.arrayOf(
      PropTypes.shape({
        ruleId: PropTypes.string,
        description: PropTypes.string,
        applied: PropTypes.bool,
      }),
    ),
    variantData: PropTypes.shape({
      title: PropTypes.string,
      description: PropTypes.string,
      price: PropTypes.number,
      sku: PropTypes.string,
      category: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string),
      images: PropTypes.arrayOf(PropTypes.string),
      badge: PropTypes.string,
      promotionMessage: PropTypes.string,
    }).isRequired,
    schemaVersion: PropTypes.number,
  }).isRequired,
  controlVariant: PropTypes.object,
  className: PropTypes.string,
};

VariantCard.defaultProps = {
  controlVariant: undefined,
  className: '',
};

export { VariantCard, formatPrice, getHeroImage, getCTAText };
export default VariantCard;