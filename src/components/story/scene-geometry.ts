// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §7 (performance budgets).
//
// SINGLE SOURCE FOR GEOMETRY PARAMS. Every mesh the story adds — the
// character's eight parts, the crowd silhouettes — is specified HERE, and
// character.tsx / story-canvas.tsx build from these constants. The budget test
// (tests/performance.test.ts) constructs the IDENTICAL geometries and counts
// real triangles. If a mesh is added to a component without extending this
// registry, the test undercounts — so both consumers carry a comment pointing
// back here, and review treats an unregistered mesh as a defect.
//
// What this registry does NOT cover (by design): the shared set pieces
// (LedgerCard, World, ParticleField, AccentLights) are budgeted by their own
// contract — the story asserts a SUB-budget for what it adds, leaving headroom
// for them inside the tier budgets of scene-tiers.ts.

import * as THREE from "three";

export type GeomKind = "capsule" | "sphere" | "cylinder" | "box";

export interface GeomSpec {
  readonly kind: GeomKind;
  readonly args: readonly number[];
}

export interface CountedSpec {
  readonly spec: GeomSpec;
  /** Meshes built from this exact spec. */
  readonly instances: number;
  /** Human name, for failure messages. */
  readonly name: string;
}

const capsule = (...args: readonly number[]): GeomSpec => ({ kind: "capsule", args });
const sphere = (...args: readonly number[]): GeomSpec => ({ kind: "sphere", args });
const cylinder = (...args: readonly number[]): GeomSpec => ({ kind: "cylinder", args });
const box = (...args: readonly number[]): GeomSpec => ({ kind: "box", args });

// ─── The seeker (character.tsx). 8 meshes. ─────────────────────────────────
// Named specs first: character.tsx builds its meshes FROM these, so the
// params cannot drift between the rendered scene and the budget test.
export const TORSO_SPEC: GeomSpec = capsule(0.34, 0.92, 6, 12);
export const NECK_SPEC: GeomSpec = cylinder(0.07, 0.07, 0.1, 10);
export const HEAD_SPEC: GeomSpec = sphere(0.17, 20, 14);
export const ARM_SPEC: GeomSpec = capsule(0.085, 0.62, 4, 10);
export const LEG_SPEC: GeomSpec = capsule(0.1, 0.78, 4, 10);
export const PHONE_SPEC: GeomSpec = box(0.09, 0.17, 0.008);

export const CHARACTER_GEOMETRY: readonly CountedSpec[] = [
  { name: "torso", spec: TORSO_SPEC, instances: 1 },
  { name: "neck", spec: NECK_SPEC, instances: 1 },
  { name: "head", spec: HEAD_SPEC, instances: 1 },
  { name: "arms", spec: ARM_SPEC, instances: 2 },
  { name: "legs", spec: LEG_SPEC, instances: 2 },
  { name: "phone", spec: PHONE_SPEC, instances: 1 },
];

/** Total meshes the character adds. If character.tsx renders more or fewer
 *  meshes than this, the registry is stale — fix the registry, not the test. */
export const CHARACTER_MESH_COUNT = 8;

// ─── Crowd silhouettes (story-canvas.tsx Crowd). 2 meshes each. ─────────────
export const CROWD_TORSO: GeomSpec = capsule(0.3, 0.85, 4, 8);
export const CROWD_HEAD: GeomSpec = sphere(0.15, 12, 8);

/** Full-density silhouette count (act-directives CROWD_FULL mirrors this). */
export const CROWD_FULL = 12;

// ─── Budgets for everything the story adds (brief §7, high tier). ───────────
// Well inside the tier: the shared set pieces keep the rest of the headroom.
export const STORY_MESH_BUDGET = 8 + CROWD_FULL * 2;
export const STORY_TRIANGLE_BUDGET = 40000;

/** Build the real geometry. CPU-only math — no GL context, no Canvas, so the
 *  budget test runs in plain vitest. */
export function buildGeometry(spec: GeomSpec): THREE.BufferGeometry {
  switch (spec.kind) {
    case "capsule":
      return new THREE.CapsuleGeometry(spec.args[0], spec.args[1], spec.args[2], spec.args[3]);
    case "sphere":
      return new THREE.SphereGeometry(spec.args[0], spec.args[1], spec.args[2]);
    case "cylinder":
      return new THREE.CylinderGeometry(spec.args[0], spec.args[1], spec.args[2], spec.args[3]);
    case "box":
      return new THREE.BoxGeometry(spec.args[0], spec.args[1], spec.args[2]);
  }
}

/** Triangles in one instance of the spec. */
export function trianglesOf(spec: GeomSpec): number {
  const geo = buildGeometry(spec);
  const indexCount = geo.index ? geo.index.count : geo.attributes.position.count;
  const tris = Math.ceil(indexCount / 3);
  geo.dispose();
  return tris;
}

/** Total triangles the story adds at a given crowd count. */
export function storyAddedTriangles(crowdCount: number): number {
  let total = 0;
  for (const part of CHARACTER_GEOMETRY) total += trianglesOf(part.spec) * part.instances;
  const perSilhouette = trianglesOf(CROWD_TORSO) + trianglesOf(CROWD_HEAD);
  return total + perSilhouette * Math.max(0, crowdCount);
}

/** Total meshes the story adds at a given crowd count. */
export function storyAddedMeshes(crowdCount: number): number {
  return CHARACTER_MESH_COUNT + Math.max(0, crowdCount) * 2;
}
