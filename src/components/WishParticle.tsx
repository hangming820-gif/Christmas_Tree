import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WISH_BURST_DURATION, WISH_DURATION } from "../lib/constants";
import {
  wishFragmentShader,
  wishVertexShader,
} from "../lib/shaders";
import type { Wish } from "../types";

interface WishParticleProps {
  wish: Wish;
  onArrival: () => void;
  onComplete: (id: number) => void;
}

interface WishBuffers {
  headOffsets: Float32Array;
  burstDirections: Float32Array;
  trailPhases: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
}

const HEAD_COUNT = 88;
const TRAIL_COUNT = 68;
const TOTAL_COUNT = HEAD_COUNT + TRAIL_COUNT;

const cubicBezier = (
  target: THREE.Vector3,
  t: number,
  start: THREE.Vector3,
  controlOne: THREE.Vector3,
  controlTwo: THREE.Vector3,
  end: THREE.Vector3,
) => {
  const oneMinusT = 1 - t;
  const a = oneMinusT * oneMinusT * oneMinusT;
  const b = 3 * oneMinusT * oneMinusT * t;
  const c = 3 * oneMinusT * t * t;
  const d = t * t * t;
  return target
    .copy(start)
    .multiplyScalar(a)
    .addScaledVector(controlOne, b)
    .addScaledVector(controlTwo, c)
    .addScaledVector(end, d);
};

const quinticInOut = (value: number) =>
  value < 0.5
    ? 16 * Math.pow(value, 5)
    : 1 - Math.pow(-2 * value + 2, 5) / 2;

const createWishBuffers = (): WishBuffers => {
  const headOffsets = new Float32Array(HEAD_COUNT * 3);
  const burstDirections = new Float32Array(TOTAL_COUNT * 3);
  const trailPhases = new Float32Array(TRAIL_COUNT);
  const colors = new Float32Array(TOTAL_COUNT * 3);
  const sizes = new Float32Array(TOTAL_COUNT);
  const alphas = new Float32Array(TOTAL_COUNT);
  const warm = new THREE.Color("#FFD45E");
  const paleGold = new THREE.Color("#FFF4B0");
  const white = new THREE.Color("#FFFCEB");
  const mint = new THREE.Color("#A8FFCA");

  for (let index = 0; index < HEAD_COUNT; index += 1) {
    const theta = Math.random() * Math.PI * 2;
    const starEdge = 0.42 * (0.42 + 0.58 * Math.abs(Math.cos(theta * 2.5)));
    const radial = Math.sqrt(Math.random()) * starEdge;
    const offsetIndex = index * 3;
    headOffsets[offsetIndex] = Math.cos(theta) * radial;
    headOffsets[offsetIndex + 1] = Math.sin(theta) * radial;
    headOffsets[offsetIndex + 2] = (Math.random() - 0.5) * 0.22;
  }

  for (let index = 0; index < TOTAL_COUNT; index += 1) {
    const directionIndex = index * 3;
    const z = Math.random() * 2 - 1;
    const angle = Math.random() * Math.PI * 2;
    const ringRadius = Math.sqrt(1 - z * z);
    burstDirections[directionIndex] = Math.cos(angle) * ringRadius;
    burstDirections[directionIndex + 1] = Math.sin(angle) * ringRadius;
    burstDirections[directionIndex + 2] = z;

    const colorRoll = Math.random();
    const color =
      colorRoll < 0.14
        ? white
        : colorRoll < 0.3
          ? mint
          : colorRoll < 0.66
            ? paleGold
            : warm;
    const colorIndex = index * 3;
    colors[colorIndex] = color.r;
    colors[colorIndex + 1] = color.g;
    colors[colorIndex + 2] = color.b;
    if (index < 12) {
      sizes[index] = 0.19 + Math.random() * 0.07;
      alphas[index] = 0.68 + Math.random() * 0.28;
    } else if (index < HEAD_COUNT) {
      sizes[index] = 0.085 + Math.random() * 0.075;
      alphas[index] = 0.82 + Math.random() * 0.18;
    } else {
      sizes[index] = 0.042 + Math.random() * 0.062;
      alphas[index] = 0.28 + Math.random() * 0.38;
    }
  }

  for (let index = 0; index < TRAIL_COUNT; index += 1) {
    trailPhases[index] = Math.random() * Math.PI * 2;
  }

  return {
    headOffsets,
    burstDirections,
    trailPhases,
    colors,
    sizes,
    alphas,
  };
};

export function WishParticle({
  wish,
  onArrival,
  onComplete,
}: WishParticleProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTime = useRef<number | null>(null);
  const arrived = useRef(false);
  const completed = useRef(false);
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const buffers = useMemo(createWishBuffers, []);

  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    value.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(TOTAL_COUNT * 3), 3),
    );
    value.setAttribute(
      "color",
      new THREE.BufferAttribute(buffers.colors, 3),
    );
    value.setAttribute(
      "aSize",
      new THREE.BufferAttribute(buffers.sizes, 1),
    );
    value.setAttribute(
      "aAlpha",
      new THREE.BufferAttribute(buffers.alphas, 1),
    );
    value.setDrawRange(0, TOTAL_COUNT);
    (value.attributes.position as THREE.BufferAttribute).setUsage(
      THREE.DynamicDrawUsage,
    );
    return value;
  }, [buffers]);

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 1 },
    }),
    [pixelRatio],
  );

  const path = useMemo(() => {
    const start = new THREE.Vector3(wish.offsetX * 1.1, -2.75, 3.05);
    const controlOne = new THREE.Vector3(
      wish.offsetX * 1.7,
      -1.15,
      3.9,
    );
    const controlTwo = new THREE.Vector3(wish.offsetX * 0.75, 2.42, 0.76);
    const end = new THREE.Vector3(0, 2.83, 0);
    return { start, controlOne, controlTwo, end };
  }, [wish.offsetX]);

  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    const positions = geometry.attributes.position;
    if (!material) return;

    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;
    const travelProgress = THREE.MathUtils.clamp(elapsed / WISH_DURATION, 0, 1);
    const easedProgress = quinticInOut(travelProgress);
    const burstProgress = THREE.MathUtils.clamp(
      (elapsed - WISH_DURATION) / WISH_BURST_DURATION,
      0,
      1,
    );

    if (travelProgress >= 1 && !arrived.current) {
      arrived.current = true;
      onArrival();
    }

    if (elapsed >= WISH_DURATION + WISH_BURST_DURATION && !completed.current) {
      completed.current = true;
      onComplete(wish.id);
    }

    if (elapsed <= WISH_DURATION) {
      for (let index = 0; index < TOTAL_COUNT; index += 1) {
        const index3 = index * 3;
        if (index < HEAD_COUNT) {
          const offsetIndex = index * 3;
          const spin = easedProgress * Math.PI * 0.68;
          const offsetX = buffers.headOffsets[offsetIndex];
          const offsetY = buffers.headOffsets[offsetIndex + 1];
          cubicBezier(
            target,
            easedProgress,
            path.start,
            path.controlOne,
            path.controlTwo,
            path.end,
          );
          positions.array[index3] =
            target.x + offsetX * Math.cos(spin) - offsetY * Math.sin(spin);
          positions.array[index3 + 1] =
            target.y + offsetX * Math.sin(spin) + offsetY * Math.cos(spin);
          positions.array[index3 + 2] =
            target.z + buffers.headOffsets[offsetIndex + 2];
        } else {
          const trailIndex = index - HEAD_COUNT;
          const lag = (trailIndex + 1) * 0.0085;
          const trailProgress = Math.max(0, easedProgress - lag);
          cubicBezier(
            target,
            trailProgress,
            path.start,
            path.controlOne,
            path.controlTwo,
            path.end,
          );
          const wobble = Math.sin(
            elapsed * 5.4 - trailIndex * 0.54 + buffers.trailPhases[trailIndex],
          );
          const trailSpread = (trailIndex / TRAIL_COUNT) * 0.13;
          positions.array[index3] =
            target.x + Math.cos(trailIndex * 2.4) * trailSpread + wobble * 0.025;
          positions.array[index3 + 1] =
            target.y +
            Math.sin(trailIndex * 1.8) * trailSpread +
            wobble * 0.018;
          positions.array[index3 + 2] =
            target.z + Math.cos(trailIndex * 1.3) * 0.035;
        }
      }
      material.uniforms.uOpacity.value = Math.min(1, elapsed * 1.8);
    } else {
      const burstEase = 1 - Math.pow(1 - burstProgress, 2);
      for (let index = 0; index < TOTAL_COUNT; index += 1) {
        const index3 = index * 3;
        const directionIndex = index * 3;
        const distance =
          burstEase *
          (index < HEAD_COUNT
            ? 0.55 + (index % 9) * 0.07
            : 0.42 + (index % 13) * 0.045);
        positions.array[index3] =
          path.end.x + buffers.burstDirections[directionIndex] * distance;
        positions.array[index3 + 1] =
          path.end.y +
          buffers.burstDirections[directionIndex + 1] * distance +
          burstEase * burstEase * 0.16;
        positions.array[index3 + 2] =
          path.end.z + buffers.burstDirections[directionIndex + 2] * distance;
      }
      material.uniforms.uOpacity.value = Math.pow(1 - burstProgress, 1.6);
    }

    positions.needsUpdate = true;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={wishVertexShader}
        fragmentShader={wishFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

