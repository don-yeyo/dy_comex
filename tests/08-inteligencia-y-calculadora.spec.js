import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('08 - Flujo E2E Inteligencia Comercial y Calculadora Landed', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('Debe registrar un precio de competidor con autocálculo de Precio/kg y verificar en DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const competidorName = `Competidor_E2E_${timestamp}`;

    await navigateTab(page, 'Inteligencia Comercial');
    await page.locator('button:has-text("Registrar precio")').click();
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.fill('.modal-content input[placeholder*="Ej: Bauducco"]', competidorName);
    await page.fill('.modal-content input[placeholder*="Ej: Lasagna 500g"]', 'Galletas 400g');
    await page.fill('.modal-content input[placeholder*="Ej: 3.50"]', '4.00');
    await page.fill('.modal-content input[placeholder*="Ej: 0.500"]', '0.500');

    // Verificar autocálculo de Precio/kg ($8.00 USD / kg)
    await expect(page.locator('.modal-content input[value*="8.00 USD / kg"]')).toBeVisible();

    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI
    await expect(page.locator(`text=${competidorName}`)).toBeVisible({ timeout: 10000 });

    // Verificación en DB (API)
    const apiRes = await request.get(`${API_BASE_URL}/precios`);
    expect(apiRes.ok()).toBeTruthy();
    const dbPrecios = await apiRes.json();
    const priceInDB = dbPrecios.find(p => p.competidor === competidorName);

    expect(priceInDB).toBeDefined();
    expect(parseFloat(priceInDB.precio)).toBe(4.00);
    expect(parseFloat(priceInDB.peso)).toBe(0.5);
  });

  test('Debe usar la Calculadora de Costos Landed y verificar cálculo en tiempo real', async ({ page }) => {
    const timestamp = Date.now();
    await navigateTab(page, 'Calculadora Landed');
    await expect(page.locator('text=Calculadora de Costos Landed')).toBeVisible();

    await page.locator('.calc-layout-grid input[placeholder*="Ej: Tapas Don Yeyo"]').first().fill(`Calculo_E2E_${timestamp}`);
    await page.locator('.calc-layout-grid input[placeholder="0.00"]').first().fill('2.50'); // FOB
    await page.locator('.calc-layout-grid input[placeholder="1"]').first().fill('1000'); // Cantidad

    // Verificar que el desglose FOB total es $2.500,00 USD
    await expect(page.locator('text=$2.500,00 USD').first()).toBeVisible();
  });
});
