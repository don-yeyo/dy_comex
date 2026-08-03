import { test, expect } from '@playwright/test';
import { loginDemo, navigateTab } from './helpers.js';

test.describe('01 - Navegación Principal y Estructura de Pantallas', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('Debe cargar el Dashboard y mostrar tarjetas estadísticas principales', async ({ page }) => {
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Clientes / Contactos Activos').first()).toBeVisible({ timeout: 15000 });
  });

  test('Debe navegar a todas las secciones del menú lateral', async ({ page }) => {
    const tabs = [
      { name: 'Tareas', expectedText: 'Gestión de Tareas' },
      { name: 'Agenda / Calendario', expectedText: 'Agenda' },
      { name: 'Contactos', expectedText: 'Directorio de Contactos' },
      { name: 'Visitas', expectedText: 'Visitas' },
      { name: 'Oportunidades', expectedText: 'Oportunidades' },
      { name: 'Operaciones', expectedText: 'Operaciones' },
      { name: 'Muestras', expectedText: 'Envío de Muestras' },
      { name: 'Países destino', expectedText: 'Países' },
      { name: 'Inteligencia Comercial', expectedText: 'Inteligencia' },
      { name: 'Cobranzas', expectedText: 'Control de Cobranzas' },
      { name: 'Calculadora Landed', expectedText: 'Calculadora' },
      { name: 'Alertas', expectedText: 'Alertas' }
    ];

    for (const t of tabs) {
      await navigateTab(page, t.name);
      await expect(page.locator(`text=${t.expectedText}`).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
