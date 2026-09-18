import { useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerRig, type DoorTrigger } from './PlayerRig';
import { doorsForRoom, moveInRoom, type InteriorRoomId, type RoomPoint } from '../systems/InteriorNavigation';
import { DEFAULT_ROOM_SPAWN, GROUNDS_SPAWN_FROM_HOUSE, type Area } from './areas';

const roomUrl = (room: InteriorRoomId) => `${import.meta.env.BASE_URL}blender/walk/${room}.glb`;

// A door with a positive `elevation` (the hall's stair-top doors to library/
// bedroom) should only fire once the player has actually climbed the stairs,
// not just walked near that (x,y) at ground level. build_grand_hall.py's
// landing sits around z=2.9, well above any ground-floor furniture.
const CLIMBED_LANDING_HEIGHT = 2.5;

export function InteriorScene({
  room, spawn, onTransition,
}: {
  room: InteriorRoomId;
  spawn: RoomPoint;
  onTransition: (area: Area, spawn: RoomPoint) => void;
}) {
  const { scene } = useGLTF(roomUrl(room));
  const [meshes, setMeshes] = useState<THREE.Object3D[]>([]);

  useEffect(() => {
    const found: THREE.Object3D[] = [];
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.receiveShadow = true;
        obj.castShadow = true;
        found.push(obj);
      }
    });
    setMeshes(found);
  }, [scene]);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const groundHeightAt = useMemo(() => (x: number, y: number) => {
    if (meshes.length === 0) return null;
    raycaster.set(new THREE.Vector3(x, 20, -y), new THREE.Vector3(0, -1, 0));
    const hits = raycaster.intersectObjects(meshes, true);
    return hits.length > 0 ? hits[0].point.y : null;
  }, [meshes, raycaster]);

  // Room-local +y runs from each room's entrance door toward its far wall
  // (e.g. the hall's stairs), the opposite sense from the grounds' world +y
  // (away from the house). Negate dy so "forward" (W/ArrowUp) consistently
  // means "deeper into the current area" in both the grounds and indoors.
  const step = useMemo(() => (pos: RoomPoint, dx: number, dy: number) => moveInRoom(room, pos, dx, -dy), [room]);

  const doors: DoorTrigger[] = useMemo(() => doorsForRoom(room).map(door => ({
    x: door.x, y: door.y, radius: 0.65,
    minHeight: door.elevation > 0 ? CLIMBED_LANDING_HEIGHT : undefined,
    onEnter: () => door.target === null
      ? onTransition('grounds', GROUNDS_SPAWN_FROM_HOUSE)
      : onTransition(door.target, door.arrival ?? DEFAULT_ROOM_SPAWN),
  })), [room, onTransition]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-4, 10, 5]} intensity={1.7} castShadow />
      <primitive object={scene} />
      {meshes.length > 0 && (
        <PlayerRig spawn={spawn} collisionMeshes={meshes} step={step} groundHeightAt={groundHeightAt}
          doors={doors} speed={2.6} runSpeed={4.0} />
      )}
    </>
  );
}
