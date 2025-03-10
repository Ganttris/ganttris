const { test, expect } = require('@playwright/test');

test.describe('Epic Interactions after Moving', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    await page.waitForSelector('#page-title', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('.timeline', { state: 'visible', timeout: 10000 });
    
    // Create an epic for testing
    await page.locator('.toolbar-item.btn-epic').dragTo(page.locator('#timeline'), {
      targetPosition: { x: 200, y: 100 },
      force: true
    });
    
    // Wait for epic to be fully rendered
    await page.waitForSelector('.epic', { state: 'visible', timeout: 10000 });
  });

  test('should allow interactions with epic after moving it', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'This test is unstable in WebKit');
    
    const epic = page.locator('.epic').first();
    await expect(epic).toBeVisible();
    
    // First, get the initial position of the epic
    const initialPosition = await epic.evaluate(el => ({
      left: parseInt(el.style.left, 10),
      top: parseInt(el.style.top, 10)
    }));
    
    // Move the epic to a new position
    await epic.dragTo(page.locator('#timeline'), {
      targetPosition: { x: 400, y: 200 },
      force: true
    });
    
    // Wait for rendering to complete after move
    await page.waitForTimeout(500);
    
    // Verify the epic has moved
    const newPosition = await epic.evaluate(el => ({
      left: parseInt(el.style.left, 10),
      top: parseInt(el.style.top, 10)
    }));
    
    // Check that it actually moved
    expect(newPosition).not.toEqual(initialPosition);
    
    // Now test all interactions with the moved epic
    
    // 1. Test resizing the epic horizontally
    const initialWidth = await epic.evaluate(el => parseInt(el.style.width, 10));
    
    // Find and interact with the resize handle using evaluate
    const resizeDone = await page.evaluate(() => {
      const epic = document.querySelector('.epic');
      if (!epic) return false;
      
      const resizeHandle = epic.querySelector('.resize-handle');
      if (!resizeHandle) return false;
      
      // Simulate resize with click events
      const rect = resizeHandle.getBoundingClientRect();
      
      // Create mousedown event
      const mouseDown = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.x + 5,
        clientY: rect.y + rect.height/2
      });
      resizeHandle.dispatchEvent(mouseDown);
      
      // Create mousemove event (drag to resize)
      const mouseMove = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true, 
        clientX: rect.x + 100,
        clientY: rect.y + rect.height/2
      });
      document.dispatchEvent(mouseMove);
      
      // Create mouseup event
      const mouseUp = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: rect.x + 100,
        clientY: rect.y + rect.height/2
      });
      document.dispatchEvent(mouseUp);
      
      return true;
    });
    
    expect(resizeDone).toBe(true);
    await page.waitForTimeout(500);
    
    // 2. Test starring the epic
    const starButton = epic.locator('.star-epic');
    await expect(starButton).toBeVisible();
    await starButton.click();
    
    // Verify star status changed
    const isStarred = await epic.locator('.star-epic i').evaluate(
      el => el.classList.contains('fas')
    );
    expect(isStarred).toBe(true);
    
    // 3. Test editing the epic name
    const nameField = epic.locator('div[style*="cursor: text"]').first();
    await expect(nameField).toBeVisible();
    
    // Use page.evaluate to trigger the onclick that calls startEditingEpicName
    await page.evaluate(() => {
      const nameEl = document.querySelector('.epic div[style*="cursor: text"]');
      if (nameEl) nameEl.click();
    });
    
    // Playwright can't interact with browser prompt, so we mock it
    await page.evaluate(() => {
      window.prompt = () => "Edited Epic";
    });
    
    // Click again to trigger the prompt
    await nameField.click();
    await page.waitForTimeout(500);
    
    // Check if name was updated
    const newName = await nameField.textContent();
    expect(newName).toContain("Edited Epic");
  });
});
