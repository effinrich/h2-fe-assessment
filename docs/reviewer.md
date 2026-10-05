# Reviewer walkthrough

A PDF annotation canvas. About five minutes, from the repo root.

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

The ‹ / › arrows and the page field in the header move between pages. Pages you cannot see are not redrawn.

Draw a rectangle. **Open another** (top right) warns before discarding marks. Cancel keeps the canvas.

## Pin

Press **P**. Click two overlapping shapes. Drag one: the other follows. Pins do not attach to PDF pages.

## Export area

Press **C**. Drag a frame. **Download PNG**, **Copy image**, and **Download SVG** sit on the frame. An empty frame leaves those actions disabled.

## Color mode

Toggle color mode. Chrome and the canvas follow it. PNG export stays light.
