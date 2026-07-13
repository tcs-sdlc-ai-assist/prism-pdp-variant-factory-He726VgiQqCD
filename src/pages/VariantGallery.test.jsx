/**
 * @module VariantGallery.test
 * @description Component tests for VariantGallery: renders 10 variant cards,
 * displays cohort labels, bulk export button works, loading state shown,
 * error state shown, responsive grid renders correctly, accessibility attributes present.
 * [Pipeline-aligned: synthetic data only]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppContext, ACTION_TYPES, initialState } from '@/context/AppContext.jsx';
import { AccessibilityProvider } from '@/context/AccessibilityProvider.jsx';
import { VariantGallery, extractUniqueCohorts, findControlVariant, PAGE_TITLE, ALL_COHORTS_LABEL } from '@/pages/VariantGallery.jsx';
import { generateVariants } from '@/services/variantFactory.js';
import { canonicalProducts } from '@/data/canonicalProducts.js';
import { cohorts } from '@/data/cohorts.js';
import { VARIANT_COUNT } from '@/constants/constants.js';

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
 * Helper: renders VariantGallery with required providers.
 * @param {object} contextValue - The mock context value.
 * @returns {object} The render result.
 */
function renderGallery(contextValue) {
  return render(
    <MemoryRouter>
      <AccessibilityProvider>
        <AppContext.Provider value={contextValue}>
          <VariantGallery />
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

describe('VariantGallery', () => {
  let testVariants;

  beforeEach(async () => {
    testVariants = await generateTestVariants();
  });

  describe('rendering variant cards', () => {
    it('renders the page title', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PAGE_TITLE);
    });

    it('renders 10 variant cards when all variants are present', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const list = screen.getByRole('list', { name: /pdp variant cards/i });
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(VARIANT_COUNT);
    });

    it('renders variant cards with article role buttons', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const buttons = screen.getAllByRole('button', { name: /cohort/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('displays the variant count status text', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const status = screen.getByText(/showing \d+ of \d+ variant/i);
      expect(status).toBeInTheDocument();
    });
  });

  describe('cohort labels', () => {
    it('displays cohort badges on variant cards', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      expect(screen.getAllByText('Budget Shopper').length).toBeGreaterThan(0);
    });

    it('displays multiple cohort names across cards', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      expect(screen.getAllByText('Tech Enthusiast').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Premium Buyer').length).toBeGreaterThan(0);
    });
  });

  describe('cohort filter', () => {
    it('renders the cohort filter dropdown', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      expect(filter).toBeInTheDocument();
    });

    it('has an "All Cohorts" option as default', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      expect(filter).toHaveValue('');

      const allOption = within(filter).getByText(ALL_COHORTS_LABEL);
      expect(allOption).toBeInTheDocument();
    });

    it('filters variants when a cohort is selected', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      await user.selectOptions(filter, 'cohort-budget-shopper');

      const status = screen.getByText(/showing \d+ of \d+ variant/i);
      expect(status).toHaveTextContent(/filtered by/i);
    });

    it('shows clear filter button when a cohort is selected', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      await user.selectOptions(filter, 'cohort-budget-shopper');

      const clearButton = screen.getByLabelText(/clear cohort filter/i);
      expect(clearButton).toBeInTheDocument();
    });

    it('clears filter when clear button is clicked', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      await user.selectOptions(filter, 'cohort-budget-shopper');

      const clearButton = screen.getByLabelText(/clear cohort filter/i);
      await user.click(clearButton);

      expect(filter).toHaveValue('');
    });
  });

  describe('bulk export button', () => {
    it('renders the bulk export button when variants exist', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const exportButton = screen.getByRole('button', { name: /export all/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('does not render the bulk export button when no variants exist', () => {
      const ctx = createMockContextValue({ variants: [], canonicalProducts });
      renderGallery(ctx);

      const exportButton = screen.queryByRole('button', { name: /export all/i });
      expect(exportButton).not.toBeInTheDocument();
    });

    it('bulk export button has correct aria-label', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const exportButton = screen.getByRole('button', { name: /export all \d+ variant manifests as json/i });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading is true', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderGallery(ctx);

      const spinner = screen.getByRole('status', { name: /generating pdp variants/i });
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading message text', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderGallery(ctx);

      expect(screen.getByText(/generating variants/i)).toBeInTheDocument();
    });

    it('does not show variant grid when loading', () => {
      const ctx = createMockContextValue({ loading: true, variants: testVariants });
      renderGallery(ctx);

      const list = screen.queryByRole('list', { name: /pdp variant cards/i });
      expect(list).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error banner when error is present', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Something went wrong during generation.',
      });
      renderGallery(ctx);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/something went wrong during generation/i)).toBeInTheDocument();
    });

    it('shows error type label', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error message.',
      });
      renderGallery(ctx);

      expect(screen.getByText(/generation error/i)).toBeInTheDocument();
    });

    it('shows dismiss button on error banner', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error message.',
      });
      renderGallery(ctx);

      const dismissButton = screen.getByLabelText(/dismiss error/i);
      expect(dismissButton).toBeInTheDocument();
    });

    it('calls clearError when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      const clearError = vi.fn();
      const ctx = createMockContextValue(
        { variants: [], error: 'Test error message.' },
        { clearError },
      );
      renderGallery(ctx);

      const dismissButton = screen.getByLabelText(/dismiss error/i);
      await user.click(dismissButton);

      expect(clearError).toHaveBeenCalled();
    });

    it('shows reset data action button on error banner', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error message.',
      });
      renderGallery(ctx);

      const resetButton = screen.getByRole('button', { name: /reset data/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('calls regenerateVariants when reset data is clicked', async () => {
      const user = userEvent.setup();
      const clearError = vi.fn();
      const regenerateVariants = vi.fn().mockResolvedValue(undefined);
      const ctx = createMockContextValue(
        { variants: [], error: 'Test error message.' },
        { clearError, regenerateVariants },
      );
      renderGallery(ctx);

      const resetButton = screen.getByRole('button', { name: /reset data/i });
      await user.click(resetButton);

      expect(clearError).toHaveBeenCalled();
      expect(regenerateVariants).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no variants exist', () => {
      const ctx = createMockContextValue({ variants: [], canonicalProducts });
      renderGallery(ctx);

      expect(screen.getByText(/no variants generated yet/i)).toBeInTheDocument();
    });

    it('shows generate button in empty state', () => {
      const ctx = createMockContextValue({ variants: [], canonicalProducts });
      renderGallery(ctx);

      const generateButton = screen.getByRole('button', { name: /generate variants/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('calls regenerateVariants when generate button is clicked', async () => {
      const user = userEvent.setup();
      const regenerateVariants = vi.fn().mockResolvedValue(undefined);
      const ctx = createMockContextValue(
        { variants: [], canonicalProducts },
        { regenerateVariants },
      );
      renderGallery(ctx);

      const generateButton = screen.getByRole('button', { name: /generate variants/i });
      await user.click(generateButton);

      expect(regenerateVariants).toHaveBeenCalled();
    });

    it('shows filter empty state when filter yields no results', async () => {
      const user = userEvent.setup();
      const singleCohortVariants = testVariants.filter((v) => v.cohort.id === 'cohort-budget-shopper');
      const ctx = createMockContextValue({ variants: singleCohortVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      await user.selectOptions(filter, 'cohort-tech-enthusiast');

      expect(screen.getByText(/no variants match this filter/i)).toBeInTheDocument();
    });
  });

  describe('control PDP reference panel', () => {
    it('renders the show control PDP button', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const toggleButton = screen.getByRole('button', { name: /show control pdp reference/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('shows control PDP panel when toggle is clicked', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const toggleButton = screen.getByRole('button', { name: /show control pdp reference/i });
      await user.click(toggleButton);

      const panel = screen.getByRole('region', { name: /control pdp reference/i });
      expect(panel).toBeInTheDocument();
    });

    it('hides control PDP panel when toggle is clicked again', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const toggleButton = screen.getByRole('button', { name: /show control pdp reference/i });
      await user.click(toggleButton);

      const hideButton = screen.getByRole('button', { name: /hide control pdp reference/i });
      await user.click(hideButton);

      const panel = screen.queryByRole('region', { name: /control pdp reference/i });
      expect(panel).not.toBeInTheDocument();
    });

    it('displays canonical product title in control panel', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const toggleButton = screen.getByRole('button', { name: /show control pdp reference/i });
      await user.click(toggleButton);

      expect(screen.getByText(canonicalProducts[0].title)).toBeInTheDocument();
    });
  });

  describe('regenerate button', () => {
    it('renders the regenerate button', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const regenButton = screen.getByRole('button', { name: /regenerate all variants/i });
      expect(regenButton).toBeInTheDocument();
    });

    it('calls regenerateVariants when regenerate button is clicked', async () => {
      const user = userEvent.setup();
      const regenerateVariants = vi.fn().mockResolvedValue(undefined);
      const ctx = createMockContextValue(
        { variants: testVariants, canonicalProducts },
        { regenerateVariants },
      );
      renderGallery(ctx);

      const regenButton = screen.getByRole('button', { name: /regenerate all variants/i });
      await user.click(regenButton);

      expect(regenerateVariants).toHaveBeenCalled();
    });
  });

  describe('responsive grid', () => {
    it('renders the variant grid container with grid classes', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const list = screen.getByRole('list', { name: /pdp variant cards/i });
      expect(list.className).toContain('grid');
      expect(list.className).toContain('grid-cols-1');
    });

    it('renders each variant in a listitem wrapper', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const list = screen.getByRole('list', { name: /pdp variant cards/i });
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(testVariants.length);
    });
  });

  describe('accessibility', () => {
    it('has a main landmark with correct aria-label', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const main = screen.getByRole('main', { name: /variant gallery/i });
      expect(main).toBeInTheDocument();
    });

    it('main landmark has id="main-content"', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });

    it('variant count has role="status" and aria-live="polite"', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const status = screen.getByText(/showing \d+ of \d+ variant/i);
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('cohort filter has accessible label', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const filter = screen.getByLabelText(/filter variants by cohort/i);
      expect(filter).toBeInTheDocument();
      expect(filter.tagName.toLowerCase()).toBe('select');
    });

    it('control panel toggle has aria-expanded attribute', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const toggleButton = screen.getByRole('button', { name: /show control pdp reference/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('control panel toggle updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const toggleButton = screen.getByRole('button', { name: /show control pdp reference/i });
      await user.click(toggleButton);

      const hideButton = screen.getByRole('button', { name: /hide control pdp reference/i });
      expect(hideButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('empty state has role="status" with aria-label', () => {
      const ctx = createMockContextValue({ variants: [], canonicalProducts });
      renderGallery(ctx);

      const emptyState = screen.getByRole('status', { name: /no variants available/i });
      expect(emptyState).toBeInTheDocument();
    });

    it('loading spinner has aria-busy attribute', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderGallery(ctx);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('error banner has role="alert" and aria-live="assertive"', () => {
      const ctx = createMockContextValue({
        variants: [],
        error: 'Test error.',
      });
      renderGallery(ctx);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('extractUniqueCohorts', () => {
    it('extracts unique cohorts from variants', () => {
      const result = extractUniqueCohorts(testVariants);
      expect(result.length).toBeGreaterThan(0);

      const ids = result.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('returns empty array for empty variants', () => {
      const result = extractUniqueCohorts([]);
      expect(result).toEqual([]);
    });

    it('returns empty array for null input', () => {
      const result = extractUniqueCohorts(null);
      expect(result).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      const result = extractUniqueCohorts(undefined);
      expect(result).toEqual([]);
    });

    it('skips variants without cohort data', () => {
      const variantsWithMissing = [
        { variantId: 'v1', cohort: { id: 'c1', name: 'Cohort 1' } },
        { variantId: 'v2' },
        { variantId: 'v3', cohort: null },
        { variantId: 'v4', cohort: { id: 'c2', name: 'Cohort 2' } },
      ];
      const result = extractUniqueCohorts(variantsWithMissing);
      expect(result.length).toBe(2);
    });

    it('deduplicates cohorts with the same id', () => {
      const variantsWithDupes = [
        { variantId: 'v1', cohort: { id: 'c1', name: 'Cohort 1' } },
        { variantId: 'v2', cohort: { id: 'c1', name: 'Cohort 1' } },
        { variantId: 'v3', cohort: { id: 'c2', name: 'Cohort 2' } },
      ];
      const result = extractUniqueCohorts(variantsWithDupes);
      expect(result.length).toBe(2);
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

  describe('synthetic data disclaimer', () => {
    it('does not render disclaimer when loading', () => {
      const ctx = createMockContextValue({ loading: true, variants: [] });
      renderGallery(ctx);

      const disclaimer = screen.queryByText(/all data displayed is synthetic/i);
      expect(disclaimer).not.toBeInTheDocument();
    });
  });

  describe('integration with variant data', () => {
    it('renders variant cards with tailored titles', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const greatValueCards = screen.getAllByText(/great value deal/i);
      expect(greatValueCards.length).toBeGreaterThan(0);
    });

    it('renders variant cards with badges', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const badges = screen.getAllByText('Great Value');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders diff count indicators on variant cards', () => {
      const ctx = createMockContextValue({ variants: testVariants, canonicalProducts });
      renderGallery(ctx);

      const diffIndicators = screen.getAllByText(/\d+ diffs?/i);
      expect(diffIndicators.length).toBeGreaterThan(0);
    });
  });
});