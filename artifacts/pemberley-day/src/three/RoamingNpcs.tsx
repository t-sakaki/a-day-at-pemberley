import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ROAMING_VISITORS, roamPosition, type Point } from '../systems/VisitorPlacement';
import { NPC_IDS, NpcModel, type NpcId } from './NpcModel';

// Drives NpcModel positions from the game's actual guest state (App.tsx's
// `estateVisitors`, itself from GuestManager) instead of the fixed spawn
// points GroundsScene used at first. Only guests who (a) have an entry in
// ROAMING_VISITORS (the ch.43 lawn-arrival cast) and (b) have a 3D model in
// NPC_IDS are rendered; everyone else in `visitorIds` is silently skipped
// (they still appear in the 2D EstateCanvas view).
const HAS_MODEL = new Set<string>(NPC_IDS);

export function RoamingNpcs({ visitorIds }: { visitorIds: string[] }) {
  const present = visitorIds.filter(id => ROAMING_VISITORS[id] && HAS_MODEL.has(id));
  return (
    <>
      {present.map((id, index) => (
        <RoamingNpc key={id} id={id as NpcId} index={index} />
      ))}
    </>
  );
}

function RoamingNpc({ id, index }: { id: NpcId; index: number }) {
  const home = ROAMING_VISITORS[id].home;
  const [pos, setPos] = useState<Point>(home);
  const last = useRef(0);
  useFrame((state) => {
    // Refresh a few times a second rather than every frame: NpcModel's
    // <primitive> re-parents the whole glTF scene on every render, which
    // is wasteful at 60fps for a slow lawn-wander animation.
    if (state.clock.elapsedTime - last.current < 0.08) return;
    last.current = state.clock.elapsedTime;
    setPos(roamPosition(home, index, state.clock.elapsedTime));
  });
  return <NpcModel id={id} x={pos.x} y={pos.y} />;
}
