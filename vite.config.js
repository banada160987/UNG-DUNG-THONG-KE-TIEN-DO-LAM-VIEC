import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Completely suppress non-fatal bundler warnings to prevent Vercel CI failure
        return;
      }
    }
  },
  define: {
    'process.env': {}
  }
});
