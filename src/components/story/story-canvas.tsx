// @ts-nocheck
// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §6 (story canvas).
//
// COMPOSITION, NOT A FORK. ProductScene hardwires the 5-beat Journey camera,
// so the story mounts its own Canvas — but every set piece inside it is
// imported shared code: LedgerCard, World, ParticleField, AccentLights. The
// only story-local meshes are the Character and the Crowd silhouettes, which
// the hero never needed. Same ACES tone mapping, same fog contract, same
// frameloop suspension, same aria-hidden canvas as ProductScene.
// R3F + turpopack + TS 7 → ts-nocheck per buddysaradhi-3d skill.

"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { AccentLights } from "../product-3d/AccentLights";
import { LedgerCard } from "../product-3d/LedgerCard";
import { ParticleField } from "../product-3d/ParticleField";
import { World } from "../product-3d/World";
import type { SceneTokens } from "../product-3d/hooks";
import { resolveDpr, resolveParticleCount } from "../product-3d/scene-tiers";
import { CameraRig } from "./camera-rig";
import { Character } from "./character";
import { resolveActScene } from "./act-directives";
import { CROWD_HEAD, CROWD_TORSO } from "./scene-geometry";
import type { SceneDirective } from "./beats";

/** Deterministic silhouette placement: ring arc behind the street line. No
 *  Math.random in render path — index-seeded, stable across frames. */
function crowdSpot(i: number, n: number): [number, number, number] {
  const a = Math.PI * (0.15 + (0.7 * i) / Math.max(1, n));
  const r = 14 + (i % 3) * 3;
  return [Math.cos(a) * r, 0, 18 - Math.sin(a) * r * 0.4];
}

function Crowd({ tokens, count, frozen }: { tokens: SceneTokens; count: number; frozen: boolean }) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(tokens.sunken),
        roughness: 0.9,
        metalness: 0,
      }),
    [tokens.sunken],
  );
  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame((_, rawDelta) => {
    if (frozen) return;
    const t = performance.now() / 1000;
    for (let i = 0; i < count; i++) {
      const g = refs.current[i];
      if (g) g.position.y = Math.sin(t * 0.8 + i * 1.7) * 0.03;
    }
  });
  if (count <= 0) return null;
  const spots: Array<[number, number, number]> = [];
  for (let i = 0; i < count; i++) spots.push(crowdSpot(i, count));
  return (
    <group>
      {spots.map((p, i) => (
        <group
          key={i}
          position={p}
          ref={(g) => {
            refs.current[i] = g;
          }}
        >
          <mesh material={mat} position={[0, 1.0, 0]}>
            <capsuleGeometry args={[...CROWD_TORSO.args]} />
          </mesh>
          <mesh material={mat} position={[0, 1.75, 0]}>
            <sphereGeometry args={[...CROWD_HEAD.args]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

interface StoryCanvasProps {
  progressRef: { current: number };
  tokens: SceneTokens;
  directive: SceneDirective;
  frozen?: boolean;
  lowEnd?: boolean;
  wide?: boolean;
  inView?: boolean;
  onReady?: () => void;
}

export function StoryCanvas({
  progressRef,
  tokens,
  directive,
  frozen = false,
  lowEnd = false,
  wide = false,
  inView = true,
  onReady,
}: StoryCanvasProps) {
  const subjectRef = useRef(new THREE.Vector3(0, 1.5, 20));
  const scene = resolveActScene(directive, resolveParticleCount(lowEnd));

  return (
    <Canvas
      aria-hidden="true"
      dpr={resolveDpr(lowEnd, wide)}
      gl={{ antialias: true, powerPreference: lowEnd ? "low-power" : "high-performance" }}
      camera={{ fov: 55, position: [0, 8, 40] }}
      frameloop={inView ? "always" : "never"}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        onReady?.();
      }}
    >
      <color attach="background" args={[tokens.canvas]} />
      <fog attach="fog" args={[tokens.sunken, 8, 18]} />
      <AdaptiveDpr />
      <Suspense fallback={null}>
        <CameraRig progressRef={progressRef} frozen={frozen} subjectRef={subjectRef} />
        <Character
          tokens={tokens}
          pose={directive.character}
          frozen={frozen}
          warmth={directive.warmth}
          subjectRef={subjectRef}
        />
        {scene.ledgerVisible && (
          // Scale about the card's own centre ([0, 0.4, 0]): the outer group
          // sits at the centre, the inner group offsets back, so `scale`
          // grows the card in place instead of dragging it across the scene.
          <group position={[0, 0.4, 0]} scale={scene.ledgerScale}>
            <group position={[0, -0.4, 0]}>
              <LedgerCard tokens={tokens} frozen={frozen} lowEnd={lowEnd} />
            </group>
          </group>
        )}
        <World tokens={tokens} lowEnd={lowEnd} />
        <ParticleField
          tokens={tokens}
          count={resolveParticleCount(lowEnd)}
          frozen={frozen || directive.stillness}
        />
        <AccentLights tokens={tokens} frozen={frozen} />
        <Crowd tokens={tokens} count={scene.crowdCount} frozen={frozen} />
      </Suspense>
    </Canvas>
  );
}
