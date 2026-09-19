// Shared between the 2D EstateCanvas (App.tsx) and the 3D GroundsScene:
// where each roaming visitor's wander is centered, and the (deterministic,
// time-based) sine/cosine path they walk around that point. Ch.43's
// post-arrival lawn scene — Darcy, Georgiana, Bingley, Elizabeth appear here
// once GuestManager marks them as arrived, see App.tsx's `estateVisitors`.
export type Point = { x: number; y: number };

export const ROAMING_VISITORS: Record<string, { kind: 'lady' | 'gent'; home: Point }> = {
  darcy: { kind: 'gent', home: { x: 3, y: 6 } },
  georgiana: { kind: 'lady', home: { x: -2, y: 8 } },
  bingley: { kind: 'gent', home: { x: 6, y: 8 } },
  'elizabeth-bennet': { kind: 'lady', home: { x: 0, y: 9 } },
};

export function roamPosition(home: Point, index: number, tSeconds: number): Point {
  return {
    x: home.x + Math.sin(tSeconds * (0.16 + index * 0.02) + index * 2) * 1.6,
    y: home.y + Math.cos(tSeconds * (0.13 + index * 0.02) + index * 2) * 1.0,
  };
}
