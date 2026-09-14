# Blender characters

Original, stylized Regency figures, not scans, actor likenesses, or authoritative
reconstructions of Austen's fictional people. Their colours continue the game's
existing cast palette. Models are entirely authored with local geometry.

## Cast and costume

15 character assets represent 16 people: Darcy, Elizabeth Bennet, Georgiana,
Bingley, Caroline, Louisa, the two Gardiners together, Jane, Lady Catherine,
Mrs Reynolds, John, Sarah, Mr Adams, Thomas, and the player's steward.
The existing game's invented staff and player are not asserted to be Austen's cast.

The setting spans the late Georgian / Regency transition, around 1800–1813,
rather than mid-eighteenth-century court dress. Women have an under-bust sash,
a relatively narrow gathered skirt, slippers and curled/bound hair. Men have
cutaway coats, separate waistcoats, shirt collars, cravats, breeches and stockings.
The gardener and groom wear boots; the gardener has a felt hat. Sarah and Mrs
Reynolds wear practical linen accessories rather than a standardized Victorian
maid's uniform. Garments, liveries, colours and facial features are interpretive.

Reference points (museum images are not used as textures):

- [The Met, British dress, 1805–10](https://www.metmuseum.org/art/collection/search/121326):
  period and materials for the women's clothing.
- [The Met, dress, 1805](https://www.metmuseum.org/art/collection/search/157126):
  explains the high-waisted, gathered Empire silhouette. This American garment
  is comparative evidence, not a claim of British ownership.
- [V&A, The Brown Suit: Anglomania](https://www.vam.ac.uk/blog/creating-new-europe-1600-1800-galleries/the-brown-suit-anglomania):
  coat, waistcoat, knee breeches and cravat in late-eighteenth-century dress.
  The game's coats are simplified transitional designs, not copies of that suit.

## Editable sources

Run with Blender 5.2 LTS:

```
blender --background --factory-startup --python-exit-code 1 --python build_characters.py
blender --background --factory-startup --python-exit-code 1 --python build_characters.py -- darcy sarah
```

The command works from any directory with an absolute script path. It uses the
adjacent interior_tools.py geometry/material helpers. Models go to
characters/<id>.blend; transparent PNGs go to public/blender/characters/<id>/.

Each .blend contains named clothing, facial geometry, cameras and lights.
Arm/leg pivot objects have editable rotation keyframes. Frames 1, 7 and 13 supply
an idle pose and two stylized walking poses (not a full skeletal motion-capture
rig). Expression objects carry an "expression" custom property; select visibility
for calm, pleased, concerned, busy or tense to render a face. The script performs
that switching automatically. Both portrait and full-length cameras are retained.
The Gardiners share a scene, but each has a separate character root.

## Runtime

Canvas 2D uses cached 256×384 full-length images, mirrors leftward movement and
selects two walk frames. The original procedural shadow, labels and emotion/
urgency cues remain. Whole-body faces stay calm at their small scale; portrait
cards use five distinct 256×256 expression renders.

Missing full-body images fall back to the existing procedural character.
Unavailable walk frames retain the idle sprite. Portrait failures fall back per
URL to the previous painted portrait, then the SVG face; an error for one person
or expression does not suppress another person's Blender portrait.
No WebGL, Three.js, per-frame asset allocation, or downloaded mesh is introduced.
