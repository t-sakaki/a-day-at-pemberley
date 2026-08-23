---
name: Narrow-phone panel geometry checks
description: Guidance for reliable viewport-bound assertions on animated mobile panels.
---

When testing geometry inside an animated mobile side panel, wait until the panel has finished entering before sampling bounding boxes; otherwise transient fractional transforms can look like clipping.

**Why:** The panel transition can briefly report a slightly negative x-coordinate even though the settled card is fully inside the viewport.

**How to apply:** Prefer a strict viewport assertion after polling for the settled edge, rather than weakening the bound with a pixel tolerance.