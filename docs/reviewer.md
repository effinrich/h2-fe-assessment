# Reviewer walkthrough

A PDF annotation canvas. Ninety seconds, from the repo root.

Watch the [narrated walkthrough](https://github.com/effinrich/h2-fe-assessment/releases/download/reviewer-walkthrough-v1/annotate-h2-walkthrough.mp4) — ninety seconds, 1920x1080, about 3.4 MB. It is attached to the [reviewer-walkthrough-v1 release](https://github.com/effinrich/h2-fe-assessment/releases/tag/reviewer-walkthrough-v1) in this repository, so it downloads with the GitHub account you already have. This page is the same walkthrough in full, in text.

Questions and findings belong in [Discussions](https://github.com/effinrich/h2-fe-assessment/discussions).

The open-document screen is the `/` route in `apps/web`; pin, camera, and the PDF viewer are separate capabilities, and the viewer route composes pin and camera.

## Run

```sh
bun install
bun run start
```

Open [http://localhost:4200/](http://localhost:4200/).

## Open a document

On `/`, choose **Open PDF** or **Use an example**, or drop a PDF anywhere on the page. Anything that isn't a single PDF is refused with a toast. The example opens `/viewer` with page 1 on the canvas.

## The canvas

The ‹ / › arrows and the page field in the header move between pages. Every page is rendered once and placed on the canvas as a locked image.

Draw a rectangle. **Open another** (top right) warns before discarding marks. Cancel keeps the canvas.

## Pin

Draw two overlapping shapes. Press **P** and click where they overlap. Drag one: the other follows. Pins do not attach to PDF pages, which are locked. Built on tldraw's pin-bindings example.

## Screenshot

Press **C** and drag a box. Releasing downloads everything under it as a PNG; hold **Ctrl** to copy it instead. This is tldraw's screenshot-tool example.

## Color mode

Toggle color mode. Chrome and the canvas follow it. PNG export stays light.
