import { useLayoutEffect, useRef, useState } from "react"

import { Box, Text } from "@h2-fe/ui"

import { CROP_FRAME_LABEL_ATTR, FRAME_CORNER_PX } from "./consts"

/** Path for the four L-shaped corner marks of a `w`×`h` box. */
function cornerMarksPath(w: number, h: number, length: number): string {
  return [
    `M0,${length} V0 H${length}`,
    `M${w - length},0 H${w} V${length}`,
    `M${w},${h - length} V${h} H${w - length}`,
    `M${length},${h} H0 V${h - length}`
  ].join(" ")
}

interface CropFrameOutlineProps {
  w: number
  h: number
  /**
   * How many of the outline's own units make one screen pixel: `1 / zoom`
   * inside a shape (page space), 1 in screen space. The chrome stays the same
   * size on screen either way.
   */
  unit: number
  label: string
  /** tldraw's selection handles take the corners, and its blue box would clash with a brand label. */
  selected?: boolean
  /** Show the label even when the frame is narrower than it. */
  revealLabel?: boolean
}

/**
 * The look shared by a crop frame and the marquee that draws one: dashed
 * border, corner marks, and the size label below.
 */
export function CropFrameOutline({
  w,
  h,
  unit,
  label,
  selected = false,
  revealLabel = false
}: CropFrameOutlineProps) {
  const px = (screenPx: number) => screenPx * unit
  const corners = cornerMarksPath(w, h, Math.min(px(FRAME_CORNER_PX), w / 3, h / 3))
  const labelRef = useRef<HTMLParagraphElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  useLayoutEffect(() => {
    const element = labelRef.current
    if (!element) return undefined
    // offsetWidth ignores transforms, so this is the label's width on screen.
    const observer = new ResizeObserver(() => setLabelWidth(element.offsetWidth))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const isLabelShown = revealLabel || selected || w / unit >= labelWidth

  return (
    <>
      <svg width={w} height={h} overflow="visible" aria-hidden="true">
        <Box asChild stroke="bg" strokeWidth={px(3)} fill="none">
          <rect width={w} height={h} />
        </Box>
        <Box
          asChild
          stroke="brand.fg"
          strokeWidth={px(1.5)}
          strokeDasharray={`${px(6)} ${px(4)}`}
          fill="none"
        >
          <rect width={w} height={h} />
        </Box>
        <Box asChild visibility={selected ? "hidden" : undefined}>
          <g data-crop-corners="">
            <Box asChild stroke="bg" strokeWidth={px(6)} strokeLinecap="square" fill="none">
              <path d={corners} />
            </Box>
            <Box
              asChild
              stroke="brand.solid"
              strokeWidth={px(3)}
              strokeLinecap="square"
              fill="none"
            >
              <path d={corners} />
            </Box>
          </g>
        </Box>
      </svg>
      {/* Below the frame: the contextual toolbar takes the space above it. */}
      <Box
        position="absolute"
        left="0"
        top="100%"
        pt="2"
        transformOrigin="top left"
        transform={`scale(${unit})`}
        visibility={isLabelShown ? undefined : "hidden"}
        aria-hidden="true"
        {...{ [CROP_FRAME_LABEL_ATTR]: "" }}
      >
        <Text
          ref={labelRef}
          as="span"
          display="block"
          width="max-content"
          textStyle="xs"
          fontWeight="medium"
          fontVariantNumeric="tabular-nums"
          whiteSpace="nowrap"
          bg={selected ? "fg" : "brand.solid"}
          color={selected ? "bg" : "brand.contrast"}
          px="1.5"
          rounded="sm"
        >
          {label}
        </Text>
      </Box>
    </>
  )
}
