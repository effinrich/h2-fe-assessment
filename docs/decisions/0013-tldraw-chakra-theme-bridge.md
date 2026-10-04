# 0013 — tldraw and Chakra stay two styling systems

- Status: accepted
- Date: 2026-10-04

## Context

The viewer already uses Chakra for chrome we own (ViewerTopBar, discard Modal,
FileUpload home, overlay cards) and stock tldraw for the canvas tools, style
panel, and undo. tldraw drops `className` on `DefaultToolbar`, so wrapping that
chrome in `chakra()` does not theme it. Chakra props cannot be passed into
tldraw internals. Shape StyleProps are persisted fill/stroke/font data, not a
place to encode design tokens.

## Decision

**Keep both UIs. Bridge with scoped CSS custom properties.**

- Chakra styles app shell, panels, dialogs, and our toolbars.
- tldraw CSS variables (the `--tl-color-*` set on `.tl-theme__light` /
  `.tl-theme__dark` in `tldraw@5.5.0` `tldraw.css`) theme the canvas UI.
- A wrapper class (`h2-canvas-theme`) exports semantic `--app-*` tokens from
  Chakra's `--chakra-colors-*` (prefix from `cssVarsPrefix = "chakra"`) and
  maps them onto `--tl-color-*` **after** `tldraw/tldraw.css`.
- Color mode: `useColorMode` from `@h2-fe/ui` (next-themes, not Chakra v2
  `useColorModeValue`). The app mode is written onto the wrapper as
  `data-color-mode` and pushed into tldraw via `editor.setColorMode` /
  `user.updateUserPreferences` (`@tldraw/editor` `index.d.mts:1361-1366`). The
  `Tldraw` `colorScheme` prop is initial only: changing it recreates the
  `Editor` (`TldrawEditor.mjs` constructor effect deps).

Not chosen: `hideUi` plus a full custom toolbar; wrapping `DefaultToolbar` in
`chakra()`; new StyleProps; coupling rules to raw palette steps
(`--chakra-colors-blue-600`).

## Consequences

- Light and dark use the same mapping; Chakra semantic tokens already flip.
- tldraw's own theme menu can still change canvas mode until the next app
  sync. The app button is the supported control.
- Pin and camera stay out of this decision; they do not import the viewer.
