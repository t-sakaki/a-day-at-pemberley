# Animated lake surface

The estate lake keeps its Blender geometry and foreground occlusion. Run
`render_water_mask.py` with Blender after rebuilding `pemberley.blend` to
regenerate `public/blender/lake-mask.png`. The script does not overwrite the
source blend file. White pixels indicate visible lake; black includes trees,
shore, paths and all other geometry. Keep the same camera and resolution ratio.

`BlenderEstate.ts` converts this mask to alpha once, crops to its bounds and
reuses two small Canvas 2D buffers. `WaterSurface.ts` adds sky-to-depth colour,
soft wooded-bank colour reflections, drifting broken highlights and rain rings.
Reflection shapes are painterly suggestions, not ray-traced reflections of
individual scene objects. Evening colour changes continuously with the clock.
Seeds are fixed; motion uses smooth time functions, with no per-frame randomness
or full-screen pixel reads. Pan/zoom uses the same transform as the estate image.

Missing masks retain the original static Blender lake. This change concerns the
estate lake; it does not replace the fountain or the separate lake-walk vignette.

Verification: PC and Pixel 5 tests check deterministic frames, temporal changes,
rain, zero changed pixels outside the mask, asset failure, and house entry.
