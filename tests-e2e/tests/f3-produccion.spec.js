import { test, expect } from '../fixtures/test.fixture.js';
import { resetBaseline, getStocksSnapshot } from '../helpers/db.js';

test.describe('F3 - Registro de Produccion Centralizada (AO L9 + TD)', () => {
  const aoCases = [
    {
      id: 'F3-CP-01',
      title: 'AO1 + R3: Produccion valida sin alertas (Q=10)',
      initial: { stockA: 10, stockB: 7, stockC: 6 },
      q: '10',
      shouldSucceed: true,
      expected: { A: 5, B: 5, C: 5, central: 10 },
      expectedAlerts: []
    },
    {
      id: 'F3-CP-02',
      title: 'AO2 + R4: Produccion valida al limite con alertas en B y C (Q=25)',
      initial: { stockA: 17.5, stockB: 5, stockC: 2.5 },
      q: '25',
      shouldSucceed: true,
      expected: { A: 5, B: 0, C: 0, central: 25 },
      expectedAlerts: ['Aceite de coco', 'Romero']
    },
    {
      id: 'F3-CP-03',
      title: 'AO3 + R2: Rechazo atomico por insuficiencia de B y C (Q=1)',
      initial: { stockA: 5.5, stockB: 0.15, stockC: 0.05 },
      q: '1',
      shouldSucceed: false,
      expected: { A: 5.5, B: 0.15, C: 0.05, central: 0 }
    },
    {
      id: 'F3-CP-04',
      title: 'AO4 + R2: Rechazo atomico por insuficiencia de C sin descuento parcial (Q=10)',
      initial: { stockA: 5, stockB: 2, stockC: 0.95 },
      q: '10',
      shouldSucceed: false,
      expected: { A: 5, B: 2, C: 0.95, central: 0 }
    },
    {
      id: 'F3-CP-05',
      title: 'AO5 + R2: Rechazo atomico por insuficiencia de B (Q=25)',
      initial: { stockA: 12.5, stockB: 4.95, stockC: 7.5 },
      q: '25',
      shouldSucceed: false,
      expected: { A: 12.5, B: 4.95, C: 7.5, central: 0 }
    },
    {
      id: 'F3-CP-06',
      title: 'AO6 + R4: Produccion valida al limite con alertas en A y C (Q=1)',
      initial: { stockA: 0.5, stockB: 5.2, stockC: 0.1 },
      q: '1',
      shouldSucceed: true,
      expected: { A: 0, B: 5, C: 0, central: 1 },
      expectedAlerts: ['Aloe vera', 'Romero']
    },
    {
      id: 'F3-CP-07',
      title: 'AO7 + R2: Rechazo atomico por insuficiencia de A y B (Q=10)',
      initial: { stockA: 4.95, stockB: 1.95, stockC: 1 },
      q: '10',
      shouldSucceed: false,
      expected: { A: 4.95, B: 1.95, C: 1, central: 0 }
    },
    {
      id: 'F3-CP-08',
      title: 'AO8 + R2: Rechazo atomico por insuficiencia de A y C (Q=25)',
      initial: { stockA: 12.45, stockB: 10, stockC: 2.45 },
      q: '25',
      shouldSucceed: false,
      expected: { A: 12.45, B: 10, C: 2.45, central: 0 }
    },
    {
      id: 'F3-CP-09',
      title: 'AO9 + R2: Rechazo atomico por insuficiencia de A (Q=1)',
      initial: { stockA: 0.45, stockB: 0.2, stockC: 5.1 },
      q: '1',
      shouldSucceed: false,
      expected: { A: 0.45, B: 0.2, C: 5.1, central: 0 }
    }
  ];

  for (const tc of aoCases) {
    test(`${tc.id} - ${tc.title}`, async ({ produccionPage, dashboardPage }) => {
      await resetBaseline({ ...tc.initial, invCentral: 0 });
      await produccionPage.goto();

      const resp = await produccionPage.registrarProduccion('Champú vegano', tc.q, `Lote ${tc.id}`);

      if (tc.shouldSucceed) {
        expect(resp.status()).toBe(201);
        await expect(produccionPage.errorBanner).toHaveCount(0);
        await expect(produccionPage.firstRow).toContainText(`Lote ${tc.id}`);
      } else {
        expect(resp.status()).toBe(400);
        await expect(produccionPage.errorBanner).toContainText('Stock insuficiente');
      }

      const snap = await getStocksSnapshot();
      expect(snap.materias['Aloe vera']).toBeCloseTo(tc.expected.A, 3);
      expect(snap.materias['Aceite de coco']).toBeCloseTo(tc.expected.B, 3);
      expect(snap.materias['Romero']).toBeCloseTo(tc.expected.C, 3);
      expect(snap.central['Champú vegano']).toBe(tc.expected.central);

      if (tc.shouldSucceed) {
        await dashboardPage.goto();
        if (tc.expectedAlerts.length === 0) {
          await expect(dashboardPage.alertaMateriaPanel).toContainText('Sin alertas');
        } else {
          for (const ing of tc.expectedAlerts) {
            await expect(dashboardPage.alertaMateriaPanel).toContainText(ing);
          }
        }
      }
    });
  }

  const invalidQuantityCases = [
    { id: 'F3-CP-10', title: 'TD R1: Rechazo por cantidad cero (Q=0)', q: '0' },
    { id: 'F3-CP-11', title: 'TD R1: Rechazo por cantidad negativa (Q=-5)', q: '-5' },
    { id: 'F3-CP-12', title: 'TD R1: Rechazo por cantidad decimal (Q=2.5)', q: '2.5' }
  ];

  for (const tc of invalidQuantityCases) {
    test(`${tc.id} - ${tc.title}`, async ({ produccionPage }) => {
      await resetBaseline({ stockA: 10, stockB: 7, stockC: 6, invCentral: 0 });
      await produccionPage.goto();

      const { isHtml5Valid, apiCalled } = await produccionPage.intentarEnviarCantidadInvalida('Champú vegano', tc.q);

      expect(isHtml5Valid).toBe(false);
      expect(apiCalled).toBe(false);

      const snap = await getStocksSnapshot();
      expect(snap.materias['Aloe vera']).toBe(10);
      expect(snap.central['Champú vegano']).toBe(0);
    });
  }
});
