import { defineConfig, devices } from '@playwright/test';

// The browser tests start their own API (port 3101, database server/data/e2e.db) and Vite (port 5174),
// so they do not touch the database of `npm run dev`.
const API_PORT = 3101;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.js',
  outputDir: 'test-results',
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'app', testMatch: 'app/**/*.spec.js', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'node server/src/seed.js && node server/src/index.js',
      url: `http://localhost:${API_PORT}/api/me`,
      env: {
        API_PORT: String(API_PORT),
        DATABASE_PATH: 'server/data/e2e.db',
        SESSION_SECRET: 'e2e-session-secret',
      },
      reuseExistingServer: false,
    },
    {
      command: 'npx vite',
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT), WEB_PORT: String(WEB_PORT) },
      reuseExistingServer: false,
    },
  ],
});
