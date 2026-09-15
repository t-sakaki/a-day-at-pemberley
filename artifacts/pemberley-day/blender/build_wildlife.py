"""Locally authored deer, hopping rabbit and grazing sheep sprite poses."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from interior_tools import *
OUT=ROOT.parent/'public'/'blender'/'animals'; OUT.mkdir(parents=True,exist_ok=True)
species=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['deer','rabbit','sheep']
for kind in species:
    if kind not in ['deer','rabbit','sheep']: raise ValueError(kind)
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    fur=material('Chestnut coat' if kind=='deer' else 'Soft grey brown fur',(.40,.22,.10) if kind=='deer' else (.36,.32,.25),grain=True)
    pale=material('Cream markings',(.81,.76,.60))
    dark=material('Hooves and eyes',(.025,.02,.018))
    antler=material('Antler',(.52,.39,.22))
    legs=[]
    if kind=='deer':
        sphere('Deer body',(-.15,0,1.05),(.75,.27,.4),fur)
        rod('Raised neck',(.40,0,1.05),(.67,0,1.72),.19,fur,.13)
        sphere('Deer head',(.78,0,1.77),(.28,.16,.19),fur)
        sphere('Muzzle',(1,0,1.70),(.17,.12,.10),pale)
        sphere('Nose',(1.12,-.015,1.72),(.045,.11,.05),dark)
        sphere('Near eye',(.84,-.155,1.84),(.027,.016,.03),dark)
        for y in [-.12,.12]:
            sphere('Long ear',(.56,y*1.7,2.02),(.11,.065,.22),fur)
            curve('Antler beam',[(.62,y,1.93),(.51,y,2.2),(.69,y,2.47)],.025,antler)
            for z in [2.16,2.3]:
                rod('Antler tine',(.56,y,z),(.33,y,z+.17),.016,antler)
        sphere('Pale tail',(-.85,0,1.15),(.15,.10,.10),pale)
        for x in [-.65,.38]:
            for y in [-.18,.18]:
                leg=rod('Leg',(x,y,.12),(x,y,.98),.045,fur,.065)
                hoof=box('Hoof',(x+.025,y,.08),(.14,.10,.14),dark)
                legs.append((leg,hoof,1 if (x<0)==(y<0) else -1))
    elif kind=='rabbit':
        sphere('Rabbit body',(-.1,0,.36),(.39,.22,.26),fur)
        sphere('Rabbit haunch',(-.34,0,.27),(.25,.24,.25),fur)
        sphere('Rabbit head',(.29,0,.52),(.22,.17,.20),fur)
        for y in [-.085,.085]:
            sphere('Rabbit ear',(.23,y,.84),(.07,.05,.26),fur)
            sphere('Pale inner ear',(.23,y-.035,.85),(.035,.016,.18),pale)
        sphere('Rabbit eye',(.36,-.15,.58),(.025,.018,.028),dark)
        sphere('Rabbit nose',(.50,-.02,.50),(.035,.055,.035),dark)
        sphere('White tail',(-.51,0,.40),(.12,.11,.13),pale)
        for x in [-.3,.27]:
            for y in [-.14,.14]:
                foot=sphere('Rabbit paw',(x,y,.055),(.16,.075,.055),fur)
                legs.append((foot,None,1 if x<0 else -1))
    else:
        wool=material('Ivory fleece',(.73,.70,.57),grain=True)
        sphere('Sheep fleece',(-.1,0,.64),(.63,.35,.42),wool)
        for i in range(16):
            angle=i*math.tau/16
            sphere('Wool curl',(-.1+.45*math.cos(angle),.25*math.sin(angle),.72),(.20,.15,.22),wool)
        sphere('Sheep head',(.54,0,.70),(.23,.16,.25),fur)
        sphere('Sheep muzzle',(.66,-.01,.54),(.18,.13,.12),fur)
        sphere('Sheep eye',(.64,-.15,.80),(.022,.016,.026),dark)
        for y in [-.19,.19]: sphere('Sheep ear',(.45,y,.90),(.13,.13,.06),fur)
        for x in [-.50,.33]:
            for y in [-.20,.20]:
                rod('Sheep leg',(x,y,.07),(x,y,.60),.047,fur)
                box('Sheep hoof',(x,y,.055),(.13,.10,.11),dark)
    sc=bpy.context.scene
    world=bpy.data.worlds.new('Soft wildlife daylight'); world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[1].default_value=.55; sc.world=world
    light('Softbox',(-3,-4,6),(0,0,1),450,4)
    cam=bpy.data.objects.new('Sprite camera',bpy.data.cameras.new('Sprite camera'))
    sc.collection.objects.link(cam); sc.camera=cam
    center=1.2 if kind=='deer' else .7
    cam.location=(0,-6,center); cam.rotation_euler=(Vector((0,0,center))-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO'; cam.data.ortho_scale=3.4 if kind=='deer' else 2
    sc.render.engine='CYCLES'; sc.cycles.samples=12; sc.cycles.use_denoising=True
    sc.render.threads_mode='FIXED'; sc.render.threads=4
    sc.render.resolution_x=256; sc.render.resolution_y=256; sc.render.resolution_percentage=100
    sc.render.film_transparent=True; sc.render.image_settings.file_format='PNG'
    sc.render.image_settings.color_mode='RGBA'; sc.view_settings.view_transform='AgX'
    bpy.context.preferences.filepaths.save_version=0
    originals={o:(o.location.copy(),o.scale.copy()) for o in sc.objects if o.type=='MESH'}
    for frame in range(3):
        sc.frame_set(frame+1)
        for ob,(loc,size) in originals.items(): ob.location=loc.copy(); ob.scale=size.copy()
        offset=[0,.09,-.09][frame]
        for leg,hoof,sign in legs:
            leg.location.x+=offset*sign if kind=='deer' else ([-.20,.10][sign<0] if frame==1 else [.14,.16][sign<0] if frame==2 else 0) if kind=='rabbit' else 0
            if kind=='rabbit':
                leg.location.z+=.13 if frame==1 else .08 if frame==2 and sign>0 else 0
            if hoof and kind=='deer': hoof.location.x+=offset*sign
        if kind=='rabbit':
            for ob in originals:
                if ob.name.startswith(('Rabbit body','Rabbit haunch')):
                    ob.scale.x*=1.17 if frame==1 else 1
                    ob.scale.z*=.86 if frame==1 else 1
                if ob.name.startswith(('Rabbit head','Rabbit eye','Rabbit nose')):
                    ob.location.z-=.055 if frame==2 else 0
            for ob in originals:
                ob.keyframe_insert(data_path='location',frame=frame+1)
                ob.keyframe_insert(data_path='scale',frame=frame+1)
        if kind=='sheep':
            for ob in originals:
                if ob.name.startswith(('Sheep head','Sheep muzzle','Sheep eye','Sheep ear')):
                    ob.location.x+=.10 if frame else 0
                    ob.location.z-=[0,.30,.34][frame]
        sc.render.filepath=str(OUT/f'{kind}-{frame}.png')
        bpy.ops.render.render(write_still=True)
    for ob,(loc,size) in originals.items(): ob.location=loc; ob.scale=size
    sc.frame_end=3; sc.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/f'animal-{kind}.blend'),compress=True)
    print('WILDLIFE_COMPLETE',kind,flush=True)
