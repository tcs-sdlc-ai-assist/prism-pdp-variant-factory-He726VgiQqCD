/**
 * @module ExportButton
 * @description Button component triggering manifest export. Accepts variant (single)
 * or variants (bulk) prop. Calls ExportManager methods. Shows loading state during
 * export and success/error feedback. Accessible with aria-label and keyboard support.
 * Uses Lucide Download icon.
 * [Pipeline-aligned: synthetic data only]
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Download, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { ExportManager } from '@/services/exportManager.js';
import { useAccessibility } from '@/context/AccessibilityProvider.jsx';

/**
 * Duration in milliseconds to show success/error feedback before resetting.
 * @type {number}
 */
const FEEDBACK_DURATION = 3000;

/**
 * Export states for the button.
 * @enum {string}
 */
const EXPORT_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Available button size options mapped to Tailwind classes.
 * @type {Object<string, string>}
 */
const SIZE_MAP = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

/**
 * Available button variant options mapped to Tailwind classes.
 * @type {Object<string, { base: string, hover: string, focus: string }>}
 */
const VARIANT_STYLES = {
  primary: {
    base: 'bg-bby-blue-500 text-white',
    hover: 'hover:bg-bby-blue-600',
    focus: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500',
  },
  secondary: {
    base: 'bg-white text-gray-700 border border-gray-300',
    hover: 'hover:bg-gray-50',
    focus: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500',
  },
};

/**
 * State-specific style overrides.
 * @type {Object<string, string>}
 */
const STATE_STYLES = {
  [EXPORT_STATE.IDLE]: '',
  [EXPORT_STATE.LOADING]: 'opacity-75 cursor-wait',
  [EXPORT_STATE.SUCCESS]: 'bg-green-600 text-white hover:bg-green-600 border-green-600',
  [EXPORT_STATE.ERROR]: 'bg-red-600 text-white hover:bg-red-600 border-red-600',
};

/**
 * ExportButton component that triggers manifest export for a single variant
 * or bulk variants. Shows loading state during export and success/error feedback.
 *
 * @param {object} props
 * @param {object} [props.variant] - A single variant manifest object to export.
 * @param {object[]} [props.variants] - An array of variant manifest objects for bulk export.
 * @param {'sm'|'md'|'lg'} [props.size] - Size of the button.
 * @param {'primary'|'secondary'} [props.buttonVariant] - Visual variant of the button.
 * @param {string} [props.label] - Custom label text for the button.
 * @param {string} [props.ariaLabel] - Custom aria-label for the button.
 * @param {function} [props.onExportComplete] - Callback invoked after export completes with result.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function ExportButton({
  variant,
  variants,
  size,
  buttonVariant,
  label,
  ariaLabel,
  onExportComplete,
  className,
}) {
  const [exportState, setExportState] = useState(EXPORT_STATE.IDLE);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const feedbackTimerRef = useRef(null);
  const blobUrlRef = useRef(null);
  const { announce } = useAccessibility();

  const isBulk = Array.isArray(variants) && variants.length > 0;
  const hasSingle = variant && typeof variant === 'object' && !Array.isArray(variant);
  const isDisabled = exportState === EXPORT_STATE.LOADING || (!isBulk && !hasSingle);

  const resolvedSize = size && SIZE_MAP[size] ? size : 'md';
  const sizeClasses = SIZE_MAP[resolvedSize];

  const resolvedButtonVariant = buttonVariant && VARIANT_STYLES[buttonVariant] ? buttonVariant : 'primary';
  const variantStyles = VARIANT_STYLES[resolvedButtonVariant];

  const resolvedLabel = label && typeof label === 'string' && label.trim().length > 0
    ? label.trim()
    : isBulk
      ? 'Export All'
      : 'Export Manifest';

  const resolvedAriaLabel = ariaLabel && typeof ariaLabel === 'string' && ariaLabel.trim().length > 0
    ? ariaLabel.trim()
    : isBulk
      ? `Export all ${variants ? variants.length : 0} variant manifests as JSON`
      : 'Export variant manifest as JSON';

  /**
   * Cleans up the feedback timer and revokes any blob URLs.
   */
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      if (blobUrlRef.current) {
        ExportManager.revokeBlobUrl(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  /**
   * Resets the export state to idle after the feedback duration.
   */
  const scheduleFeedbackReset = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setExportState(EXPORT_STATE.IDLE);
      setFeedbackMessage('');
      feedbackTimerRef.current = null;
    }, FEEDBACK_DURATION);
  }, []);

  /**
   * Handles the export action for single or bulk export.
   */
  const handleExport = useCallback(async () => {
    if (isDisabled) {
      return;
    }

    setExportState(EXPORT_STATE.LOADING);
    setFeedbackMessage('');
    announce('Exporting variant manifest...');

    // Revoke previous blob URL if any
    if (blobUrlRef.current) {
      ExportManager.revokeBlobUrl(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    try {
      let result;

      if (isBulk) {
        result = await ExportManager.exportAllManifests(variants);
      } else {
        result = await ExportManager.exportVariantManifest(variant);
      }

      if (result.success) {
        blobUrlRef.current = result.blobUrl || null;
        const successMsg = isBulk
          ? `Successfully exported ${variants.length} variant${variants.length !== 1 ? 's' : ''}${result.skipped ? ` (${result.skipped} skipped)` : ''}`
          : 'Manifest exported successfully';
        setExportState(EXPORT_STATE.SUCCESS);
        setFeedbackMessage(successMsg);
        announce(successMsg);
        scheduleFeedbackReset();
      } else {
        const errorMsg = result.error || 'Export failed. Please try again.';
        setExportState(EXPORT_STATE.ERROR);
        setFeedbackMessage(errorMsg);
        announce(`Export failed: ${errorMsg}`);
        scheduleFeedbackReset();
      }

      if (typeof onExportComplete === 'function') {
        onExportComplete(result);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred during export.';
      setExportState(EXPORT_STATE.ERROR);
      setFeedbackMessage(errorMsg);
      announce(`Export failed: ${errorMsg}`);
      scheduleFeedbackReset();

      if (typeof onExportComplete === 'function') {
        onExportComplete({ success: false, error: errorMsg });
      }
    }
  }, [isDisabled, isBulk, variant, variants, announce, scheduleFeedbackReset, onExportComplete]);

  /**
   * Handles keydown events for keyboard accessibility.
   * @param {React.KeyboardEvent} event
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleExport();
    }
  }, [handleExport]);

  /**
   * Renders the appropriate icon based on the current export state.
   * @returns {JSX.Element}
   */
  function renderIcon() {
    if (exportState === EXPORT_STATE.LOADING) {
      return (
        <Loader2
          className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      );
    }
    if (exportState === EXPORT_STATE.SUCCESS) {
      return (
        <Check
          className="h-4 w-4"
          aria-hidden="true"
        />
      );
    }
    if (exportState === EXPORT_STATE.ERROR) {
      return (
        <AlertTriangle
          className="h-4 w-4"
          aria-hidden="true"
        />
      );
    }
    return (
      <Download
        className="h-4 w-4"
        aria-hidden="true"
      />
    );
  }

  /**
   * Returns the display label based on the current export state.
   * @returns {string}
   */
  function getDisplayLabel() {
    if (exportState === EXPORT_STATE.LOADING) {
      return 'Exporting…';
    }
    if (exportState === EXPORT_STATE.SUCCESS) {
      return 'Exported!';
    }
    if (exportState === EXPORT_STATE.ERROR) {
      return 'Export Failed';
    }
    return resolvedLabel;
  }

  const stateStyle = STATE_STYLES[exportState] || '';

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleExport}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        className={`inline-flex items-center gap-2 rounded-md font-medium transition-colors ${sizeClasses} ${exportState === EXPORT_STATE.SUCCESS || exportState === EXPORT_STATE.ERROR ? stateStyle : `${variantStyles.base} ${variantStyles.hover}`} ${variantStyles.focus} ${stateStyle} disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
        aria-label={resolvedAriaLabel}
        aria-busy={exportState === EXPORT_STATE.LOADING}
        aria-disabled={isDisabled}
      >
        {renderIcon()}
        <span>{getDisplayLabel()}</span>
      </button>

      {feedbackMessage && exportState === EXPORT_STATE.ERROR && (
        <p
          className="text-xs text-red-600 max-w-xs truncate"
          role="alert"
          aria-live="assertive"
        >
          {feedbackMessage}
        </p>
      )}

      {feedbackMessage && exportState === EXPORT_STATE.SUCCESS && (
        <p
          className="text-xs text-green-700 max-w-xs truncate"
          role="status"
          aria-live="polite"
        >
          {feedbackMessage}
        </p>
      )}
    </div>
  );
}

ExportButton.propTypes = {
  variant: PropTypes.object,
  variants: PropTypes.arrayOf(PropTypes.object),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  buttonVariant: PropTypes.oneOf(['primary', 'secondary']),
  label: PropTypes.string,
  ariaLabel: PropTypes.string,
  onExportComplete: PropTypes.func,
  className: PropTypes.string,
};

ExportButton.defaultProps = {
  variant: undefined,
  variants: undefined,
  size: 'md',
  buttonVariant: 'primary',
  label: '',
  ariaLabel: '',
  onExportComplete: undefined,
  className: '',
};

export { ExportButton, EXPORT_STATE, FEEDBACK_DURATION, SIZE_MAP, VARIANT_STYLES };
export default ExportButton;