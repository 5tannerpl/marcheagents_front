import { expect, test } from '@playwright/test';

test('landing page shows MarcheAgents branding and demo CTA', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MarcheAgents/);
  await expect(
    page.getByRole('heading', { level: 1 }),
  ).toContainText('Already One Step Ahead');
  // "Explore Agent Demos" CTA was removed; the demo link is now primary
  await expect(
    page.getByRole('link', { name: /explore agent demos/i }),
  ).toHaveCount(0);
  // Featured Agent section appears before Platform Capabilities
  const headings = await page
    .getByRole('heading', { level: 2 })
    .allTextContents();
  expect(headings.indexOf('Featured Agent')).toBeLessThan(
    headings.indexOf('Platform Capabilities'),
  );
  await page
    .getByRole('link', { name: /email support agent · interactive demo/i })
    .click();
  await expect(page).toHaveURL(/\/features\/email-support\/demo/);
});

test('catalog shows email agent available and placeholders coming soon', async ({
  page,
}) => {
  await page.goto('/features');
  const emailCard = page.getByTestId('feature-card-email-support');
  await expect(emailCard.getByText('Available')).toBeVisible();
  await expect(page.getByText('Coming Soon').first()).toBeVisible();
  // coming-soon cards must not expose any launch link
  await expect(
    page.getByTestId('feature-card-coming-soon-1').getByRole('link'),
  ).toHaveCount(0);
});

test('five-step demo walkthrough with identity switching', async ({ page }) => {
  await page.goto('/features/email-support/demo');
  await expect(page.getByTestId('mode-badge').first()).toContainText(
    'SIMULATED',
  );
  await expect(page.getByTestId('email-viewer')).toBeVisible();

  // Steps 2-4
  await page.getByRole('button', { name: /next/i }).click();
  await expect(page.getByTestId('intent-panel')).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();
  await expect(page.getByTestId('case-split')).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();
  await expect(page.getByTestId('retrieval-panel')).toBeVisible();

  // Alice: only Project A evidence
  await expect(page.getByTestId('evidence-evidence-a-100')).toBeVisible();
  await expect(page.getByTestId('evidence-evidence-b-200')).toHaveCount(0);
  await expect(page.getByTestId('withheld-summary')).toBeVisible();

  // Switch to Carol: B evidence appears
  await page.getByRole('radio', { name: /carol/i }).click();
  await expect(page.getByTestId('evidence-evidence-b-200')).toBeVisible();
  await expect(page.getByTestId('evidence-evidence-c-300')).toHaveCount(0);

  // Switch to David: everything, nothing withheld
  await page.getByRole('radio', { name: /david/i }).click();
  await expect(page.getByTestId('evidence-evidence-c-300')).toBeVisible();
  await expect(page.getByTestId('withheld-summary')).toHaveCount(0);

  // Step 5 and back to step 1
  await page.getByRole('button', { name: /next/i }).click();
  await expect(page.getByTestId('reply-draft')).toBeVisible();
  await expect(page).toHaveURL(/step=ai-reply/);
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: /previous/i }).click();
  }
  await expect(page.getByTestId('email-viewer')).toBeVisible();
});

test('demo restores step and identity from URL on refresh', async ({
  page,
}) => {
  await page.goto(
    '/features/email-support/demo?step=secure-retrieval&identity=carol',
  );
  await expect(page.getByTestId('retrieval-panel')).toBeVisible();
  await expect(page.getByTestId('evidence-evidence-b-200')).toBeVisible();
});

test('inspector tabs switch between context, policy and audit', async ({
  page,
}) => {
  await page.goto('/features/email-support/demo');
  await expect(page.getByTestId('context-inspector')).toBeVisible();
  await page.getByRole('tab', { name: /policy evaluation/i }).click();
  await expect(page.getByTestId('policy-inspector')).toBeVisible();
  await page.getByRole('tab', { name: /audit events/i }).click();
  await expect(page.getByTestId('audit-timeline')).toBeVisible();
});

test('protected live routes show the live operations demo intro', async ({ page }) => {
  await page.goto('/app/features/email-support');
  await expect(
    page.getByRole('heading', { name: /live ai agent operations demo/i }),
  ).toBeVisible();
  await expect(page.getByTestId('mode-badge')).toContainText(
    'SERVER-ENFORCED POLICY',
  );
});

test('legacy /demo route redirects to the feature demo', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveURL(/\/features\/email-support\/demo/);
});

test('data protection page runs scenarios one at a time', async ({ page }) => {
  await page.goto('/features/email-support/data-protection');
  await expect(page.getByTestId('pass-count')).toContainText('0/10');
  await page.getByTestId('run-test-session-scope-bleed').click();
  // While a scenario runs, the others are disabled
  await expect(page.getByTestId('run-test-role-forgery')).toBeDisabled();
  await expect(
    page.getByTestId('security-test-session-scope-bleed'),
  ).toContainText('Access Granted', { timeout: 10_000 });
  await expect(page.getByTestId('pass-count')).toContainText('1/10');
  // Once finished, the next scenario can be started
  await expect(page.getByTestId('run-test-role-forgery')).toBeEnabled();
  await page.getByTestId('run-test-role-forgery').click();
  await expect(
    page.getByTestId('security-test-role-forgery'),
  ).toContainText('Information Protected', { timeout: 10_000 });
  await expect(page.getByTestId('pass-count')).toContainText('2/10');
});

test('contact page is reachable from navigation and shows the form', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  if (isMobile) {
    await page.getByRole('button', { name: /open menu/i }).click();
  }
  await page
    .getByRole('navigation', { name: isMobile ? 'Mobile' : 'Main' })
    .getByRole('link', { name: /contact us/i })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByTestId('contact-form')).toBeVisible();
  await expect(page.getByText('info@marcheagents.com').first()).toBeVisible();
});
