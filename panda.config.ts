import { green } from './libs/shared/ui/src/theme/colors/green'
import { red } from './libs/shared/ui/src/theme/colors/red'
import { slate } from './libs/shared/ui/src/theme/colors/slate'
import { indigo } from './libs/shared/ui/src/theme/colors/indigo'
import { animationStyles } from './libs/shared/ui/src/theme/animation-styles'
import { zIndex } from './libs/shared/ui/src/theme/tokens/z-index'
import { shadows } from './libs/shared/ui/src/theme/tokens/shadows'
import { durations } from './libs/shared/ui/src/theme/tokens/durations'
import { colors } from './libs/shared/ui/src/theme/tokens/colors'
import { textStyles } from './libs/shared/ui/src/theme/text-styles'
import { layerStyles } from './libs/shared/ui/src/theme/layer-styles'
import { keyframes } from './libs/shared/ui/src/theme/keyframes'
import { globalCss } from './libs/shared/ui/src/theme/global-css'
import { conditions } from './libs/shared/ui/src/theme/conditions'
import { slotRecipes, recipes } from './libs/shared/ui/src/theme/recipes'
import { defineConfig } from '@pandacss/dev'

// Panda at the workspace root, one token system for the whole repo. The theme
// and components live in libs/shared/ui (the design system); the app and
// feature libs consume them, and can use css() themselves via the shared
// styled-system output. Park UI's init expects panda.config.ts at the root,
// which is another reason not to bury it in a lib.
export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./apps/**/*.{ts,tsx}', './libs/**/*.{ts,tsx}'],
  exclude: [],
  jsxFramework: 'react',
  outdir: 'styled-system',

  // Park UI supplies its own colour system, so Panda's default 50-950 ramps
  // would be dead weight in the bundle and noise in the token types.
  plugins: [
    {
      name: 'Remove Panda Preset Colors',
      hooks: {
        'preset:resolved': ({ utils, preset, name }) =>
          name === '@pandacss/preset-panda'
            ? utils.omit(preset, ['theme.tokens.colors', 'theme.semanticTokens.colors'])
            : preset,
      },
    },
  ],

  globalCss: globalCss,
  conditions: conditions,

  theme: {
    extend: {
      animationStyles: animationStyles,
      recipes: recipes,
      slotRecipes: slotRecipes,
      keyframes: keyframes,
      layerStyles: layerStyles,
      textStyles: textStyles,

      tokens: {
        colors: colors,
        durations: durations,
        zIndex: zIndex,
      },

      semanticTokens: {
        colors: {
          fg: {
            default: { value: { _light: '{colors.gray.12}', _dark: '{colors.gray.12}' } },
            muted: { value: { _light: '{colors.gray.11}', _dark: '{colors.gray.11}' } },
            subtle: { value: { _light: '{colors.gray.10}', _dark: '{colors.gray.10}' } },
          },
          border: { value: { _light: '{colors.gray.4}', _dark: '{colors.gray.4}' } },
          error: { value: { _light: '{colors.red.9}', _dark: '{colors.red.9}' } },
          indigo: indigo,
          gray: slate,
          red: red,
          green: green,
        },

        shadows: shadows,

        radii: {
          l1: { value: '{radii.xs}' },
          l2: { value: '{radii.sm}' },
          l3: { value: '{radii.md}' },
        },
      },
    },
  },
})
