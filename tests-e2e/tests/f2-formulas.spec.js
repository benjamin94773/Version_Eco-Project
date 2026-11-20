import { test, expect } from '@playwright/test';
import { resetBaseline, pool } from '../helpers/db.js';

test.describe('F2 - Creacion de Formulas (TD)', () => {
  test('F2-CP-01 - Formula valida con multiples materias primas (Aloe 0.5 + Aceite 0.2)', async ({ page }) => {
    const { prodId, mpAId, mpBId } = await resetBaseline({ includeFormula: false });
    await page.goto('/productos');

    await page.locator('tr', { hasText: 'Champú vegano' }).getByRole('button', { name: 'Configurar' }).click();
    await expect(page.locator('h3')).toContainText(`Formula del producto #${prodId}`);

    await page.getByRole('button', { name: 'Agregar Materia Prima' }).click();
    await page.getByRole('button', { name: 'Agregar Materia Prima' }).click();

    const rows = page.locator('.formula-row');
    await rows.nth(0).locator('select').selectOption(String(mpAId));
    await rows.nth(0).locator('input[type="number"]').fill('0.5');

    await rows.nth(1).locator('select').selectOption(String(mpBId));
    await rows.nth(1).locator('input[type="number"]').fill('0.2');

    const dialogPromise = page.waitForEvent('dialog');
    const respPromise = page.waitForResponse(
      (res) => res.url().includes(`/api/productos/${prodId}/formula`) && res.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Guardar Formula' }).click();
    const [resp, dialog] = await Promise.all([respPromise, dialogPromise]);
    const dialogMessage = dialog.message();
    await dialog.accept();

    expect(resp.status()).toBe(200);
    expect(dialogMessage).toContain('Formula guardada');

    const dbRes = await pool.query(
      'SELECT materia_prima_id, cantidad_requerida::float AS cant FROM detalle_formula WHERE producto_id = $1 ORDER BY materia_prima_id',
      [prodId]
    );
    expect(dbRes.rowCount).toBe(2);
  });

  test('F2-CP-02 - Rechazo al guardar formula sin materias primas (RN-08)', async ({ page }) => {
    const { prodId } = await resetBaseline({ includeFormula: false });
    await page.goto('/productos');

    await page.locator('tr', { hasText: 'Champú vegano' }).getByRole('button', { name: 'Configurar' }).click();

    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    const respPromise = page.waitForResponse(
      (res) => res.url().includes(`/api/productos/${prodId}/formula`) && res.request().method() === 'PUT',
      { timeout: 4000 }
    ).catch(() => null);

    await page.getByRole('button', { name: 'Guardar Formula' }).click();
    const resp = await respPromise;

    // Segun RN-08, NO debe permitir guardar una formula vacia
    if (resp !== null) {
      expect(resp.status(), 'RN-08 violada: el sistema acepto HTTP 200 al guardar una formula vacia').toBeGreaterThanOrEqual(400);
    }
    expect(dialogMessage, 'RN-08 violada: el sistema mostro alerta de exito al guardar formula vacia').not.toContain('Formula guardada');
    await expect(page.locator('.error-msg')).toBeVisible();
  });

  test('F2-CP-03 - Rechazo por materia prima repetida en la misma formula (RN-14)', async ({ page }) => {
    const { prodId, mpAId } = await resetBaseline({ includeFormula: false });
    await page.goto('/productos');

    await page.locator('tr', { hasText: 'Champú vegano' }).getByRole('button', { name: 'Configurar' }).click();

    await page.getByRole('button', { name: 'Agregar Materia Prima' }).click();
    await page.getByRole('button', { name: 'Agregar Materia Prima' }).click();

    const rows = page.locator('.formula-row');
    await rows.nth(0).locator('select').selectOption(String(mpAId));
    await rows.nth(0).locator('input[type="number"]').fill('0.5');

    await rows.nth(1).locator('select').selectOption(String(mpAId));
    await rows.nth(1).locator('input[type="number"]').fill('0.3');

    const respPromise = page.waitForResponse(
      (res) => res.url().includes(`/api/productos/${prodId}/formula`) && res.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Guardar Formula' }).click();
    const resp = await respPromise;

    expect(resp.status()).toBe(409);
    await expect(page.locator('.error-msg')).toContainText('Registro duplicado');
  });

  test('F2-CP-04 - Rechazo por cantidad requerida en 0 (RN-08)', async ({ page }) => {
    const { prodId, mpAId } = await resetBaseline({ includeFormula: false });
    await page.goto('/productos');

    await page.locator('tr', { hasText: 'Champú vegano' }).getByRole('button', { name: 'Configurar' }).click();
    await page.getByRole('button', { name: 'Agregar Materia Prima' }).click();

    const row = page.locator('.formula-row').first();
    await row.locator('select').selectOption(String(mpAId));
    await row.locator('input[type="number"]').fill('0');

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/formula') && req.method() === 'PUT') apiCalled = true;
    });

    await page.getByRole('button', { name: 'Guardar Formula' }).click();

    await expect(page.locator('.error-msg')).toContainText('Todas las cantidades deben ser mayores a cero');
    expect(apiCalled).toBe(false);
  });
});
