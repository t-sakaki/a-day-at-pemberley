import { useEffect, useMemo, useState } from 'react';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerRig, type DoorTrigger } from './PlayerRig';
import type { RoomPoint } from '../systems/InteriorNavigation';
import { DEFAULT_ROOM_SPAWN, FRONT_DOOR_GROUNDS, FRONT_DOOR_RADIUS, type Area } from './areas';
import { RoamingNpcs } from './RoamingNpcs';
import { Hound } from './Hound';

const ESTATE_URL = `${import.meta.env.BASE_URL}blender/estate.glb`;

// Coarse placeholder collision for the main house footprint, hand-measured
// from build_estate.py's house/wing boxes (Three.js x = Blender x,
// Three.js z = -Blender y after the glTF exporter's Y-up conversion).
// Real per-object colliders come later (AGENTS.md phase 4).
const HOUSE_BLOCK = new THREE.Box3(new THREE.Vector3(-9.2, -1, -2.2), new THREE.Vector3(8.2, 8, 4.2));

// Only these named objects (see build_estate.py) count as ground for the
// foot-height raycast, so the player doesn't get hoisted onto tree canopies
// or rooftops. Everything (including foliage) still blocks the camera.
const WALK_SURFACE_NAMES = [
  'Meadow', 'Main walk', 'Cross walk', 'Promenade', 'Formal terrace paving',
  'Lake bank', 'Distant rise', 'Step', 'River bank', 'Village green',
];
const isWalkSurface = (obj: THREE.Object3D) => WALK_SURFACE_NAMES.some(prefix => obj.name.startsWith(prefix));

export function GroundsScene({
  spawn, onTransition, visitorIds = [], houndAt,
}: {
  spawn: RoomPoint;
  onTransition: (area: Area, spawn: RoomPoint) => void;
  visitorIds?: string[];
  /** Set while EventSystem's 'dog' emergency is active (App.tsx's `emergencies`); its `point`. */
  houndAt?: RoomPoint;
}) {
  const { scene } = useGLTF(ESTATE_URL);
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

  const walkMeshes = useMemo(() => meshes.filter(isWalkSurface), [meshes]);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const groundHeightAt = useMemo(() => (x: number, y: number) => {
    if (walkMeshes.length === 0) return null;
    raycaster.set(new THREE.Vector3(x, 40, -y), new THREE.Vector3(0, -1, 0));
    const hits = raycaster.intersectObjects(walkMeshes, true);
    return hits.length > 0 ? hits[0].point.y : null;
  }, [walkMeshes, raycaster]);

  const step = useMemo(() => (pos: RoomPoint, dx: number, dy: number): RoomPoint => {
    const next = { x: pos.x + dx, y: pos.y + dy };
    if (HOUSE_BLOCK.containsPoint(new THREE.Vector3(next.x, 1, -next.y))) return pos;
    return { x: THREE.MathUtils.clamp(next.x, -30, 30), y: THREE.MathUtils.clamp(next.y, -30, 30) };
  }, []);

  const doors: DoorTrigger[] = useMemo(() => [
    { x: FRONT_DOOR_GROUNDS.x, y: FRONT_DOOR_GROUNDS.y, radius: FRONT_DOOR_RADIUS,
      onEnter: () => onTransition('hall', DEFAULT_ROOM_SPAWN) },
  ], [onTransition]);

  return (
    <>
      {/* Golden-hour grade matching the owner's Austen Studio reference art,
          not a neutral daylight studio setup. */}
      <Environment preset="sunset" background blur={0.55} />
      <fog attach="fog" args={['#e8c9a0', 30, 105]} />
      <hemisphereLight args={['#ffd9a8', '#4f5a3d', 0.55]} />
      <directionalLight
        color="#ffc98a" position={[-16, 11, 14]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
      <primitive object={scene} />
      {meshes.length > 0 && (
        <PlayerRig spawn={spawn} collisionMeshes={meshes} step={step} groundHeightAt={groundHeightAt} doors={doors} />
      )}
      {/* Full 3D NPCs (see NpcModel.tsx), driven by the game's actual guest
          state — see RoamingNpcs.tsx and systems/VisitorPlacement.ts. */}
      <RoamingNpcs visitorIds={visitorIds} />
      {houndAt && <Hound x={houndAt.x} y={houndAt.y} />}
    </>
  );
}

useGLTF.preload(ESTATE_URL);
