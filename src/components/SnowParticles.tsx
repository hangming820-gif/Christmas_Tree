import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeSnowGeometry } from "../lib/particles";
import {
  snowFragmentShader,
  snowVertexShader,
} from "../lib/shaders";

interface SnowParticlesProps {
  isMobile: boolean;
}

export function SnowParticles({ isMobile }: SnowParticlesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const geometry = useMemo(() => makeSnowGeometry(isMobile), [isMobile]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    }),
    [pixelRatio],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={snowVertexShader}
        fragmentShader={snowFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

