import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab, API_BASE_URL } from './helpers.js';

test.describe('03 - Flujo E2E Tareas y Sincronización en DB', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
    await navigateTab(page, 'Tareas');
  });

  test('Ciclo de Vida Completo: Crear Tarea, Alternar Estado, Eliminar y Verificar DB', async ({ page, request }) => {
    const timestamp = Date.now();
    const taskTitle = `Tarea_E2E_${timestamp}`;

    // 1. Alta de Tarea
    await page.locator('button:has-text("Nueva tarea")').click();
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.fill('.modal-content input[required]', taskTitle);
    await page.locator('.modal-content button[type="submit"]').click();

    // Verificación en UI
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 10000 });

    // Verificación en DB (API)
    let apiRes = await request.get(`${API_BASE_URL}/tareas`);
    expect(apiRes.ok()).toBeTruthy();
    let dbTareas = await apiRes.json();
    let taskInDB = dbTareas.find(t => t.titulo === taskTitle);
    expect(taskInDB).toBeDefined();
    expect(taskInDB.status).toBe('pendiente');

    // 2. Alternar Estado a Hecha
    const taskCard = page.locator(`.task-item:has-text("${taskTitle}")`);
    await taskCard.locator('input[type="checkbox"]').click();

    // Verificación en DB
    await page.waitForTimeout(500);
    apiRes = await request.get(`${API_BASE_URL}/tareas`);
    dbTareas = await apiRes.json();
    taskInDB = dbTareas.find(t => t.titulo === taskTitle);
    expect(taskInDB).toBeDefined();
    expect(taskInDB.status).toBe('hecha');

    // 3. Eliminación con Modal
    await taskCard.locator('button[title="Eliminar"]').click();
    await expect(page.locator('text=Confirmar eliminación')).toBeVisible();
    await page.locator('.modal-footer button:has-text("Eliminar")').click();

    // Verificación Eliminación en UI
    await expect(page.locator(`.task-item:has-text("${taskTitle}")`)).toHaveCount(0, { timeout: 10000 });

    // Verificación Eliminación en DB
    apiRes = await request.get(`${API_BASE_URL}/tareas`);
    dbTareas = await apiRes.json();
    taskInDB = dbTareas.find(t => t.titulo === taskTitle);
    expect(taskInDB).toBeUndefined();
  });
});
