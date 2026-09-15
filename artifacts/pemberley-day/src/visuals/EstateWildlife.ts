import type { EstateSceneInput } from './EstateScene';
import { rabbitHop } from './RabbitHop';
type Species='deer'|'rabbit'|'sheep';
const animals=[
  {id:'deer-1',kind:'deer' as Species,x:7.8,y:8.2,phase:0},
  {id:'deer-2',kind:'deer' as Species,x:9.5,y:8.6,phase:2},
  {id:'rabbit-1',kind:'rabbit' as Species,x:2.3,y:9.7,phase:1.13},
  {id:'rabbit-2',kind:'rabbit' as Species,x:3.5,y:10.4,phase:3.57},
  {id:'sheep-1',kind:'sheep' as Species,x:7.1,y:12,phase:0},
  {id:'sheep-2',kind:'sheep' as Species,x:8.3,y:12.5,phase:1.33},
  {id:'sheep-3',kind:'sheep' as Species,x:9.5,y:12.3,phase:2.67},
];
const images=new Map<string,HTMLImageElement>();
export function wildlifeAt(time:number) {
  return animals.map(a=>{
    const t=time*.24+a.phase;
    const hop=a.kind==='rabbit'?rabbitHop(time,a.phase):null;
    const grazing=a.kind==='sheep';
    const cycle=Math.floor(time/6+a.phase),part=time/6+a.phase-cycle;
    const step=Math.max(0,(part-.8)/.2);
    const sx=(Math.sin(cycle*.8)*(1-step)+Math.sin((cycle+1)*.8)*step)*.35;
    const sy=(Math.cos(cycle*.8)*(1-step)+Math.cos((cycle+1)*.8)*step)*.2;
    return {...a,x:a.x+(hop?.x??(grazing?sx:Math.sin(t)*.65)),y:a.y+(hop?.y??(grazing?sy:Math.cos(t*.8)*.35)),face:hop?.face??(grazing?(Math.cos(cycle*.8)>0?1:-1):(Math.cos(t)>0?1:-1)),hop,grazing: grazing&&part<.8};
  });
}
export function drawWildlife(input:EstateSceneInput, animal:ReturnType<typeof wildlifeAt>[number]) {
  const {ctx,project,scale,time}=input;
  const frame=animal.hop?.frame??(animal.kind==='sheep'?(animal.grazing?1+Math.floor(time*2)%2:0):Math.floor(time*5+animal.phase)%3);
  const key=animal.kind+'-'+frame;
  let img=images.get(key);
  if(!img){img=new Image();img.src=import.meta.env.BASE_URL+'blender/animals/'+key+'.png';images.set(key,img);}
  const p=project(animal.x,animal.y);
  const size=animal.kind==='deer'?Math.max(44,scale*3.4):Math.max(24,scale*2);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(animal.face,1);
  const lift=animal.hop?.z??0;
  ctx.fillStyle=`rgba(39,55,35,${.27-lift*.35})`;ctx.beginPath();ctx.ellipse(0,0,size*(.18+lift*.1),size*.035,0,0,Math.PI*2);ctx.fill();
  const elevated=project(animal.x,animal.y,lift);
  ctx.translate(0,elevated.y-p.y);
  if(animal.hop){ctx.rotate(animal.hop.tilt);ctx.scale(animal.hop.scaleX,animal.hop.scaleY);}
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
