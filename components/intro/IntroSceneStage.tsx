'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import gsap from 'gsap';
import {
  StudentCharacter3D,
  SculptedPuzzlePiece,
  SculptedCreditCoin,
  SculptedSkillToken,
  SculptedSwapStudyLogo,
} from './ClayPrimitives';

interface IntroSceneStageProps {
  activeScene: number;
  reducedMotion: boolean;
  isCompactViewport: boolean;
}

const CAMERA_PRESETS: Array<{
  pos: [number, number, number];
  lookAt: [number, number, number];
}> = [
  { pos: [0, 1.55, 5.55], lookAt: [0, 1.25, 0] }, // Scene 1: The Problem
  { pos: [0, 1.55, 5.85], lookAt: [0, 1.18, 0.2] }, // Scene 2: The Connection
  { pos: [0.15, 1.82, 5.75], lookAt: [0, 1.1, 0.15] }, // Scene 3: The Exchange
  { pos: [0, 2.38, 7.25], lookAt: [0, 1.05, 0] }, // Scene 4: The Growth
];

function CameraRig({
  activeScene,
  reducedMotion,
  isCompactViewport,
}: {
  activeScene: number;
  reducedMotion: boolean;
  isCompactViewport: boolean;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 1.55, 5.55));
  const lookTarget = useRef(new THREE.Vector3(0, 1.25, 0));
  const desiredPos = useRef(new THREE.Vector3(0, 1.55, 5.55));

  useEffect(() => {
    const preset = CAMERA_PRESETS[activeScene] || CAMERA_PRESETS[0];
    const zOffset = isCompactViewport ? 1.45 : 0;
    const duration = reducedMotion ? 0.05 : 1.05;

    const tween1 = gsap.to(targetPos.current, {
      x: preset.pos[0],
      y: preset.pos[1],
      z: preset.pos[2] + zOffset,
      duration,
      ease: 'power3.inOut',
    });

    const tween2 = gsap.to(lookTarget.current, {
      x: preset.lookAt[0],
      y: preset.lookAt[1],
      z: preset.lookAt[2],
      duration,
      ease: 'power3.inOut',
    });

    return () => {
      tween1.kill();
      tween2.kill();
    };
  }, [activeScene, reducedMotion, isCompactViewport]);

  useFrame((state) => {
    const parallaxScale = reducedMotion ? 0 : 0.2;
    const px = state.pointer.x * parallaxScale;
    const py = state.pointer.y * (parallaxScale * 0.55);

    desiredPos.current.set(
      targetPos.current.x + px,
      targetPos.current.y + py,
      targetPos.current.z
    );
    camera.position.lerp(desiredPos.current, 0.09);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

/**
 * SCENE 1 — THE PROBLEM
 * Curious student with backpack surrounded by Laptop, Palette + Pencil, Camera, and Headphones.
 */
function SceneProblem({ reducedMotion }: { reducedMotion: boolean }) {
  const stageRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const tokensRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (stageRef.current) {
        gsap.fromTo(
          stageRef.current.scale,
          { x: 0.9, y: 0.9, z: 0.9 },
          {
            x: 1,
            y: 1,
            z: 1,
            duration: reducedMotion ? 0.05 : 0.78,
            ease: 'back.out(1.3)',
          }
        );
      }

      if (!reducedMotion && headRef.current && rightArmRef.current) {
        gsap.to(rightArmRef.current.rotation, {
          x: -0.9,
          y: 0.18,
          z: 0.52,
          duration: 0.95,
          ease: 'power2.out',
        });

        gsap
          .timeline({ repeat: -1, yoyo: true })
          .to(headRef.current.rotation, { y: -0.26, z: 0.06, duration: 1.5, ease: 'sine.inOut' })
          .to(headRef.current.rotation, { y: 0.26, z: -0.06, duration: 1.9, ease: 'sine.inOut' })
          .to(headRef.current.rotation, { y: 0, z: 0, duration: 1.2, ease: 'sine.inOut' });
      }

      if (tokensRef.current) {
        gsap.fromTo(
          tokensRef.current.children.map((c) => c.scale),
          { x: 0.01, y: 0.01, z: 0.01 },
          {
            x: 1,
            y: 1,
            z: 1,
            stagger: reducedMotion ? 0 : 0.12,
            duration: reducedMotion ? 0.05 : 0.65,
            ease: 'back.out(1.55)',
          }
        );
      }
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <group ref={stageRef}>
      <StudentCharacter3D
        variant="cobalt-hoodie"
        hairStyle="swoop"
        skinTone="#F2C19E"
        hairColor="#2A221F"
        hasBackpack
        position={[0, 0.02, 0.25]}
        scale={1.06}
        headRef={headRef}
        rightArmRef={rightArmRef}
        disableIdleMotion={reducedMotion}
      />

      {/* Thought Bubble Dots */}
      <group position={[0.72, 1.92, 0.2]}>
        <mesh position={[-0.14, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshPhysicalMaterial color="#EAE3FF" roughness={0.35} />
        </mesh>
        <mesh position={[0.02, -0.04, 0]} castShadow>
          <sphereGeometry args={[0.088, 20, 20]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.35} />
        </mesh>
      </group>

      {/* Four Recognizable Sculpted Floating 3D Skill Objects */}
      <group ref={tokensRef}>
        <SculptedSkillToken kind="coding" position={[-1.68, 1.56, -0.18]} scale={0.96} />
        <SculptedSkillToken kind="design" position={[-0.78, 2.38, -0.52]} scale={0.96} />
        <SculptedSkillToken kind="photography" position={[0.84, 2.36, -0.5]} scale={0.96} />
        <SculptedSkillToken kind="music" position={[1.7, 1.56, -0.18]} scale={0.96} />
      </group>
    </group>
  );
}

/**
 * SCENE 2 — THE CONNECTION
 * Two friendly students smoothly bring Bright Yellow & Cobalt Blue puzzle pieces together.
 */
function SceneConnection({ reducedMotion }: { reducedMotion: boolean }) {
  const leftStudentRef = useRef<THREE.Group>(null);
  const rightStudentRef = useRef<THREE.Group>(null);
  const leftPieceRef = useRef<THREE.Mesh>(null);
  const rightPieceRef = useRef<THREE.Mesh>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);
  const glowCoreRef = useRef<THREE.Mesh>(null);
  const sparkGroupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const dur = reducedMotion ? 0.05 : 1.15;

      if (leftStudentRef.current && rightStudentRef.current) {
        gsap.fromTo(
          leftStudentRef.current.position,
          { x: -1.85 },
          { x: -0.92, duration: dur, ease: 'power3.out' }
        );
        gsap.fromTo(
          rightStudentRef.current.position,
          { x: 1.85 },
          { x: 0.92, duration: dur, ease: 'power3.out' }
        );
      }

      if (leftPieceRef.current && rightPieceRef.current) {
        const tl = gsap.timeline();
        tl.fromTo(
          leftPieceRef.current.position,
          { x: -1.25, y: 1.26 },
          { x: -0.34, y: 1.32, duration: dur, ease: 'power3.inOut' },
          0
        ).fromTo(
          rightPieceRef.current.position,
          { x: 1.25, y: 1.26 },
          { x: 0.34, y: 1.32, duration: dur, ease: 'power3.inOut' },
          0
        );

        if (glowRingRef.current && glowCoreRef.current) {
          tl.fromTo(
            glowCoreRef.current.scale,
            { x: 0.05, y: 0.05, z: 0.05 },
            { x: 1.05, y: 1.05, z: 1.05, duration: reducedMotion ? 0.05 : 0.48, ease: 'back.out(1.8)' },
            dur - 0.1
          ).fromTo(
            glowRingRef.current.scale,
            { x: 0.1, y: 0.1, z: 0.1 },
            {
              x: 2.05,
              y: 2.05,
              z: 2.05,
              duration: reducedMotion ? 0.05 : 1.15,
              ease: 'power2.out',
              repeat: reducedMotion ? 0 : -1,
              repeatDelay: 1.3,
            },
            dur - 0.05
          );
        }

        if (sparkGroupRef.current && !reducedMotion) {
          tl.fromTo(
            sparkGroupRef.current.scale,
            { x: 0.1, y: 0.1, z: 0.1 },
            { x: 1, y: 1, z: 1, duration: 0.55, ease: 'elastic.out(1, 0.55)' },
            dur - 0.05
          );
        }
      }
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    elapsedRef.current += Math.min(delta, 0.1);
    const t = elapsedRef.current;
    if (sparkGroupRef.current) {
      sparkGroupRef.current.rotation.z = t * 0.4;
    }
    if (glowCoreRef.current) {
      const mat = glowCoreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 3.0) * 0.08;
    }
  });

  const sparkPositions = useMemo(
    () =>
      Array.from({ length: 8 }, (_, idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        return [Math.cos(angle) * 0.82, Math.sin(angle) * 0.82, 0] as [number, number, number];
      }),
    []
  );

  return (
    <group>
      {/* Left Student in Crisp White Knit holding Bright Yellow Puzzle Piece */}
      <StudentCharacter3D
        groupRef={leftStudentRef}
        variant="white-knit"
        hairStyle="curls"
        skinTone="#E6AE86"
        hairColor="#25201D"
        position={[-0.92, 0.02, -0.1]}
        rotation={[0, 0.42, 0]}
        rightArmPose={[-0.95, -0.2, -0.25]}
        disableIdleMotion={reducedMotion}
      />

      {/* Right Student in Light Sky Jacket holding Cobalt Blue Puzzle Piece */}
      <StudentCharacter3D
        groupRef={rightStudentRef}
        variant="sky-jacket"
        hairStyle="bob"
        skinTone="#F5CBB0"
        hairColor="#3B302A"
        hasGlasses
        position={[0.92, 0.02, -0.1]}
        rotation={[0, -0.42, 0]}
        leftArmPose={[-0.95, 0.2, 0.25]}
        disableIdleMotion={reducedMotion}
      />

      {/* Interlocking Royal Purple & Electric Blue Jigsaw Pieces */}
      <group position={[0, 0, 0.65]}>
        <SculptedPuzzlePiece
          meshRef={leftPieceRef}
          kind="male"
          color="#7655E8"
          emissive="#EAE3FF"
          emissiveIntensity={0.14}
          position={[-0.34, 1.32, 0]}
        />
        <SculptedPuzzlePiece
          meshRef={rightPieceRef}
          kind="female"
          color="#3979F6"
          emissive="#E1EBFF"
          emissiveIntensity={0.12}
          position={[0.34, 1.32, 0]}
        />

        {/* Lavender Light Halo with Blue/Purple Particles */}
        <mesh ref={glowCoreRef} position={[0, 1.32, -0.05]}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshBasicMaterial color="#EAE3FF" transparent opacity={0.36} />
        </mesh>

        <mesh ref={glowRingRef} position={[0, 1.32, 0.02]}>
          <torusGeometry args={[0.46, 0.015, 12, 48]} />
          <meshBasicMaterial color="#3979F6" transparent opacity={0.44} />
        </mesh>

        <group ref={sparkGroupRef} position={[0, 1.32, 0.08]}>
          {sparkPositions.map((pos, idx) => (
            <mesh key={idx} position={pos}>
              <sphereGeometry args={[0.044, 14, 14]} />
              <meshPhysicalMaterial
                color={idx % 2 === 0 ? '#7655E8' : '#3979F6'}
                emissive="#EAE3FF"
                emissiveIntensity={0.2}
                roughness={0.28}
                clearcoat={0.25}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/**
 * SCENE 3 — THE EXCHANGE
 * Teacher & Learner across white-blue study desk; cobalt skill orb flows out while golden yellow coins return.
 */
function SceneExchange({ reducedMotion }: { reducedMotion: boolean }) {
  const skillOrbRef = useRef<THREE.Mesh>(null);
  const coin1Ref = useRef<THREE.Group>(null);
  const coin2Ref = useRef<THREE.Group>(null);
  const coin3Ref = useRef<THREE.Group>(null);
  const teacherHeadRef = useRef<THREE.Group>(null);
  const learnerHeadRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) return;

      const loop = gsap.timeline({ repeat: -1, repeatDelay: 0.75 });

      const coins = [
        {
          ref: coin1Ref.current,
          targetX: -1.55,
          targetY: 1.15,
          targetZ: 0.53,
          delayOffset: 0,
        },
        {
          ref: coin2Ref.current,
          targetX: -1.42,
          targetY: 1.17,
          targetZ: 0.43,
          delayOffset: 0.18,
        },
        {
          ref: coin3Ref.current,
          targetX: -1.29,
          targetY: 1.15,
          targetZ: 0.53,
          delayOffset: 0.36,
        },
      ];

      // Ensure teacher starts with zero coins on the left tray at the beginning of every cycle
      coins.forEach(({ ref }) => {
        if (!ref) return;
        loop
          .set(ref.position, { x: 0.72, y: 1.15, z: 0.45 }, 0)
          .set(ref.scale, { x: 0, y: 0, z: 0 }, 0)
          .set(ref.rotation, { x: 0, y: 0, z: 0 }, 0);
      });

      if (skillOrbRef.current) {
        loop
          .set(skillOrbRef.current.position, { x: -0.95, y: 1.35, z: 0.45 }, 0)
          .set(skillOrbRef.current.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0)
          .to(
            skillOrbRef.current.scale,
            { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(1.8)' },
            0
          )
          .to(
            skillOrbRef.current.position,
            {
              x: 0.0,
              y: 1.82,
              z: 0.45,
              duration: 0.55,
              ease: 'sine.out',
            },
            0.35
          )
          .to(
            skillOrbRef.current.position,
            {
              x: 0.88,
              y: 1.15,
              z: 0.4,
              duration: 0.55,
              ease: 'sine.in',
            },
            0.9
          )
          .to(
            skillOrbRef.current.scale,
            { x: 0.001, y: 0.001, z: 0.001, duration: 0.2 },
            1.45
          );
      }

      // Earn & return coins only AFTER the knowledge orb has reached the learner (t >= 1.6s)
      coins.forEach(({ ref, targetX, targetY, targetZ, delayOffset }) => {
        if (!ref) return;
        const startAt = 1.6 + delayOffset;
        loop
          .to(
            ref.scale,
            { x: 0.82, y: 0.82, z: 0.82, duration: 0.28, ease: 'back.out(1.8)' },
            startAt
          )
          .to(
            ref.position,
            { x: -0.25, y: 2.12, z: 0.55, duration: 0.48, ease: 'power1.out' },
            startAt + 0.12
          )
          .to(
            ref.position,
            { x: targetX, y: targetY, z: targetZ, duration: 0.48, ease: 'bounce.out' },
            startAt + 0.6
          )
          .to(
            ref.rotation,
            { y: Math.PI * 2, duration: 0.9, ease: 'power1.inOut' },
            startAt + 0.12
          );
      });

      if (teacherHeadRef.current && learnerHeadRef.current) {
        gsap.to([teacherHeadRef.current.rotation, learnerHeadRef.current.rotation], {
          x: 0.09,
          duration: 1.25,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <group>
      {/* Teacher Student (Cobalt Blue Hoodie) */}
      <StudentCharacter3D
        variant="cobalt-hoodie"
        hairStyle="bun"
        skinTone="#E7AF89"
        hairColor="#2A221F"
        position={[-1.08, 0.02, -0.05]}
        rotation={[0, 0.55, 0]}
        rightArmPose={[-0.75, -0.35, -0.3]}
        headRef={teacherHeadRef}
        disableIdleMotion={reducedMotion}
      />

      {/* Learner Student (Crisp White Knit) */}
      <StudentCharacter3D
        variant="white-knit"
        hairStyle="short"
        skinTone="#F5C9AC"
        hairColor="#3B302A"
        hasGlasses
        position={[1.08, 0.02, -0.05]}
        rotation={[0, -0.55, 0]}
        leftArmPose={[-0.65, 0.25, 0.2]}
        headRef={learnerHeadRef}
        disableIdleMotion={reducedMotion}
      />

      {/* White & Lavender-Blue Study Table */}
      <group position={[0, 0, 0.45]}>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.92, 0.92, 0.09, 40]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.36} clearcoat={0.16} />
        </mesh>
        <mesh position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.018, 12, 48]} />
          <meshPhysicalMaterial color="#EAE3FF" roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.24, 0.9, 24]} />
          <meshPhysicalMaterial color="#3979F6" roughness={0.45} />
        </mesh>

        {/* Open Study Tablet on Desk */}
        <group position={[0.38, 1.0, 0]} rotation={[0.18, -0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.03, 0.3]} />
            <meshPhysicalMaterial color="#7655E8" roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.36, 0.015, 0.24]} />
            <meshPhysicalMaterial color="#F1F6FF" roughness={0.28} />
          </mesh>
        </group>

        {/* Crisp Lavender-White Teacher Credit Tray Pedestal */}
        <mesh position={[-1.42, 0.88, 0.05]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.14, 28]} />
          <meshPhysicalMaterial color="#F5F1FF" roughness={0.38} clearcoat={0.16} />
        </mesh>
      </group>

      {/* Electric Blue Skill Knowledge Orb */}
      <mesh
        ref={skillOrbRef}
        position={reducedMotion ? [0, 1.5, 0.45] : [-0.95, 1.35, 0.45]}
        scale={reducedMotion ? 1 : 0.01}
        castShadow
      >
        <sphereGeometry args={[0.135, 24, 24]} />
        <meshPhysicalMaterial
          color="#3979F6"
          emissive="#E1EBFF"
          emissiveIntensity={0.3}
          roughness={0.24}
          clearcoat={0.32}
        />
      </mesh>

      {/* Three Sculpted Golden-Yellow Credit Coins (start hidden on learner side until orb arrives) */}
      <SculptedCreditCoin
        groupRef={coin1Ref}
        position={reducedMotion ? [-1.55, 1.15, 0.53] : [0.72, 1.15, 0.45]}
        scale={reducedMotion ? 0.82 : 0}
      />
      <SculptedCreditCoin
        groupRef={coin2Ref}
        position={reducedMotion ? [-1.42, 1.17, 0.43] : [0.72, 1.15, 0.45]}
        scale={reducedMotion ? 0.82 : 0}
      />
      <SculptedCreditCoin
        groupRef={coin3Ref}
        position={reducedMotion ? [-1.29, 1.15, 0.53] : [0.72, 1.15, 0.45]}
        scale={reducedMotion ? 0.82 : 0}
      />
    </group>
  );
}

/**
 * SCENE 4 — THE GROWTH
 * Five diverse visible students connected around a sculpted SwapStudy 3D logo reveal.
 */
function SceneGrowth({ reducedMotion }: { reducedMotion: boolean }) {
  const communityRef = useRef<THREE.Group>(null);
  const pulse1Ref = useRef<THREE.Mesh>(null);
  const pulse2Ref = useRef<THREE.Mesh>(null);
  const logoBadgeRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  const peers = useMemo(
    () => [
      {
        variant: 'cobalt-hoodie' as const,
        hairStyle: 'swoop' as const,
        skin: '#F3C19E',
        hair: '#2A221F',
        pos: [-2.12, 0.02, -0.35] as [number, number, number],
        rotY: 0.68,
        glasses: false,
        headphones: false,
      },
      {
        variant: 'white-knit' as const,
        hairStyle: 'curls' as const,
        skin: '#DFA178',
        hair: '#25201D',
        pos: [-1.14, 0.02, -1.28] as [number, number, number],
        rotY: 0.34,
        glasses: false,
        headphones: true,
      },
      {
        variant: 'yellow-sweater' as const,
        hairStyle: 'bob' as const,
        skin: '#F6CDB2',
        hair: '#3B302A',
        pos: [0, 0.02, -1.58] as [number, number, number],
        rotY: 0,
        glasses: true,
        headphones: false,
      },
      {
        variant: 'sky-jacket' as const,
        hairStyle: 'short' as const,
        skin: '#E6AE89',
        hair: '#2B231F',
        pos: [1.14, 0.02, -1.28] as [number, number, number],
        rotY: -0.34,
        glasses: false,
        headphones: false,
      },
      {
        variant: 'deep-blue-cardigan' as const,
        hairStyle: 'bun' as const,
        skin: '#F1BE9B',
        hair: '#25201D',
        pos: [2.12, 0.02, -0.35] as [number, number, number],
        rotY: -0.68,
        glasses: false,
        headphones: false,
      },
    ],
    []
  );

  const { arcCurves, arcGeometries } = useMemo(() => {
    const hubAnchor = new THREE.Vector3(0, 0.68, 0.72);
    const links: Array<[THREE.Vector3, THREE.Vector3, string]> = [
      [new THREE.Vector3(-2.12, 1.38, -0.35), new THREE.Vector3(-1.14, 1.38, -1.28), '#7655E8'],
      [new THREE.Vector3(-1.14, 1.38, -1.28), new THREE.Vector3(0, 1.38, -1.58), '#3979F6'],
      [new THREE.Vector3(0, 1.38, -1.58), new THREE.Vector3(1.14, 1.38, -1.28), '#EAE3FF'],
      [new THREE.Vector3(1.14, 1.38, -1.28), new THREE.Vector3(2.12, 1.38, -0.35), '#7655E8'],
      [new THREE.Vector3(-2.12, 1.3, -0.35), hubAnchor, '#7655E8'],
      [new THREE.Vector3(2.12, 1.3, -0.35), hubAnchor, '#3979F6'],
    ];

    const curves: THREE.CatmullRomCurve3[] = [];
    const geos: Array<{ geo: THREE.TubeGeometry; color: string }> = [];

    links.forEach(([start, end, color]) => {
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.y += 0.48;
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      curves.push(curve);
      geos.push({
        geo: new THREE.TubeGeometry(curve, 24, 0.02, 8, false),
        color,
      });
    });

    return { arcCurves: curves, arcGeometries: geos };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (communityRef.current) {
        gsap.fromTo(
          communityRef.current.children.map((c) => c.scale),
          { x: 0.08, y: 0.08, z: 0.08 },
          {
            x: 0.92,
            y: 0.92,
            z: 0.92,
            stagger: reducedMotion ? 0 : 0.09,
            duration: reducedMotion ? 0.05 : 0.72,
            ease: 'back.out(1.45)',
          }
        );
      }

      if (logoBadgeRef.current) {
        gsap.fromTo(
          logoBadgeRef.current.scale,
          { x: 0.05, y: 0.05, z: 0.05 },
          {
            x: 0.92,
            y: 0.92,
            z: 0.92,
            delay: reducedMotion ? 0 : 0.35,
            duration: reducedMotion ? 0.05 : 0.85,
            ease: 'elastic.out(1, 0.7)',
          }
        );
      }
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    elapsedRef.current += Math.min(delta, 0.1);
    const t = elapsedRef.current;
    if (logoBadgeRef.current) {
      logoBadgeRef.current.position.y = 0.68 + Math.sin(t * 1.6) * 0.045;
      logoBadgeRef.current.rotation.y = Math.sin(t * 0.75) * 0.18;
    }
    if (pulse1Ref.current && arcCurves[4]) {
      const u = (t * 0.38) % 1;
      arcCurves[4].getPointAt(u, pulse1Ref.current.position);
    }
    if (pulse2Ref.current && arcCurves[5]) {
      const u = (t * 0.38 + 0.5) % 1;
      arcCurves[5].getPointAt(u, pulse2Ref.current.position);
    }
  });

  return (
    <group>
      {/* Five Diverse Visible Students */}
      <group ref={communityRef}>
        {peers.map((peer, idx) => (
          <StudentCharacter3D
            key={idx}
            variant={peer.variant}
            hairStyle={peer.hairStyle}
            skinTone={peer.skin}
            hairColor={peer.hair}
            hasGlasses={peer.glasses}
            hasHeadphones={peer.headphones}
            position={peer.pos}
            rotation={[0, peer.rotY, 0]}
            breathPhase={idx * 0.9}
            scale={0.92}
            disableIdleMotion={reducedMotion}
          />
        ))}
      </group>

      {/* Cobalt Blue & Bright Yellow Skill Network Bridges */}
      {arcGeometries.map((item, idx) => (
        <mesh key={idx} geometry={item.geo}>
          <meshPhysicalMaterial color={item.color} roughness={0.3} clearcoat={0.18} />
        </mesh>
      ))}

      {/* Traveling Knowledge Beads */}
      <mesh ref={pulse1Ref}>
        <sphereGeometry args={[0.068, 16, 16]} />
        <meshPhysicalMaterial color="#7655E8" roughness={0.28} />
      </mesh>
      <mesh ref={pulse2Ref}>
        <sphereGeometry args={[0.068, 16, 16]} />
        <meshPhysicalMaterial color="#3979F6" roughness={0.28} />
      </mesh>

      {/* Foreground SwapStudy 3D Logo Reveal (positioned below peer faces) */}
      <SculptedSwapStudyLogo groupRef={logoBadgeRef} position={[0, 0.68, 0.72]} scale={0.92} />
    </group>
  );
}

interface SceneBackdropSpec {
  plinth: string;
  ring: string;
  rimTint: string;
  plinthRadius: number;
}

const SCENE_BACKDROPS: SceneBackdropSpec[] = [
  // Scene 0 (01 · The Problem): Warm Library Study Corner
  {
    plinth: '#FFFFFF',
    ring: '#7655E8',
    rimTint: '#EAE3FF',
    plinthRadius: 2.95,
  },
  // Scene 1 (02 · The Connection): Sunlit Courtyard Quad
  {
    plinth: '#FFFFFF',
    ring: '#3979F6',
    rimTint: '#E1EBFF',
    plinthRadius: 3.15,
  },
  // Scene 2 (03 · The Exchange): Sunny Makers' Terrace
  {
    plinth: '#FFFFFF',
    ring: '#7655E8',
    rimTint: '#EAE3FF',
    plinthRadius: 3.1,
  },
  // Scene 3 (04 · The Growth): Grand Campus Amphitheater Lawn
  {
    plinth: '#FFFFFF',
    ring: '#3979F6',
    rimTint: '#E1EBFF',
    plinthRadius: 3.55,
  },
];

function SceneEnvironmentBackdrop({ activeScene }: { activeScene: number }) {
  const backdrop = SCENE_BACKDROPS[activeScene] || SCENE_BACKDROPS[0];

  return (
    <group position={[0, -0.02, 0]}>
      {/* Grounded Floating Stage Plinth with Scene-Specific Accent Ring */}
      <mesh receiveShadow position={[0, -0.04, -0.1]}>
        <cylinderGeometry
          args={[backdrop.plinthRadius, backdrop.plinthRadius + 0.12, 0.08, 64]}
        />
        <meshPhysicalMaterial
          color={backdrop.plinth}
          roughness={0.62}
          clearcoat={0.12}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, -0.015, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[backdrop.plinthRadius - 0.02, backdrop.plinthRadius + 0.08, 64]} />
        <meshBasicMaterial color={backdrop.ring} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export default function IntroSceneStage({
  activeScene,
  reducedMotion,
  isCompactViewport,
}: IntroSceneStageProps) {
  const activeBackdrop = SCENE_BACKDROPS[activeScene] || SCENE_BACKDROPS[0];

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.55, 5.55], fov: isCompactViewport ? 44 : 38 }}
      className="w-full h-full touch-pan-y"
    >
      {/* Bright Three-Point Studio Lighting with Scene-Tuned Bounce */}
      <hemisphereLight args={['#FFFFFF', activeBackdrop.rimTint, 1.32]} />
      <directionalLight
        position={[4.2, 7.2, 6.2]}
        intensity={1.75}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-4.5, 4.5, -3.5]} intensity={0.98} color="#E1EBFF" />
      <pointLight position={[2.2, 2.5, 3.8]} intensity={0.65} color="#EAE3FF" />

      {/* Local Procedural Softbox Reflections */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.65}
          color="#FFFFFF"
          scale={[8, 4, 1]}
          position={[0, 5, 3]}
          rotation={[Math.PI / 2.5, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#E1EBFF"
          scale={[6, 4, 1]}
          position={[-5, 2, -2]}
          rotation={[0, Math.PI / 3, 0]}
        />
        <Lightformer
          form="circle"
          intensity={1.3}
          color="#EAE3FF"
          scale={4}
          position={[5, 3, 1]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Environment>

      <CameraRig
        activeScene={activeScene}
        reducedMotion={reducedMotion}
        isCompactViewport={isCompactViewport}
      />

      <SceneEnvironmentBackdrop activeScene={activeScene} />

      <ContactShadows
        position={[0, 0.01, -0.1]}
        opacity={0.2}
        scale={10.5}
        blur={2.6}
        far={4.2}
        color="#4C389C"
      />

      {activeScene === 0 && <SceneProblem reducedMotion={reducedMotion} />}
      {activeScene === 1 && <SceneConnection reducedMotion={reducedMotion} />}
      {activeScene === 2 && <SceneExchange reducedMotion={reducedMotion} />}
      {activeScene === 3 && <SceneGrowth reducedMotion={reducedMotion} />}
    </Canvas>
  );
}
