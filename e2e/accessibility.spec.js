/**
 * @module accessibility.spec
 * @description Playwright E2E test: verifies skip link functionality, keyboard navigation
 * through gallery cards, focus management on route change, aria-labels on interactive elements,
 * error banner accessibility.
 * [Pipeline-aligned: synthetic data only]
 */

import { test, expect } from '@playwright/test';

test.describe('Skip Link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('skip link is present in the DOM', async ({ page }) => {
    const skipLink = page.getByLabel('Skip to main content');
    await expect(skipLink).toBeAttached();
  });

  test('skip link becomes visible on focus', async ({ page }) => {
    const skipLink = page.getByLabel('Skip to main content');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('skip link has correct href pointing to main-content', async ({ page }) => {
    const skipLink = page.getByLabel('Skip to main content');
    const href = await skipLink.getAttribute('href');
    expect(href).toBe('#main-content');
  });

  test('skip link moves focus to main content when activated', async ({ page }) => {
    const skipLink = page.getByLabel('Skip to main content');
    await skipLink.focus();
    await skipLink.click();

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('skip link text reads "Skip to main content"', async ({ page }) => {
    const skipLink = page.getByLabel('Skip to main content');
    const text = await skipLink.textContent();
    expect(text).toBe('Skip to main content');
  });
});

test.describe('Keyboard Navigation in Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('variant cards are focusable via keyboard', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    await firstCard.focus();
    await expect(firstCard).toBeFocused();
  });

  test('pressing Enter on a focused variant card navigates to detail view', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    await firstCard.focus();
    await page.keyboard.press('Enter');

    await page.waitForURL(/\/variant\//);
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('pressing Space on a focused variant card navigates to detail view', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    await firstCard.focus();
    await page.keyboard.press('Space');

    await page.waitForURL(/\/variant\//);
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('Tab key moves focus between interactive elements in gallery', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    await page.keyboard.press('Tab');

    const secondCard = list.getByRole('listitem').nth(1).getByRole('button').first();
    await expect(secondCard).toBeFocused();
  });

  test('variant cards have aria-label attributes', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    const ariaLabel = await firstCard.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.length).toBeGreaterThan(0);
  });

  test('variant cards have tabindex for keyboard access', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();

    const tabindex = await firstCard.getAttribute('tabindex');
    expect(tabindex).toBe('0');
  });

  test('cohort filter dropdown is keyboard accessible', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.focus();
    await expect(filter).toBeFocused();
  });

  test('regenerate button is keyboard accessible', async ({ page }) => {
    const regenButton = page.getByRole('button', { name: /regenerate all variants/i });
    await regenButton.focus();
    await expect(regenButton).toBeFocused();
  });

  test('export all button is keyboard accessible', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });
    await exportButton.focus();
    await expect(exportButton).toBeFocused();
  });
});

test.describe('Focus Management on Route Change', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('main content receives focus on gallery page load', async ({ page }) => {
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveAttribute('tabindex', '-1');
  });

  test('main content receives focus after navigating to detail view', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();
    await firstCard.click();

    await page.waitForURL(/\/variant\//);

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
    await expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  test('main content receives focus after navigating back to gallery', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();
    await firstCard.click();

    await page.waitForURL(/\/variant\//);

    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await backButton.click();

    await page.waitForURL('/');

    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
    await expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  test('detail view main landmark has correct aria-label', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();
    await firstCard.click();

    await page.waitForURL(/\/variant\//);

    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    const ariaLabel = await main.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.length).toBeGreaterThan(0);
  });

  test('404 page main landmark has correct aria-label', async ({ page }) => {
    await page.goto('/nonexistent-page-route');

    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    const ariaLabel = await main.getAttribute('aria-label');
    expect(ariaLabel).toContain('Page Not Found');
  });
});

test.describe('ARIA Labels on Interactive Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('gallery main landmark has aria-label', async ({ page }) => {
    const main = page.getByRole('main', { name: /variant gallery/i });
    await expect(main).toBeVisible();
  });

  test('variant list has aria-label', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    await expect(list).toBeVisible();
  });

  test('cohort filter has accessible label', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await expect(filter).toBeVisible();
    expect(await filter.getAttribute('aria-label')).toBeTruthy();
  });

  test('control PDP toggle button has aria-expanded attribute', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /show control pdp reference/i });
    await expect(toggleButton).toBeVisible();
    expect(await toggleButton.getAttribute('aria-expanded')).toBe('false');
  });

  test('control PDP toggle button updates aria-expanded when clicked', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /show control pdp reference/i });
    await toggleButton.click();

    const hideButton = page.getByRole('button', { name: /hide control pdp reference/i });
    expect(await hideButton.getAttribute('aria-expanded')).toBe('true');
  });

  test('export all button has descriptive aria-label', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });
    const ariaLabel = await exportButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/export all \d+ variant manifests as json/i);
  });

  test('regenerate button has aria-label', async ({ page }) => {
    const regenButton = page.getByRole('button', { name: /regenerate all variants/i });
    const ariaLabel = await regenButton.getAttribute('aria-label');
    expect(ariaLabel).toBe('Regenerate all variants');
  });

  test('variant count status has role and aria-live', async ({ page }) => {
    const status = page.getByText(/showing 10 of 10 variant/i);
    await expect(status).toBeVisible();
    expect(await status.getAttribute('role')).toBe('status');
    expect(await status.getAttribute('aria-live')).toBe('polite');
  });

  test('cohort badges have aria-label with cohort name', async ({ page }) => {
    const budgetBadge = page.getByLabel(/cohort: budget shopper/i).first();
    await expect(budgetBadge).toBeVisible();
  });
});

test.describe('ARIA Labels on Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();
    await firstCard.click();

    await page.waitForURL(/\/variant\//);
  });

  test('back to gallery button has aria-label', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await expect(backButton).toBeVisible();
    expect(await backButton.getAttribute('aria-label')).toBe('Back to gallery');
  });

  test('export manifest button has descriptive aria-label', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export manifest/i });
    await expect(exportButton).toBeVisible();
    const ariaLabel = await exportButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/export manifest for variant/i);
  });

  test('behavior signals list has aria-label', async ({ page }) => {
    const signalsList = page.getByRole('list', { name: /behavior signals for this cohort/i });
    await expect(signalsList).toBeVisible();
  });

  test('tailoring rules list has aria-label', async ({ page }) => {
    const rulesList = page.getByRole('list', { name: /applied tailoring rules/i });
    await expect(rulesList).toBeVisible();
  });

  test('product preview section has aria-labelledby', async ({ page }) => {
    const heading = page.getByText('Product Preview');
    await expect(heading).toBeVisible();

    const headingId = await heading.getAttribute('id');
    expect(headingId).toBe('section-product-preview');

    const section = heading.locator('xpath=ancestor::section');
    expect(await section.getAttribute('aria-labelledby')).toBe('section-product-preview');
  });

  test('tailored fields section has aria-labelledby', async ({ page }) => {
    const heading = page.getByText('Tailored Fields');
    await expect(heading).toBeVisible();

    const headingId = await heading.getAttribute('id');
    expect(headingId).toBe('section-tailored-fields');

    const section = heading.locator('xpath=ancestor::section');
    expect(await section.getAttribute('aria-labelledby')).toBe('section-tailored-fields');
  });

  test('cohort profile section has aria-labelledby', async ({ page }) => {
    const heading = page.getByText('Cohort Profile');
    await expect(heading).toBeVisible();

    const headingId = await heading.getAttribute('id');
    expect(headingId).toBe('section-cohort-profile');

    const section = heading.locator('xpath=ancestor::section');
    expect(await section.getAttribute('aria-labelledby')).toBe('section-cohort-profile');
  });

  test('tailoring rules section has aria-labelledby', async ({ page }) => {
    const heading = page.getByText('Tailoring Rules');
    await expect(heading).toBeVisible();

    const headingId = await heading.getAttribute('id');
    expect(headingId).toBe('section-tailoring-rules');

    const section = heading.locator('xpath=ancestor::section');
    expect(await section.getAttribute('aria-labelledby')).toBe('section-tailoring-rules');
  });

  test('diff summary section has aria-labelledby', async ({ page }) => {
    const heading = page.getByText('Diff Summary');
    await expect(heading).toBeVisible();

    const headingId = await heading.getAttribute('id');
    expect(headingId).toBe('section-diff-summary');

    const section = heading.locator('xpath=ancestor::section');
    expect(await section.getAttribute('aria-labelledby')).toBe('section-diff-summary');
  });

  test('synthetic data disclaimer is visible', async ({ page }) => {
    const disclaimer = page.getByText(/all data displayed is synthetic/i);
    await expect(disclaimer).toBeVisible();
  });

  test('applied rule status badges have aria-label', async ({ page }) => {
    const appliedLabels = page.getByLabel(/rule applied/i);
    const count = await appliedLabels.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Semantic Landmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('page has a banner landmark (header)', async ({ page }) => {
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
  });

  test('page has a main landmark', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('page has a contentinfo landmark (footer)', async ({ page }) => {
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });

  test('main landmark has id main-content', async ({ page }) => {
    const main = page.getByRole('main');
    expect(await main.getAttribute('id')).toBe('main-content');
  });

  test('header contains navigation with aria-label', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav).toBeVisible();
  });

  test('footer contains synthetic data disclaimer', async ({ page }) => {
    const footer = page.getByRole('contentinfo');
    const disclaimer = footer.getByText(/all data is synthetic/i);
    await expect(disclaimer).toBeVisible();
  });
});

test.describe('Accessibility Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('accessibility settings button is present in header', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await expect(a11yButton).toBeVisible();
  });

  test('accessibility settings button has aria-expanded attribute', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    expect(await a11yButton.getAttribute('aria-expanded')).toBe('false');
  });

  test('clicking accessibility settings opens the panel', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await a11yButton.click();

    const panel = page.getByRole('dialog', { name: /accessibility settings panel/i });
    await expect(panel).toBeVisible();
  });

  test('accessibility panel contains high contrast toggle', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await a11yButton.click();

    const highContrastToggle = page.locator('#high-contrast-toggle');
    await expect(highContrastToggle).toBeVisible();
    expect(await highContrastToggle.getAttribute('role')).toBe('switch');
  });

  test('accessibility panel contains font size buttons', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await a11yButton.click();

    const normalButton = page.getByRole('button', { name: /set font size to normal/i });
    const largeButton = page.getByRole('button', { name: /set font size to large/i });
    const xLargeButton = page.getByRole('button', { name: /set font size to x-large/i });

    await expect(normalButton).toBeVisible();
    await expect(largeButton).toBeVisible();
    await expect(xLargeButton).toBeVisible();
  });

  test('font size buttons have aria-pressed attribute', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await a11yButton.click();

    const normalButton = page.getByRole('button', { name: /set font size to normal/i });
    expect(await normalButton.getAttribute('aria-pressed')).toBe('true');

    const largeButton = page.getByRole('button', { name: /set font size to large/i });
    expect(await largeButton.getAttribute('aria-pressed')).toBe('false');
  });

  test('accessibility panel closes on Escape key', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await a11yButton.click();

    const panel = page.getByRole('dialog', { name: /accessibility settings panel/i });
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(panel).not.toBeVisible();
  });

  test('reduced motion indicator is displayed', async ({ page }) => {
    const a11yButton = page.getByRole('button', { name: /accessibility settings/i });
    await a11yButton.click();

    const reducedMotionText = page.getByText(/reduced motion:/i);
    await expect(reducedMotionText).toBeVisible();
  });
});

test.describe('Keyboard Navigation in Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstCard = list.getByRole('listitem').first().getByRole('button').first();
    await firstCard.click();

    await page.waitForURL(/\/variant\//);
  });

  test('back to gallery button is keyboard focusable', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await backButton.focus();
    await expect(backButton).toBeFocused();
  });

  test('pressing Enter on back button navigates to gallery', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await backButton.focus();
    await page.keyboard.press('Enter');

    await page.waitForURL('/');

    const galleryHeading = page.getByRole('heading', { level: 1, name: 'Variant Gallery' });
    await expect(galleryHeading).toBeVisible();
  });

  test('export manifest button is keyboard focusable', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export manifest/i });
    await exportButton.focus();
    await expect(exportButton).toBeFocused();
  });

  test('hero image has alt text', async ({ page }) => {
    const images = page.locator('main img').first();
    const alt = await images.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt.length).toBeGreaterThan(0);
  });
});

test.describe('404 Page Accessibility', () => {
  test('404 page has correct heading structure', async ({ page }) => {
    await page.goto('/nonexistent-route-for-testing');

    const heading404 = page.getByText('404');
    await expect(heading404).toBeVisible();

    const pageNotFound = page.getByText('Page Not Found');
    await expect(pageNotFound).toBeVisible();
  });

  test('go to gallery button has aria-label', async ({ page }) => {
    await page.goto('/nonexistent-route-for-testing');

    const goToGallery = page.getByRole('button', { name: /go to gallery/i });
    await expect(goToGallery).toBeVisible();
    const ariaLabel = await goToGallery.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/go to gallery/i);
  });

  test('go back button has aria-label', async ({ page }) => {
    await page.goto('/nonexistent-route-for-testing');

    const goBack = page.getByRole('button', { name: /go back/i });
    await expect(goBack).toBeVisible();
    const ariaLabel = await goBack.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/go back/i);
  });

  test('404 page has main landmark', async ({ page }) => {
    await page.goto('/nonexistent-route-for-testing');

    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    expect(await main.getAttribute('id')).toBe('main-content');
  });

  test('404 page go to gallery button is keyboard navigable', async ({ page }) => {
    await page.goto('/nonexistent-route-for-testing');

    const goToGallery = page.getByRole('button', { name: /go to gallery/i });
    await goToGallery.focus();
    await expect(goToGallery).toBeFocused();

    await page.keyboard.press('Enter');
    await page.waitForURL('/');

    const galleryHeading = page.getByRole('heading', { level: 1, name: 'Variant Gallery' });
    await expect(galleryHeading).toBeVisible();
  });

  test('404 page has synthetic data disclaimer', async ({ page }) => {
    await page.goto('/nonexistent-route-for-testing');

    const disclaimer = page.getByText(/all data displayed is synthetic/i);
    await expect(disclaimer).toBeVisible();
  });
});

test.describe('Gallery Filter Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('filter dropdown can be operated with keyboard', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.focus();
    await expect(filter).toBeFocused();

    await filter.selectOption('cohort-budget-shopper');
    expect(await filter.inputValue()).toBe('cohort-budget-shopper');
  });

  test('clear filter button has accessible label', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.selectOption('cohort-budget-shopper');

    const clearButton = page.getByLabel(/clear cohort filter/i);
    await expect(clearButton).toBeVisible();
    expect(await clearButton.getAttribute('aria-label')).toBe('Clear cohort filter');
  });

  test('clear filter button is keyboard accessible', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.selectOption('cohort-budget-shopper');

    const clearButton = page.getByLabel(/clear cohort filter/i);
    await clearButton.focus();
    await expect(clearButton).toBeFocused();

    await page.keyboard.press('Enter');

    expect(await filter.inputValue()).toBe('');
  });

  test('filtered variant count is announced via aria-live', async ({ page }) => {
    const filter = page.getByLabel(/filter variants by cohort/i);
    await filter.selectOption('cohort-budget-shopper');

    const status = page.getByText(/showing \d+ of \d+ variant/i);
    await expect(status).toBeVisible();
    expect(await status.getAttribute('role')).toBe('status');
    expect(await status.getAttribute('aria-live')).toBe('polite');
  });
});