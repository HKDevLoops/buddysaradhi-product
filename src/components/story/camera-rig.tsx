// @ts-nocheck
// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §4 (camera direction).
//
// WHAT WAS MISSING. The existing Journey dollies a position along a curve and
// calls lookAt on a second curve. That is motion, not direction: no beat owns
// its framing, the lens never changes, and the camera never leans. This rig
// adds the three things that make a move feel operated rather than lerped:
//   (a) every beat declares a TARGET, interpolated with the same progress;
//   (b) damped LOOK-AHEAD — the lens points slightly ahead along travel;
//   (c) per-beat FOV and ROLL, interpolated and damped at one shared rate.
//
// STRUCTURE (brief §10: a build that renders is not done). All of the maths
// lives in `./camera-math` — pure functions over plain arrays, no R3F import —
// so tests/camera-rig.test.ts asserts it with no WebGL, no Canvas, no browser.
// The `useFrame` loop below is deliberately thin: refs only, no setState.

"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STORY_BEATS } from "./beats";
import { DAMP_RATE, LOOK_AHEAD, frameAtProgress } from "./camera-math";

interface CameraRigProps {
  progressRef: { current: number };
  frozen?: boolean;
  /** Written every frame with the smoothed gaze point. The character reads it
   *  to stand where the lens looks — the camera follows her, not the reverse.
   *  Refs only, never state. */
  subjectRef?: { current: THREE.Vector3 };
}

export function CameraRig({ progressRef, frozen = false, subjectRef }: CameraRigProps) {
  const smooth = useRef(0);
  const look = useRef(new THREE.Vector3(0, 1.5, -4));
  const fov = useRef(55);
  const roll = useRef(0);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const goal = frozen ? 0 : THREE.MathUtils.clamp(progressRef.current, 0, 1);
    smooth.current = THREE.MathUtils.damp(smooth.current, goal, DAMP_RATE, delta);
    const t = THREE.MathUtils.clamp(smooth.current, 0, 1);
    const frame = frameAtProgress(STORY_BEATS, t);

    state.camera.position.set(frame.pos[0], frame.pos[1], frame.pos[2]);

    // Look-ahead: the desired gaze is the beat target nudged toward where the
    // path goes next, so motion reads as intention. Clamped at t=1 — there is
    // no "ahead" past the end, and overshooting the curve would swing the lens
    // off the CTA frame.
    const tAhead = Math.min(1, t + LOOK_AHEAD);
    const frameAhead = frameAtProgress(STORY_BEATS, tAhead);
    ahead.set(frameAhead.pos[0], frameAhead.pos[1], frameAhead.pos[2]);
    desired.set(frame.target[0], frame.target[1], frame.target[2]).lerp(ahead, 0.3);
    look.current.set(
      THREE.MathUtils.damp(look.current.x, desired.x, DAMP_RATE, delta),
      THREE.MathUtils.damp(look.current.y, desired.y, DAMP_RATE, delta),
      THREE.MathUtils.damp(look.current.z, desired.z, DAMP_RATE, delta),
    );
    state.camera.lookAt(look.current);
    if (subjectRef) subjectRef.current.copy(look.current);

    // Lens: one damped FOV and one damped roll, same rate as everything else.
    // Different rates per property is how you get seasickness.
    fov.current = THREE.MathUtils.damp(fov.current, frame.fov, DAMP_RATE, delta);
    const cam = state.camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov.current) > 0.01) {
      cam.fov = fov.current;
      cam.updateProjectionMatrix();
    }
    roll.current = THREE.MathUtils.damp(roll.current, frame.roll, DAMP_RATE, delta);
    // lookAt resets orientation every frame, so roll must be re-applied after.
    state.camera.rotateZ(roll.current);
  });

  return null;
}
