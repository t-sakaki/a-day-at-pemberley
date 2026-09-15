/** Stylized quiet garden hops, not a measured biomechanical simulation. */
export const HOP_PERIOD=1.8;
export function rabbitHop(time:number,offset:number) {
  const clock=time/HOP_PERIOD+offset;
  const cycle=Math.floor(clock), phase=clock-cycle;
  const flight=Math.max(0,Math.min(1,(phase-.30)/.30));
  const airborne=phase>=.30&&phase<.60;
  const crouch=phase>=.20&&phase<.30?Math.sin((phase-.20)/.10*Math.PI):0;
  const settle=phase>=.60&&phase<.72?Math.sin((phase-.60)/.12*Math.PI):0;
  const progress=flight*flight*(3-2*flight);
  const point=(n:number)=>({x:Math.sin(n*.7+offset)*.65,y:Math.cos(n*.56+offset)*.35});
  const from=point(cycle),to=point(cycle+1);
  return {
    x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress,
    z:airborne?.32*4*flight*(1-flight):0,
    frame:airborne?(flight<.65?1:2):settle>0?2:0,
    scaleX:1+.08*crouch+.05*settle,
    scaleY:1-.18*crouch-.12*settle,
    // Local sprite faces right: raise the nose on take-off and dip on landing.
    tilt:airborne?-.12*Math.sin(flight*2*Math.PI):0,
    face:(to.x-from.x)-(to.y-from.y)>=0?1:-1,
    phase,
  };
}
