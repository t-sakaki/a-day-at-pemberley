---
name: Browser E2E environment
description: System libraries required for Playwright Chromium in this workspace.
---

Playwright Chromium and Firefox may require Nix system libraries that are not present by default, including glib, libgbm, GTK, gdk-pixbuf, and common X11 libraries.

**Why:** Browser tests otherwise fail before the application launches with missing shared-library errors; Firefox additionally checks for GTK and gdk-pixbuf at launch.

**How to apply:** When adding browser-based regression tests, install the supported runtime libraries and Playwright Chromium before diagnosing test failures. The Vite runtime-error overlay can also intercept clicks after benign ResizeObserver loop warnings; assert persisted values before relying on overlay-covered interactions.

For fake-clock tests with long user flows, pause the clock before starting the flow and explicitly advance it at assertions; leaving it running allows real test duration to change timer-driven UI state.