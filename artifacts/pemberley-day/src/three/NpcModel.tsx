import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Full 3D NPCs, replacing the earlier camera-facing billboard sprites
// (NpcBillboard.tsx) per the owner's direction after seeing billboards in
// the actual game. Reuses the same make_person()/build_character_gltf.py
// pipeline as the player's "steward" model (see Steward.tsx for the export
// details and the 180° facing-fix rationale — identical here since both
// come from the same Blender rig).
export const NPC_IDS = ['darcy', 'elizabeth-bennet'] as const;
export type NpcId = (typeof NPC_IDS)[number];

const npcUrl = (id: NpcId) => `${import.meta.env.BASE_URL}blender/characters/${id}.glb`;

export function NpcModel({ id, x, y, facing = Math.PI }: { id: NpcId; x: number; y: number; facing?: number }) {
  const { scene } = useGLTF(npcUrl(id));

  useEffect(() => {
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group position={[x, 0, -y]} rotation={[0, facing, 0]}>
      <primitive object={scene} />
    </group>
  );
}

NPC_IDS.forEach(id => useGLTF.preload(npcUrl(id)));
