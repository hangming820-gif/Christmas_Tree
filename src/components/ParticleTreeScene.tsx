import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Wish } from "../types";
import { BaseRings } from "./BaseRings";
import { CameraController } from "./CameraController";
import { GreenTreeParticles } from "./GreenTreeParticles";
import { StarTopper } from "./StarTopper";
import { SceneEffects } from "./SceneEffects";
import { SnowParticles } from "./SnowParticles";
import { WishSystem } from "./WishSystem";

interface ParticleTreeSceneProps {
  isMobile: boolean;
  handX: number;
  scaleTarget: number;
  wishes: Wish[];
  wishEnergy: number;
  onWishArrival: () => void;
  onWishComplete: (id: number) => void;
}

interface SceneRootProps
  extends Pick<
    ParticleTreeSceneProps,
    | "isMobile"
    | "handX"
    | "scaleTarget"
    | "wishes"
    | "wishEnergy"
    | "onWishArrival"
    | "onWishComplete"
  > {}

function SceneRoot({
  isMobile,
  handX,
  scaleTarget,
  wishes,
  wishEnergy,
  onWishArrival,
  onWishComplete,
}: SceneRootProps) {
  const rootRef = useRef<THREE.Group>(null);
  const currentScale = useRef(1);

  useFrame(({ clock }, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const scaleDamping = 1 - Math.exp(-delta * 5.2);
    const rotationDamping = 1 - Math.exp(-delta * 3.2);
    currentScale.current +=
      (scaleTarget - currentScale.current) * scaleDamping;
    root.scale.setScalar(currentScale.current);
    const idleSway =
      handX === 0 ? Math.sin(clock.getElapsedTime() * 0.16) * 0.14 : 0;
    const targetRotation = handX * -0.58 + idleSway;
    root.rotation.y +=
      (targetRotation - root.rotation.y) * rotationDamping;
    root.position.y = 0.18 + Math.sin(clock.getElapsedTime() * 0.36) * 0.045;
  });

  return (
    <>
      <group ref={rootRef} position={[0, 0.18, 0]}>
        <GreenTreeParticles isMobile={isMobile} wishEnergy={wishEnergy} />
        <StarTopper isMobile={isMobile} />
        <BaseRings isMobile={isMobile} />
        <WishSystem
          wishes={wishes}
          onArrival={onWishArrival}
          onComplete={onWishComplete}
        />
      </group>
      <SnowParticles isMobile={isMobile} />
    </>
  );
}

export function ParticleTreeScene({
  isMobile,
  handX,
  scaleTarget,
  wishes,
  wishEnergy,
  onWishArrival,
  onWishComplete,
}: ParticleTreeSceneProps) {
  return (
    <div className="scene-canvas" aria-label="Interactive particle Christmas tree">
      <Canvas
        dpr={[1, isMobile ? 1.55 : 1.8]}
        camera={{ position: [2.45, 1.25, 11.75], fov: 42, near: 0.1, far: 60 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.04;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <CameraController />
        <SceneRoot
          isMobile={isMobile}
          handX={handX}
          scaleTarget={scaleTarget}
          wishes={wishes}
          wishEnergy={wishEnergy}
          onWishArrival={onWishArrival}
          onWishComplete={onWishComplete}
        />
        <SceneEffects />
      </Canvas>
    </div>
  );
}

