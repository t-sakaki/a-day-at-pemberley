"""Interpretive Pemberley interiors, c.1790-1813. See INTERIORS.md for evidence.

blender --background --factory-startup --python-exit-code 1 --python build_interiors.py
Pass -- gallery (or music/window) to regenerate just one room.
"""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from interior_tools import *
from ornate_interiors import enrich

OUT=ROOT.parent/'public'/'blender'/'interiors'
OUT.mkdir(parents=True,exist_ok=True)

def palette(kind):
    wall={'gallery':(.095,.20,.135),'music':(.12,.24,.28),'window':(.40,.23,.11)}[kind]
    return dict(wall=material('Painted plaster',wall,grain=True),
        ivory=material('Warm plaster mouldings',(.83,.77,.62)),
        wood=material('Figured mahogany',(.26,.095,.042),.34,grain=True),
        oak=material('Waxed oak boards',(.34,.22,.11),.48,grain=True),
        gold=material('Aged gilt brass',(.53,.32,.08),.32,.65),
        marble=material('Pale veined marble',(.73,.73,.66),.4,grain=True),
        red=material('Madder wool',(.27,.055,.04),grain=True),
        silk=material('Muted damask',(.35,.18,.105) if kind=='window' else (.18,.30,.26),grain=True),
        ink=material('Ink and blackened iron',(.025,.027,.022)),
        paper=material('Cream rag paper',(.86,.81,.65)),
        wax=material('Beeswax',(.86,.72,.46)),
        porcelain=material('Porcelain',(.82,.86,.83),.2),
        blue=material('Underglaze blue',(.055,.15,.28),.3))

def shell(kind,m):
    for i in range(25):
        for j in range(5):
            box('Individual oak floorboard',(-4.8+i*.4,-3.6+j*1.8,0),(.392,1.788,.08),m['oak'],.004)
    # Back wall; the dining-parlour has three genuine openings onto the park.
    if kind=='window':
        box('Window wall below sill',(0,4.5,.39),(10,.22,.78),m['wall'])
        box('Window wall above lintel',(0,4.5,4.13),(10,.22,.34),m['wall'])
        for x,w in [(-4.35,1.3),(-1.5,.65),(1.5,.65),(4.35,1.3)]:
            box('Window pier',(x,4.5,2.35),(w,.22,3.15),m['wall'])
        for x in [-2.95,0,2.95]:
            for dx in [-1.08,1.08]: box('Sash casing',(x+dx,4.35,2.38),(.13,.20,3.18),m['ivory'])
            for z in [.81,2.35,3.95]: box('Sash rail',(x,4.34,z),(2.24,.16,.09),m['ivory'])
            for dx in [-.36,.36]: box('Glazing bar',(x+dx,4.33,2.38),(.035,.07,3.05),m['ivory'])
            for z in [1.58,3.15]: box('Glazing bar',(x,4.32,z),(2.13,.07,.035),m['ivory'])
            rod('Curtain pole',(x-1.35,4.08,4.08),(x+1.35,4.08,4.08),.032,m['gold'])
            for dx in [-1.04,1.04]: curtain(x+dx,4.05,.54,3.1,m['silk'],m['gold'])
    else:
        box('Back wall',(0,4.5,2.15),(10,.20,4.3),m['wall'])
    # Left wall admits light through two tall sash windows.
    for y,d in [(-3.7,1.6),(0,1.4),(3.7,1.6)]: box('Left wall pier',(-5,y,2.35),(.20,d,2.7),m['wall'])
    box('Left wall sill',(-5,0,.5),(.20,9,1),m['wall'])
    box('Left wall lintel',(-5,0,4),(.20,9,.60),m['wall'])
    for y in [-1.95,1.95]:
        for dy in [-1.17,1.17]: box('Window casing',(-4.86,y+dy,2.35),(.16,.10,2.85),m['ivory'])
        for z in [1,2.35,3.73]: box('Sash rail',(-4.84,y,z),(.15,2.38,.09),m['ivory'])
        for dy in [-.4,.4]: box('Glazing bar',(-4.83,y+dy,2.35),(.07,.035,2.70),m['ivory'])
    box('Right wall',(5,0,2.15),(.20,9,4.3),m['wall'])
    for z,depth,height in [(.16,.16,.26),(1.05,.13,.10),(3.94,.16,.08),(4.14,.24,.14),(4.27,.34,.08)]:
        box('Back moulding',(0,4.32,z),(10,depth,height),m['ivory'])
        for x in [-4.85,4.85]: box('Side moulding',(x,0,z),(depth,9,height),m['ivory'])
    for x in [-4,-2,0,2,4]:
        for dx in [-.77,.77]: box('Dado panel stile',(x+dx,4.30,.6),(.045,.06,.58),m['ivory'])
        for z in [.31,.9]: box('Dado panel rail',(x,4.30,z),(1.57,.06,.035),m['ivory'])
    # Ceiling cornice / thin ceiling; camera sees into the open front wall.
    box('Plaster ceiling',(0,1,4.37),(10,7,.12),m['ivory'])
    for x in [-4.3,4.3]: box('Ceiling border',(x,.8,4.28),(.045,6.4,.045),m['gold'])
    for y in [-2.4,4]: box('Ceiling border',(0,y,4.28),(8.6,.045,.045),m['gold'])
    # Native trees and river glimpsed beyond windows, all modeled locally.
    green=material('Parkland',(.21,.32,.16))
    water=material('River',(.26,.43,.47),.22)
    box('Parkland beyond windows',(0,12,-.28),(70,40,.2),green)
    box('River beyond windows',(1,11,-.13),(35,2,.025),water)
    for i in range(18):
        x=-15+i*1.8
        y=15+math.sin(i*1.7)*2
        rod('Distant trunk',(x,y,-.1),(x,y,2),.1,m['wood'])
        sphere('Park tree',(x,y,2.4),(1.3,1,1.9),green)
    light('Daylight from sash windows',(-4.6,-1,3.3),(0,1,1),1000,3,(.80,.88,1))
    light('Soft front fill',(0,-5,3.8),(0,2,1.5),450,5,(1,.88,.71))
    light('Warm reflected daylight',(3,2,3.9),(0,0,1),300,3)

def landscape(x,y,z,w,h,m):
    sky=material('Painted landscape sky',(.40,.49,.48))
    hills=material('Painted landscape hills',(.16,.25,.17))
    box('Landscape canvas',(x,y,z),(w,.055,h),sky)
    for i in range(4): sphere('Painted hill',(x-w*.3+i*w*.20,y-.05,z-h*.30),(w*.27,.012,h*.22),hills)
    frame(x,y-.09,z,w+.12,h+.12,m['gold'])

def portrait(m):
    # Reuse the app's established interpretation of Darcy; pack into .blend.
    image=bpy.data.images.load(str(ROOT.parent/'src'/'assets'/'portraits'/'darcy-calm.webp'),check_existing=True)
    paint=material('Darcy portrait canvas',(.4,.3,.2))
    p=paint.node_tree.nodes.get('Principled BSDF')
    texture=paint.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image=image
    paint.node_tree.links.new(texture.outputs['Color'],p.inputs['Base Color'])
    mesh=bpy.data.meshes.new('Portrait canvas')
    mesh.from_pydata([(-.8,4.26,1.55),(.8,4.26,1.55),(.8,4.26,3.53),(-.8,4.26,3.53)],[],[(0,1,2,3)])
    uv=mesh.uv_layers.new()
    for item,co in zip(uv.data,[(0,0),(1,0),(1,1),(0,1)]): item.uv=co
    o=bpy.data.objects.new('Darcy portrait - interpretive likeness',mesh)
    bpy.context.collection.objects.link(o)
    mesh.materials.append(paint)
    frame(0,4.19,2.54,1.84,2.22,m['gold'])

def gallery(m):
    portrait(m)
    for x in [-3,3]: landscape(x,4.25,2.63,1.75,1.33,m)
    rug(0,.5,3.3,5.6,m['red'],m['gold'],m['ivory'])
    table(-3.3,3.6,2.3,.7,m['wood'])
    for dx in [-.7,.7]: candle(-3.3+dx,3.6,.93,m['gold'],m['wax'])
    book(-3.2,3.5,1.0,.5,.37,m['red'],m['paper'])
    for x in [-3.2,3.2]: chair(x,.6,m['wood'],m['silk'])
    box('Gallery bench',(0,-1.4,.59),(2.6,.75,.17),m['silk'],.09)
    for x in [-1.1,1.1]:
        for y in [-1.65,-1.15]: rod('Bench leg',(x,y,.05),(x,y,.53),.04,m['wood'],.065)
    # Plaster bust and fluted pedestal: no invented named ancestor.
    box('Sculpture pedestal',(3.5,3.5,.72),(.58,.58,1.44),m['marble'])
    box('Pedestal cap',(3.5,3.5,1.46),(.7,.7,.1),m['marble'])
    sphere('Classical bust shoulders',(3.5,3.5,1.76),(.32,.19,.25),m['ivory'])
    sphere('Classical bust head',(3.5,3.5,2.10),(.16,.17,.23),m['ivory'])
    sphere('Bust nose',(3.5,3.31,2.1),(.045,.055,.07),m['ivory'])

def music(m):
    fireplace(2.7,4.02,m['marble'],m['ink'],m['gold'])
    landscape(2.7,4.10,2.9,1.5,1.1,m)
    rug(-.2,-.3,5.2,3.5,m['red'],m['gold'],m['ivory'])
    # Five octave square pianoforte (61 notes, FF-f3), mahogany case.
    box('Square pianoforte case',(-.8,.5,.91),(2.5,1.02,.29),m['wood'],.025)
    box('Boxwood inlay',(-.8,-.019,.97),(2.36,.016,.025),m['ivory'],.002)
    for x in [-1.9,.3]:
        for y in [.10,.88]: rod('Piano tapered leg',(x,y,.04),(x,y,.78),.035,m['wood'],.062)
    # Raised lid, unlike a modern black concert grand.
    lid=box('Open mahogany lid',(-.8,.98,1.37),(2.5,.075,.70),m['wood'])
    lid.rotation_euler.x=math.radians(-14)
    white=0
    for midi in range(41,102):
        if midi%12 not in [1,3,6,8,10]:
            box('Natural key',(-1.84+white*.058,-.085,1.04),(.055,.29,.035),m['ivory'],.002)
            white+=1
        else:
            box('Accidental key',(-1.84+(white-.5)*.058,-.005,1.073),(.034,.18,.04),m['ink'],.002)
    box('Music desk',(-.8,.63,1.39),(.95,.065,.52),m['wood'])
    for x in [-1.02,-.6]:
        box('Open music leaf',(x,.587,1.43),(.39,.008,.43),m['paper'],.002)
        for stave in range(3):
            for line in range(5): box('Engraved music stave',(x,.58,1.57-stave*.10-line*.012),(.33,.004,.002),m['ink'],0)
            for note in range(5): sphere('Printed note',(x-.13+note*.057,.573,1.55-stave*.10+(note%3)*.013),(.01,.003,.007),m['ink'])
    box('Piano stool',(-.8,-1.02,.55),(.75,.43,.13),m['silk'],.05)
    for x in [-1.08,-.52]:
        for y in [-1.16,-.88]: rod('Stool leg',(x,y,.04),(x,y,.5),.035,m['wood'])
    candle(.3,.5,1.08,m['gold'],m['wax'])
    chair(2.7,-.5,m['wood'],m['silk'],.35)
    table(-3.65,2.8,1.3,.7,m['wood'])
    for i in range(3): book(-3.65,2.8,.98+i*.10,.65,.43,m['red'],m['paper'])

def window_room(m):
    light('West window daylight',(0,5.4,3.2),(0,0,.5),1300,4,(1,.91,.73))
    rug(0,-.2,5.8,4.5,m['red'],m['gold'],m['ivory'])
    table(0,.1,3.3,1.35,m['wood'])
    for x in [-1.15,0,1.15]:
        chair(x,-1.05,m['wood'],m['silk'],math.pi)
        chair(x,1.22,m['wood'],m['silk'])
    # A modest tea setting, not a Victorian banquet arrangement.
    for x in [-.9,.9]:
        rod('Porcelain saucer',(x,.1,.92),(x,.1,.94),.13,m['porcelain'])
        rod('Teacup',(x,.1,.95),(x,.1,1.07),.068,m['porcelain'],.083)
        curve('Cup handle',[(x+.07,.1,1.04),(x+.13,.1,1.04),(x+.13,.1,.97),(x+.07,.1,.97)],.012,m['porcelain'])
    sphere('Teapot body',(0,.2,1.08),(.17,.13,.15),m['porcelain'])
    rod('Teapot lid',(0,.2,1.22),(0,.2,1.24),.09,m['porcelain'])
    sphere('Lid finial',(0,.2,1.27),(.025,.025,.035),m['blue'])
    curve('Teapot spout',[(.13,.2,1.02),(.26,.2,1.11),(.30,.2,1.19)],.035,m['porcelain'])
    curve('Teapot handle',[(-.13,.2,1.18),(-.27,.2,1.18),(-.27,.2,1.02),(-.13,.2,1.02)],.025,m['porcelain'])
    table(-3.55,2.8,1.8,.75,m['wood'])
    candle(-3.9,2.8,.93,m['gold'],m['wax'])
    book(-3.15,2.8,1,.5,.38,m['red'],m['paper'])

def build(kind):
    output_id=kind
    neglected=kind.endswith('-wanting')
    kind=kind.removesuffix('-wanting')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    random.seed(1813)
    m=palette(kind)
    shell(kind,m)
    {'gallery':gallery,'music':music,'window':window_room}[kind](m)
    enrich(kind,m)
    if neglected and kind=='music':
        lid=bpy.data.objects['Open mahogany lid']
        lid.rotation_euler=(0,0,0)
        lid.location=(-.8,.5,1.10)
        lid.dimensions=(2.5,1.02,.075)
        box('Closed keyboard fallboard',(-.8,-.13,1.11),(2.4,.30,.075),m['wood'])
        for o in bpy.context.scene.objects:
            if o.name.startswith(('Music desk','Open music leaf','Engraved music stave','Printed note')): o.hide_render=True
    if neglected and kind=='window':
        for x in [-2.95,0,2.95]:
            for dx in [-.74,.74]:
                box('Half closed interior shutter',(x+dx,4.22,2.38),(.65,.08,3.02),m['ivory'])
                for z in [1.60,3.08]: box('Shutter raised panel',(x+dx,4.16,z),(.48,.025,1.1),m['wall'])
    scene=bpy.context.scene
    scene.name={'gallery':'Pemberley - Picture Gallery','music':'Pemberley - Music Room','window':'Pemberley - Dining Parlour and Prospect'}[kind]
    world=bpy.data.worlds.new('Cool daylight')
    world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[0].default_value=(.63,.74,.82,1)
    world.node_tree.nodes['Background'].inputs[1].default_value=.28
    scene.world=world
    data=bpy.data.cameras.new('Interior view')
    camera=bpy.data.objects.new('Interior view',data)
    scene.collection.objects.link(camera)
    camera.location=(3.8,-4.25,2.5)
    target=Vector((-.3,2.3,1.9))
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    data.lens=22
    scene.camera=camera
    scene.render.engine='CYCLES'
    scene.cycles.samples=16
    scene.cycles.use_denoising=True
    scene.render.threads_mode='FIXED'
    scene.render.threads=6
    scene.render.resolution_x,scene.render.resolution_y=1440,1000
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='JPEG'
    scene.render.image_settings.quality=92
    scene.view_settings.view_transform='AgX'
    scene.render.filepath=str(OUT/(output_id+'.jpg'))
    scene['historical_note']='Interpretive c.1790-1813 interior; not an authenticated Pemberley reconstruction. See INTERIORS.md.'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/('interior-'+output_id+'.blend')),compress=True)
    bpy.ops.render.render(write_still=True)
    print('INTERIOR_COMPLETE',output_id,flush=True)

if __name__=='__main__':
    rooms=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['gallery','music','window','music-wanting','window-wanting']
    for room in rooms:
        if room not in ['gallery','music','window','music-wanting','window-wanting']: raise ValueError('Unknown room: '+room)
        build(room)
