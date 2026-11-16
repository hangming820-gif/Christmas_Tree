import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeStarGeometry } from "../lib/particles";
import {
  glowFragmentShader,
  ringVertexShader,
  starFragmentShader,
  starVertexShader,
} from "../lib/shaders";

interface StarTopperProps {
  isMobile: boolean;
}

export function StarTopper({ isMobile }: StarTopperProps) {
  const groupRef = useRef<THREE.Group>(null);
  const starMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const starGeometry = useMemo(
    () => makeStarGeometry(isMobile),
    [isMobile],
  );
  const haloGeometry = useMemo(
    () => makeStarGeometry(isMobile, true),
    [isMobile],
  );

  const starUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uPointSize: { value: isMobile ? 0.118 : 0.108 },
      uStarPulse: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [isMobile, pixelRatio],
  );

  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uPointSize: { value: isMobile ? 0.15 : 0.135 },
      uStarPulse: { value: 0 },
      uOpacity: { value: 0.3 },
    }),
    [isMobile, pixelRatio],
  );

  useEffect(
    () => () => {
      starGeometry.dispose();
      haloGeometry.dispose();
    },
    [haloGeometry, starGeometry],
  );

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const slowWave = (Math.sin(elapsed * 1.5 - Math.PI / 2) + 1) * 0.5;
    const starPulse = Math.pow(slowWave, 3);
    const scale = 0.985 + starPulse * 0.055;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
      groupRef.current.rotation.z =
        elapsed * 0.1 + Math.sin(elapsed * 0.6) * 0.035;
    }

    if (starMaterialRef.current) {
      starMaterialRef.current.uniforms.uTime.value = elapsed;
      starMaterialRef.current.uniforms.uStarPulse.value = starPulse;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.uniforms.uTime.value = elapsed;
      haloMaterialRef.current.uniforms.uStarPulse.value = starPulse;
      haloMaterialRef.current.uniforms.uOpacity.value =
        0.27 + starPulse * 0.16;
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={haloGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={haloMaterialRef}
          uniforms={haloUniforms}
          vertexShader={ringVertexShader}
          fragmentShader={glowFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={starGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={starMaterialRef}
          uniforms={starUniforms}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

