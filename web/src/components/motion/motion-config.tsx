"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * Root-level reduced-motion switch. Kept in its own module so the shared root
 * chunk does not import the motion primitives (polish-motion) on every page.
 */
export function PolishMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
