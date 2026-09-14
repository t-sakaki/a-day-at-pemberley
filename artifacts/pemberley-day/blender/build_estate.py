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
stone=mat('Derbyshire limestone',(.66,.55,.39))
trim=mat('Carved stone',(.85,.77,.60))
slate=mat('Slate',(.16,.20,.20))
glass=mat('Window glass',(.09,.19,.20),.24)
wood=mat('Oak',(.20,.12,.065))
grass=mat('Meadow',(.25,.34,.15))
gravel=mat('Gravel',(.64,.56,.40))
water=mat('Water',(.17,.31,.30),.19)
leaves=[mat('Foliage '+str(i),c) for i,c in enumerate([(.18,.29,.12),(.29,.38,.16),(.36,.42,.19),(.22,.33,.20)])]

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
    part('Sash upright',.04,.035,.96,.10,trim)
    part('Sash rail',.04,.66,.04,.10,trim)

blob('Meadow',(0,0,-.38),(23,22,.45),grass,4)
box('Main walk',(0,6,.09),(2.6,14,.06),gravel)
box('Cross walk',(0,2.4,.1),(22,1.1,.06),gravel)
box('Promenade',(0,9,.1),(18,1,.06),gravel)
blob('Lake bank',(-8.1,10,.04),(4.9,3.5,.14),gravel,3)
blob('Lake',(-8.1,10,.14),(4.55,3.2,.045),water,4)
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
for x in [-1.55,.55]:
    cyl('Portico column',(x,2.06,1.45),.13,2.65,trim)
    box('Capital',(x,2.06,2.79),(.42,.42,.18),trim)
box('Entablature',(-.5,2.03,2.99),(2.75,1.3,.3),trim)
roof(-.5,2.03,2.9,1.4,3.15,.55)

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
