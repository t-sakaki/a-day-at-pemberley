import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// The estate's escaped foxhound (EventSystem.ts's 'dog' emergency: "a loose
// hound is making trouble"), shown in the 3D grounds only while that
// emergency is active — see RoamingNpcs.tsx's pattern for how App.tsx's
// live state reaches GroundsScene. A small idle bob stands in for real
// motion until the emergency has its own escape path to animate along.
const HOUND_URL = `${import.meta.env.BASE_URL}blender/animals/hound.glb`;

export function Hound({ x, y }: { x: number; y: number }) {
  const { scene } = useGLTF(HOUND_URL);
  const group = useRef<THREE.Group>(null!);

  useEffect(() => {
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.03;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.3) * 0.5;
  });

  return (
    <group position={[x, 0, -y]}>
      <group ref={group}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(HOUND_URL);
