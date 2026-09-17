import { describe, expect, it } from 'vitest';

// DORMANT mirror of tests/scores.test.js (zero-dep source of truth).
// Self-contained on purpose: once `web/src/lib/scores.ts` exists (owner: Agents 2/4),
// replace these local helpers with imports and keep the expectations identical.
// BDX Score label thresholds: Elite >=0.8 / Strong >=0.6 / Competitive >=0.4 /
// Developing >=0.2 / Early >0 / Unranked for non-numbers.

type Result = { taskId: string; pass: boolean };

function avgScoreWeighted(results: Result[], points: Record<string, number>): number {
  let total = 0;
  let earned = 0;
  for (const r of results) {
    const p = (points[r.taskId] ?? 0) > 0 ? (points[r.taskId] as number) : 1;
    total += p;
    if (r.pass) earned += p;
  }
  return results.length === 0 || total === 0 ? 0 : earned / total;
}

function passRate(results: Result[]): number {
  return results.length === 0 ? 0 : results.filter((r) => r.pass).length / results.length;
}

function bdxScoreLabel(avg: number): string {
  if (typeof avg !== 'number' || Number.isNaN(avg)) return 'Unranked';
  if (avg >= 0.8) return 'Elite';
  if (avg >= 0.6) return 'Strong';
  if (avg >= 0.4) return 'Competitive';
  if (avg >= 0.2) return 'Developing';
  return 'Early';
}

describe('normalizedScore + weights (methodology v1)', () => {
  it('5/6 equal-weight passes -> 0.8333', () => {
    const results: Result[] = ['a', 'b', 'c', 'd', 'e'].map((taskId) => ({ taskId, pass: true }));
    results.push({ taskId: 'f', pass: false });
    const pts = Object.fromEntries(results.map((r) => [r.taskId, 10]));
    expect(avgScoreWeighted(results, pts)).toBeCloseTo(5 / 6, 12);
    expect(passRate(results)).toBeCloseTo(5 / 6, 12);
  });

  it('normalized weights sum to 100%', () => {
    const pts = { a: 10, b: 10, c: 10, d: 10, e: 10, f: 10 };
    const total = Object.values(pts).reduce((x, y) => x + y, 0);
    const pct = Object.values(pts).reduce((x, y) => x + (y / total) * 100, 0);
    expect(pct).toBeCloseTo(100, 9);
  });
});

describe('BDX Score label', () => {
  it.each([
    [1, 'Elite'],
    [0.8, 'Elite'],
    [0.7999, 'Strong'],
    [0.6, 'Strong'],
    [0.4, 'Competitive'],
    [0.2, 'Developing'],
    [0, 'Early'],
  ])('avgScore %s -> %s', (avg: number, want: string) => {
    expect(bdxScoreLabel(avg)).toBe(want);
  });
});
