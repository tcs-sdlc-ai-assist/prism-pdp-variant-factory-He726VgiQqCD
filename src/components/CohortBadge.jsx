/**
 * @module CohortBadge
 * @description Small badge component displaying cohort name with color-coded background.
 * Each cohort gets a distinct accessible color. Uses prop-types for validation.
 * Renders as <span> with appropriate ARIA label.
 * [Pipeline-aligned: synthetic data only]
 */

import PropTypes from 'prop-types';

/**
 * Color mapping for each cohort ID to Tailwind CSS classes.
 * Each cohort gets a distinct, accessible color combination that meets
 * WCAG 2.1 AA contrast requirements for text readability.
 * @type {Object<string, { bg: string, text: string, ring: string }>}
 */
const COHORT_COLOR_MAP = {
  'cohort-budget-shopper': {
    bg: 'bg-green-100',
    text: 'text-green-800',
    ring: 'ring-green-300',
  },
  'cohort-tech-enthusiast': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    ring: 'ring-blue-300',
  },
  'cohort-premium-buyer': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    ring: 'ring-purple-300',
  },
  'cohort-student': {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    ring: 'ring-amber-300',
  },
  'cohort-business-buyer': {
    bg: 'bg-rose-100',
    text: 'text-rose-800',
    ring: 'ring-rose-300',
  },
};

/**
 * Default color classes used when a cohort ID is not recognized.
 * @type {{ bg: string, text: string, ring: string }}
 */
const DEFAULT_COLORS = {
  bg: 'bg-gray-100',
  text: 'text-gray-800',
  ring: 'ring-gray-300',
};

/**
 * Available badge size options mapped to Tailwind classes.
 * @type {Object<string, string>}
 */
const SIZE_MAP = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

/**
 * Resolves the color classes for a given cohort ID.
 * @param {string} cohortId - The cohort identifier.
 * @returns {{ bg: string, text: string, ring: string }} The resolved color classes.
 */
function resolveColors(cohortId) {
  if (cohortId && typeof cohortId === 'string' && COHORT_COLOR_MAP[cohortId]) {
    return COHORT_COLOR_MAP[cohortId];
  }
  return DEFAULT_COLORS;
}

/**
 * CohortBadge component that renders a small color-coded badge displaying
 * the cohort name. Each cohort gets a distinct accessible color combination.
 *
 * @param {object} props
 * @param {string} props.cohortId - The cohort identifier used for color mapping.
 * @param {string} props.cohortName - The human-readable cohort name to display.
 * @param {'sm'|'md'|'lg'} [props.size] - Size of the badge ('sm', 'md', 'lg').
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element|null}
 */
function CohortBadge({ cohortId, cohortName, size, className }) {
  if (!cohortName || typeof cohortName !== 'string' || cohortName.trim().length === 0) {
    return null;
  }

  const resolvedName = cohortName.trim();
  const resolvedSize = size && SIZE_MAP[size] ? size : 'md';
  const sizeClasses = SIZE_MAP[resolvedSize];
  const colors = resolveColors(cohortId);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${colors.bg} ${colors.text} ${colors.ring} ${sizeClasses} ${className || ''}`}
      aria-label={`Cohort: ${resolvedName}`}
      role="status"
    >
      {resolvedName}
    </span>
  );
}

CohortBadge.propTypes = {
  cohortId: PropTypes.string.isRequired,
  cohortName: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

CohortBadge.defaultProps = {
  size: 'md',
  className: '',
};

export { CohortBadge, COHORT_COLOR_MAP, DEFAULT_COLORS, SIZE_MAP, resolveColors };
export default CohortBadge;