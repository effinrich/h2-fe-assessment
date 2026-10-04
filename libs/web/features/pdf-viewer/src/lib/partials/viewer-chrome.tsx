import { chakra } from "@h2-fe/ui"

// chakra() so viewer chrome we own participates in the app system (tokens,
// color mode). DefaultToolbar drops className, so the toolbar slot is a
// contents wrapper — it does not restyle tldraw's internals or map --tl-*
// variables (no existing plan for that).
export const ViewerRoot = chakra("div", {
  base: {
    position: "absolute",
    inset: "0"
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

export const PageOverlayCard = chakra("div", {
  base: {
    alignItems: "center",
    bg: "bg.panel",
    color: "fg",
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
    position: "absolute"
  }
})

export const ToolbarSlot = chakra("div", {
  base: {
    display: "contents"
  }
})
