/**
 * @module LoadingSpinner
 * @description Accessible loading spinner component with aria-busy, aria-label,
 * and role='status'. Displays during variant generation with Tailwind animated
 * spinner using Best Buy brand colors. Supports reduced motion preferences.
 * [Pipeline-aligned: synthetic data only]
 */

import PropTypes from 'prop-types';
import { useAccessibility } from '@/context/AccessibilityProvider.jsx';

/**
 * Default loading message displayed below the spinner.
 * @type {string}
 */
const DEFAULT_LOADING_MESSAGE = 'Loading...';

/**
 * Default aria-label for the spinner.
 * @type {string}
 */
const DEFAULT_ARIA_LABEL = 'Loading content, please wait';

/**
 * Available spinner size options mapped to Tailwind classes.
 * @type {Object<string, { spinner: string, text: string }>}
 */
const SIZE_MAP = {
  sm: { spinner: 'h-6 w-6', text: 'text-xs' },
  md: { spinner: 'h-10 w-10', text: 'text-sm' },
  lg: { spinner: 'h-16 w-16', text: 'text-base' },
};

/**
 * LoadingSpinner component that renders an accessible animated spinner
 * with Best Buy brand colors. Respects reduced motion preferences by
 * switching from spin animation to a pulsing indicator.
 *
 * @param {object} props
 * @param {string} [props.message] - Loading message displayed below the spinner.
 * @param {string} [props.ariaLabel] - Accessible label for the spinner region.
 * @param {'sm'|'md'|'lg'} [props.size] - Size of the spinner ('sm', 'md', 'lg').
 * @param {boolean} [props.overlay] - Whether to render the spinner as a full-area overlay.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function LoadingSpinner({ message, ariaLabel, size, overlay, className }) {
  const { state } = useAccessibility();

  const resolvedMessage = message && typeof message === 'string' && message.trim().length > 0
    ? message.trim()
    : DEFAULT_LOADING_MESSAGE;

  const resolvedAriaLabel = ariaLabel && typeof ariaLabel === 'string' && ariaLabel.trim().length > 0
    ? ariaLabel.trim()
    : DEFAULT_ARIA_LABEL;

  const resolvedSize = size && SIZE_MAP[size] ? size : 'md';
  const sizeClasses = SIZE_MAP[resolvedSize];

  const spinnerAnimation = state.prefersReducedMotion
    ? 'animate-pulse'
    : 'animate-spin';

  const spinnerContent = (
    <div
      role="status"
      aria-busy="true"
      aria-label={resolvedAriaLabel}
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${className || ''}`}
    >
      {state.prefersReducedMotion ? (
        <div
          className={`${sizeClasses.spinner} rounded-full bg-bby-blue-500 ${spinnerAnimation}`}
          aria-hidden="true"
        />
      ) : (
        <div
          className={`${sizeClasses.spinner} rounded-full border-4 border-gray-200 border-t-bby-blue-500 ${spinnerAnimation}`}
          aria-hidden="true"
        />
      )}
      <p className={`${sizeClasses.text} font-medium text-gray-600`}>
        {resolvedMessage}
      </p>
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-md">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  ariaLabel: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  overlay: PropTypes.bool,
  className: PropTypes.string,
};

LoadingSpinner.defaultProps = {
  message: DEFAULT_LOADING_MESSAGE,
  ariaLabel: DEFAULT_ARIA_LABEL,
  size: 'md',
  overlay: false,
  className: '',
};

export { LoadingSpinner, DEFAULT_LOADING_MESSAGE, DEFAULT_ARIA_LABEL, SIZE_MAP };
export default LoadingSpinner;