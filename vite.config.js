import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Prevent Vercel CI from failing on non-critical bundler warnings
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          warning.code === 'CIRCULAR_DEPENDENCY' ||
          warning.code === 'EVAL' ||
          warning.code === 'EMPTY_BUNDLE'
        ) {
          return;
        }
        if (defaultHandler) {
          defaultHandler(warning);
        }
      }
    }
  },
  define: {
    'process.env': {}
  }
});
