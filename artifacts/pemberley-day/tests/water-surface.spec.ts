import {expect,test} from '@playwright/test';

test('water animation is deterministic and rain adds visible ripples',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    // Load the same renderer served to the application by Vite.
    const path='/src/visuals/WaterSurface.ts';
    const {paintWaterSurface}=await import(path);
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=120;
    const ctx=canvas.getContext('2d')!;
    const draw=(time:number,rain:boolean)=>{paintWaterSurface(ctx,320,120,time,12,rain);return canvas.toDataURL();};
    const first=draw(3,false);
    return {stable:first===draw(3,false),moving:first!==draw(4,false),rain:first!==draw(3,true)};
  });
  expect(result).toEqual({stable:true,moving:true,rain:true});
});

test('Blender lake animation stays inside the visible water mask',async({page},info)=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const path='/src/visuals/BlenderEstate.ts';
    const {drawBlenderEstate}=await import(path);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=700;
    const ctx=canvas.getContext('2d')!;
    const scale=16/Math.sqrt(1.5);
    const input={ctx,w:1024,h:700,scale,hour:12,time:1,rainy:false,project:(x:number,y:number,z=0)=>({x:512+(x-y)*Math.sqrt(.75)*scale,y:350+((x+y)*.29-z*.9)*scale})};
    drawBlenderEstate(input);
    const estate=new Image();estate.src='/blender/estate.png';await estate.decode();
    drawBlenderEstate(input);
    const mask=new Image();mask.src='/blender/lake-mask.png';await mask.decode();
    // Both asset handlers share the cache; let their decode/onload callbacks complete.
    await new Promise(resolve=>setTimeout(resolve,200));
    ctx.clearRect(0,0,1024,700);drawBlenderEstate(input);
    const first=ctx.getImageData(0,0,1024,700).data;
    ctx.clearRect(0,0,1024,700);
    drawBlenderEstate({...input,time:3});
    const second=ctx.getImageData(0,0,1024,700).data;
    const mc=document.createElement('canvas');mc.width=1024;mc.height=700;
    const mx=mc.getContext('2d')!;mx.drawImage(mask,0,0);
    const pixels=mx.getImageData(0,0,1024,700).data;
    let changed=0,outside=0;
    for(let i=0;i<first.length;i+=4)if(first[i]!==second[i]||first[i+1]!==second[i+1]||first[i+2]!==second[i+2]){
      changed++;if(pixels[i]===0)outside++;
    }
    canvas.id='water-verification';document.body.replaceChildren(canvas);
    return {changed,outside};
  });
  expect(result.changed).toBeGreaterThan(100);
  expect(result.outside).toBe(0);
  await page.locator('#water-verification').screenshot({path:info.outputPath('lake.png')});
});

test('water loads in the game and missing mask preserves house entry',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  const canvas=page.locator('.estate-canvas');
  await canvas.hover();await page.mouse.wheel(0,700);
  await expect.poll(()=>page.evaluate(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('lake-mask.png')))).toBe(true);
  await page.screenshot({path:info.outputPath('water-game.png')});
  await page.route('**/lake-mask.png',route=>route.abort());
  await page.reload();await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room','hall');
  expect(errors).toEqual([]);
});
