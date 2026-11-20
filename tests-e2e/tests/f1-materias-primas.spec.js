import { test, expect } from '../fixtures/test.fixture.js';
import { resetBaseline, getStocksSnapshot } from '../helpers/db.js';

test.describe('F1 - Gestion de Materia Prima (TD + VL)', () => {
  test.beforeEach(async ({ mpPage }, testInfo) => {
    if (testInfo.title.includes('F1-CP-01')) {
      await resetBaseline({ includeAceite: false, includeFormula: false });
    } else {
      await resetBaseline();
    }
    await mpPage.goto();
  });

  test('F1-CP-01 - Alta valida de materia prima (Aceite de coco, lt, 20)', async ({ mpPage }) => {
    const resp = await mpPage.crearMateriaPrima({
      nombre: 'Aceite de coco',
      unidad: 'lt',
      cantidad: '20'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(201);
    await expect(mpPage.tableBody).toContainText('Aceite de coco');

    const snap = await getStocksSnapshot();
    expect(snap.materias['Aceite de coco']).toBe(20);
  });

  test('F1-CP-02 - Rechazo por nombre duplicado exacto ("Aloe vera")', async ({ mpPage }) => {
    const resp = await mpPage.crearMateriaPrima({
      nombre: 'Aloe vera',
      unidad: 'kg',
      cantidad: '5'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(409);
    await expect(mpPage.errorBanner).toContainText('Registro duplicado');
  });

  test('F1-CP-03 - Regresion DEF-01: Rechazo de duplicado con minusculas y espacio ("aloe vera ")', async ({ mpPage }) => {
    const resp = await mpPage.crearMateriaPrima({
      nombre: 'aloe vera ',
      unidad: 'kg',
      cantidad: '5'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(409);
    await expect(mpPage.errorBanner).toContainText('Registro duplicado');
  });

  test('F1-CP-04 - Valor limite superior exacto permitido (Glicerina, 50 kg)', async ({ mpPage }) => {
    const resp = await mpPage.crearMateriaPrima({
      nombre: 'Glicerina',
      unidad: 'kg',
      cantidad: '50'
    });

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(201);
    await expect(mpPage.tableBody).toContainText('Glicerina');

    const snap = await getStocksSnapshot();
    expect(snap.materias['Glicerina']).toBe(50);
  });

  test('F1-CP-05 - Valor limite sobre el tope maximo RN-04 (Glicerina, 50.01 kg)', async ({ mpPage }) => {
    const resp = await mpPage.crearMateriaPrima({
      nombre: 'Glicerina',
      unidad: 'kg',
      cantidad: '50.01'
    });

    if (resp !== null) {
      expect(resp.status(), 'RN-04 violada: API acepto cantidad 50.01 > 50').toBeGreaterThanOrEqual(400);
    }
    const snap = await getStocksSnapshot();
    expect(snap.materias['Glicerina']).toBeUndefined();
  });

  test('F1-CP-06 - Rechazo de cantidad negativa (-1 kg)', async ({ mpPage }) => {
    const resp = await mpPage.crearMateriaPrima({
      nombre: 'Glicerina',
      unidad: 'kg',
      cantidad: '-1'
    });

    if (resp !== null) {
      expect(resp.status()).toBeGreaterThanOrEqual(400);
    }
    const snap = await getStocksSnapshot();
    expect(snap.materias['Glicerina']).toBeUndefined();
  });
});
