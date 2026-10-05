import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// A custom palette needs both the 50–950 scale (tokens) and the role keys
// (semantic tokens) before `colorPalette="brand"` resolves on components.
const config = defineConfig({
  globalCss: {
    html: { colorPalette: "brand" }
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f4f6f4" },
          100: { value: "#e6ebe8" },
          200: { value: "#c9d2cc" },
          300: { value: "#a8b5ae" },
          400: { value: "#87968e" },
          500: { value: "#6e7a74" },
          600: { value: "#2a3530" },
          700: { value: "#24302b" },
          800: { value: "#1c2521" },
          900: { value: "#151c19" },
          950: { value: "#0c110f" }
        }
      }
    },
    semanticTokens: {
      colors: {
        brand: {
          contrast: { value: { _light: "white", _dark: "white" } },
          fg: { value: { _light: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          subtle: { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          muted: { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
          emphasized: { value: { _light: "{colors.brand.300}", _dark: "{colors.brand.700}" } },
          solid: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.500}" } },
          focusRing: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
          border: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } }
        },
        // WCAG AA (4.5:1): Chakra's defaults put white text on the 600 shade of
        // these palettes and red.500 error text on white, both below the ratio.
        fg: {
          error: { value: { _light: "{colors.red.600}", _dark: "{colors.red.400}" } }
        },
        orange: { solid: { value: "{colors.orange.700}" } },
        green: { solid: { value: "{colors.green.700}" } },
        teal: { solid: { value: "{colors.teal.700}" } },
        cyan: { solid: { value: "{colors.cyan.700}" } },
        pink: { solid: { value: "{colors.pink.700}" } }
      }
    }
  }
})

export const system = createSystem(defaultConfig, config)
