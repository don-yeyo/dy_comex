import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('07 - Flujo E2E Cobranzas, Tarjetas Métricas y Persistencia en DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
    await navigateTab(page, 'Cobranzas');
  });

  test('Debe visualizar las 3 tarjetas de resumen por encima de la grilla', async ({ page }) => {
    await expect(page.locator('text=Cobrado (')).toBeVisible();
    await expect(page.locator('text=Pendiente de Cobro')).toBeVisible();
    await expect(page.locator('text=Monto Vencido')).toBeVisible();
  });

  test('Ciclo de Vida Completo: Registrar Cobranza, Saldo Autocalculado, Verificar DB, Eliminar y Verificar DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const cobranzaRef = `Cobranza_E2E_${timestamp}`;

    // 1. Alta de Cobranza
    await page.locator('button:has-text("Nueva cobranza")').click();
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.fill('.modal-content input[placeholder*="Ej: Factura EX-2026-042"]', cobranzaRef);
    await page.locator('.modal-content input[placeholder="0.00"]').first().fill('15000');
    await page.locator('.modal-content input[placeholder="0.00"]').nth(1).fill('5000');

    // Verificar autocálculo de saldo pendiente ($10.000,00 USD)
    await expect(page.locator('.modal-content input[value*="10.000,00"]')).toBeVisible();

    await page.selectOption('.modal-content select:has-text("Don Yeyo")', 'Don Yeyo');
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI
    await expect(page.locator(`text=${cobranzaRef}`)).toBeVisible({ timeout: 10000 });

    // Verificación en DB (API)
    let apiRes = await request.get(`${API_BASE_URL}/cobranzas`);
    expect(apiRes.ok()).toBeTruthy();
    let dbCobranzas = await apiRes.json();
    let cobranzaInDB = dbCobranzas.find(c => c.descripcion === cobranzaRef);
    expect(cobranzaInDB).toBeDefined();
    expect(parseFloat(cobranzaInDB.monto)).toBe(15000);
    expect(parseFloat(cobranzaInDB.cobrado_monto)).toBe(5000);

    // 2. Eliminación con Modal
    const row = page.locator(`tr:has-text("${cobranzaRef}")`);
    await row.locator('button.icon-btn').last().click();

    await expect(page.locator('text=Confirmar eliminación')).toBeVisible();
    await page.locator('button:has-text("Eliminar")').click();

    // Verificación Eliminación en UI
    await expect(page.locator(`tr:has-text("${cobranzaRef}")`)).toHaveCount(0, { timeout: 10000 });

    // Verificación Eliminación en DB
    apiRes = await request.get(`${API_BASE_URL}/cobranzas`);
    dbCobranzas = await apiRes.json();
    cobranzaInDB = dbCobranzas.find(c => c.descripcion === cobranzaRef);
    expect(cobranzaInDB).toBeUndefined();
  });
});
