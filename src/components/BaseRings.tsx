import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeRingGeometry } from "../lib/particles";
import {
  glowFragmentShader,
  ringVertexShader,
} from "../lib/shaders";

interface BaseRingsProps {
  isMobile: boolean;
}

const ringCounts = [860, 760, 680];

export function BaseRings({ isMobile }: BaseRingsProps) {
  const ringA = useRef<THREE.Group>(null);
  const ringB = useRef<THREE.Group>(null);
  const ringC = useRef<THREE.Group>(null);
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const groups = [ringA, ringB, ringC];
  const speedFactor = isMobile ? 0.72 : 1;
  const geometries = useMemo(
    () =>
      ringCounts.map((count, index) =>
        makeRingGeometry(Math.round(count * speedFactor), index),
      ),
    [speedFactor],
  );
  const uniforms = useMemo(
    () =>
      geometries.map((_, index) => ({
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uPointSize: { value: 0.067 - index * 0.004 },
        uOpacity: { value: 1 - index * 0.14 },
      })),
    [geometries, pixelRatio],
  );
  const materialRefs = [
    useRef<THREE.ShaderMaterial>(null),
    useRef<THREE.ShaderMaterial>(null),
    useRef<THREE.ShaderMaterial>(null),
  ];

  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [
    geometries,
  ]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    materialRefs.forEach((ref) => {
      if (ref.current) ref.current.uniforms.uTime.value = elapsed;
    });

    if (ringA.current) ringA.current.rotation.y = elapsed * 0.065;
    if (ringB.current) ringB.current.rotation.y = -elapsed * 0.048;
    if (ringC.current) ringC.current.rotation.y = elapsed * 0.035;
  });

  return (
    <group>
      {geometries.map((geometry, index) => (
        <group key={index} ref={groups[index]}>
          <points geometry={geometry} frustumCulled={false}>
            <shaderMaterial
              ref={materialRefs[index]}
              uniforms={uniforms[index]}
              vertexShader={ringVertexShader}
              fragmentShader={glowFragmentShader}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>
      ))}
    </group>
  );
}

