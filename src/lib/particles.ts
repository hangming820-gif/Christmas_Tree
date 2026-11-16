import * as THREE from "three";
import { PALETTE, PARTICLE_COUNTS, TREE } from "./constants";

type RGB = [number, number, number];

const seededRandom = (() => {
  let seed = 8312026;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
})();

const toRgb = (hex: string): RGB => {
  const color = new THREE.Color(hex);
  return [color.r, color.g, color.b];
};

const COLORS = {
  evergreen: toRgb(PALETTE.evergreen),
  mint: toRgb(PALETTE.mint),
  lightMint: toRgb(PALETTE.lightMint),
  lime: toRgb(PALETTE.lime),
  gold: toRgb(PALETTE.gold),
  starGold: toRgb(PALETTE.starGold),
  white: toRgb(PALETTE.white),
};

const randomGaussian = () => {
  const u = Math.max(seededRandom(), 0.0001);
  const v = seededRandom();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const randomBetween = (min: number, max: number) =>
  min + seededRandom() * (max - min);

const pick = (colors: RGB[], weights: number[]): RGB => {
  const value = seededRandom();
  let total = 0;

  for (let index = 0; index < colors.length; index += 1) {
    total += weights[index];
    if (value <= total) return colors[index];
  }

  return colors[colors.length - 1];
};

const tint = (color: RGB, amount: number): RGB => [
  Math.min(1, color[0] + amount),
  Math.min(1, color[1] + amount * 0.55),
  Math.min(1, color[2] + amount * 0.7),
];

export interface ParticleBuffers {
  position: Float32Array;
  color: Float32Array;
  scale: Float32Array;
  phase: Float32Array;
  twinkle: Float32Array;
}

const buildGeometry = (buffers: ParticleBuffers): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(buffers.position, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(buffers.color, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(buffers.scale, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(buffers.phase, 1));
  geometry.setAttribute("aTwinkle", new THREE.BufferAttribute(buffers.twinkle, 1));
  geometry.computeBoundingSphere();
  return geometry;
};

export const makeTreeGeometry = (isMobile: boolean): THREE.BufferGeometry => {
  const count = isMobile
    ? PARTICLE_COUNTS.mobileTree
    : PARTICLE_COUNTS.desktopTree;
  const buffers: ParticleBuffers = {
    position: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    scale: new Float32Array(count),
    phase: new Float32Array(count),
    twinkle: new Float32Array(count),
  };

  for (let index = 0; index < count; index += 1) {
    const baseHeight = Math.pow(seededRandom(), 1.28);
    const sourceRoll = seededRandom();
    const isSpiral = sourceRoll < 0.68;
    const isShell = sourceRoll >= 0.68 && sourceRoll < 0.9;
    const heightFactor = THREE.MathUtils.clamp(
      baseHeight + (isSpiral ? randomGaussian() * 0.011 : 0),
      0,
      1,
    );
    const branchPulse =
      0.93 + Math.abs(Math.sin(heightFactor * Math.PI * 7.2)) * 0.09;
    const taper = Math.pow(1 - heightFactor, 0.86) * branchPulse;
    const localRadius = TREE.baseRadius * taper;
    const strand = Math.floor(seededRandom() * 5);
    const spiralAngle =
      heightFactor * Math.PI * 2 * 3.15 +
      (strand / 5) * Math.PI * 2 +
      0.36;
    const theta = isSpiral
      ? spiralAngle + randomGaussian() * 0.055
      : seededRandom() * Math.PI * 2;
    const radial = isSpiral
      ? THREE.MathUtils.clamp(
          0.9 + randomGaussian() * 0.042,
          0.76,
          1.025,
        )
      : isShell
        ? 0.78 + Math.pow(seededRandom(), 0.44) * 0.22
        : Math.pow(seededRandom(), 0.62) * 0.73;

    const index3 = index * 3;
    const radiusJitter =
      1 + randomGaussian() * (isSpiral ? 0.018 : 0.012);
    buffers.position[index3] =
      Math.cos(theta) * localRadius * radial * radiusJitter;
    buffers.position[index3 + 1] =
      TREE.baseY +
      heightFactor * TREE.height +
      randomGaussian() * (isSpiral ? 0.018 : 0.025);
    buffers.position[index3 + 2] =
      Math.sin(theta) * localRadius * radial * radiusJitter;

    const outer = radial > TREE.outerThreshold;
    const distributionJitter = 1 + (seededRandom() - 0.5) * 0.12;
    let color: RGB;

    if (outer) {
      const lightThreshold = 0.25 * (1 - heightFactor) * distributionJitter;
      const goldThreshold =
        lightThreshold + 0.15 * (1 - heightFactor) * distributionJitter;
      const value = seededRandom();

      if (value < lightThreshold) {
        color = tint(COLORS.lightMint, randomBetween(0, 0.08));
      } else if (value < goldThreshold) {
        color = tint(COLORS.gold, randomBetween(0, 0.06));
      } else {
        color = pick(
          [COLORS.evergreen, COLORS.mint, COLORS.lime],
          [0.48, 0.4, 0.12],
        );
      }
    } else {
      color = pick([COLORS.evergreen, COLORS.mint], [0.58, 0.42]);
    }

    buffers.color[index3] = color[0];
    buffers.color[index3 + 1] = color[1];
    buffers.color[index3 + 2] = color[2];

    const rareSpark = seededRandom() > (isSpiral ? 0.978 : 0.992);
    buffers.scale[index] = rareSpark
      ? randomBetween(1.6, 2.2)
      : isSpiral
        ? randomBetween(0.62, 1.4)
        : randomBetween(0.48, 1.28);
    buffers.phase[index] = seededRandom() * Math.PI * 2;
    buffers.twinkle[index] = randomBetween(0.35, 1);
  }

  return buildGeometry(buffers);
};

const starVertices = Array.from({ length: 10 }, (_, index) => {
  const angle = -Math.PI / 2 + (index / 10) * Math.PI * 2;
  const radius = index % 2 === 0 ? 0.72 : 0.31;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
});

export const makeStarGeometry = (
  isMobile: boolean,
  halo = false,
): THREE.BufferGeometry => {
  const count = halo
    ? PARTICLE_COUNTS.starHalo
    : isMobile
      ? PARTICLE_COUNTS.mobileStar
      : PARTICLE_COUNTS.desktopStar;
  const buffers: ParticleBuffers = {
    position: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    scale: new Float32Array(count),
    phase: new Float32Array(count),
    twinkle: new Float32Array(count),
  };
  for (let index = 0; index < count; index += 1) {
    const vertexIndex = Math.floor(seededRandom() * starVertices.length);
    const currentVertex = starVertices[vertexIndex];
    const nextVertex = starVertices[(vertexIndex + 1) % starVertices.length];
    const edgeProgress = seededRandom();
    const edgeX =
      currentVertex[0] +
      (nextVertex[0] - currentVertex[0]) * edgeProgress;
    const edgeY =
      currentVertex[1] +
      (nextVertex[1] - currentVertex[1]) * edgeProgress;
    const radial = halo
      ? randomBetween(1.06, 1.24)
      : Math.sqrt(seededRandom());
    const jitterX = halo ? randomGaussian() * 0.018 : randomGaussian() * 0.008;
    const jitterY = halo ? randomGaussian() * 0.018 : randomGaussian() * 0.008;
    const thickness = halo
      ? 0.035 + seededRandom() * 0.035
      : 0.055 + (1 - radial) * 0.13;
    const edge = radial > 0.82;
    let color: RGB;

    if (halo) {
      color = pick(
        [COLORS.starGold, COLORS.white, COLORS.lightMint],
        [0.68, 0.24, 0.08],
      );
    } else if (edge) {
      color = pick(
        [COLORS.starGold, COLORS.gold, COLORS.white],
        [0.64, 0.24, 0.12],
      );
    } else {
      color = pick(
        [COLORS.starGold, COLORS.gold, COLORS.white, COLORS.lightMint],
        [0.7, 0.18, 0.09, 0.03],
      );
    }

    const index3 = index * 3;
    buffers.position[index3] = edgeX * radial + jitterX;
    buffers.position[index3 + 1] = edgeY * radial + jitterY + 2.98;
    buffers.position[index3 + 2] = randomGaussian() * thickness;
    buffers.color[index3] = color[0];
    buffers.color[index3 + 1] = color[1];
    buffers.color[index3 + 2] = color[2];
    buffers.scale[index] = halo
      ? randomBetween(0.7, 1.4)
      : edge
        ? randomBetween(0.72, 1.42)
        : randomBetween(0.55, 1.25);
    buffers.phase[index] = seededRandom() * Math.PI * 2;
    buffers.twinkle[index] = randomBetween(0.45, 1);
  }

  return buildGeometry(buffers);
};

export const makeRingGeometry = (count: number, ringIndex: number) => {
  const buffers: ParticleBuffers = {
    position: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    scale: new Float32Array(count),
    phase: new Float32Array(count),
    twinkle: new Float32Array(count),
  };
  const radius = 2.72 + ringIndex * 0.3;

  for (let index = 0; index < count; index += 1) {
    const angle = seededRandom() * Math.PI * 2;
    const index3 = index * 3;
    const irregularity = 1 + randomGaussian() * 0.018;
    buffers.position[index3] = Math.cos(angle) * radius * irregularity;
    buffers.position[index3 + 1] =
      -2.25 + ringIndex * 0.085 + randomGaussian() * 0.026;
    buffers.position[index3 + 2] = Math.sin(angle) * radius * irregularity;
    const color = pick(
      [COLORS.gold, COLORS.lightMint, COLORS.mint],
      [0.78, 0.14, 0.08],
    );
    buffers.color[index3] = color[0];
    buffers.color[index3 + 1] = color[1];
    buffers.color[index3 + 2] = color[2];
    buffers.scale[index] = randomBetween(0.42, 1.35);
    buffers.phase[index] = seededRandom() * Math.PI * 2;
    buffers.twinkle[index] = randomBetween(0.5, 1);
  }

  return buildGeometry(buffers);
};

export const makeSnowGeometry = (isMobile: boolean) => {
  const count = isMobile
    ? PARTICLE_COUNTS.mobileSnow
    : PARTICLE_COUNTS.desktopSnow;
  const buffers: ParticleBuffers = {
    position: new Float32Array(count * 3),
    color: new Float32Array(count * 3),
    scale: new Float32Array(count),
    phase: new Float32Array(count),
    twinkle: new Float32Array(count),
  };

  for (let index = 0; index < count; index += 1) {
    const index3 = index * 3;
    buffers.position[index3] = randomBetween(-11, 11);
    buffers.position[index3 + 1] = randomBetween(-8, 8);
    buffers.position[index3 + 2] = randomBetween(-8, 4);
    const color = pick([COLORS.white, COLORS.lightMint], [0.8, 0.2]);
    buffers.color[index3] = color[0];
    buffers.color[index3 + 1] = color[1];
    buffers.color[index3 + 2] = color[2];
    buffers.scale[index] = randomBetween(0.28, 1.45);
    buffers.phase[index] = seededRandom() * Math.PI * 2;
    buffers.twinkle[index] = randomBetween(0.2, 0.8);
  }

  return buildGeometry(buffers);
};

