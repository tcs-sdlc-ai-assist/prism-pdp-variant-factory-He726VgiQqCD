/**
 * @module DiffHighlight
 * @description Visual diff highlighting component that renders changed fields
 * with a colored border/background and a tooltip showing the control value.
 * Used by gallery and detail views for visual diff comparison between
 * control and variant field values. Uses prop-types for validation.
 * [Pipeline-aligned: synthetic data only]
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { deepEqual } from '@/utils/diffUtils.js';

/**
 * Formats a value for display in the tooltip or diff output.
 * Handles arrays, objects, numbers, booleans, and strings.
 * @param {*} value - The value to format.
 * @returns {string} The formatted string representation.
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return '(empty)';
  }

  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      return '(empty)';
    }
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '(empty list)';
    }
    return value.map((item, index) => `${index + 1}. ${String(item)}`).join('\n');
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_e) {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Truncates a string to a maximum length, appending an ellipsis if truncated.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - The maximum allowed length.
 * @returns {string} The truncated text.
 */
function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '…';
}

/**
 * Available highlight mode options.
 * @type {Object<string, { bg: string, border: string, text: string, label: string }>}
 */
const HIGHLIGHT_STYLES = {
  changed: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-800',
    label: 'Changed',
  },
  added: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-800',
    label: 'Added',
  },
  removed: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-800',
    label: 'Removed',
  },
  unchanged: {
    bg: 'bg-transparent',
    border: 'border-transparent',
    text: 'text-gray-700',
    label: 'Unchanged',
  },
};

/**
 * Maximum tooltip text length before truncation.
 * @type {number}
 */
const TOOLTIP_MAX_LENGTH = 200;

/**
 * Determines the highlight mode based on control and variant values.
 * @param {*} controlValue - The control field value.
 * @param {*} variantValue - The variant field value.
 * @returns {'changed'|'added'|'removed'|'unchanged'} The highlight mode.
 */
function determineHighlightMode(controlValue, variantValue) {
  const controlEmpty = controlValue === null || controlValue === undefined;
  const variantEmpty = variantValue === null || variantValue === undefined;

  if (controlEmpty && variantEmpty) {
    return 'unchanged';
  }

  if (controlEmpty && !variantEmpty) {
    return 'added';
  }

  if (!controlEmpty && variantEmpty) {
    return 'removed';
  }

  if (deepEqual(controlValue, variantValue)) {
    return 'unchanged';
  }

  return 'changed';
}

/**
 * DiffHighlight component that visually highlights differences between
 * a control field value and a variant field value. Renders changed fields
 * with a colored border/background and a tooltip showing the control value.
 *
 * @param {object} props
 * @param {string} props.fieldName - The name of the field being compared.
 * @param {*} props.controlValue - The control (baseline) field value.
 * @param {*} props.variantValue - The variant (tailored) field value.
 * @param {React.ReactNode} [props.children] - Optional children to render inside the highlight wrapper.
 * @param {boolean} [props.showLabel] - Whether to show the field name label.
 * @param {boolean} [props.showTooltip] - Whether to show the control value tooltip on hover.
 * @param {boolean} [props.inline] - Whether to render as an inline element.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function DiffHighlight({
  fieldName,
  controlValue,
  variantValue,
  children,
  showLabel,
  showTooltip,
  inline,
  className,
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  const mode = determineHighlightMode(controlValue, variantValue);
  const styles = HIGHLIGHT_STYLES[mode];
  const isChanged = mode !== 'unchanged';

  const formattedControlValue = formatValue(controlValue);
  const truncatedControlValue = truncateText(formattedControlValue, TOOLTIP_MAX_LENGTH);

  /**
   * Shows the tooltip on mouse enter.
   */
  const handleMouseEnter = useCallback(() => {
    if (showTooltip && isChanged) {
      setTooltipVisible(true);
    }
  }, [showTooltip, isChanged]);

  /**
   * Hides the tooltip on mouse leave.
   */
  const handleMouseLeave = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  /**
   * Toggles the tooltip on focus for keyboard accessibility.
   */
  const handleFocus = useCallback(() => {
    if (showTooltip && isChanged) {
      setTooltipVisible(true);
    }
  }, [showTooltip, isChanged]);

  /**
   * Hides the tooltip on blur.
   */
  const handleBlur = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  /**
   * Handles keydown events for Escape to dismiss tooltip.
   * @param {React.KeyboardEvent} event
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setTooltipVisible(false);
    }
  }, []);

  /**
   * Close tooltip when clicking outside.
   */
  useEffect(() => {
    if (!tooltipVisible) {
      return;
    }

    /**
     * @param {MouseEvent} event
     */
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setTooltipVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tooltipVisible]);

  const resolvedFieldName = fieldName && typeof fieldName === 'string' && fieldName.trim().length > 0
    ? fieldName.trim()
    : 'Field';

  const Tag = inline ? 'span' : 'div';

  const borderClass = isChanged ? `border-l-4 ${styles.border}` : 'border-l-4 border-transparent';

  const hasChildren = children !== null && children !== undefined;
  const displayContent = hasChildren
    ? children
    : (
      <span className={`text-sm ${isChanged ? styles.text : 'text-gray-700'}`}>
        {formatValue(variantValue)}
      </span>
    );

  const tooltipId = `diff-tooltip-${resolvedFieldName.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Tag
      ref={containerRef}
      className={`relative ${inline ? 'inline-flex items-center' : 'block'} ${isChanged ? `${styles.bg} ${borderClass} rounded-r-md` : borderClass} ${isChanged ? 'pl-3 py-1.5 pr-2' : 'pl-3 py-1 pr-2'} ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      tabIndex={isChanged && showTooltip ? 0 : undefined}
      role={isChanged ? 'group' : undefined}
      aria-label={isChanged ? `${resolvedFieldName}: ${styles.label}` : undefined}
      aria-describedby={isChanged && showTooltip ? tooltipId : undefined}
    >
      {showLabel && (
        <span className={`block text-xs font-semibold uppercase tracking-wide mb-0.5 ${isChanged ? styles.text : 'text-gray-500'}`}>
          {resolvedFieldName}
          {isChanged && (
            <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${styles.bg} ${styles.text} ring-1 ring-inset ${styles.border}`}>
              {styles.label}
            </span>
          )}
        </span>
      )}

      {displayContent}

      {/* Tooltip showing control value */}
      {showTooltip && isChanged && tooltipVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="absolute z-20 bottom-full left-0 mb-2 w-64 max-w-xs rounded-md border border-gray-300 bg-white p-3 shadow-lg"
        >
          <p className="text-xs font-semibold text-gray-500 mb-1">
            Control value:
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {truncatedControlValue}
          </p>
          <div className="absolute top-full left-4 -mt-px">
            <div className="h-2 w-2 rotate-45 border-b border-r border-gray-300 bg-white" />
          </div>
        </div>
      )}
    </Tag>
  );
}

DiffHighlight.propTypes = {
  fieldName: PropTypes.string.isRequired,
  controlValue: PropTypes.any,
  variantValue: PropTypes.any,
  children: PropTypes.node,
  showLabel: PropTypes.bool,
  showTooltip: PropTypes.bool,
  inline: PropTypes.bool,
  className: PropTypes.string,
};

DiffHighlight.defaultProps = {
  controlValue: null,
  variantValue: null,
  children: null,
  showLabel: true,
  showTooltip: true,
  inline: false,
  className: '',
};

export {
  DiffHighlight,
  HIGHLIGHT_STYLES,
  TOOLTIP_MAX_LENGTH,
  formatValue,
  truncateText,
  determineHighlightMode,
};
export default DiffHighlight;