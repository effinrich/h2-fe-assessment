/** A number input without the browser's spinner arrows. */
export const NO_SPINNER_CSS = {
  MozAppearance: "textfield",
  "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
    appearance: "none",
    margin: 0
  }
} as const
