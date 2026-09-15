import {expect,test} from '@playwright/test';
import {rabbitHop,HOP_PERIOD} from '../src/visuals/RabbitHop';
import {staffWorkplace,workerPoint} from '../src/systems/StaffWorkplaces';
import {canStand,type InteriorRoomId} from '../src/systems/InteriorNavigation';

test('rabbit rests without sliding, lifts during flight and lands continuously',()=>{
  const at=(phase:number)=>rabbitHop(phase*HOP_PERIOD,0);
  expect(at(.05).x).toBe(at(.25).x);
  expect(at(.05).y).toBe(at(.25).y);
  expect(at(.25).scaleY).toBeLessThan(1);
  expect(at(.30).z).toBeCloseTo(0);
  expect(at(.45).z).toBeCloseTo(.32);
  expect(at(.60).z).toBe(0);
  expect(at(.40).frame).toBe(1);
  expect(at(.55).frame).toBe(2);
  expect(at(.75).x).toBe(at(.95).x);
  expect(at(.999999).x).toBeCloseTo(at(1).x,5);
  expect(at(.999999).y).toBeCloseTo(at(1).y,5);
  expect(rabbitHop(.7,1)).not.toEqual(rabbitHop(.7,3));
});

test('workplaces respect assignments, emergency override and furniture',()=>{
  const home={x:5,y:2};
  expect(staffWorkplace('Portrait gallery',home,false).room).toBe('gallery');
  expect(staffWorkplace('Music room',home,false).room).toBe('music');
  expect(staffWorkplace('Library',home,false).room).toBe('library');
  expect(staffWorkplace('Guest chamber',home,false).room).toBe('bedroom');
  expect(staffWorkplace('Stables',home,false).point).toEqual(home);
  expect(staffWorkplace('Library',home,true).absent).toBe(true);
  expect(staffWorkplace('Library',home,false,{x:1,y:2})).toEqual({room:null,point:{x:1,y:2},absent:false,dispatched:true});
  for(const room of ['hall','gallery','music','window','library','bedroom'] as InteriorRoomId[]){
    const points=Array.from({length:5},(_,i)=>workerPoint(room,i));
    expect(points.every(p=>canStand(room,p))).toBe(true);
    expect(new Set(points.map(p=>JSON.stringify(p))).size).toBe(5);
  }
});

test('indoor staff appear in their assigned rooms without outdoor duplicates',async({page},info)=>{
  await page.goto('/');await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  const outside=page.getByLabel('Playable illustrated 3D view of Pemberley estate',{exact:true});
  await expect(outside).toHaveAttribute('data-staff',/mr-adams/);
  await expect(outside).not.toHaveAttribute('data-staff',/mrs-reynolds|sarah|john/);
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  const canvas=page.locator('.interior-walk-canvas');
  for(const room of [{name:'The picture gallery',id:'mrs-reynolds'},{name:'The music room',id:'sarah'},{name:'The great west window',id:'john'}]){
    await page.getByRole('button',{name:'→ '+room.name,exact:true}).click();
    await expect(canvas).toHaveAttribute('data-staff',room.id);
    await expect(canvas).toHaveAttribute('data-asset','ready');
    await page.screenshot({path:info.outputPath(room.id+'.png')});
  }
});

test('rabbit Blender exports contain genuinely different pixel poses',async({page})=>{
  await page.goto('/');
  const distinct=await page.evaluate(async()=>{
    const pixels:string[]=[];
    for(let frame=0;frame<3;frame++){
      const image=new Image();image.src='/blender/animals/rabbit-'+frame+'.png';await image.decode();
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
      pixels.push(canvas.toDataURL());
    }
    return new Set(pixels).size;
  });
  expect(distinct).toBe(3);
});

test('changing Sarah assignment moves her into the upstairs library',async({page},info)=>{
  test.setTimeout(60_000);
  await page.goto('/');await page.getByRole('button',{name:'Begin the day',exact:true}).click();
  const toggle=page.getByRole('button',{name:'Open staff panel',exact:true});
  if(await toggle.isVisible())await toggle.click();
  const sarah=page.locator('.staff-card').filter({hasText:'Sarah'});
  await sarah.click();
  await sarah.getByRole('button',{name:'The upstairs library',exact:true}).click();
  if(await toggle.isVisible())await toggle.click();
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  await page.getByRole('button',{name:'→ The picture gallery',exact:true}).click();
  await page.getByRole('button',{name:'→ The music room',exact:true}).click();
  const canvas=page.locator('.interior-walk-canvas');
  await expect(canvas).toHaveAttribute('data-staff','');
  await page.getByRole('button',{name:'Return to grounds',exact:true}).click();
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  await page.keyboard.down('w');await page.keyboard.down('d');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-elevation')),{timeout:10_000}).toBeGreaterThan(2.9);
  await page.keyboard.up('w');await page.keyboard.up('d');
  await page.getByRole('button',{name:'→ The upstairs library',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-staff','sarah');
  await expect(canvas).toHaveAttribute('data-asset','ready');
  await page.screenshot({path:info.outputPath('library-workplace.png')});
});
