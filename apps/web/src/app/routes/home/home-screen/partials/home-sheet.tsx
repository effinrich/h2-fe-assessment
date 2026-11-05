import { chakra } from "@h2-fe/ui"

/**
 * The sheet the tool works on, at a glance: a printed page with a crop frame
 * drawn around one paragraph and a word underlined in pen. It is the product
 * in one picture, and it is what the drag state lifts.
 */
const Sheet = chakra("div", {
  base: {
    position: "relative",
    aspectRatio: "210 / 297",
    bg: "paper.bg",
    borderColor: "paper.rule",
    borderRadius: "xs",
    borderWidth: "1px",
    boxShadow:
      "0 1px 1px rgb(28 37 33 / 0.05), 0 10px 20px -10px rgb(28 37 33 / 0.26), 0 30px 52px -24px rgb(28 37 33 / 0.32)",
    justifySelf: "end",
    overflow: "hidden",
    rotate: { base: "0deg", md: "-1deg" },
    transitionDuration: "moderate",
    transitionProperty: "box-shadow, border-color, rotate",
    w: { base: "full", md: "15rem" },

    // The printed page: a ruled margin, a title, a standfirst and two
    // paragraphs. The crop frame sits around the first one.
    "& [data-mark='margin']": {
      position: "absolute",
      bg: "paper.rule",
      h: "84%",
      left: "9%",
      top: "8%",
      w: "1px"
    },
    "& [data-mark='title']": {
      position: "absolute",
      bg: "paper.text",
      borderRadius: "1px",
      h: "7px",
      left: "15%",
      top: "8.5%",
      w: "50%"
    },
    "& [data-mark='subtitle']": {
      position: "absolute",
      bg: "paper.body",
      borderRadius: "1px",
      h: "4px",
      left: "15%",
      top: "15.5%",
      w: "32%"
    },
    "& [data-mark^='line']": {
      position: "absolute",
      bg: "paper.body",
      borderRadius: "1px",
      h: "4px",
      left: "15%"
    },
    "& [data-mark='line-1']": { top: "24%", w: "74%" },
    "& [data-mark='line-2']": { top: "29.5%", w: "68%" },
    "& [data-mark='line-3']": { top: "35%", w: "76%" },
    "& [data-mark='line-4']": { top: "40.5%", w: "52%" },
    "& [data-mark='line-5']": { top: "54%", w: "71%" },
    "& [data-mark='line-6']": { top: "59.5%", w: "73%" },
    "& [data-mark='line-7']": { top: "65%", w: "67%" },
    "& [data-mark='line-8']": { top: "70.5%", w: "74%" },
    "& [data-mark='line-9']": { top: "76%", w: "44%" },
    "& [data-mark='line-10']": { top: "81%", w: "56%" },

    // The crop frame: the tool's own vocabulary, drawn on the page.
    "& [data-mark='crop']": {
      position: "absolute",
      borderColor: "ink.solid",
      borderRadius: "2px",
      borderStyle: "dashed",
      borderWidth: "1.5px",
      inset: "20% 7% 56% 11%"
    },

    // The pen: one word washed in the same ink, at a wash.
    "& [data-mark='mark']": {
      position: "absolute",
      bg: "paper.mark",
      borderRadius: "1px",
      h: "8px",
      left: "30%",
      top: "28.8%",
      w: "26%"
    },

    "&[data-dragging]": {
      borderColor: "ink.solid",
      boxShadow:
        "0 1px 1px rgb(28 37 33 / 0.05), 0 18px 34px -12px rgb(28 37 33 / 0.3), 0 40px 64px -28px rgb(28 37 33 / 0.38)",
      rotate: "0deg"
    }
  }
})

export function HomeSheet({ dragging = false }: { dragging?: boolean }) {
  return (
    <Sheet aria-hidden data-dragging={dragging || undefined}>
      <div data-mark="margin" />
      <div data-mark="title" />
      <div data-mark="subtitle" />
      <div data-mark="line-1" />
      <div data-mark="line-2" />
      <div data-mark="line-3" />
      <div data-mark="line-4" />
      <div data-mark="line-5" />
      <div data-mark="line-6" />
      <div data-mark="line-7" />
      <div data-mark="line-8" />
      <div data-mark="line-9" />
      <div data-mark="line-10" />
      <div data-mark="crop" />
      <div data-mark="mark" />
    </Sheet>
  )
}
