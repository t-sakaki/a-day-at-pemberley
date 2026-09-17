import type { InteriorRoomId, RoomPoint } from '../systems/InteriorNavigation';

export type Area = 'grounds' | InteriorRoomId;

// Matches WalkableInterior's fallback spawn ({x:0,y:-3}) for ring doors
// (hall/gallery/music/window) that don't specify an explicit `arrival`.
export const DEFAULT_ROOM_SPAWN: RoomPoint = { x: 0, y: -3 };

// Matches App.tsx's exitRoom() outdoor respawn point.
export const GROUNDS_SPAWN_FROM_HOUSE: RoomPoint = { x: -0.5, y: 3.8 };

// Matches App.tsx's front-door proximity check (Math.hypot(x+.5,y-2.6)<1.8).
export const FRONT_DOOR_GROUNDS: RoomPoint = { x: -0.5, y: 2.6 };
export const FRONT_DOOR_RADIUS = 1.8;
