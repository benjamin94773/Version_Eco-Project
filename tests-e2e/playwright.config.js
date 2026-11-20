import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 7_000
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1366, height: 768 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000
  },
  webServer: [
    {
      command: 'npm run start',
      cwd: path.join(rootDir, 'backend'),
      url: 'http://localhost:4000/health',
      reuseExistingServer: true,
      timeout: 30_000
    },
    {
      command: 'npm run dev -- --port 5173',
      cwd: path.join(rootDir, 'frontend'),
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000
    }
  ]
});
