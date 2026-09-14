import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { adjoiningRoom, moveInRoom, roomDoors, roomElevation, type InteriorRoomId } from '../systems/InteriorNavigation';
import { paintWalkableRoom, roomProjection } from '../visuals/WalkableRoomScene';

type Props = {
  room: InteriorRoomId; name: string; names: Record<InteriorRoomId,string>; language: string; band: string;
  joystickRef: MutableRefObject<{ x: number; y: number }>;
  actionRef: MutableRefObject<(() => void) | null>;
  blocked: boolean; onExit: () => void; onNavigate: (room: InteriorRoomId) => void; onTend: () => void;
};
export function WalkableInterior(props: Props) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const live=useRef(props); live.current=props;
  const [status,setStatus]=useState('loading');
  const [doorPositions,setDoorPositions]=useState<{x:number;y:number}[]>([]);
  const {room,joystickRef,actionRef}=props;
  useEffect(() => {
    const canvas=canvasRef.current!;
    const ctx=canvas.getContext('2d')!;
    const layer=document.createElement('canvas');
    let player={x:0,y:-3}, keys:Record<string,boolean>={}, last=performance.now(), frame=0, face=1;
    let nearest=-1, previousStatus='', lastUI=0, transitioned=false;
    const started=last;
    const clear=()=>{ keys={}; joystickRef.current={x:0,y:0}; };
    const travel=(index:number)=>{
      if (transitioned) return;
      transitioned=true; clear();
      if (index===0) live.current.onExit();
      else live.current.onNavigate(adjoiningRoom(room,roomDoors[index].direction));
    };
    const action=()=>{ if(nearest>=0)travel(nearest); else live.current.onTend(); };
    actionRef.current=action;
    const key=(event:KeyboardEvent)=>{
      if (live.current.blocked || document.querySelector('[role="dialog"]')) { clear(); return; }
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const code=event.key.toLowerCase();
      if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','escape'].includes(code)) event.preventDefault();
      keys[code]=event.type==='keydown';
      if(event.type==='keydown'&&!event.repeat) {
        if(code==='e')action();
        if(code==='escape')travel(0);
      }
    };
    window.addEventListener('keydown',key); window.addEventListener('keyup',key); window.addEventListener('blur',clear);
    canvas.focus();
    const draw=(now:number)=>{
      const dt=Math.min((now-last)/1000,.05); last=now;
      const blocked=live.current.blocked || Boolean(document.querySelector('[role="dialog"]'));
      if(blocked)clear();
      const horizontal=(Number(Boolean(keys.d||keys.arrowright))-Number(Boolean(keys.a||keys.arrowleft)))+joystickRef.current.x;
      const vertical=(Number(Boolean(keys.s||keys.arrowdown))-Number(Boolean(keys.w||keys.arrowup)))+joystickRef.current.y;
      const length=Math.max(1,Math.hypot(horizontal,vertical));
      const speed=(keys.shift?3.4:2.4)*dt;
      // Screen-relative controls for the fixed isometric camera.
      const dx=(horizontal*.786+vertical*.618)/length*speed;
      const dy=(horizontal*.618-vertical*.786)/length*speed;
      const next=blocked?player:moveInRoom(room,player,dx,dy);
      const moving=Math.hypot(next.x-player.x,next.y-player.y)>.001;
      if(Math.abs(horizontal)>.05)face=horizontal<0?-1:1;
      player=next;
      nearest=roomDoors.findIndex(d=>Math.hypot(player.x-d.x,player.y-d.y)<.58);
      if(moving&&nearest>=0&&now-started>750)travel(nearest);
      const w=canvas.clientWidth,h=canvas.clientHeight;
      const ratio=Math.min(window.devicePixelRatio||1,2);
      if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)) { canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio); }
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const currentStatus=paintWalkableRoom(ctx,layer,room,player,moving,face,now,live.current.band,w,h);
      canvas.dataset.x=player.x.toFixed(3);canvas.dataset.y=player.y.toFixed(3);
      canvas.dataset.elevation=roomElevation(room,player).toFixed(3);
      canvas.dataset.asset=currentStatus;
      if(currentStatus!==previousStatus){previousStatus=currentStatus;setStatus(currentStatus);}
      if(now-lastUI>80){
        lastUI=now;
        const project=roomProjection(room,w,h,player).project;
        setDoorPositions(roomDoors.map(d=>{
          const p=project(d);
          return {x:Math.max(82,Math.min(w-82,p.x)),y:Math.max(185,Math.min(h-150,p.y))};
        }));
      }
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(frame);clear();if(actionRef.current===action)actionRef.current=null;window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',clear);};
  },[room,joystickRef,actionRef]);
  const ja=props.language==='ja';
  return <div className="walkable-interior" data-room={room}>
    <canvas ref={canvasRef} className="interior-walk-canvas" tabIndex={0} role="img" aria-label={props.name} />
    <div className="interior-room-tools">
      <button onClick={props.onExit}>{ja?'庭へ戻る':'Return to grounds'}</button>
      <button onClick={props.onTend}>{room==='hall'?(ja?'部屋を見学する':'Explore the rooms'):(ja?'部屋を整える':'Set the room in order')}</button>
      <span>{ja?'WASD / 移動パッドで歩く・扉で移動':'Walk with WASD / movement pad · walk to a door'}</span>
    </div>
    {doorPositions.map((p,i)=><button key={i} className="interior-door" style={{left:p.x,top:p.y}}
      onClick={()=>i===0?props.onExit():props.onNavigate(adjoiningRoom(room,roomDoors[i].direction))}>
      {i===0?(ja?'出口 → 庭':'Exit → grounds'):`→ ${props.names[adjoiningRoom(room,roomDoors[i].direction)]}`}
    </button>)}
    {status!=='ready'&&<p className="interior-load-status" role="status">{status==='fallback'?(ja?'画像を読み込めないため、間取り表示で歩けます。':'Image unavailable; walking in floor-plan view.'):(ja?'室内を読み込み中…':'Loading room…')}</p>}
  </div>;
}
