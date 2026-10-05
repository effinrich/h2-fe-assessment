import { chakra } from "@h2-fe/ui"

export const Page = chakra("div", {
  base: { display: "flex", flexDirection: "column", minH: "100dvh" }
})

// The surface the document will land on, dotted like the canvas it becomes.
export const Canvas = chakra("main", {
  base: {
    alignItems: "center",
    bg: "bg.canvas",
    backgroundImage: "radial-gradient(circle, {colors.border.emphasized} 1px, transparent 1px)",
    backgroundSize: "20px 20px",
    display: "flex",
    flex: "1",
    flexDirection: "column",
    gap: "8",
    justifyContent: "center",
    p: { base: "4", md: "8" }
  }
})

export const DropCard = chakra("div", {
  base: {
    alignItems: "center",
    bg: "bg.panel",
    borderColor: "border.emphasized",
    borderRadius: "xl",
    borderStyle: "dashed",
    borderWidth: "2px",
    boxShadow: "sm",
    color: "fg",
    display: "flex",
    flexDirection: "column",
    gap: "6",
    maxW: "md",
    p: { base: "6", md: "10" },
    textAlign: "center",
    transitionDuration: "moderate",
    transitionProperty: "background, border-color",
    w: "full",
    _dragging: { bg: "brand.subtle", borderColor: "brand.solid" }
  }
})

export const FileTile = chakra("span", {
  base: {
    alignItems: "center",
    bg: "bg.muted",
    borderRadius: "lg",
    color: "fg.muted",
    display: "inline-flex",
    h: "12",
    justifyContent: "center",
    w: "12"
  }
})
