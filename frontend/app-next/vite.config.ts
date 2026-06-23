import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Beacon/Taquito + WalletConnect v2 expect Node globals (Buffer/process/global)
// and a handful of node builtins in the browser. vite-plugin-node-polyfills
// supplies them — this is the clean replacement for the old CRA/webpack polyfills.
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 4000,
  },
  server: { host: true, port: 3001 },
  preview: { host: true, port: 3001 },
});
