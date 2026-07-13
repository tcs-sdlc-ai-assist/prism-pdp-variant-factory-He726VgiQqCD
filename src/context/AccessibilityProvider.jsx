/**
 * @module AccessibilityProvider
 * @description React context provider for accessibility features.
 * Manages aria-live announcement region, reduced motion preference,
 * high contrast mode toggle, and font size scaling.
 * Wraps the app to provide accessibility state and helpers to all components.
 * [Pipeline-aligned: synthetic data only]
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  announceToScreenReader,
  ensureAnnouncer,
  removeAnnouncer,
} from '@/utils/accessibilityHelpers.js';
import { STORAGE_PREFIX } from '@/constants/constants.js';

/**
 * Storage keys for persisted accessibility preferences.
 * @type {object}
 */
const A11Y_STORAGE_KEYS = {
  highContrast: `${STORAGE_PREFIX}-a11y-high-contrast`,
  reducedMotion: `${STORAGE_PREFIX}-a11y-reduced-motion`,
  fontSize: `${STORAGE_PREFIX}-a11y-font-size`,
};

/**
 * Available font size options.
 * @type {string[]}
 */
const FONT_SIZE_OPTIONS = ['normal', 'large', 'x-large'];

/**
 * @typedef {object} AccessibilityState
 * @property {boolean} highContrastMode - Whether high contrast mode is enabled.
 * @property {boolean} prefersReducedMotion - Whether the user prefers reduced motion.
 * @property {string} fontSize - Current font size setting ('normal', 'large', 'x-large').
 */

/**
 * @typedef {object} AccessibilityContextValue
 * @property {AccessibilityState} state - Current accessibility state.
 * @property {function} toggleHighContrast - Toggles high contrast mode.
 * @property {function} setFontSize - Sets the font size preference.
 * @property {function} announce - Announces a message to screen readers.
 * @property {function} announceAssertive - Announces an assertive message to screen readers.
 */

/**
 * React context for accessibility state and helpers.
 * @type {React.Context<AccessibilityContextValue|null>}
 */
const AccessibilityContext = createContext(null);

/**
 * Reads a boolean preference from localStorage.
 * @param {string} key - The storage key.
 * @param {boolean} defaultValue - The default value if not found.
 * @returns {boolean}
 */
function readBooleanPreference(key, defaultValue) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }
    return stored === 'true';
  } catch (_e) {
    return defaultValue;
  }
}

/**
 * Reads a string preference from localStorage.
 * @param {string} key - The storage key.
 * @param {string} defaultValue - The default value if not found.
 * @param {string[]} validValues - Array of valid values.
 * @returns {string}
 */
function readStringPreference(key, defaultValue, validValues) {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null || !validValues.includes(stored)) {
      return defaultValue;
    }
    return stored;
  } catch (_e) {
    return defaultValue;
  }
}

/**
 * Writes a preference to localStorage.
 * @param {string} key - The storage key.
 * @param {*} value - The value to store.
 */
function writePreference(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch (_e) {
    // Silently fail if storage is unavailable
  }
}

/**
 * Detects the user's prefers-reduced-motion media query preference.
 * @returns {boolean}
 */
function detectReducedMotionPreference() {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch (_e) {
    // Fallback
  }
  return false;
}

/**
 * AccessibilityProvider component that wraps the application with accessibility
 * context. Manages aria-live announcement region, reduced motion preference,
 * high contrast mode toggle, and font size scaling.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element}
 */
function AccessibilityProvider({ children }) {
  const [highContrastMode, setHighContrastMode] = useState(() => {
    return readBooleanPreference(A11Y_STORAGE_KEYS.highContrast, false);
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    const stored = readBooleanPreference(A11Y_STORAGE_KEYS.reducedMotion, null);
    if (stored !== null && stored !== false && stored !== true) {
      return detectReducedMotionPreference();
    }
    // If we have a stored preference, use it; otherwise detect from OS
    try {
      const raw = window.localStorage.getItem(A11Y_STORAGE_KEYS.reducedMotion);
      if (raw !== null) {
        return raw === 'true';
      }
    } catch (_e) {
      // Fallback
    }
    return detectReducedMotionPreference();
  });

  const [fontSize, setFontSizeState] = useState(() => {
    return readStringPreference(A11Y_STORAGE_KEYS.fontSize, 'normal', FONT_SIZE_OPTIONS);
  });

  /**
   * Ensures the aria-live announcer element exists on mount and cleans up on unmount.
   */
  useEffect(() => {
    ensureAnnouncer();

    return () => {
      removeAnnouncer();
    };
  }, []);

  /**
   * Listens for changes to the prefers-reduced-motion media query.
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    let mediaQuery;
    try {
      mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch (_e) {
      return;
    }

    /**
     * Handles changes to the prefers-reduced-motion media query.
     * @param {MediaQueryListEvent} event
     */
    function handleChange(event) {
      setPrefersReducedMotion(event.matches);
      writePreference(A11Y_STORAGE_KEYS.reducedMotion, event.matches);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  /**
   * Applies high contrast mode class to the document element.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrastMode]);

  /**
   * Applies reduced motion class to the document element.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [prefersReducedMotion]);

  /**
   * Applies font size class to the document element.
   */
  useEffect(() => {
    const root = document.documentElement;
    // Remove all font size classes first
    FONT_SIZE_OPTIONS.forEach((option) => {
      root.classList.remove(`font-size-${option}`);
    });
    // Add the current font size class
    root.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  /**
   * Toggles high contrast mode on/off.
   */
  const toggleHighContrast = useCallback(() => {
    setHighContrastMode((prev) => {
      const next = !prev;
      writePreference(A11Y_STORAGE_KEYS.highContrast, next);
      announceToScreenReader(
        next ? 'High contrast mode enabled' : 'High contrast mode disabled',
        'polite',
      );
      return next;
    });
  }, []);

  /**
   * Sets the font size preference.
   * @param {string} size - The font size to set ('normal', 'large', 'x-large').
   */
  const setFontSize = useCallback((size) => {
    if (!FONT_SIZE_OPTIONS.includes(size)) {
      return;
    }
    setFontSizeState(size);
    writePreference(A11Y_STORAGE_KEYS.fontSize, size);
    announceToScreenReader(`Font size set to ${size}`, 'polite');
  }, []);

  /**
   * Announces a polite message to screen readers.
   * @param {string} message - The message to announce.
   */
  const announce = useCallback((message) => {
    announceToScreenReader(message, 'polite');
  }, []);

  /**
   * Announces an assertive message to screen readers.
   * @param {string} message - The message to announce.
   */
  const announceAssertive = useCallback((message) => {
    announceToScreenReader(message, 'assertive');
  }, []);

  /**
   * The accessibility state object.
   * @type {AccessibilityState}
   */
  const state = useMemo(() => ({
    highContrastMode,
    prefersReducedMotion,
    fontSize,
  }), [highContrastMode, prefersReducedMotion, fontSize]);

  /**
   * The context value provided to consumers.
   * @type {AccessibilityContextValue}
   */
  const contextValue = useMemo(() => ({
    state,
    toggleHighContrast,
    setFontSize,
    announce,
    announceAssertive,
  }), [state, toggleHighContrast, setFontSize, announce, announceAssertive]);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

AccessibilityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to access the AccessibilityContext.
 * Throws an error if used outside of an AccessibilityProvider.
 * @returns {AccessibilityContextValue} The context value containing state and helpers.
 */
function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === null) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider.');
  }
  return context;
}

export { AccessibilityContext, AccessibilityProvider, useAccessibility, A11Y_STORAGE_KEYS, FONT_SIZE_OPTIONS };
export default AccessibilityProvider;