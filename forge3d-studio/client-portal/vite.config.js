import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure _redirects and _headers are copied to the build output
  publicDir: 'public',
  build: {
    copyPublicDir: true,
  },
})
