import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiPort = process.env.API_PORT || 3001;

export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT || 5173),
    strictPort: true,
    // GitHub Codespaces opens the app on a *.app.github.dev address.
    allowedHosts: ['.app.github.dev'],
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
