import { test, expect } from '../fixtures/test.fixture.js';
import { resetBaseline, pool } from '../helpers/db.js';

test.describe('F2 - Creacion de Formulas (TD)', () => {
  let baseline;

  test.beforeEach(async ({ productosPage }) => {
    baseline = await resetBaseline({ includeFormula: false });
    await productosPage.goto();
    await productosPage.abrirConfiguracionFormula('Champú vegano');
  });

  test('F2-CP-01 - Formula valida con multiples materias primas (Aloe 0.5 + Aceite 0.2)', async ({ productosPage }) => {
    await expect(productosPage.panelTitle).toContainText(`Formula del producto #${baseline.prodId}`);

    await productosPage.agregarIngredientes([
      { materiaId: baseline.mpAId, cantidad: 0.5 },
      { materiaId: baseline.mpBId, cantidad: 0.2 }
    ]);

    const { resp, dialogMessage } = await productosPage.guardarFormulaEsperandoDialogo(baseline.prodId);

    expect(resp.status()).toBe(200);
    expect(dialogMessage).toContain('Formula guardada');

    const dbRes = await pool.query(
      'SELECT materia_prima_id, cantidad_requerida::float AS cant FROM detalle_formula WHERE producto_id = $1 ORDER BY materia_prima_id',
      [baseline.prodId]
    );
    expect(dbRes.rowCount).toBe(2);
  });

  test('F2-CP-02 - Rechazo al guardar formula sin materias primas (RN-08)', async ({ productosPage }) => {
    const { resp, dialogMessage } = await productosPage.guardarFormula(baseline.prodId);

    if (resp !== null) {
      expect(resp.status(), 'RN-08 violada: el sistema acepto HTTP 200 al guardar una formula vacia').toBeGreaterThanOrEqual(400);
    }
    expect(dialogMessage, 'RN-08 violada: el sistema mostro alerta de exito al guardar formula vacia').not.toContain('Formula guardada');
    await expect(productosPage.errorBanner).toBeVisible();
  });

  test('F2-CP-03 - Rechazo por materia prima repetida en la misma formula (RN-14)', async ({ productosPage }) => {
    await productosPage.agregarIngredientes([
      { materiaId: baseline.mpAId, cantidad: 0.5 },
      { materiaId: baseline.mpAId, cantidad: 0.3 }
    ]);

    const { resp } = await productosPage.guardarFormula(baseline.prodId);

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(409);
    await expect(productosPage.errorBanner).toContainText('Registro duplicado');
  });

  test('F2-CP-04 - Rechazo por cantidad requerida en 0 (RN-08)', async ({ productosPage, page }) => {
    await productosPage.agregarIngredientes([{ materiaId: baseline.mpAId, cantidad: 0 }]);

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/formula') && req.method() === 'PUT') apiCalled = true;
    });

    await productosPage.click(productosPage.guardarFormulaBtn);

    await expect(productosPage.errorBanner).toContainText('Todas las cantidades deben ser mayores a cero');
    expect(apiCalled).toBe(false);
  });
});
