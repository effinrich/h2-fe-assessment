import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import * as path from "path"
import { defineConfig, mergeConfig } from "vitest/config"

import viteConfig from "./vite.config.mjs"

// Runs every story of the web stage (render + play function + a11y) in
// headless Chromium. The file name sits outside Nx's `{vite,vitest}.config.*`
// inference glob on purpose: `test` stays the jsdom unit run,
// `test-storybook` runs this.
// The addon applies Storybook's `viteFinal` only, so the stage's own Vite
// config is merged in here, minus its jsdom `test` block.
const { test: _jsdom, ...stage } = viteConfig({ command: "serve", mode: "test" })

export default mergeConfig(
  stage,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(import.meta.dirname, ".storybook"),
        storybookUrl: "http://localhost:6006"
      })
    ],
    test: {
      watch: false,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium", viewport: { width: 390, height: 844 } }]
      },
      coverage: {
        provider: "v8",
        // The web stage also hosts the feature screens' stories and the home
        // route's screen, so those components are listed even when unrendered;
        // .ts modules count only once a story loads them. Vitest cannot
        // transform a never-loaded file outside this root ("Failed to parse"),
        // and feature logic is the feature libs' unit specs' job anyway. The
        // home screen is the one app file this stage loads.
        allowExternal: true,
        include: [
          "src/**/*.{ts,tsx}",
          "**/libs/web/features/*/src/**/*.tsx",
          "**/apps/web/src/app/routes/home/home-screen/home-screen.tsx"
        ],
        exclude: ["**/libs/shared/**", "**/*.stories.tsx", "**/*.spec.tsx", "**/*.d.ts"],
        reporter: ["text-summary", "lcov", "html"],
        reportsDirectory: "../../../coverage/libs/web/ui"
      }
    }
  })
)
