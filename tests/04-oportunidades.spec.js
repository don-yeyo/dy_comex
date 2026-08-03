import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('04 - Flujo E2E Oportunidades Comerciales y Persistencia en DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
    await navigateTab(page, 'Oportunidades');
  });

  test('Ciclo de Vida Completo: Crear Oportunidad, Verificar DB, Eliminar y Verificar DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const oppTitle = `Oportunidad_E2E_${timestamp}`;

    // 1. Alta de Oportunidad
    await page.locator('button:has-text("Nueva oportunidad")').click();
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.fill('.modal-content input[placeholder*="Ej: Exportación Tapas"]', oppTitle);
    await page.selectOption('.modal-content select:has-text("En negociación")', 'En negociación');
    await page.selectOption('.modal-content select:has-text("50%")', '75%');
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI
    await expect(page.locator(`text=${oppTitle}`)).toBeVisible({ timeout: 10000 });

    // Verificación en DB (API)
    let apiRes = await request.get(`${API_BASE_URL}/oportunidades`);
    expect(apiRes.ok()).toBeTruthy();
    let dbOpps = await apiRes.json();
    let oppInDB = dbOpps.find(o => o.titulo === oppTitle);
    expect(oppInDB).toBeDefined();
    expect(oppInDB.etapa).toBe('En negociación');
    expect(oppInDB.probabilidad).toBe('75%');

    // 2. Eliminación con Modal
    const oppRow = page.locator(`tr:has-text("${oppTitle}")`);
    await oppRow.locator('button.icon-btn').last().click();

    await expect(page.locator('text=Confirmar eliminación')).toBeVisible();
    await page.locator('button:has-text("Eliminar")').click();

    // Verificación Eliminación en UI
    await expect(page.locator(`tr:has-text("${oppTitle}")`)).toHaveCount(0, { timeout: 10000 });

    // Verificación Eliminación en DB
    apiRes = await request.get(`${API_BASE_URL}/oportunidades`);
    dbOpps = await apiRes.json();
    oppInDB = dbOpps.find(o => o.titulo === oppTitle);
    expect(oppInDB).toBeUndefined();
  });
});
