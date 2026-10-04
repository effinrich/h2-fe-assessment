# Reference demos — what they actually show

The brief calls the videos "competitors' references" and asks us to deliver something
better. This is what they contain, extracted rather than assumed.

## Method, and its limits

I cannot play video. These notes come from `ffmpeg` stills at 2 fps plus `tesseract` OCR,
printing only when the text changed, and then from reading 4 fps stills directly as images
(frame `fN` sits at roughly `(N-1) × 0.25s`). The second pass corrected several things the
OCR pass got wrong; the corrections are folded in below.

**No audio.** Checked all three files with `ffprobe`: they carry a single `h264` video
stream and nothing else. There is no narration, so there is nothing to transcribe. Worth
knowing before anyone spends time on it.

**The treatment matters.** The UI is **light mode**, a pale canvas inside a window that
sits over a busy, saturated illustrated wallpaper. The wallpaper, not the UI, is what
defeats tesseract. Four passes compared on the noisiest frames:

| Treatment                                   | Result                                           |
| ------------------------------------------- | ------------------------------------------------ |
| as-is, 1.5×                                 | noisy chrome, most labels lost                   |
| `negate`, 1.5×                              | no better than as-is                             |
| **`eq=brightness=0.25:contrast=1.5`, 1.5×** | **best** — recovered the style panel and a toast |
| `format=gray,negate,eq=contrast=1.6`, 2×    | comparable to bright, not better                 |

The brightness lift is what made the difference; inverting did not, which was my
prediction and it was wrong.

**The limit that no filter fixes.** OCR reads words. The pin and camera behaviour is
spatial, so OCR alone couldn't reach it. Reading the stills directly does: the
interactions below are described from the frames, with frame numbers.

| Clip       | Length | Frames sampled |
| ---------- | ------ | -------------- |
| task-2.mp4 | 5.6s   | 11             |
| task-3.mp4 | 20.5s  | 41             |
| task-4.mp4 | 14.2s  | 28             |

---

## Task 2 — display a PDF

| Time     | What happens                                                           |
| -------- | ---------------------------------------------------------------------- |
| 0.0–1.0s | Empty state, two controls: **"Open PDF"** and **"Use an example"**.    |
| 1.5–2.0s | macOS file picker on **Downloads**, selecting **`Dummy (1).pdf`**.     |
| 2.5s+    | The PDF renders in the canvas, showing the exercise README's own text. |

Controls while viewing: **`S` `M` `L` `XL`**, **`Export PDF`**, a **`Page 1`** indicator.

## Task 3 — pin tool

Style panel for a selected rectangle (tldraw's panel; the last row is the odd one out):

```
colours · opacity · fill · dash · S M L XL · Aa Aa Aa Aa · align · Shape [ ]
```

**`Shape`** is a style-panel **row with a checkbox**, not a tool or menu entry. The clip
never toggles it, so its purpose isn't shown.

The toolbar's first slot is the pin tool, drawn as tldraw's **`?`** fallback icon: no
icon was supplied. A "Made with tldraw" badge sits bottom-right throughout.

| Time       | What happens                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0.0–3.5s   | Three rectangles, two overlapping; select tool; style panel open for the selection (f015).                             |
| ~5.3s      | A click with the pin tool places a fixed-size **red pushpin**. The pin tool stays active (f022).                       |
| ~7.3s      | A selected pin shows only an **opacity** slider in the style panel (f030).                                             |
| ~8.3s      | One pin sits on the two rectangles' overlap; a second pin sits on the lone rectangle (f034).                           |
| ~9.3s      | Dragging the lone rectangle carries its pin: **a single-shape pin follows** (f038).                                    |
| ~10.3s     | Dragging the front rectangle moves the back one and the pin: **the overlap is attached** (f042).                       |
| ~11.0s     | The pin is dragged to empty canvas: **detached**, and the rectangles move independently again (f045).                  |
| 12.8–14.8s | A rectangle carrying a pin is dragged until the pin lands over another shape: **that shape is picked up** (f052–f060). |
| ~16.8s     | Two rectangles overlap with no pin: **they never attach** (f068).                                                      |

**What isn't shown:** any attach feedback. Nothing highlights on attach, and a pin looks
the same free or holding shapes, so attached and merely-overlapping shapes are
indistinguishable until you drag one.

## Task 4 — camera tool

The toolbar's first slot is a **camera icon**, so unlike the pin, this tool has one.

| Time       | What happens                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0–4.3s   | Canvas with stock chrome; the camera tool is selected (f018).                                                                                            |
| ~5.0s      | Dragging draws a **thin grey marquee**: no fill, no handles (f021).                                                                                      |
| ~5.5s      | On release the marquee vanishes. The tool returns to select; **nothing lands on the canvas** (f023).                                                     |
| ~6.8s      | The **browser's** download toast: **"Download renamed! Screenshot from tldraw examples.png"**, `Screenshot.png` struck through, an **Undo** link (f028). |
| 11.0–13.5s | A **Finder** window (not a file picker) previews the download, **`ss3.png`**: PNG, 9 KB, **506×465, 144×144 dpi**, canvas background included (f054).    |

The OCR pass misread the toast as an image landing on the canvas with tldraw's `Undo`
toast, and read `554x616` / `505x665` off the Finder sidebar; the preview itself says
506×465. The rename comes from the browser or an extension, not the app: the app's own
filename is `Screenshot.png`.

**What isn't shown:** any persistent shape, so there's nothing to adjust, re-export or
undo; any choice of format; any in-flight or failure state.

---

## The product conclusion that does follow

**The reference is vanilla tldraw chrome plus one tool.** Every readable label is tldraw's
own: `Page 1`, the zoom readout, `S M L XL`, the style panel, `Aa Aa Aa Aa`, the stock
toolbar. Outside Task 2's empty state there is essentially no bespoke interface.

**Likely origin (inference, not observed).** Tasks 3 and 4 look like tldraw's own examples
app, lightly modified: the "Made with tldraw" badge, the missing pin icon, the filename
"Screenshot from tldraw examples", and behaviour that matches the `pin-bindings` and
`screenshot-tool` examples closely.

**The brief and the reference disagree on Task 4.** The brief asks for a tool that
_creates a shape_ marking the area to export. The reference persists no shape: drag,
release, download, gone. Following the brief is also the better product, since a shape can
be adjusted and exported again. `docs/specs/task-4-camera.md` records the decision.

That is the opening. "Better" is not a cleverer attachment algorithm — it's everything
these clips never show:

- **A first-run.** Tasks 3 and 4 open on a bare canvas with no explanation of what the
  tool is or how to use it. Task 2 is the only one with an empty state at all.
- **Feedback in flight.** Loading a PDF, exporting an image: no progress or failure state
  appears in any clip.
- **Feedback on success.** A pin gives no sign it holds anything; the export's only
  confirmation is the browser's own toast.
- **Error paths.** Corrupt PDF, failed export, clipboard refused, a crop too small.
  Nothing here shows one.
- **A second go.** The crop vanishes on release, so a mis-drag means starting again and a
  second format means redrawing.

That is the brief's own emphasis: _"How you fill the gaps is the core of the exercise."_
Here the gaps are literally missing states.

## Open question for Rich

Answered by reading the stills: the pin and crop interactions are described above, and
the specs (`docs/specs/task-3-pin.md`, `docs/specs/task-4-camera.md`) design deliberately
beyond them. What remains open is only whether matching the reference's Task 4 (no
persistent shape) matters more to you than matching the brief's wording. The specs follow
the brief.

---

## Additional passes, and where this stops

After the first write-up I tried harder, using your full VLC scene-detection dumps (321
frames for task 3, 264 for task 4 — every detected scene change, not a 2 fps sample):

| Attempt                                                     | Yield                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Full-frame OCR of all 585 scene frames, brightened          | Nothing beyond the labels already listed                                                       |
| Rank all frames by pixel delta, OCR the biggest transitions | Confirmed the largest visual changes in **both** clips are the style panel opening and closing |
| Crop + upscale the toolbar region 3×                        | No new text; the pin tool's only glyph is the `?` fallback                                     |

At the time I concluded the interactions were unrecoverable without eyes. **That was
wrong:** reading the stills as images recovered all of it, as Tasks 3 and 4 above now
show. OCR's limit was real; it just wasn't the only tool.

One incidental finding still holds: across 585 frames the **biggest** visual changes are
a panel appearing and disappearing. The demos are thin — panel interaction, not dramatic
tool behaviour. That reinforces the product read above: the reference is a stock canvas,
and the room to beat it is in everything the clips omit.
