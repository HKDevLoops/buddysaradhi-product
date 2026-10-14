// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §4 + §10 (camera contract).
//
// Tests camera-math.ts ONLY — the pure module, never the R3F component. The
// `useFrame` loop is untestable by construction (it needs a clock and a
// camera); everything it computes is tested here instead. If the rig and this
// module disagree, the rig is wrong.

import { describe, it, expect } from "vitest";
import {
  FOV_MAX,
  FOV_MIN,
  LOOK_AHEAD,
  beatAtProgress,
  frameAtProgress,
} from "../src/components/story/camera-math";
import { STORY_BEATS, type Beat } from "../src/components/story/beats";

function miniBeats(): Beat[] {
  const base = STORY_BEATS[0];
  const a: Beat = {
    ...base,
    id: "a",
    scroll: [0, 0.5] as const,
    camera: { pos: [0, 0, 0], target: [0, 0, 0], fov: 55, roll: 0 },
  };
  const b: Beat = {
    ...base,
    id: "b",
    scroll: [0.5, 1] as const,
    camera: { pos: [10, 10, 10], target: [20, 20, 20], fov: 70, roll: 0.08 },
  };
  return [a, b];
}

describe("beatAtProgress", () => {
  it("resolves boundaries to the incoming beat", () => {
    expect(beatAtProgress(STORY_BEATS, 0)).toBe(0);
    expect(beatAtProgress(STORY_BEATS, 1)).toBe(49);
    expect(beatAtProgress(STORY_BEATS, 0.15)).toBe(9);
  });

  it("treats garbage as the first beat, never NaN", () => {
    expect(beatAtProgress(STORY_BEATS, NaN)).toBe(0);
    expect(beatAtProgress(STORY_BEATS, -3)).toBe(0);
    expect(beatAtProgress(STORY_BEATS, 99)).toBe(49);
  });
});

describe("frameAtProgress", () => {
  it("returns a beat's exact frame at its window start", () => {
    const frame = frameAtProgress(miniBeats(), 0);
    expect(frame.pos).toEqual([0, 0, 0]);
    expect(frame.target).toEqual([0, 0, 0]);
    expect(frame.fov).toBe(55);
    expect(frame.roll).toBe(0);
  });

  it("interpolates linearly mid-window", () => {
    const frame = frameAtProgress(miniBeats(), 0.25);
    expect(frame.pos).toEqual([5, 5, 5]);
    expect(frame.target).toEqual([10, 10, 10]);
    expect(frame.fov).toBeCloseTo(62.5, 9);
    expect(frame.roll).toBeCloseTo(0.04, 9);
  });

  it("clamps at t=1 with no overshoot past the last beat", () => {
    // There is no "ahead" past the end. A lens that overshoots the curve
    // swings off the CTA frame — the exact failure this guards.
    const frame = frameAtProgress(miniBeats(), 1);
    expect(frame.pos).toEqual([10, 10, 10]);
    expect(frame.target).toEqual([20, 20, 20]);
    expect(frame.fov).toBe(70);
    const beyond = frameAtProgress(miniBeats(), 1.5);
    expect(beyond).toEqual(frame);
  });

  it("clamps FOV to [35, 90] however a beat is authored", () => {
    const [a, b] = miniBeats();
    const hot: Beat[] = [
      { ...a, camera: { ...a.camera, fov: 200 } },
      { ...b, camera: { ...b.camera, fov: 200 } },
    ];
    expect(frameAtProgress(hot, 0.25).fov).toBe(FOV_MAX);
    const cold: Beat[] = [
      { ...a, camera: { ...a.camera, fov: 10 } },
      { ...b, camera: { ...b.camera, fov: 10 } },
    ];
    expect(frameAtProgress(cold, 0.25).fov).toBe(FOV_MIN);
  });

  it("the real 50-beat timeline stays in range everywhere", () => {
    for (let k = 0; k <= 200; k++) {
      const frame = frameAtProgress(STORY_BEATS, k / 200);
      expect(frame.fov).toBeGreaterThanOrEqual(FOV_MIN);
      expect(frame.fov).toBeLessThanOrEqual(FOV_MAX);
      for (const v of [...frame.pos, ...frame.target]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("look-ahead is a real constant inside (0, 1)", () => {
    expect(LOOK_AHEAD).toBeGreaterThan(0);
    expect(LOOK_AHEAD).toBeLessThan(1);
  });
});
