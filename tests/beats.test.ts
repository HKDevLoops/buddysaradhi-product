// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §2 + §10 (beat contract).
//
// WHY THESE ASSERTIONS EXIST. The scroll ranges, camera targets and act map
// below are DATA, and data rots silently: a merged beat, a renumbered id, a
// scroll gap that strands a caption with no camera, a beat 38 with a nonzero
// roll that reads as a bug. Every invariant the brief names is pinned here.
// Pure data assertions — no WebGL, no Canvas, no browser.

import { describe, it, expect } from "vitest";
import {
  CHARACTER_POSES,
  LEDGER_PRESENCES,
  STORY_BEATS,
  STORY_IDS,
} from "../src/components/story/beats";

const EPS = 1e-9;

describe("the story is fifty beats", () => {
  it("counts exactly 50", () => {
    expect(STORY_BEATS).toHaveLength(50);
    expect(STORY_IDS).toHaveLength(50);
  });

  it("ids are unique, stable and ordered with the beats", () => {
    expect(new Set(STORY_IDS).size).toBe(50);
    expect(STORY_BEATS.map((b) => b.id)).toEqual(STORY_IDS);
    for (const id of STORY_IDS) {
      expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("acts run 9 + 11 + 10 + 10 + 10 in order", () => {
    const acts = STORY_BEATS.map((b) => b.act);
    expect(acts.slice(0, 9).every((a) => a === 1)).toBe(true);
    expect(acts.slice(9, 20).every((a) => a === 2)).toBe(true);
    expect(acts.slice(20, 30).every((a) => a === 3)).toBe(true);
    expect(acts.slice(30, 40).every((a) => a === 4)).toBe(true);
    expect(acts.slice(40, 50).every((a) => a === 5)).toBe(true);
  });
});

describe("scroll ranges tile 0..1 with no gap and no overlap", () => {
  it("starts at 0 and ends at 1", () => {
    expect(Math.abs(STORY_BEATS[0].scroll[0] - 0)).toBeLessThan(EPS);
    expect(Math.abs(STORY_BEATS[STORY_BEATS.length - 1].scroll[1] - 1)).toBeLessThan(EPS);
  });

  it("every boundary meets exactly", () => {
    for (let i = 0; i < STORY_BEATS.length - 1; i++) {
      const end = STORY_BEATS[i].scroll[1];
      const next = STORY_BEATS[i + 1].scroll[0];
      expect(Math.abs(next - end)).toBeLessThan(EPS);
      expect(end).toBeGreaterThan(STORY_BEATS[i].scroll[0]);
    }
  });
});

describe("every beat owns its framing", () => {
  it("declares a camera target of three finite numbers", () => {
    for (const beat of STORY_BEATS) {
      expect(beat.camera.target).toHaveLength(3);
      for (const v of beat.camera.target) {
        expect(Number.isFinite(v)).toBe(true);
      }
      expect(beat.camera.pos).toHaveLength(3);
      for (const v of beat.camera.pos) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("keeps FOV inside [35, 90]", () => {
    for (const beat of STORY_BEATS) {
      expect(beat.camera.fov).toBeGreaterThanOrEqual(35);
      expect(beat.camera.fov).toBeLessThanOrEqual(90);
    }
  });

  it("Act II roll never exceeds 0.08 rad", () => {
    for (const beat of STORY_BEATS) {
      if (beat.act !== 2) continue;
      expect(Math.abs(beat.camera.roll ?? 0)).toBeLessThanOrEqual(0.08);
    }
  });

  it("beat 38 (the-breath) roll is exactly 0", () => {
    // The recovery beat must read level. A nonzero roll here is not style —
    // it is a bug, because Act II trained the viewer that tilt means chaos.
    expect(STORY_BEATS[37].id).toBe("the-breath");
    expect(STORY_BEATS[37].camera.roll ?? 0).toBe(0);
  });
});

describe("every beat carries valid scene data and copy", () => {
  it("uses only known poses, ledger states and focuses", () => {
    const focuses = ["seeker", "room", "ledger", "self", "none"];
    for (const beat of STORY_BEATS) {
      expect(CHARACTER_POSES).toContain(beat.scene.character);
      expect(LEDGER_PRESENCES).toContain(beat.scene.ledger);
      expect(focuses).toContain(beat.focus);
      expect(beat.scene.crowd).toBeGreaterThanOrEqual(0);
      expect(beat.scene.crowd).toBeLessThanOrEqual(1);
      expect(beat.scene.warmth).toBeGreaterThanOrEqual(0);
      expect(beat.scene.warmth).toBeLessThanOrEqual(1);
    }
  });

  it("has a non-empty title and body, and bodies stay short", () => {
    for (const beat of STORY_BEATS) {
      expect(beat.caption.title.length).toBeGreaterThan(0);
      expect(beat.caption.body.length).toBeGreaterThan(0);
      expect(beat.caption.body.length).toBeLessThan(300);
    }
  });

  it("warmth never decreases across the story", () => {
    // The light is the emotional arc made visible: night cold, relief warm.
    // A dip would read as a regression mid-recovery.
    for (let i = 1; i < STORY_BEATS.length; i++) {
      expect(STORY_BEATS[i].scene.warmth).toBeGreaterThanOrEqual(
        STORY_BEATS[i - 1].scene.warmth - EPS,
      );
    }
  });
});
