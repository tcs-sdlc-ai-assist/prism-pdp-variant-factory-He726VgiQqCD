/**
 * @module Footer
 * @description Application footer with synthetic data disclaimer, version info,
 * and accessibility statement. Uses semantic <footer> element.
 * [Pipeline-aligned: synthetic data only]
 */

import PropTypes from 'prop-types';
import { APP_VERSION } from '@/constants/constants.js';

/**
 * Disclaimer text displayed in the footer.
 * @type {string}
 */
const DISCLAIMER_TEXT = 'All data is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]';

/**
 * Accessibility statement displayed in the footer.
 * @type {string}
 */
const ACCESSIBILITY_STATEMENT = 'This application is designed to meet WCAG 2.1 AA accessibility standards. If you encounter any accessibility issues, please report them.';

/**
 * Footer component that renders the application footer with a synthetic data
 * disclaimer, version information, and an accessibility statement.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional CSS class names.
 * @returns {JSX.Element}
 */
function Footer({ className }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`w-full border-t border-gray-200 bg-gray-50 ${className || ''}`}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* Synthetic Data Disclaimer */}
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
            <p className="text-xs font-medium text-yellow-800">
              {DISCLAIMER_TEXT}
            </p>
          </div>

          {/* Accessibility Statement */}
          <p className="text-xs text-gray-500">
            {ACCESSIBILITY_STATEMENT}
          </p>

          {/* Version and Copyright */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 pt-4 sm:flex-row">
            <p className="text-xs text-gray-400">
              &copy; {currentYear} Prism PDP Variant Factory. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">
              Version {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  className: PropTypes.string,
};

Footer.defaultProps = {
  className: '',
};

export { Footer, DISCLAIMER_TEXT, ACCESSIBILITY_STATEMENT };
export default Footer;