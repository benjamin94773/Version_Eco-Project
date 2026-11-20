import { BasePage } from './BasePage.js';

export class MateriasPrimasPage extends BasePage {
  constructor(page) {
    super(page, '/materias-primas');
    this.nuevaMateriaBtn = page.getByRole('button', { name: 'Nueva Materia Prima' });
    this.nombreInput = page.locator('form input[placeholder*="Aloe Vera"]');
    this.unidadSelect = page.locator('form select');
    this.cantidadInput = page.locator('form input[placeholder*="100"]');
    this.minimoInput = page.locator('form input[placeholder*="20"]');
    this.crearBtn = page.getByRole('button', { name: 'Crear Materia Prima' });
    this.tableBody = page.locator('table tbody');
    this.errorBanner = page.locator('.error-msg');
  }

  async crearMateriaPrima({ nombre, unidad = 'kg', cantidad, minimo = '1' }) {
    await this.click(this.nuevaMateriaBtn);
    await this.fill(this.nombreInput, nombre);
    await this.unidadSelect.selectOption(unidad);
    await this.fill(this.cantidadInput, cantidad);
    await this.fill(this.minimoInput, minimo);

    const respPromise = this.page
      .waitForResponse(
        (res) => res.url().includes('/api/materias-primas') && res.request().method() === 'POST',
        { timeout: 5000 }
      )
      .catch(() => null);

    await this.click(this.crearBtn);
    return await respPromise;
  }
}
