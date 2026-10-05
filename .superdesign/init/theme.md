# Theme

Superdesign init: design tokens and global styles.

# Part 1: Token summary

The design system is **Chakra UI v3** (`@chakra-ui/react` 3.37) built with `createSystem(defaultConfig, config)` in `libs/shared/ui/src/lib/theme/system.ts`. The custom config adds **one palette (`brand`)**, a few contrast fixes, and sets `brand` as the global `colorPalette`. **Everything not overridden uses Chakra's defaults**: fonts, font sizes, spacing, radii, shadows, breakpoints, and the gray/red/etc. scales.

Colour mode is class-based: `next-themes` sets `.light` / `.dark` on `<html>`, and Chakra's `_light` / `_dark` conditions follow it. Chakra CSS variables use the default prefix: `--chakra-colors-*`, `--chakra-radii-*`, etc.

## `brand` palette (tokens)

A desaturated green-grey. 600 and darker are near-black greens; 500 and lighter are sage greys.

| Step | Hex       |
| ---- | --------- |
| 50   | `#f4f6f4` |
| 100  | `#e6ebe8` |
| 200  | `#c9d2cc` |
| 300  | `#a8b5ae` |
| 400  | `#87968e` |
| 500  | `#68746e` |
| 600  | `#2a3530` |
| 700  | `#24302b` |
| 800  | `#1c2521` |
| 900  | `#151c19` |
| 950  | `#0c110f` |

## `brand` semantic tokens (light / dark)

These are the role keys Chakra recipes read through `colorPalette`. Because `html { colorPalette: "brand" }` is global, every Chakra component (solid buttons, focus rings, checkboxes, ...) uses these unless given another `colorPalette`.

| Token              | Light               | Dark                |
| ------------------ | ------------------- | ------------------- |
| `brand.solid`      | brand.600 `#2a3530` | brand.600 `#2a3530` |
| `brand.contrast`   | `white`             | `white`             |
| `brand.fg`         | brand.700 `#24302b` | brand.300 `#a8b5ae` |
| `brand.subtle`     | brand.100 `#e6ebe8` | brand.900 `#151c19` |
| `brand.muted`      | brand.200 `#c9d2cc` | brand.800 `#1c2521` |
| `brand.emphasized` | brand.300 `#a8b5ae` | brand.700 `#24302b` |
| `brand.focusRing`  | brand.500 `#68746e` | brand.400 `#87968e` |
| `brand.border`     | brand.500 `#68746e` | brand.400 `#87968e` |

## Other overrides (WCAG AA fixes)

| Token                                                                   | Value                                            | Chakra default it replaces |
| ----------------------------------------------------------------------- | ------------------------------------------------ | -------------------------- |
| `fg.error`                                                              | light red.600 `#dc2626` / dark red.400 `#f87171` | light red.500              |
| `orange.solid`, `green.solid`, `teal.solid`, `cyan.solid`, `pink.solid` | the `.700` shade of each palette                 | `.600`                     |

## Chakra default semantic tokens the UI relies on

Not overridden; listed so a design tool can reproduce the surfaces. Gray scale is Chakra's: 50 `#fafafa`, 100 `#f4f4f5`, 200 `#e4e4e7`, 300 `#d4d4d8`, 400 `#a1a1aa`, 500 `#71717a`, 600 `#52525b`, 700 `#3f3f46`, 800 `#27272a`, 900 `#18181b`, 950 `#111111`.

| Token      | Light              | Dark               | Used for                                 |
| ---------- | ------------------ | ------------------ | ---------------------------------------- |
| `bg`       | `#ffffff`          | `#000000`          | page and canvas background               |
| `bg.panel` | `#ffffff`          | gray.950 `#111111` | home card, viewer panels, top bar, hints |
| `bg.muted` | gray.100 `#f4f4f5` | gray.900 `#18181b` | tldraw low surfaces                      |
| `fg`       | `#000000`          | gray.50 `#fafafa`  | body text                                |
| `fg.muted` | gray.600 `#52525b` | gray.400 `#a1a1aa` | secondary text ("Nothing inside")        |
| `border`   | gray.200 `#e4e4e7` | gray.800 `#27272a` | card borders, tldraw dividers            |

## Typography

- **No custom fonts.** Chakra default stacks:
  - `heading` / `body`: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`.
  - `mono`: `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`.
  - Inter is **not loaded** (no font link in `index.html`, no `@font-face`), so in practice text renders in the platform system sans unless Inter is installed locally.
- Sizes in use: `Heading size="lg"` (card titles), default `Text` (md), `fontSize="sm"` / `textStyle="sm"` (top bar, hints), `textStyle="xs"` (crop size label, empty-frame hint), `fontSize="2xs"` semibold (pin count badge).
- tldraw's own UI keeps tldraw's font settings.

## Radii, shadows, layering (Chakra defaults)

- Radii: `lg` 0.5rem (home card, viewer panels, crop-toolbar focus ring), `md` 0.375rem (top bar card), `sm` 0.25rem (crop size label), `full` (hint pills, pin badge, pin rings). Scale: `xs` 0.125rem, `sm` 0.25rem, `md` 0.375rem, `lg` 0.5rem, `xl` 0.75rem, `2xl` 1rem, `3xl` 1.5rem, `full` 9999px.
- Shadows: `lg` on cards/panels (light `0 8px 16px gray.900/10, 0 0 1px gray.900/30`), `md` on the top bar and hint pills (light `0 4px 8px gray.900/10, 0 0 1px gray.900/30`). Dark mode shadows use `black/64` plus a faint inset gray.300 ring.
- Spacing: Chakra's 4px scale (`p="4"` = 1rem). Cards use `p={{ base: "6", md: "8" }}` and `gap="6"`.
- Layers: `ViewerTopBar` is `zIndex 400`; tldraw panels sit at `--tl-layer-panels` (300).

## tldraw bridge (`libs/web/features/pdf-viewer/src/lib/tldraw-theme.css`)

`ViewerRoot` carries the class `h2-canvas-theme`. On it, `--app-*` aliases point at Chakra semantic variables, and tldraw's `--tl-color-*` variables are re-pointed at the aliases inside both `.tl-theme__light` and `.tl-theme__dark`. Result: tldraw's canvas and stock UI follow the app tokens and colour mode.

| `--app-*`               | Chakra variable                    |
| ----------------------- | ---------------------------------- |
| `--app-accent`          | `--chakra-colors-brand-solid`      |
| `--app-accent-contrast` | `--chakra-colors-brand-contrast`   |
| `--app-surface`         | `--chakra-colors-bg`               |
| `--app-panel`           | `--chakra-colors-bg-panel`         |
| `--app-muted-surface`   | `--chakra-colors-bg-muted`         |
| `--app-border`          | `--chakra-colors-border`           |
| `--app-text`            | `--chakra-colors-fg`               |
| `--app-text-muted`      | `--chakra-colors-fg-muted`         |
| `--app-focus`           | `--chakra-colors-brand-focus-ring` |

| `--tl-*`                                                    | `--app-*`               |
| ----------------------------------------------------------- | ----------------------- |
| `--tl-color-background`                                     | `--app-surface`         |
| `--tl-color-panel`                                          | `--app-panel`           |
| `--tl-color-low`                                            | `--app-muted-surface`   |
| `--tl-color-low-border`, `--tl-color-divider`               | `--app-border`          |
| `--tl-color-text`, `--tl-color-text-0`, `--tl-color-text-1` | `--app-text`            |
| `--tl-color-text-3`                                         | `--app-text-muted`      |
| `--tl-color-selected`, `--tl-color-primary`                 | `--app-accent`          |
| `--tl-color-selected-contrast`                              | `--app-accent-contrast` |
| `--tl-color-focus`                                          | `--app-focus`           |

It also pushes tldraw's top-right column (style panel) down by `padding-top: 5rem` so it clears the floating top bar. The tldraw editor's colour mode is synced to the app's with `editor.setColorMode` after mount. `tldraw.css` is unlayered, so it beats Chakra's layered recipes; components that restyle tldraw buttons (the crop toolbar) repeat the selector (`&&&`) to win.

## Globals (`apps/web/src/index.css`, `apps/web/index.html`)

- `@layer reset, base, tokens, recipes, utilities;` declares Chakra's cascade-layer order up front.
- `html, body, #root { height: 100%; margin: 0; }`.
- `index.html`: title "Annotate PDF", `lang="en"`, responsive viewport meta, `/favicon.ico`, a single `#root` div. No font links, no inline styles.
- The app's `globalCss` adds only `html { colorPalette: "brand" }`, replacing Chakra's default `colorPalette: "gray"`. The rest of Chakra's default global CSS stays: CSS reset, `html { color: fg; bg: bg; lineHeight: 1.5 }`, placeholder text `fg.muted/80`, and text selection `colorPalette.emphasized/80` (so brand.emphasized).

---

# Part 2: Raw sources

## `libs/shared/ui/src/lib/theme/system.ts`

`libs/shared/ui/src/lib/theme/system.ts` (54 lines)

```ts
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// A custom palette needs both the 50–950 scale (tokens) and the role keys
// (semantic tokens) before `colorPalette="brand"` resolves on components.
const config = defineConfig({
  globalCss: {
    html: { colorPalette: "brand" }
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f4f6f4" },
          100: { value: "#e6ebe8" },
          200: { value: "#c9d2cc" },
          300: { value: "#a8b5ae" },
          400: { value: "#87968e" },
          500: { value: "#68746e" },
          600: { value: "#2a3530" },
          700: { value: "#24302b" },
          800: { value: "#1c2521" },
          900: { value: "#151c19" },
          950: { value: "#0c110f" }
        }
      }
    },
    semanticTokens: {
      colors: {
        brand: {
          contrast: { value: { _light: "white", _dark: "white" } },
          fg: { value: { _light: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          subtle: { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          muted: { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
          emphasized: { value: { _light: "{colors.brand.300}", _dark: "{colors.brand.700}" } },
          solid: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.600}" } },
          focusRing: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
          border: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } }
        },
        // WCAG AA (4.5:1): Chakra's defaults put white text on the 600 shade of
        // these palettes and red.500 error text on white, both below the ratio.
        fg: {
          error: { value: { _light: "{colors.red.600}", _dark: "{colors.red.400}" } }
        },
        orange: { solid: { value: "{colors.orange.700}" } },
        green: { solid: { value: "{colors.green.700}" } },
        teal: { solid: { value: "{colors.teal.700}" } },
        cyan: { solid: { value: "{colors.cyan.700}" } },
        pink: { solid: { value: "{colors.pink.700}" } }
      }
    }
  }
})

export const system = createSystem(defaultConfig, config)
```

## `libs/web/features/pdf-viewer/src/lib/tldraw-theme.css`

`libs/web/features/pdf-viewer/src/lib/tldraw-theme.css` (41 lines)

```css
/* Bridge Chakra semantic tokens onto tldraw's theme variables.
   Names from tldraw@5.5.0 tldraw.css (.tl-theme__light / .tl-theme__dark,
   --tl-color-*) and Chakra v3 cssVarsPrefix "chakra" (--chakra-colors-*).
   Import after tldraw/tldraw.css. Do not wrap tldraw chrome in chakra(). */

.h2-canvas-theme {
  --app-accent: var(--chakra-colors-brand-solid);
  --app-accent-contrast: var(--chakra-colors-brand-contrast);
  --app-surface: var(--chakra-colors-bg);
  --app-panel: var(--chakra-colors-bg-panel);
  --app-muted-surface: var(--chakra-colors-bg-muted);
  --app-border: var(--chakra-colors-border);
  --app-text: var(--chakra-colors-fg);
  --app-text-muted: var(--chakra-colors-fg-muted);
  --app-focus: var(--chakra-colors-brand-focus-ring);
}

.h2-canvas-theme :is(.tl-theme__light, .tl-theme__dark) {
  --tl-color-background: var(--app-surface);
  --tl-color-panel: var(--app-panel);
  --tl-color-low: var(--app-muted-surface);
  --tl-color-low-border: var(--app-border);
  --tl-color-divider: var(--app-border);
  --tl-color-text: var(--app-text);
  --tl-color-text-0: var(--app-text);
  --tl-color-text-1: var(--app-text);
  --tl-color-text-3: var(--app-text-muted);
  --tl-color-selected: var(--app-accent);
  --tl-color-selected-contrast: var(--app-accent-contrast);
  --tl-color-focus: var(--app-focus);
  --tl-color-primary: var(--app-accent);
}

/* Stock tldraw parks the style panel in the top-right (tldraw.css
   .tlui-style-panel__wrapper { margin-top: 4px } / :only-child { 8px },
   z-index: var(--tl-layer-panels) = 300). ViewerTopBar is a sibling at
   z-index 400, so "Open another document" paints on the panel. Drop the
   whole right column below one chrome row: p=4 + md control + gap. */
.h2-canvas-theme .tlui-layout__top__right {
  padding-top: 5rem;
}
```

## `apps/web/src/index.css`

`apps/web/src/index.css` (8 lines)

```css
@layer reset, base, tokens, recipes, utilities;

html,
body,
#root {
  height: 100%;
  margin: 0;
}
```

## `apps/web/index.html`

`apps/web/index.html` (15 lines)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Annotate PDF</title>
    <base href="/" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
