import { drawBlenderCharacter } from './BlenderCharacter';
import type {RoomWorker} from '../systems/StaffWorkplaces';
import { roomElevation, roomObstacles, type InteriorRoomId, type RoomPoint } from '../systems/InteriorNavigation';

type Metadata = {
  width: number; height: number; origin: number[]; axes: number[][];
  camera: number[]; direction: number[]; depthWidth: number; depthHeight: number; depth: number[];
};
type Asset = { image: HTMLImageElement; metadata?: Metadata; failed: boolean };
const assets = new Map<InteriorRoomId, Asset>();
export function roomAsset(id: InteriorRoomId): Asset {
  let asset = assets.get(id);
  if (!asset) {
    const image = new Image();
    const entry: Asset = { image, failed: false };
    assets.set(id, entry);
    image.onerror = () => { entry.failed = true; };
    image.src = `${import.meta.env.BASE_URL}blender/walk/${id}.png`;
    fetch(`${import.meta.env.BASE_URL}blender/walk/${id}.json`)
      .then(r => { if (!r.ok) throw new Error('Room metadata unavailable'); return r.json(); })
      .then(data => { entry.metadata = data as Metadata; })
      .catch(() => { entry.failed = true; });
    asset = entry;
  }
  return asset;
}

export function roomProjection(id: InteriorRoomId, w: number, h: number, player: RoomPoint) {
  const meta = roomAsset(id).metadata;
  const origin = meta?.origin ?? [.5, .60];
  const axes = meta?.axes ?? [[.045, .025], [.035, -.031], [0, -.06]];
  const projectUV = (p: RoomPoint, z = 0) => ({
    x: origin[0] + axes[0][0] * p.x + axes[1][0] * p.y + axes[2][0] * z,
    y: origin[1] + axes[0][1] * p.x + axes[1][1] * p.y + axes[2][1] * z,
  });
  const zoom = w < 600 ? 1.65 : 1.12;
  const scale = Math.min(w / 1100, h / 900) * zoom;
  const width = 1100 * scale, height = 900 * scale;
  const focus = projectUV(player);
  const ox = width > w ? Math.max(w - width, Math.min(0, w / 2 - focus.x * width)) : (w - width) / 2;
  const oy = height > h ? Math.max(h - height, Math.min(0, h * .65 - focus.y * height)) : (h - height) / 2;
  return { width, height, ox, oy, projectUV,
    project: (p: RoomPoint, z = 0) => { const v = projectUV(p, z); return { x: ox + v.x * width, y: oy + v.y * height }; } };
}

export function paintWalkableRoom(
  ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, id: InteriorRoomId,
  player: RoomPoint, moving: boolean, face: number, now: number, band: string, w: number, h: number, workers:RoomWorker[]=[],
) {
  const asset = roomAsset(id);
  const projection = roomProjection(id, w, h, player);
  const { project, ox, oy, width, height } = projection;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#243531'; ctx.fillRect(0, 0, w, h);
  const ready = !asset.failed && asset.metadata && asset.image.complete && asset.image.naturalWidth > 0;
  if (ready) {
    ctx.save(); ctx.filter = band === 'wanting' ? 'brightness(.72) saturate(.7)' : 'none';
    ctx.drawImage(asset.image, ox, oy, width, height); ctx.restore();
  } else {
    // A navigable floor-plan fallback, sharing exactly the same collision model.
    const polygon = (x: number, y: number, rw: number, rh: number, color: string) => {
      ctx.beginPath();
      [[x-rw/2,y-rh/2],[x+rw/2,y-rh/2],[x+rw/2,y+rh/2],[x-rw/2,y+rh/2]].forEach(([xx,yy],i) => {
        const p = project({x:xx,y:yy}); if (i) ctx.lineTo(p.x,p.y); else ctx.moveTo(p.x,p.y);
      });
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    };
    polygon(0,0,10,9,'#b49c72');
    roomObstacles[id].forEach(o => polygon(o.x,o.y,o.w,o.h,'#655240'));
  }
  const actors=[...workers.map(worker=>({...worker,moving:false,face:1})),{...player,id:'steward',name:'',kind:'steward' as const,color:'#c8985c',moving,face}]
    .sort((a,b)=>project(a,roomElevation(id,a)).y-project(b,roomElevation(id,b)).y);
  for(const actor of actors){
  const player=actor;
  const elevation = roomElevation(id,player);
  const foot = project(player,elevation);
  const top = project(player, elevation+1.8);
  const size = Math.max(10, (foot.y - top.y) / 1.35);
  ctx.fillStyle = 'rgba(20,24,17,.3)'; ctx.beginPath();
  ctx.ellipse(foot.x,foot.y,size*.28,size*.08,0,0,Math.PI*2); ctx.fill();
  if (layer.width !== Math.ceil(w) || layer.height !== Math.ceil(h)) { layer.width = Math.ceil(w); layer.height = Math.ceil(h); }
  const lc = layer.getContext('2d', { willReadFrequently: true })!;
  lc.clearRect(0,0,w,h);
  const drawn = drawBlenderCharacter(lc,foot.x,foot.y,size,{id:actor.id,x:player.x,y:player.y,kind:actor.kind,color:actor.color,moving:actor.moving,face:actor.face},now);
  if (!drawn) {
    lc.fillStyle='#d3ad63'; lc.beginPath(); lc.ellipse(foot.x,foot.y-size*.5,size*.17,size*.5,0,0,Math.PI*2); lc.fill();
  }
  const meta = asset.metadata;
  if (ready && meta) {
    // Compare each avatar pixel with the baked camera-space depth of furniture.
    const left = Math.max(0, Math.floor(foot.x-size*.6));
    const ytop = Math.max(0, Math.floor(foot.y-size*1.5));
    const rw = Math.min(layer.width-left,Math.ceil(size*1.2));
    const rh = Math.min(layer.height-ytop,Math.ceil(size*1.65));
    if (rw > 0 && rh > 0) {
      const pixels=lc.getImageData(left,ytop,rw,rh);
      const footDepth=(player.x-meta.camera[0])*meta.direction[0]+(player.y-meta.camera[1])*meta.direction[1]+(elevation-meta.camera[2])*meta.direction[2];
      const pixelsPerZ=foot.y-project(player,elevation+1).y;
      for (let yy=0;yy<rh;yy++) for (let xx=0;xx<rw;xx++) {
        const index=(yy*rw+xx)*4+3;
        if (!pixels.data[index]) continue;
        const u=(left+xx-ox)/width,v=(ytop+yy-oy)/height;
        if (u<0||u>=1||v<0||v>=1) continue;
        const sceneDepth=meta.depth[Math.floor(v*meta.depthHeight)*meta.depthWidth+Math.floor(u*meta.depthWidth)]/100;
        const z=Math.max(0,(foot.y-ytop-yy)/pixelsPerZ);
        if (sceneDepth < footDepth+z*meta.direction[2]-.12) pixels.data[index]=0;
      }
      lc.putImageData(pixels,left,ytop);
    }
  }
  ctx.drawImage(layer,0,0);
  if(actor.name){ctx.font='10px Georgia';ctx.textAlign='center';ctx.fillStyle='#fff1d3';ctx.fillText(actor.name,top.x,top.y-6);}
  }
  return ready ? 'ready' : asset.failed ? 'fallback' : 'loading';
}
