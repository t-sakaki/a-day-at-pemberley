"""Deterministic Pemberley model. Run with Blender --background --python."""
import bpy, math, random
from pathlib import Path
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / 'public' / 'blender'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(1813)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name, rgb, rough=.85):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = rough
    return m
stone=mat('Warm sandstone - Chatsworth inspired',(.66,.55,.39))
trim=mat('Carved stone',(.85,.77,.60))
gilt=mat('Gilded sash frames',(.62,.39,.085),.32)
gilt.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.45
slate=mat('Slate',(.16,.20,.20))
glass=mat('Window glass',(.09,.19,.20),.24)
wood=mat('Oak',(.20,.12,.065))
grass=mat('Meadow',(.25,.34,.15))
gravel=mat('Gravel',(.64,.56,.40))
water=mat('Water',(.17,.31,.30),.19)
leaves=[mat('Foliage '+str(i),c) for i,c in enumerate([(.18,.29,.12),(.29,.38,.16),(.36,.42,.19),(.22,.33,.20)])]
hill_near=mat('Parkland rise',(.30,.40,.26),.9)
hill_far=mat('Hazy far hill',(.44,.53,.47),.95)
yew=mat('Clipped yew',(.13,.21,.12),.75)
rose_pink=mat('Rose bloom',(.80,.40,.47),.5)
rose_white=mat('Rose bloom pale',(.93,.90,.84),.5)
arch_void=mat('Bridge arch shadow',(.05,.08,.10),.95)

def box(name,loc,size,m):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object
    o.name=name
    o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(m)
    return o
def cyl(name,loc,r,d,m):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=d,location=loc)
    o=bpy.context.object
    o.name=name
    o.data.materials.append(m)
    return o
def blob(name,loc,size,m,sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc)
    o=bpy.context.object
    o.name,o.scale=name,size
    o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth=True
    return o
def cone(name,loc,r,h,m):
    bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r,depth=h,location=(loc[0],loc[1],loc[2]+h/2))
    o=bpy.context.object
    o.name=name
    o.data.materials.append(m)
    return o
def roof(x,y,w,d,z,h):
    v=[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z),(x-w/2,y+d/2,z),(x-w/2+d*.38,y,z+h),(x+w/2-d*.38,y,z+h)]
    m=bpy.data.meshes.new('Hipped roof')
    m.from_pydata(v,[],[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4)])
    m.update()
    o=bpy.data.objects.new('Hipped slate roof',m)
    bpy.context.collection.objects.link(o)
    m.materials.append(slate)
def window(x,y,z,side=False):
    def part(name,depth,width,height,offset,m):
        loc=(x+offset,y,z) if side else (x,y+offset,z)
        size=(depth,width,height) if side else (width,depth,height)
        box(name,loc,size,m)
    part('Window surround',.12,.82,1.12,0,trim)
    part('Glass',.04,.66,.96,.07,glass)
    part('Gilt sash upright',.04,.035,.96,.10,gilt)
    part('Gilt sash rail',.04,.66,.04,.10,gilt)
    for edge in [-1,1]:
        loc=(x+.11,y+edge*.33,z) if side else (x+edge*.33,y+.11,z)
        box('Gilt sash edge',loc,(.035,.025,.96) if side else (.025,.035,.96),gilt)
        loc=(x+.11,y,z+edge*.48) if side else (x,y+.11,z+edge*.48)
        box('Gilt sash edge',loc,(.035,.66,.025) if side else (.66,.035,.025),gilt)

blob('Meadow',(0,0,-.38),(23,22,.45),grass,4)
box('Main walk',(0,6,.09),(2.6,14,.06),gravel)
box('Cross walk',(0,2.4,.1),(22,1.1,.06),gravel)
box('Promenade',(0,9,.1),(18,1,.06),gravel)
blob('Lake bank',(-8.3,11.0,.04),(2.8,8.0,.14),gravel,3)
blob('Lake',(-8.3,11.0,.14),(2.4,7.6,.045),water,4)
def bridge(x,y):
    box('Bridge undercroft shadow',(x,y,.22),(5.6,1.5,.18),arch_void)
    box('Bridge deck',(x,y,.34),(5.8,1.6,.22),trim)
    for s in (-1,1):
        box('Bridge parapet',(x,y+s*.76,.62),(5.7,.14,.40),trim)
    for px in (x-2.75,x+2.75):
        box('Bridge abutment',(px,y,.18),(.6,1.9,.36),stone)
bridge(-8.3,13.0)
box('Main house',(-.5,-1,2.6),(10,4.8,5.2),stone)
for z in [.22,1.9,3.55,5.2]: box('String course',(-.5,-1,z),(10.25,5.04,.13),trim)
roof(-.5,-1,10.6,5.35,5.32,1.4)
for x in [-7,6]:
    box('Wing',(x,-.6,1.5),(3,4,3),stone)
    box('Cornice',(x,-.6,3),(3.2,4.2,.18),trim)
    roof(x,-.6,3.35,4.3,3.12,.8)
    for wx in [x-.75,x+.75]: window(wx,1.43,1.75)
for x in [-4.6,-3.25,-1.9,-.5,.9,2.25,3.6]:
    for z in [1.05,2.7,4.3]:
        if x != -.5 or z>1.1: window(x,1.44,z)
for y in [-2.6,-1,.6]:
    for z in [1.05,2.7,4.3]: window(4.55,y,z,True)
for x in [-4,3]:
    for y in [-2,.1]:
        box('Chimney',(x,y,6.25),(.48,.65,1.45),stone)
        box('Chimney cap',(x,y,6.99),(.62,.79,.13),trim)
box('Front door',(-.5,1.51,.98),(1.05,.12,1.85),wood)
for i in range(4): box('Step',(-.5,2.35-i*.19,.08+i*.10),(3-i*.13,1.3-i*.14,.16),trim)
for x in [-2.0,-1.0,0.0,1.0]:
    cyl('Portico column',(x,2.06,1.45),.13,2.65,trim)
    box('Capital',(x,2.06,2.79),(.42,.42,.18),trim)
box('Entablature',(-.5,2.03,2.99),(3.8,1.3,.3),trim)
# Triangular classical pediment, dentils, rustication and terrace balustrades.
ped=bpy.data.meshes.new('Carved pediment')
ped.from_pydata([(-2.5,2.73,3.15),(1.5,2.73,3.15),(-.5,2.73,4.12),(-2.5,1.50,3.15),(1.5,1.50,3.15),(-.5,1.50,4.12)],[],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)])
ped.materials.append(trim)
pediment=bpy.data.objects.new('Grand entrance pediment',ped)
bpy.context.collection.objects.link(pediment)
blob('Pediment carved medallion',(-.5,2.77,3.48),(.28,.05,.26),stone,3)
for x in [-5.35,4.35]:
    for z in [.45,.95,1.45,2.0,2.5,3.,3.6,4.1,4.6]:
        box('Rusticated corner',(x,1.51,z),(.30,.24,.33),trim)
for i in range(32):
    box('Cornice dentil',(-5.35+i*.31,1.60,5.08),(.11,.17,.16),trim)
for x in [-4.4,-3.2,-2.,1.,2.2,3.4]:
    cyl('Attic baluster',(x,1.40,5.50),.048,.42,trim)
    blob('Baluster belly',(x,1.40,5.50),(.08,.08,.10),trim)
for x in [-3.2,2.2]: box('Attic stone railing',(x,1.40,5.75),(3.5,.19,.14),trim)
for x in [-5.1,4.1,-8.1,-5.9,4.9,7.1]:
    z=5.35 if x in [-5.1,4.1] else 3.14
    cyl('Rooftop urn plinth',(x,1.2,z+.12),.17,.24,trim)
    blob('Rooftop stone urn',(x,1.2,z+.42),(.23,.23,.25),trim,3)
    cyl('Urn rim',(x,1.2,z+.60),.25,.06,trim)
for x in [-4.2,3.2]:
    box('Formal terrace paving',(x,2.55,.11),(3.1,1.7,.12),gravel)
    for i in range(9):
        bx=x-1.4+i*.35
        cyl('Terrace baluster',(bx,3.35,.48),.045,.6,trim)
        blob('Terrace baluster',(bx,3.35,.49),(.08,.08,.12),trim)
    box('Terrace handrail',(x,3.35,.81),(3.2,.18,.13),trim)

box('Conservatory base',(-9,3.5,.25),(3.7,2,.4),stone)
box('Conservatory glazing',(-9,3.5,1.1),(3.5,1.8,1.4),glass)
for x in [-10.7,-10.1,-9.5,-8.9,-8.3,-7.3]:
    box('Greenhouse frame',(x,4.43,1.1),(.055,.08,1.65),trim)
roof(-9,3.5,3.8,2.2,1.85,.6)
for x in [7,8.5,10]:
    for y in [4.4,6.1]:
        box('Garden bed',(x,y,.17),(1.1,1.35,.18),wood)
        for dy in [-.4,0,.4]: blob('Vegetables',(x,y+dy,.38),(.42,.16,.21),leaves[1])
cyl('Fountain surround',(-2.5,5.4,.24),1.3,.35,trim)
cyl('Fountain pool',(-2.5,5.4,.43),1.13,.04,water)
cyl('Fountain stem',(-2.5,5.4,.9),.15,1,trim)
cyl('Upper bowl',(-2.5,5.4,1.4),.55,.16,trim)
blob('Finial',(-2.5,5.4,1.68),(.13,.13,.24),trim)
for i,(x,y) in enumerate([(-13,-6),(-9,-8),(-5,-9),(0,-9),(6,-8),(11,-7),(14,-2),(14,5),(11,10),(5,13),(-1,14),(-13,7),(-15,1)]):
    h=random.uniform(2.8,4.3)
    cyl('Oak trunk',(x,y,h/2),.14,h,wood)
    for j in range(6):
        a=j*math.tau/6
        blob('Oak canopy',(x+math.cos(a)*.7,y+math.sin(a)*.7,h+random.uniform(-.2,.6)),(1.25,1.15,1.25),leaves[(i+j)%4])
for x in [-5,3.7]: box('Terrace hedge',(x,3.4,.48),(2.8,.55,.75),leaves[0])
for i in range(10):
    a=i*math.tau/10
    cone('Fountain yew',(-2.5+math.cos(a)*2.0,5.4+math.sin(a)*2.0,0),.36,1.3,yew)
for y in (3.3,7.7,9.8,12.2):
    for x in (-1.9,1.9):
        cone('Walk yew',(x,y,0),.42,1.55,yew)
for x in (-5,3.7):
    for i,dx in enumerate((-1.15,-.55,0,.55,1.15)):
        blob('Rose bloom',(x+dx,3.15+random.uniform(-.05,.05),.86),(.15,.15,.13),rose_pink if i%2 else rose_white,2)

# Rolling parkland rising behind the house, Capability Brown style.
for x,y,rx,ry,h,m in [(-16,-15,9,7,2.6,hill_near),(-1,-19,11,8,3.1,hill_near),(15,-14,8,6,2.3,hill_near),(-19,-6,6,7,2.0,hill_near),
                       (-9,-23,7,4,1.3,hill_far),(8,-24,7,4,1.2,hill_far),(-22,-14,5,4,1.1,hill_far)]:
    blob('Distant rise',(x,y,h*.5-.4),(rx,ry,h*.5+.4),m,3)
for i,(x,y) in enumerate([(-14,-13),(-3,-17),(9,-16),(19,-11),(-20,-3)]):
    hh=random.uniform(2.2,3.2)
    cyl('Parkland oak trunk',(x,y,hh/2),.12,hh,wood)
    for j in range(5):
        a=j*math.tau/5
        blob('Parkland oak canopy',(x+math.cos(a)*.6,y+math.sin(a)*.6,hh+random.uniform(-.15,.4)),(1.0,.9,1.0),leaves[(i+j)%4])

# Match the existing Canvas 2D world projection, including its vertical scale.
elevation=math.asin(.29/math.sqrt(.75))
z_factor=.9/(math.sqrt(1.5)*math.cos(elevation))
bpy.context.view_layer.update()
for o in list(bpy.context.scene.objects):
    # Canvas uses the opposite handedness: exchange horizontal world axes.
    o.matrix_world = Matrix(((0,1,0,0),(1,0,0,0),(0,0,z_factor,0),(0,0,0,1))) @ o.matrix_world
data=bpy.data.cameras.new('Game orthographic camera')
camera=bpy.data.objects.new('Game orthographic camera',data)
bpy.context.collection.objects.link(camera)
camera.location=(60,60,math.sqrt(7200)*math.tan(elevation))
camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
data.type,data.ortho_scale='ORTHO',64
scene=bpy.context.scene
scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(-10,4,22))
key=bpy.context.object
key.name='Soft morning light'
key.data.energy,key.data.shape,key.data.size=2800,'DISK',14
key.rotation_euler=(-key.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN',location=(-10,-10,20))
bpy.context.object.rotation_euler=(.4,-.5,-.6)
bpy.context.object.data.energy=2
bpy.context.object.data.angle=.15
scene.world.color=(.35,.35,.35)
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.resolution_x,scene.render.resolution_y=2048,1400
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
scene.render.filepath=str(OUT/'estate.png')
scene.view_settings.view_transform='AgX'
scene['game_pixels_per_unit']=2048/64/math.sqrt(1.5)
scene['game_origin_pixel']=[1024,700]
bpy.context.view_layer.update()
for x,y,z in [(0,0,0),(1,0,0),(0,1,0),(0,0,1),(-8,10,0)]:
    p=world_to_camera_view(scene,camera,Vector((y,x,z*z_factor)))
    unit=scene['game_pixels_per_unit']
    assert abs(p.x*2048-(1024+(x-y)*math.sqrt(.75)*unit))<.01
    assert abs((1-p.y)*1400-(700+((x+y)*.29-z*.9)*unit))<.01
print('Game projection verified at five world landmarks')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'pemberley.blend'),compress=True)
bpy.ops.render.render(write_still=True)
print('PEMBERLEY_RENDER_COMPLETE',scene.render.filepath)
