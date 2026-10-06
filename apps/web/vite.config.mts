import react from "@vitejs/plugin-react"
import { defaultClientConditions, defineConfig } from "vite"

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/web",
  server: {
    port: 4200,
    host: "localhost"
  },
  preview: {
    port: 4300,
    host: "localhost"
  },
  plugins: [react()],
  // Workspace libs export their TypeScript source under the @h2-fe/source
  // condition, so the app consumes them without a prior lib build. Setting
  // `conditions` replaces Vite's defaults, hence the spread.
  resolve: {
    conditions: [...defaultClientConditions, "@h2-fe/source"]
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
}))
