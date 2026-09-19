"""Export the six walkable interiors to glTF for the real-time 3D walkthrough.

Run with Blender --background --python. Opens each interior-<room>.blend
(built by build_interiors.py / build_grand_hall.py / build_upstairs.py) and
writes public/blender/walk/<room>.glb. Unlike build_walk_views.py's flat,
fixed-angle 2D cutaway render, the ceiling and chandelier stay in this
export (`keep_ceiling=True`) since a free-roaming 3D camera should actually
see them; only the side-wall/backdrop cutaway objects (never meant to be
walked around) are still dropped. Room-local coordinates already match
InteriorNavigation.ts (no axis-swap transform here, unlike build_estate.py):
x is room-local x, y is room-local y (becomes glTF's -Z), z is up (becomes
glTF's Y).
"""
import bpy, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from interior_tools import hide_for_cutaway
OUT = ROOT.parent / 'public' / 'blender' / 'walk'
OUT.mkdir(parents=True, exist_ok=True)

ROOMS = ['hall', 'gallery', 'music', 'window', 'library', 'bedroom']

def build(room):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT / f'interior-{room}.blend'))
    scene = bpy.context.scene
    hide_for_cutaway(room, scene, keep_ceiling=True)
    for ob in list(scene.objects):
        if ob.hide_render or ob.type in ['CAMERA', 'LIGHT']:
            bpy.data.objects.remove(ob, do_unlink=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT / f'{room}.glb'), export_format='GLB',
                               use_selection=True, export_apply=True)
    print('INTERIOR_GLTF_EXPORT_COMPLETE', room, OUT / f'{room}.glb', flush=True)

if __name__ == '__main__':
    rooms = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ROOMS
    for room in rooms:
        if room not in ROOMS:
            raise ValueError(room)
        build(room)
