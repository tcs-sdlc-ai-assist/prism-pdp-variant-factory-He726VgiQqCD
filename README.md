# Prism PDP Variant Factory

A React-based prototype application that generates, displays, and exports cohort-tailored Product Detail Page (PDP) variants from synthetic canonical product data. Built for demonstrating personalized e-commerce experiences across five customer cohorts.

> **All data displayed is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]**

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
  - [Preview](#preview)
- [Testing](#testing)
  - [Unit & Component Tests](#unit--component-tests)
  - [End-to-End Tests](#end-to-end-tests)
- [Folder Structure](#folder-structure)
- [Architecture Overview](#architecture-overview)
- [Cohorts](#cohorts)
- [Synthetic Data Disclaimer](#synthetic-data-disclaimer)
- [Accessibility Statement](#accessibility-statement)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Overview

Prism PDP Variant Factory is a front-end prototype that demonstrates how a single canonical product listing can be tailored into multiple PDP variants based on customer cohort behavior signals. The application:

- Generates **10 deterministic PDP variants** from 2 synthetic canonical products across 5 customer cohorts
- Displays variants in a **responsive gallery grid** with cohort badges, diff highlights, and tailored content
- Provides a **detail view** for each variant showing tailored fields, cohort profile, tailoring rules, and diff-from-control comparison
- Supports **single and bulk JSON export** of variant manifests with schema validation
- Includes a **control PDP reference panel** for side-by-side comparison
- Features **cohort filtering**, **variant regeneration**, and **accessibility settings** (high contrast, font size, reduced motion)
- Meets **WCAG 2.1 AA** accessibility standards with skip links, keyboard navigation, aria-live announcements, and semantic landmarks

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React 18+ |
| **Build Tool** | Vite 6 |
| **Language** | JavaScript (JSX) |
| **Styling** | Tailwind CSS 3 |
| **Routing** | React Router v6 (createBrowserRouter) |
| **Icons** | Lucide React |
| **Prop Validation** | PropTypes |
| **State Management** | React Context + useReducer |
| **Storage** | localStorage with sessionStorage and in-memory fallbacks |
| **Unit Testing** | Vitest + React Testing Library |
| **E2E Testing** | Playwright |
| **Linting** | ESLint |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd prism-pdp-variant-factory

# Install dependencies
npm install

# Copy environment variables (optional — defaults are provided)
cp .env.example .env
```

### Development

```bash
npm run dev
```

Opens the development server at [http://localhost:5173](http://localhost:5173) with hot module replacement.

### Build

```bash
npm run build
```

Produces an optimized production build in the `dist/` directory with source maps.

### Preview

```bash
npm run preview
```

Serves the production build locally for verification before deployment.

---

## Testing

### Unit & Component Tests

Unit and component tests use **Vitest** with **React Testing Library** and **jsdom** environment.

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Test files are co-located with their source files using the `.test.js` or `.test.jsx` suffix:

- `src/components/ErrorBanner.test.jsx` — Component behavior tests
- `src/pages/VariantGallery.test.jsx` — Gallery page tests
- `src/pages/VariantDetail.test.jsx` — Detail page tests
- `src/services/variantFactory.test.js` — Variant generation tests
- `src/services/storageAdapter.test.js` — Storage adapter tests
- `src/services/exportManager.test.js` — Export functionality tests
- `src/utils/diffUtils.test.js` — Diff utility tests
- `src/utils/schemaValidator.test.js` — Schema validation tests

### End-to-End Tests

E2E tests use **Playwright** and run against the development server across Chromium, Firefox, and WebKit.

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e
```

E2E test files are located in the `e2e/` directory:

- `e2e/gallery.spec.js` — Gallery rendering, navigation, filtering, and 404 handling
- `e2e/export.spec.js` — Single and bulk export with JSON structure validation
- `e2e/accessibility.spec.js` — Skip links, keyboard navigation, ARIA attributes, focus management

---

## Folder Structure

```
prism-pdp-variant-factory/
├── e2e/                          # Playwright E2E test specs
│   ├── accessibility.spec.js
│   ├── export.spec.js
│   └── gallery.spec.js
├── public/                       # Static assets
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── CohortBadge.jsx       # Color-coded cohort badge
│   │   ├── DiffHighlight.jsx     # Visual diff highlighting with tooltips
│   │   ├── ErrorBanner.jsx       # Accessible error banner with recovery actions
│   │   ├── ExportButton.jsx      # Single/bulk export button with feedback
│   │   ├── Footer.jsx            # Application footer with disclaimer
│   │   ├── Header.jsx            # Header with navigation and accessibility panel
│   │   ├── LoadingSpinner.jsx    # Accessible loading spinner
│   │   ├── SkipLink.jsx          # Skip navigation link for keyboard users
│   │   └── VariantCard.jsx       # Gallery card for a single variant
│   ├── constants/
│   │   └── constants.js          # App-wide constants and configuration
│   ├── context/
│   │   ├── AccessibilityProvider.jsx  # Accessibility state and helpers
│   │   └── AppContext.jsx        # Global app state with useReducer
│   ├── data/
│   │   ├── canonicalProducts.js  # Synthetic canonical PDP data
│   │   └── cohorts.js            # Synthetic cohort configurations
│   ├── pages/
│   │   ├── NotFound.jsx          # 404 page
│   │   ├── VariantDetail.jsx     # Single variant detail view
│   │   └── VariantGallery.jsx    # Gallery grid of all variants
│   ├── schemas/
│   │   └── schemas.js            # JSON schema definitions and validation
│   ├── services/
│   │   ├── exportManager.js      # JSON export with Blob download
│   │   ├── storageAdapter.js     # localStorage with fallback chain
│   │   └── variantFactory.js     # Deterministic variant generation engine
│   ├── utils/
│   │   ├── accessibilityHelpers.js  # WCAG utilities and screen reader helpers
│   │   ├── diffUtils.js          # Control-vs-variant diff computation
│   │   └── schemaValidator.js    # Schema validation wrapper
│   ├── App.jsx                   # Root component with ErrorBoundary + RouterProvider
│   ├── index.css                 # Tailwind CSS base, components, and utilities
│   ├── main.jsx                  # Application entry point
│   ├── router.jsx                # React Router route definitions with RootLayout
│   └── setupTests.js             # Vitest test setup with mock storage
├── .env.example                  # Environment variable template
├── .eslintrc.cjs                 # ESLint configuration
├── .gitignore
├── index.html                    # HTML entry point
├── package.json
├── playwright.config.js          # Playwright E2E configuration
├── postcss.config.js             # PostCSS with Tailwind plugin
├── tailwind.config.js            # Tailwind CSS configuration with Best Buy brand colors
├── vercel.json                   # Vercel SPA rewrite rules
├── vite.config.js                # Vite build configuration
└── vitest.config.js              # Vitest test configuration
```

---

## Architecture Overview

### Data Flow

```
Canonical Products + Cohort Configs
        │
        ▼
  VariantFactory (deterministic generation)
        │
        ▼
  SchemaValidator (manifest validation)
        │
        ▼
  AppContext (global state via useReducer)
        │
        ├──▶ StorageAdapter (localStorage persistence)
        │
        ├──▶ VariantGallery (gallery grid with filtering)
        │       │
        │       └──▶ VariantCard (individual card with diff highlights)
        │
        ├──▶ VariantDetail (full detail view with diff comparison)
        │
        └──▶ ExportManager (JSON download via Blob URLs)
```

### Key Design Decisions

- **Deterministic Generation**: The VariantFactory produces identical output for the same input, ensuring reproducible variants across sessions.
- **Schema Validation**: All variant manifests are validated against JSON schemas before persistence and export.
- **Storage Fallback Chain**: `localStorage` → `sessionStorage` → in-memory storage ensures the app works even in restricted environments.
- **Diff Highlighting**: Visual diff comparison between a control variant and each tailored variant using color-coded borders and tooltips.
- **Accessibility-First**: WCAG 2.1 AA compliance with aria-live announcements, focus management on route changes, keyboard navigation, and configurable display preferences.

### State Management

The application uses React Context with `useReducer` for global state management:

- **AppContext**: Manages variants, cohorts, canonical products, loading state, errors, and export status.
- **AccessibilityProvider**: Manages high contrast mode, font size preferences, reduced motion detection, and screen reader announcements.

---

## Cohorts

The application generates variants for five synthetic customer cohorts:

| Cohort | Badge | Price Adjustment | CTA Text |
|---|---|---|---|
| **Budget Shopper** | Great Value | None | See Best Price |
| **Tech Enthusiast** | Latest Tech | None | Explore Full Specs |
| **Premium Buyer** | Premium Pick | None | Experience Premium |
| **Student** | Student Favorite | 10% discount | Get Student Deal |
| **Business Buyer** | Business Ready | None | Request Business Quote |

Each cohort applies tailoring rules that modify the title, description, hero image ordering, feature prioritization, badge, and promotion message.

---

## Synthetic Data Disclaimer

**All data in this application is synthetic and illustrative.** This includes:

- Product names, descriptions, prices, SKUs, and images
- Customer cohort names, behavior signals, and tailoring rules
- Variant manifests and exported JSON files

No real customer, product, or behavioral data is used anywhere in this application. All content is generated deterministically from hardcoded synthetic seed data for prototype and demonstration purposes only.

---

## Accessibility Statement

This application is designed to meet **WCAG 2.1 AA** accessibility standards:

- **Skip Navigation**: A skip link allows keyboard users to bypass repetitive navigation and jump to main content.
- **Semantic Landmarks**: Proper use of `<header>`, `<main>`, `<footer>`, `<nav>`, and `<section>` elements with ARIA labels.
- **Keyboard Navigation**: All interactive elements are keyboard accessible with visible focus indicators. Variant cards support Enter and Space key activation.
- **Screen Reader Support**: aria-live regions announce dynamic content changes, route navigation, filter updates, and export status.
- **Focus Management**: Focus is programmatically moved to the main content area on route changes.
- **Configurable Display**: Users can toggle high contrast mode, adjust font size (Normal, Large, X-Large), and the app respects the operating system's reduced motion preference.
- **Color Contrast**: All text and interactive elements meet WCAG 2.1 AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text).
- **Error Handling**: Error banners use `role="alert"` with `aria-live="assertive"` for immediate screen reader announcements.

If you encounter any accessibility issues, please report them.

---

## Deployment

### Vercel

The project includes a `vercel.json` configuration for SPA routing. Deploy directly from the repository:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The `vercel.json` rewrites all routes to `index.html` for client-side routing support.

### Static Hosting

For any static hosting provider:

1. Run `npm run build` to generate the `dist/` directory
2. Upload the contents of `dist/` to your hosting provider
3. Configure URL rewriting to serve `index.html` for all routes (required for client-side routing)

### Docker (Optional)

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Ensure your nginx configuration includes a `try_files $uri /index.html` directive for SPA routing.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_TITLE` | `Prism PDP Variant Factory` | Application title displayed in the browser tab and header |
| `VITE_STORAGE_PREFIX` | `prism-pdp` | Prefix for localStorage keys to avoid collisions |
| `VITE_SEED_ON_LOAD` | `true` | Whether to seed sample product data on initial page load |

Copy `.env.example` to `.env` and adjust values as needed. All environment variables must be prefixed with `VITE_` to be accessible in the client bundle via `import.meta.env`.

---

## License

Private. All rights reserved.