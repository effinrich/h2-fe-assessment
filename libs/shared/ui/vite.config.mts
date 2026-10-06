import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Storybook's Vite config (see .storybook/main.ts). The library is consumed as source.
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../../node_modules/.vite/libs/shared/ui",
  plugins: [react()]
}))
