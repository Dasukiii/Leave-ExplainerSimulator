import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      'pdfjs-dist/build/pdf.worker.min.mjs': resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
    },
  },
  worker: {
    format: 'es',
  },
});
