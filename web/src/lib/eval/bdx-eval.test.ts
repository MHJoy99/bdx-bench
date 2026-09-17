import { describe, it, expect } from "vitest";
import {
  runEvaluationSync,
  getEvaluationState,
  startLiveEvaluation,
  EVAL_STAGES,
} from "./bdx-eval";

describe("BDX Eval Engine", () => {
  it("runs synchronous evaluation correctly", () => {
    const state = runEvaluationSync();
    expect(state.status).toBe("completed");
    expect(state.progressPercent).toBe(100);
    expect(state.winner).toBe("muse-spark-1-3");
    expect(state.results).toBeDefined();

    const alpha = state.results!["muse-spark-1-3"];
    const beta = state.results!["gemini-3-8-flash"];

    expect(alpha.finalScore).toBeCloseTo(92.4, 1);
    expect(beta.finalScore).toBeCloseTo(88.6, 1);

    for (const stage of EVAL_STAGES) {
      expect(alpha.stages[stage]).toBeDefined();
      expect(beta.stages[stage]).toBeDefined();
      expect(alpha.stages[stage].checks.length).toBeGreaterThan(0);
      expect(beta.stages[stage].checks.length).toBeGreaterThan(0);
    }
  });

  it("can query evaluation state via getEvaluationState", () => {
    const state = getEvaluationState();
    expect(state).toBeDefined();
    expect(state.results).toBeDefined();
  });

  it("starts live evaluation asynchronously and finishes", async () => {
    const state = await startLiveEvaluation(true);
    expect(state.status).toBe("completed");
    expect(state.winner).toBe("muse-spark-1-3");
    expect(state.logs.length).toBeGreaterThan(0);
  });
});
