/**
 * @module App
 * @description Root application component. Wraps RouterProvider with the
 * application router configuration. Handles top-level error boundary.
 * Imports global CSS.
 * [Pipeline-aligned: synthetic data only]
 */

import { Component } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from '@/router.jsx';

/**
 * Error boundary component that catches rendering errors in the component tree.
 * Displays a fallback UI with error details and a recovery action.
 */
class ErrorBoundary extends Component {
  /**
   * Creates a new ErrorBoundary instance.
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  /**
   * Derives error state from a caught error.
   * @param {Error} error - The caught error.
   * @returns {object} Updated state.
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Logs error information when a component error is caught.
   * @param {Error} error - The caught error.
   * @param {object} errorInfo - React error info with component stack.
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Resets the error state to allow recovery.
   */
  handleReset() {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    try {
      window.location.href = '/';
    } catch (_e) {
      // Fallback if navigation fails
    }
  }

  /**
   * Renders the error fallback UI or children.
   * @returns {JSX.Element}
   */
  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error && this.state.error.message
        ? this.state.error.message
        : 'An unexpected error occurred.';

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg border border-red-300 bg-white p-8 shadow-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <span className="text-xl text-red-600" aria-hidden="true">!</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">
                Something went wrong
              </h1>
            </div>

            <p className="mb-4 text-sm text-gray-700">
              {errorMessage}
            </p>

            <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="text-xs font-medium text-yellow-800">
                All data is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex w-full items-center justify-center rounded-md bg-bby-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-bby-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bby-blue-500 transition-colors"
              aria-label="Reload the application"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Root application component that provides the router and error boundary.
 * The router configuration in router.jsx already wraps routes with
 * AccessibilityProvider and AppProvider via the RootLayout component.
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export { App, ErrorBoundary };
export default App;