import type { ReactNode } from "react"

import "@fontsource-variable/inter"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"

import { system } from "../theme/system"
import { Toaster } from "../toaster/toaster"

export interface UiProviderProps {
  children: ReactNode
}

// Chakra's dark condition matches a `.dark` ancestor, so next-themes writes the
// colour mode as a class on <html>.
export function UiProvider({ children }: UiProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </ChakraProvider>
  )
}
