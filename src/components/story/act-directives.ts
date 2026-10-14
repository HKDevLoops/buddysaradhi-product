// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §6 (act directives).
//
// WHAT THIS IS. The `SceneDirective` on each beat is data ("crowd 0.7, warmth
// 0.4"); something has to turn data into scene parameters. That is this
// module: pure functions from (directive, tier budget) to numbers the canvas
// consumes. No THREE imports, no hooks, no JSX — so the mapping is reviewable
// without running anything, and the performance test consumes the same numbers
// the canvas does.
//
// Deliberately small. If this file grows scene logic, that logic belongs in a
// component, not here.

import type { LedgerPresence, SceneDirective } from "./beats";

export interface ActSceneParams {
  /** 0 = invisible (scale collapses, mesh unmounted by the canvas). */
  readonly ledgerScale: number;
  readonly ledgerVisible: boolean;
  /** Silhouette count AFTER the tier budget is applied. */
  readonly crowdCount: number;
}

const LEDGER_SCALE: Record<LedgerPresence, number> = {
  hidden: 0,
  entering: 0.6,
  present: 1,
  center: 1.15,
  orbit: 1,
};

/** Crowd silhouettes at full density, before the tier budget applies. */
export const CROWD_FULL = 12;

export function resolveActScene(directive: SceneDirective, particleBudget: number): ActSceneParams {
  const ledgerScale = LEDGER_SCALE[directive.ledger] ?? 0;
  // Crowd shares the particle budget's tier decision: low-end devices get no
  // silhouettes (the corridor reads through fog and sound-less motion
  // instead), full scene scales 0..CROWD_FULL with the beat's density.
  const crowdCount =
    particleBudget <= 80 ? 0 : Math.round(directive.crowd * CROWD_FULL);
  return {
    ledgerScale,
    ledgerVisible: ledgerScale > 0,
    crowdCount,
  };
}
