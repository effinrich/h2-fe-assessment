import { IconButton, type IconButtonProps } from "@chakra-ui/react";

import { useColorMode } from "./hooks";
import { MoonIcon } from "./partials/moon-icon";
import { SunIcon } from "./partials/sun-icon";

export type ColorModeButtonProps = Omit<IconButtonProps, "aria-label" | "onClick">;

export function ColorModeButton(props: ColorModeButtonProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleColorMode}
      {...props}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}
