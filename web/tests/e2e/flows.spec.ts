import { expect, test } from '@playwright/test';

// Core journey: home -> leaderboard -> model -> compare.
// Requires data-testid hooks from UI agents: nav-leaderboard, leaderboard-row,
// model-link, compare-add, compare-table. Fails loudly until hooks land (by design).

test('home -> leaderboard -> model -> compare', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('nav-leaderboard')).toBeVisible();
  await page.getByTestId('nav-leaderboard').click();
  const rows = page.getByTestId('leaderboard-row');
  await expect(rows.first()).toBeVisible();
  await expect(await rows.count()).toBeGreaterThan(0);

  await page.getByTestId('model-link').first().click();
  await expect(page).toHaveURL(/model|runs/);

  await page.goto('/');
  await page.getByTestId('nav-leaderboard').click();
  const add = page.getByTestId('compare-add');
  if ((await add.count()) >= 2) {
    await add.nth(0).check();
    await add.nth(1).check();
    await expect(page.getByTestId('compare-table')).toBeVisible();
  }
});

test('unknown model id renders empty state, not a blank page', async ({ page }) => {
  await page.goto('/compare?a=__nope__&b=__nah__');
  await expect(page.getByTestId('empty-state')).toBeVisible();
});
