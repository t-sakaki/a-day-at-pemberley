export type InteriorRoomId = 'hall' | 'gallery' | 'music' | 'window' | 'library' | 'bedroom';
export const isUpperRoom = (room: InteriorRoomId): room is 'library' | 'bedroom' => room === 'library' || room === 'bedroom';
export type RoomPoint = { x: number; y: number };
export type Obstacle = { x: number; y: number; w: number; h: number };
export const interiorRooms: InteriorRoomId[] = ['hall', 'gallery', 'music', 'window'];
export const roomObstacles: Record<InteriorRoomId, Obstacle[]> = {
  library: [{x:0,y:3.8,w:9,h:1},{x:0,y:.3,w:2.7,h:1.4},{x:0,y:-.9,w:.8,h:.8}],
  bedroom: [{x:-1.7,y:1.7,w:2.8,h:3.9},{x:2.9,y:2.6,w:1.7,h:.85},{x:2.6,y:0,w:.8,h:.8}],
  hall: [
    { x: -1.55, y: .5, w: .16, h: 3.2 }, { x: 1.55, y: .5, w: .16, h: 3.2 },
    { x: -4.2, y: 1.65, w: 1.2, h: .16 }, { x: 4.2, y: 1.65, w: 1.2, h: .16 },
  ],
  gallery: [
    { x: 0, y: -1.4, w: 2.7, h: .9 }, { x: -3.3, y: 3.6, w: 2.4, h: .8 },
    { x: 3.5, y: 3.5, w: .8, h: .8 }, { x: -3.2, y: .6, w: .8, h: .9 },
    { x: 3.2, y: .6, w: .8, h: .9 },
  ],
  music: [
    { x: -.8, y: .5, w: 2.6, h: 1.12 }, { x: -.8, y: -1.02, w: .85, h: .55 },
    { x: 2.7, y: 3.9, w: 2.8, h: 1.1 }, { x: 2.7, y: -.5, w: .95, h: 1 },
    { x: -3.65, y: 2.8, w: 1.4, h: .8 },
  ],
  window: [
    { x: 0, y: .1, w: 3.4, h: 1.45 }, { x: -3.55, y: 2.8, w: 1.9, h: .85 },
    ...[-1.15, 0, 1.15].flatMap(x => [-1.05, 1.22].map(y => ({ x, y, w: .8, h: .8 }))),
  ],
};
/** Shared with the twenty 15 cm treads in build_grand_hall.py. */
export function roomElevation(room: InteriorRoomId, p: RoomPoint): number {
  if (room !== 'hall') return 0;
  if (p.y >= 2) return 3;
  return Math.abs(p.x) < 1.55 && p.y > -1 ? p.y + 1 : 0;
}
export function canStand(room: InteriorRoomId, p: RoomPoint): boolean {
  const radius = .20;
  return Math.abs(p.x) <= 4.6 && p.y >= -4 && p.y <= 3.9 &&
    !roomObstacles[room].some(o => Math.abs(p.x - o.x) < o.w / 2 + radius && Math.abs(p.y - o.y) < o.h / 2 + radius);
}
/** Small substeps prevent tunnelling; axis separation permits sliding along furniture. */
export function moveInRoom(room: InteriorRoomId, p: RoomPoint, dx: number, dy: number): RoomPoint {
  const next = { ...p };
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / .08));
  for (let i = 0; i < steps; i++) {
    const safe = (p: RoomPoint) => canStand(room,p) && Math.abs(roomElevation(room,p)-roomElevation(room,next)) < .15;
    if (safe({ x: next.x + dx / steps, y: next.y })) next.x += dx / steps;
    if (safe({ x: next.x, y: next.y + dy / steps })) next.y += dy / steps;
  }
  return next;
}
export const roomDoors = [
  { x: 0, y: -3.75, direction: 0 },
  { x: -4.35, y: -2.7, direction: -1 },
  { x: 4.35, y: -2.7, direction: 1 },
];
export function adjoiningRoom(room: InteriorRoomId, direction: number): InteriorRoomId {
  return interiorRooms[(interiorRooms.indexOf(room) + direction + interiorRooms.length) % interiorRooms.length];
}
export type RoomDoor = RoomPoint & { target: InteriorRoomId | null; elevation: number; arrival?: RoomPoint };
export function doorsForRoom(room: InteriorRoomId): RoomDoor[] {
  if (isUpperRoom(room)) return [{x:0,y:-3.75,target:'hall',elevation:0,arrival:{x:room==='library'?-3.65:3.65,y:2.8}}];
  const doors: RoomDoor[]=roomDoors.map(d=>({...d,target:d.direction===0?null:adjoiningRoom(room,d.direction),elevation:0}));
  if(room==='hall') doors.push(
    {x:-3.65,y:3.7,target:'library',elevation:3},
    {x:3.65,y:3.7,target:'bedroom',elevation:3},
  );
  return doors;
}
