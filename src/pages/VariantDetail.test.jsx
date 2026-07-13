/**
 * @module VariantDetail.test
 * @description Component tests for VariantDetail: renders variant details,
 * shows cohort profile and tailoring rules, export button triggers download,
 * diff highlights displayed, handles missing variant gracefully,
 * accessibility attributes present.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppContext, initialState } from '@/context/AppContext.jsx';
import { AccessibilityProvider } from '@/context/AccessibilityProvider.jsx';
import { VariantDetail, findVariantById, findControlVariant, PAGE_TITLE_PREFIX } from '@/pages/VariantDetail.jsx';
import { generateVariants } from '@/services/variantFactory.js';
import { canonicalProducts } from '@/data/canonicalProducts.js';
import { cohorts } from '@/data/cohorts.js';

/**
 * Helper: creates a mock AppContext value with optional overrides.
 * @param {object} [stateOverrides] - Optional state overrides.
 * @param {object} [actionOverrides] - Optional action overrides.
 * @returns {object} A mock context value.
 */
function createMockContextValue(stateOverrides = {}, actionOverrides = {}) {
  return {
    state: {
      ...initialState,
      ...stateOverrides,
    },
    dispatch: vi.fn(),
    setVariants: vi.fn(),
    setCohorts: vi.fn(),
    setCanonicalProducts: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    setExportStatus: vi.fn(),
    regenerateVariants: vi.fn().mockResolvedValue(undefined),
    ...actionOverrides,
  };
}

/**
 * Helper: renders VariantDetail with required providers at a specific route.
 * @param {object} contextValue - The mock context value.
 * @param {string} variantId - The variant ID to navigate to.
 * @returns {object} The render result.
 */
function renderDetail(contextValue, variantId) {
  return render(
    <MemoryRouter initialEntries={[`/variant/${variantId}`]}>
      <AccessibilityProvider>
        <AppContext.Provider value={contextValue}>
          <Routes>
            <Route path="/variant/:variantId" element={<VariantDetail />} />
            <Route path="/" element={<div>Gallery Page</div>} />
          </Routes>
        </AppContext.Provider>
      </AccessibilityProvider>
    </MemoryRouter>,
  );
}

/**
 * Generates a set of test variants using the real VariantFactory.
 * @returns {Promise<object[]>}
 */
async function generateTestVariants() {
  return generateVariants(canonicalProducts, cohorts);
}

describe('VariantDetail', () => {
  let testVariants;

  beforeEach(async () => {
    testVariants = await generateTestVariants();
  });

  describe('rendering variant details', () => {
    it('renders the variant title as a heading', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(variant.variantData.title);
    });

    it('renders the variant ID text', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(`ID: ${variant.variantId}`)).toBeInTheDocument();
    });

    it('renders the canonical PDP ID text', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(`Canonical: ${variant.canonicalPdpId}`)).toBeInTheDocument();
    });

    it('renders the schema version', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(`Schema v${variant.schemaVersion}`)).toBeInTheDocument();
    });

    it('renders the hero image', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heroImage = screen.getByAlt(variant.variantData.title);
      expect(heroImage).toBeInTheDocument();
      expect(heroImage.tagName.toLowerCase()).toBe('img');
    });

    it('renders the product preview section', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const section = screen.getByRole('heading', { name: /product preview/i });
      expect(section).toBeInTheDocument();
    });

    it('renders the tailored fields section', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const section = screen.getByRole('heading', { name: /tailored fields/i });
      expect(section).toBeInTheDocument();
    });

    it('renders the variant price', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const formattedPrice = `$${variant.variantData.price.toFixed(2)}`;
      expect(screen.getByText(formattedPrice)).toBeInTheDocument();
    });

    it('renders the variant description', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(/Experience stunning picture quality/i)).toBeInTheDocument();
    });

    it('renders the variant SKU', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(variant.variantData.sku)).toBeInTheDocument();
    });

    it('renders the variant category', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(variant.variantData.category)).toBeInTheDocument();
    });

    it('renders the variant badge', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.variantData.badge) {
        const badges = screen.getAllByText(variant.variantData.badge);
        expect(badges.length).toBeGreaterThan(0);
      }
    });

    it('renders the variant features list', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const firstFeature = variant.variantData.features[0];
      expect(screen.getByText(firstFeature)).toBeInTheDocument();
    });

    it('renders image gallery thumbnails when multiple images exist', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.variantData.images.length > 1) {
        const thumbnails = screen.getAllByAlt(/product image \d+/i);
        expect(thumbnails.length).toBe(variant.variantData.images.length);
      }
    });
  });

  describe('cohort profile', () => {
    it('renders the cohort profile section', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const section = screen.getByRole('heading', { name: /cohort profile/i });
      expect(section).toBeInTheDocument();
    });

    it('displays the cohort badge', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const cohortBadges = screen.getAllByText(variant.cohort.name);
      expect(cohortBadges.length).toBeGreaterThan(0);
    });

    it('displays the cohort ID', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(variant.cohort.id)).toBeInTheDocument();
    });

    it('displays behavior signals', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.cohort.behaviorSignals.length > 0) {
        const firstSignal = variant.cohort.behaviorSignals[0];
        expect(screen.getByText(firstSignal)).toBeInTheDocument();
      }
    });

    it('renders all behavior signals for the cohort', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      variant.cohort.behaviorSignals.forEach((signal) => {
        expect(screen.getByText(signal)).toBeInTheDocument();
      });
    });
  });

  describe('tailoring rules', () => {
    it('renders the tailoring rules section', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const section = screen.getByRole('heading', { name: /tailoring rules/i });
      expect(section).toBeInTheDocument();
    });

    it('displays tailoring rule IDs', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.tailoringRules.length > 0) {
        const firstRule = variant.tailoringRules[0];
        expect(screen.getByText(firstRule.ruleId)).toBeInTheDocument();
      }
    });

    it('displays tailoring rule descriptions', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.tailoringRules.length > 0) {
        const firstRule = variant.tailoringRules[0];
        expect(screen.getByText(firstRule.description)).toBeInTheDocument();
      }
    });

    it('displays applied status for each rule', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const appliedBadges = screen.getAllByText('Applied');
      expect(appliedBadges.length).toBeGreaterThan(0);
    });

    it('renders all tailoring rules for the variant', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      variant.tailoringRules.forEach((rule) => {
        expect(screen.getByText(rule.ruleId)).toBeInTheDocument();
        expect(screen.getByText(rule.description)).toBeInTheDocument();
      });
    });
  });

  describe('export button', () => {
    it('renders the export manifest button', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const exportButton = screen.getByRole('button', { name: /export manifest/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('export button has correct aria-label with variant ID', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const exportButton = screen.getByRole('button', { name: new RegExp(`export manifest for variant ${variant.variantId}`, 'i') });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('diff highlights', () => {
    it('renders the diff summary section', () => {
      const variant = testVariants[1];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const section = screen.getByRole('heading', { name: /diff summary/i });
      expect(section).toBeInTheDocument();
    });

    it('shows diff count when variant differs from control', () => {
      const variant = testVariants[1];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const diffText = screen.getByText(/\d+ diffs? from control/i);
      expect(diffText).toBeInTheDocument();
    });

    it('shows changed field names in diff summary', () => {
      const variant = testVariants[1];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const changedFieldsList = screen.getByRole('list', { name: /changed fields list/i });
      expect(changedFieldsList).toBeInTheDocument();

      const items = within(changedFieldsList).getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(0);
    });

    it('shows "This is the control variant" for the first variant', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(/this is the control variant/i)).toBeInTheDocument();
    });

    it('displays diff count indicator in the page header for non-control variants', () => {
      const variant = testVariants[1];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const diffIndicator = screen.getByText(/\d+ diffs? from control/i);
      expect(diffIndicator).toBeInTheDocument();
    });
  });

  describe('back navigation', () => {
    it('renders the back to gallery button', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const backButton = screen.getByRole('button', { name: /back to gallery/i });
      expect(backButton).toBeInTheDocument();
    });

    it('navigates back to gallery when back button is clicked', async () => {
      const user = userEvent.setup();
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const backButton = screen.getByRole('button', { name: /back to gallery/i });
      await user.click(backButton);

      expect(screen.getByText('Gallery Page')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading is true', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderDetail(ctx, 'variant-test-001');

      const spinner = screen.getByRole('status', { name: /loading variant details/i });
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading message text', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderDetail(ctx, 'variant-test-001');

      expect(screen.getByText(/loading variant details/i)).toBeInTheDocument();
    });

    it('does not show variant content when loading', () => {
      const ctx = createMockContextValue({ loading: true, variants: testVariants });
      renderDetail(ctx, testVariants[0].variantId);

      const productPreview = screen.queryByText(/product preview/i);
      expect(productPreview).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error banner when error is present', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Failed to load variant data.',
      });
      renderDetail(ctx, 'variant-test-001');

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/failed to load variant data/i)).toBeInTheDocument();
    });

    it('shows error type label', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error message.',
      });
      renderDetail(ctx, 'variant-test-001');

      expect(screen.getByText(/loading error/i)).toBeInTheDocument();
    });

    it('shows back button on error state', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error message.',
      });
      renderDetail(ctx, 'variant-test-001');

      const backButton = screen.getByRole('button', { name: /back to gallery/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('missing variant', () => {
    it('shows variant not found message for non-existent variant ID', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, 'variant-does-not-exist');

      expect(screen.getByText(/variant not found/i)).toBeInTheDocument();
    });

    it('displays the missing variant ID in the not found message', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, 'variant-does-not-exist');

      expect(screen.getByText(/variant-does-not-exist/i)).toBeInTheDocument();
    });

    it('shows return to gallery button on not found state', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, 'variant-does-not-exist');

      const returnButton = screen.getByRole('button', { name: /return to gallery/i });
      expect(returnButton).toBeInTheDocument();
    });

    it('navigates back to gallery when return button is clicked on not found', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, 'variant-does-not-exist');

      const returnButton = screen.getByRole('button', { name: /return to gallery/i });
      await user.click(returnButton);

      expect(screen.getByText('Gallery Page')).toBeInTheDocument();
    });

    it('shows back to gallery button on not found state', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, 'variant-does-not-exist');

      const backButton = screen.getByRole('button', { name: /back to gallery/i });
      expect(backButton).toBeInTheDocument();
    });

    it('shows not found status role', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, 'variant-does-not-exist');

      const status = screen.getByRole('status', { name: /variant not found/i });
      expect(status).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has a main landmark with correct aria-label', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label');
    });

    it('main landmark has id="main-content"', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('main landmark has role="main"', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('role', 'main');
    });

    it('has accessible section headings for product preview', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heading = screen.getByText('Product Preview');
      expect(heading).toBeInTheDocument();
    });

    it('has accessible section headings for tailored fields', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heading = screen.getByText('Tailored Fields');
      expect(heading).toBeInTheDocument();
    });

    it('has accessible section headings for cohort profile', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heading = screen.getByText('Cohort Profile');
      expect(heading).toBeInTheDocument();
    });

    it('has accessible section headings for tailoring rules', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heading = screen.getByText('Tailoring Rules');
      expect(heading).toBeInTheDocument();
    });

    it('has accessible section headings for diff summary', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heading = screen.getByText('Diff Summary');
      expect(heading).toBeInTheDocument();
    });

    it('back button has aria-label', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const backButton = screen.getByRole('button', { name: /back to gallery/i });
      expect(backButton).toHaveAttribute('aria-label', 'Back to gallery');
    });

    it('behavior signals list has aria-label', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.cohort.behaviorSignals.length > 0) {
        const signalsList = screen.getByRole('list', { name: /behavior signals for this cohort/i });
        expect(signalsList).toBeInTheDocument();
      }
    });

    it('tailoring rules list has aria-label', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.tailoringRules.length > 0) {
        const rulesList = screen.getByRole('list', { name: /applied tailoring rules/i });
        expect(rulesList).toBeInTheDocument();
      }
    });

    it('loading spinner has aria-busy attribute', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderDetail(ctx, 'variant-test-001');

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('error banner has role="alert" and aria-live="assertive"', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error.',
      });
      renderDetail(ctx, 'variant-test-001');

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('hero image has alt text matching the variant title', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const heroImage = screen.getByAlt(variant.variantData.title);
      expect(heroImage).toBeInTheDocument();
    });

    it('sections use aria-labelledby for section headings', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      const productPreviewHeading = screen.getByText('Product Preview');
      expect(productPreviewHeading).toHaveAttribute('id', 'section-product-preview');

      const section = productPreviewHeading.closest('section');
      expect(section).toHaveAttribute('aria-labelledby', 'section-product-preview');
    });

    it('rule applied status has aria-label', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.tailoringRules.length > 0) {
        const appliedLabels = screen.getAllByLabelText(/rule applied/i);
        expect(appliedLabels.length).toBeGreaterThan(0);
      }
    });
  });

  describe('synthetic data disclaimer', () => {
    it('renders the synthetic data disclaimer', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText(/all data displayed is synthetic/i)).toBeInTheDocument();
    });
  });

  describe('promotion message', () => {
    it('renders the promotion message when present', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      if (variant.variantData.promotionMessage) {
        expect(screen.getByText(variant.variantData.promotionMessage)).toBeInTheDocument();
      }
    });
  });

  describe('findVariantById', () => {
    it('finds a variant by its variantId', () => {
      const variant = testVariants[2];
      const result = findVariantById(testVariants, variant.variantId);
      expect(result).toBe(variant);
    });

    it('returns null for a non-existent variantId', () => {
      const result = findVariantById(testVariants, 'non-existent-id');
      expect(result).toBeNull();
    });

    it('returns null for null variants array', () => {
      const result = findVariantById(null, 'variant-test-001');
      expect(result).toBeNull();
    });

    it('returns null for undefined variants array', () => {
      const result = findVariantById(undefined, 'variant-test-001');
      expect(result).toBeNull();
    });

    it('returns null for empty variants array', () => {
      const result = findVariantById([], 'variant-test-001');
      expect(result).toBeNull();
    });

    it('returns null for null variantId', () => {
      const result = findVariantById(testVariants, null);
      expect(result).toBeNull();
    });

    it('returns null for undefined variantId', () => {
      const result = findVariantById(testVariants, undefined);
      expect(result).toBeNull();
    });
  });

  describe('findControlVariant', () => {
    it('returns the first variant as control', () => {
      const result = findControlVariant(testVariants);
      expect(result).toBe(testVariants[0]);
    });

    it('returns null for empty array', () => {
      const result = findControlVariant([]);
      expect(result).toBeNull();
    });

    it('returns null for null input', () => {
      const result = findControlVariant(null);
      expect(result).toBeNull();
    });

    it('returns null for undefined input', () => {
      const result = findControlVariant(undefined);
      expect(result).toBeNull();
    });
  });

  describe('different cohort variants', () => {
    it('renders budget shopper variant correctly', () => {
      const budgetVariant = testVariants.find((v) => v.cohort.id === 'cohort-budget-shopper');
      if (budgetVariant) {
        const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
        renderDetail(ctx, budgetVariant.variantId);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/great value deal/i);
        const badges = screen.getAllByText('Budget Shopper');
        expect(badges.length).toBeGreaterThan(0);
      }
    });

    it('renders tech enthusiast variant correctly', () => {
      const techVariant = testVariants.find((v) => v.cohort.id === 'cohort-tech-enthusiast');
      if (techVariant) {
        const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
        renderDetail(ctx, techVariant.variantId);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/performance edition/i);
        const badges = screen.getAllByText('Tech Enthusiast');
        expect(badges.length).toBeGreaterThan(0);
      }
    });

    it('renders student variant with discounted price', () => {
      const studentVariant = testVariants.find((v) => v.cohort.id === 'cohort-student');
      if (studentVariant) {
        const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
        renderDetail(ctx, studentVariant.variantId);

        const formattedPrice = `$${studentVariant.variantData.price.toFixed(2)}`;
        expect(screen.getByText(formattedPrice)).toBeInTheDocument();
      }
    });
  });

  describe('integration with variant data', () => {
    it('renders all sections for a complete variant', () => {
      const variant = testVariants[0];
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx, variant.variantId);

      expect(screen.getByText('Product Preview')).toBeInTheDocument();
      expect(screen.getByText('Tailored Fields')).toBeInTheDocument();
      expect(screen.getByText('Cohort Profile')).toBeInTheDocument();
      expect(screen.getByText('Tailoring Rules')).toBeInTheDocument();
      expect(screen.getByText('Diff Summary')).toBeInTheDocument();
    });

    it('renders different variants when navigating to different IDs', () => {
      const variant1 = testVariants[0];
      const variant2 = testVariants[1];

      const ctx1 = createMockContextValue({ variants: testVariants, canonicalProducts });
      const { unmount } = renderDetail(ctx1, variant1.variantId);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(variant1.variantData.title);

      unmount();

      const ctx2 = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderDetail(ctx2, variant2.variantId);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(variant2.variantData.title);
    });
  });
});