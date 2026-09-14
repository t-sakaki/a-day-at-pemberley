import type { EstateSceneInput } from './EstateScene';

// The Blender orthographic camera is 64 units wide. Its screen-right vector is
// (1,-1)/sqrt(2), whereas the game's is (1,-1)*sqrt(3)/2.
const PIXELS_PER_UNIT = (2048 / 64) / Math.sqrt(1.5);
let estate: HTMLImageElement | undefined;

/** Draw the offline Blender render using the game's live pan/zoom transform. */
export function drawBlenderEstate({ ctx, scale, project, hour }: EstateSceneInput): boolean {
  if (!estate) {
    estate = new Image();
    estate.src = `${import.meta.env.BASE_URL}blender/estate.png`;
  }
  // Keep the procedural scene usable while loading, or if the asset is missing.
  if (!estate.complete || estate.naturalWidth === 0) return false;
  const origin = project(0, 0);
  const ratio = scale / PIXELS_PER_UNIT;
  const dusk = Math.max(0, Math.min(1, (hour - 16) / 4));
  ctx.save();
  ctx.filter = `brightness(${1 - dusk * 0.24}) sepia(${dusk * 0.22})`;
  ctx.drawImage(estate, origin.x - 1024 * ratio, origin.y - 700 * ratio,
    2048 * ratio, 1400 * ratio);
  ctx.restore();
  return true;
}
