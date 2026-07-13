/**
 * @module SkipLink
 * @description Accessibility skip navigation component for keyboard users.
 * Renders a visually hidden link that becomes visible on focus, allowing users
 * to skip repetitive navigation and jump directly to main content.
 * WCAG 2.1 AA requirement for keyboard accessibility.
 * [Pipeline-aligned: synthetic data only]
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Default target element ID for the skip link.
 * @type {string}
 */
const DEFAULT_TARGET_ID = 'main-content';

/**
 * Default label text for the skip link.
 * @type {string}
 */
const DEFAULT_LABEL = 'Skip to main content';

/**
 * SkipLink component that provides keyboard users with a way to skip
 * repetitive navigation elements and jump directly to the main content area.
 * The link is visually hidden until it receives keyboard focus, at which point
 * it becomes visible at the top of the viewport.
 *
 * @param {object} props
 * @param {string} [props.targetId] - The ID of the element to skip to (without '#' prefix).
 * @param {string} [props.label] - The visible text label for the skip link.
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function SkipLink({ targetId, label, className }) {
  const resolvedTargetId = targetId && typeof targetId === 'string' && targetId.trim().length > 0
    ? targetId.trim()
    : DEFAULT_TARGET_ID;

  const resolvedLabel = label && typeof label === 'string' && label.trim().length > 0
    ? label.trim()
    : DEFAULT_LABEL;

  /**
   * Handles click on the skip link. Moves focus to the target element
   * and ensures it is focusable by setting tabindex if needed.
   * @param {React.MouseEvent} event
   */
  const handleClick = useCallback((event) => {
    event.preventDefault();

    const targetElement = document.getElementById(resolvedTargetId);

    if (targetElement) {
      if (!targetElement.getAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      targetElement.focus({ preventScroll: false });
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [resolvedTargetId]);

  return (
    <a
      href={`#${resolvedTargetId}`}
      onClick={handleClick}
      className={`skip-link ${className || ''}`}
      aria-label={resolvedLabel}
    >
      {resolvedLabel}
    </a>
  );
}

SkipLink.propTypes = {
  targetId: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
};

SkipLink.defaultProps = {
  targetId: DEFAULT_TARGET_ID,
  label: DEFAULT_LABEL,
  className: '',
};

export { SkipLink, DEFAULT_TARGET_ID, DEFAULT_LABEL };
export default SkipLink;