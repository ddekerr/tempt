import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER_PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@core': path.resolve(import.meta.dirname, 'core'),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': `http://localhost:${SERVER_PORT}`,
      '/ws': { target: `ws://localhost:${SERVER_PORT}`, ws: true },
    },
  },
});
