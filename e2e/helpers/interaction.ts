import { Page, expect } from '@playwright/test';

/**
 * Common interaction helpers for E2E tests.
 * Encapsulates complex coordinate math and repetitive actions.
 */

export async function startApp(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '設定して開始' }).click();
  await expect(page.locator('svg')).toBeVisible();
}

export async function drawRectangle(
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  await page.getByRole('button', { name: '長方形' }).click();

  const canvas = page.locator('svg').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  await page.mouse.move(box.x + start.x, box.y + start.y);
  await page.mouse.down();
  await page.mouse.move(box.x + end.x, box.y + end.y);
  await page.mouse.up();
}

export async function addText(page: Page, position: { x: number; y: number }, text: string) {
  await page.getByRole('button', { name: 'テキスト' }).click();

  const canvas = page.locator('svg').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  await page.mouse.click(box.x + position.x, box.y + position.y);
  await expect(page.getByText('テキストを編集')).toBeVisible();

  await page.locator('textarea').fill(text);
  await page.getByRole('button', { name: 'OK' }).click();
}

export async function rotateShape(
  page: Page,
  initialStart: { x: number; y: number },
  initialEnd: { x: number; y: number },
  rotationOffset: { x: number; y: number },
) {
  const canvas = page.locator('svg').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');

  // Select the shape if not already selected
  await page.mouse.click(box.x + initialStart.x + 1, box.y + initialStart.y + 1);

  // Rotation ring is at top-right corner + offset
  const rotationRingPos = { x: box.x + initialEnd.x + 20, y: box.y + initialStart.y - 20 };

  await page.mouse.move(rotationRingPos.x, rotationRingPos.y);
  await expect(page.locator('body')).toHaveCSS('cursor', 'alias');

  await page.mouse.down();
  await page.mouse.move(rotationRingPos.x + rotationOffset.x, rotationRingPos.y + rotationOffset.y);
  await page.mouse.up();
}

export async function getShapeTransform(page: Page) {
  const shapeGroup = page.locator('[data-shape-id]').first();
  return await shapeGroup.getAttribute('transform');
}

export async function calculateRotatedPoint(
  localPoint: { x: number; y: number },
  transform: string | null,
): Promise<{ x: number; y: number } | null> {
  if (!transform) return null;

  const rotateMatch = transform.match(/rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/);
  if (!rotateMatch) return null;

  const angleDeg = parseFloat(rotateMatch[1]);
  const cx = parseFloat(rotateMatch[2]);
  const cy = parseFloat(rotateMatch[3]);

  const angleRad = (angleDeg * Math.PI) / 180;
  const dx = localPoint.x - cx;
  const dy = localPoint.y - cy;

  const rotatedX = cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
  const rotatedY = cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

  return { x: rotatedX, y: rotatedY };
}
