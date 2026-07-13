# Changelog

All notable changes to the Prism PDP Variant Factory project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **All data referenced in this application is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]**

---

## [1.0.0] — 2024-12-01

### Added

#### Variant Generation Engine
- Deterministic `VariantFactory` that generates exactly 10 PDP variants from 2 synthetic canonical products across 5 customer cohorts.
- Cohort-specific tailoring for title, description, hero image ordering, feature prioritization, badge, promotion message, and CTA text.
- Student cohort receives a 10% price discount; all other cohorts preserve the canonical price.
- `generateVariants`, `generateVariantsForProduct`, and `generateSingleVariant` functions for flexible variant generation.
- `getVisualDiff` utility for computing field-level differences between control and target variants.
- `sortFeaturesByKeywords` for cohort-aware feature list reordering.

#### Gallery View (`VariantGallery`)
- Responsive grid layout displaying all 10 variant cards across 1–4 columns (mobile to desktop).
- Cohort filter dropdown with "All Cohorts" default and per-cohort filtering.
- Clear filter button with accessible label and keyboard support.
- Variant count status text with `role="status"` and `aria-live="polite"` for screen reader announcements.
- Control PDP reference panel toggle with `aria-expanded` state management.
- Regenerate all variants button for on-demand variant regeneration.
- Bulk export button for exporting all variant manifests as a single JSON file.
- Empty state messaging for no variants and no filter matches.
- Loading spinner during variant generation with accessible `aria-busy` attribute.
- Error banner with dismiss and reset data recovery actions.

#### Detail View (`VariantDetail`)
- Full PDP preview with hero image, image gallery thumbnails, and badge overlay.
- Tailored Fields section with diff-highlighted title, price, description, SKU, category, badge, promotion message, and features list.
- Cohort Profile section displaying cohort name, ID, and behavior signals.
- Tailoring Rules section with applied/not-applied status badges and rule descriptions.
- Diff Summary section showing changed field count and field names compared to the control variant.
- Per-variant export button with success/error feedback.
- Back to Gallery navigation button.
- Variant not found state with return to gallery action.
- Synthetic data disclaimer on every detail page.

#### Export Functionality (`ExportManager`)
- Single variant manifest export as formatted JSON with 2-space indentation.
- Bulk export of all variant manifests as a combined JSON payload with `exportedAt` timestamp, `totalVariants`, `skippedVariants`, and `variants` array.
- Schema validation before export — invalid manifests are skipped with error logging.
- Blob URL creation and automatic browser download trigger via temporary anchor element.
- Blob URL revocation for memory cleanup.
- Export button with loading, success, and error state feedback.
- Filenames include variant ID and ISO timestamp for single exports; `all-variants-` prefix for bulk exports.

#### Schema Validation (`SchemaValidator` and `ManifestSchema`)
- JSON schema definitions for canonical PDP, cohort configuration, tailoring rule, variant data, and variant manifest.
- `validateAgainstSchema` function with recursive validation for nested objects and arrays.
- Type checking for string, number, boolean, array, and object types.
- Minimum length validation for strings and minimum value validation for numbers.
- Required field validation with descriptive error messages including field paths.
- `ManifestSchema` object with `validate`, `validateCanonicalPdp`, `validateCohort`, `validateVariantData`, and `validateTailoringRule` methods.
- `SchemaValidator` class for reusable schema validation instances.
- `validateArray` function for batch validation with invalid index tracking.

#### Storage Abstraction (`StorageAdapter`)
- `localStorage` as primary storage with automatic fallback chain: `localStorage` → `sessionStorage` → in-memory storage.
- All keys automatically prefixed with configurable `VITE_STORAGE_PREFIX` (default: `prism-pdp`).
- JSON serialization and deserialization with corrupted data recovery (removes invalid entries).
- Quota exceeded handling with graceful fallback to next storage tier.
- Async API (`get`, `set`, `remove`, `clear`, `keys`) for consistency.
- `createMemoryStorage` factory for in-memory fallback implementation.
- `prefixKey` utility to prevent key collisions with other applications.

#### Synthetic Data
- `syntheticTV` — Prism UltraView 65" 4K QLED Smart TV canonical product with 8 features, 4 images, and full specs.
- `syntheticLaptop` — Prism ProBook 16X 16" Performance Laptop canonical product with 8 features, 4 images, and full specs.
- 5 customer cohorts: Budget Shopper, Tech Enthusiast, Premium Buyer, Student, and Business Buyer.
- Each cohort includes ID, name, description, 5 behavior signals, and 5 tailoring rules.

#### Diff Utilities (`diffUtils`)
- `computeDiff` function comparing control and variant `variantData` fields with `changed`, `controlValue`, and `variantValue` output.
- `getChangedFields` returning an array of changed field names.
- `getChangedFieldCount` returning the number of changed fields.
- `hasFieldChanged` for checking individual field changes.
- `deepEqual` using JSON serialization for deep comparison with NaN handling.

#### Visual Diff Highlighting (`DiffHighlight`)
- Color-coded border and background for changed, added, removed, and unchanged fields.
- Tooltip showing control value on hover and focus for changed fields.
- Keyboard accessible with Escape to dismiss tooltip.
- Click-outside detection for tooltip dismissal.
- Configurable `showLabel`, `showTooltip`, and `inline` rendering modes.
- `formatValue` and `truncateText` utilities for tooltip content.

#### UI Components
- `CohortBadge` — Color-coded badge with distinct accessible colors per cohort and `aria-label`.
- `DiffHighlight` — Visual diff highlighting with tooltip and keyboard support.
- `ErrorBanner` — Accessible error banner with `role="alert"`, `aria-live="assertive"`, dismiss button, and recovery action.
- `ExportButton` — Export trigger with loading, success, and error states and screen reader announcements.
- `Footer` — Application footer with synthetic data disclaimer, accessibility statement, and version info.
- `Header` — Sticky header with Prism branding, desktop/mobile navigation, and accessibility settings panel.
- `LoadingSpinner` — Accessible spinner with `aria-busy`, reduced motion support, and configurable size.
- `SkipLink` — WCAG 2.1 AA skip navigation link visible on focus.
- `VariantCard` — Gallery card with hero image, cohort badge, diff count indicator, tailored title, price, promotion message, and CTA button.

#### Accessibility Features (WCAG 2.1 AA)
- Skip navigation link (`SkipLink`) for keyboard users to bypass repetitive navigation.
- Semantic landmarks: `<header>` (banner), `<main>`, `<footer>` (contentinfo), `<nav>` with `aria-label`.
- Focus management on route changes via `manageFocusOnRouteChange` with `tabindex="-1"` on main content.
- `aria-live` announcer region for dynamic content changes, filter updates, and export status.
- Keyboard navigation for variant cards (Enter and Space activation), filter dropdown, and all buttons.
- `aria-expanded` on toggle buttons (control PDP panel, accessibility settings, mobile menu).
- `aria-labelledby` on detail view sections (Product Preview, Tailored Fields, Cohort Profile, Tailoring Rules, Diff Summary).
- `aria-label` on all interactive elements including export buttons, filter, clear filter, regenerate, and back navigation.
- High contrast mode toggle persisted to `localStorage`.
- Font size preferences (Normal, Large, X-Large) with `aria-pressed` on size buttons.
- Reduced motion detection via `prefers-reduced-motion` media query with visual indicator.
- Accessibility settings panel as `role="dialog"` with Escape key dismissal and focus trapping.
- Color contrast ratio utilities (`getContrastRatio`, `meetsContrastRequirement`) for WCAG AA verification.
- `generateVariantAriaLabel` for descriptive variant card labels.

#### State Management
- `AppContext` with `useReducer` for global state: variants, cohorts, canonical products, loading, error, and export status.
- `AccessibilityProvider` for high contrast mode, font size, reduced motion, and screen reader announcements.
- Automatic state initialization from `localStorage` on app load with seed-on-load support via `VITE_SEED_ON_LOAD`.
- `regenerateVariants` action for on-demand variant regeneration with error handling.

#### Routing
- React Router v6 with `createBrowserRouter` and `RouterProvider`.
- Routes: `/` (VariantGallery), `/variant/:variantId` (VariantDetail), `*` (NotFound).
- `RootLayout` component wrapping all routes with `AccessibilityProvider`, `AppProvider`, `SkipLink`, `Header`, and `Footer`.
- Vercel SPA rewrite configuration in `vercel.json`.

#### Testing — Unit & Component Tests (Vitest + React Testing Library)
- `ErrorBanner.test.jsx` — 30 tests covering rendering, accessibility, dismiss, recovery action, keyboard, focus management, and edge cases.
- `VariantGallery.test.jsx` — 35 tests covering card rendering, cohort labels, filtering, bulk export, loading/error/empty states, control panel, regeneration, responsive grid, and accessibility.
- `VariantDetail.test.jsx` — 45 tests covering variant details, cohort profile, tailoring rules, export button, diff highlights, back navigation, loading/error/missing states, accessibility, and integration.
- `variantFactory.test.js` — 55 tests covering ID generation, title/description/image/price/feature tailoring, badge/promotion generation, rules extraction, single/bulk variant generation, determinism, input validation, visual diff, and end-to-end generation.
- `storageAdapter.test.js` — 40 tests covering key prefixing, memory storage, constructor fallbacks, get/set/remove/clear operations, corrupted JSON recovery, quota exceeded handling, round-trip operations, and edge cases.
- `exportManager.test.js` — 45 tests covering filename generation, download triggering, blob URL revocation, single/bulk export, schema validation integration, JSON formatting, error handling, and static method API.
- `diffUtils.test.js` — 55 tests covering deep equality, diff computation, changed fields, field count, field-level checks, integration with variant manifests, and edge cases.
- `schemaValidator.test.js` — 60 tests covering class and functional API, manifest/PDP/cohort/variant data/rule validation, array validation, ManifestSchema methods, error message accuracy, nested validation, and edge cases.

#### Testing — End-to-End Tests (Playwright)
- `gallery.spec.js` — Gallery rendering, cohort labels, filtering, control PDP panel, navigation to detail view and back, 404 handling, and keyboard navigation.
- `export.spec.js` — Single variant export with JSON structure validation, bulk export with all-variants payload validation, cohort coverage, unique IDs, student discount verification, success feedback, and JSON formatting.
- `accessibility.spec.js` — Skip link, keyboard navigation, focus management on route changes, ARIA labels on gallery and detail views, semantic landmarks, accessibility settings panel, keyboard navigation in detail view, 404 page accessibility, and gallery filter accessibility.

#### Configuration
- Vite 6 build configuration with React plugin and `@` path alias.
- Tailwind CSS 3 with Best Buy brand colors (`bby-blue`, `bby-yellow`), custom spacing, and responsive breakpoints.
- ESLint configuration with recommended rules, JSX support, and test file overrides.
- Vitest configuration with jsdom environment, global test setup, and V8 coverage.
- Playwright configuration for Chromium, Firefox, and WebKit with dev server auto-start.
- PostCSS with Tailwind and Autoprefixer plugins.
- Environment variables: `VITE_APP_TITLE`, `VITE_STORAGE_PREFIX`, `VITE_SEED_ON_LOAD`.

---

[1.0.0]: https://github.com/prism-pdp-variant-factory/releases/tag/v1.0.0