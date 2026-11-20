import { expect, test } from '@playwright/test';

/**
 * Agent Ops dashboard (simulated adapter). Use a development build or a build made
 * with VITE_AOB_DASHBOARD_MOCK=1, e.g.:
 *   VITE_AOB_DASHBOARD_MOCK=1 npm run build && npx playwright test e2e/agent-ops.spec.ts
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/app/agent-ops');
  const enabled = await page
    .getByRole('heading', { level: 1, name: 'Agent Ops Board' })
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  test.skip(!enabled, 'The dashboard heading is not available in this test build.');
});

test('shows simulated data, the newest run and the four live metric charts', async ({ page }) => {
  await expect(page.getByTestId('simulation-banner')).toContainText('SIMULATED DATA');
  await expect(page.getByTestId('run-status-line')).toContainText('COMPLETE');
  await expect(page.getByRole('img', { name: /line chart/ })).toHaveCount(4);
  await expect(page.getByTestId('production-gate')).toBeVisible();
});

test('layout stays within the viewport and charts use two columns only on wide screens', async ({ page }) => {
  await expect(page.getByRole('img', { name: /line chart/ })).toHaveCount(4);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const boxes = await page.getByRole('img', { name: /line chart/ }).evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), width: r.width })),
  );
  const viewport = page.viewportSize()!;
  if (viewport.width >= 1024) {
    expect(boxes[0].top).toBe(boxes[1].top);
  } else {
    expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
  }
  for (const b of boxes) expect(b.width).toBeLessThanOrEqual(viewport.width);

  const clipped = await page
    .locator('[data-testid="scaling-overview"] p')
    .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent));
  expect(clipped).toEqual([]);
});

test('starting a run selects it automatically and disables the controls', async ({ page }) => {
  await page.getByLabel('Simulation speed (resets session runs)').selectOption('20');
  await expect(page.getByTestId('run-status-line')).toBeVisible();
  await page.getByRole('radio', { name: /High Concurrency/ }).check();
  await page.getByRole('button', { name: '▶ Start Live Demo' }).click();
  await expect(page.getByTestId('run-selector')).not.toHaveValue('run-8192a3b4c5d6e7f8');
  await expect(page.getByRole('button', { name: '▶ Start Live Demo' })).toBeDisabled();
  await expect(page.getByTestId('run-status-line')).toContainText(/SUBMITTING|QUEUED|RUNNING/);
});
