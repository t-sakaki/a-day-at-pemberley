import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomPoint } from '../systems/InteriorNavigation';
import { GroundsScene } from './GroundsScene';
import { InteriorScene } from './InteriorScene';
import { CinematicEffects } from './CinematicEffects';
import type { Area } from './areas';

// A controlled counterpart to Pemberley3DDemo: instead of owning `area`/
// `spawn` itself (that version is the standalone ?three=1 prototype), this
// one is driven by the real game's `activeRoom`/`player`/`roomSpawn` state
// in App.tsx, so walking through a door calls back into the same
// enterRoom()/exitRoom() the 2D WalkableInterior already used. NPC/staff
// positions are not yet synced from game state (see AGENTS.md) — this is
// the walkthrough-rendering slice only.
export function Pemberley3DView({
  area, spawn, onTransition, visitorIds,
}: {
  area: Area;
  spawn: RoomPoint;
  onTransition: (area: Area, spawn: RoomPoint) => void;
  visitorIds?: string[];
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(#e3b98c,#f3dcb4)' }}>
      <Canvas
        shadows="soft"
        camera={{ fov: 52, near: 0.1, far: 300 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <Suspense fallback={null}>
          {area === 'grounds'
            ? <GroundsScene key="grounds" spawn={spawn} onTransition={onTransition} visitorIds={visitorIds} />
            : <InteriorScene key={area} room={area} spawn={spawn} onTransition={onTransition} />}
        </Suspense>
        <CinematicEffects />
      </Canvas>
    </div>
  );
}
