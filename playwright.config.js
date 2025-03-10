// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true, // Enable parallel test execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add one retry for local tests
  workers: 4, // Increase to 4 workers for a 10-core processor
  reporter: 'html',
  
  use: {
    // Base URL to be used in tests
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // We're no longer using the webServer option since we're using start-server-and-test
});
