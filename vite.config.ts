import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // FIX: use relative paths for built assets ("./assets/..." instead of
    // "/assets/..."). MainActivity.kt loads the app with
    // webView.loadUrl("file:///android_asset/public/index.html"), and under
    // the file:// scheme an absolute path like "/assets/index-xxxx.js"
    // resolves to the root of the device filesystem, not to the app's own
    // asset folder — so the main JS/CSS bundle silently fails to load and
    // the WebView shows a blank white screen. A relative base fixes this.
    //
    // IMPORTANT: keep this line. Do not let it get removed by future edits.
    base: './',
    plugins: [react(), tailwindcss()],
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
