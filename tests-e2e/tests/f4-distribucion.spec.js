import { test, expect } from '../fixtures/test.fixture.js';
import { resetBaseline, getStocksSnapshot } from '../helpers/db.js';

test.describe('F4 - Traslado de Productos a Sedes (TD + VL)', () => {
  test.beforeEach(async ({ distribucionPage }) => {
    await resetBaseline({ invCentral: 20 });
    await distribucionPage.goto();
  });

  test('F4-CP-01 - Traslado valido parcial (Q=5 a Sede A)', async ({ distribucionPage }) => {
    const resp = await distribucionPage.distribuir('Champú vegano', 'Sede A', 5, 'TEST-F4-01');
    expect(resp.status()).toBe(201);

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(15);
    expect(snap.sedes['Sede A']).toBe(5);
  });

  test('F4-CP-02 - Limite superior exacto de stock (Q=20 a Sede A)', async ({ distribucionPage }) => {
    const resp = await distribucionPage.distribuir('Champú vegano', 'Sede A', 20, 'TEST-F4-02');
    expect(resp.status()).toBe(201);

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(0);
    expect(snap.sedes['Sede A']).toBe(20);
  });

  test('F4-CP-03 - Excede stock central por 1 unidad (Q=21)', async ({ distribucionPage }) => {
    await distribucionPage.llenarFormulario('Champú vegano', 'Sede A', 21, 'TEST-F4-03');
    await distribucionPage.click(distribucionPage.distribuirBtn);
    await expect(distribucionPage.errorBanner).toContainText('Stock insuficiente en central');

    const snap = await getStocksSnapshot();
    expect(snap.central['Champú vegano']).toBe(20);
    expect(snap.sedes['Sede A'] ?? 0).toBe(0);
  });

  test('F4-CP-05 - Suma acumulada al saldo previo de Sede B (3 + 4 = 7)', async ({ distribucionPage, page }) => {
    const resp1 = await distribucionPage.distribuir('Champú vegano', 'Sede B', 3, 'TEST-F4-05-A');
    expect(resp1.status()).toBe(201);

    const resp2 = await distribucionPage.distribuir('Champú vegano', 'Sede B', 4, 'TEST-F4-05-B');
    expect(resp2.status()).toBe(201);

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
    test(`${tc.id} - ${tc.title}`, async ({ distribucionPage }) => {
      const { isHtml5Valid, validationMessage, apiCalled } = await distribucionPage.intentarDistribuirInvalido(
        'Champú vegano',
        'Sede A',
        tc.q,
        `TEST-${tc.id}`
      );

      expect(isHtml5Valid).toBe(false);
      expect(validationMessage.length).toBeGreaterThan(0);
      expect(apiCalled).toBe(false);

      const snap = await getStocksSnapshot();
      expect(snap.central['Champú vegano']).toBe(20);
    });
  }
});
