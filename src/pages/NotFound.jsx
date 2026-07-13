/**
 * @module NotFound
 * @description 404 Not Found page with accessible messaging and link back to gallery.
 * Displayed for unknown routes. Uses semantic landmarks and ARIA attributes.
 * [Pipeline-aligned: synthetic data only]
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityProvider.jsx';
import { manageFocusOnRouteChange } from '@/utils/accessibilityHelpers.js';

/**
 * Page title for accessibility announcements.
 * @type {string}
 */
const PAGE_TITLE = 'Page Not Found';

/**
 * NotFound page component that displays a 404 error message with accessible
 * messaging and navigation links back to the gallery.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function NotFound({ className }) {
  const navigate = useNavigate();
  const { announce } = useAccessibility();

  /**
   * Manage focus on initial mount for route change accessibility.
   */
  useEffect(() => {
    manageFocusOnRouteChange(PAGE_TITLE);
    announce('Page not found. The requested page does not exist.');
  }, [announce]);

  /**
   * Navigates back to the gallery.
   */
  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Navigates back in browser history.
   */
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Handles keydown events for the home button.
   * @param {React.KeyboardEvent} event
   */
  const handleGoHomeKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGoHome();
    }
  }, [handleGoHome]);

  /**
   * Handles keydown events for the go back button.
   * @param {React.KeyboardEvent} event
   */
  const handleGoBackKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGoBack();
    }
  }, [handleGoBack]);

  return (
    <main
      id="main-content"
      className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className || ''}`}
      aria-label={PAGE_TITLE}
      role="main"
    >
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-20 text-center sm:py-28"
        role="status"
        aria-label="Page not found"
      >
        <FileQuestion
          className="h-16 w-16 text-gray-400 mb-6"
          aria-hidden="true"
        />

        <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:text-4xl">
          404
        </h1>

        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          {PAGE_TITLE}
        </h2>

        <p className="text-sm text-gray-500 mb-8 max-w-md">
          The page you are looking for does not exist or has been moved. Please check the URL or navigate back to the gallery.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={handleGoHome}
            onKeyDown={handleGoHomeKeyDown}
            className="inline-flex items-center gap-1.5 rounded-md bg-bby-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-bby-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
            aria-label="Go to gallery home page"
          >
            <Home
              className="h-4 w-4"
              aria-hidden="true"
            />
            Go to Gallery
          </button>

          <button
            type="button"
            onClick={handleGoBack}
            onKeyDown={handleGoBackKeyDown}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
            aria-label="Go back to previous page"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Go Back
          </button>
        </div>
      </div>

      {/* Synthetic Data Disclaimer */}
      <div className="mt-8 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
        <p className="text-xs font-medium text-yellow-800">
          All data displayed is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]
        </p>
      </div>
    </main>
  );
}

NotFound.propTypes = {
  className: PropTypes.string,
};

NotFound.defaultProps = {
  className: '',
};

export { NotFound, PAGE_TITLE };
export default NotFound;