"""Original stylized Regency cast. Blender 5.2; no downloaded meshes/textures."""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
from interior_tools import material, sphere, rod, curve, box
OUT=ROOT.parent/'public'/'blender'/'characters'
# id, silhouette, clothing, hair, accessory. Colours follow the game.
CAST=[
 ('darcy','gent','#31432f','#39291e','gold'),
 ('elizabeth-bennet','lady','#e7dab8','#4f3626','ribbon'),
 ('georgiana','lady','#c98b9e','#795132','ribbon'),
 ('bingley','gent','#c8a15c','#864e2a','gold'),
 ('caroline','lady','#6f8f7a','#743c24','shawl'),
 ('louisa','lady','#9a7f96','#503327','shawl'),
 ('the-gardiners','pair','#9fb8a5','#665247','pair'),
 ('jane','lady','#aec4ce','#88633e','ribbon'),
 ('lady-catherine','lady','#7c6f92','#8a8176','shawl'),
 ('mrs-reynolds','lady','#d8a56b','#81776a','cap'),
 ('john','gent','#b8a77e','#483427','livery'),
 ('sarah','lady','#c7846a','#60412e','apron'),
 ('mr-adams','gent','#83a989','#746e61','work'),
 ('thomas','gent','#9fb8a5','#493226','boots'),
 ('steward','gent','#c8985c','#4a3528','ledger'),
]
EXPRESSIONS=['calm','pleased','concerned','busy','tense']

def rgb(hex):
    # Palette is sRGB; Blender shader colours are scene-linear.
    values=[int(hex[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in values)

def mesh(name,verts,faces,mat):
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
    ob=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    for p in data.polygons: p.use_smooth=True
    return ob

def dress(name,rings,mat,pleats=.008):
    verts=[]; n=64
    for z,rx,ry in rings:
        for i in range(n):
            a=2*math.pi*i/n; ripple=pleats*math.cos(16*a)
            verts.append(((rx+ripple)*math.cos(a),(ry+ripple)*math.sin(a),z))
    faces=[tuple(range(n-1,-1,-1))]
    for j in range(len(rings)-1):
        for i in range(n): faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.append(tuple((len(rings)-1)*n+i for i in range(n)))
    return mesh(name,verts,faces,mat)

def pivot(name,point,objects):
    bpy.ops.object.empty_add(location=point)
    p=bpy.context.object; p.name=name
    for ob in objects:
        world=ob.matrix_world.copy(); ob.parent=p; ob.matrix_world=world
    return p

def make_person(name,kind,colour,hairhex,accessory,offset=0,scale=1):
    before=set(bpy.context.scene.objects)
    cloth=material(name+' wool or muslin',rgb(colour))
    trim=material(name+' seam',tuple(c*.63 for c in rgb(colour)))
    hair=material(name+' hair',rgb(hairhex))
    skin=material(name+' warm skin',(.68,.43,.29),rough=.7)
    linen=material(name+' ivory linen',(.91,.86,.72))
    ink=material(name+' dark leather',(.043,.032,.025))
    iris=material(name+' iris',(.13,.18,.12))
    lip=material(name+' lips',(.39,.15,.12))
    brass=material(name+' brass',(.63,.43,.15),metal=.45)
    headz=1.64
    sphere(name+' head',(0,0,headz),(.145,.12,.185),skin)
    rod(name+' neck',(0,0,1.36),(0,0,1.54),.066,skin)
    for side in [-1,1]:
        sphere(name+' ear',(side*.142,.002,1.64),(.027,.022,.045),skin)
        sphere(name+' eye white',(side*.055,-.108,1.67),(.034,.018,.019),linen)
        sphere(name+' iris',(side*.055,-.126,1.67),(.013,.007,.014),iris)
        sphere(name+' pupil',(side*.055,-.132,1.67),(.006,.003,.008),ink)
        sphere(name+' eye glint',(side*.050,-.135,1.675),(.003,.002,.003),linen)
    sphere(name+' nose',(0,-.124,1.622),(.026,.035,.042),skin)
    # Sculpted crown and individual locks leave the forehead visible.
    sphere(name+' hair crown',(0,.022,1.765),(.148,.12,.084),hair)
    for side in [-1,1]:
        for i in range(5 if kind=='lady' else 3):
            sphere(name+' temple curl',(side*(.124+.008*math.sin(i)),.002-i*.017,1.73-i*.034),(.029,.027,.032),hair)
        for i in range(3):
            sphere(name+' swept lock',(side*(.023+i*.033),-.068,1.768-i*.008),(.038,.038,.026),hair)
    if kind=='lady':
        sphere(name+' coiled bun',(0,.115,1.737),(.082,.063,.072),hair)
        dress(name+' high waist gown',[(.16,.235,.16),(.24,.23,.15),(.65,.19,.13),(1.12,.135,.105),(1.27,.16,.105)],cloth)
        sphere(name+' bodice',(0,0,1.30),(.164,.11,.123),cloth)
        dress(name+' underbust sash',[(1.165,.139,.109),(1.198,.14,.11)],trim,0)
        for i in [-1,0,1]:
            curve(name+' hem embroidery',[(.24*math.cos(a),.164*math.sin(a),.20+i*.014) for a in [j*math.pi/16 for j in range(33)]],.003,linen)
        if accessory in ['apron','cap']:
            # Practical apron and kerchief; no Victorian black/white uniform claim.
            mesh(name+' apron',[(-.13,-.118,1.16),(.13,-.118,1.16),(.19,-.172,.22),(-.19,-.172,.22)],[(0,1,2,3)],linen)
            mesh(name+' linen kerchief',[(-.15,-.09,1.38),(0,-.13,1.20),(.15,-.09,1.38)],[(0,1,2)],linen)
            sphere(name+' linen cap',(0,.02,1.80),(.17,.135,.10),linen)
        elif accessory=='shawl':
            for side in [-1,1]:
                rod(name+' draped shawl',(side*.16,-.025,1.35),(side*.245,-.05,.85),.08,trim,.055)
            sphere(name+' brooch',(0,-.121,1.38),(.018,.01,.02),brass)
        else:
            curve(name+' hair ribbon',[(-.13,.045,1.77),(0,.09,1.82),(.13,.045,1.77)],.009,trim)
    else:
        for side in [-1,1]:
            legset=set(bpy.context.scene.objects)
            rod(name+' breeches',(side*.085,0,.50),(side*.085,0,.93),.075,linen,.087)
            rod(name+' stocking',(side*.085,0,.14),(side*.085,0,.53),.043,linen,.052)
            if accessory in ['boots','work']:
                rod(name+' riding boot',(side*.085,-.002,.10),(side*.085,0,.48),.054,ink)
            sphere(name+' shoe',(side*.085,-.048,.09),(.063,.115,.056),ink)
            p=pivot(name+' leg '+str(side),(side*.085,0,.9),set(bpy.context.scene.objects)-legset)
            for frame,angle in [(1,0),(7,side*.22),(13,-side*.22),(19,side*.22),(25,0)]:
                p.rotation_euler.x=angle; p.keyframe_insert('rotation_euler',frame=frame)
        dress(name+' fitted coat',[(.84,.132,.092),(1.06,.135,.096),(1.35,.19,.11),(1.41,.13,.075)],cloth,0)
        waist=brass if accessory=='gold' else linen
        mesh(name+' waistcoat',[(-.077,-.107,1.34),(.077,-.107,1.34),(.07,-.109,.95),(-.07,-.109,.95)],[(0,1,2,3)],waist)
        for side in [-1,1]:
            mesh(name+' coat lapel',[(side*.065,-.114,1.4),(side*.15,-.106,1.32),(side*.082,-.121,1.15)],[(0,1,2)],trim)
            mesh(name+' coat tail',[(side*.02,.08,1.0),(side*.13,.08,1.0),(side*.15,.11,.62),(side*.03,.11,.66)],[(0,1,2,3)],cloth)
        for z in [1.03,1.10,1.17,1.24]:
            sphere(name+' waistcoat button',(0,-.12,z),(.009,.008,.009),brass)
        rod(name+' high shirt collar',(0,0,1.395),(0,0,1.47),.078,linen)
        sphere(name+' cravat knot',(0,-.078,1.425),(.035,.027,.025),linen)
        for side in [-1,1]:
            mesh(name+' cravat fold',[(0,-.1,1.425),(side*.04,-.10,1.40),(side*.017,-.13,1.34)],[(0,1,2)],linen)
        if accessory=='livery':
            for side in [-1,1]:
                for z in [.98,1.08,1.18,1.28]:
                    sphere(name+' livery button',(side*.115,-.09,z),(.011,.009,.011),brass)
        if accessory=='work':
            sphere(name+' felt hat brim',(0,0,1.80),(.23,.18,.018),trim)
            rod(name+' felt hat crown',(0,0,1.80),(0,0,1.93),.12,trim,.105)
        if accessory=='ledger':
            book=box(name+' estate ledger',(-.27,-.09,1.0),(.12,.10,.24),trim,.01)
    # Arms pivot at shoulders. Smooth stylized hands, separate cloth cuffs.
    for side in [-1,1]:
        armset=set(bpy.context.scene.objects)
        shoulder=(side*.18,0,1.33); elbow=(side*.23,-.018,1.09); wrist=(side*.24,-.04,.91)
        if kind=='lady': sphere(name+' gathered sleeve',shoulder,(.074,.08,.087),cloth)
        rod(name+' sleeve upper',elbow,shoulder,.047,cloth,.065)
        rod(name+' sleeve lower',wrist,elbow,.038,cloth,.047)
        rod(name+' cuff',(side*.24,-.04,.90),(side*.24,-.035,.94),.043,linen)
        sphere(name+' hand',(side*.24,-.045,.864),(.035,.03,.052),skin)
        p=pivot(name+' arm '+str(side),shoulder,set(bpy.context.scene.objects)-armset)
        for frame,angle in [(1,0),(7,-side*.22),(13,side*.22),(19,-side*.22),(25,0)]:
            p.rotation_euler.x=angle; p.keyframe_insert('rotation_euler',frame=frame)
    if kind=='lady':
        for side in [-1,1]: sphere(name+' slipper',(side*.075,-.055,.13),(.052,.085,.035),ink)
    # Five geometry expressions, stored in the editable scene.
    for expr in EXPRESSIONS:
        objects_before=set(bpy.context.scene.objects)
        lift={'calm':0,'pleased':-.016,'concerned':.013,'busy':.002,'tense':.0}[expr]
        curve('Expression '+expr+' mouth',[(-.036,-.114,1.562),(0,-.124,1.562+lift),(.036,-.114,1.562)],.0045,lip)
        for side in [-1,1]:
            inner={'calm':0,'pleased':.005,'concerned':.018,'busy':-.012,'tense':-.008}[expr]
            curve('Expression '+expr+' brow',[(side*.025,-.114,1.706+inner),(side*.054,-.117,1.713),(side*.088,-.102,1.708)],.006,hair)
        for ob in set(bpy.context.scene.objects)-objects_before:
            ob['expression']=expr; ob.hide_render=expr!='calm'
    # Distinct facial proportions, including all five brows/mouths, not just recolours.
    proportions={
        'darcy':(.94,1.06), 'elizabeth-bennet':(.97,.96), 'georgiana':(1.04,.96),
        'bingley':(1.08,.97), 'caroline':(.91,1.04), 'louisa':(1.08,1.0),
        'jane':(1.02,1.02), 'lady-catherine':(.95,1.08), 'mrs-reynolds':(1.11,.98),
        'john':(.94,1.0), 'sarah':(1.05,.94), 'mr-adams':(1.12,1.02),
        'thomas':(.96,.97), 'steward':(1.02,1.04),
        'Mr Gardiner':(1.10,1.0), 'Mrs Gardiner':(1.06,.98),
    }
    sx,sz=proportions[name]
    face_words=[' head',' ear',' eye',' iris',' pupil',' nose',' hair',' temple',' swept',' coiled',' linen cap']
    for ob in set(bpy.context.scene.objects)-before:
        if any(word in ob.name for word in face_words) or 'expression' in ob:
            ob.location.x*=sx; ob.location.z=1.64+(ob.location.z-1.64)*sz
            ob.scale.x*=sx; ob.scale.z*=sz
    objects=set(bpy.context.scene.objects)-before
    root=pivot(name+' character root',(0,0,0),[ob for ob in objects if ob.parent is None])
    root.location.x=offset; root.scale=(scale,)*3

def camera(name,loc,target,ortho):
    bpy.ops.object.camera_add(location=loc); ob=bpy.context.object; ob.name=name
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    ob.data.type='ORTHO'; ob.data.ortho_scale=ortho
    return ob

def expression(expr):
    for ob in bpy.context.scene.objects:
        if 'expression' in ob: ob.hide_render=ob['expression']!=expr

def render(path,camera_ob,w,h):
    sc=bpy.context.scene; sc.camera=camera_ob
    sc.render.resolution_x=w; sc.render.resolution_y=h
    sc.render.filepath=str(path); bpy.ops.render.render(write_still=True)

def build(entry):
    ident,kind,colour,hair,acc=entry
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc=bpy.context.scene
    sc.render.engine='CYCLES'; sc.cycles.samples=8; sc.cycles.use_denoising=True
    sc.render.threads_mode='FIXED'; sc.render.threads=6
    sc.render.film_transparent=True; sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
    sc.render.image_settings.compression=75
    sc.world=bpy.data.worlds.new('Soft studio'); sc.world.use_nodes=True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.73,.78,.84,1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value=.65
    sc.view_settings.view_transform='AgX'
    for loc,power,size in [((-3,-4,6),450,4),((3,1,4),300,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc); light=bpy.context.object
        light.data.energy=power; light.data.shape='DISK'; light.data.size=size
        light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
    if kind=='pair':
        make_person('Mr Gardiner','gent',colour,hair,'gold',-.28,.8)
        make_person('Mrs Gardiner','lady','#a6b29a','#655349','ribbon',.28,.8)
    else: make_person(ident,kind,colour,hair,acc)
    body=camera('Full length sprite',(2.6,-7,2.7),(0,0,.96),2.15)
    portrait=camera('Portrait',(1.0,-6,2.45),(0,0,1.53),.69)
    if acc in ['cap','apron','work']:
        portrait.data.ortho_scale=.82
    if kind=='pair':
        portrait.location=(.2,-6,2); portrait.rotation_euler=(Vector((0,0,1.29))-portrait.location).to_track_quat('-Z','Y').to_euler(); portrait.data.ortho_scale=.84
    sc.frame_end=25; sc.frame_set(1); sc.camera=body
    sc.render.resolution_x=256; sc.render.resolution_y=384
    sc['Character']=ident; sc['Notes']='Original stylized Regency interpretation. Arm/leg pivot animation: frames 1,7,13. Facial objects carry expression properties.'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'characters'/f'{ident}.blend'),compress=True)
    dest=OUT/ident; dest.mkdir(parents=True,exist_ok=True)
    for idx,frame in enumerate([1,7,13]):
        sc.frame_set(frame); render(dest/f'body-{idx}.png',body,256,384)
    sc.frame_set(1)
    for expr in EXPRESSIONS:
        expression(expr); render(dest/f'{expr}.png',portrait,256,256)
    print('CHARACTER_COMPLETE',ident,flush=True)

if __name__=='__main__':
    (ROOT/'characters').mkdir(exist_ok=True)
    wanted=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    for entry in CAST:
        if not wanted or entry[0] in wanted: build(entry)
