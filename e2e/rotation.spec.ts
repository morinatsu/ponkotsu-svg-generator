// e2e/rotation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shape Rotation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '設定して開始' }).click();
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

    // 3. Move mouse to the top-right corner's rotation ring and check cursor for rotation
    await page.mouse.move(endPos.x + 20, startPos.y - 20);
    await expect(page.locator('body')).toHaveCSS('cursor', 'alias');

    // 4. Drag to rotate the shape
    await page.mouse.down();
    await page.mouse.move(endPos.x + 70, startPos.y + 30); // Rotate roughly 45 degrees
    await page.mouse.up();

    const transform = await shapeGroup.getAttribute('transform');
    expect(transform).not.toBeNull();
    expect(transform).toContain('rotate(');

    // 5. Verify the shape can still be selected and try dragging it

    // Ensure shape is selected again in case 'click' fired after 'setTimeout' cleared wasDraggedRef
    await shapeGroup.evaluate((node) =>
      node.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    );
    await expect(visibleRect).toHaveAttribute('stroke', 'blue');

    // Calculate the rotated top edge center to hover over the stroke safely
    const transformStr = (await shapeGroup.getAttribute('transform')) || '';
    const rotateMatch = transformStr.match(/rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/);

    // We drew at screen box.x + 100, meaning local X was 100.
    // The rectangle went from local (100,100) to (300,200).
    // The top middle in local coordinates is thus (200, 100).
    const localTopMidX = 200;
    const localTopMidY = 100;

    let newX = startPos.x + 100; // default screen
    let newY = startPos.y;
    if (rotateMatch) {
      const angleDeg = parseFloat(rotateMatch[1]);
      const cx = parseFloat(rotateMatch[2]);
      const cy = parseFloat(rotateMatch[3]);
      const angleRad = (angleDeg * Math.PI) / 180;
      const dx = localTopMidX - cx;
      const dy = localTopMidY - cy;
      const localNewX = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
      const localNewY = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

      newX = box.x + localNewX;
      newY = box.y + localNewY;
    }
    await page.mouse.move(newX, newY);
    await expect(page.locator('body')).toHaveCSS('cursor', 'move');

    await page.mouse.down();
    // Drag the shape by moving the mouse 50px right and down
    await page.mouse.move(newX + 50, newY + 50);
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
