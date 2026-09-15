import {expect,test} from '@playwright/test';
import {doorsForRoom,moveInRoom,canStand,roomObstacles} from '../src/systems/InteriorNavigation';
import {wildlifeAt} from '../src/visuals/EstateWildlife';

test('upstairs rooms connect to the landing and furniture blocks movement',()=>{
  for(const room of ['library','bedroom'] as const){
    const door=doorsForRoom(room)[0];
    expect(door.target).toBe('hall');
    expect(door.arrival?.y).toBe(2.8);
    for(const ob of roomObstacles[room])expect(canStand(room,ob)).toBe(false);
    expect(canStand(room,moveInRoom(room,{x:0,y:-3},20,20))).toBe(true);
  }
  expect(doorsForRoom('hall').filter(d=>d.elevation===3).map(d=>d.target)).toEqual(['library','bedroom']);
});

test('climb the staircase, visit both upstairs rooms and return to the landing',async({page},info)=>{
  test.setTimeout(60_000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  const library=page.getByRole('button',{name:/→ The upstairs library/});
  await expect(library).toBeDisabled();
  await page.keyboard.down('w');await page.keyboard.down('d');
  const canvas=page.locator('.interior-walk-canvas');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-elevation')),{timeout:10_000}).toBeGreaterThan(2.9);
  await page.keyboard.up('w');await page.keyboard.up('d');
  for(const room of [{id:'library',name:'The upstairs library'},{id:'bedroom',name:'The upstairs guest chamber'}]){
    await page.getByRole('button',{name:'→ '+room.name,exact:true}).click();
    await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room',room.id);
    await expect(canvas).toHaveAttribute('data-asset','ready',{timeout:15_000});
    const before=Number(await canvas.getAttribute('data-x'));
    await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');
    expect(Number(await canvas.getAttribute('data-x'))).toBeGreaterThan(before);
    await page.screenshot({path:info.outputPath(room.id+'.png')});
    await page.getByRole('button',{name:'→ The grand staircase hall',exact:true}).click();
    await expect(canvas).toHaveAttribute('data-elevation','3.000');
    await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room','hall');
  }
  expect(errors).toEqual([]);
});

test('wildlife stays on the east lawn and its positions are deterministic',()=>{
  expect(wildlifeAt(12)).toEqual(wildlifeAt(12));
  expect(wildlifeAt(12)).not.toEqual(wildlifeAt(14));
  const positions=Array.from({length:1200},(_,i)=>wildlifeAt(i*.5)).flat();
  expect(positions.filter(a=>a.kind!=='sheep').every(a=>a.x>1.6&&a.x<10.2&&a.y>7.8&&a.y<10.8)).toBe(true);
  expect(positions.filter(a=>a.kind==='sheep').every(a=>a.x>6.7&&a.x<10&&a.y>11.7&&a.y<13)).toBe(true);
});

test('Blender wildlife is drawn in the live garden',async({page},info)=>{
  await page.addInitScript(()=>{
    const seen=new Set<string>();
    Object.assign(window,{wildlifeDraws:seen});
    const original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args:Parameters<typeof original>){
      if(args[0] instanceof HTMLImageElement&&args[0].src.includes('/blender/animals/'))seen.add(args[0].src);
      return original.apply(this,args);
    };
  });
  await page.goto('/');await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>Array.from((window as unknown as {wildlifeDraws:Set<string>}).wildlifeDraws).length),{timeout:15_000}).toBe(9);
  await page.screenshot({path:info.outputPath('wildlife.png')});
});

test('missing wildlife sprites do not prevent entering the house',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/blender/animals/**',route=>route.abort());
  await page.goto('/');await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  await page.waitForTimeout(400);
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room','hall');
  expect(errors).toEqual([]);
});
