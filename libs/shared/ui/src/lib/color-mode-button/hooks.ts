import { useTheme } from "next-themes"
import { useCallback } from "react"

import type { ColorMode, UseColorModeReturn } from "./types"

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, forcedTheme, setTheme } = useTheme()
  const colorMode: ColorMode = (forcedTheme ?? resolvedTheme) === "dark" ? "dark" : "light"

  const toggleColorMode = useCallback(() => {
    setTheme(colorMode === "dark" ? "light" : "dark")
  }, [colorMode, setTheme])

  return { colorMode, setColorMode: setTheme, toggleColorMode }
}
