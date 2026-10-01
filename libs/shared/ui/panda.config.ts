import { defineConfig } from '@pandacss/dev'

// The design system lives with the UI library, not at the workspace root: the
// lib's vite root is this directory, so the Panda plugin resolves the config
// from here. The app consumes components, not tokens.
export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
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
})
