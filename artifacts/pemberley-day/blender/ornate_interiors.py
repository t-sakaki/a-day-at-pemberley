"""Deliberately opulent, locally authored decorative interpretation."""
from interior_tools import *

def ring(name,centre,r,mat,wire=.018,vertical=False):
    x,y,z=centre
    points=[(x+r*math.cos(a),y if vertical else y+r*math.sin(a),z+r*math.sin(a) if vertical else z)
            for a in [i*math.tau/48 for i in range(49)]]
    return curve(name,points,wire,mat)

def chandelier(x,y,m):
    crystal=material('Cut crystal',(.78,.88,.91),.12,.35)
    ring('Ceiling rose outer',(x,y,4.27),.68,m['gold'],.03)
    ring('Ceiling rose inner',(x,y,4.24),.47,m['ivory'],.04)
    for i in range(16):
        a=i*math.tau/16
        petal=sphere('Ceiling acanthus petal',(x+.48*math.cos(a),y+.48*math.sin(a),4.23),(.18,.055,.027),m['gold'])
        petal.rotation_euler.z=a
    rod('Chandelier suspension',(x,y,4.25),(x,y,3.33),.022,m['gold'])
    sphere('Crystal central pear',(x,y,3.52),(.14,.14,.23),crystal)
    ring('Chandelier gilt hoop',(x,y,3.20),.62,m['gold'],.024)
    for i in range(8):
        a=i*math.tau/8
        dx,dy=math.cos(a),math.sin(a)
        curve('Scrolled candle arm',[(x,y,3.35),(x+.35*dx,y+.35*dy,3.05),(x+.75*dx,y+.75*dy,3.23)],.022,m['gold'])
        candle(x+.75*dx,y+.75*dy,3.23,m['gold'],m['wax'])
        for j in range(1,5):
            t=j/5
            sphere('Crystal festoon bead',(x+.62*dx*t,y+.62*dy*t,3.52-.5*math.sin(t*math.pi/2)),(.025,.025,.04),crystal)
        sphere('Cut crystal pendant',(x+.62*dx,y+.62*dy,3.02),(.035,.035,.115),crystal)
    sphere('Chandelier lower drop',(x,y,2.94),(.09,.09,.17),crystal)

def enrich(kind,m):
    # Rich jewel-colour wall panels, gilded fluting, swags and ceiling coffers.
    chandelier(-.6,.8,m)
    for x in [-4.3,-1.6,1.6,4.3]:
        box('Gilded pilaster',(x,4.22,2.50),(.16,.12,2.8),m['ivory'])
        for dx in [-.045,.045]: box('Pilaster gold flute',(x+dx,4.15,2.5),(.016,.025,2.58),m['gold'],.003)
        box('Pilaster carved capital',(x,4.15,3.88),(.32,.20,.15),m['gold'])
    for z in ([4.06] if kind=='window' else [1.16,3.80,4.06]):
        box('Gilt wall ribbon',(0,4.16,z),(9.7,.04,.035),m['gold'],.005)
        box('Gilt side ribbon',(-4.73,0,z),(.04,8.7,.035),m['gold'],.005)
    for x in [-3,0,3]:
        curve('Laurel swag',[(x-.75,4.10,3.80),(x,4.10,3.58),(x+.75,4.10,3.80)],.022,m['gold'])
        for side in [-1,1]:
            for i in range(5):
                xx=x+side*(.13+i*.12)
                leaf=sphere('Laurel gilt leaf',(xx,4.07,3.59+(i/5)**2*.18),(.08,.018,.034),m['gold'])
                leaf.rotation_euler.y=side*.4
    for x in [-3.4,2.5]:
        for y in [-.9,2.5]:
            for dx in [-.65,.65]: box('Ceiling coffer rail',(x+dx,y,4.25),(.032,1.7,.03),m['gold'],.004)
            for dy in [-.85,.85]: box('Ceiling coffer rail',(x,y+dy,4.25),(1.33,.032,.03),m['gold'],.004)
            ring('Ceiling coffer rosette',(x,y,4.23),.22,m['gold'],.022)
    # Repeated damask motif in the solid wall bays, never across the windows.
    if kind!='window':
        for x in [-4.65,-3.9,-2.1,-1.3,1.3,2.1,3.9,4.65]:
            for z in [1.45,1.9,2.35,2.8,3.25]:
                sphere('Raised damask motif',(x,4.375,z),(.038,.012,.065),m['gold'])
    # Gilt-rimmed furniture and paired candelabra.
    if kind=='gallery':
        for x in [-1.1,1.1]:
            sphere('Bench gilt finial',(x,-1.4,.72),(.055,.055,.06),m['gold'])
    elif kind=='music':
        for x in [1.83,3.57]: candle(x,3.82,2.09,m['gold'],m['wax'])
        for x in [-1.87,.27]:
            box('Piano gilt corner',(x,-.025,.92),(.038,.024,.23),m['gold'],.004)
    else:
        for x in [-1.3,1.3]:
            candle(x,.1,.94,m['gold'],m['wax'])
        sphere('Porcelain centrepiece bowl',(0,-.38,1.00),(.24,.18,.07),m['blue'])
        for i in range(9):
            a=i*math.tau/9
            sphere('Fruit centrepiece',(.14*math.cos(a),-.38+.11*math.sin(a),1.06),(.05,.05,.05),m['gold'])
