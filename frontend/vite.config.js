import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/n8n-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
