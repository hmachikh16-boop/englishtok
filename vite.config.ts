import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readdir, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'path';
import {defineConfig} from 'vite';

const readContentVersions = () => {
  try {
    const manifest = JSON.parse(
      readFileSync(path.resolve(__dirname, 'public', 'content', 'content-manifest.json'), 'utf8'),
    );
    return {
      en: typeof manifest?.en?.version === 'string' ? manifest.en.version : '',
      fr: typeof manifest?.fr?.version === 'string' ? manifest.fr.version : '',
    };
  } catch {
    return { en: '', fr: '' };
  }
};

export default defineConfig(() => {
  let outDir = path.resolve(__dirname, 'dist');
  const contentVersions = readContentVersions();
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // Store builds must not ship the website's APK download page or the
        // direct-download links. They update through the store instead.
        name: 'store-build-exclude-download-assets',
        apply: 'build',
        configResolved(config) {
          outDir = path.resolve(config.root, config.build.outDir);
        },
        async closeBundle() {
          if (
            process.env.VITE_STORE_BUILD !== 'true' &&
            process.env.VITE_GOLD_EDITION !== 'true'
          ) return;
          await Promise.all([
            rm(path.resolve(outDir, 'download.html'), { force: true }),
            rm(path.resolve(outDir, 'download.js'), { force: true }),
            rm(path.resolve(outDir, 'download'), { recursive: true, force: true }),
            rm(path.resolve(outDir, 'control.html'), { force: true }),
            rm(path.resolve(outDir, 'control.js'), { force: true }),
            rm(path.resolve(outDir, 'control.css'), { force: true }),
            rm(path.resolve(outDir, 'english-tok.apk'), { force: true }),
            rm(path.resolve(outDir, 'lin-go-gold.apk'), { force: true }),
            rm(path.resolve(outDir, 'lin-go-gold-1.0.1.apk'), { force: true }),
            rm(path.resolve(outDir, 'lin-go-gold-1.1.8.apk'), { force: true }),
            rm(path.resolve(outDir, 'gold-preview.html'), { force: true }),
          ]);

          // Future APK versions should never become visible to a store build
          // merely because the staging step used a newer filename.
          try {
            const rootFiles = await readdir(outDir);
            await Promise.all(
              rootFiles
                .filter((file) => file.toLowerCase().endsWith('.apk'))
                .map((file) => rm(path.resolve(outDir, file), { force: true })),
            );
          } catch {
            /* An empty or missing output directory has nothing to clean. */
          }

          // Remove the entry chunks of the standalone Gold preview as well.
          // Store builds must not carry the direct-download edition UI.
          const assetsDir = path.resolve(outDir, 'assets');
          try {
            const assets = await readdir(assetsDir);
            await Promise.all(
              assets
                .filter(
                  (file) =>
                    file.startsWith('gold-preview-') ||
                    file.startsWith('goldPreview-') ||
                    file.startsWith('GoldAppPreview-'),
                )
                .map((file) => rm(path.resolve(assetsDir, file), { force: true })),
            );
          } catch {
            /* No assets directory means there is nothing else to remove. */
          }
        },
      },
    ],
    build: {
      modulePreload: {
        resolveDependencies: (_filename, deps) =>
          deps.filter(
            (dep) => !dep.includes('curriculum') && !dep.includes('CategoriesTab'),
          ),
      },
      rolldownOptions: {
        output: {
          manualChunks(id) {
            const n = id.replace(/\\\\/g, '/');
            if (n.includes('/src/data/stage1.')) return 'curriculum-stage1';
            if (n.includes('/src/data/stage2.')) return 'curriculum-stage2';
            if (n.includes('/src/data/stage3.')) return 'curriculum-stage3';
            if (n.includes('/src/data/stage4.')) return 'curriculum-stage4';
            if (n.includes('/src/data/expansion/stage1')) return 'curriculum-stage1';
            if (n.includes('/src/data/expansion/stage2')) return 'curriculum-stage2';
            if (n.includes('/src/data/expansion/stage3')) return 'curriculum-stage3';
            if (n.includes('/src/data/expansion/stage4')) return 'curriculum-stage4';
            if (n.includes('/src/data/expansionPlus/stage1')) return 'curriculum-stage1';
            if (n.includes('/src/data/expansionPlus/stage2')) return 'curriculum-stage2';
            if (n.includes('/src/data/expansionPlus/stage3')) return 'curriculum-stage3';
            if (n.includes('/src/data/expansionPlus/stage4')) return 'curriculum-stage4';
            if (n.includes('/src/data/expansionPlus2/stage1')) return 'curriculum-stage1';
            if (n.includes('/src/data/expansionPlus2/stage2')) return 'curriculum-stage2';
            if (n.includes('/src/data/expansionPlus2/stage3')) return 'curriculum-stage3';
            if (n.includes('/src/data/expansionPlus2/stage4')) return 'curriculum-stage4';
            if (n.includes('/src/data/curriculumContent')) return 'curriculum-core';
            if (n.includes('/src/data/curriculum.ts')) return 'curriculum-core';
            if (n.includes('/src/data/curriculumExpansion')) return 'curriculum-core';
            return undefined;
          },
        },
        input: {
          main: path.resolve(__dirname, 'index.html'),
          goldPreview: path.resolve(__dirname, 'gold-preview.html'),
        },
      },
    },
    worker: {
      format: 'es' as const,
    },
    define: {
      __CONTENT_VERSION_EN__: JSON.stringify(contentVersions.en),
      __CONTENT_VERSION_FR__: JSON.stringify(contentVersions.fr),
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
