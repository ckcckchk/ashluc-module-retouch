import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Library build: ESM only, React + the ML runtime stay outside the bundle. */
export default defineConfig({
  plugins: [react()],
  // the demo's public/ belongs to the demo, not to the package
  publicDir: false,
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', '@mediapipe/tasks-vision'],
    },
    // tsc writes the .d.ts files into the same outDir before this runs
    emptyOutDir: false,
    sourcemap: false,
  },
});
