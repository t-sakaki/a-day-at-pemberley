import { useMemo } from 'react';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Character portraits sourced from the owner's separate "Austen Studio"
// production bible (austen-studio.taira-sakakibara.workers.dev): a full
// 8-direction/expression sheet per person. We only use each sheet's single
// isolated "main pose" cutout (background removed) as a camera-facing
// billboard, matching the owner's chosen approach over rebuilding these as
// low-poly 3D meshes. Heights are estimated from the sheets' relative
// height-comparison chart, not exact.
export const AUSTEN_CHARACTERS = ['darcy', 'elizabeth', 'jane', 'bingley', 'catherine', 'georgiana'] as const;
export type AustenCharacterId = (typeof AUSTEN_CHARACTERS)[number];

const HEIGHT_METERS: Record<AustenCharacterId, number> = {
  darcy: 1.88,
  bingley: 1.78,
  elizabeth: 1.65,
  jane: 1.68,
  georgiana: 1.58,
  catherine: 1.64,
};

const textureUrl = (id: AustenCharacterId) => `${import.meta.env.BASE_URL}characters/austen/${id}.png`;

export function NpcBillboard({ id, x, y }: { id: AustenCharacterId; x: number; y: number }) {
  const texture = useTexture(textureUrl(id));
  const height = HEIGHT_METERS[id];
  const width = useMemo(() => {
    const image = texture.image as { width: number; height: number } | undefined;
    const aspect = image && image.height ? image.width / image.height : 0.34;
    return height * aspect;
  }, [texture, height]);

  return (
    <Billboard position={[x, height / 2, -y]}>
      <mesh castShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} transparent alphaTest={0.3} side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  );
}

AUSTEN_CHARACTERS.forEach(id => useTexture.preload(textureUrl(id)));
