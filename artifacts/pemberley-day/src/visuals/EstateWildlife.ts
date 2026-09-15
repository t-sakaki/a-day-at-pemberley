import type { EstateSceneInput } from './EstateScene';
type Species='deer'|'rabbit';
const animals=[
  {id:'deer-1',kind:'deer' as Species,x:7.8,y:8.2,phase:0},
  {id:'deer-2',kind:'deer' as Species,x:9.5,y:8.6,phase:2},
  {id:'rabbit-1',kind:'rabbit' as Species,x:2.3,y:9.7,phase:1},
  {id:'rabbit-2',kind:'rabbit' as Species,x:3.5,y:10.4,phase:3},
];
const images=new Map<string,HTMLImageElement>();
export function wildlifeAt(time:number) {
  return animals.map(a=>{
    const t=time*.24+a.phase;
    return {...a,x:a.x+Math.sin(t)*.65,y:a.y+Math.cos(t*.8)*.35,face:Math.cos(t)>0?1:-1};
  });
}
export function drawWildlife(input:EstateSceneInput, animal:ReturnType<typeof wildlifeAt>[number]) {
  const {ctx,project,scale,time}=input;
  const frame=Math.floor(time*5+animal.phase)%3;
  const key=animal.kind+'-'+frame;
  let img=images.get(key);
  if(!img){img=new Image();img.src=import.meta.env.BASE_URL+'blender/animals/'+key+'.png';images.set(key,img);}
  const p=project(animal.x,animal.y);
  const size=animal.kind==='deer'?Math.max(44,scale*3.4):Math.max(24,scale*2);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(animal.face,1);
  ctx.fillStyle='#27372344';ctx.beginPath();ctx.ellipse(0,0,size*.18,size*.035,0,0,Math.PI*2);ctx.fill();
  if(img.complete&&img.naturalWidth) {
    // Camera centres and orthographic scales in build_wildlife.py put feet here.
    ctx.drawImage(img,-size/2,-size*(animal.kind==='deer'?.852941:.85),size,size);
  } else {
    // A quiet, deterministic silhouette also works if a sprite fails to load.
    ctx.fillStyle=animal.kind==='deer'?'#8d6845':'#8c8470';
    ctx.beginPath();ctx.ellipse(0,-size*.15,size*.18,size*.10,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(size*.16,-size*.23,size*.08,size*.08,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
