# Wildlife and working interiors

The animals are locally authored Blender meshes, rendered to transparent PNG
poses for the existing Canvas 2D scene. No WebGL runtime is required.
Run `build_wildlife.py` with Blender; optional arguments after `--` select
`deer`, `rabbit`, or `sheep`. Omitting them rebuilds all three species.

## Rabbit locomotion

[Carneiro et al., PLOS Genetics (2021)](https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1009429)
describes alternating forelimbs and coordinated bilateral hindlimbs in rabbits.
Our simplified animation uses a preparatory crouch, paired hind-leg extension,
flight, and forefoot-first landing/settling. Three Blender poses are combined
with a continuous body arc; the shadow stays on the ground. Horizontal position
is held during rest, so rabbits do not slide across the grass between hops.
The 1.8-second rhythm, 0.32 scene-unit peak and squash/stretch are artistic
choices, not measured biomechanics. Rabbit pose keys are saved in the blend file.

## Sheep in the parkland

[Chatsworth's official park description](https://www.chatsworth.org/visit-chatsworth/chatsworth-estate/park/about-the-park/)
identifies sheep, cattle and deer as part of its working landscape. Our three
sheep graze on the outer lawn, beyond the formal garden paths. They spend most
of their cycle feeding, with short, slow relocations. Their appearance is
stylized rather than a reconstruction of a documented Regency breed.

## Furniture and staff

The library chair faces its desk. The guest-chamber chair faces the washstand;
its collision footprint moves with the Blender mesh.

Staff assignments determine which modeled room contains each person. Indoor
staff no longer have a second copy outdoors. Assignments include the grand hall
and both upstairs rooms; absent staff are hidden. Changes relocate staff
immediately, without simulated corridor travel. Unmodeled workplaces such as
the stables retain outdoor map positions. Emergency dispatch temporarily uses
the existing incident marker and preserves the normal assignment for return.
