/**
 * @module ErrorBanner
 * @description Accessible error banner component that displays actionable error messages.
 * Uses role='alert' and aria-live='assertive' for screen reader announcements.
 * Shows error type, message, and optional recovery action (e.g., 'Reset Data' button).
 * Dismissible with keyboard support. Uses Lucide AlertTriangle icon.
 * [Pipeline-aligned: synthetic data only]
 */

import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Default error type label when none is provided.
 * @type {string}
 */
const DEFAULT_ERROR_TYPE = 'Error';

/**
 * ErrorBanner component that displays an accessible error message with optional
 * recovery action and dismiss functionality.
 *
 * @param {object} props
 * @param {string} props.message - The error message to display.
 * @param {string} [props.errorType] - The error type label (e.g., 'Storage Error', 'Validation Error').
 * @param {function} [props.onDismiss] - Callback invoked when the banner is dismissed.
 * @param {function} [props.onAction] - Callback invoked when the recovery action button is clicked.
 * @param {string} [props.actionLabel] - Label for the recovery action button (e.g., 'Reset Data').
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element|null}
 */
function ErrorBanner({ message, errorType, onDismiss, onAction, actionLabel, className }) {
  const bannerRef = useRef(null);

  /**
   * Handles dismiss button click.
   */
  const handleDismiss = useCallback(() => {
    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  }, [onDismiss]);

  /**
   * Handles recovery action button click.
   */
  const handleAction = useCallback(() => {
    if (typeof onAction === 'function') {
      onAction();
    }
  }, [onAction]);

  /**
   * Handles keydown events on the banner for keyboard accessibility.
   * Escape key dismisses the banner.
   * @param {React.KeyboardEvent} event
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && typeof onDismiss === 'function') {
      event.preventDefault();
      onDismiss();
    }
  }, [onDismiss]);

  /**
   * Focus the banner on mount so screen readers announce it immediately.
   */
  useEffect(() => {
    if (bannerRef.current) {
      bannerRef.current.focus({ preventScroll: true });
    }
  }, [message]);

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return null;
  }

  const typeLabel = errorType && typeof errorType === 'string' && errorType.trim().length > 0
    ? errorType.trim()
    : DEFAULT_ERROR_TYPE;

  const showAction = typeof onAction === 'function' && actionLabel && typeof actionLabel === 'string' && actionLabel.trim().length > 0;

  return (
    <div
      ref={bannerRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={`flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-4 shadow-sm ${className || ''}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <AlertTriangle
          className="h-5 w-5 text-red-600"
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">
          {typeLabel}
        </p>
        <p className="mt-1 text-sm text-red-700">
          {message}
        </p>

        {showAction && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleAction}
              className="inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
              aria-label={actionLabel}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>

      {typeof onDismiss === 'function' && (
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex rounded-md p-1 text-red-500 hover:bg-red-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <X
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
}

ErrorBanner.propTypes = {
  message: PropTypes.string.isRequired,
  errorType: PropTypes.string,
  onDismiss: PropTypes.func,
  onAction: PropTypes.func,
  actionLabel: PropTypes.string,
  className: PropTypes.string,
};

ErrorBanner.defaultProps = {
  errorType: DEFAULT_ERROR_TYPE,
  onDismiss: undefined,
  onAction: undefined,
  actionLabel: undefined,
  className: '',
};

export { ErrorBanner, DEFAULT_ERROR_TYPE };
export default ErrorBanner;