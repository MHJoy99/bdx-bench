import { defineConfig } from '@playwright/test';

// DORMANT: requires `npm i -D @playwright/test` inside web/ only (Lead approval).
// Never install at repo root — root stays zero-dependency (AGENTS.md §2).
// E2E targets the real server (mock/seed data only, no live gateway calls).
// Run (once enabled): BASE_URL=http://127.0.0.1:8765 npx playwright test
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:8765',
    trace: 'retain-on-failure',
  },
  webServer: undefined, // Lead/CI boots `npm start` (live :8765) or a :18765 fixture.
});
