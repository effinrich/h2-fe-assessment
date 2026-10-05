import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import * as path from "path"
import { defineConfig, mergeConfig } from "vitest/config"

import viteConfig from "./vite.config.mjs"

// Runs every story (render + play function + a11y) in headless Chromium. The
// file name sits outside Nx's `{vite,vitest}.config.*` inference glob on
// purpose: `test` stays the jsdom unit run, `test-storybook` runs this.
// The addon applies Storybook's `viteFinal` only, so the stage's own Vite
// config is merged in here, minus its jsdom `test` block.
const { test: _jsdom, ...stage } = viteConfig({ command: "serve", mode: "test" })

export default mergeConfig(
  stage,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(import.meta.dirname, ".storybook"),
        storybookUrl: "http://localhost:4400"
      })
    ],
    test: {
      watch: false,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }]
      },
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/**/*.stories.tsx", "src/**/*.d.ts"],
        reporter: ["text-summary", "lcov", "html"],
        reportsDirectory: "../../../coverage/libs/shared/ui"
      }
    }
  })
)
