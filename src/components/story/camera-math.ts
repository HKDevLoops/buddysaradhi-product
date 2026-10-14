// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §4 (camera maths).
//
// WHY THIS FILE EXISTS SEPARATELY. The `useFrame` loop in camera-rig.tsx
// needs a browser, a Canvas and a clock — none of which a unit test has.
// Everything it COMPUTES lives here instead, as pure functions over plain
// numbers. tests/camera-rig.test.ts asserts these with no WebGL, no Canvas,
// no R3F import. If the rig and this module disagree, the rig is wrong: this
// module is the contract.

import type { Beat } from "./beats";

/** How far ahead of `t` the lens looks, as a fraction of the path. */
export const LOOK_AHEAD = 0.12;

/** Shared damp rate for progress, gaze, FOV and roll. One rate on purpose:
// different rates per property is how you get seasickness. */
export const DAMP_RATE = 4;

/** The lens never leaves this range, however a beat is authored. */
export const FOV_MIN = 35;
export const FOV_MAX = 90;

export interface FrameState {
  readonly pos: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov: number;
  readonly roll: number;
}

function lerp3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** The beat whose scroll window contains `t`. Linear scan: 50 items per frame
 *  is trivial, and a binary search would only hide the contiguity the data
 *  guarantees. */
export function beatAtProgress(beats: readonly Beat[], t: number): number {
  const clamped = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  for (let i = 0; i < beats.length; i++) {
    const [start, end] = beats[i].scroll;
    if (clamped < end || i === beats.length - 1) return i;
  }
  return beats.length - 1;
}

/**
 * The exact camera state at normalised scroll `t`: position, look target,
 * FOV and roll, each interpolated between the two bracketing beats and each
 * clamped to its legal range.
 */
export function frameAtProgress(beats: readonly Beat[], t: number): FrameState {
  const clampedT = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  const i = beatAtProgress(beats, clampedT);
  const beat = beats[i];
  const [start, end] = beat.scroll;
  const span = end - start;
  const local = span <= 0 ? 0 : Math.min(1, Math.max(0, (clampedT - start) / span));
  const next = beats[Math.min(beats.length - 1, i + 1)];

  const pos = lerp3(beat.camera.pos, next.camera.pos, local);
  // The look target leads the position: blend the beat's declared target
  // toward the NEXT beat's target by the same local progress, so the lens
  // arrives where the camera is going, not where it has been.
  const target = lerp3(beat.camera.target, next.camera.target, local);
  const fov = Math.min(
    FOV_MAX,
    Math.max(FOV_MIN, beat.camera.fov + (next.camera.fov - beat.camera.fov) * local),
  );
  const rollA = beat.camera.roll ?? 0;
  const rollB = next.camera.roll ?? 0;
  const roll = rollA + (rollB - rollA) * local;
  return { pos, target, fov, roll };
}
