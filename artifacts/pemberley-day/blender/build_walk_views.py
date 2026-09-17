"""Bake a cutaway walking view and camera-space depth for Canvas 2D occlusion."""
import bpy, sys, math, json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'public'/'blender'/'walk'
OUT.mkdir(parents=True,exist_ok=True)

def build(room):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'interior-{room}.blend'))
    sc=bpy.context.scene
    sys.path.insert(0,str(ROOT))
    from interior_tools import hide_for_cutaway
    hide_for_cutaway(room,sc)
    cam=sc.camera
    cam.location=(11,-14,13)
    cam.rotation_euler=(Vector((0,.25,1.2))-cam.location).to_track_quat('-Z','Y').to_euler()
    scale=20 if room=='hall' else 16
    if room=='hall':
        cam.location.z+=2
    cam.data.type='ORTHO'; cam.data.ortho_scale=scale
    sc.render.resolution_x=1100; sc.render.resolution_y=900
    sc.render.resolution_percentage=100; sc.render.film_transparent=True
    sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
    sc.render.filepath=str(OUT/f'{room}.png')
    sc.cycles.samples=12
    bpy.context.view_layer.update()
    def project(co):
        p=world_to_camera_view(sc,cam,Vector(co)); return [p.x,1-p.y]
    origin=project((0,0,0))
    axes=[[a-b for a,b in zip(project(v),origin)] for v in [(1,0,0),(0,1,0),(0,0,1)]]
    direction=cam.rotation_euler.to_matrix()@Vector((0,0,-1))
    right=cam.rotation_euler.to_matrix()@Vector((1,0,0))
    up=cam.rotation_euler.to_matrix()@Vector((0,1,0))
    # One BVH for precisely the visible geometry; depth and colour share a camera.
    deps=bpy.context.evaluated_depsgraph_get(); verts=[]; faces=[]
    for ob in sc.objects:
        if ob.hide_render or ob.type not in ['MESH','CURVE']: continue
        evaluated=ob.evaluated_get(deps); data=evaluated.to_mesh()
        if data:
            data.calc_loop_triangles(); start=len(verts)
            verts.extend(evaluated.matrix_world@v.co for v in data.vertices)
            faces.extend(tuple(start+i for i in tri.vertices) for tri in data.loop_triangles)
        evaluated.to_mesh_clear()
    tree=BVHTree.FromPolygons(verts,faces,all_triangles=True)
    width,height=275,225; depth=[]
    for y in range(height):
        for x in range(width):
            ray=cam.location+right*((x+.5)/width-.5)*scale+up*(.5-(y+.5)/height)*scale*900/1100
            hit=tree.ray_cast(ray,direction,100)
            depth.append(round(hit[3]*100) if hit[0] is not None else 65535)
    meta=dict(width=1100,height=900,origin=origin,axes=axes,
              camera=list(cam.location),direction=list(direction),
              depthWidth=width,depthHeight=height,depth=depth)
    (OUT/f'{room}.json').write_text(json.dumps(meta,separators=(',',':')),encoding='utf-8')
    bpy.ops.render.render(write_still=True)
    print('WALK_VIEW_COMPLETE',room,flush=True)

if __name__=='__main__':
    rooms=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['hall','gallery','music','window','library','bedroom']
    for room in rooms:
        if room not in ['hall','gallery','music','window','library','bedroom']: raise ValueError(room)
        build(room)
