import { Icon, IconButton, type IconButtonProps } from "@chakra-ui/react"
import { Moon, Sun } from "lucide-react"

import { useColorMode } from "./hooks"

export type ColorModeButtonProps = Omit<IconButtonProps, "aria-label" | "onClick">

export function ColorModeButton(props: ColorModeButtonProps) {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === "dark"

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleColorMode}
      {...props}
    >
      <Icon asChild>{isDark ? <Moon /> : <Sun />}</Icon>
    </IconButton>
  )
}
