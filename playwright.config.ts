import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.REDIRECT_E2E_BASE || '' // e.g., https://hretheum.com

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  use: {
    baseURL: baseURL || undefined,
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
