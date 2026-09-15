"""Original upstairs library and guest chamber for the walkable house."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from build_interiors import palette, shell, landscape
from interior_tools import *

def build(kind):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    m=palette('gallery' if kind=='library' else 'music')
    shell('gallery',m)
    if kind=='library':
        for x in [-3.3,0,3.3]:
            box('Mahogany bookcase back',(x,4.14,2.05),(2.75,.25,3.8),m['wood'])
            for dx in [-1.4,1.4]:
                box('Bookcase pilaster',(x+dx,3.85,2.05),(.16,.75,3.9),m['wood'])
            for z in [.25,1,1.75,2.5,3.25,4]:
                box('Library shelf',(x,3.85,z),(2.95,.8,.09),m['wood'])
            for row in range(5):
                for j in range(15):
                    covers=[m['red'],m['silk'],m['wood'],m['blue']]
                    xx=x-1.23+j*.174; z=.62+row*.75
                    box('Leather bound volume',(xx,3.65,z),(.14,.32,.57),covers[(j+row)%4],.006)
                    for dz in [-.17,.17]:
                        box('Gilt spine tooling',(xx,3.48,z+dz),(.10,.009,.022),m['gold'],0)
        table(0,.3,2.7,1.4,m['wood']); chair(0,-.9,m['wood'],m['silk'],math.pi)
        book(-.55,.3,.99,.65,.46,m['red'],m['paper'])
        candle(.8,.3,.92,m['gold'],m['wax'])
        rug(0,0,4.3,3.7,m['red'],m['gold'],m['paper'])
    else:
        box('Guest bed mahogany frame',(-1.7,1.7,.55),(2.65,3.8,.4),m['wood'])
        box('Guest mattress',(-1.7,1.7,.88),(2.55,3.65,.32),m['paper'],.1)
        box('Silk counterpane',(-1.7,1.15,1.08),(2.53,2.55,.11),m['silk'],.045)
        for x in [-2.95,-.45]:
            for y in [-.12,3.52]:
                rod('Four poster bed column',(x,y,.3),(x,y,3.65),.07,m['wood'])
                sphere('Bedpost finial',(x,y,3.8),(.13,.13,.17),m['gold'])
        for y in [-.12,3.52]:
            box('Bed canopy rail',(-1.7,y,3.6),(2.75,.16,.22),m['wood'])
        for x in [-2.95,-.45]:
            box('Bed canopy side',(x,1.7,3.6),(.16,3.8,.22),m['wood'])
        for x in [-2.3,-1.1]:
            sphere('Linen pillow',(x,2.85,1.15),(.50,.39,.16),m['paper'])
        table(2.9,2.6,1.7,.85,m['wood'])
        sphere('Porcelain wash bowl',(2.9,2.6,1.04),(.35,.27,.13),m['porcelain'])
        frame(2.9,4.26,2.5,1.4,1.5,m['gold'])
        box('Looking glass',(2.9,4.30,2.5),(1.15,.025,1.2),m['blue'])
        chair(2.9,1.6,m['wood'],m['silk'],math.pi)
        rug(.6,-1.4,3,2.4,m['red'],m['gold'],m['paper'])
    sc=bpy.context.scene
    world=bpy.data.worlds.new('Upstairs daylight'); world.use_nodes=True
    world.node_tree.nodes['Background'].inputs[1].default_value=.35; sc.world=world
    camera=bpy.data.objects.new('Walking camera',bpy.data.cameras.new('Walking camera'))
    sc.collection.objects.link(camera); sc.camera=camera
    sc.render.engine='CYCLES'; sc.cycles.use_denoising=True
    sc.render.threads_mode='FIXED'; sc.render.threads=6
    sc.view_settings.view_transform='AgX'
    sc['historical_note']='Fictional upstairs rooms; no claim about Austen or the actual Chatsworth floor plan.'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/f'interior-{kind}.blend'),compress=True)
    print('UPSTAIRS_MODEL_COMPLETE',kind,flush=True)

for kind in ['library','bedroom']: build(kind)
