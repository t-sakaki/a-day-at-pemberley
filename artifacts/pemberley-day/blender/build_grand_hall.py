"""An original Chatsworth-inspired double-height hall, not a historical replica.

The 3 m stair and landing dimensions are shared with InteriorNavigation.ts.
Run this script, then build_walk_views.py -- hall.
"""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from interior_tools import *

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
stone=material('Honey sandstone',(.66,.53,.34),grain=True)
cream=material('Carved pale marble',(.79,.75,.65),.36,grain=True)
dark=material('Black marble',(.065,.075,.065),.33)
gold=material('Old gold leaf',(.62,.39,.10),.3,.7)
red=material('Crimson stair runner',(.52,.055,.04),grain=True)
blue=material('Mural sky',(.25,.37,.40),grain=True)
cloud=material('Painted clouds',(.70,.65,.48))
fresco_fig=material('Fresco figures',(.62,.28,.16),grain=True)
fresco_deep=material('Fresco deep sky',(.14,.20,.26),grain=True)

for x in range(20):
    for y in range(18):
        box('Marble chequer floor',(-4.75+x*.5,-4.25+y*.5,-.045),(.496,.496,.09),cream if (x+y)%2 else dark,.002)
box('Hall rear wall',(0,4.5,4.2),(10,.22,8.4),stone)
box('Hall left wall',(-5,0,4.2),(.22,9,8.4),stone)
# Open front and right side are an intentional cutaway for the game.
for z in [.15,3.45,7.9,8.25]:
    box('Hall cornice',(0,4.28,z),(10,.30,.16),cream)
    box('Hall cornice left',(-4.78,0,z),(.30,9,.16),cream)
for x in [-4.4,-2.7,2.7,4.4]:
    for z,h in [(1.5,3),(5.7,4.1)]:
        rod('Double height pilaster',(x,4.22,z-h/2),(x,4.22,z+h/2),.16,cream)
        box('Column capital',(x,4.2,z+h/2),(.48,.4,.18),gold)
        box('Column plinth',(x,4.2,z-h/2),(.45,.4,.2),cream)
for y in [-3,-.6,1.8,4]:
    rod('Side monumental column',(-4.78,y,.2),(-4.78,y,7.7),.15,cream)
    box('Side capital',(-4.78,y,7.7),(.4,.48,.2),gold)

# An original ornamental cloud painting, modeled without reproducing an artwork.
box('Monumental painted panel',(0,4.33,5.7),(4.5,.04,3.4),blue)
frame(0,4.24,5.7,4.7,3.6,gold)
for i in range(12):
    x=math.sin(i*2.2)*1.5
    z=4.5+(i%4)*.7
    sphere('Painted cloud scroll',(x,4.18,z),(.55,.015,.20),cloud)

# Overhead fresco covering the double-height ceiling, in the spirit of the
# Painted Hall reference (an original interpretation, not a reproduction):
# a deep sky field with layered cloud banks and warm figure masses, seen by
# a free-roaming 3D camera looking straight up, not just the wall panel above.
box('Ceiling fresco field',(0,.25,8.42),(10.1,9.1,.12),fresco_deep,.01)
for x in [-4.85,4.85]: box('Ceiling border',(x,.25,8.36),(.1,9.1,.06),gold)
for y in [-4.2,4.7]: box('Ceiling border',(0,y,8.36),(10.1,.1,.06),gold)
for i in range(46):
    x=math.sin(i*1.7+.4)*4.3
    y=math.cos(i*1.3)*3.9
    sphere('Fresco cloud bank',(x,y,8.34),(.75,.6,.05),cloud)
for i in range(24):
    x=math.sin(i*2.9+1.1)*3.4
    y=math.cos(i*2.1+.6)*3.2
    sphere('Fresco figure mass',(x,y,8.33),(.42,.34,.045),fresco_fig)
for x in [-3.65,3.65]:
    box('Upper dark door',(x,4.29,4.35),(1.25,.06,2.6),dark)
    frame(x,4.2,4.35,1.4,2.8,gold)

# Broad straight ceremonial flight, twenty low marble risers and gilt balusters.
# Continuous player height follows its slope; geometry still shows individual treads.
for i in range(20):
    y=-1+(i+.5)*.15
    z=(i+1)*.15
    box('Grand stair tread',(0,y,z/2),(3.2,.15,z),cream,.006)
    box('Crimson runner tread',(0,y,z+.008),(1.9,.148,.012),red,.001)
    box('Crimson runner riser',(0,y-.075,z-.075),(1.9,.012,.15),red,.001)
    rod('Brass carpet rod',(-1,y-.06,z+.025),(1,y-.06,z+.025),.013,gold)
    if i%2==0:
        for x in [-1.55,1.55]:
            rod('Stair baluster',(x,y,z),(x,y,z+.86),.035,cream)
            sphere('Gilt baluster collar',(x,y,z+.43),(.075,.075,.07),gold)
for x in [-1.55,1.55]:
    rod('Rising gilt handrail',(x,-1,1),(x,2,4),.055,gold)
    for y,z in [(-1,0),(2,3)]:
        box('Stair newel',(x,y,z+.5),(.22,.22,1),cream)
        sphere('Newel gold finial',(x,y,z+1.13),(.14,.14,.16),gold)
box('Upper landing',(0,3.25,2.89),(9.6,2.5,.22),cream)
for x in [-3.18,3.18]:
    box('Landing front fascia',(x,2,2.9),(3.15,.2,.35),stone)
    rod('Landing gilded handrail',(x-1.5,2,4),(x+1.5,2,4),.055,gold)
    for i in range(11):
        xx=x-1.45+i*.29
        rod('Landing baluster',(xx,2,3),(xx,2,3.92),.035,cream)
        sphere('Landing collar',(xx,2,3.5),(.07,.07,.06),gold)
# Ground-level doors face the front circulation lane; never obstruct the stair.
for x in [-4.2,4.2]:
    box('Ground door backdrop',(x,1.65,1.2),(1.05,.08,2.4),dark)
    frame(x,1.56,1.2,1.2,2.5,gold)

sc=bpy.context.scene
sc.name='Pemberley - Grand Staircase and Double Height Hall'
world=bpy.data.worlds.new('Hall daylight'); world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.76,.86,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.4
sc.world=world
light('High clerestory daylight',(2,-1,10),(0,2,2),1800,6,(.86,.92,1))
light('Golden hall fill',(3,-6,5),(0,2,3),1200,5)
light('Landing light',(-3,1,7),(0,3,3),700,3)
data=bpy.data.cameras.new('Hall camera'); cam=bpy.data.objects.new('Hall camera',data)
sc.collection.objects.link(cam); sc.camera=cam
cam.location=(8,-12,8)
cam.rotation_euler=(Vector((0,1,3.6))-cam.location).to_track_quat('-Z','Y').to_euler()
data.lens=28
sc.render.engine='CYCLES'; sc.cycles.samples=16; sc.cycles.use_denoising=True
sc.render.threads_mode='FIXED'; sc.render.threads=6
sc.render.resolution_x=1440; sc.render.resolution_y=1200; sc.render.resolution_percentage=100
sc.view_settings.view_transform='AgX'
sc['historical_note']='Original Chatsworth-inspired interpretation; not its present staircase or a verified Regency reconstruction.'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'interior-hall.blend'),compress=True)
print('GRAND_HALL_MODEL_COMPLETE',flush=True)
