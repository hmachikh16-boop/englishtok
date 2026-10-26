import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { rm } from 'node:fs/promises';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // Store builds must not ship the website's APK download page or the
        // direct-download links. They update through the store instead.
        name: 'store-build-exclude-download-assets',
        apply: 'build',
        async closeBundle() {
          if (process.env.VITE_STORE_BUILD !== 'true') return;
          const outDir = path.resolve(__dirname, 'dist');
          await Promise.all([
            rm(path.resolve(outDir, 'download.html'), { force: true }),
            rm(path.resolve(outDir, 'download.js'), { force: true }),
            rm(path.resolve(outDir, 'download'), { recursive: true, force: true }),
            rm(path.resolve(outDir, 'english-tok.apk'), { force: true }),
          ]);
        },
      },
    ],
    worker: {
      format: 'es' as const,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
