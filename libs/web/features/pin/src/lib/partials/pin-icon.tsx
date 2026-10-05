import type { CSSProperties } from "react"

import { Pin } from "lucide-react"

import { Box } from "@h2-fe/ui"

interface PinIconProps {
  className?: string
  style?: CSSProperties
  "aria-label"?: string
}

/**
 * tldraw clones a JSX tool icon with `className`, `style` and `aria-label`
 * (`TldrawUiIcon`); `Box asChild` lands them, plus the size token, on the
 * lucide svg. 18px and stroke 1.5 match tldraw's own toolbar icons. Toolbar
 * buttons pass an empty label (the button carries the name), so the svg is
 * then decorative.
 */
export function PinIcon({ className, style, "aria-label": label }: PinIconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true }
  return (
    <Box asChild boxSize="4.5" flexShrink="0" className={className} style={style}>
      <Pin {...a11y} strokeWidth={1.5} />
    </Box>
  )
}
