import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** The demo app: the editor on the sample portrait, served on its own port. */
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5191, strictPort: true },
  preview: { port: 5191, strictPort: true },
  build: { outDir: 'demo-dist', sourcemap: false },
});
