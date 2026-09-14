import type { RoomSceneInput } from './RoomScene';

type InteriorId = 'gallery' | 'music' | 'window' | 'music-wanting' | 'window-wanting';
const images = new Map<InteriorId, HTMLImageElement>();

/** Cache offline renders; retain the procedural room until an image is decoded. */
export function drawBlenderRoom({ ctx, width, height, roomId, band }: RoomSceneInput): boolean {
  if (roomId === 'grounds') return false;
  const id: InteriorId = band === 'wanting' && roomId !== 'gallery' ? `${roomId}-wanting` : roomId;
  let image = images.get(id);
  if (!image) {
    image = new Image();
    image.src = `${import.meta.env.BASE_URL}blender/interiors/${id}.jpg`;
    images.set(id, image);
  }
  if (!image.complete || !image.naturalWidth) return false;
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * ratio;
  const h = image.naturalHeight * ratio;
  ctx.save();
  ctx.fillStyle = '#242a26';
  ctx.fillRect(0, 0, width, height);
  ctx.filter = band === 'wanting' ? 'brightness(0.68) saturate(0.65)' : band === 'civil' ? 'brightness(0.88)' : 'none';
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  ctx.restore();
  return true;
}
