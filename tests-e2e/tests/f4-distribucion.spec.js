import { test, expect } from '@playwright/test';
import { resetBaseline, getStocksSnapshot } from '../helpers/db.js';

test.describe('F4 - Traslado de Productos a Sedes (TD + VL)', () => {
  test('F4-CP-01 - Traslado valido parcial (Q=5 a Sede A)', async ({ page }) => {
    await resetBaseline({ invCentral: 20 });
    await page.goto('/distribucion');

    await page.locator('form select').nth(0).selectOption({ label: 'Champú vegano' });
    await page.locator('form select').nth(1).selectOption({ label: 'Sede A' });
    await page.locator('form input[type="number"]').fill('5');
    await page.locator('form input[placeholder="Referencia"]').fill('TEST-F4-01');

    const respPromise = page.waitForResponse(
      (res) => res.url().includes('/api/inventario/distribuciones') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Distribuir' }).click();
    expect((await respPromise).status()).toBe(201);

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(15);
    expect(snap.sedes['Sede A']).toBe(5);
  });

  test('F4-CP-02 - Limite superior exacto de stock (Q=20 a Sede A)', async ({ page }) => {
    await resetBaseline({ invCentral: 20 });
    await page.goto('/distribucion');

    await page.locator('form select').nth(0).selectOption({ label: 'Champú vegano' });
    await page.locator('form select').nth(1).selectOption({ label: 'Sede A' });
    await page.locator('form input[type="number"]').fill('20');
    await page.locator('form input[placeholder="Referencia"]').fill('TEST-F4-02');

    const respPromise = page.waitForResponse(
      (res) => res.url().includes('/api/inventario/distribuciones') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Distribuir' }).click();
    expect((await respPromise).status()).toBe(201);

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(0);
    expect(snap.sedes['Sede A']).toBe(20);
  });

  test('F4-CP-03 - Excede stock central por 1 unidad (Q=21)', async ({ page }) => {
    await resetBaseline({ invCentral: 20 });
    await page.goto('/distribucion');

    await page.locator('form select').nth(0).selectOption({ label: 'Champú vegano' });
    await page.locator('form select').nth(1).selectOption({ label: 'Sede A' });
    await page.locator('form input[type="number"]').fill('21');
    await page.locator('form input[placeholder="Referencia"]').fill('TEST-F4-03');

    await page.getByRole('button', { name: 'Distribuir' }).click();
    await expect(page.locator('.error-msg')).toContainText('Stock insuficiente en central');

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(20);
    expect(snap.sedes['Sede A'] ?? 0).toBe(0);
  });

  test('F4-CP-05 - Suma acumulada al saldo previo de Sede B (3 + 4 = 7)', async ({ page }) => {
    await resetBaseline({ invCentral: 20 });
    await page.goto('/distribucion');

    // Primer traslado: 3 a Sede B
    await page.locator('form select').nth(0).selectOption({ label: 'Champú vegano' });
    await page.locator('form select').nth(1).selectOption({ label: 'Sede B' });
    await page.locator('form input[type="number"]').fill('3');
    await page.locator('form input[placeholder="Referencia"]').fill('TEST-F4-05-A');
    const resp1 = page.waitForResponse((res) => res.url().includes('/api/inventario/distribuciones'));
    await page.getByRole('button', { name: 'Distribuir' }).click();
    expect((await resp1).status()).toBe(201);

    // Segundo traslado: 4 a Sede B
    await page.locator('form select').nth(0).selectOption({ label: 'Champú vegano' });
    await page.locator('form select').nth(1).selectOption({ label: 'Sede B' });
    await page.locator('form input[type="number"]').fill('4');
    await page.locator('form input[placeholder="Referencia"]').fill('TEST-F4-05-B');
    const resp2 = page.waitForResponse((res) => res.url().includes('/api/inventario/distribuciones'));
    await page.getByRole('button', { name: 'Distribuir' }).click();
    expect((await resp2).status()).toBe(201);

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(13);
    expect(snap.sedes['Sede B']).toBe(7);

    await page.goto('/inventario');
    await expect(page.locator('table tbody tr', { hasText: 'Sede B' }).first()).toContainText('7');
  });

  const invalidDistCases = [
    { id: 'F4-CP-04', title: 'Rechazo por cantidad decimal (Q=2.5)', q: '2.5' },
    { id: 'F4-CP-06', title: 'Rechazo por cantidad cero (Q=0)', q: '0' },
    { id: 'F4-CP-07', title: 'Rechazo por cantidad negativa (Q=-5)', q: '-5' }
  ];

  for (const tc of invalidDistCases) {
    test(`${tc.id} - ${tc.title}`, async ({ page }) => {
      await resetBaseline({ invCentral: 20 });
      await page.goto('/distribucion');

      await page.locator('form select').nth(0).selectOption({ label: 'Champú vegano' });
      await page.locator('form select').nth(1).selectOption({ label: 'Sede A' });
      const qtyInput = page.locator('form input[type="number"]');
      await qtyInput.fill(tc.q);
      await page.locator('form input[placeholder="Referencia"]').fill(`TEST-${tc.id}`);

      let apiCalled = false;
      page.on('request', (req) => {
        if (req.url().includes('/api/inventario/distribuciones')) apiCalled = true;
      });

      await page.getByRole('button', { name: 'Distribuir' }).click();

      const isValid = await qtyInput.evaluate((el) => el.checkValidity());
      expect(isValid).toBe(false);
      expect(apiCalled).toBe(false);

      const snap = await getStocksSnapshot();
      expect(snap.central['Champú vegano']).toBe(20);
    });
  }
});
