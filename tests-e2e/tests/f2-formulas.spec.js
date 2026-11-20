import { test, expect } from '@playwright/test';
import { resetBaseline, pool } from '../helpers/db.js';
import { ProductosPage } from '../pages/ProductosPage.js';

test.describe('F2 - Creacion de Formulas (TD)', () => {
  test('F2-CP-01 - Formula valida con multiples materias primas (Aloe 0.5 + Aceite 0.2)', async ({ page }) => {
    const { prodId, mpAId, mpBId } = await resetBaseline({ includeFormula: false });
    const prodPage = new ProductosPage(page);
    await prodPage.goto();

    await prodPage.abrirConfiguracionFormula('Champú vegano');
    await expect(prodPage.panelTitle).toContainText(`Formula del producto #${prodId}`);

    await prodPage.agregarIngredientes([
      { materiaId: mpAId, cantidad: 0.5 },
      { materiaId: mpBId, cantidad: 0.2 }
    ]);

    const { resp, dialogMessage } = await prodPage.guardarFormulaEsperandoDialogo(prodId);

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
    const prodPage = new ProductosPage(page);
    await prodPage.goto();

    await prodPage.abrirConfiguracionFormula('Champú vegano');
    const { resp, dialogMessage } = await prodPage.guardarFormula(prodId);

    // Segun RN-08, NO debe permitir guardar una formula vacia
    if (resp !== null) {
      expect(resp.status(), 'RN-08 violada: el sistema acepto HTTP 200 al guardar una formula vacia').toBeGreaterThanOrEqual(400);
    }
    expect(dialogMessage, 'RN-08 violada: el sistema mostro alerta de exito al guardar formula vacia').not.toContain('Formula guardada');
    await expect(prodPage.errorBanner).toBeVisible();
  });

  test('F2-CP-03 - Rechazo por materia prima repetida en la misma formula (RN-14)', async ({ page }) => {
    const { prodId, mpAId } = await resetBaseline({ includeFormula: false });
    const prodPage = new ProductosPage(page);
    await prodPage.goto();

    await prodPage.abrirConfiguracionFormula('Champú vegano');
    await prodPage.agregarIngredientes([
      { materiaId: mpAId, cantidad: 0.5 },
      { materiaId: mpAId, cantidad: 0.3 }
    ]);

    const { resp } = await prodPage.guardarFormula(prodId);

    expect(resp).not.toBeNull();
    expect(resp.status()).toBe(409);
    await expect(prodPage.errorBanner).toContainText('Registro duplicado');
  });

  test('F2-CP-04 - Rechazo por cantidad requerida en 0 (RN-08)', async ({ page }) => {
    const { prodId, mpAId } = await resetBaseline({ includeFormula: false });
    const prodPage = new ProductosPage(page);
    await prodPage.goto();

    await prodPage.abrirConfiguracionFormula('Champú vegano');
    await prodPage.agregarIngredientes([{ materiaId: mpAId, cantidad: 0 }]);

    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/formula') && req.method() === 'PUT') apiCalled = true;
    });

    await prodPage.guardarFormulaBtn.click();

    await expect(prodPage.errorBanner).toContainText('Todas las cantidades deben ser mayores a cero');
    expect(apiCalled).toBe(false);
  });
});
