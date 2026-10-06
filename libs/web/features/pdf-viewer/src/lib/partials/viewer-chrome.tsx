import { chakra } from "@h2-fe/ui"

// chakra() so viewer chrome we own participates in the app system (tokens,
// color mode). DefaultToolbar drops className, so the toolbar slot is a
// contents wrapper — tldraw internals are themed via --tl-* on this root
// (tldraw-theme.css), not by wrapping stock chrome in chakra().
export const ViewerRoot = chakra("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    h: "100dvh",
    inset: "0",
    minW: "0",
    position: "absolute",
    w: "full"
  }
})

// Everything positioned in viewport coordinates (tldraw, covers, page
// overlays) is relative to this box, below the header.
export const ViewerCanvas = chakra("div", {
  base: {
    flex: "1",
    minH: "0",
    position: "relative"
  }
})

export const ViewerCover = chakra("div", {
  base: {
    alignItems: "center",
    display: "flex",
    inset: "0",
    justifyContent: "center",
    pointerEvents: "auto",
    position: "absolute"
  }
})

export const ViewerPanel = chakra("div", {
  base: {
    bg: "bg.panel",
    borderColor: "border",
    borderRadius: "lg",
    borderWidth: "1px",
    boxShadow: "lg",
    color: "fg",
    maxW: "sm",
    p: { base: "6", md: "8" },
    pointerEvents: "auto"
  }
})

export const ToolbarSlot = chakra("div", {
  base: {
    display: "contents"
  }
})
