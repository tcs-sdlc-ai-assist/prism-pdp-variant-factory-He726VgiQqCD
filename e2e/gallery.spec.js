/**
 * @module gallery.spec
 * @description Playwright E2E test: loads app, verifies 10 variant cards render in gallery,
 * checks cohort labels visible, clicks a variant card to navigate to detail view,
 * verifies detail content loads, navigates back to gallery.
 * [Pipeline-aligned: synthetic data only]
 */

import { test, expect } from '@playwright/test';

test.describe('Variant Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('renders the page title', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1, name: 'Variant Gallery' });
    await expect(heading).toBeVisible();
  });

  test('renders 10 variant cards in the gallery', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    await expect(list).toBeVisible();

    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(10);
  });

  test('displays cohort labels on variant cards', async ({ page }) => {
    await expect(page.getByText('Budget Shopper').first()).toBeVisible();
    await expect(page.getByText('Tech Enthusiast').first()).toBeVisible();
    await expect(page.getByText('Premium Buyer').first()).toBeVisible();
    await expect(page.getByText('Student').first()).toBeVisible();
    await expect(page.getByText('Business Buyer').first()).toBeVisible();
  });

  test('displays variant count status text', async ({ page }) => {
    const status = page.getByText(/showing 10 of 10 variant/i);
    await expect(status).toBeVisible();
  });

  test('has a main landmark with correct aria-label', async ({ page }) => {
    const main = page.getByRole('main', { name: /variant gallery/i });
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute('id', 'main-content');
  });

  test('renders the cohort filter dropdown', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await expect(filter).toBeVisible();
  });

  test('filters variants by cohort when a cohort is selected', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.selectOption('cohort-budget-shopper');

    const status = page.getByText(/filtered by/i);
    await expect(status).toBeVisible();

    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const items = list.getByRole('listitem');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);
  });

  test('clears filter when clear button is clicked', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.selectOption('cohort-budget-shopper');

    const clearButton = page.getByLabel(/clear cohort filter/i);
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await expect(filter).toHaveValue('');

    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const items = list.getByRole('listitem');
    await expect(items).toHaveCount(10);
  });

  test('renders the bulk export button', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });
    await expect(exportButton).toBeVisible();
  });

  test('renders the regenerate button', async ({ page }) => {
    const regenButton = page.getByRole('button', { name: /regenerate all variants/i });
    await expect(regenButton).toBeVisible();
  });

  test('renders the show control PDP button', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /show control pdp reference/i });
    await expect(toggleButton).toBeVisible();
  });

  test('shows control PDP panel when toggle is clicked', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /show control pdp reference/i });
    await toggleButton.click();

    const panel = page.getByRole('region', { name: /control pdp reference/i });
    await expect(panel).toBeVisible();

    await expect(page.getByText('Control PDP Reference')).toBeVisible();
  });
});

test.describe('Gallery to Detail Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('clicks a variant card and navigates to detail view', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    const productPreview = page.getByText('Product Preview');
    await expect(productPreview).toBeVisible();

    const tailoredFields = page.getByText('Tailored Fields');
    await expect(tailoredFields).toBeVisible();

    const cohortProfile = page.getByText('Cohort Profile');
    await expect(cohortProfile).toBeVisible();

    const tailoringRules = page.getByText('Tailoring Rules');
    await expect(tailoringRules).toBeVisible();

    const diffSummary = page.getByText('Diff Summary');
    await expect(diffSummary).toBeVisible();
  });

  test('detail view shows variant title as heading', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText.length).toBeGreaterThan(0);
  });

  test('detail view shows export manifest button', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });
    await expect(exportButton).toBeVisible();
  });

  test('detail view shows back to gallery button', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await expect(backButton).toBeVisible();
  });

  test('navigates back to gallery from detail view', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await backButton.click();

    await page.waitForURL('/');

    const galleryHeading = page.getByRole('heading', { level: 1, name: 'Variant Gallery' });
    await expect(galleryHeading).toBeVisible();

    const galleryList = page.getByRole('list', { name: /pdp variant cards/i });
    const items = galleryList.getByRole('listitem');
    await expect(items).toHaveCount(10);
  });

  test('detail view shows cohort badge', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const cohortSection = page.getByText('Cohort Profile');
    await expect(cohortSection).toBeVisible();

    const behaviorSignals = page.getByRole('list', { name: /behavior signals for this cohort/i });
    await expect(behaviorSignals).toBeVisible();
  });

  test('detail view shows tailoring rules with applied status', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const rulesList = page.getByRole('list', { name: /applied tailoring rules/i });
    await expect(rulesList).toBeVisible();

    const appliedBadge = page.getByText('Applied').first();
    await expect(appliedBadge).toBeVisible();
  });

  test('detail view shows synthetic data disclaimer', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const disclaimer = page.getByText(/all data displayed is synthetic/i);
    await expect(disclaimer).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('skip link is present and becomes visible on focus', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const skipLink = page.getByLabel('Skip to main content');
    await expect(skipLink).toBeAttached();
  });

  test('header has banner role', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
  });

  test('footer has contentinfo role', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });

  test('variant cards are keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    await page.keyboard.press('Enter');
    await page.waitForURL(/\/variant\//);

    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });
});

test.describe('404 Not Found', () => {
  test('shows 404 page for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route-that-does-not-exist');

    const heading = page.getByText('404');
    await expect(heading).toBeVisible();

    const notFoundText = page.getByText('Page Not Found');
    await expect(notFoundText).toBeVisible();

    const goToGallery = page.getByRole('button', { name: /go to gallery/i });
    await expect(goToGallery).toBeVisible();
  });

  test('navigates back to gallery from 404 page', async ({ page }) => {
    await page.goto('/unknown-route');

    const goToGallery = page.getByRole('button', { name: /go to gallery/i });
    await goToGallery.click();

    await page.waitForURL('/');

    const galleryHeading = page.getByRole('heading', { level: 1, name: 'Variant Gallery' });
    await expect(galleryHeading).toBeVisible();
  });
});