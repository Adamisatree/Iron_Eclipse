import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: { host: 'localhost' },
    allowedHosts: true as any,
    cors: true,
    headers: { 'X-Frame-Options': 'ALLOWALL' },
    proxy: {
      '/ws': {
        target: 'ws://localhost:27015',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});
