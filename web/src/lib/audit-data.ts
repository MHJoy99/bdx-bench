/**
 * BDX Bench — Audit trail data (Showdown Score v2).
 *
 * Every score here comes from a strict implementation-level source-code audit
 * (2026-09-26), not from a keyword scan. Five dimensions, 20 points each.
 * A feature earns points only when it is genuinely implemented AND reachable:
 * on-screen strings, comments, and dead code score zero.
 *
 * `findings` are VERIFIED defects observed during the audits. They are surfaced
 * in the UI deliberately — a benchmark that hides failures is not trustworthy.
 */

export const AUDIT_DIMENSIONS = [
  { key: "controls", label: "Controls & Mobility", short: "Controls" },
  { key: "combat", label: "Combat Physics & Weapons", short: "Combat" },
  { key: "content", label: "Content & Enemy Variety", short: "Content" },
  { key: "audio", label: "Audio & Sound Design", short: "Audio" },
  { key: "polish", label: "Visual Polish & Game Feel", short: "Polish" },
] as const;

export type AuditDimensionKey = (typeof AUDIT_DIMENSIONS)[number]["key"];

export interface AuditFinding {
  /** What is wrong, in one line. */
  title: string;
  /** Plain-English impact for the reader. */
  impact: string;
  severity: "low" | "medium" | "high";
}

export interface AuditEntry {
  buildId: string;
  buildName: string;
  modelSlug: string;
  modelName: string;
  playPath: string;
  /** Points per dimension, keyed like AUDIT_DIMENSIONS. */
  dims: Record<AuditDimensionKey, number>;
  total: number;
  generated: string;
  /** Short factual summary of what the build actually implements. */
  implements: string[];
  /** Verified defects. Rendered as the credibility section. */
  findings: AuditFinding[];
  /** True when the build is fully playable without audio, touch, etc. */
  mobileReady: boolean;
}

export const AUDIT_TRAIL: AuditEntry[] = [
  {
    buildId: "ember-dead",
    buildName: "EMBER DEAD",
    modelSlug: "space-bunny-free",
    modelName: "Space Bunny Free",
    playPath: "/play/ember-dead",
    dims: { controls: 19, combat: 18, content: 17, audio: 19, polish: 18 },
    total: 91,
    generated: "2026-09-26",
    mobileReady: true,
    implements: [
      "6 enemy types with genuine role separation, not stat sticks",
      "5 cooldown-based fire abilities; dash grants 0.3s i-frames",
      "15 synthesized SFX plus a 142 BPM five-layer music sequencer",
      "Slow-motion, hit-stop, per-event screen shake, regenerating shield",
      "3 pickup types, combo to x13, ?wave= jump, working touch controls",
    ],
    findings: [
      {
        title: "No roguelite upgrade layer",
        impact: "No card draft or perk selection, so builds do not change across a run.",
        severity: "medium",
      },
      {
        title: "Inverted knockback mass table",
        impact: "Heavy enemies get shoved furthest per hit; weight reads backwards.",
        severity: "low",
      },
      {
        title: "Inferno nuke audio is O(n2)",
        impact: "A full nuke fires ~73 overlapping booms with no voice limiting.",
        severity: "low",
      },
    ],
  },
  {
    buildId: "pyre-burn-horde",
    buildName: "PYRE — Burn the Horde",
    modelSlug: "deepseek-v4-1-flash",
    modelName: "DeepSeek V4.1 Flash",
    playPath: "/play/pyre-burn-horde",
    dims: { controls: 16, combat: 17, content: 14, audio: 17, polish: 16 },
    total: 80,
    generated: "2026-09-18",
    mobileReady: false,
    implements: [
      "Five interlocking fire systems: heat, ignite, contagion, ground pools, death chains",
      "A real 20-upgrade DOM card draft with rarity weighting and a score-gated reroll",
      "Adaptive music sequencer whose tempo tracks live enemy count",
      "Per-hit floating damage numbers, zero-allocation 4200-particle SoA",
      "Correct directional knockback with a non-inverted mass table",
    ],
    findings: [
      {
        title: "Zero touch support",
        impact: "CSS suppresses browser gestures and nothing replaces them, so a phone user gets a frozen, aimless screen.",
        severity: "high",
      },
      {
        title: "Hard softlock after the wave-20 draft",
        impact: "All 20 upgrades are one-shot; the pool empties, zero cards render, and no control path advances the game.",
        severity: "high",
      },
      {
        title: "Runner and Brute are stat sticks",
        impact: "Both read the same chaser branch as the Walker; only HP and speed differ.",
        severity: "medium",
      },
      {
        title: "Titan boss has one ability",
        impact: "A death explosion. No phases, no radial patterns, no summons.",
        severity: "medium",
      },
    ],
  },
  {
    buildId: "firebreak-night-shift",
    buildName: "Firebreak: Night Shift",
    modelSlug: "gpt-5-6-luna",
    modelName: "GPT Luna 5.6",
    playPath: "/play/firebreak-night-shift",
    dims: { controls: 15, combat: 13, content: 11, audio: 12, polish: 11 },
    total: 62,
    generated: "2026-09-18",
    mobileReady: true,
    implements: [
      "4 enemy types with real behavioural divergence read inside the AI",
      "Fire contagion that actually transfers burn to neighbours",
      "Working pointer-event touch layer with virtual sticks",
      "Zero dead sound effects and correct autoplay gating",
    ],
    findings: [
      {
        title: "Reachable pause hang",
        impact: "Particles keep emitting while paused with no consumer, so resuming can process 1.6B element moves and freeze the tab.",
        severity: "high",
      },
      {
        title: "Ultimate unreachable on touch",
        impact: "Dash, Solar Burst and pause have no touch binding, so a phone player cannot use them.",
        severity: "high",
      },
      {
        title: "No boss, no music",
        impact: "Difficulty escalates purely by numbers; there is no background track.",
        severity: "medium",
      },
      {
        title: "Scorch decals do nothing",
        impact: "They look like burning ground but carry zero collision or damage code.",
        severity: "low",
      },
    ],
  },
  {
    buildId: "cinderline",
    buildName: "Cinderline",
    modelSlug: "gpt-6-sol",
    modelName: "GPT 6 Sol",
    playPath: "/play/cinderline",
    dims: { controls: 15, combat: 11, content: 9, audio: 11, polish: 12 },
    total: 58,
    generated: "2026-09-22",
    mobileReady: true,
    implements: [
      "Proven continuous flame cone, measured 16.5 to 27.8 degrees with range",
      "Real 0.28s i-frame dash, blocked at both damage sources",
      "Touch layer verified end to end: virtual stick plus autofire",
      "Functional combo multiplier that genuinely climbs",
    ],
    findings: [
      {
        title: "Knockback entirely absent",
        impact: "Enemies have no velocity field, so the firebomb — the only impact weapon — deals zero push.",
        severity: "high",
      },
      {
        title: "Hit flash saturates to solid white",
        impact: "The cone re-applies the 130ms flash every frame, so a burning enemy is permanently white and the impact signal is destroyed.",
        severity: "medium",
      },
      {
        title: "Touch input lockout after restart",
        impact: "reset() leaves stale pointer ids, so both virtual sticks are dead for the rest of the session.",
        severity: "high",
      },
      {
        title: "No boss, no upgrades, no music",
        impact: "Three reskinned stat sticks and numeric wave scaling only.",
        severity: "medium",
      },
    ],
  },
  {
    buildId: "inferno-dead",
    buildName: "INFERNO DEAD",
    modelSlug: "deepseek-v4-1-flash",
    modelName: "DeepSeek V4.1 Flash",
    playPath: "/play/inferno-dead",
    dims: { controls: 16, combat: 12, content: 8, audio: 12, polish: 13 },
    total: 61,
    generated: "2026-09-26",
    mobileReady: true,
    implements: [
      "Genuinely working touch layer, verified via CDP multi-touch synthesis",
      "Real 135 particles/second cone with a well-tuned heat economy",
      "Coolant and fuel pickups with correct drain/regen asymmetry",
      "Zero dead SFX and no global namespace pollution",
    ],
    findings: [
      {
        title: "All four enemy types share one AI",
        impact: "The type field is never read in update, so the four classes are the same chaser with different numbers.",
        severity: "high",
      },
      {
        title: "Boss has zero abilities",
        impact: "It is a larger Walker. No phases, no attacks, no pattern.",
        severity: "high",
      },
      {
        title: "No music",
        impact: "Six sound effects and no background track.",
        severity: "medium",
      },
      {
        title: "No resize handler",
        impact: "Rotating a phone leaves a stale canvas backing size, blurring the render.",
        severity: "low",
      },
    ],
  },
  {
    buildId: "pyro-vs-zombies",
    buildName: "PYRO vs ZOMBIES",
    modelSlug: "muse-spark-1-3",
    modelName: "Muse Spark 1.3",
    playPath: "/play/pyro-vs-zombies",
    dims: { controls: 12, combat: 12, content: 9, audio: 8, polish: 11 },
    total: 52,
    generated: "2026-09-17",
    mobileReady: true,
    implements: [
      "Real contagion cascades plus tank death explosions and 12% chain reactions",
      "Correct enemy-projectile origin, verified 3 to 14px from the spitter",
      "238 lines of JS in one IIFE with zero globals and zero dead SFX",
      "Sustained filtered-noise flamethrower roar that genuinely loops",
    ],
    findings: [
      {
        title: "touchcancel leaves the flamethrower latched",
        impact: "Verified 24 fuel burned with no finger on screen, unrecoverable without a reload.",
        severity: "high",
      },
      {
        title: "One finger can never fire or aim",
        impact: "The first left-half touch is bound to movement only, so firing needs a two-finger gesture.",
        severity: "medium",
      },
      {
        title: "Pausing mid-burst leaves the roar droning",
        impact: "The gain ramp lives inside update, which the pause state skips.",
        severity: "medium",
      },
      {
        title: "No boss, no combo, no upgrades",
        impact: "Score is a flat addition per kill; replayability is wave scaling alone.",
        severity: "medium",
      },
    ],
  },
  {
    buildId: "emberfall",
    buildName: "Emberfall",
    modelSlug: "gpt-6-luna",
    modelName: "GPT Luna 6",
    playPath: "/play/emberfall",
    dims: { controls: 15, combat: 9, content: 6, audio: 10, polish: 11 },
    total: 51,
    generated: "2026-09-22",
    mobileReady: true,
    implements: [
      "Real continuous cone with a correctly wrapped angle helper",
      "Correct normalized directional knockback",
      "Fully working pointer-event touch layer with setPointerCapture",
      "No dead functions and no O(n2) hot spot",
    ],
    findings: [
      {
        title: "One enemy archetype",
        impact: "A single Zombie class with a size slider and no type field or AI branch.",
        severity: "high",
      },
      {
        title: "No additive compositing at all",
        impact: "globalCompositeOperation is zero, so the flame cannot glow and ground fire never illuminates anything standing in it.",
        severity: "medium",
      },
      {
        title: "Flame keeps animating while paused",
        impact: "togglePause clears firing but not the keys set, so a held Space burns behind the pause overlay.",
        severity: "medium",
      },
      {
        title: "No boss, no combo, no music",
        impact: "One pickup kind, and the pickups kind field is never read.",
        severity: "medium",
      },
    ],
  },
  {
    buildId: "pyroclasm-inferno",
    buildName: "PYROCLASM: Zombie Inferno",
    modelSlug: "gemini-3-8-flash",
    modelName: "Gemini 3.8 Flash",
    playPath: "/play/pyroclasm-inferno",
    dims: { controls: 10, combat: 9, content: 6, audio: 9, polish: 9 },
    total: 43,
    generated: "2026-09-17",
    mobileReady: false,
    implements: [
      "A real 1/2/3 weapon system with three distinct mechanics",
      "Correctly normalized directional knockback at all four sites",
      "Zero dead sound effects and a clean restart cycle",
      "A genuinely good brownian-noise flame loop through a lowpass",
    ],
    findings: [
      {
        title: "Advertised dash does not exist",
        impact: "The menu says Move & Dash; there is no dash, no i-frames and no shift handling.",
        severity: "high",
      },
      {
        title: "No delta time anywhere",
        impact: "Measured running at 2.67x speed on a 160Hz display, so difficulty is hardware-dependent.",
        severity: "high",
      },
      {
        title: "1.9M-op/frame cliff",
        impact: "Uncapped burn embers inside the per-enemy update feed a quadratic particle-vs-zombie loop; 34ms in a single tick at 644 zombies.",
        severity: "high",
      },
      {
        title: "AoE constants understate damage 8.1x",
        impact: "Explosion VFX and damage share one array, so a mine deals 892 against a stated 110 and the supernova 1622 against 200.",
        severity: "high",
      },
      {
        title: "Zero touch handlers, zero mobile media query",
        impact: "The game is 100% unplayable on a phone or tablet.",
        severity: "high",
      },
    ],
  },
  {
    buildId: "space-bunny",
    buildName: "Space Bunny (superseded)",
    modelSlug: "space-bunny-free",
    modelName: "Space Bunny Free",
    playPath: "/play/space-bunny",
    dims: { controls: 14, combat: 9, content: 8, audio: 8, polish: 10 },
    total: 49,
    generated: "2026-09-23",
    mobileReady: false,
    implements: [
      "A genuine radar minimap with real-time enemy and obstacle tracking",
      "Two named multi-phase bosses with dedicated health bars",
      "A continuous flamethrower particle stream with a live heat core",
      "Heated lighting and scanline post-processing over a baked floor",
    ],
    findings: [
      {
        title: "No flamethrower implementation",
        impact: "The word flamethrower appears exactly once in the whole file: the page title. There is no cone, no arc, no range code.",
        severity: "high",
      },
      {
        title: "The card draft was a CSS HUD",
        impact: "The 15 upgrade tiles are .stat-card spans that are never read by any update function.",
        severity: "high",
      },
      {
        title: "Mobile media query with zero touch handlers",
        impact: "A mobile layout ships with no touch, pointer or TouchEvent listener anywhere in the build.",
        severity: "high",
      },
      {
        title: "Audio is 15 one-shot blips",
        impact: "A sawtooth triangle wave per event, all sharing one frequency. No music, no filters.",
        severity: "medium",
      },
    ],
  },
  {
    buildId: "zombie-fire-survival",
    buildName: "Zombie Fire Survival",
    modelSlug: "gemini-pro-agent",
    modelName: "Gemini Pro Agent",
    playPath: "/play/zombie-fire-survival",
    dims: { controls: 11, combat: 6, content: 2, audio: 0, polish: 5 },
    total: 24,
    generated: "2026-09-25",
    mobileReady: false,
    implements: [
      "A well-tuned burn DoT with four secondary channels: slow, char, smoke, recolour",
      "Correct diagonal normalization and edge clamping on dual WASD + arrows",
      "Clean, honest 507-line code with 5/5 DOM ids resolving",
    ],
    findings: [
      {
        title: "Absolute zero audio",
        impact: "6/6 probes empty and 0 AudioContext constructions at runtime. The game is completely silent.",
        severity: "high",
      },
      {
        title: "A flamethrower game with no fuel economy",
        impact: "The heat value is cosmetic and only scales a glow; no overheat, vent, lockout or cooldown exists.",
        severity: "high",
      },
      {
        title: "The burn DoT can never kill",
        impact: "Health decrements with no death check in the update path, producing immortal unscored zombies.",
        severity: "high",
      },
      {
        title: "One enemy, zero progression",
        impact: "No boss, waves, pickups, combo, upgrades or persistence. A score attack lasting about a minute.",
        severity: "high",
      },
      {
        title: "The score label contradicts its own value",
        impact: "The HUD reads Zombies Burned but increments by zombie radius, so it can never equal the kill count.",
        severity: "medium",
      },
    ],
  },
];

export const AUDIT_BY_BUILD: Record<string, AuditEntry> = Object.fromEntries(
  AUDIT_TRAIL.map((e) => [e.buildId, e]),
);

/**
 * Canonical build per model slug. Two models shipped two audited builds each,
 * so this is the STRONGEST audited build for a slug — not the last one read.
 * Use `AUDIT_BY_BUILD` when you need a specific build, and
 * `SECONDARY_BUILDS` for the alternates.
 */
export const AUDIT_BY_SLUG: Record<string, AuditEntry> = (() => {
  const best = new Map<string, AuditEntry>();
  for (const e of AUDIT_TRAIL) {
    const cur = best.get(e.modelSlug);
    if (!cur || e.total > cur.total) best.set(e.modelSlug, e);
  }
  return Object.fromEntries(best);
})();

/** Alternate audited builds per model, keyed by the canonical build's id. */
export const SECONDARY_BUILDS: Record<string, AuditEntry | undefined> = {
  "ember-dead": AUDIT_BY_BUILD["space-bunny"],
  "pyre-burn-horde": AUDIT_BY_BUILD["inferno-dead"],
};

/** Severity ordering for rendering: worst first. */
export const SEVERITY_ORDER: Record<AuditFinding["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const SEVERITY_LABEL: Record<AuditFinding["severity"], string> = {
  high: "Failure",
  medium: "Partial pass",
  low: "Known issue",
};

/** Dimension value -> status token. 16+ is a pass, 10-15 partial, below 10 a failure. */
export function dimensionStatus(points: number): "pass" | "partial" | "fail" {
  if (points >= 16) return "pass";
  if (points >= 10) return "partial";
  return "fail";
}
