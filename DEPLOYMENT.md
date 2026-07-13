# Deployment Guide

> **All data referenced in this application is synthetic and illustrative. No real customer, product, or behavioral data is used. [Pipeline-aligned]**

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build Configuration](#build-configuration)
- [Vercel Deployment](#vercel-deployment)
  - [One-Click Deploy](#one-click-deploy)
  - [Vercel CLI](#vercel-cli)
  - [GitHub Integration](#github-integration)
  - [SPA Routing](#spa-routing)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
  - [Build and Test Workflow](#build-and-test-workflow)
  - [Deploy to Vercel Workflow](#deploy-to-vercel-workflow)
- [Alternative Hosting](#alternative-hosting)
  - [Netlify](#netlify)
  - [AWS S3 + CloudFront](#aws-s3--cloudfront)
  - [Nginx](#nginx)
  - [Docker](#docker)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

Prism PDP Variant Factory is a **static single-page application (SPA)** built with React 18+ and Vite 6. It requires **no backend server** — all data is synthetic and generated client-side. Deployment consists of:

1. Building the production bundle with `npm run build`
2. Serving the static `dist/` directory from any static hosting provider
3. Configuring URL rewrites so all routes resolve to `index.html` (required for client-side routing)

---

## Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | >= 18.x |
| **npm** | >= 9.x |
| **Git** | >= 2.x |

Ensure your CI/CD environment and hosting platform meet these requirements.

---

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the client bundle via `import.meta.env`.

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_TITLE` | `Prism PDP Variant Factory` | Application title displayed in the browser tab and header |
| `VITE_STORAGE_PREFIX` | `prism-pdp` | Prefix for localStorage keys to avoid collisions with other apps |
| `VITE_SEED_ON_LOAD` | `true` | Whether to seed sample product data on initial page load (`true`/`false`) |

### Setting Environment Variables

**Local development:**

```bash
cp .env.example .env
# Edit .env with your values
```

**Vercel:**

Set environment variables in the Vercel dashboard under **Project Settings → Environment Variables**, or via the CLI:

```bash
vercel env add VITE_APP_TITLE
vercel env add VITE_STORAGE_PREFIX
vercel env add VITE_SEED_ON_LOAD
```

**GitHub Actions:**

Add variables as repository secrets or environment variables under **Settings → Secrets and variables → Actions**.

> **Note:** Because these variables are embedded into the client bundle at build time, they are publicly visible in the browser. Do not store sensitive data in `VITE_*` variables.

---

## Build Configuration

### Vite Configuration

The project uses Vite 6 with the following configuration (`vite.config.js`):

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Build Command

```bash
npm run build
```

This produces an optimized production build in the `dist/` directory with:

- Minified JavaScript bundles with code splitting
- Hashed filenames for cache busting
- Source maps for debugging
- Static assets copied from `public/`

### Preview Locally

```bash
npm run preview
```

Serves the production build at `http://localhost:4173` for local verification before deployment.

---

## Vercel Deployment

Vercel is the recommended hosting platform for this project. The repository includes a `vercel.json` configuration file for SPA routing.

### SPA Routing

The `vercel.json` file configures URL rewrites so all routes resolve to `index.html`, which is required for React Router client-side routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures that navigating directly to `/variant/variant-canonical-tv-001-cohort-budget-shopper-0` or any other route serves the React application instead of returning a 404.

### One-Click Deploy

1. Push your repository to GitHub, GitLab, or Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects the Vite framework and configures:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Add environment variables if needed (defaults are provided)
6. Click **Deploy**

### Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod
```

### GitHub Integration

1. Connect your GitHub repository to Vercel via the Vercel dashboard
2. Vercel automatically deploys:
   - **Preview deployments** on every push to non-production branches
   - **Production deployments** on every push to the `main` branch
3. Pull request comments include a preview URL for each deployment

### Vercel Project Settings

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x or 20.x |

---

## CI/CD with GitHub Actions

### Build and Test Workflow

Create `.github/workflows/ci.yml` to run tests on every push and pull request:

```yaml
name: CI — Build & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx eslint src/ --ext .js,.jsx

      - name: Run unit tests
        run: npm test

      - name: Build production bundle
        run: npm run build
        env:
          VITE_APP_TITLE: Prism PDP Variant Factory
          VITE_STORAGE_PREFIX: prism-pdp
          VITE_SEED_ON_LOAD: true

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ matrix.node-version }}
          path: dist/
          retention-days: 7

  e2e-tests:
    runs-on: ubuntu-latest
    needs: build-and-test

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests (Chromium only)
        run: npx playwright test --project=chromium
        env:
          VITE_APP_TITLE: Prism PDP Variant Factory
          VITE_STORAGE_PREFIX: prism-pdp
          VITE_SEED_ON_LOAD: true

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### Deploy to Vercel Workflow

If you prefer deploying via GitHub Actions instead of Vercel's GitHub integration, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Build production bundle
        run: npm run build
        env:
          VITE_APP_TITLE: ${{ vars.VITE_APP_TITLE || 'Prism PDP Variant Factory' }}
          VITE_STORAGE_PREFIX: ${{ vars.VITE_STORAGE_PREFIX || 'prism-pdp' }}
          VITE_SEED_ON_LOAD: ${{ vars.VITE_SEED_ON_LOAD || 'true' }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
```

**Required GitHub Secrets for Vercel deployment:**

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Personal access token from [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Found in `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | Found in `.vercel/project.json` after running `vercel link` |

To obtain `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`:

```bash
vercel link
cat .vercel/project.json
```

---

## Alternative Hosting

### Netlify

1. Create a `netlify.toml` in the project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Deploy via the Netlify dashboard or CLI:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### AWS S3 + CloudFront

1. Build the project:

```bash
npm run build
```

2. Create an S3 bucket with static website hosting enabled

3. Upload the `dist/` contents to the S3 bucket:

```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

4. Configure CloudFront distribution:
   - Set the S3 bucket as the origin
   - Create a custom error response: HTTP 403/404 → `/index.html` with 200 status code
   - This handles SPA routing for client-side routes

5. Invalidate the CloudFront cache after each deployment:

```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Nginx

For self-hosted Nginx deployments, use the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/prism-pdp-variant-factory/dist;
    index index.html;

    # SPA routing — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively (hashed filenames handle cache busting)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
}
```

### Docker

Build and serve the application using a multi-stage Docker build:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t prism-pdp-variant-factory .
docker run -p 8080:80 prism-pdp-variant-factory
```

The application will be available at `http://localhost:8080`.

---

## Post-Deployment Verification

After deploying, verify the following:

### 1. Application Loads

- [ ] Navigate to the root URL — the Variant Gallery page loads with 10 variant cards
- [ ] The page title displays "Prism PDP Variant Factory" (or your custom `VITE_APP_TITLE`)

### 2. Client-Side Routing Works

- [ ] Click a variant card — navigates to `/variant/:variantId` detail view
- [ ] Click "Back to Gallery" — returns to `/`
- [ ] Navigate directly to a variant URL (e.g., paste `/variant/variant-canonical-tv-001-cohort-budget-shopper-0` in the address bar) — the detail view loads correctly instead of a 404
- [ ] Navigate to a non-existent route (e.g., `/nonexistent`) — the 404 page displays with "Go to Gallery" button

### 3. Core Features

- [ ] Cohort filter dropdown filters variant cards
- [ ] "Show Control PDP" button opens the reference panel
- [ ] "Regenerate" button regenerates all variants
- [ ] "Export All" button triggers a JSON file download
- [ ] Single variant "Export Manifest" button triggers a JSON file download
- [ ] Exported JSON files contain valid, formatted JSON with correct structure

### 4. Accessibility

- [ ] Tab through the page — focus indicators are visible on all interactive elements
- [ ] Skip link appears on first Tab press and navigates to main content
- [ ] Accessibility settings panel opens and high contrast / font size controls work
- [ ] Screen reader announces page changes and filter updates (test with VoiceOver, NVDA, or similar)

### 5. Performance

- [ ] Initial page load completes within 3 seconds on a standard connection
- [ ] Lighthouse performance score is above 90
- [ ] No console errors in the browser developer tools

---

## Troubleshooting

### Blank Page After Deployment

**Cause:** The `base` path in Vite config does not match the deployment URL.

**Fix:** If deploying to a subdirectory (e.g., `https://example.com/app/`), add the base path to `vite.config.js`:

```js
export default defineConfig({
  base: '/app/',
  // ... rest of config
});
```

For root-level deployments (e.g., `https://example.com/`), no `base` configuration is needed (the default `/` is correct).

### 404 on Direct Route Access

**Cause:** The hosting provider is not configured to rewrite all routes to `index.html`.

**Fix:** Ensure your hosting platform has SPA routing configured:

- **Vercel:** The included `vercel.json` handles this automatically
- **Netlify:** Add a `_redirects` file in `public/` with: `/* /index.html 200`
- **Nginx:** Use `try_files $uri $uri/ /index.html;`
- **S3 + CloudFront:** Configure custom error responses for 403/404 to return `/index.html` with 200 status

### Environment Variables Not Applied

**Cause:** Environment variables are embedded at build time, not runtime.

**Fix:**

1. Ensure variables are prefixed with `VITE_`
2. Rebuild the application after changing environment variables
3. Verify variables are set in the build environment (Vercel dashboard, GitHub Actions secrets, or `.env` file)
4. Check the built output: `grep -r "VITE_APP_TITLE" dist/` should show the value

### Build Fails in CI

**Cause:** Node.js version mismatch or missing dependencies.

**Fix:**

1. Ensure CI uses Node.js >= 18.x
2. Use `npm ci` instead of `npm install` for deterministic installs
3. Clear the CI cache if dependency resolution fails
4. Check that `package-lock.json` is committed to the repository

### localStorage Quota Exceeded

**Cause:** The browser's localStorage quota is full.

**Fix:** The application handles this automatically with its storage fallback chain (`localStorage` → `sessionStorage` → in-memory storage). If users report data loss:

1. Clear the application's localStorage keys (prefixed with `prism-pdp`)
2. The application will re-seed data on the next page load if `VITE_SEED_ON_LOAD` is `true`

---

## Synthetic Data Disclaimer

**All data in this application is synthetic and illustrative.** This includes all product names, descriptions, prices, SKUs, images, customer cohort names, behavior signals, tailoring rules, variant manifests, and exported JSON files. No real customer, product, or behavioral data is used anywhere in this application. All content is generated deterministically from hardcoded synthetic seed data for prototype and demonstration purposes only. [Pipeline-aligned]