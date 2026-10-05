import { useLayoutEffect, useRef, useState } from "react"

import { Box, Text } from "@h2-fe/ui"

import { CROP_FRAME_LABEL_ATTR } from "../consts"

interface CropFrameLabelProps {
  label: string
  /** The frame's width in outline units. */
  w: number
  /** Outline units per screen pixel; see `CropFrameOutline`. */
  unit: number
  selected: boolean
  /** Show the label even when the frame is narrower than it. */
  revealLabel: boolean
}

/** The size label below a crop frame, hidden while the frame is narrower than it. */
export function CropFrameLabel({ label, w, unit, selected, revealLabel }: CropFrameLabelProps) {
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

  // Below the frame: the contextual toolbar takes the space above it.
  return (
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
  )
}
