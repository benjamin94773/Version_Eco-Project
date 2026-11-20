export class ProductosPage {
  constructor(page) {
    this.page = page;
    this.panelTitle = page.locator('h3');
    this.agregarMateriaBtn = page.getByRole('button', { name: 'Agregar Materia Prima' });
    this.guardarFormulaBtn = page.getByRole('button', { name: 'Guardar Formula' });
    this.formulaRows = page.locator('.formula-row');
    this.errorBanner = page.locator('.error-msg');
  }

  async goto() {
    await this.page.goto('/productos');
  }

  async abrirConfiguracionFormula(nombreProducto) {
    await this.page
      .locator('tr', { hasText: nombreProducto })
      .getByRole('button', { name: 'Configurar' })
      .click();
  }

  async agregarIngredientes(ingredientes) {
    for (let i = 0; i < ingredientes.length; i++) {
      await this.agregarMateriaBtn.click();
      const row = this.formulaRows.nth(i);
      await row.locator('select').selectOption(String(ingredientes[i].materiaId));
      await row.locator('input[type="number"]').fill(String(ingredientes[i].cantidad));
    }
  }

  async guardarFormulaEsperandoDialogo(prodId) {
    const dialogPromise = this.page.waitForEvent('dialog');
    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes(`/api/productos/${prodId}/formula`) && res.request().method() === 'PUT'
    );
    await this.guardarFormulaBtn.click();
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

    await this.guardarFormulaBtn.click();
    const resp = await respPromise;
    return { resp, dialogMessage };
  }
}
