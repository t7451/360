import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Env prefix — all VITE_ vars are exposed to client
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Ensure _redirects and _headers from public/ land in dist/
    copyPublicDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
