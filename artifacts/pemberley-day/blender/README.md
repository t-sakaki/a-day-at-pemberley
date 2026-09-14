# Pemberley Blender source

Editable estate models and reproducible renders for the Canvas 2D application.

Run Blender 5.2 LTS with `--background --factory-startup --python build_estate.py`.
The script writes `pemberley.blend` here and `../public/blender/estate.png`.
The source file contains editable geometry, materials, lights and camera. No
downloaded assets, paid services or MCP connection are required for regeneration.

The camera matches the existing ground projection: screen X=(x-y)*sqrt(3)/2,
screen Y=(x+y)*0.29-z*0.9. Render origin is pixel (1024,700), with
2048/64/sqrt(1.5) pixels per game unit. Keep these values synchronized with
`src/visuals/BlenderEstate.ts` if the export camera or resolution changes.

The app loads the image once, applies its existing pan/zoom, and keeps figures,
rain, paper and time-of-day processing live in Canvas 2D. The old procedural
estate remains the loading/error fallback. This is an offline-rendered 3D scene,
not a freely orbitable browser 3D viewer. Figure occlusion retains the existing
foreground-overlay behavior.
