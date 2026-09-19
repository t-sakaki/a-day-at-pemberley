"""The estate's foxhound, for the 'dog' emergency event ("a loose hound is
making trouble" - App.tsx / EventSystem.ts's `dog` event). A single static
pose (alert, mid-stride) is enough for a real-time prop the player spots and
walks toward; unlike build_wildlife.py's sprite animals this exports a real
glTF mesh, matching the low-poly primitive style of build_characters.py.

blender --background --python build_hound_gltf.py
"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from interior_tools import *

OUT = ROOT.parent / 'public' / 'blender' / 'animals'
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
coat = material('Hound coat', (.62, .40, .20), grain=True)
white = material('Hound white patches', (.86, .82, .72))
dark = material('Hound nose and eyes', (.03, .025, .02))

sphere('Hound body', (0, 0, .42), (.46, .22, .26), coat)
sphere('Hound chest patch', (.18, 0, .30), (.20, .19, .18), white)
rod('Hound neck', (.32, 0, .48), (.46, 0, .62), .15, coat, .1)
sphere('Hound head', (.60, 0, .66), (.19, .14, .15), coat)
sphere('Hound muzzle', (.76, 0, .60), (.13, .09, .08), white)
sphere('Hound nose', (.88, 0, .60), (.035, .05, .035), dark)
for y in [-.11, .11]:
    sphere('Hound eye', (.68, y, .68), (.018, .012, .02), dark)
    sphere('Hound ear', (.55, y * 1.6, .70), (.06, .045, .17), coat)
sphere('Hound tail base', (-.42, 0, .52), (.09, .08, .09), coat)
curve('Hound tail', [(-.42, 0, .55), (-.66, 0, .68), (-.78, 0, .86)], .035, white)
# Mid-stride: diagonal pair forward, the other diagonal pair back.
for x, y, forward in [(.28, -.16, True), (.28, .16, False), (-.20, -.16, False), (-.20, .16, True)]:
    hip = (x, y, .40)
    paw_x = x + (.22 if forward else -.18)
    rod(f'Hound leg {x}-{y}', hip, (paw_x, y, .06), .05, coat, .04)
    sphere(f'Hound paw {x}-{y}', (paw_x, y, .045), (.06, .05, .04), white)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT / 'hound.glb'), export_format='GLB',
                           use_selection=True, export_apply=True)
print('HOUND_GLTF_EXPORT_COMPLETE', OUT / 'hound.glb', flush=True)
