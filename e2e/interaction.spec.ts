import { test, expect } from '@playwright/test';

test.describe('Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '設定して開始' }).click();
  });

  test('should draw a rectangle', async ({ page }) => {
    // Select rectangle tool by text
    await page.getByRole('button', { name: '長方形' }).click();

    // Draw a rectangle
    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

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
    await page.getByRole('button', { name: '長方形' }).click();
    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.up();

    const rect = page.locator('svg rect').first();
    const initialX = await rect.getAttribute('x');
    const initialY = await rect.getAttribute('y');

    // Drag the rectangle
    // Click on the border (stroke) to grab it, as fill is none
    // The rect is at (100, 100). We click exactly there.
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
    // Select text tool
    await page.getByRole('button', { name: 'テキスト' }).click();

    // Click on canvas to open modal
    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.click(box.x + 300, box.y + 300);

    // Wait for modal
    await expect(page.getByText('テキストを編集')).toBeVisible();

    // Type text
    const input = page.locator('textarea');
    await input.fill('Hello Playwright');

    // Click OK
    await page.getByRole('button', { name: 'OK' }).click();

    // Verify text exists on canvas
    const textElement = page.locator('svg text').first();
    await expect(textElement).toBeVisible();
    await expect(textElement).toHaveText('Hello Playwright');
  });
});
