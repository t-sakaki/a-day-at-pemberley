import {tourRooms} from './TourSystem';
import {canStand,type InteriorRoomId,type RoomPoint} from './InteriorNavigation';
export type Workplace={room:InteriorRoomId|null;point:RoomPoint;absent:boolean;dispatched:boolean};
export type RoomWorker=RoomPoint & {id:string;name:string;kind:'lady'|'gent'|'steward';color:string};
export function staffWorkplace(focus:string,home:RoomPoint,absent:boolean,emergency?:RoomPoint):Workplace {
  if(emergency)return {room:null,point:emergency,absent,dispatched:true};
  const tour=tourRooms.find(r=>r.focus===focus);
  const extra:Record<string,InteriorRoomId>={'Grand hall':'hall','Library':'library','Guest chamber':'bedroom'};
  return {room:tour&&tour.id!=='grounds'?tour.id:extra[focus]??null,point:tour?.point??home,absent,dispatched:false};
}
/** Spread staff across walkable work positions, never inside furniture or doors. */
export function workerPoint(room:InteriorRoomId,index:number):RoomPoint {
  const slots:RoomPoint[]=[];
  for(const y of room==='hall'?[-1.8,-.6]:[2.7,1.6,.5,-.6])for(const x of [-3.8,-2.6,-1.4,0,1.4,2.6,3.8]){
    const p={x,y};if(canStand(room,p))slots.push(p);
  }
  return slots[index%slots.length]??{x:0,y:-2};
}
