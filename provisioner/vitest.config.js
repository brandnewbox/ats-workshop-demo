import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// The tests run in the Workers runtime (Miniflare) with a local KV. GitHub and OpenRouter are mocked.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      miniflare: {
        bindings: {
          OPENROUTER_MANAGEMENT_KEY: 'test-management-key-do-not-leak',
          ADMIN_TOKEN: 'test-admin-token',
          EVENT_CODE: 'Prairie Owl 2026',
        },
      },
    }),
  ],
});
