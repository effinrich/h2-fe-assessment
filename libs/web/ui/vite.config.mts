import * as path from "path"

import react from "@vitejs/plugin-react"
/// <reference types='vitest' />
import { defaultClientConditions, defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../../node_modules/.vite/libs/web/ui",
  plugins: [
    react(),
    dts({ entryRoot: "src", tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json") })
  ],
  // Workspace libs export their TypeScript source under the @h2-fe/source
  // condition; the stage and the tests consume them the same way the app does.
  resolve: {
    conditions: [...defaultClientConditions, "@h2-fe/source"]
  },
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    lib: {
      entry: "src/index.ts",
      name: "@h2-fe/web-ui",
      fileName: "index",
      formats: ["es" as const]
    },
    rolldownOptions: {
      // External packages that should not be bundled into your library.
      // @h2-fe/ui resolves through the workspace source condition.
      external: ["react", "react-dom", "react/jsx-runtime", "@h2-fe/ui"]
    }
  },
  test: {
    name: "@h2-fe/web-ui",
    watch: false,
    globals: true,
    environment: "jsdom",
    // The stories of the web stage are the composition's test surface; the
    // lib itself ships no spec, so an empty run is success.
    passWithNoTests: true,
    setupFiles: ["../../../tools/vitest-setup.ts"],
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const
    }
  }
}))
