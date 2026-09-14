# Pemberley interiors — art direction and historical basis

These are interpretive rooms for a fictional house, not a measured reconstruction.
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

The game's names, three-room grouping, westward orientation and tour timing are
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

## The three rooms

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

The app loads each image once, fits the entire composition without stretching,
and uses the existing readiness band for light and colour. Missing or undecoded
images use the prior procedural room. The lake walk remains its existing outdoor
scene. Users may open the rooms from the tour list and close with Escape or the
close button; automatic tour reveals retain their short display period.
