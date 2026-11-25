import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/support/setup.js'],
    projects: [
      { extends: true, test: { name: 'app', include: ['tests/app/**/*.test.{js,jsx}'] } },
    ],
  },
});
