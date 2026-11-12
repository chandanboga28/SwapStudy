'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export type CharacterStyleVariant =
  | 'cobalt-hoodie'
  | 'white-knit'
  | 'yellow-sweater'
  | 'sky-jacket'
  | 'deep-blue-cardigan';

export type HairStyle = 'swoop' | 'bob' | 'curls' | 'bun' | 'short';

export interface StudentCharacterProps {
  variant?: CharacterStyleVariant;
  hairStyle?: HairStyle;
  skinTone?: string;
  hairColor?: string;
  hasGlasses?: boolean;
  hasHeadphones?: boolean;
  hasBackpack?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  leftArmPose?: [number, number, number];
  rightArmPose?: [number, number, number];
  headTilt?: [number, number, number];
  breathPhase?: number;
  disableIdleMotion?: boolean;
  groupRef?: React.RefObject<THREE.Group | null>;
  headRef?: React.RefObject<THREE.Group | null>;
  leftArmRef?: React.RefObject<THREE.Group | null>;
  rightArmRef?: React.RefObject<THREE.Group | null>;
  leftHandSlot?: React.ReactNode;
  rightHandSlot?: React.ReactNode;
}

const OUTFIT_COLORS: Record<
  CharacterStyleVariant,
  {
    primary: string;
    trim: string;
    pocket: string;
    pants: string;
    shoe: string;
    sole: string;
  }
> = {
  'cobalt-hoodie': {
    primary: '#7655E8',
    trim: '#FFFFFF',
    pocket: '#6040D4',
    pants: '#242044',
    shoe: '#FFFFFF',
    sole: '#3979F6',
  },
  'white-knit': {
    primary: '#F5F1FF',
    trim: '#7655E8',
    pocket: '#EAE3FF',
    pants: '#3979F6',
    shoe: '#FFFFFF',
    sole: '#7655E8',
  },
  'yellow-sweater': {
    primary: '#3979F6',
    trim: '#FFFFFF',
    pocket: '#2B64D6',
    pants: '#242044',
    shoe: '#FFFFFF',
    sole: '#7655E8',
  },
  'sky-jacket': {
    primary: '#E1EBFF',
    trim: '#FFFFFF',
    pocket: '#C4D7FF',
    pants: '#242044',
    shoe: '#FFFFFF',
    sole: '#7655E8',
  },
  'deep-blue-cardigan': {
    primary: '#D7CAFF',
    trim: '#3979F6',
    pocket: '#C2B0FC',
    pants: '#242044',
    shoe: '#FFFFFF',
    sole: '#E1EBFF',
  },
};

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const radius = Math.min(r, hw, hh);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + radius, -hh);
  shape.lineTo(hw - radius, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);
  shape.lineTo(hw, hh - radius);
  shape.quadraticCurveTo(hw, hh, hw - radius, hh);
  shape.lineTo(-hw + radius, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);
  shape.lineTo(-hw, -hh + radius);
  shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
  shape.closePath();
  return shape;
}

function createCurvedArmGeometry(mirrorSign: 1 | -1) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(mirrorSign * 0.11, -0.22, 0.08),
    new THREE.Vector3(mirrorSign * 0.08, -0.44, 0.24),
  ]);
  return new THREE.TubeGeometry(curve, 22, 0.074, 16, false);
}

function createLegGeometry() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.24, 0.02),
    new THREE.Vector3(0, -0.48, 0),
  ]);
  return new THREE.TubeGeometry(curve, 18, 0.09, 16, false);
}

function createTorsoLatheGeometry() {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.01, -0.35),
    new THREE.Vector2(0.25, -0.34),
    new THREE.Vector2(0.32, -0.22),
    new THREE.Vector2(0.335, 0.03),
    new THREE.Vector2(0.285, 0.25),
    new THREE.Vector2(0.175, 0.36),
    new THREE.Vector2(0.01, 0.38),
  ];
  return new THREE.LatheGeometry(pts, 36);
}

function createShoeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.082, -0.115);
  shape.quadraticCurveTo(0, -0.145, 0.082, -0.115);
  shape.quadraticCurveTo(0.112, 0.02, 0.092, 0.145);
  shape.quadraticCurveTo(0, 0.21, -0.092, 0.145);
  shape.quadraticCurveTo(-0.112, 0.02, -0.082, -0.115);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelThickness: 0.038,
    bevelSize: 0.03,
    bevelSegments: 6,
    curveSegments: 18,
  });
  geo.rotateX(Math.PI / 2);
  geo.center();
  return geo;
}

export function StudentCharacter3D({
  variant = 'cobalt-hoodie',
  hairStyle = 'swoop',
  skinTone = '#F3C3A1',
  hairColor = '#2A221F',
  hasGlasses = false,
  hasHeadphones = false,
  hasBackpack = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  leftArmPose = [0, 0, 0.12],
  rightArmPose = [0, 0, -0.12],
  headTilt = [0, 0, 0],
  breathPhase = 0,
  disableIdleMotion = false,
  groupRef,
  headRef,
  leftArmRef,
  rightArmRef,
  leftHandSlot,
  rightHandSlot,
}: StudentCharacterProps) {
  const internalBreathRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const blinkTimerRef = useRef(0);

  const palette = OUTFIT_COLORS[variant];
  const isHoodieVariant = variant === 'cobalt-hoodie' || variant === 'deep-blue-cardigan';

  const { torsoGeo, leftArmGeo, rightArmGeo, legGeo, shoeGeo, smileGeo, pocketGeo } =
    useMemo(() => {
      const torso = createTorsoLatheGeometry();
      const lArm = createCurvedArmGeometry(-1);
      const rArm = createCurvedArmGeometry(1);
      const leg = createLegGeometry();
      const shoe = createShoeGeometry();

      const smileCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.078, -0.095, 0.425),
        new THREE.Vector3(0, -0.145, 0.442),
        new THREE.Vector3(0.078, -0.095, 0.425)
      );
      const smile = new THREE.TubeGeometry(smileCurve, 14, 0.014, 8, false);

      const pocketShape = createRoundedRectShape(0.28, 0.15, 0.045);
      const pocket = new THREE.ExtrudeGeometry(pocketShape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 4,
      });
      pocket.center();

      return {
        torsoGeo: torso,
        leftArmGeo: lArm,
        rightArmGeo: rArm,
        legGeo: leg,
        shoeGeo: shoe,
        smileGeo: smile,
        pocketGeo: pocket,
      };
    }, []);

  useFrame((_, delta) => {
    if (disableIdleMotion) return;
    blinkTimerRef.current += Math.min(delta, 0.1);
    const t = blinkTimerRef.current + breathPhase;
    if (internalBreathRef.current) {
      internalBreathRef.current.position.y = Math.sin(t * 1.9) * 0.022;
    }
    const cycle = blinkTimerRef.current % 4.1;
    const blinkScale = cycle > 3.92 && cycle < 4.07 ? 0.12 : 1;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(
        leftEyeRef.current.scale.y,
        blinkScale,
        0.45
      );
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(
        rightEyeRef.current.scale.y,
        blinkScale,
        0.45
      );
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <group ref={internalBreathRef}>
        {/* Legs & Sculpted Two-Tone Clay Sneakers */}
        <group position={[0, 0.56, 0]}>
          {[-0.135, 0.135].map((legX, idx) => (
            <group key={idx} position={[legX, 0, 0]}>
              <mesh geometry={legGeo} castShadow receiveShadow>
                <meshPhysicalMaterial
                  color={palette.pants}
                  roughness={0.65}
                  sheen={0.22}
                  sheenColor="#DCE7FF"
                />
              </mesh>
              {/* Trouser Cuff */}
              <mesh position={[0, -0.43, 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[0.092, 0.024, 12, 24]} />
                <meshPhysicalMaterial color={palette.pants} roughness={0.62} />
              </mesh>
              {/* White Sneaker Upper */}
              <mesh geometry={shoeGeo} position={[0, -0.5, 0.05]} castShadow receiveShadow>
                <meshPhysicalMaterial
                  color={palette.shoe}
                  roughness={0.38}
                  clearcoat={0.12}
                  sheen={0.2}
                />
              </mesh>
              {/* Cobalt Blue / Light Blue Sneaker Sole Accent */}
              <mesh
                geometry={shoeGeo}
                position={[0, -0.54, 0.05]}
                scale={[1.05, 0.34, 1.05]}
                castShadow
                receiveShadow
              >
                <meshPhysicalMaterial color={palette.sole} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Soft Clay Hoodie / Knit Sweater Torso */}
        <group position={[0, 0.89, 0]}>
          <mesh geometry={torsoGeo} castShadow receiveShadow>
            <meshPhysicalMaterial
              color={palette.primary}
              roughness={0.54}
              metalness={0.01}
              sheen={0.42}
              sheenRoughness={0.65}
              sheenColor="#FFFFFF"
              clearcoat={0.04}
            />
          </mesh>

          {/* Ribbed Sweater Hem Band */}
          <mesh position={[0, -0.29, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.275, 0.045, 14, 32]} />
            <meshPhysicalMaterial color={palette.trim} roughness={0.55} sheen={0.25} />
          </mesh>

          {/* Rolled Collar Trim */}
          <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.158, 0.052, 16, 32]} />
            <meshPhysicalMaterial color={palette.trim} roughness={0.5} sheen={0.25} />
          </mesh>

          {/* Hoodie Front Pocket & Cream Drawstrings */}
          {isHoodieVariant && (
            <group>
              {/* Soft Back Hood */}
              <mesh position={[0, 0.29, -0.18]} rotation={[0.45, 0, 0]} castShadow>
                <torusGeometry args={[0.175, 0.075, 16, 28, Math.PI]} />
                <meshPhysicalMaterial
                  color={palette.primary}
                  roughness={0.54}
                  sheen={0.32}
                  sheenColor="#FFFFFF"
                />
              </mesh>
              {/* Front Kangaroo Pocket */}
              <mesh
                geometry={pocketGeo}
                position={[0, -0.14, 0.29]}
                rotation={[-0.12, 0, 0]}
                castShadow
              >
                <meshPhysicalMaterial color={palette.pocket} roughness={0.55} sheen={0.28} />
              </mesh>
              {/* Drawstring Cords */}
              <mesh position={[-0.06, 0.2, 0.265]} rotation={[0.2, 0, 0.06]} castShadow>
                <capsuleGeometry args={[0.012, 0.14, 6, 12]} />
                <meshPhysicalMaterial color={palette.trim} roughness={0.45} />
              </mesh>
              <mesh position={[0.06, 0.2, 0.265]} rotation={[0.2, 0, -0.06]} castShadow>
                <capsuleGeometry args={[0.012, 0.14, 6, 12]} />
                <meshPhysicalMaterial color={palette.trim} roughness={0.45} />
              </mesh>
            </group>
          )}

          {/* Optional Clay Campus Backpack (White + Electric Blue + Royal Purple) */}
          {hasBackpack && (
            <group position={[0, 0.03, -0.34]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.38, 0.42, 0.18]} />
                <meshPhysicalMaterial color="#FFFFFF" roughness={0.48} sheen={0.25} />
              </mesh>
              <mesh position={[0, 0.11, -0.02]} castShadow>
                <boxGeometry args={[0.4, 0.18, 0.2]} />
                <meshPhysicalMaterial color="#3979F6" roughness={0.5} />
              </mesh>
              <mesh position={[0, -0.08, -0.095]} castShadow>
                <boxGeometry args={[0.26, 0.15, 0.06]} />
                <meshPhysicalMaterial color="#7655E8" roughness={0.46} />
              </mesh>
              {/* Shoulder straps */}
              <mesh position={[-0.17, 0.08, 0.18]} rotation={[0.15, 0, 0]} castShadow>
                <boxGeometry args={[0.06, 0.34, 0.22]} />
                <meshPhysicalMaterial color="#3979F6" roughness={0.52} />
              </mesh>
              <mesh position={[0.17, 0.08, 0.18]} rotation={[0.15, 0, 0]} castShadow>
                <boxGeometry args={[0.06, 0.34, 0.22]} />
                <meshPhysicalMaterial color="#3979F6" roughness={0.52} />
              </mesh>
            </group>
          )}

          {/* Left Articulated Arm */}
          <group ref={leftArmRef} position={[-0.3, 0.2, 0]} rotation={leftArmPose}>
            <mesh castShadow>
              <sphereGeometry args={[0.084, 20, 20]} />
              <meshPhysicalMaterial
                color={palette.primary}
                roughness={0.54}
                sheen={0.35}
                sheenColor="#FFFFFF"
              />
            </mesh>
            <mesh geometry={leftArmGeo} castShadow receiveShadow>
              <meshPhysicalMaterial
                color={palette.primary}
                roughness={0.54}
                sheen={0.35}
                sheenColor="#FFFFFF"
              />
            </mesh>
            {/* Left Wrist Cuff */}
            <mesh position={[-0.08, -0.44, 0.24]} rotation={[1.2, 0, 0.2]}>
              <torusGeometry args={[0.064, 0.023, 12, 24]} />
              <meshPhysicalMaterial color={palette.trim} roughness={0.5} />
            </mesh>
            {/* Soft Sculpted Hand + Thumb */}
            <group position={[-0.09, -0.48, 0.28]}>
              <mesh castShadow>
                <sphereGeometry args={[0.074, 24, 24]} />
                <meshPhysicalMaterial
                  color={skinTone}
                  roughness={0.44}
                  sheen={0.32}
                  sheenColor="#FFF0E4"
                />
              </mesh>
              <mesh position={[0.055, 0.025, 0.02]} castShadow>
                <sphereGeometry args={[0.032, 16, 16]} />
                <meshPhysicalMaterial color={skinTone} roughness={0.44} />
              </mesh>
              {leftHandSlot}
            </group>
          </group>

          {/* Right Articulated Arm */}
          <group ref={rightArmRef} position={[0.3, 0.2, 0]} rotation={rightArmPose}>
            <mesh castShadow>
              <sphereGeometry args={[0.084, 20, 20]} />
              <meshPhysicalMaterial
                color={palette.primary}
                roughness={0.54}
                sheen={0.35}
                sheenColor="#FFFFFF"
              />
            </mesh>
            <mesh geometry={rightArmGeo} castShadow receiveShadow>
              <meshPhysicalMaterial
                color={palette.primary}
                roughness={0.54}
                sheen={0.35}
                sheenColor="#FFFFFF"
              />
            </mesh>
            {/* Right Wrist Cuff */}
            <mesh position={[0.08, -0.44, 0.24]} rotation={[1.2, 0, -0.2]}>
              <torusGeometry args={[0.064, 0.023, 12, 24]} />
              <meshPhysicalMaterial color={palette.trim} roughness={0.5} />
            </mesh>
            {/* Soft Sculpted Hand + Thumb */}
            <group position={[0.09, -0.48, 0.28]}>
              <mesh castShadow>
                <sphereGeometry args={[0.074, 24, 24]} />
                <meshPhysicalMaterial
                  color={skinTone}
                  roughness={0.44}
                  sheen={0.32}
                  sheenColor="#FFF0E4"
                />
              </mesh>
              <mesh position={[-0.055, 0.025, 0.02]} castShadow>
                <sphereGeometry args={[0.032, 16, 16]} />
                <meshPhysicalMaterial color={skinTone} roughness={0.44} />
              </mesh>
              {rightHandSlot}
            </group>
          </group>

          {/* Neck & Sculpted Friendly Clay Head */}
          <group ref={headRef} position={[0, 0.42, 0]} rotation={headTilt}>
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.095, 0.112, 0.14, 22]} />
              <meshPhysicalMaterial color={skinTone} roughness={0.44} />
            </mesh>

            <group position={[0, 0.34, 0]}>
              {/* Main Soft Sculpted Head Volume */}
              <mesh scale={[1.03, 1.05, 0.98]} castShadow receiveShadow>
                <sphereGeometry args={[0.415, 42, 34]} />
                <meshPhysicalMaterial
                  color={skinTone}
                  roughness={0.42}
                  sheen={0.38}
                  sheenRoughness={0.6}
                  sheenColor="#FFF0E4"
                  clearcoat={0.04}
                />
              </mesh>

              {/* Soft Ears with Inner Depth */}
              <mesh position={[-0.405, -0.02, -0.02]} scale={[0.7, 1, 0.7]} castShadow>
                <sphereGeometry args={[0.092, 20, 20]} />
                <meshPhysicalMaterial color={skinTone} roughness={0.44} />
              </mesh>
              <mesh position={[0.405, -0.02, -0.02]} scale={[0.7, 1, 0.7]} castShadow>
                <sphereGeometry args={[0.092, 20, 20]} />
                <meshPhysicalMaterial color={skinTone} roughness={0.44} />
              </mesh>

              {/* Expressive Eyes with Natural Dark Irises & Twin Specular Glints */}
              <group position={[0, 0.03, 0.388]}>
                <group ref={leftEyeRef} position={[-0.138, 0, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.045, 20, 20]} />
                    <meshPhysicalMaterial color="#2F261F" roughness={0.18} clearcoat={0.85} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]}>
                    <sphereGeometry args={[0.032, 16, 16]} />
                    <meshBasicMaterial color="#1B1613" />
                  </mesh>
                  <mesh position={[-0.014, 0.016, 0.036]}>
                    <sphereGeometry args={[0.012, 10, 10]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                  <mesh position={[0.012, -0.012, 0.036]}>
                    <sphereGeometry args={[0.0055, 8, 8]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                </group>

                <group ref={rightEyeRef} position={[0.138, 0, 0]}>
                  <mesh>
                    <sphereGeometry args={[0.045, 20, 20]} />
                    <meshPhysicalMaterial color="#2F261F" roughness={0.18} clearcoat={0.85} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]}>
                    <sphereGeometry args={[0.032, 16, 16]} />
                    <meshBasicMaterial color="#1B1613" />
                  </mesh>
                  <mesh position={[-0.014, 0.016, 0.036]}>
                    <sphereGeometry args={[0.012, 10, 10]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                  <mesh position={[0.012, -0.012, 0.036]}>
                    <sphereGeometry args={[0.0055, 8, 8]} />
                    <meshBasicMaterial color="#FFFFFF" />
                  </mesh>
                </group>

                {/* Friendly Soft Eyebrows */}
                <mesh position={[-0.138, 0.09, -0.01]} rotation={[0, 0, 0.14]}>
                  <capsuleGeometry args={[0.015, 0.058, 6, 12]} />
                  <meshPhysicalMaterial color={hairColor} roughness={0.55} />
                </mesh>
                <mesh position={[0.138, 0.09, -0.01]} rotation={[0, 0, -0.14]}>
                  <capsuleGeometry args={[0.015, 0.058, 6, 12]} />
                  <meshPhysicalMaterial color={hairColor} roughness={0.55} />
                </mesh>
              </group>

              {/* Soft Button Nose & Warm Cheek Blush */}
              <mesh position={[0, -0.025, 0.422]} scale={[1.05, 0.85, 0.9]}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshPhysicalMaterial color={skinTone} roughness={0.42} />
              </mesh>
              <mesh position={[-0.215, -0.06, 0.34]} scale={[1.3, 0.85, 0.5]}>
                <sphereGeometry args={[0.052, 16, 16]} />
                <meshPhysicalMaterial color="#E6A492" roughness={0.55} />
              </mesh>
              <mesh position={[0.215, -0.06, 0.34]} scale={[1.3, 0.85, 0.5]}>
                <sphereGeometry args={[0.052, 16, 16]} />
                <meshPhysicalMaterial color="#E6A492" roughness={0.55} />
              </mesh>

              {/* Warm Clay Smile */}
              <mesh geometry={smileGeo}>
                <meshPhysicalMaterial color="#9E5B4C" roughness={0.45} />
              </mesh>

              {/* Royal Purple Clay Glasses */}
              {hasGlasses && (
                <group position={[0, 0.03, 0.422]}>
                  <mesh position={[-0.142, 0, 0]}>
                    <torusGeometry args={[0.092, 0.014, 12, 28]} />
                    <meshPhysicalMaterial color="#7655E8" roughness={0.3} metalness={0.18} />
                  </mesh>
                  <mesh position={[0.142, 0, 0]}>
                    <torusGeometry args={[0.092, 0.014, 12, 28]} />
                    <meshPhysicalMaterial color="#7655E8" roughness={0.3} metalness={0.18} />
                  </mesh>
                  <mesh position={[0, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.01, 0.01, 0.09, 10]} />
                    <meshPhysicalMaterial color="#7655E8" roughness={0.3} metalness={0.18} />
                  </mesh>
                </group>
              )}

              {/* Natural Dark Sculpted Clay Hair Styles */}
              <group>
                {/* Crown + Back Taper */}
                <mesh position={[0, 0.13, -0.04]} scale={[1.08, 0.96, 1.08]} castShadow>
                  <sphereGeometry args={[0.42, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
                  <meshPhysicalMaterial
                    color={hairColor}
                    roughness={0.54}
                    sheen={0.28}
                    sheenColor="#EAE3FF"
                  />
                </mesh>

                {hairStyle === 'swoop' && (
                  <>
                    <mesh
                      position={[0.12, 0.31, 0.24]}
                      rotation={[0.45, -0.25, -0.35]}
                      scale={[1.45, 0.78, 0.92]}
                      castShadow
                    >
                      <sphereGeometry args={[0.17, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.52} />
                    </mesh>
                    <mesh
                      position={[-0.18, 0.28, 0.23]}
                      rotation={[0.35, 0.3, 0.4]}
                      scale={[1.1, 0.72, 0.85]}
                      castShadow
                    >
                      <sphereGeometry args={[0.15, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.52} />
                    </mesh>
                  </>
                )}

                {hairStyle === 'bob' && (
                  <>
                    <mesh position={[-0.31, -0.04, -0.04]} scale={[0.65, 1.35, 0.95]} castShadow>
                      <sphereGeometry args={[0.24, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.54} />
                    </mesh>
                    <mesh position={[0.31, -0.04, -0.04]} scale={[0.65, 1.35, 0.95]} castShadow>
                      <sphereGeometry args={[0.24, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.54} />
                    </mesh>
                    <mesh position={[0, 0.04, -0.34]} scale={[1.05, 1.25, 0.68]} castShadow>
                      <sphereGeometry args={[0.32, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.54} />
                    </mesh>
                  </>
                )}

                {hairStyle === 'bun' && (
                  <>
                    <mesh position={[0, 0.48, -0.18]} castShadow>
                      <sphereGeometry args={[0.19, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.52} />
                    </mesh>
                    <mesh position={[0, 0.36, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[0.14, 0.025, 10, 24]} />
                      <meshPhysicalMaterial color="#3979F6" roughness={0.42} />
                    </mesh>
                    <mesh
                      position={[0, 0.34, 0.16]}
                      rotation={[0.35, 0, 0]}
                      scale={[1.5, 0.65, 0.85]}
                      castShadow
                    >
                      <sphereGeometry args={[0.17, 24, 24]} />
                      <meshPhysicalMaterial color={hairColor} roughness={0.52} />
                    </mesh>
                  </>
                )}

                {hairStyle === 'curls' && (
                  <>
                    {[
                      [-0.22, 0.33, 0.16, 0.15],
                      [0.0, 0.4, 0.14, 0.17],
                      [0.23, 0.32, 0.15, 0.15],
                      [-0.32, 0.18, -0.05, 0.14],
                      [0.32, 0.18, -0.05, 0.14],
                      [0, 0.36, -0.22, 0.18],
                    ].map(([cx, cy, cz, cr], idx) => (
                      <mesh key={idx} position={[cx, cy, cz]} castShadow>
                        <sphereGeometry args={[cr, 20, 20]} />
                        <meshPhysicalMaterial color={hairColor} roughness={0.56} />
                      </mesh>
                    ))}
                  </>
                )}

                {hairStyle === 'short' && (
                  <mesh
                    position={[0, 0.33, 0.19]}
                    rotation={[0.25, 0, 0]}
                    scale={[1.65, 0.6, 0.85]}
                    castShadow
                  >
                    <sphereGeometry args={[0.16, 24, 24]} />
                    <meshPhysicalMaterial color={hairColor} roughness={0.54} />
                  </mesh>
                )}
              </group>

              {/* Electric Blue & Royal Purple Clay Headphones Accessory */}
              {hasHeadphones && (
                <group>
                  <mesh position={[0, 0.12, -0.02]} castShadow>
                    <torusGeometry args={[0.445, 0.042, 16, 36, Math.PI]} />
                    <meshPhysicalMaterial color="#3979F6" roughness={0.36} clearcoat={0.2} />
                  </mesh>
                  <mesh position={[-0.435, 0.02, -0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
                    <cylinderGeometry args={[0.125, 0.125, 0.085, 24]} />
                    <meshPhysicalMaterial color="#7655E8" roughness={0.34} />
                  </mesh>
                  <mesh position={[0.435, 0.02, -0.02]} rotation={[0, Math.PI / 2, 0]} castShadow>
                    <cylinderGeometry args={[0.125, 0.125, 0.085, 24]} />
                    <meshPhysicalMaterial color="#7655E8" roughness={0.34} />
                  </mesh>
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Beveled interlocking 3D jigsaw puzzle piece crafted via Bezier THREE.Shape.
 */
export function SculptedPuzzlePiece({
  kind,
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  meshRef,
}: {
  kind: 'male' | 'female';
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  meshRef?: React.RefObject<THREE.Mesh | null>;
}) {
  const geometry = useMemo(() => {
    const s = 0.36;
    const shape = new THREE.Shape();

    if (kind === 'male') {
      shape.moveTo(-s, -s);
      shape.lineTo(s, -s);
      shape.lineTo(s, -0.11);
      shape.bezierCurveTo(s + 0.06, -0.11, s + 0.08, -0.22, s + 0.19, -0.18);
      shape.bezierCurveTo(s + 0.28, -0.14, s + 0.28, 0.14, s + 0.19, 0.18);
      shape.bezierCurveTo(s + 0.08, 0.22, s + 0.06, 0.11, s, 0.11);
      shape.lineTo(s, s);
      shape.lineTo(-s, s);
      shape.closePath();
    } else {
      shape.moveTo(-s, -s);
      shape.lineTo(s, -s);
      shape.lineTo(s, s);
      shape.lineTo(-s, s);
      shape.lineTo(-s, 0.12);
      shape.bezierCurveTo(-s + 0.06, 0.12, -s + 0.08, 0.23, -s + 0.2, 0.19);
      shape.bezierCurveTo(-s + 0.29, 0.15, -s + 0.29, -0.15, -s + 0.2, -0.19);
      shape.bezierCurveTo(-s + 0.08, -0.23, -s + 0.06, -0.12, -s, -0.12);
      shape.closePath();
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.032,
      bevelSegments: 5,
      curveSegments: 24,
    });
    geo.translate(0, 0, -0.06);
    return geo;
  }, [kind]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.36}
        metalness={0.03}
        clearcoat={0.2}
        clearcoatRoughness={0.36}
        sheen={0.25}
      />
    </mesh>
  );
}

/**
 * Embossed Soft Antique Gold 3D SwapStudy Credit Coin with subtle deep green accent ring.
 */
export function SculptedCreditCoin({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  groupRef,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  groupRef?: React.RefObject<THREE.Group | null>;
}) {
  const starGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.12;
    const inner = 0.055;
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.068, 36]} />
        <meshPhysicalMaterial
          color="#7655E8"
          emissive="#EAE3FF"
          emissiveIntensity={0.14}
          roughness={0.22}
          metalness={0.32}
          clearcoat={0.42}
        />
      </mesh>
      <mesh position={[0, 0, 0.033]} castShadow>
        <torusGeometry args={[0.19, 0.02, 12, 36]} />
        <meshPhysicalMaterial color="#3979F6" roughness={0.26} metalness={0.24} clearcoat={0.35} />
      </mesh>
      <mesh geometry={starGeo} position={[0, 0, 0.036]}>
        <meshPhysicalMaterial color="#FFFFFF" roughness={0.2} metalness={0.12} />
      </mesh>
    </group>
  );
}

/**
 * Recognizable Sculpted 3D Skill Objects:
 * - Coding: Open Laptop with < /> symbols
 * - Design: Sculpted Painter Palette & Pencil
 * - Photography: Retro-Modern Mirrorless Camera
 * - Music: Over-Ear Wireless Headphones
 */
export function SculptedSkillToken({
  kind,
  position = [0, 0, 0],
  scale = 1,
}: {
  kind: 'coding' | 'design' | 'photography' | 'music';
  position?: [number, number, number];
  scale?: number;
}) {
  const tokenRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  const { laptopBaseGeo, laptopLidGeo, paletteGeo, cameraBodyGeo } = useMemo(() => {
    const baseShape = createRoundedRectShape(0.62, 0.44, 0.07);
    const lBase = new THREE.ExtrudeGeometry(baseShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 4,
    });
    lBase.rotateX(-Math.PI / 2);
    lBase.center();

    const lidShape = createRoundedRectShape(0.62, 0.42, 0.07);
    const lLid = new THREE.ExtrudeGeometry(lidShape, {
      depth: 0.026,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 4,
    });
    lLid.center();

    const pShape = new THREE.Shape();
    pShape.absellipse(0, 0, 0.34, 0.27, 0.2, Math.PI * 1.9, false, 0);
    pShape.bezierCurveTo(0.24, -0.04, 0.14, 0.02, 0.3, 0.06);
    pShape.closePath();
    const thumbHole = new THREE.Path();
    thumbHole.absarc(-0.18, -0.1, 0.055, 0, Math.PI * 2, true);
    pShape.holes.push(thumbHole);
    const pGeo = new THREE.ExtrudeGeometry(pShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.016,
      bevelSegments: 4,
      curveSegments: 24,
    });
    pGeo.center();

    const camShape = createRoundedRectShape(0.54, 0.35, 0.075);
    const camGeo = new THREE.ExtrudeGeometry(camShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.024,
      bevelSize: 0.022,
      bevelSegments: 4,
    });
    camGeo.center();

    return {
      laptopBaseGeo: lBase,
      laptopLidGeo: lLid,
      paletteGeo: pGeo,
      cameraBodyGeo: camGeo,
    };
  }, []);

  useFrame((_, delta) => {
    if (!tokenRef.current) return;
    elapsedRef.current += Math.min(delta, 0.1);
    const offset =
      kind === 'coding' ? 0 : kind === 'design' ? 1.55 : kind === 'photography' ? 3.1 : 4.65;
    const t = elapsedRef.current + offset;
    tokenRef.current.position.y = position[1] + Math.sin(t * 1.65) * 0.07;
    tokenRef.current.rotation.y = Math.sin(t * 0.8) * 0.24;
    tokenRef.current.rotation.z = Math.cos(t * 0.7) * 0.045;
  });

  return (
    <group ref={tokenRef} position={position} scale={scale}>
      {kind === 'coding' && (
        <group rotation={[0.2, 0.22, 0]}>
          {/* Crisp Light Lavender Keyboard Deck */}
          <mesh geometry={laptopBaseGeo} position={[0, -0.12, 0.12]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#F5F1FF" roughness={0.36} clearcoat={0.16} />
          </mesh>
          {/* Royal Purple Keys Pad & Electric Blue Trackpad */}
          <mesh position={[0, -0.095, 0.06]} castShadow>
            <boxGeometry args={[0.48, 0.016, 0.19]} />
            <meshPhysicalMaterial color="#7655E8" roughness={0.42} />
          </mesh>
          <mesh position={[0, -0.095, 0.22]}>
            <boxGeometry args={[0.18, 0.014, 0.1]} />
            <meshPhysicalMaterial color="#3979F6" roughness={0.36} />
          </mesh>

          {/* Tilted Electric Blue Laptop Screen Lid */}
          <group position={[0, 0.08, -0.08]} rotation={[-0.26, 0, 0]}>
            <mesh geometry={laptopLidGeo} castShadow receiveShadow>
              <meshPhysicalMaterial color="#3979F6" roughness={0.34} clearcoat={0.22} />
            </mesh>
            {/* Deep Indigo Inner Screen */}
            <mesh position={[0, 0, 0.018]}>
              <boxGeometry args={[0.52, 0.33, 0.015]} />
              <meshPhysicalMaterial color="#242044" roughness={0.28} />
            </mesh>
            {/* Raised < / > Code Symbols (Soft Lavender Brackets + White Slash) */}
            <group position={[0, 0.015, 0.036]}>
              <mesh position={[-0.14, 0.032, 0]} rotation={[0, 0, -0.78]}>
                <capsuleGeometry args={[0.014, 0.075, 6, 12]} />
                <meshPhysicalMaterial color="#EAE3FF" roughness={0.22} />
              </mesh>
              <mesh position={[-0.14, -0.032, 0]} rotation={[0, 0, 0.78]}>
                <capsuleGeometry args={[0.014, 0.075, 6, 12]} />
                <meshPhysicalMaterial color="#EAE3FF" roughness={0.22} />
              </mesh>

              <mesh position={[0, 0, 0]} rotation={[0, 0, -0.32]}>
                <capsuleGeometry args={[0.014, 0.145, 6, 12]} />
                <meshPhysicalMaterial color="#FFFFFF" roughness={0.22} />
              </mesh>

              <mesh position={[0.14, 0.032, 0]} rotation={[0, 0, 0.78]}>
                <capsuleGeometry args={[0.014, 0.075, 6, 12]} />
                <meshPhysicalMaterial color="#EAE3FF" roughness={0.22} />
              </mesh>
              <mesh position={[0.14, -0.032, 0]} rotation={[0, 0, -0.78]}>
                <capsuleGeometry args={[0.014, 0.075, 6, 12]} />
                <meshPhysicalMaterial color="#EAE3FF" roughness={0.22} />
              </mesh>
            </group>
          </group>
        </group>
      )}

      {kind === 'design' && (
        <group rotation={[0.22, -0.18, 0.1]}>
          {/* Crisp White Painter's Palette */}
          <mesh geometry={paletteGeo} castShadow receiveShadow>
            <meshPhysicalMaterial color="#FFFFFF" roughness={0.38} clearcoat={0.18} />
          </mesh>
          {/* Purple, Electric Blue & Pastel Swatches */}
          {[
            { pos: [-0.15, 0.12, 0.035] as [number, number, number], col: '#7655E8' },
            { pos: [0.02, 0.15, 0.035] as [number, number, number], col: '#3979F6' },
            { pos: [0.18, 0.09, 0.035] as [number, number, number], col: '#9B82F3' },
            { pos: [0.16, -0.1, 0.035] as [number, number, number], col: '#E1EBFF' },
            { pos: [0.0, -0.16, 0.035] as [number, number, number], col: '#EAE3FF' },
          ].map((dot, idx) => (
            <mesh key={idx} position={dot.pos} scale={[1, 1, 0.45]} castShadow>
              <sphereGeometry args={[0.056, 18, 18]} />
              <meshPhysicalMaterial color={dot.col} roughness={0.3} clearcoat={0.28} />
            </mesh>
          ))}
          {/* Sculpted Royal Purple & Electric Blue Pencil */}
          <group position={[0.06, 0.02, 0.12]} rotation={[0.1, 0.1, -0.62]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.032, 0.032, 0.44, 16]} />
              <meshPhysicalMaterial color="#7655E8" roughness={0.36} />
            </mesh>
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.033, 0.033, 0.06, 16]} />
              <meshPhysicalMaterial color="#E1EBFF" roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.3, 0]} castShadow>
              <sphereGeometry args={[0.033, 14, 14]} />
              <meshPhysicalMaterial color="#3979F6" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.265, 0]} rotation={[Math.PI, 0, 0]} castShadow>
              <coneGeometry args={[0.032, 0.095, 16]} />
              <meshPhysicalMaterial color="#FFFFFF" roughness={0.38} />
            </mesh>
            <mesh position={[0, -0.305, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.013, 0.035, 12]} />
              <meshPhysicalMaterial color="#242044" roughness={0.32} />
            </mesh>
          </group>
        </group>
      )}

      {kind === 'photography' && (
        <group rotation={[0.12, -0.24, 0]}>
          {/* Royal Purple Camera Body */}
          <mesh geometry={cameraBodyGeo} castShadow receiveShadow>
            <meshPhysicalMaterial color="#7655E8" roughness={0.38} clearcoat={0.18} />
          </mesh>
          {/* Crisp White Top Plate Accent */}
          <mesh position={[0, 0.145, 0]} castShadow>
            <boxGeometry args={[0.52, 0.085, 0.165]} />
            <meshPhysicalMaterial color="#FFFFFF" roughness={0.35} clearcoat={0.16} />
          </mesh>
          {/* Viewfinder Dome & Soft Lavender Shutter Accent */}
          <mesh position={[0, 0.215, -0.01]} castShadow>
            <boxGeometry args={[0.18, 0.07, 0.14]} />
            <meshPhysicalMaterial color="#3979F6" roughness={0.38} />
          </mesh>
          <mesh position={[-0.17, 0.2, 0.02]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.035, 20]} />
            <meshPhysicalMaterial color="#EAE3FF" roughness={0.28} />
          </mesh>
          {/* Electric Blue Grip */}
          <mesh position={[0.23, -0.02, 0.03]} castShadow>
            <boxGeometry args={[0.09, 0.28, 0.14]} />
            <meshPhysicalMaterial color="#3979F6" roughness={0.48} />
          </mesh>
          {/* Sculpted Multi-Ring Lens */}
          <mesh position={[-0.01, -0.02, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.145, 0.155, 0.12, 32]} />
            <meshPhysicalMaterial color="#3979F6" roughness={0.34} clearcoat={0.22} />
          </mesh>
          <mesh position={[-0.01, -0.02, 0.175]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.132, 0.018, 12, 32]} />
            <meshPhysicalMaterial color="#E1EBFF" roughness={0.28} />
          </mesh>
          <mesh position={[-0.01, -0.02, 0.172]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.115, 0.115, 0.025, 28]} />
            <meshPhysicalMaterial color="#242044" roughness={0.12} clearcoat={0.92} />
          </mesh>
          <mesh position={[-0.05, 0.025, 0.186]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
      )}

      {kind === 'music' && (
        <group rotation={[0.15, 0.22, -0.06]}>
          {/* Curved Electric Blue Outer Headband */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <torusGeometry args={[0.26, 0.042, 18, 40, Math.PI]} />
            <meshPhysicalMaterial color="#3979F6" roughness={0.36} clearcoat={0.22} />
          </mesh>
          {/* Pale Blue Inner Band Padding */}
          <mesh position={[0, 0.035, 0]}>
            <torusGeometry args={[0.228, 0.026, 14, 36, Math.PI * 0.82]} />
            <meshPhysicalMaterial color="#E1EBFF" roughness={0.45} />
          </mesh>
          {/* Left & Right Earcups */}
          {[-0.26, 0.26].map((earX, idx) => (
            <group key={idx} position={[earX, -0.08, 0]} rotation={[0, 0, earX < 0 ? 0.12 : -0.12]}>
              {/* Royal Purple hinge yoke */}
              <mesh position={[0, 0.11, 0]} castShadow>
                <capsuleGeometry args={[0.02, 0.08, 6, 12]} />
                <meshPhysicalMaterial color="#7655E8" roughness={0.32} />
              </mesh>
              {/* Soft Lavender-White outer cup shell */}
              <mesh scale={[0.68, 1.15, 0.95]} castShadow receiveShadow>
                <sphereGeometry args={[0.145, 26, 26]} />
                <meshPhysicalMaterial color="#7655E8" roughness={0.32} clearcoat={0.22} />
              </mesh>
              {/* Pale Lavender inner cushion */}
              <mesh
                position={[earX < 0 ? 0.068 : -0.068, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[0.92, 1.12, 1]}
                castShadow
              >
                <torusGeometry args={[0.105, 0.038, 14, 28]} />
                <meshPhysicalMaterial color="#EAE3FF" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

/**
 * Polished 3D Sculpted SwapStudy App Badge (Squircle + Opposing Swap Arrows) for Scene 4 Reveal.
 */
export function SculptedSwapStudyLogo({
  position = [0, 0, 0],
  scale = 1,
  groupRef,
}: {
  position?: [number, number, number];
  scale?: number;
  groupRef?: React.RefObject<THREE.Group | null>;
}) {
  const { badgeGeo, rimGeo, arrowShaftGeo, arrowHeadGeo } = useMemo(() => {
    const outerShape = createRoundedRectShape(0.84, 0.84, 0.22);
    const badge = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.035,
      bevelSegments: 5,
    });
    badge.center();

    const rimShape = createRoundedRectShape(0.92, 0.92, 0.25);
    const rim = new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 4,
    });
    rim.center();

    const shaftCurve = new THREE.LineCurve3(
      new THREE.Vector3(-0.18, 0, 0),
      new THREE.Vector3(0.18, 0, 0)
    );
    const shaft = new THREE.TubeGeometry(shaftCurve, 8, 0.032, 12, false);

    const headShape = new THREE.Shape();
    headShape.moveTo(-0.04, -0.095);
    headShape.lineTo(0.1, 0);
    headShape.lineTo(-0.04, 0.095);
    headShape.closePath();
    const head = new THREE.ExtrudeGeometry(headShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
    });
    head.center();

    return {
      badgeGeo: badge,
      rimGeo: rim,
      arrowShaftGeo: shaft,
      arrowHeadGeo: head,
    };
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Crisp White Outer Backplate Frame */}
      <mesh geometry={rimGeo} position={[0, 0, -0.02]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#FFFFFF" roughness={0.34} clearcoat={0.2} />
      </mesh>
      {/* Royal Purple Rounded App Tile */}
      <mesh geometry={badgeGeo} position={[0, 0, 0.02]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#7655E8"
          emissive="#3979F6"
          emissiveIntensity={0.18}
          roughness={0.3}
          clearcoat={0.28}
        />
      </mesh>
      {/* Top Rightward Swap Arrow (White) */}
      <group position={[0, 0.125, 0.12]}>
        <mesh geometry={arrowShaftGeo} position={[-0.03, 0, 0]}>
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        <mesh geometry={arrowHeadGeo} position={[0.16, 0, 0]}>
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
      </group>
      {/* Bottom Leftward Swap Arrow (Pale Electric Blue) */}
      <group position={[0, -0.125, 0.12]} rotation={[0, 0, Math.PI]}>
        <mesh geometry={arrowShaftGeo} position={[-0.03, 0, 0]}>
          <meshPhysicalMaterial color="#E1EBFF" roughness={0.2} />
        </mesh>
        <mesh geometry={arrowHeadGeo} position={[0.16, 0, 0]}>
          <meshPhysicalMaterial color="#E1EBFF" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
