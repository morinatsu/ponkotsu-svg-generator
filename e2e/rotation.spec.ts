// e2e/rotation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shape Rotation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg');
  });

  test('should rotate a rectangle shape and then drag it', async ({ page }) => {
    // 1. Draw a rectangle
    await page.getByRole('button', { name: '長方形' }).click();
    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    const startPos = { x: box.x + 100, y: box.y + 100 };
    const endPos = { x: box.x + 300, y: box.y + 200 };

    await page.mouse.move(startPos.x, startPos.y);
    await page.mouse.down();
    await page.mouse.move(endPos.x, endPos.y);
    await page.mouse.up();

    // 2. Select the shape and verify selection
    const shapeGroup = page.locator('[data-shape-id]');
    const visibleRect = shapeGroup.locator('rect').first();
    await page.mouse.click(startPos.x + 1, startPos.y + 1);
    await expect(visibleRect).toHaveAttribute('stroke', 'blue');

    // 3. Move mouse to the top-right corner and check cursor for rotation
    await page.mouse.move(endPos.x, startPos.y);
    await expect(page.locator('body')).toHaveCSS('cursor', 'alias');

    // 4. Drag to rotate the shape
    await page.mouse.down();
    await page.mouse.move(endPos.x + 50, startPos.y + 50); // Rotate roughly 45 degrees
    await page.mouse.up();

    const transform = await shapeGroup.getAttribute('transform');
    expect(transform).not.toBeNull();
    expect(transform).toContain('rotate(');

    // 5. Verify the shape is still selected and try dragging it
    await expect(visibleRect).toHaveAttribute('stroke', 'blue');
    const initialCenter = { x: (startPos.x + endPos.x) / 2, y: (startPos.y + endPos.y) / 2 };
    await page.mouse.move(initialCenter.x, initialCenter.y);
    await expect(page.locator('body')).toHaveCSS('cursor', 'move');

    await page.mouse.down();
    await page.mouse.move(initialCenter.x + 50, initialCenter.y + 50);
    await page.mouse.up();

    const finalTransform = await shapeGroup.getAttribute('transform');
    expect(finalTransform).not.toEqual(transform); // Transform should have changed due to drag
  });

  test('should not show rotation cursor for text', async ({ page }) => {
    await page.getByRole('button', { name: 'テキスト' }).click();
    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.click(box.x + 150, box.y + 150);
    await expect(page.getByText('テキストを編集')).toBeVisible();
    await page.locator('textarea').fill('Hello');
    await page.getByRole('button', { name: 'OK' }).click();

    await page.locator('[data-shape-id]').click({ force: true }); // Use force to avoid actionability checks
    const textBbox = await page.locator('[data-shape-id]').boundingBox();
    expect(textBbox).not.toBeNull();
    await page.mouse.move(textBbox!.x, textBbox!.y);

    await expect(page.locator('body')).toHaveCSS('cursor', 'move');
  });
});
