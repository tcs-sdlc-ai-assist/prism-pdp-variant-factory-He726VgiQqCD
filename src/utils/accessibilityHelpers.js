/**
 * @module accessibilityHelpers
 * @description Accessibility utility functions for WCAG 2.1 AA compliance.
 * Provides screen reader announcements via aria-live regions, focus trapping,
 * route change focus management, and color contrast ratio calculation.
 * [Pipeline-aligned: synthetic data only]
 */

/**
 * ID for the aria-live announcer element injected into the DOM.
 * @type {string}
 */
const ANNOUNCER_ID = 'prism-a11y-announcer';

/**
 * Ensures the aria-live announcer element exists in the DOM.
 * Creates it if not already present.
 * @returns {HTMLElement} The announcer element.
 */
function ensureAnnouncer() {
  let announcer = document.getElementById(ANNOUNCER_ID);
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = ANNOUNCER_ID;
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  }
  return announcer;
}

/**
 * Announces a message to screen readers using an aria-live region.
 * Supports 'polite' and 'assertive' politeness levels.
 * @param {string} message - The message to announce.
 * @param {'polite'|'assertive'} [politeness='polite'] - The aria-live politeness level.
 */
function announceToScreenReader(message, politeness = 'polite') {
  if (!message || typeof message !== 'string') {
    return;
  }

  const validPoliteness = politeness === 'assertive' ? 'assertive' : 'polite';
  const announcer = ensureAnnouncer();
  announcer.setAttribute('aria-live', validPoliteness);

  // Clear the announcer first to ensure repeated identical messages are announced
  announcer.textContent = '';

  // Use a small delay so the DOM mutation is picked up by assistive technology
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

/**
 * Selector for all focusable elements within a container.
 * @type {string}
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details',
  'summary',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
].join(', ');

/**
 * Returns all focusable elements within a container.
 * @param {HTMLElement} container - The container element.
 * @returns {HTMLElement[]} Array of focusable elements.
 */
function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return [];
  }

  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    return el.offsetParent !== null || el.getClientRects().length > 0;
  });
}

/**
 * Traps keyboard focus within a container element.
 * Returns a cleanup function that removes the event listener.
 * Typically used with modal dialogs and dropdown menus.
 * @param {React.RefObject<HTMLElement>|HTMLElement} containerRef - A React ref or DOM element.
 * @returns {function} Cleanup function to remove the focus trap.
 */
function trapFocus(containerRef) {
  const container = containerRef && containerRef.current
    ? containerRef.current
    : containerRef;

  if (!container || typeof container.addEventListener !== 'function') {
    return () => {};
  }

  /**
   * Handles keydown events to trap Tab and Shift+Tab within the container.
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Focus the first focusable element within the container
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Manages focus on route change by moving focus to the main content area.
 * Looks for an element with id="main-content" or role="main", or falls back
 * to the first h1 element. Announces the page change to screen readers.
 * @param {string} [pageTitle] - Optional page title to announce.
 */
function manageFocusOnRouteChange(pageTitle) {
  // Use requestAnimationFrame to ensure the DOM has updated after route change
  requestAnimationFrame(() => {
    const mainContent =
      document.getElementById('main-content') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('main');

    if (mainContent) {
      if (!mainContent.getAttribute('tabindex')) {
        mainContent.setAttribute('tabindex', '-1');
      }
      mainContent.focus({ preventScroll: false });
    } else {
      const heading = document.querySelector('h1');
      if (heading) {
        if (!heading.getAttribute('tabindex')) {
          heading.setAttribute('tabindex', '-1');
        }
        heading.focus({ preventScroll: false });
      }
    }

    if (pageTitle && typeof pageTitle === 'string') {
      announceToScreenReader(`Navigated to ${pageTitle}`);
    }
  });
}

/**
 * Parses a hex color string to its RGB components.
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) hex formats.
 * @param {string} hex - The hex color string.
 * @returns {{ r: number, g: number, b: number }|null} RGB object or null if invalid.
 */
function parseHexColor(hex) {
  if (!hex || typeof hex !== 'string') {
    return null;
  }

  let cleaned = hex.replace(/^#/, '');

  if (cleaned.length === 3) {
    cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }

  if (cleaned.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }

  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

/**
 * Calculates the relative luminance of an RGB color per WCAG 2.1 specification.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @param {{ r: number, g: number, b: number }} rgb - The RGB color object (0-255).
 * @returns {number} The relative luminance value (0-1).
 */
function getRelativeLuminance(rgb) {
  const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];

  const linear = sRGB.map((channel) => {
    if (channel <= 0.04045) {
      return channel / 12.92;
    }
    return Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * Calculates the contrast ratio between two colors per WCAG 2.1 specification.
 * Accepts hex color strings (e.g., '#ffffff', '#000', '#0046be').
 * Returns a ratio between 1 and 21.
 * WCAG 2.1 AA requires:
 *   - Normal text: >= 4.5:1
 *   - Large text (18pt+ or 14pt+ bold): >= 3:1
 * @see https://www.w3.org/TR/WCAG21/#contrast-minimum
 * @param {string} fg - Foreground hex color string.
 * @param {string} bg - Background hex color string.
 * @returns {number} The contrast ratio (1 to 21), or -1 if inputs are invalid.
 */
function getContrastRatio(fg, bg) {
  const fgRgb = parseHexColor(fg);
  const bgRgb = parseHexColor(bg);

  if (!fgRgb || !bgRgb) {
    return -1;
  }

  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks whether a foreground/background color pair meets WCAG 2.1 AA contrast requirements.
 * @param {string} fg - Foreground hex color string.
 * @param {string} bg - Background hex color string.
 * @param {'normal'|'large'} [textSize='normal'] - The text size category.
 * @returns {{ passes: boolean, ratio: number, required: number }}
 */
function meetsContrastRequirement(fg, bg, textSize = 'normal') {
  const ratio = getContrastRatio(fg, bg);
  const required = textSize === 'large' ? 3 : 4.5;

  if (ratio === -1) {
    return { passes: false, ratio: -1, required };
  }

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

/**
 * Generates an appropriate aria-label for a variant card element.
 * @param {object} variantData - The variant data object.
 * @param {string} [cohortName] - The cohort name for context.
 * @returns {string} The generated aria-label.
 */
function generateVariantAriaLabel(variantData, cohortName) {
  if (!variantData || typeof variantData !== 'object') {
    return 'Product variant';
  }

  const title = variantData.title || 'Untitled variant';
  const price = typeof variantData.price === 'number'
    ? `$${variantData.price.toFixed(2)}`
    : '';
  const badge = variantData.badge || '';
  const cohort = cohortName ? ` for ${cohortName} cohort` : '';

  const parts = [title];
  if (price) {
    parts.push(price);
  }
  if (badge) {
    parts.push(badge);
  }

  return `${parts.join(', ')}${cohort}`;
}

/**
 * Removes the aria-live announcer element from the DOM.
 * Useful for cleanup in tests.
 */
function removeAnnouncer() {
  const announcer = document.getElementById(ANNOUNCER_ID);
  if (announcer && announcer.parentNode) {
    announcer.parentNode.removeChild(announcer);
  }
}

export {
  announceToScreenReader,
  trapFocus,
  manageFocusOnRouteChange,
  getContrastRatio,
  meetsContrastRequirement,
  generateVariantAriaLabel,
  getFocusableElements,
  parseHexColor,
  getRelativeLuminance,
  ensureAnnouncer,
  removeAnnouncer,
  ANNOUNCER_ID,
  FOCUSABLE_SELECTOR,
};