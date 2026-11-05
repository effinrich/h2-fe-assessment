import { chakra } from "@h2-fe/ui"

export const Page = chakra("div", {
  base: { display: "flex", flexDirection: "column", minH: "100dvh" }
})

// The desk: the surface the document will land on, dotted like the canvas it
// becomes. The sheet on it is the only bright object.
export const Canvas = chakra("main", {
  base: {
    alignItems: "center",
    bg: "bg.canvas",
    backgroundImage: "radial-gradient(circle, {colors.desk.dot} 1px, transparent 1px)",
    backgroundSize: "20px 20px",
    display: "flex",
    flex: "1",
    flexDirection: "column",
    justifyContent: "center",
    p: { base: "4", md: "8" }
  }
})
