import {lerpColor} from './ColorPalette';
/** Screen-space watercolour water. Fixed seeds and smooth time: no random flicker. */
export function paintWaterSurface(ctx:CanvasRenderingContext2D,w:number,h:number,time:number,hour:number,rainy:boolean) {
  const dusk=Math.max(0,Math.min(1,(hour-16)/4));
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,lerpColor('#99b5ba','#9c9c8b',dusk));
  sky.addColorStop(.38,lerpColor('#729c9f','#708d8b',dusk));
  sky.addColorStop(1,lerpColor('#416e73','#3f6263',dusk));
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  // Broken, softly layered reflections of the wooded bank.
  for(let k=0;k<18;k++){
    const x=w*(k/17)+Math.sin(time*.33+k)*w*.005;
    const reach=h*(.18+.16*(.5+.5*Math.sin(k*2.7)));
    const radius=w*.075;
    ctx.save();ctx.translate(x,0);ctx.scale(1,reach/radius);
    const shade=ctx.createRadialGradient(0,0,0,0,0,radius);
    shade.addColorStop(0,'rgba(39,64,48,.34)');shade.addColorStop(1,'rgba(49,77,62,0)');
    ctx.fillStyle=shade;ctx.fillRect(-radius,0,radius*2,radius);ctx.restore();
  }
  // Interrupted horizontal glints, not a uniform grid of white lines.
  ctx.lineCap='round';
  for(let k=0;k<44;k++){
    const u=(Math.sin(k*127.1)*43758.5453)%1;
    const x=w*(u-Math.floor(u));
    const y=h*(.12+(k/44)*.83);
    const length=w*(.025+.075*(.5+.5*Math.sin(k*3.1)));
    const drift=Math.sin(time*.55+k*1.7)*w*.013;
    ctx.strokeStyle=k%3===0?'rgba(30,70,76,.20)':`rgba(239,242,219,${(.12+.13*(.5+.5*Math.sin(time*.7+k)))*(1-dusk*.5)})`;
    ctx.lineWidth=Math.max(.65,h*.007);
    ctx.beginPath();ctx.moveTo(x+drift,y);
    ctx.quadraticCurveTo(x+length*.5+drift,y+Math.sin(time*.8+k)*h*.009,x+length+drift,y);
    ctx.stroke();
  }
  if(rainy)for(let k=0;k<9;k++){
    const phase=(time*.42+k*.173)%1;
    const x=w*(.12+.76*(.5+.5*Math.sin(k*17)));
    const y=h*(.25+.62*(.5+.5*Math.cos(k*13)));
    ctx.strokeStyle=`rgba(221,237,226,${Math.sin(phase*Math.PI)*.25})`;
    ctx.lineWidth=.7;ctx.beginPath();
    ctx.ellipse(x,y,w*(.003+phase*.028),h*(.003+phase*.028),0,0,Math.PI*2);ctx.stroke();
  }
}
