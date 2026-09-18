import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomPoint } from '../systems/InteriorNavigation';
import { Steward } from './Steward';

export type DoorTrigger = {
  x: number; y: number; radius: number;
  /** Only usable once the player's real (raycast) height clears this, e.g. the hall landing. */
  minHeight?: number;
  onEnter: () => void;
};

type Props = {
  spawn: RoomPoint;
  collisionMeshes: THREE.Object3D[];
  step: (pos: RoomPoint, dx: number, dy: number) => RoomPoint;
  groundHeightAt: (x: number, y: number) => number | null;
  doors: DoorTrigger[];
  speed?: number;
  runSpeed?: number;
};

const MOVEMENT_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'];

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const set = (e: KeyboardEvent, value: boolean) => {
      const code = e.key.toLowerCase();
      // Arrow keys scroll the page by default; without preventDefault they
      // fight the game's own movement (WASD has no such default, which is
      // why only the arrow keys looked broken).
      if (MOVEMENT_KEYS.includes(code)) e.preventDefault();
      keys.current[code] = value;
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
}

/** Shared third-person walker: WASD/arrows in room/world x,y, a camera-collision
 * chase cam, and proximity door triggers. `step`/`groundHeightAt` encapsulate
 * whatever collision the current area (grounds vs. an interior room) needs. */
export function PlayerRig({ spawn, collisionMeshes, step, groundHeightAt, doors, speed = 4.2, runSpeed = 7.5 }: Props) {
  const keys = useKeys();
  const group = useRef<THREE.Group>(null!);
  const local = useRef<RoomPoint>(spawn);
  // Matches the yaw that holding "forward" converges to (see the movedX/
  // movedZ → targetYaw formula below): starting anywhere else briefly makes
  // the chase camera sit in front of the player instead of behind, so the
  // very first key press looks reversed until movement corrects it.
  const yaw = useRef(Math.PI);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3());
  const spawnedAt = useRef(performance.now());
  const fired = useRef(false);
  const firstFrame = useRef(true);
  const isMoving = useRef(false);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 1 / 10);
    const currentSpeed = keys.current.shift ? runSpeed : speed;
    const dx = (keys.current.d || keys.current.arrowright ? 1 : 0) - (keys.current.a || keys.current.arrowleft ? 1 : 0);
    const dy = (keys.current.s || keys.current.arrowdown ? 1 : 0) - (keys.current.w || keys.current.arrowup ? 1 : 0);
    const len = Math.hypot(dx, dy);
    isMoving.current = false;
    if (len > 0) {
      const before = local.current;
      local.current = step(before, (dx / len) * currentSpeed * dt, (dy / len) * currentSpeed * dt);
      const movedX = local.current.x - before.x;
      const movedZ = -(local.current.y - before.y);
      if (movedX * movedX + movedZ * movedZ > 1e-8) {
        isMoving.current = true;
        const targetYaw = Math.atan2(movedX, movedZ) + Math.PI;
        // Snap the camera behind the new travel direction immediately rather
        // than easing into it: with the old gradual turn, pressing a key
        // that reverses direction from a standstill left the camera briefly
        // facing the old way, so the character appeared to walk *toward*
        // the camera (reading as "moving forward on screen") instead of
        // away from it, no matter which key was pressed.
        yaw.current = targetYaw;
      }
    }
    g.position.x = local.current.x;
    g.position.z = -local.current.y;
    g.rotation.y = yaw.current;

    const groundY = groundHeightAt(local.current.x, local.current.y);
    if (groundY !== null) g.position.y = groundY;

    if (!fired.current && performance.now() - spawnedAt.current > 750) {
      const door = doors.find(d =>
        Math.hypot(local.current.x - d.x, local.current.y - d.y) < d.radius &&
        (d.minHeight === undefined || g.position.y >= d.minHeight));
      if (door) { fired.current = true; door.onEnter(); }
    }

    const eye = g.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const offsetDir = new THREE.Vector3(Math.sin(yaw.current), 0.45, Math.cos(yaw.current)).normalize();
    let camDist = 5.4;
    if (collisionMeshes.length > 0) {
      raycaster.far = camDist;
      raycaster.set(eye, offsetDir);
      const camHits = raycaster.intersectObjects(collisionMeshes, true);
      if (camHits.length > 0) camDist = Math.max(1.0, camHits[0].distance - 0.3);
      raycaster.far = Infinity;
    }
    const desired = eye.clone().add(offsetDir.multiplyScalar(camDist));
    const lookTarget = g.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    if (firstFrame.current) {
      camera.position.copy(desired);
      cameraTarget.current.copy(lookTarget);
      firstFrame.current = false;
    } else {
      camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
      cameraTarget.current.lerp(lookTarget, 1 - Math.pow(0.0001, dt));
    }
    camera.lookAt(cameraTarget.current);
  });

  return (
    <group ref={group} position={[spawn.x, 0, -spawn.y]}>
      <Steward isMoving={isMoving} />
    </group>
  );
}
