import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: false,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('fontkit') || id.includes('restructure') || id.includes('yoga-layout')) {
              return 'vendor-pdf';
            }
            if (id.includes('@microsoft/signalr')) {
              return 'vendor-signalr';
            }
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'vendor-forms';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
