# Reference demos — what they actually show

The brief calls the videos "competitors' references" and asks us to deliver something
better. This is what they contain, extracted rather than assumed.

## Method, and its limits

I cannot view video. These notes come from `ffmpeg` stills at 2 fps plus `tesseract` OCR,
printing only when the text changed.

**No audio.** Checked all three files with `ffprobe`: they carry a single `h264` video
stream and nothing else. There is no narration, so there is nothing to transcribe. Worth
knowing before anyone spends time on it.

**The treatment matters.** The UI is dark-mode and tesseract wants dark text on light.
Four passes compared on the noisiest frames:

| Treatment | Result |
|---|---|
| as-is, 1.5× | noisy chrome, most labels lost |
| `negate`, 1.5× | no better than as-is |
| **`eq=brightness=0.25:contrast=1.5`, 1.5×** | **best** — recovered the style panel and a toast |
| `format=gray,negate,eq=contrast=1.6`, 2× | comparable to bright, not better |

The brightness lift is what made the difference; inverting did not, which was my
prediction and it was wrong.

**The limit that no filter fixes.** OCR reads words. The pin and the camera are custom
tools, and from the frames they appear to be **icon-only** — no labels to read. Nothing on
the brightening axis reaches them. What follows is what is readable, and what definitively
is not.

| Clip | Length | Frames sampled |
|---|---|---|
| task-2.mp4 | 5.6s | 11 |
| task-3.mp4 | 20.5s | 41 |
| task-4.mp4 | 14.2s | 28 |

---

## Task 2 — display a PDF

| Time | What happens |
|---|---|
| 0.0–1.0s | Empty state, two controls: **"Open PDF"** and **"Use an example"**. |
| 1.5–2.0s | macOS file picker on **Downloads**, selecting **`Dummy (1).pdf`**. |
| 2.5s+ | The PDF renders in the canvas, showing the exercise README's own text. |

Controls while viewing: **`S` `M` `L` `XL`**, **`Export PDF`**, a **`Page 1`** indicator.

## Task 3 — pin tool

Persistent style panel, now readable (this is tldraw's stock panel, not bespoke UI):

```
Page 1   ·   S M L XL   ·   Aa Aa Aa Aa   ·   < >|< >|   ·   Shape   ·   100%
```

| Time | What happens |
|---|---|
| 0.0–0.5s | Canvas with one shape; stock chrome. |
| 1.0–3.5s | The panel above is open; **`Shape`** is the active tool/menu entry. |
| 4.0–20.0s | Shapes are moved around the canvas; the panel opens and closes. |

**Not readable:** how the pin attaches, how the link between two shapes is drawn, what
feedback a successful bind gives, and what happens on the next move. Icon-only, and the
substance of the task.

## Task 4 — camera tool

| Time | What happens |
|---|---|
| 0.0–5.5s | Canvas with stock chrome. |
| 6.0–8.5s | An image lands on the canvas: **`Screenshot from tldraw examples.png`**, with tldraw's **`Undo`** toast beside it. |
| 9.0–10.5s | The image sits on the canvas. |
| 11.0–13.5s | macOS file picker on **Downloads** (Finder shows image dimensions, `554x616` / `505x665`). |

**Not readable:** the crop interaction — how the region is drawn, what handles exist, what
the export produces, where the file lands. Also icon-only.

---

## The product conclusion that does follow

**The reference is vanilla tldraw chrome plus one tool.** Every readable label is tldraw's
own: `Page 1`, the zoom readout, `S M L XL`, the style panel, `Aa Aa Aa Aa`, the stock
toolbar. Outside Task 2's empty state there is essentially no bespoke interface.

That is the opening. "Better" is not a cleverer attachment algorithm — it's everything
these clips never show:

- **A first-run.** Tasks 3 and 4 open on a bare canvas with no explanation of what the
  tool is or how to use it. Task 2 is the only one with an empty state at all.
- **Feedback in flight.** Loading a PDF, exporting an image: no progress or failure state
  appears in any clip.
- **Error paths.** Corrupt PDF, failed export, a pin dropped on one shape instead of two,
  a crop too small. Nothing here shows one.
- **The second half of Task 4.** "Data back to them, in formats familiar and universal" —
  the clip stops before revealing the download.

That is the brief's own emphasis: *"How you fill the gaps is the core of the exercise."*
Here the gaps are literally missing states.

## Open question for Rich

Tasks 3 and 4's interactions are unread and unobtainable by any image filter, because the
tools are icon-only. Either describe what the pin and crop do in the clips, or we design
them deliberately and record that as the decision — defensible, since the brief invites
"something better" rather than a copy.

---

## Additional passes, and where this stops

After the first write-up I tried harder, using your full VLC scene-detection dumps (321
frames for task 3, 264 for task 4 — every detected scene change, not a 2 fps sample):

| Attempt | Yield |
|---|---|
| Full-frame OCR of all 585 scene frames, brightened | Nothing beyond the labels already listed |
| Rank all frames by pixel delta, OCR the biggest transitions | Confirmed the largest visual changes in **both** clips are the style panel opening and closing |
| Crop + upscale the toolbar region 3× | No new text; the toolbar is icon-only |

**The conclusion is now firm, and it is a limit rather than a gap in effort.** Every
readable pixel in these clips is tldraw's stock chrome. There is no text anywhere in the
pin or camera interactions to recover, because the tools are icon-only and their behaviour
is spatial. No filter, crop, resolution or frame rate changes that — it needs eyes, and I
don't have them.

One incidental finding worth keeping: across 585 frames the **biggest** visual changes are
a panel appearing and disappearing. The demos are thin — panel interaction, not dramatic
tool behaviour. That reinforces the product read above: the reference is a stock canvas,
and the room to beat it is in everything the clips omit.
