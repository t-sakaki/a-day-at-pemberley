import type { EstateFigure } from './EstateScene';
import { blenderCharacterId } from '../data/blenderCharacters';

const sprites = new Map<string, HTMLImageElement[]>();

/** Transparent, offline Blender renders. The caller retains shadows and emotion cues. */
export function drawBlenderCharacter(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  figure: EstateFigure, now: number,
): boolean {
  const id = blenderCharacterId(figure.portraitId ?? figure.id);
  if (!id) return false;
  let frames = sprites.get(id);
  if (!frames) {
    frames = [0, 1, 2].map(frame => {
      const img = new Image();
      img.decoding = 'async';
      img.src = `${import.meta.env.BASE_URL}blender/characters/${id}/body-${frame}.png`;
      return img;
    });
    sprites.set(id, frames);
  }
  // Do not swap to an unloaded walk frame or allocate images in the render loop.
  const ready = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
  if (!ready(frames[0])) return false;
  const index = figure.moving ? 1 + Math.floor(now / 170) % 2 : 0;
  const img = ready(frames[index]) ? frames[index] : frames[0];
  const height = size * 1.58;
  const width = height * img.naturalWidth / img.naturalHeight;
  ctx.save();
  ctx.translate(x, y);
  if ((figure.face ?? 0) < 0) ctx.scale(-1, 1);
  // Camera gives the full body a small transparent border, including 7% below the feet.
  ctx.drawImage(img, -width / 2, -height * .93, width, height);
  ctx.restore();
  return true;
}
