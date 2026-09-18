import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// A light cinematic grade over the whole 3D walkthrough, aiming for the warm,
// soft-lit look of the owner's "Austen Studio" reference art (golden-hour
// light, gentle glow, no harsh contrast) rather than a literal watercolor
// shader — see the pemberley-3d-conversion memory for why that was dropped.
export function CinematicEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        luminanceThreshold={0.55}
        luminanceSmoothing={0.3}
        intensity={0.45}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.28} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
