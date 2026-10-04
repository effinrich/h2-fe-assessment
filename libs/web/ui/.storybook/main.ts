import type { StorybookConfig } from "@storybook/react-vite"

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

// The web stage: app-scoped UI under `libs/web/ui`, plus every feature
// screen's stories, in one book. `libs/shared/ui` keeps its own stage for
// shared primitives only.
const config: StorybookConfig = {
  stories: [
    "../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))",
    "../../../../libs/web/features/**/src/lib/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest")
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: `${import.meta.dirname}/../vite.config.mts`
      }
    }
  }
}

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

export default config

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
