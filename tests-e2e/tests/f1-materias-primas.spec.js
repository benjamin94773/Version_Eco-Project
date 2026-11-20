import { test, expect } from '@playwright/test';
import { resetBaseline, getStocksSnapshot } from '../helpers/db.js';

test.describe('F1 - Gestion de Materia Prima (TD + VL)', () => {
  async function submitNuevaMateria(page, { nombre, unidad = 'kg', cantidad, minimo = '1' }) {
    await page.getByRole('button', { name: 'Nueva Materia Prima' }).click();
    await page.locator('form input[placeholder*="Aloe Vera"]').fill(nombre);
    await page.locator('form select').selectOption(unidad);
    await page.locator('form input[placeholder*="100"]').fill(String(cantidad));
    await page.locator('form input[placeholder*="20"]').fill(String(minimo));

    const respPromise = page.waitForResponse(
      (res) => res.url().includes('/api/materias-primas') && res.request().method() === 'POST',
      { timeout: 5000 }
    ).catch(() => null);

    await page.getByRole('button', { name: 'Crear Materia Prima' }).click();
    return await respPromise;
  }

  test('F1-CP-01 - Alta valida de materia prima (Aceite de coco, lt, 20)', async ({ page }) => {
    await resetBaseline({ includeAceite: false, includeFormula: false });
    await page.goto('/materias-primas');

    const resp = await submitNuevaMateria(page, {
      nombre: 'Aceite de coco',
      unidad: 'lt',
      cantidad: '20'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(201);
    await expect(page.locator('table tbody')).toContainText('Aceite de coco');

    const snap = await getStocksSnapshot();
    expect(snap.materias['Aceite de coco']).toBe(20);
  });

  test('F1-CP-02 - Rechazo por nombre duplicado exacto ("Aloe vera")', async ({ page }) => {
    await resetBaseline();
    await page.goto('/materias-primas');

    const resp = await submitNuevaMateria(page, {
      nombre: 'Aloe vera',
      unidad: 'kg',
      cantidad: '5'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(409);
    await expect(page.locator('.error-msg')).toContainText('Registro duplicado');
  });

  test('F1-CP-03 - Regresion DEF-01: Rechazo de duplicado con minusculas y espacio ("aloe vera ")', async ({ page }) => {
    await resetBaseline();
    await page.goto('/materias-primas');

    const resp = await submitNuevaMateria(page, {
      nombre: 'aloe vera ',
      unidad: 'kg',
      cantidad: '5'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(409);
    await expect(page.locator('.error-msg')).toContainText('Registro duplicado');
  });

  test('F1-CP-04 - Valor limite superior exacto permitido (Glicerina, 50 kg)', async ({ page }) => {
    await resetBaseline();
    await page.goto('/materias-primas');

    const resp = await submitNuevaMateria(page, {
      nombre: 'Glicerina',
      unidad: 'kg',
      cantidad: '50'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(201);
    await expect(page.locator('table tbody')).toContainText('Glicerina');

    const snap = await getStocksSnapshot();
    expect(snap.materias['Glicerina']).toBe(50);
  });

  test('F1-CP-05 - Valor limite sobre el tope maximo RN-04 (Glicerina, 50.01 kg)', async ({ page }) => {
    await resetBaseline();
    await page.goto('/materias-primas');

    const resp = await submitNuevaMateria(page, {
      nombre: 'Glicerina',
      unidad: 'kg',
      cantidad: '50.01'
    });

    // Segun RN-04, el sistema debe rechazar valores > 50 (bloqueo en UI o status >= 400 en API)
    if (resp !== null) {
      expect(resp.status(), 'RN-04 violada: API acepto cantidad 50.01 > 50').toBeGreaterThanOrEqual(400);
    }
    const snap = await getStocksSnapshot();
    expect(snap.materias['Glicerina']).toBeUndefined();
  });

  test('F1-CP-06 - Rechazo de cantidad negativa (-1 kg)', async ({ page }) => {
    await resetBaseline();
    await page.goto('/materias-primas');

    const resp = await submitNuevaMateria(page, {
      nombre: 'Glicerina',
      unidad: 'kg',
      cantidad: '-1'
    });

    // Debe rechazarse y no insertarse en BD
    if (resp !== null) {
      expect(resp.status()).toBeGreaterThanOrEqual(400);
    }
    const snap = await getStocksSnapshot();
    expect(snap.materias['Glicerina']).toBeUndefined();
  });
});
