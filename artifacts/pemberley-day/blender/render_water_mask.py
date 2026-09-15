"""Regenerate the visible lake mask after rebuilding pemberley.blend."""
from pathlib import Path
import bpy
ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'pemberley.blend'))
scene=bpy.context.scene
def emission(name,value):
    m=bpy.data.materials.new(name); m.use_nodes=True
    nodes=m.node_tree.nodes; nodes.clear()
    output=nodes.new('ShaderNodeOutputMaterial')
    shader=nodes.new('ShaderNodeEmission')
    shader.inputs['Color'].default_value=(value,value,value,1)
    m.node_tree.links.new(shader.outputs[0],output.inputs['Surface'])
    return m
black,white=emission('Mask occluder',0),emission('Visible lake',1)
for obj in scene.objects:
    if obj.type=='MESH':
        obj.data.materials.clear()
        obj.data.materials.append(white if obj.name=='Lake' else black)
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(0,0,0,1)
scene.render.film_transparent=False
scene.view_settings.view_transform='Standard'
scene.cycles.samples=4; scene.cycles.use_denoising=False
scene.render.threads_mode='FIXED'; scene.render.threads=4
scene.render.resolution_percentage=50
scene.render.filepath=str(ROOT.parent/'public/blender/lake-mask.png')
bpy.ops.render.render(write_still=True)
print('WATER_MASK_COMPLETE')
