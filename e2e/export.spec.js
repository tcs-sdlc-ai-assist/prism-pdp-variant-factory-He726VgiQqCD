/**
 * @module export.spec
 * @description Playwright E2E test: navigates to variant detail, clicks export button,
 * verifies download triggered. Tests bulk export from gallery view.
 * Validates exported JSON structure.
 * [Pipeline-aligned: synthetic data only]
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('Single Variant Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('navigates to detail view and finds export button', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  test('clicking export button triggers a download', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^variant-.*\.json$/);
  });

  test('exported single variant JSON has valid structure', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const manifest = JSON.parse(fileContent);

    expect(manifest).toHaveProperty('variantId');
    expect(typeof manifest.variantId).toBe('string');
    expect(manifest.variantId.length).toBeGreaterThan(0);

    expect(manifest).toHaveProperty('canonicalPdpId');
    expect(typeof manifest.canonicalPdpId).toBe('string');
    expect(manifest.canonicalPdpId.length).toBeGreaterThan(0);

    expect(manifest).toHaveProperty('cohort');
    expect(manifest.cohort).toHaveProperty('id');
    expect(manifest.cohort).toHaveProperty('name');
    expect(manifest.cohort).toHaveProperty('behaviorSignals');
    expect(Array.isArray(manifest.cohort.behaviorSignals)).toBe(true);

    expect(manifest).toHaveProperty('tailoringRules');
    expect(Array.isArray(manifest.tailoringRules)).toBe(true);
    expect(manifest.tailoringRules.length).toBeGreaterThan(0);

    for (const rule of manifest.tailoringRules) {
      expect(rule).toHaveProperty('ruleId');
      expect(rule).toHaveProperty('description');
      expect(rule).toHaveProperty('applied');
      expect(typeof rule.ruleId).toBe('string');
      expect(typeof rule.description).toBe('string');
      expect(typeof rule.applied).toBe('boolean');
    }

    expect(manifest).toHaveProperty('variantData');
    expect(manifest.variantData).toHaveProperty('title');
    expect(manifest.variantData).toHaveProperty('description');
    expect(manifest.variantData).toHaveProperty('price');
    expect(manifest.variantData).toHaveProperty('sku');
    expect(manifest.variantData).toHaveProperty('category');
    expect(manifest.variantData).toHaveProperty('features');
    expect(manifest.variantData).toHaveProperty('images');

    expect(typeof manifest.variantData.title).toBe('string');
    expect(typeof manifest.variantData.description).toBe('string');
    expect(typeof manifest.variantData.price).toBe('number');
    expect(typeof manifest.variantData.sku).toBe('string');
    expect(typeof manifest.variantData.category).toBe('string');
    expect(Array.isArray(manifest.variantData.features)).toBe(true);
    expect(Array.isArray(manifest.variantData.images)).toBe(true);

    expect(manifest).toHaveProperty('schemaVersion');
    expect(typeof manifest.schemaVersion).toBe('number');
  });

  test('exported single variant JSON contains cohort-specific badge', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const manifest = JSON.parse(fileContent);

    expect(manifest.variantData).toHaveProperty('badge');
    expect(typeof manifest.variantData.badge).toBe('string');
    expect(manifest.variantData.badge.length).toBeGreaterThan(0);
  });

  test('exported single variant JSON contains promotion message', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const manifest = JSON.parse(fileContent);

    expect(manifest.variantData).toHaveProperty('promotionMessage');
    expect(typeof manifest.variantData.promotionMessage).toBe('string');
    expect(manifest.variantData.promotionMessage.length).toBeGreaterThan(0);
  });

  test('export button shows success feedback after export', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    await downloadPromise;

    const successText = page.getByText(/exported!/i);
    await expect(successText).toBeVisible();
  });

  test('export button shows success status message', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    await downloadPromise;

    const successMessage = page.getByText(/manifest exported successfully/i);
    await expect(successMessage).toBeVisible();
  });
});

test.describe('Bulk Export from Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('bulk export button is visible in gallery', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  test('clicking bulk export triggers a download', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^all-variants-.*\.json$/);
  });

  test('bulk exported JSON has valid structure with all variants', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    expect(payload).toHaveProperty('exportedAt');
    expect(typeof payload.exportedAt).toBe('string');
    expect(new Date(payload.exportedAt).toISOString()).toBe(payload.exportedAt);

    expect(payload).toHaveProperty('totalVariants');
    expect(typeof payload.totalVariants).toBe('number');
    expect(payload.totalVariants).toBe(10);

    expect(payload).toHaveProperty('skippedVariants');
    expect(typeof payload.skippedVariants).toBe('number');
    expect(payload.skippedVariants).toBe(0);

    expect(payload).toHaveProperty('variants');
    expect(Array.isArray(payload.variants)).toBe(true);
    expect(payload.variants.length).toBe(10);
  });

  test('each variant in bulk export has required fields', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    for (const variant of payload.variants) {
      expect(variant).toHaveProperty('variantId');
      expect(typeof variant.variantId).toBe('string');
      expect(variant.variantId.length).toBeGreaterThan(0);

      expect(variant).toHaveProperty('canonicalPdpId');
      expect(typeof variant.canonicalPdpId).toBe('string');

      expect(variant).toHaveProperty('cohort');
      expect(variant.cohort).toHaveProperty('id');
      expect(variant.cohort).toHaveProperty('name');
      expect(variant.cohort).toHaveProperty('behaviorSignals');

      expect(variant).toHaveProperty('tailoringRules');
      expect(Array.isArray(variant.tailoringRules)).toBe(true);

      expect(variant).toHaveProperty('variantData');
      expect(variant.variantData).toHaveProperty('title');
      expect(variant.variantData).toHaveProperty('description');
      expect(variant.variantData).toHaveProperty('price');
      expect(variant.variantData).toHaveProperty('sku');
      expect(variant.variantData).toHaveProperty('category');
      expect(variant.variantData).toHaveProperty('features');
      expect(variant.variantData).toHaveProperty('images');

      expect(variant).toHaveProperty('schemaVersion');
    }
  });

  test('bulk export contains all 5 cohorts', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    const cohortIds = new Set(payload.variants.map((v) => v.cohort.id));
    expect(cohortIds.has('cohort-budget-shopper')).toBe(true);
    expect(cohortIds.has('cohort-tech-enthusiast')).toBe(true);
    expect(cohortIds.has('cohort-premium-buyer')).toBe(true);
    expect(cohortIds.has('cohort-student')).toBe(true);
    expect(cohortIds.has('cohort-business-buyer')).toBe(true);
  });

  test('bulk export variants have unique IDs', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    const variantIds = payload.variants.map((v) => v.variantId);
    const uniqueIds = new Set(variantIds);
    expect(uniqueIds.size).toBe(variantIds.length);
  });

  test('bulk export button shows success feedback', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    await downloadPromise;

    const successText = page.getByText(/exported!/i);
    await expect(successText).toBeVisible();
  });

  test('bulk export variants have valid prices', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    for (const variant of payload.variants) {
      expect(typeof variant.variantData.price).toBe('number');
      expect(variant.variantData.price).toBeGreaterThan(0);
      expect(Number.isNaN(variant.variantData.price)).toBe(false);
    }
  });

  test('student cohort variants have discounted prices in bulk export', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const payload = JSON.parse(fileContent);

    const studentVariants = payload.variants.filter((v) => v.cohort.id === 'cohort-student');
    const nonStudentVariants = payload.variants.filter((v) => v.cohort.id !== 'cohort-student');

    expect(studentVariants.length).toBeGreaterThan(0);
    expect(nonStudentVariants.length).toBeGreaterThan(0);

    for (const studentVariant of studentVariants) {
      const matchingNonStudent = nonStudentVariants.find(
        (v) => v.canonicalPdpId === studentVariant.canonicalPdpId,
      );
      if (matchingNonStudent && matchingNonStudent.cohort.id !== 'cohort-student') {
        expect(studentVariant.variantData.price).toBeLessThan(matchingNonStudent.variantData.price);
      }
    }
  });
});

test.describe('Export from Different Variant Detail Views', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('exports second variant and validates different content', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const secondItem = list.getByRole('listitem').nth(1);
    const card = secondItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');
    const manifest = JSON.parse(fileContent);

    expect(manifest).toHaveProperty('variantId');
    expect(manifest).toHaveProperty('variantData');
    expect(manifest.variantData.title.length).toBeGreaterThan(0);
    expect(manifest.variantData.features.length).toBeGreaterThan(0);
    expect(manifest.variantData.images.length).toBeGreaterThan(0);
  });

  test('can export, navigate back, and export bulk', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const singleExportButton = page.getByRole('button', { name: /export manifest/i });
    const singleDownloadPromise = page.waitForEvent('download');
    await singleExportButton.click();
    const singleDownload = await singleDownloadPromise;
    expect(singleDownload.suggestedFilename()).toMatch(/\.json$/);

    const backButton = page.getByRole('button', { name: /back to gallery/i });
    await backButton.click();

    await page.waitForURL('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });

    const bulkExportButton = page.getByRole('button', { name: /export all/i });
    const bulkDownloadPromise = page.waitForEvent('download');
    await bulkExportButton.click();
    const bulkDownload = await bulkDownloadPromise;
    expect(bulkDownload.suggestedFilename()).toMatch(/^all-variants-.*\.json$/);
  });
});

test.describe('Export JSON Formatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[role="list"][aria-label="PDP variant cards"]', { timeout: 10000 });
  });

  test('single export produces formatted JSON with indentation', async ({ page }) => {
    const list = page.getByRole('list', { name: /pdp variant cards/i });
    const firstItem = list.getByRole('listitem').first();
    const card = firstItem.getByRole('button').first();
    await card.click();

    await page.waitForURL(/\/variant\//);

    const exportButton = page.getByRole('button', { name: /export manifest/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');

    expect(fileContent).toContain('\n');
    expect(fileContent).toContain('  ');

    const parsed = JSON.parse(fileContent);
    expect(parsed).toBeDefined();
  });

  test('bulk export produces formatted JSON with indentation', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export all/i });

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const fileContent = readFileSync(filePath, 'utf-8');

    expect(fileContent).toContain('\n');
    expect(fileContent).toContain('  ');

    const parsed = JSON.parse(fileContent);
    expect(parsed).toBeDefined();
    expect(parsed.variants.length).toBe(10);
  });
});