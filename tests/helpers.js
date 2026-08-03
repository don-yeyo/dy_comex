import { expect } from '@playwright/test';

export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Inicia sesión utilizando el modo Demo / Test E2E automático en entorno local.
 */
export async function loginDemo(page) {
  await page.goto('/');
  const demoBtn = page.locator('#btn-login-demo');
  if (await demoBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await demoBtn.click();
  }
  await expect(page.locator('.sidebar')).toBeVisible({ timeout: 15000 });
  await page.waitForSelector('.loading-spinner', { state: 'detached', timeout: 15000 }).catch(() => {});
}

/**
 * Navega a la pestaña indicada en la barra lateral.
 */
export async function navigateTab(page, tabTitle) {
  const navBtn = page.locator(`.sidebar button:has-text("${tabTitle}")`).first();
  await navBtn.click();
  await page.waitForTimeout(300);
}
