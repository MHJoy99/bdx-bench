import { defineConfig } from 'vitest/config';

// DORMANT: requires `npm i -D vitest` inside web/ only (Lead approval needed).
// Never install at repo root — root stays zero-dependency (AGENTS.md §2).
// Run (once enabled): npx vitest run
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
