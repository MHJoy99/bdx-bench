import { expect, test } from '@playwright/test';

// Viewport sweep: 320/375/768/1024/1440/1920 — no horizontal overflow per route.
// QA_CHECKLIST.md §1 records the manual notes; this spec is the regression net.
const WIDTHS = [320, 375, 768, 1024, 1440, 1920];
const ROUTES = ['/', '/leaderboard'];

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    test(`${route} @ ${width}px has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.scrollingElement!.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px on ${route}`).toBeLessThanOrEqual(0);
    });
  }
}
