import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Phase-1 vertical slice: walk the Pemberley grounds in real 3D with a
// third-person chase camera, using the same estate.glb exported straight
// from build_estate.py (see blender/README.md). This is a standalone
// prototype, not yet wired into the main game state/UI — see AGENTS.md's
// "3D化（進行中）" phase list for what comes next.
const ESTATE_URL = `${import.meta.env.BASE_URL}blender/estate.glb`;

// Coarse placeholder collision for the main house footprint, hand-measured
// from build_estate.py's house/wing boxes (Three.js x = Blender x,
// Three.js z = -Blender y after the glTF exporter's Y-up conversion).
// Real per-object colliders come later (AGENTS.md phase 4).
const HOUSE_BLOCK = new THREE.Box3(
  new THREE.Vector3(-9.2, -1, -2.2),
  new THREE.Vector3(8.2, 8, 4.2),
);

// Only these named objects (see build_estate.py) count as ground for the
// foot-height raycast, so the player doesn't get hoisted onto tree canopies
// or rooftops. Everything (including foliage) still blocks the camera.
const WALK_SURFACE_NAMES = [
  'Meadow', 'Main walk', 'Cross walk', 'Promenade', 'Formal terrace paving',
  'Lake bank', 'Distant rise', 'Step',
];
const isWalkSurface = (obj: THREE.Object3D) =>
  WALK_SURFACE_NAMES.some(prefix => obj.name.startsWith(prefix));

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
}

function Player({ groundMeshes }: { groundMeshes: THREE.Object3D[] }) {
  const keys = useKeys();
  const group = useRef<THREE.Group>(null!);
  const yaw = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const { camera } = useThree();
  const cameraTarget = useRef(new THREE.Vector3(0, 1.4, -8));
  const walkMeshes = useMemo(() => groundMeshes.filter(isWalkSurface), [groundMeshes]);

  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 1 / 20);
    const speed = keys.current.shift ? 7.5 : 4.2;
    const move = new THREE.Vector3(
      (keys.current.d || keys.current.arrowright ? 1 : 0) - (keys.current.a || keys.current.arrowleft ? 1 : 0),
      0,
      (keys.current.s || keys.current.arrowdown ? 1 : 0) - (keys.current.w || keys.current.arrowup ? 1 : 0),
    );
    if (move.lengthSq() > 0) {
      move.normalize();
      const targetYaw = Math.atan2(move.x, move.z) + Math.PI;
      let diff = ((targetYaw - yaw.current + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      yaw.current += diff * Math.min(1, dt * 10);
      const next = g.position.clone();
      next.x += move.x * speed * dt;
      next.z += move.z * speed * dt;
      if (!HOUSE_BLOCK.containsPoint(new THREE.Vector3(next.x, 1, next.z))) {
        g.position.x = THREE.MathUtils.clamp(next.x, -30, 30);
        g.position.z = THREE.MathUtils.clamp(next.z, -30, 30);
      }
    }
    g.rotation.y = yaw.current;

    if (walkMeshes.length > 0) {
      raycaster.set(new THREE.Vector3(g.position.x, 40, g.position.z), new THREE.Vector3(0, -1, 0));
      const hits = raycaster.intersectObjects(walkMeshes, true);
      if (hits.length > 0) g.position.y = hits[0].point.y;
    }

    // Third-person chase camera, pulled in front of anything (trees, walls,
    // the bridge parapet, ...) that would otherwise clip through it.
    const eye = g.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const offsetDir = new THREE.Vector3(Math.sin(yaw.current), 0.45, Math.cos(yaw.current)).normalize();
    let camDist = 5.4;
    if (groundMeshes.length > 0) {
      raycaster.far = camDist;
      raycaster.set(eye, offsetDir);
      const camHits = raycaster.intersectObjects(groundMeshes, true);
      if (camHits.length > 0) camDist = Math.max(1.2, camHits[0].distance - 0.35);
      raycaster.far = Infinity;
    }
    const desired = eye.clone().add(offsetDir.multiplyScalar(camDist));
    camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
    cameraTarget.current.lerp(g.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 1 - Math.pow(0.0001, dt));
    camera.lookAt(cameraTarget.current);
  });

  return (
    <group ref={group} position={[0, 0, -8]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.95, 4, 8]} />
        <meshStandardMaterial color="#39493a" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#e8c9a0" />
      </mesh>
      <mesh position={[0, 1.78, 0.02]} castShadow>
        <coneGeometry args={[0.24, 0.2, 16]} />
        <meshStandardMaterial color="#1c2a24" />
      </mesh>
    </group>
  );
}

function Estate({ onLoaded }: { onLoaded: (meshes: THREE.Object3D[]) => void }) {
  const { scene } = useGLTF(ESTATE_URL);
  useEffect(() => {
    const meshes: THREE.Object3D[] = [];
    scene.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.receiveShadow = true;
        obj.castShadow = true;
        meshes.push(obj);
      }
    });
    onLoaded(meshes);
  }, [scene, onLoaded]);
  return <primitive object={scene} />;
}

export default function Pemberley3DDemo() {
  const [groundMeshes, setGroundMeshes] = useState<THREE.Object3D[]>([]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(#bcd0dd,#e9dcc2)' }}>
      <Canvas shadows camera={{ fov: 52, near: 0.1, far: 300, position: [0, 3, -2] }}>
        <hemisphereLight args={['#dbe9ff', '#5b6b4a', 0.9]} />
        <directionalLight
          position={[-14, 22, 10]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <Suspense fallback={null}>
          <Estate onLoaded={setGroundMeshes} />
          <Player groundMeshes={groundMeshes} />
        </Suspense>
      </Canvas>
      <div
        style={{
          position: 'fixed', left: 16, bottom: 16, color: '#fff', font: '13px sans-serif',
          background: 'rgba(20,26,20,.55)', padding: '8px 12px', borderRadius: 8,
        }}
      >
        WASD / arrow keys to walk, Shift to run — 3D walkthrough prototype (Phase 1)
      </div>
    </div>
  );
}

useGLTF.preload(ESTATE_URL);
