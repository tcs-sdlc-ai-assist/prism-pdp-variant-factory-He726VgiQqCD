/**
 * @module router
 * @description React Router v6 route definitions for the application.
 * Defines routes: / -> VariantGallery, /variant/:id -> VariantDetail, * -> NotFound.
 * Uses createBrowserRouter with a layout wrapper that includes Header, Footer,
 * SkipLink, and AccessibilityProvider.
 * [Pipeline-aligned: synthetic data only]
 */

import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AccessibilityProvider } from '@/context/AccessibilityProvider.jsx';
import { AppProvider } from '@/context/AppContext.jsx';
import SkipLink from '@/components/SkipLink.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import VariantGallery from '@/pages/VariantGallery.jsx';
import VariantDetail from '@/pages/VariantDetail.jsx';
import NotFound from '@/pages/NotFound.jsx';

/**
 * Root layout component that wraps all routes with shared providers,
 * navigation elements, and semantic landmarks.
 *
 * @returns {JSX.Element}
 */
function RootLayout() {
  return (
    <AccessibilityProvider>
      <AppProvider>
        <div className="flex min-h-screen flex-col">
          <SkipLink targetId="main-content" label="Skip to main content" />
          <Header />
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </div>
      </AppProvider>
    </AccessibilityProvider>
  );
}

/**
 * Application router configuration using createBrowserRouter.
 * Defines all application routes with the shared RootLayout wrapper.
 *
 * Routes:
 *   /              -> VariantGallery (gallery grid of all PDP variants)
 *   /variant/:id   -> VariantDetail (single variant detail view)
 *   *              -> NotFound (404 page)
 *
 * @type {import('react-router-dom').Router}
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <VariantGallery />,
      },
      {
        path: 'variant/:variantId',
        element: <VariantDetail />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export { router, RootLayout };
export default router;