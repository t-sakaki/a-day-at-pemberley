import type { EstateSceneInput } from './EstateScene';
import {paintWaterSurface} from './WaterSurface';

// The Blender orthographic camera is 64 units wide. Its screen-right vector is
// (1,-1)/sqrt(2), whereas the game's is (1,-1)*sqrt(3)/2.
const PIXELS_PER_UNIT = (2048 / 64) / Math.sqrt(1.5);
let estate: HTMLImageElement | undefined;
let lakeMask:HTMLImageElement|undefined;
let water:HTMLCanvasElement|undefined;
let mask:HTMLCanvasElement|undefined;
let bounds:{x:number;y:number;w:number;h:number}|undefined;

function prepareWater(){
  if(lakeMask)return;
  lakeMask=new Image();
  lakeMask.onload=()=>{
    const canvas=document.createElement('canvas');
    canvas.width=lakeMask!.naturalWidth;canvas.height=lakeMask!.naturalHeight;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(lakeMask!,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    let left=canvas.width,top=canvas.height,right=0,bottom=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const i=(y*canvas.width+x)*4;
      pixels.data[i+3]=pixels.data[i];
      if(pixels.data[i]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    }
    if(right<=left||bottom<=top)return;
    ctx.putImageData(pixels,0,0);
    bounds={x:left,y:top,w:right-left+1,h:bottom-top+1};
    mask=document.createElement('canvas');mask.width=bounds.w;mask.height=bounds.h;
    mask.getContext('2d')!.drawImage(canvas,left,top,bounds.w,bounds.h,0,0,bounds.w,bounds.h);
    water=document.createElement('canvas');water.width=bounds.w;water.height=bounds.h;
  };
  lakeMask.src=`${import.meta.env.BASE_URL}blender/lake-mask.png`;
}

/** Draw the offline Blender render using the game's live pan/zoom transform. */
export function drawBlenderEstate({ ctx, scale, project, hour, time, rainy }: EstateSceneInput): boolean {
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
  prepareWater();
  if(water&&mask&&bounds&&lakeMask){
    const wc=water.getContext('2d')!;
    wc.clearRect(0,0,water.width,water.height);
    paintWaterSurface(wc,water.width,water.height,time,hour,rainy);
    wc.globalCompositeOperation='destination-in';wc.drawImage(mask,0,0);
    wc.globalCompositeOperation='source-over';
    const pixelRatio=2048/lakeMask.naturalWidth;
    ctx.drawImage(water,origin.x+(bounds.x*pixelRatio-1024)*ratio,origin.y+(bounds.y*pixelRatio-700)*ratio,bounds.w*pixelRatio*ratio,bounds.h*pixelRatio*ratio);
  }
  return true;
}
