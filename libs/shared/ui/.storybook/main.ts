
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import type { StorybookConfig } from '@storybook/react-vite';

// Storybook resolves viteConfigPath against its own working directory, so a
// bare 'vite.config.mts' resolves to the workspace root and fails with
// UNRESOLVED_ENTRY. Nx generates the relative form; resolve it from here instead.
const here = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [

    '../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'
  ],


  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs')
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {

      builder: {
        viteConfigPath: join(here, '..', 'vite.config.mts'),
      },

    },
  },

};


function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}


export default config;




// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs

