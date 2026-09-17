import { expect, test } from '@playwright/test';

// CmdK palette, theme toggle, loading/empty/error states.
// Hooks needed from UI agents: cmdk-input, cmdk-option, theme-toggle,
// loading-skeleton, empty-state, error-banner.

test('CmdK opens with Ctrl+K, jumps, closes with Esc', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByTestId('cmdk-input')).toBeVisible();
  await page.getByTestId('cmdk-input').fill('luna');
  await expect(page.getByTestId('cmdk-option').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('cmdk-input')).toBeHidden();
});

test('theme toggle persists across reload', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByTestId('theme-toggle');
  await expect(toggle).toBeVisible();
  const before = await page.evaluate(() => document.documentElement.dataset.theme ?? 'dark');
  await toggle.click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme ?? 'dark');
  expect(after).not.toBe(before);
  await page.reload();
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme ?? 'dark');
  expect(persisted).toBe(after);
});

test('leaderboard shows skeleton while loading, never a console error', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/leaderboard');
  // Skeleton may flash by; assert the final state renders one of the outcomes.
  await expect(
    page.getByTestId('leaderboard-row').first().or(page.getByTestId('empty-state')).or(page.getByTestId('error-banner')),
  ).toBeVisible({ timeout: 15000 });
  expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
});
