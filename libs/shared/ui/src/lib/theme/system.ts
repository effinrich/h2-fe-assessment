import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const systemSans = `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
const systemMono = `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`

// A custom palette needs both the 50–950 scale (tokens) and the role keys
// (semantic tokens) before `colorPalette="brand"` resolves on components.
const config = defineConfig({
  globalCss: {
    html: { colorPalette: "brand" }
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: `"Inter Variable", ${systemSans}` },
        body: { value: `"Inter Variable", ${systemSans}` },
        mono: { value: systemMono }
      },
      colors: {
        brand: {
          50: { value: "#f4f6f4" },
          100: { value: "#e6ebe8" },
          200: { value: "#c9d2cc" },
          300: { value: "#a8b5ae" },
          400: { value: "#87968e" },
          500: { value: "#68746e" },
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
          solid: { value: { _light: "{colors.brand.600}", _dark: "{colors.brand.600}" } },
          focusRing: { value: { _light: "{colors.blue.500}", _dark: "{colors.blue.400}" } },
          border: { value: { _light: "{colors.brand.500}", _dark: "{colors.brand.400}" } }
        },
        // The annotation ink. One saturated colour in the whole app, and it
        // only ever marks the user's own attention: the active tool, the
        // primary action, the focus ring. Paper, desk and graphite are the
        // other three colours, and they are all quiet.
        ink: {
          contrast: { value: "white" },
          fg: { value: { _light: "{colors.blue.700}", _dark: "{colors.blue.300}" } },
          subtle: { value: { _light: "{colors.blue.50}", _dark: "{colors.blue.950}" } },
          muted: { value: { _light: "{colors.blue.100}", _dark: "{colors.blue.900}" } },
          solid: { value: { _light: "{colors.blue.700}", _dark: "{colors.blue.600}" } },
          focusRing: { value: { _light: "{colors.blue.500}", _dark: "{colors.blue.400}" } }
        },
        // The paper. What is printed on it does not change with the theme:
        // a title is a title and a rule is a rule whatever the desk is doing.
        // Only the sheet itself dims a little when the desk goes dark, so it
        // does not glare.
        paper: {
          bg: { value: { _light: "#fbfaf7", _dark: "#f0eee8" } },
          text: { value: "#2b312d" },
          body: { value: "#c9cdc7" },
          rule: { value: "#e4e1d8" },
          mark: { value: "#dde7f8" }
        },
        // The desk the page is put down on.
        desk: {
          dot: { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.700}" } }
        },
        // The surface the document sits on: off the panel colour so white
        // pages and panels read as objects on it.
        bg: {
          canvas: { value: { _light: "{colors.brand.100}", _dark: "{colors.brand.950}" } }
        },
        // WCAG AA (4.5:1): Chakra's defaults put white text on the 600 shade of
        // these palettes and red.500 error text on white, both below the ratio.
        fg: {
          error: { value: { _light: "{colors.red.600}", _dark: "{colors.red.400}" } }
        },
        // Chakra's default orange.contrast is black in dark mode, which fit the
        // stock orange.500 solid but fails WCAG AA against our darker override.
        orange: {
          solid: { value: "{colors.orange.700}" },
          contrast: { value: { _light: "white", _dark: "white" } }
        },
        green: { solid: { value: "{colors.green.700}" } },
        teal: { solid: { value: "{colors.teal.700}" } },
        cyan: { solid: { value: "{colors.cyan.700}" } },
        pink: { solid: { value: "{colors.pink.700}" } }
      }
    }
  }
})

export const system = createSystem(defaultConfig, config)
