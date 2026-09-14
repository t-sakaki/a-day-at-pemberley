# Pemberley interiors — art direction and historical basis

These are interpretive rooms for a fictional house, not a measured reconstruction.
The current art direction deliberately amplifies their splendour at the owner's
request: gilt pilasters and laurel swags, jewel-coloured walls, ceiling rosettes,
eight-arm candle chandeliers with stylized crystal drops, and extra candelabra.
This is a more opulent creative departure from Austen's restrained elegance,
not a newly discovered description of Pemberley. The exterior likewise adds
a larger classical portico, carved pediment, urns, dentils and stone balustrades.
The decorative geometry lives in ornate_interiors.py; candle flames and electric
bulbs are not introduced. Room viewing now also supports indoor walking.

## Chatsworth reference

The owner explicitly chose Chatsworth as a reference for a more magnificent house.
[Chatsworth's official film page](https://www.chatsworth.org/news-media/chatsworth-on-film/pride-and-prejudice)
describes the possible inspiration for Austen as a belief, not a proven identification,
and confirms the house's use as Pemberley in the 2005 film. Our models borrow the
idea of a richly decorated English country house, not a measured Chatsworth plan.
The [Painted Hall](https://www.chatsworth.org/visit-chatsworth/chatsworth-estate/house/house-highlights/painted-hall/)
retains late-seventeenth-century painted decoration, but its current staircase is
from 1912. The [Sculpture Gallery](https://www.chatsworth.org/visit-chatsworth/chatsworth-estate/house/house-highlights/sculpture-gallery/)
was developed in 1818–1834. These later details are not presented as original
features of a house visited in the novel's period. No museum photographs or scans
are embedded in the models.

The owner also supplied [BRITISH MADE's illustrated Chatsworth visit](https://www.british-made.jp/stories/travel/201903290031567)
(2019-03-29). Its architectural discussion informs our warm stone and gilded sash
frames, classical pediment and plant-like gilt ornament. The article's Painted
Hall and grand stairs also inform an additional double-height entrance hall.
Its photographs are not copied into the game.

The visual vocabulary is late Georgian, approximately 1790–1813: the eighteenth-
century furnishings inherited by the early nineteenth-century household of the
novel. Neither an authenticated Pemberley floor plan nor an inventory survives,
because Austen's house is fictional.

## Literary evidence

[Pride and Prejudice, chapter 43](https://en.wikisource.org/wiki/Pride_and_Prejudice_(1817)/Chapter_43)
describes high, handsome rooms, proportionate furniture, and restrained elegance.
Elizabeth first sees a dining-parlour and admires the changing prospect from its
windows. The house tour includes a room prepared for Georgiana, her musical
accomplishment, and a picture gallery with Darcy's portrait. This suggests the
importance of domestic use, light, landscape, and family memory.

The game's names, room grouping, westward orientation and tour timing are
game conventions, not a claim about the novel's exact plan or sequence. The room
labelled “great west window” is visualized here as a dining-parlour overlooking
water and trees. No portraits of Elizabeth are hung in Darcy's house before the
marriage. Darcy's painted likeness reuses the app's existing fictional character
art; it is not presented as an authentic Georgian painting. Other pictures are
locally authored landscape studies and the bust is an unnamed classical study.

## Material references and design interpretation

- [National Trust: Osterley Park](https://www.nationaltrust.org.uk/visit/london/osterley-park-and-house/the-house-at-osterley-park)
  documents Robert Adam's coordinated interiors of 1761–1780, restrained classical
  mouldings, the green and gold gallery, and eating-room furniture. We borrow the
  principles of proportion, chair rails, cornices and coordinated furniture, not
  Osterley's exact rooms or its most lavish state decoration.
- [National Music Museum: Broadwood square piano, 1791](https://emuseum.nmmusd.org/objects/4804/square-piano)
  records the five-octave FF–f3 compass and 61 keys. Our mahogany square pianoforte
  uses that keyboard compass as a period reference, not a copy of its mechanism.
- [The Met: Broadwood square piano](https://www.metmuseum.org/art/collection/search/504241)
  documents mahogany veneer and contrasting pale/dark materials. The model uses
  visually contrasting keys and light inlay; it contains no sourced historic
  materials. The music notation is decorative, not a transcribed historical score.

## The hall and three rooms

- **Grand staircase hall:** 8.4 m high cutaway volume, two-tier classical columns,
  honey stone and gilt cornices, chequered marble floor, a broad twenty-riser
  marble staircase with a crimson runner, gold handrails and a 3 m high landing.
  An original cloud-scroll panel suggests a painted hall without reproducing a
  historic mural. The stair can be climbed and descended; the landing can be
  explored but its edges cannot be jumped off. Upper doors are decorative, not
  additional rooms. This is not a reproduction of Chatsworth's 1912 staircase.

- **Picture gallery:** green plaster, panelled dado, gilt frames, Darcy's portrait,
  landscape pictures, classical bust, mahogany console, leather book, candleholders,
  upholstered bench and chairs, woven rug, individual oak floorboards.
- **Music room:** muted blue-green plaster, square pianoforte with 61 individual
  keys, raised lid and music desk, notation, stool, music books, marble fireplace,
  iron grate, restrained landscape painting and a guest chair.
- **Window / dining-parlour:** three tall sash windows, glazing bars, pleated tied-
  back curtains, river and parkland beyond, mahogany table, six tapered-leg chairs,
  porcelain tea service, side table and reading material.

All geometry, decorative patterns and scenery are generated locally. Rendered
images are baked from Blender, while the runtime remains Canvas 2D. Museum images
are not downloaded or embedded.

## Rebuild and edit

Blender 5.2 LTS:

```
blender --background --factory-startup --python-exit-code 1 --python build_interiors.py
```

Optional `-- gallery`, `-- music` or `-- window` renders one room.
`-- music-wanting window-wanting` generates the closed-instrument and
half-shuttered variants used when the household has neglected those rooms. The
default command renders all five views. All variants have editable Blender files.
Run from any directory using the absolute script path. The generator writes `interior-*.blend`
next to the script, and 1440×1000 JPEGs to `../public/blender/interiors/`. The portrait
texture is packed into the gallery file, so that `.blend` is independently editable.
Names identify joinery, furniture, keys, pages, lights and camera in the Outliner.

The original close-up images remain available for automatic tour reveals.
Manual visits now enter a walkable cutaway, not a modal image: walk up to the
front steps, use the visible Enter the house button, or select a room in the list.
Inside, WASD/arrow keys and the same mobile movement pad move the steward.
Walk into an exit marker or activate its labelled button to change rooms; Escape
and Return to grounds offer a direct return. The Set the room in order action
remains available. Dialogs suspend indoor controls, and beginning a new day resets
the location. The entrance opens into the grand hall; the four-space loop is a
game convention, not a historical floor plan.

Generate the hall model, then the walking views after the interiors:

```
blender --background --factory-startup --python-exit-code 1 --python build_grand_hall.py
blender --background --factory-startup --python-exit-code 1 --python build_walk_views.py
```

This reads the editable interior .blend files and writes four cutaway images and
camera/depth JSON files to public/blender/walk/. The ceiling is removed for
visibility. A low-resolution baked depth map lets Canvas 2D put the character
behind furniture without WebGL. Collision boxes keep the player outside furniture
and walls. These walking views use the furnished state, tinted by readiness; the
closed-piano/shutter variants remain in the close-up tour reveals. If an image or
depth file is unavailable, a navigable floor-plan fallback remains usable.
The hall has no separate housekeeping task or close-up reveal; its Explore the
rooms action leads into the picture gallery. Runtime stair elevation is matched
to the Blender stair dimensions in InteriorNavigation.ts.
