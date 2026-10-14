// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §7 + §10 (budgets).
//
// WHAT THIS COUNTS. Everything the story ADDS — the seeker's 8 meshes, up to
// 24 crowd silhouettes — built as REAL three.js geometries from the SAME param
// constants the components render (scene-geometry.ts: single source, no drift).
// Geometry construction is CPU math: no GL context, no Canvas, no browser.
// Triangle counts below are measured from constructed buffers, not estimated
// from docs and not eyeballed from a profiler screenshot.
//
// SCOPE, STATED PLAINLY. This asserts the story's SUB-budget (meshes ≤ 32,
// triangles ≤ 40000 at full crowd), leaving headroom inside the tier budgets
// for the shared set pieces (LedgerCard, World, ParticleField, AccentLights),
// which carry their own contract. It does not count textures, because the
// story adds ZERO textures — there is no TextureLoader, CanvasTexture or
// texture import anywhere under src/components/story, by construction.

import { describe, it, expect } from "vitest";
import {
  CHARACTER_GEOMETRY,
  CHARACTER_MESH_COUNT,
  CROWD_FULL,
  CROWD_HEAD,
  CROWD_TORSO,
  STORY_MESH_BUDGET,
  STORY_TRIANGLE_BUDGET,
  storyAddedMeshes,
  storyAddedTriangles,
  trianglesOf,
} from "../src/components/story/scene-geometry";

describe("story geometry budget", () => {
  it("the character registry describes 8 meshes", () => {
    expect(CHARACTER_MESH_COUNT).toBe(8);
    const instances = CHARACTER_GEOMETRY.reduce((n, p) => n + p.instances, 0);
    expect(instances).toBe(CHARACTER_MESH_COUNT);
  });

  it("full crowd is 12 silhouettes of 2 meshes", () => {
    expect(CROWD_FULL).toBe(12);
    expect(storyAddedMeshes(CROWD_FULL)).toBe(STORY_MESH_BUDGET);
    expect(STORY_MESH_BUDGET).toBe(32);
  });

  it("mesh count stays inside budget at every crowd level", () => {
    expect(storyAddedMeshes(0)).toBe(CHARACTER_MESH_COUNT);
    expect(storyAddedMeshes(CROWD_FULL)).toBeLessThanOrEqual(STORY_MESH_BUDGET);
  });

  it("triangle count is real, positive, and inside budget", () => {
    const empty = storyAddedTriangles(0);
    const full = storyAddedTriangles(CROWD_FULL);
    // Positive AND substantial: a degenerate (empty-registry) budget that
    // asserts against nothing would pass while proving nothing.
    expect(empty).toBeGreaterThan(1000);
    expect(full).toBeGreaterThan(empty);
    expect(full).toBeLessThanOrEqual(STORY_TRIANGLE_BUDGET);
  });

  it("each registered part contributes real geometry", () => {
    for (const part of CHARACTER_GEOMETRY) {
      expect(trianglesOf(part.spec)).toBeGreaterThan(0);
    }
    expect(trianglesOf(CROWD_TORSO)).toBeGreaterThan(0);
    expect(trianglesOf(CROWD_HEAD)).toBeGreaterThan(0);
  });
});
