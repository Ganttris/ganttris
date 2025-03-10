// This file contains utility functions to help with Playwright test setup

/**
 * Wait for the server to be ready
 * @param {import('@playwright/test').Page} page
 */
async function waitForServer(page) {
  let retries = 10;
  while (retries > 0) {
    try {
      await page.goto('http://localhost:8080', {
        timeout: 5000,
        waitUntil: 'domcontentloaded'
      });
      // If we reach here, the page loaded successfully
      return;
    } catch (error) {
      console.log(`Server not ready yet, retrying... (${retries} attempts left)`);
      retries--;
      if (retries <= 0) throw new Error('Server failed to start');
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

module.exports = { waitForServer };
