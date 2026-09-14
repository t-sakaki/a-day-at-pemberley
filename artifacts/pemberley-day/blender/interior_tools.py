"""Locally authored Georgian joinery, furniture and decorative objects."""
import bpy
import math
import random
from mathutils import Vector

def material(name, color, rough=.65, metal=0, grain=False):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1)
    m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    if grain:
        n=m.node_tree.nodes.new('ShaderNodeTexNoise')
        n.inputs['Scale'].default_value=7
        n.inputs['Detail'].default_value=3
        coords=m.node_tree.nodes.new('ShaderNodeTexCoord')
        mapping=m.node_tree.nodes.new('ShaderNodeVectorMath')
        mapping.operation='MULTIPLY'
        mapping.inputs[1].default_value=(2,35,3)
        m.node_tree.links.new(coords.outputs['Generated'],mapping.inputs[0])
        m.node_tree.links.new(mapping.outputs[0],n.inputs['Vector'])
        ramp=m.node_tree.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].color=(*(c*.65 for c in color),1)
        ramp.color_ramp.elements[1].color=(*(min(1,c*1.18) for c in color),1)
        m.node_tree.links.new(n.outputs['Fac'],ramp.inputs[0])
        m.node_tree.links.new(ramp.outputs[0],p.inputs['Base Color'])
        bump=m.node_tree.nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value=.12
        bump.inputs['Distance'].default_value=.015
        m.node_tree.links.new(n.outputs['Fac'],bump.inputs['Height'])
        m.node_tree.links.new(bump.outputs[0],p.inputs['Normal'])
    return m

def box(name,loc,size,mat,bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object
    o.name=name
    o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Hand finished edges','BEVEL')
        b.width=bevel
        b.segments=2
        o.modifiers.new('Corner normals','WEIGHTED_NORMAL')
    return o

def sphere(name,loc,size,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=loc)
    o=bpy.context.object
    o.name,o.scale=name,size
    o.data.materials.append(mat)
    for p in o.data.polygons: p.use_smooth=True
    return o

def rod(name,a,b,r,mat,r2=None):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r,radius2=r if r2 is None else r2,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object
    o.name=name
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    o.data.materials.append(mat)
    return o

def curve(name,points,r,mat):
    data=bpy.data.curves.new(name,'CURVE')
    data.dimensions='3D'
    data.bevel_depth=r
    data.bevel_resolution=2
    s=data.splines.new('BEZIER')
    s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):
        p.co=co
        p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(o)
    data.materials.append(mat)
    return o

def frame(x,y,z,w,h,m):
    for size,inset in [(.08,0),(.035,.09),(.025,.14)]:
        for sx in [-1,1]: box('Gilt frame upright',(x+sx*(w/2-inset),y,z),(size,.09,h-2*inset),m)
        for sz in [-1,1]: box('Gilt frame rail',(x,y,z+sz*(h/2-inset)),(w-2*inset,.09,size),m)

def chair(x,y,wood,fabric,angle=0):
    before=set(bpy.context.scene.objects)
    box('Upholstered seat',(0,0,.53),(.66,.60,.12),fabric,.06)
    for dx in [-.26,.26]:
        for dy in [-.24,.24]: rod('Tapered chair leg',(dx,dy,.04),(dx,dy,.49),.027,wood,.045)
        rod('Chair back upright',(dx,.24,.48),(dx,.28,1.28),.025,wood)
    box('Chair top rail',(0,.28,1.28),(.62,.06,.09),wood,.025)
    for dx in [-.13,0,.13]: rod('Chair back splat',(dx,.26,.72),(dx,.28,1.23),.018,wood)
    box('Chair back rail',(0,.26,.72),(.55,.055,.055),wood)
    ca,sa=math.cos(angle),math.sin(angle)
    for o in set(bpy.context.scene.objects)-before:
        px,py=o.location.x,o.location.y
        o.location.x=x+px*ca-py*sa
        o.location.y=y+px*sa+py*ca
        o.rotation_euler.z+=angle

def table(x,y,w,d,wood):
    box('Mahogany tabletop',(x,y,.86),(w,d,.10),wood,.04)
    box('Table apron',(x,y,.72),(w-.12,d-.12,.20),wood)
    for dx in [-w/2+.12,w/2-.12]:
        for dy in [-d/2+.12,d/2-.12]: rod('Table leg',(x+dx,y+dy,.03),(x+dx,y+dy,.78),.035,wood,.06)

def book(x,y,z,w,d,cover,paper):
    box('Book pages',(x,y,z),(w,d,.06),paper,.006)
    for dz in [-.04,.04]: box('Leather binding',(x,y,z+dz),(w+.025,d+.025,.015),cover,.005)

def candle(x,y,z,brass,wax,lit=False):
    rod('Candlestick foot',(x,y,z),(x,y,z+.04),.11,brass)
    rod('Candlestick stem',(x,y,z+.04),(x,y,z+.30),.022,brass)
    rod('Drip pan',(x,y,z+.29),(x,y,z+.32),.07,brass)
    rod('Beeswax candle',(x,y,z+.32),(x,y,z+.62),.028,wax)
    rod('Wick',(x,y,z+.62),(x,y,z+.65),.006,brass)

def fireplace(x,y,stone,dark,brass):
    box('Fireplace recess',(x,y,1.02),(1.9,.08,1.9),dark)
    for dx in [-1.02,1.02]:
        box('Marble jamb',(x+dx,y-.15,.94),(.25,.32,1.86),stone)
        for v in [-.065,.065]: box('Jamb fluting',(x+dx+v,y-.32,.95),(.018,.012,1.4),brass,.004)
    box('Carved mantel',(x,y-.15,1.99),(2.55,.55,.16),stone,.03)
    box('Mantel frieze',(x,y-.15,1.78),(2.2,.3,.23),stone)
    box('Stone hearth',(x,y-.43,.035),(2.6,1,.07),stone)
    for dx in [-.65,-.32,0,.32,.65]: rod('Iron grate',(x+dx,y-.25,.18),(x+dx,y-.25,.60),.018,dark)
    rod('Grate rail',(x-.8,y-.25,.45),(x+.8,y-.25,.45),.018,dark)

def curtain(x,y,width,height,fabric,brass):
    # Pleated hanging cloth, tied back at the lower third.
    verts=[]
    cols,rows=28,20
    for j in range(rows+1):
        t=j/rows
        spread=.48+.52*abs(t-.68)/.68
        for i in range(cols+1):
            u=i/cols
            verts.append((x+(u-.5)*width*spread,y+.055*math.sin(u*math.pi*12),4.02-t*height))
    faces=[]
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i
            faces.append((a,a+1,a+cols+2,a+cols+1))
    mesh=bpy.data.meshes.new('Pleated curtain')
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(fabric)
    o=bpy.data.objects.new('Tied back silk curtain',mesh)
    bpy.context.collection.objects.link(o)
    for p in mesh.polygons: p.use_smooth=True
    rod('Curtain tie',(x-width*.24,y-.07,4.02-height*.68),(x+width*.24,y-.07,4.02-height*.68),.016,brass)

def rug(x,y,w,d,red,gold,cream):
    box('Woven carpet',(x,y,.043),(w,d,.025),red,.004)
    for inset,m in [(.10,gold),(.21,cream),(.30,gold)]:
        for sx in [-1,1]: box('Carpet border',(x+sx*(w/2-inset),y,.06),(.035,d-inset*2,.006),m,0)
        for sy in [-1,1]: box('Carpet border',(x,y+sy*(d/2-inset),.06),(w-inset*2,.035,.006),m,0)
    for xx in [-w*.28,0,w*.28]:
        for yy in [-d*.3,0,d*.3]:
            sphere('Woven rosette',(x+xx,y+yy,.062),(.17,.24,.003),gold)
            sphere('Rosette centre',(x+xx,y+yy,.066),(.08,.12,.003),red)

def light(name,loc,target,power,size,color=(1,.88,.69)):
    data=bpy.data.lights.new(name,'AREA')
    data.energy,data.shape,data.size,data.color=power,'DISK',size,color
    o=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(o)
    o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o
