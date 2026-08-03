import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('06 - Flujo E2E Países y Persistencia en DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
    await navigateTab(page, 'Países destino');
  });

  test('Ciclo de Vida Completo: Crear País, Verificar DB, Eliminar y Verificar DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const countryName = `Pais_E2E_${timestamp}`;

    // 1. Alta de País
    await page.locator('button:has-text("Agregar país")').click();
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.fill('.modal-content input[placeholder*="Ej: Brasil"]', countryName);
    await page.fill('.modal-content input[placeholder*="Ej: 1905.90.90"]', '1905.90.90');
    await page.selectOption('.modal-content select:has-text("FOB")', 'FOB');
    await page.fill('.modal-content input[placeholder*="Ej: ANVISA"]', 'ANVISA Test');
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI (.country-card)
    await expect(page.locator(`.country-card:has-text("${countryName}")`)).toBeVisible({ timeout: 10000 });

    // Verificación en DB (API)
    let apiRes = await request.get(`${API_BASE_URL}/paises`);
    expect(apiRes.ok()).toBeTruthy();
    let dbPaises = await apiRes.json();
    let countryInDB = dbPaises.find(p => p.nombre === countryName);
    expect(countryInDB).toBeDefined();
    expect(countryInDB.ncm).toBe('1905.90.90');
    expect(countryInDB.sanitario).toBe('ANVISA Test');

    // 2. Eliminación con Modal
    const countryCard = page.locator(`.country-card:has-text("${countryName}")`);
    await countryCard.locator('button.icon-btn').last().click();

    await expect(page.locator('text=Confirmar eliminación')).toBeVisible();
    await page.locator('button:has-text("Eliminar")').click();

    // Verificación Eliminación en UI
    await expect(page.locator(`.country-card:has-text("${countryName}")`)).toHaveCount(0, { timeout: 10000 });

    // Verificación Eliminación en DB
    apiRes = await request.get(`${API_BASE_URL}/paises`);
    dbPaises = await apiRes.json();
    countryInDB = dbPaises.find(p => p.nombre === countryName);
    expect(countryInDB).toBeUndefined();
  });
});
