import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '設定して開始' }).click();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/ぽんこつSVGジェネレーター/);
});
