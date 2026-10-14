// @ts-nocheck
// Implements: docs/plans/ANIMATION_MODEL_BRIEF.md §3 (the seeker).
//
// THE CHARACTER. Built from primitives — no downloaded model, no glTF, no
// skeleton, no animation mixer. Silhouette-first: she must read as a person at
// z=40 and at z=4, and readability comes from proportion and pose, not facial
// detail. A face is out of budget and out of taste for this product.
//
// ONE material for the whole body (meshStandardMaterial, roughness 0.72,
// metalness 0 — colour from --accent-text, never a literal). The phone is the
// single exception: it is a light source, not a surface, so it gets its own
// emissive material plus one PointLight. That contrast — dark figure, lit face
// — is the entire visual idea of Act I.
//
// POSE IS STORY, NOT DECORATION. Each act has a named keyframe and the joints
// damp toward it; the walk cycle's amplitude and speed are pose-driven too, so
// relief reads in the stride before a single caption is read. Hand-authored
// transform keyframes, never AnimationClip: cheaper, smaller, and scroll-driven
// instead of timer-driven.

"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneTokens } from "../product-3d/hooks";
import type { CharacterPose } from "./beats";
import {
  ARM_SPEC,
  HEAD_SPEC,
  LEG_SPEC,
  NECK_SPEC,
  PHONE_SPEC,
  TORSO_SPEC,
} from "./scene-geometry";

interface JointTargets {
  readonly torsoX: number;
  readonly headX: number;
  readonly headY: number;
  readonly armX: number;
  readonly armSpread: number;
  readonly phoneDown: number;
  readonly strideAmp: number;
  readonly strideSpeed: number;
  readonly bobAmp: number;
}

const POSES: Record<CharacterPose, JointTargets> = {
  // Act I: compression, searching. Small slow movements, head down.
  compressed: {
    torsoX: 0.35, headX: 0.5, headY: 0, armX: -0.2, armSpread: 0.08,
    phoneDown: 0, strideAmp: 0.05, strideSpeed: 1.2, bobAmp: 0.015,
  },
  // Act II: anxiety. Tighter arms, head turned slightly away, faster idle.
  anxious: {
    torsoX: 0.25, headX: 0.3, headY: 0.3, armX: -0.35, armSpread: 0.05,
    phoneDown: 0, strideAmp: 0.08, strideSpeed: 2.2, bobAmp: 0.02,
  },
  // Act III: the pause before deciding. Hands at sides. Only the phone moves.
  still: {
    torsoX: 0.05, headX: 0.1, headY: 0, armX: -0.05, armSpread: 0.1,
    phoneDown: 0.3, strideAmp: 0, strideSpeed: 0, bobAmp: 0.005,
  },
  // Act IV: relief. Shoulders open, head up, longer stride, arms swing.
  open: {
    torsoX: -0.08, headX: -0.05, headY: 0, armX: 0, armSpread: 0.18,
    phoneDown: 0.5, strideAmp: 0.25, strideSpeed: 1.8, bobAmp: 0.03,
  },
  // Act V: competence. Upright, phone down at her side.
  upright: {
    torsoX: 0, headX: 0, headY: 0, armX: 0, armSpread: 0.12,
    phoneDown: 1, strideAmp: 0.1, strideSpeed: 1.4, bobAmp: 0.015,
  },
};

interface CharacterProps {
  tokens: SceneTokens;
  pose: CharacterPose;
  frozen?: boolean;
  /** 0 = cold sodium night, 1 = warm relief. Tints the phone light. */
  warmth?: number;
  /** The smoothed gaze point, written by the camera rig. The character stands
   *  on its ground projection, offset out of frame centre — wherever the lens
   *  looks, she is already there. */
  subjectRef?: { current: THREE.Vector3 };
}

export function Character({ tokens, pose, frozen = false, warmth = 0, subjectRef }: CharacterProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const phone = useRef<THREE.Group>(null);
  const phoneLight = useRef<THREE.PointLight>(null);
  const phase = useRef(0);

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(tokens.accentText),
        roughness: 0.72,
        metalness: 0.0,
      }),
    [tokens.accentText],
  );
  const phoneMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0b1020"),
        emissive: new THREE.Color("#cfe6ff"),
        emissiveIntensity: 2.2,
        roughness: 0.4,
        metalness: 0.1,
      }),
    [],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const target = POSES[pose];
    const rate = frozen ? 0 : 3;
    const d = (cur: number, goal: number) =>
      rate === 0 ? cur : THREE.MathUtils.damp(cur, goal, rate, delta);

    if (!frozen) phase.current += delta * target.strideSpeed;
    const swing = frozen ? 0 : Math.sin(phase.current * Math.PI * 2) * target.strideAmp;
    const bob = frozen ? 0 : Math.sin(phase.current * Math.PI * 4) * target.bobAmp;

    // Stage position: follow the gaze point's ground projection, held 1.4
    // units off-axis so she never blocks the lens centre. Damped, so she
    // walks rather than teleports when the story cuts between acts.
    if (root.current) {
      root.current.position.y = bob;
      if (subjectRef && !frozen) {
        const gx = subjectRef.current.x * 0.85 + 1.4;
        const gz = subjectRef.current.z + 1.0;
        root.current.position.x = d(root.current.position.x, gx);
        root.current.position.z = d(root.current.position.z, gz);
      }
    }
    if (torso.current) torso.current.rotation.x = d(torso.current.rotation.x, target.torsoX);
    if (head.current) {
      // Head is a mesh (no sub-pivot needed at this scale): tilt the group via
      // its own rotation — a sphere rotating reads as a head turning.
      head.current.rotation.x = d(head.current.rotation.x, target.headX);
      head.current.rotation.y = d(head.current.rotation.y, target.headY);
    }
    if (armL.current) {
      armL.current.rotation.x = d(armL.current.rotation.x, target.armX - swing);
      armL.current.rotation.z = d(armL.current.rotation.z, target.armSpread);
    }
    if (armR.current) {
      armR.current.rotation.x = d(armR.current.rotation.x, target.armX + swing);
      armR.current.rotation.z = d(armR.current.rotation.z, -target.armSpread);
      if (phone.current) {
        // PhoneDown 0 = raised before her face (Act I reading pose),
        // 1 = lowered at her side (Act V competence).
        phone.current.rotation.x = d(phone.current.rotation.x, -0.9 + target.phoneDown * 0.9);
        phone.current.position.y = d(phone.current.position.y, -0.62 + target.phoneDown * -0.1);
      }
    }
    if (legL.current) legL.current.rotation.x = frozen ? 0 : swing * 1.4;
    if (legR.current) legR.current.rotation.x = frozen ? 0 : -swing * 1.4;
    if (phoneLight.current) {
      // The phone is the key light in the dark acts; it warms as the story does.
      phoneLight.current.intensity = frozen ? 0.4 : 2.2 - warmth * 1.2;
      phoneLight.current.color.set(warmth > 0.5 ? "#ffe3c2" : "#cfe6ff");
    }
  });

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* torso */}
      <group ref={torso} position={[0, 1.05, 0]}>
        <mesh material={bodyMat} position={[0, 0.28, 0]}>
          <capsuleGeometry args={[...TORSO_SPEC.args]} />
        </mesh>
        {/* neck + head */}
        <mesh material={bodyMat} position={[0, 0.92, 0]}>
          <cylinderGeometry args={[...NECK_SPEC.args]} />
        </mesh>
        <mesh ref={head} material={bodyMat} position={[0, 1.12, 0]}>
          <sphereGeometry args={[...HEAD_SPEC.args]} />
        </mesh>
        {/* arms pivot at the shoulders */}
        <group ref={armL} position={[-0.4, 0.62, 0]}>
          <mesh material={bodyMat} position={[0, -0.31, 0]}>
            <capsuleGeometry args={[...ARM_SPEC.args]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.4, 0.62, 0]}>
          <mesh material={bodyMat} position={[0, -0.31, 0]}>
            <capsuleGeometry args={[...ARM_SPEC.args]} />
          </mesh>
          {/* phone in the right hand */}
          <group ref={phone} position={[0, -0.62, 0.1]}>
            <mesh material={phoneMat}>
              <boxGeometry args={[...PHONE_SPEC.args]} />
            </mesh>
            <pointLight ref={phoneLight} intensity={2.2} distance={6} decay={2} color="#cfe6ff" />
          </group>
        </group>
      </group>
      {/* legs pivot at the hips */}
      <group ref={legL} position={[-0.14, 0.78, 0]}>
        <mesh material={bodyMat} position={[0, -0.39, 0]}>
          <capsuleGeometry args={[...LEG_SPEC.args]} />
        </mesh>
      </group>
      <group ref={legR} position={[0.14, 0.78, 0]}>
        <mesh material={bodyMat} position={[0, -0.39, 0]}>
          <capsuleGeometry args={[...LEG_SPEC.args]} />
        </mesh>
      </group>
    </group>
  );
}
