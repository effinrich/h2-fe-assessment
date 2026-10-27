# Reviewer walkthrough

A PDF annotation canvas. Ninety-eight seconds, from the repo root.

Watch the [narrated walkthrough](media.mp4) — ninety-eight seconds, 1920x1080, and it plays in GitHub's own player. If you would rather have the file, the same recording is attached to the [reviewer-walkthrough-v3 release](https://github.com/effinrich/h2-fe-assessment/releases/tag/reviewer-walkthrough-v3) in this repository and downloads as an MP4. This page is the same walkthrough in full, in text.

Questions and findings belong in [Discussions](https://github.com/effinrich/h2-fe-assessment/discussions).

The open-document screen is the `/` route in `apps/web`; pin, camera, and the PDF viewer are separate capabilities, and the viewer route composes pin and camera.

## Run

```sh
bun install
bun run start
```

Open [http://localhost:4200/](http://localhost:4200/).

You will see a "Get a license for production" button in the bottom right corner of the canvas. That is tldraw's own licensing prompt, not part of this app: the repository ships without a production license key, so the SDK shows the badge wherever it runs.

## Open a document

On `/`, choose **Open PDF** or **Use an example**, or drop a PDF anywhere on the page. Anything that isn't a single PDF is refused with a toast. The example opens `/viewer` with page 1 on the canvas.

## The canvas

The ‹ / › arrows and the page field in the header move between pages. Every page is rendered once and placed on the canvas as a locked image.

Draw a rectangle. **Open another** (top right) warns before discarding marks. Cancel keeps the canvas.

## Pin

Draw two overlapping shapes. Press **P** and click where they overlap. Drag one: the other follows. Pins do not attach to PDF pages, which are locked. Built on tldraw's pin-bindings example.

## Crop

Press **C** and drag a box. The drag is left behind as a crop — corner brackets around a region, which you can move and resize from its corners. **Export PNG** writes out what is under the brackets: the page and your marks, cropped to the region. Hold **Ctrl** to copy it to the clipboard, or **Alt** to export SVG. The crop stays on the canvas, so you can adjust it and export again.

## Color mode

Toggle color mode. Chrome and the canvas follow it. The page and your marks keep their colors, but a crop taken in dark mode carries the dark background with it.
