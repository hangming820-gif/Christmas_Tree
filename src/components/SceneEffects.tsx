import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

export function SceneEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.62}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.72}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.14} darkness={0.62} />
    </EffectComposer>
  );
}

