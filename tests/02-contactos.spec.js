import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('02 - Flujo E2E Contactos y Verificación de Persistencia en DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
    await navigateTab(page, 'Contactos y Clientes');
  });

  test('Debe validar campos requeridos en el alta de contacto', async ({ page }) => {
    await page.locator('button:has-text("Nuevo contacto")').click();
    await expect(page.locator('.modal-content')).toBeVisible();
    
    await page.locator('.modal-content button[type="submit"]').click();
    await expect(page.locator('.modal-content')).toBeVisible();
    await page.locator('.modal-content button:has-text("Cancelar")').click();
  });

  test('Ciclo de Vida Completo: Crear, Ver en DB, Editar, Ver en DB, Eliminar y Ver en DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const contactName = `Contacto_E2E_${timestamp}`;
    const initialEmpresa = `Empresa_Inicial_${timestamp}`;
    const updatedEmpresa = `Empresa_Editada_${timestamp}`;

    // 1. Alta de Contacto
    await page.locator('button:has-text("Nuevo contacto")').click();
    await page.fill('.modal-content input[placeholder*="Ej: Carlos"]', contactName);
    await page.fill('.modal-content input[placeholder*="Ej: Importadora del Sur"]', initialEmpresa);
    await page.fill('.modal-content input[type="email"]', `e2e_${timestamp}@donyeyo.com.ar`);
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI (Tabla de contactos)
    await expect(page.locator(`tr:has-text("${contactName}")`)).toBeVisible({ timeout: 10000 });

    // Verificación de Persistencia en DB (API)
    let apiRes = await request.get(`${API_BASE_URL}/contactos`);
    expect(apiRes.ok()).toBeTruthy();
    let dbContacts = await apiRes.json();
    let contactInDB = dbContacts.find(c => c.nombre === contactName);
    expect(contactInDB).toBeDefined();
    expect(contactInDB.empresa).toBe(initialEmpresa);

    // 2. Edición de Contacto
    const row = page.locator(`tr:has-text("${contactName}")`);
    await row.locator('button.icon-btn').first().click();
    await page.fill('.modal-content input[placeholder*="Ej: Importadora del Sur"]', updatedEmpresa);
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación Edición en UI
    await expect(page.locator(`tr:has-text("${updatedEmpresa}")`)).toBeVisible({ timeout: 10000 });

    // Verificación Edición en DB (API)
    apiRes = await request.get(`${API_BASE_URL}/contactos`);
    dbContacts = await apiRes.json();
    contactInDB = dbContacts.find(c => c.nombre === contactName);
    expect(contactInDB).toBeDefined();
    expect(contactInDB.empresa).toBe(updatedEmpresa);

    // 3. Eliminación con Confirmación Modal
    await row.locator('button.icon-btn').last().click();
    await expect(page.locator('text=Confirmar eliminación')).toBeVisible();
    await page.locator('button:has-text("Eliminar")').click();

    // Verificación Eliminación en UI
    await expect(page.locator(`tr:has-text("${contactName}")`)).toHaveCount(0, { timeout: 10000 });

    // Verificación Eliminación en DB (API)
    apiRes = await request.get(`${API_BASE_URL}/contactos`);
    dbContacts = await apiRes.json();
    contactInDB = dbContacts.find(c => c.nombre === contactName);
    expect(contactInDB).toBeUndefined();
  });
});
