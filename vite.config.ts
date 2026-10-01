import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Resolve the real npm package name (pnpm / nested node_modules safe). */
function getPackageName(id: string): string | null {
  const normalized = id.replace(/\\/g, '/');
  const matches = [
    ...normalized.matchAll(/\/node_modules\/((?:@[^/]+\/)?[^/]+)/g),
  ];
  const pkgs = matches
    .map((m) => m[1])
    .filter((p) => p !== '.pnpm' && p !== '.ignored');
  return pkgs.length ? pkgs[pkgs.length - 1] : null;
}

function isReactFamily(id: string): boolean {
  const n = id.replace(/\\/g, '/');
  if (n.endsWith('/blobatar/dist/react.js')) return true;
  if (/\/\.ignored\/react(?:-dom)?\//.test(n)) return true;
  if (/\/node_modules\/react\//.test(n) && !n.includes('/@blobatar/react/')) return true;
  if (/\/node_modules\/react-dom\//.test(n)) return true;
  if (/\/node_modules\/scheduler\//.test(n)) return true;
  if (/\/node_modules\/react-router(?:-dom)?\//.test(n)) return true;
  return false;
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'blobatar',
      '@blobatar/react',
      'lucide-react',
      'date-fns',
      'axios',
      '@microsoft/signalr',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    port: 5174,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
  preview: {
    port: 4173,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (isReactFamily(id)) return 'vendor-react';

          const pkg = getPackageName(id);
          if (!pkg) return;

          // Leave these to natural route-based splitting. Forcing named chunks
          // previously absorbed React/JSX copies into the landing entry graph.
          if (
            pkg === 'blobatar' ||
            pkg === '@blobatar/react' ||
            pkg === 'motion' ||
            pkg === 'framer-motion' ||
            pkg === 'react-hook-form' ||
            pkg === '@hookform/resolvers' ||
            pkg === 'zod' ||
            pkg === '@react-pdf/renderer' ||
            pkg.startsWith('@react-pdf/') ||
            pkg === 'pdfkit' ||
            pkg === 'fontkit' ||
            pkg === 'restructure' ||
            pkg === 'yoga-layout'
          ) {
            return;
          }

          if (pkg === '@microsoft/signalr') return 'vendor-signalr';
          if (pkg === 'date-fns') return 'vendor-date';
          if (pkg === 'lucide-react') return 'vendor-icons';
          if (pkg === 'axios') return 'vendor-axios';
        },
      },
    },
  },
});
