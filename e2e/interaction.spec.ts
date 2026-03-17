import { test, expect } from '@playwright/test';
import { startApp, drawRectangle, addText } from './helpers/interaction';

test.describe('Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
  });

  test('should draw a rectangle', async ({ page }) => {
    await drawRectangle(page, { x: 100, y: 100 }, { x: 200, y: 200 });

    // Verify rectangle exists
    const rect = page.locator('svg rect').first();
    await expect(rect).toBeVisible();

    // Check dimensions
    const width = await rect.getAttribute('width');
    const height = await rect.getAttribute('height');
    expect(Number(width)).toBeCloseTo(100, 0);
    expect(Number(height)).toBeCloseTo(100, 0);
  });

  test('should drag a shape', async ({ page }) => {
    // Draw a rectangle first
    await drawRectangle(page, { x: 100, y: 100 }, { x: 150, y: 150 });

    const rect = page.locator('svg rect').first();
    const initialX = await rect.getAttribute('x');
    const initialY = await rect.getAttribute('y');

    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Drag the rectangle
    // Click on the border (stroke) to grab it, as fill is none
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200); // Move by 100, 100
    await page.mouse.up();

    // Verify position changed
    const newX = await rect.getAttribute('x');
    const newY = await rect.getAttribute('y');

    expect(Number(newX)).toBeGreaterThan(Number(initialX));
    expect(Number(newY)).toBeGreaterThan(Number(initialY));
  });

  test('should add text', async ({ page }) => {
    await addText(page, { x: 300, y: 300 }, 'Hello Playwright');

    // Verify text exists on canvas
    const textElement = page.locator('svg text').first();
    await expect(textElement).toBeVisible();
    await expect(textElement).toHaveText('Hello Playwright');
  });
});
