"""Export a playable character (mesh + walk-cycle keyframes) to glTF for the
real-time 3D walkthrough. Reuses make_person() from build_characters.py so
the model stays identical to the sprite-render pipeline; only adds an export
step (default target: the player's 'steward'). Only the 'calm' expression's
face objects are kept — the other four are sprite-only face swaps baked as
hidden duplicate geometry, which would otherwise all render at once in a
real-time viewer since there's no per-frame hide_render toggle in glTF.
"""
import bpy, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from build_characters import make_person, CAST
OUT = ROOT.parent / 'public' / 'blender' / 'characters'
OUT.mkdir(parents=True, exist_ok=True)

def build(entry):
    ident, kind, colour, hair, acc = entry
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 25
    if kind == 'pair':
        make_person('Mr Gardiner', 'gent', colour, hair, 'gold', -.28, .8)
        make_person('Mrs Gardiner', 'lady', '#a6b29a', '#655349', 'ribbon', .28, .8)
    else:
        make_person(ident, kind, colour, hair, acc)
    for ob in list(scene.objects):
        if ob.get('expression') and ob['expression'] != 'calm':
            bpy.data.objects.remove(ob, do_unlink=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT / f'{ident}.glb'), export_format='GLB',
                               use_selection=True, export_apply=True,
                               export_animations=True, export_animation_mode='SCENE')
    print('CHARACTER_GLTF_EXPORT_COMPLETE', ident, OUT / f'{ident}.glb', flush=True)

if __name__ == '__main__':
    wanted = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['steward']
    for entry in CAST:
        if entry[0] in wanted:
            build(entry)
