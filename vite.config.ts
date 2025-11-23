import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';
import path from 'path';

const target = process.env.TARGET_BROWSER || 'chrome';

function generateManifest() {
  const manifest = readJsonFile('src/manifest/manifest.json');
  const pkg = readJsonFile('package.json');

  // Deep clone to avoid mutating original if called multiple times or cached
  const manifestResult = {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...JSON.parse(JSON.stringify(manifest)),
  };

  if (process.env.TARGET_BROWSER === 'firefox') {
    // Firefox MV2 Fallback Adaptation
    manifestResult.manifest_version = 2;

    // 1. Convert background service worker to background scripts
    if (manifestResult.background && manifestResult.background.service_worker) {
      manifestResult.background = {
        scripts: [manifestResult.background.service_worker],
        persistent: false, // Recommended for event pages in MV2
        // type: 'module' is implied by vite bundling usually, but MV2 doesn't strictly support type="module" in manifest
        // Vite plugin will bundle it to a standard script.
      };
    }

    // 2. Convert action to browser_action
    if (manifestResult.action) {
      manifestResult.browser_action = manifestResult.action;
      delete manifestResult.action;
    }

    // 3. Move host_permissions to permissions
    if (manifestResult.host_permissions) {
      manifestResult.permissions = [
        ...(manifestResult.permissions || []),
        ...manifestResult.host_permissions,
      ];
      delete manifestResult.host_permissions;
    }

    // 4. Flatten web_accessible_resources
    if (manifestResult.web_accessible_resources) {
      const flatResources = new Set();
      manifestResult.web_accessible_resources.forEach((entry: any) => {
        if (entry.resources) {
          entry.resources.forEach((res: string) => flatResources.add(res));
        }
      });
      manifestResult.web_accessible_resources = Array.from(flatResources);
    }

    // 5. Convert CSP
    if (manifestResult.content_security_policy && manifestResult.content_security_policy.extension_pages) {
      // Use the extension_pages CSP as the main CSP for MV2
      manifestResult.content_security_policy = manifestResult.content_security_policy.extension_pages;
    }

    // 6. Firefox specific settings
    manifestResult.browser_specific_settings = {
      gecko: {
        id: 'trigger-warnings@example.com',
        strict_min_version: '109.0',
      },
    };
  }

  return manifestResult;
}

export default defineConfig({
  plugins: [
    svelte(),
    webExtension({
      manifest: generateManifest,
      watchFilePaths: ['package.json', 'src/manifest/manifest.json'],
      browser: target,
      disableAutoLaunch: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@content': path.resolve(__dirname, './src/content'),
      '@background': path.resolve(__dirname, './src/background'),
      '@popup': path.resolve(__dirname, './src/popup'),
      '@options': path.resolve(__dirname, './src/options'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    outDir: `dist/${target}`,
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
