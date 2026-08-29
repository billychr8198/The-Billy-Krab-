import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is relative so the built site works from a repo subpath
// (GitHub Pages project sites), Netlify, Vercel, or a plain file server.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets', chunkSizeWarningLimit: 1200 },
});
