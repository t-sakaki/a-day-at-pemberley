import { useEffect, useRef } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// The player's low-poly Regency steward, built by blender/build_characters.py
// and exported by build_character_gltf.py: a 1-second, 25-frame walk cycle
// (four synced clips, one per arm/leg pivot) rather than a skinned/rigged
// animation. All four clips share identical timing, so just play/pause them
// together. The model's face points +Z once exported (Blender's -Y "front"
// becomes glTF +Z), the opposite of this group's own "facing" convention
// (see PlayerRig's yaw/offsetDir math), hence the extra 180° turn here.
const STEWARD_URL = `${import.meta.env.BASE_URL}blender/characters/steward.glb`;

export function Steward({ isMoving }: { isMoving: React.RefObject<boolean> }) {
  const { scene, animations } = useGLTF(STEWARD_URL);
  const group = useRef<THREE.Group>(null!);
  const { actions } = useAnimations(animations, group);
  const wasMoving = useRef(false);

  useEffect(() => {
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame(() => {
    const moving = isMoving.current;
    if (moving === wasMoving.current) return;
    wasMoving.current = moving;
    for (const action of Object.values(actions)) {
      if (!action) continue;
      if (moving) action.reset().play();
      else action.stop();
    }
  });

  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(STEWARD_URL);
