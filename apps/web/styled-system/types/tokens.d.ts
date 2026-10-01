export type AnimationToken = "bounce" | "ping" | "pulse" | "spin"

export type AspectRatioToken = "golden" | "landscape" | "portrait" | "square" | "ultrawide" | "video" | "wide"

export type BlurToken = "2xl" | "3xl" | "lg" | "md" | "sm" | "xl" | "xs"

export type BorderToken = "none"

export type BreakpointToken = "2xl" | "lg" | "md" | "sm" | "xl"

export type ColorToken = "black" | "black.a1" | "black.a10" | "black.a11" | "black.a12" | "black.a2" | "black.a3" | "black.a4" | "black.a5" | "black.a6" | "black.a7" | "black.a8" | "black.a9" | "border" | "colorPalette" | "colorPalette.1" | "colorPalette.10" | "colorPalette.11" | "colorPalette.12" | "colorPalette.2" | "colorPalette.3" | "colorPalette.4" | "colorPalette.5" | "colorPalette.6" | "colorPalette.7" | "colorPalette.8" | "colorPalette.9" | "colorPalette.a1" | "colorPalette.a10" | "colorPalette.a11" | "colorPalette.a12" | "colorPalette.a2" | "colorPalette.a3" | "colorPalette.a4" | "colorPalette.a5" | "colorPalette.a6" | "colorPalette.a7" | "colorPalette.a8" | "colorPalette.a9" | "colorPalette.active" | "colorPalette.bg" | "colorPalette.bg.active" | "colorPalette.bg.hover" | "colorPalette.border" | "colorPalette.border.hover" | "colorPalette.default" | "colorPalette.fg" | "colorPalette.hover" | "colorPalette.muted" | "colorPalette.outline.bg.active" | "colorPalette.outline.bg.hover" | "colorPalette.outline.border" | "colorPalette.outline.fg" | "colorPalette.plain.bg.active" | "colorPalette.plain.bg.hover" | "colorPalette.plain.fg" | "colorPalette.solid.bg" | "colorPalette.solid.bg.hover" | "colorPalette.solid.fg" | "colorPalette.subtle" | "colorPalette.subtle.bg" | "colorPalette.subtle.bg.active" | "colorPalette.subtle.bg.hover" | "colorPalette.subtle.fg" | "colorPalette.surface.bg" | "colorPalette.surface.bg.active" | "colorPalette.surface.bg.hover" | "colorPalette.surface.border" | "colorPalette.surface.border.hover" | "colorPalette.surface.fg" | "error" | "fg.default" | "fg.muted" | "fg.subtle" | "gray.1" | "gray.10" | "gray.11" | "gray.12" | "gray.2" | "gray.3" | "gray.4" | "gray.5" | "gray.6" | "gray.7" | "gray.8" | "gray.9" | "gray.a1" | "gray.a10" | "gray.a11" | "gray.a12" | "gray.a2" | "gray.a3" | "gray.a4" | "gray.a5" | "gray.a6" | "gray.a7" | "gray.a8" | "gray.a9" | "gray.outline.bg.active" | "gray.outline.bg.hover" | "gray.outline.border" | "gray.outline.fg" | "gray.plain.bg.active" | "gray.plain.bg.hover" | "gray.plain.fg" | "gray.solid.bg" | "gray.solid.bg.hover" | "gray.solid.fg" | "gray.subtle.bg" | "gray.subtle.bg.active" | "gray.subtle.bg.hover" | "gray.subtle.fg" | "gray.surface.bg" | "gray.surface.bg.active" | "gray.surface.bg.hover" | "gray.surface.border" | "gray.surface.border.hover" | "gray.surface.fg" | "green.1" | "green.10" | "green.11" | "green.12" | "green.2" | "green.3" | "green.4" | "green.5" | "green.6" | "green.7" | "green.8" | "green.9" | "green.a1" | "green.a10" | "green.a11" | "green.a12" | "green.a2" | "green.a3" | "green.a4" | "green.a5" | "green.a6" | "green.a7" | "green.a8" | "green.a9" | "green.outline.bg.active" | "green.outline.bg.hover" | "green.outline.border" | "green.outline.fg" | "green.plain.bg.active" | "green.plain.bg.hover" | "green.plain.fg" | "green.solid.bg" | "green.solid.bg.hover" | "green.solid.fg" | "green.subtle.bg" | "green.subtle.bg.active" | "green.subtle.bg.hover" | "green.subtle.fg" | "green.surface.bg" | "green.surface.bg.active" | "green.surface.border" | "green.surface.border.hover" | "green.surface.fg" | "indigo.1" | "indigo.10" | "indigo.11" | "indigo.12" | "indigo.2" | "indigo.3" | "indigo.4" | "indigo.5" | "indigo.6" | "indigo.7" | "indigo.8" | "indigo.9" | "indigo.a1" | "indigo.a10" | "indigo.a11" | "indigo.a12" | "indigo.a2" | "indigo.a3" | "indigo.a4" | "indigo.a5" | "indigo.a6" | "indigo.a7" | "indigo.a8" | "indigo.a9" | "indigo.outline.bg.active" | "indigo.outline.bg.hover" | "indigo.outline.border" | "indigo.outline.fg" | "indigo.plain.bg.active" | "indigo.plain.bg.hover" | "indigo.plain.fg" | "indigo.solid.bg" | "indigo.solid.bg.hover" | "indigo.solid.fg" | "indigo.subtle.bg" | "indigo.subtle.bg.active" | "indigo.subtle.bg.hover" | "indigo.subtle.fg" | "indigo.surface.bg" | "indigo.surface.bg.active" | "indigo.surface.border" | "indigo.surface.border.hover" | "indigo.surface.fg" | "red.1" | "red.10" | "red.11" | "red.12" | "red.2" | "red.3" | "red.4" | "red.5" | "red.6" | "red.7" | "red.8" | "red.9" | "red.a1" | "red.a10" | "red.a11" | "red.a12" | "red.a2" | "red.a3" | "red.a4" | "red.a5" | "red.a6" | "red.a7" | "red.a8" | "red.a9" | "red.outline.bg.active" | "red.outline.bg.hover" | "red.outline.border" | "red.outline.fg" | "red.plain.bg.active" | "red.plain.bg.hover" | "red.plain.fg" | "red.solid.bg" | "red.solid.bg.hover" | "red.solid.fg" | "red.subtle.bg" | "red.subtle.bg.active" | "red.subtle.bg.hover" | "red.subtle.fg" | "red.surface.bg" | "red.surface.bg.active" | "red.surface.border" | "red.surface.border.hover" | "red.surface.fg" | "white" | "white.a1" | "white.a10" | "white.a11" | "white.a12" | "white.a2" | "white.a3" | "white.a4" | "white.a5" | "white.a6" | "white.a7" | "white.a8" | "white.a9"

export type DurationToken = "fast" | "faster" | "fastest" | "normal" | "slow" | "slower" | "slowest"

export type EasingToken = "default" | "in" | "in-out" | "linear" | "out"

export type FontSizeToken = "2xl" | "2xs" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl" | "lg" | "md" | "sm" | "xl" | "xs"

export type FontWeightToken = "black" | "bold" | "extrabold" | "extralight" | "light" | "medium" | "normal" | "semibold" | "thin"

export type FontToken = "mono" | "sans" | "serif"

export type LetterSpacingToken = "normal" | "tight" | "tighter" | "wide" | "wider" | "widest"

export type LineHeightToken = "loose" | "none" | "normal" | "relaxed" | "snug" | "tight"

export type RadiusToken = "2xl" | "3xl" | "4xl" | "full" | "l1" | "l2" | "l3" | "lg" | "md" | "sm" | "xl" | "xs"

export type ShadowToken = "2xl" | "2xs" | "inner" | "inset" | "inset-2xs" | "inset-sm" | "inset-xs" | "lg" | "md" | "sm" | "xl" | "xs"

export type SizeToken = "0" | "0.5" | "1" | "1.5" | "10" | "11" | "12" | "14" | "16" | "2" | "2.5" | "20" | "24" | "28" | "2xl" | "3" | "3.5" | "32" | "36" | "3xl" | "4" | "4.5" | "40" | "44" | "48" | "4xl" | "5" | "5.5" | "52" | "56" | "5xl" | "6" | "60" | "64" | "6xl" | "7" | "72" | "7xl" | "8" | "80" | "8xl" | "9" | "96" | "breakpoint-2xl" | "breakpoint-lg" | "breakpoint-md" | "breakpoint-sm" | "breakpoint-xl" | "fit" | "full" | "lg" | "max" | "md" | "min" | "prose" | "sm" | "xl" | "xs"

export type SpacingToken = "-0.5" | "-1" | "-1.5" | "-10" | "-11" | "-12" | "-14" | "-16" | "-2" | "-2.5" | "-20" | "-24" | "-28" | "-3" | "-3.5" | "-32" | "-36" | "-4" | "-4.5" | "-40" | "-44" | "-48" | "-5" | "-5.5" | "-52" | "-56" | "-6" | "-60" | "-64" | "-7" | "-72" | "-8" | "-80" | "-9" | "-96" | "0" | "0.5" | "1" | "1.5" | "10" | "11" | "12" | "14" | "16" | "2" | "2.5" | "20" | "24" | "28" | "3" | "3.5" | "32" | "36" | "4" | "4.5" | "40" | "44" | "48" | "5" | "5.5" | "52" | "56" | "6" | "60" | "64" | "7" | "72" | "8" | "80" | "9" | "96"

export type ZIndexToken = "banner" | "base" | "docked" | "dropdown" | "hide" | "modal" | "overlay" | "popover" | "skipLink" | "sticky" | "toast" | "tooltip"

export interface Tokens {
  animations: AnimationToken
  aspectRatios: AspectRatioToken
  blurs: BlurToken
  borders: BorderToken
  breakpoints: BreakpointToken
  colors: ColorToken
  durations: DurationToken
  easings: EasingToken
  fontSizes: FontSizeToken
  fontWeights: FontWeightToken
  fonts: FontToken
  letterSpacings: LetterSpacingToken
  lineHeights: LineHeightToken
  radii: RadiusToken
  shadows: ShadowToken
  sizes: SizeToken
  spacing: SpacingToken
  zIndex: ZIndexToken
}

export type Token = `animations.${AnimationToken}` | `aspectRatios.${AspectRatioToken}` | `blurs.${BlurToken}` | `borders.${BorderToken}` | `breakpoints.${BreakpointToken}` | `colors.${ColorToken}` | `durations.${DurationToken}` | `easings.${EasingToken}` | `fontSizes.${FontSizeToken}` | `fontWeights.${FontWeightToken}` | `fonts.${FontToken}` | `letterSpacings.${LetterSpacingToken}` | `lineHeights.${LineHeightToken}` | `radii.${RadiusToken}` | `shadows.${ShadowToken}` | `sizes.${SizeToken}` | `spacing.${SpacingToken}` | `zIndex.${ZIndexToken}`

export type ColorOpacityModifier = `${number}`

export type ColorOpacityToken = `colors.${ColorToken}/${ColorOpacityModifier}`

export type TokenPath = Token | ColorOpacityToken

export type ColorPalette = "black" | "border" | "error" | "fg" | "gray" | "gray.outline" | "gray.outline.bg" | "gray.outline.border" | "gray.outline.fg" | "gray.plain" | "gray.plain.bg" | "gray.plain.fg" | "gray.solid" | "gray.solid.bg" | "gray.solid.fg" | "gray.subtle" | "gray.subtle.bg" | "gray.subtle.fg" | "gray.surface" | "gray.surface.bg" | "gray.surface.border" | "gray.surface.fg" | "green" | "green.outline" | "green.outline.bg" | "green.outline.border" | "green.outline.fg" | "green.plain" | "green.plain.bg" | "green.plain.fg" | "green.solid" | "green.solid.bg" | "green.solid.fg" | "green.subtle" | "green.subtle.bg" | "green.subtle.fg" | "green.surface" | "green.surface.bg" | "green.surface.border" | "green.surface.fg" | "indigo" | "indigo.outline" | "indigo.outline.bg" | "indigo.outline.border" | "indigo.outline.fg" | "indigo.plain" | "indigo.plain.bg" | "indigo.plain.fg" | "indigo.solid" | "indigo.solid.bg" | "indigo.solid.fg" | "indigo.subtle" | "indigo.subtle.bg" | "indigo.subtle.fg" | "indigo.surface" | "indigo.surface.bg" | "indigo.surface.border" | "indigo.surface.fg" | "red" | "red.outline" | "red.outline.bg" | "red.outline.border" | "red.outline.fg" | "red.plain" | "red.plain.bg" | "red.plain.fg" | "red.solid" | "red.solid.bg" | "red.solid.fg" | "red.subtle" | "red.subtle.bg" | "red.subtle.fg" | "red.surface" | "red.surface.bg" | "red.surface.border" | "red.surface.fg" | "white"

export type TokenValue<T extends string> = T extends keyof Tokens ? Tokens[T] : never