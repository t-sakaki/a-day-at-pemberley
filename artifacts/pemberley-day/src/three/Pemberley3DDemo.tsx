import { Suspense, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomPoint } from '../systems/InteriorNavigation';
import { GroundsScene } from './GroundsScene';
import { InteriorScene } from './InteriorScene';
import { CinematicEffects } from './CinematicEffects';
import type { Area } from './areas';

// Phase 1+2 walkthrough prototype: the grounds (estate.glb) and the six
// interior rooms (blender/walk/<room>.glb) each render as their own glTF
// scene, swapped by `area` so walking through a real door — the front door,
// or any interior doorway from InteriorNavigation.ts's existing room graph —
// moves the player and camera straight into the next scene, instead of the
// main game's current "swap to a different 2D component" transition. This
// is a standalone prototype, not yet wired into the main game state/UI —
// see AGENTS.md's "3D化（進行中）" phase list for what comes next.
const GROUNDS_START: RoomPoint = { x: 0, y: 8 };

const AREA_LABELS: Record<Area, string> = {
  grounds: 'The grounds', hall: 'The grand hall', gallery: 'The picture gallery',
  music: 'The music room', window: 'The dining parlour', library: 'The library', bedroom: 'The guest chamber',
};

export default function Pemberley3DDemo() {
  const [area, setArea] = useState<Area>('grounds');
  const [spawn, setSpawn] = useState<RoomPoint>(GROUNDS_START);
  const transition = useCallback((nextArea: Area, nextSpawn: RoomPoint) => {
    setArea(nextArea);
    setSpawn(nextSpawn);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(#e3b98c,#f3dcb4)' }}>
      <Canvas
        shadows="soft"
        camera={{ fov: 52, near: 0.1, far: 300 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <Suspense fallback={null}>
          {area === 'grounds'
            ? <GroundsScene key="grounds" spawn={spawn} onTransition={transition} visitorIds={['darcy', 'elizabeth-bennet']} />
            : <InteriorScene key={area} room={area} spawn={spawn} onTransition={transition} />}
        </Suspense>
        <CinematicEffects />
      </Canvas>
      <div
        style={{
          position: 'fixed', left: 16, bottom: 16, color: '#fff', font: '13px sans-serif',
          background: 'rgba(20,26,20,.55)', padding: '8px 12px', borderRadius: 8,
        }}
      >
        {AREA_LABELS[area]} — WASD / arrow keys to walk, Shift to run, walk through a door
      </div>
    </div>
  );
}
