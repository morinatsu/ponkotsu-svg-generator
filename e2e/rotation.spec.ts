// e2e/rotation.spec.ts
import { test, expect } from '@playwright/test';
import {
  startApp,
  drawRectangle,
  addText,
  rotateShape,
  getShapeTransform,
  calculateRotatedPoint,
} from './helpers/interaction';

test.describe('Shape Rotation', () => {
  test.beforeEach(async ({ page }) => {
    await startApp(page);
  });

  test('should rotate a rectangle shape and then drag it', async ({ page }) => {
    // 1. Draw a rectangle
    const start = { x: 100, y: 100 };
    const end = { x: 300, y: 200 };
    await drawRectangle(page, start, end);

    // 2. Select the shape and verify selection
    const shapeGroup = page.locator('[data-shape-id]').first();
    const visibleRect = shapeGroup.locator('rect').first();

    const canvas = page.locator('svg').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.click(box.x + start.x + 1, box.y + start.y + 1);
    await expect(visibleRect).toHaveAttribute('stroke', 'blue');

    // 3. Rotate the shape
    const initialTransform = await getShapeTransform(page);
    await rotateShape(page, start, end, { x: 50, y: 50 });

    const transform = await getShapeTransform(page);
    expect(transform).not.toBeNull();
    expect(transform).toContain('rotate(');
    expect(transform).not.toEqual(initialTransform);

    // 4. Verify the shape can still be selected and try dragging it
    // Ensure shape is selected again
    await shapeGroup.evaluate((node) =>
      node.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    );
    await expect(visibleRect).toHaveAttribute('stroke', 'blue');

    // Calculate the rotated top edge center to hover over the stroke safely
    // The top middle in local coordinates is thus (200, 100).
    const localTopMid = { x: 200, y: 100 };
    const rotatedPoint = await calculateRotatedPoint(localTopMid, transform);

    if (rotatedPoint) {
      const screenX = box.x + rotatedPoint.x;
      const screenY = box.y + rotatedPoint.y;

      await page.mouse.move(screenX, screenY);
      await expect(page.locator('body')).toHaveCSS('cursor', 'move');

      await page.mouse.down();
      await page.mouse.move(screenX + 50, screenY + 50);
      await page.mouse.up();

      const finalTransform = await getShapeTransform(page);
      expect(finalTransform).not.toEqual(transform);
    }
  });

  test('should not show rotation cursor for text', async ({ page }) => {
    const textPos = { x: 150, y: 150 };
    await addText(page, textPos, 'Hello');

    const shapeGroup = page.locator('[data-shape-id]').first();
    await shapeGroup.click({ force: true });

    const textBbox = await shapeGroup.boundingBox();
    expect(textBbox).not.toBeNull();
    await page.mouse.move(textBbox!.x, textBbox!.y);

    await expect(page.locator('body')).toHaveCSS('cursor', 'move');
  });
});
