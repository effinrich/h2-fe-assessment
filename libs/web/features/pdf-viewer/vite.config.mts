import react from "@vitejs/plugin-react"
import * as path from "path"
/// <reference types='vitest' />
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../../../node_modules/.vite/libs/web/features/pdf-viewer",
  plugins: [
    react(),
    dts({ entryRoot: "src", tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json") })
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
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
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "@h2-fe/pdf-viewer",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es" as const]
    },
    rolldownOptions: {
      // External packages that should not be bundled into your library.
      // tldraw and pdfjs are large and shared with the app; @h2-fe/ui resolves
      // through the workspace source condition.
      external: ["react", "react-dom", "react/jsx-runtime", "tldraw", "pdfjs-dist", "@h2-fe/ui"]
    }
  },
  test: {
    name: "@h2-fe/pdf-viewer",
    watch: false,
    globals: true,
    environment: "jsdom",
    setupFiles: ["../../../../tools/vitest-setup.ts"],
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const
    }
  }
}))
