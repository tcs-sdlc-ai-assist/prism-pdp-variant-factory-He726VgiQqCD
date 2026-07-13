/**
 * @module Header
 * @description Application header with Prism branding, navigation links,
 * accessibility controls toggle, and responsive hamburger menu.
 * Uses semantic <header> and <nav> elements with ARIA labels.
 * [Pipeline-aligned: synthetic data only]
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Menu, X, Eye, Type, Monitor } from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityProvider.jsx';
import { FONT_SIZE_OPTIONS } from '@/context/AccessibilityProvider.jsx';
import { getFocusableElements } from '@/utils/accessibilityHelpers.js';

/**
 * Navigation link data.
 * @type {Array<{label: string, href: string}>}
 */
const NAV_LINKS = [
  { label: 'Gallery', href: '/' },
  { label: 'About', href: '/about' },
];

/**
 * Header component that renders the application header with Prism branding,
 * navigation links, accessibility controls, and a responsive hamburger menu.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function Header({ className }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [a11yPanelOpen, setA11yPanelOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const a11yPanelRef = useRef(null);
  const hamburgerButtonRef = useRef(null);
  const a11yToggleRef = useRef(null);

  const { state, toggleHighContrast, setFontSize } = useAccessibility();

  /**
   * Toggles the mobile menu open/closed.
   */
  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => {
      if (!prev) {
        setA11yPanelOpen(false);
      }
      return !prev;
    });
  }, []);

  /**
   * Closes the mobile menu.
   */
  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    if (hamburgerButtonRef.current) {
      hamburgerButtonRef.current.focus();
    }
  }, []);

  /**
   * Toggles the accessibility controls panel.
   */
  const handleToggleA11yPanel = useCallback(() => {
    setA11yPanelOpen((prev) => !prev);
  }, []);

  /**
   * Handles keydown events on the mobile menu for keyboard accessibility.
   * @param {React.KeyboardEvent} event
   */
  const handleMobileMenuKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleCloseMobileMenu();
    }

    if (event.key === 'Tab' && mobileMenuRef.current) {
      const focusableElements = getFocusableElements(mobileMenuRef.current);
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
  }, [handleCloseMobileMenu]);

  /**
   * Handles keydown events on the accessibility panel.
   * @param {React.KeyboardEvent} event
   */
  const handleA11yPanelKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setA11yPanelOpen(false);
      if (a11yToggleRef.current) {
        a11yToggleRef.current.focus();
      }
    }

    if (event.key === 'Tab' && a11yPanelRef.current) {
      const focusableElements = getFocusableElements(a11yPanelRef.current);
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
  }, []);

  /**
   * Handles font size change.
   * @param {string} size - The font size to set.
   */
  const handleFontSizeChange = useCallback((size) => {
    setFontSize(size);
  }, [setFontSize]);

  /**
   * Close mobile menu and a11y panel when clicking outside.
   */
  useEffect(() => {
    /**
     * @param {MouseEvent} event
     */
    function handleClickOutside(event) {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }

      if (
        a11yPanelOpen &&
        a11yPanelRef.current &&
        !a11yPanelRef.current.contains(event.target) &&
        a11yToggleRef.current &&
        !a11yToggleRef.current.contains(event.target)
      ) {
        setA11yPanelOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen, a11yPanelOpen]);

  /**
   * Returns the display label for a font size option.
   * @param {string} size - The font size option.
   * @returns {string}
   */
  function getFontSizeLabel(size) {
    if (size === 'normal') {
      return 'Normal';
    }
    if (size === 'large') {
      return 'Large';
    }
    if (size === 'x-large') {
      return 'X-Large';
    }
    return size;
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-gray-200 bg-bby-blue-500 shadow-sm ${className || ''}`}
      role="banner"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Branding */}
        <div className="flex items-center gap-2">
          <Monitor
            className="h-6 w-6 text-bby-yellow-500"
            aria-hidden="true"
          />
          <a
            href="/"
            className="text-lg font-bold text-white hover:text-bby-yellow-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-sm"
            aria-label="Prism PDP Variant Factory — Home"
          >
            Prism PDP Variant Factory
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white hover:text-bby-yellow-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-sm"
            >
              {link.label}
            </a>
          ))}

          {/* Accessibility Controls Toggle (Desktop) */}
          <div className="relative">
            <button
              ref={a11yToggleRef}
              type="button"
              onClick={handleToggleA11yPanel}
              className="inline-flex items-center gap-1.5 rounded-md bg-bby-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-bby-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              aria-expanded={a11yPanelOpen}
              aria-haspopup="true"
              aria-label="Accessibility settings"
            >
              <Eye
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="hidden lg:inline">Accessibility</span>
            </button>

            {a11yPanelOpen && (
              <div
                ref={a11yPanelRef}
                role="dialog"
                aria-label="Accessibility settings panel"
                onKeyDown={handleA11yPanelKeyDown}
                className="absolute right-0 mt-2 w-64 rounded-md border border-gray-200 bg-white p-4 shadow-lg"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Accessibility Settings
                </h3>

                {/* High Contrast Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <label
                    htmlFor="high-contrast-toggle"
                    className="text-sm text-gray-700"
                  >
                    High Contrast
                  </label>
                  <button
                    id="high-contrast-toggle"
                    type="button"
                    role="switch"
                    aria-checked={state.highContrastMode}
                    onClick={toggleHighContrast}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 ${state.highContrastMode ? 'bg-bby-blue-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.highContrastMode ? 'translate-x-6' : 'translate-x-1'}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {/* Font Size */}
                <div className="mb-1">
                  <span className="text-sm text-gray-700 flex items-center gap-1.5 mb-2">
                    <Type
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Font Size
                  </span>
                  <div className="flex gap-1">
                    {FONT_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleFontSizeChange(size)}
                        className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 ${state.fontSize === size ? 'bg-bby-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        aria-pressed={state.fontSize === size}
                        aria-label={`Set font size to ${getFontSizeLabel(size)}`}
                      >
                        {getFontSizeLabel(size)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reduced Motion Indicator */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${state.prefersReducedMotion ? 'bg-green-500' : 'bg-gray-300'}`}
                    aria-hidden="true"
                  />
                  <span>
                    Reduced motion: {state.prefersReducedMotion ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          ref={hamburgerButtonRef}
          type="button"
          onClick={handleToggleMobileMenu}
          className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-bby-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          role="dialog"
          aria-label="Mobile navigation menu"
          onKeyDown={handleMobileMenuKeyDown}
          className="border-t border-bby-blue-400 bg-bby-blue-600 md:hidden"
        >
          <nav
            className="flex flex-col px-4 py-3 space-y-1"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleCloseMobileMenu}
                className="block rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-bby-blue-700 hover:text-bby-yellow-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Accessibility Controls */}
          <div className="border-t border-bby-blue-400 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-bby-blue-200 mb-3">
              Accessibility
            </h3>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="mobile-high-contrast-toggle"
                className="text-sm text-white"
              >
                High Contrast
              </label>
              <button
                id="mobile-high-contrast-toggle"
                type="button"
                role="switch"
                aria-checked={state.highContrastMode}
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${state.highContrastMode ? 'bg-bby-yellow-500' : 'bg-bby-blue-400'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.highContrastMode ? 'translate-x-6' : 'translate-x-1'}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Font Size */}
            <div className="mb-2">
              <span className="text-sm text-white flex items-center gap-1.5 mb-2">
                <Type
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Font Size
              </span>
              <div className="flex gap-1">
                {FONT_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleFontSizeChange(size)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${state.fontSize === size ? 'bg-bby-yellow-500 text-bby-blue-900' : 'bg-bby-blue-400 text-white hover:bg-bby-blue-500'}`}
                    aria-pressed={state.fontSize === size}
                    aria-label={`Set font size to ${getFontSizeLabel(size)}`}
                  >
                    {getFontSizeLabel(size)}
                  </button>
                ))}
              </div>
            </div>

            {/* Reduced Motion Indicator */}
            <div className="mt-2 flex items-center gap-2 text-xs text-bby-blue-200">
              <span
                className={`inline-block h-2 w-2 rounded-full ${state.prefersReducedMotion ? 'bg-green-400' : 'bg-bby-blue-400'}`}
                aria-hidden="true"
              />
              <span>
                Reduced motion: {state.prefersReducedMotion ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

Header.propTypes = {
  className: PropTypes.string,
};

Header.defaultProps = {
  className: '',
};

export { Header, NAV_LINKS };
export default Header;