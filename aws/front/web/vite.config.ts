// aws/front/web/vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        // ✅ backend con /api => NO rewrite
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
