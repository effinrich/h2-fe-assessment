# Annotate your first PDF

You will run the app, open the example document, draw on it, pin two shapes together, and export a crop. About ten minutes.

You need [Bun](https://bun.sh). Nothing else.

## 1. Install and start

From the repo root:

```sh
bun install
bun run start
```

Open [http://localhost:4200/](http://localhost:4200/). You should see the open-document screen with **Open PDF** and **Use an example**.

## 2. Open the example

Choose **Use an example**. The app moves to `/viewer` and page 1 appears on the canvas.

Use **Previous** / **Next** or the page field to change pages. Pages you cannot see are not redrawn.

## 3. Draw a mark

Pick the rectangle tool from the toolbar and drag a rectangle on the page. Draw a second one that overlaps the first.

Click **Open another document**. A dialog warns that your marks will be lost. Choose **Keep working**.

## 4. Pin two shapes together

Press **P**. Click where the two rectangles overlap. A red pin lands there.

Press **Escape** to return to the select tool, then drag one rectangle. The other follows. Drag the pin onto empty canvas and the rectangles move independently again.

Pins refuse to attach to PDF pages. Try pinning on the page itself with nothing on top: nothing attaches.

## 5. Export a crop

Press **C**, then drag a frame around your rectangles. Three actions sit on the frame: **Download PNG**, **Copy image**, **Download SVG**.

Click **Download PNG**. You get a file named after the document. An empty frame disables the actions.

## 6. Switch color mode

Toggle color mode. The chrome and the canvas follow it. The exported PNG stays light.

## What next

- See the component library: `bun run storybook`, then open [http://localhost:4400/](http://localhost:4400/).
- Add your own tool: [Build a canvas extension](build-a-canvas-extension.md).
- Understand how the pieces fit: [Architecture](../explanation/architecture.md).
