import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Set relative base path for GitHub Pages deployment
  server: {
    port: 3000,
    host: true,
    allowedHosts: true // Allow localtunnel, ngrok, and any custom domain hosts
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
