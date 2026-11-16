import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeTreeGeometry } from "../lib/particles";
import {
  treeFragmentShader,
  treeVertexShader,
} from "../lib/shaders";

interface GreenTreeParticlesProps {
  isMobile: boolean;
  wishEnergy: number;
}

export function GreenTreeParticles({
  isMobile,
  wishEnergy,
}: GreenTreeParticlesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const haloMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => makeTreeGeometry(isMobile), [isMobile]);
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const pulseStartedAt = useRef(-10);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uPointSize: { value: isMobile ? 0.103 : 0.092 },
      uWishGlow: { value: 0 },
      uOpacity: { value: 1.16 },
    }),
    [isMobile, pixelRatio],
  );

  const haloUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uPointSize: { value: isMobile ? 0.215 : 0.195 },
      uWishGlow: { value: 0 },
      uOpacity: { value: 0.14 },
    }),
    [isMobile, pixelRatio],
  );

  useEffect(() => {
    if (wishEnergy > 0) pulseStartedAt.current = performance.now() / 1000;
  }, [wishEnergy]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;

    const elapsed = clock.getElapsedTime();
    const age = performance.now() / 1000 - pulseStartedAt.current;
    const pulse = Math.max(0, 1 - age / 1.15);
    const softPulse = pulse * pulse * (3 - 2 * pulse);
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uWishGlow.value = softPulse;
    if (haloMaterialRef.current) {
      haloMaterialRef.current.uniforms.uTime.value = elapsed;
      haloMaterialRef.current.uniforms.uWishGlow.value = softPulse;
      haloMaterialRef.current.uniforms.uOpacity.value =
        0.12 + softPulse * 0.16;
    }
  });

  return (
    <>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={haloMaterialRef}
          uniforms={haloUniforms}
          vertexShader={treeVertexShader}
          fragmentShader={treeFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={treeVertexShader}
          fragmentShader={treeFragmentShader}
          transparent
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

