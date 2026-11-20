export class MateriasPrimasPage {
  constructor(page) {
    this.page = page;
    this.nuevaMateriaBtn = page.getByRole('button', { name: 'Nueva Materia Prima' });
    this.nombreInput = page.locator('form input[placeholder*="Aloe Vera"]');
    this.unidadSelect = page.locator('form select');
    this.cantidadInput = page.locator('form input[placeholder*="100"]');
    this.minimoInput = page.locator('form input[placeholder*="20"]');
    this.crearBtn = page.getByRole('button', { name: 'Crear Materia Prima' });
    this.tableBody = page.locator('table tbody');
    this.errorBanner = page.locator('.error-msg');
  }

  async goto() {
    await this.page.goto('/materias-primas');
  }

  async crearMateriaPrima({ nombre, unidad = 'kg', cantidad, minimo = '1' }) {
    await this.nuevaMateriaBtn.click();
    await this.nombreInput.fill(nombre);
    await this.unidadSelect.selectOption(unidad);
    await this.cantidadInput.fill(String(cantidad));
    await this.minimoInput.fill(String(minimo));

    const respPromise = this.page
      .waitForResponse(
        (res) => res.url().includes('/api/materias-primas') && res.request().method() === 'POST',
        { timeout: 5000 }
      )
      .catch(() => null);

    await this.crearBtn.click();
    return await respPromise;
  }
}
