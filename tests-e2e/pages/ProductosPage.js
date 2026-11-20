import { BasePage } from './BasePage.js';

export class ProductosPage extends BasePage {
  constructor(page) {
    super(page, '/productos');
    this.panelTitle = page.locator('h3');
    this.agregarMateriaBtn = page.getByRole('button', { name: 'Agregar Materia Prima' });
    this.guardarFormulaBtn = page.getByRole('button', { name: 'Guardar Formula' });
    this.formulaRows = page.locator('.formula-row');
    this.errorBanner = page.locator('.error-msg');
  }

  async abrirConfiguracionFormula(nombreProducto) {
    const configBtn = this.page
      .locator('tr', { hasText: nombreProducto })
      .getByRole('button', { name: 'Configurar' });
    await this.click(configBtn);
  }

  async agregarIngredientes(ingredientes) {
    for (let i = 0; i < ingredientes.length; i++) {
      await this.click(this.agregarMateriaBtn);
      const row = this.formulaRows.nth(i);
      await row.locator('select').selectOption(String(ingredientes[i].materiaId));
      await this.fill(row.locator('input[type="number"]'), ingredientes[i].cantidad);
    }
  }

  async guardarFormulaEsperandoDialogo(prodId) {
    const dialogPromise = this.page.waitForEvent('dialog');
    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes(`/api/productos/${prodId}/formula`) && res.request().method() === 'PUT'
    );
    await this.click(this.guardarFormulaBtn);
    const [resp, dialog] = await Promise.all([respPromise, dialogPromise]);
    const dialogMessage = dialog.message();
    await dialog.accept();
    return { resp, dialogMessage };
  }

  async guardarFormula(prodId) {
    let dialogMessage = '';
    this.page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    const respPromise = this.page
      .waitForResponse(
        (res) => res.url().includes(`/api/productos/${prodId}/formula`) && res.request().method() === 'PUT',
        { timeout: 4000 }
      )
      .catch(() => null);

    await this.click(this.guardarFormulaBtn);
    const resp = await respPromise;
    return { resp, dialogMessage };
  }
}
