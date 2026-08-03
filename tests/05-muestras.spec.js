import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('05 - Flujo E2E Muestras y Persistencia en DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
    await navigateTab(page, 'Muestras y Com.');
  });

  test('Ciclo de Vida Completo: Crear Muestra, Verificar DB, Eliminar y Verificar DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const sampleDestinatario = `Muestra_Cliente_${timestamp}`;

    // 1. Alta de Muestra
    await page.locator('button:has-text("Nueva muestra")').click();
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.fill('.modal-content input[placeholder*="Ej: Tapas de Empanadas"]', `Producto Muestra ${timestamp}`);
    await page.fill('.modal-content input[placeholder*="5 unidades, 3 cajas"]', '5 cajas demo');
    await page.locator('button:has-text("Agregar producto a la muestra")').click();

    await page.fill('.modal-content input[placeholder*="Ej: Juan Pérez"]', sampleDestinatario);
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI
    await expect(page.locator(`text=${sampleDestinatario}`)).toBeVisible({ timeout: 10000 });

    // Verificación en DB (API)
    let apiRes = await request.get(`${API_BASE_URL}/muestras`);
    expect(apiRes.ok()).toBeTruthy();
    let dbMuestras = await apiRes.json();
    let sampleInDB = dbMuestras.find(m => m.destinatario === sampleDestinatario);
    expect(sampleInDB).toBeDefined();

    // 2. Eliminación con Modal
    const sampleContainer = page.locator(`div:has-text("${sampleDestinatario}")`).last();
    await sampleContainer.locator('button.icon-btn').last().click();

    await expect(page.locator('text=Confirmar eliminación')).toBeVisible();
    await page.locator('button:has-text("Eliminar")').click();

    // Verificación Eliminación en UI
    await expect(page.locator(`text=${sampleDestinatario}`)).toHaveCount(0, { timeout: 10000 });

    // Verificación Eliminación en DB
    apiRes = await request.get(`${API_BASE_URL}/muestras`);
    dbMuestras = await apiRes.json();
    sampleInDB = dbMuestras.find(m => m.destinatario === sampleDestinatario);
    expect(sampleInDB).toBeUndefined();
  });
});
